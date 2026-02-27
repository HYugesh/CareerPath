import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Quiz() {
  const { id: assessmentId, roadmapId, moduleId, subComponentId } = useParams();
  const navigate = useNavigate();
  
  // Detect mode: sub-topic, roadmap module, or standalone
  const isSubTopicMode = Boolean(roadmapId && moduleId && subComponentId);
  const isRoadmapMode = Boolean(roadmapId && moduleId && !subComponentId);
  
  console.log('Quiz Mode:', isSubTopicMode ? 'SUB-TOPIC' : isRoadmapMode ? 'ROADMAP' : 'STANDALONE');
  console.log('Params:', { assessmentId, roadmapId, moduleId, subComponentId });
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  // Desktop: open by default, Mobile: closed by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        let res;
        if (isSubTopicMode || isRoadmapMode) {
          // Roadmap or sub-topic mode: fetch quiz session
          res = await axios.get(`/roadmaps/quiz-session/${assessmentId}`);
          // Backend returns { success: true, data: {...} }
          if (res.data.success && res.data.data) {
            setSession(res.data.data);
          } else {
            setSession(res.data);
          }
        } else {
          // Standalone mode: existing logic
          res = await axios.get(`/assessment/${assessmentId}`);
          setSession(res.data);
        }
        
        const sessionData = (isSubTopicMode || isRoadmapMode) ? (res.data.data || res.data) : res.data;
        const difficulty = sessionData.difficulty?.toLowerCase() || 'medium';
        const isEasierLevel = difficulty === 'beginner' || difficulty === 'easy';
        // Sub-topic quiz: 5 minutes, Module quiz: 10 minutes, Standalone: 10-15 minutes
        const timeInMinutes = isSubTopicMode ? 5 : isRoadmapMode ? 10 : (isEasierLevel ? 10 : 15);
        setTimeLeft(timeInMinutes * 60);

        setQuestionStatus(new Array(sessionData.questions.length).fill('unattempted'));
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load the quiz. It might be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [assessmentId, isSubTopicMode, isRoadmapMode]);

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([qIndex, selectedAnswer]) => {
        const question = session.questions[parseInt(qIndex)];
        return {
          questionId: question._id,
          qNo: parseInt(qIndex) + 1,
          selectedOption: selectedAnswer,
        };
      });

      let res;
      if (isSubTopicMode) {
        // Sub-topic mode: submit to sub-topic endpoint
        res = await axios.post(
          `/roadmaps/${roadmapId}/modules/${moduleId}/subtopics/${subComponentId}/quiz/${assessmentId}/submit`,
          { answers: formattedAnswers }
        );
      } else if (isRoadmapMode) {
        // Roadmap module mode: submit to roadmap endpoint
        res = await axios.post(
          `/roadmaps/${roadmapId}/modules/${moduleId}/quiz/${assessmentId}/submit`,
          { answers: formattedAnswers }
        );
      } else {
        // Standalone mode: existing logic
        res = await axios.post(
          `/assessment/${assessmentId}/submit`,
          { answers: formattedAnswers }
        );
      }

      // Exit fullscreen before navigating
      await exitFullscreen();

      if (isSubTopicMode) {
        // Navigate back to module detail page with success message
        navigate(`/roadmap/${roadmapId}/module/${moduleId}`, {
          state: { 
            quizCompleted: true,
            subComponentId: subComponentId,
            score: res.data.data?.score,
            passed: res.data.data?.passed
          }
        });
      } else if (isRoadmapMode) {
        // Navigate back to roadmap with success message
        navigate(`/roadmap/${roadmapId}`, {
          state: { 
            quizCompleted: true,
            moduleId: moduleId,
            score: res.data.data?.score,
            passed: res.data.data?.passed
          }
        });
      } else {
        // Navigate to results page
        navigate(`/assessment/results/${assessmentId}`, {
          state: { results: res.data },
        });
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'There was an error submitting your quiz.';
      setError(errorMessage);
      console.error('Submission Error:', err);
      console.error('Error details:', err.response?.data);
      setIsSubmitting(false);
      setShowSubmitModal(false);
      // Stop the timer by setting timeLeft to a positive value
      setTimeLeft(60);
    }
  }, [assessmentId, answers, navigate, isSubmitting, isSubTopicMode, isRoadmapMode, roadmapId, moduleId, subComponentId, session]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && !loading && !isSubmitting && !error) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitting, error, handleSubmit]);

  const handleAnswerSelect = useCallback((questionIndex, selectedOption) => {
    setAnswers(prevAnswers => ({ ...prevAnswers, [questionIndex]: selectedOption }));

    setQuestionStatus(prevStatus => {
      const newStatus = [...prevStatus];
      newStatus[questionIndex] = 'answered';
      return newStatus;
    });
  }, []);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    if (session && currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    </div>
  );

  if (!session || !session.questions) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md">
        <p className="text-xl text-gray-600">Could not find quiz session.</p>
      </div>
    </div>
  );

  const currentQuestion = session.questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = questionStatus.filter(status => status === 'answered').length;
  const unattemptedCount = questionStatus.length - answeredCount;

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-40 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-bold text-blue-500">AI</span>
          <span className="text-lg md:text-xl font-bold text-white">Learning</span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white font-semibold shadow-sm text-sm md:text-base ${timeLeft < 60 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
          }`}>
          <Clock className="w-3 h-3 md:w-4 md:h-4" />
          <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>

        {/* Submit Button - Only show in standalone mode */}
        {!isRoadmapMode && !isSubTopicMode && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:block px-4 md:px-6 py-1.5 md:py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm md:text-base"
          >
            Submit Assessment
          </button>
        )}
        
        {/* Roadmap/Sub-topic mode: Show quiz info instead */}
        {(isRoadmapMode || isSubTopicMode) && (
          <div className="text-xs md:text-sm text-gray-400">
            {isSubTopicMode ? 'Sub-Topic Quiz' : 'Module Quiz'}
          </div>
        )}
      </header>

      <div className="flex pt-12 md:pt-16">
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Floating Open Button - Shows when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-0 top-24 md:top-28 z-30 p-2 rounded-r-lg bg-gray-900/80 hover:bg-gray-800/90 text-gray-400 hover:text-white border border-l-0 border-gray-700 transition-all duration-300"
            title="Open question navigator"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Unified Sidebar - Works on all screen sizes */}
        <aside className={`fixed left-0 top-12 md:top-16 bottom-0 bg-gray-900 border-r border-gray-800 overflow-y-auto custom-scrollbar transition-all duration-300 z-50 ${
          isSidebarOpen ? 'translate-x-0 w-64 md:w-56 lg:w-64 p-4' : '-translate-x-full'
        }`}>
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 right-2 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors z-10"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSidebarOpen && (
            <>
              {/* Assessment Info */}
              <div className="mb-6 pb-4 border-b border-gray-800 mt-10">
                <h2 className="font-bold text-white text-sm">
                  {session.domain} - {session.difficulty}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Assessment</p>
              </div>

              {/* Question Navigator - Inline */}
              <div>
                {/* Questions Section */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-300 text-xs">Questions</h3>
                    <span className="text-[10px] text-gray-500">{session.questions.length} total</span>
                  </div>
                  
                  {/* Question Grid */}
                  <div className={`grid gap-0.5 p-1 ${
                    session.questions.length <= 5 ? 'grid-cols-5' :
                    session.questions.length <= 10 ? 'grid-cols-5' :
                    session.questions.length <= 15 ? 'grid-cols-6' :
                    session.questions.length <= 20 ? 'grid-cols-7' :
                    session.questions.length <= 30 ? 'grid-cols-8' :
                    session.questions.length <= 40 ? 'grid-cols-9' :
                    session.questions.length <= 50 ? 'grid-cols-10' : 'grid-cols-12'
                  }`}>
                    {questionStatus.map((status, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          // Auto-close on mobile after selection
                          if (window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`
                          relative rounded-md text-[11px] font-bold
                          flex items-center justify-center transition-all duration-200
                          h-9 w-9
                          ${index === currentQuestionIndex
                            ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 scale-105 z-10'
                            : 'hover:scale-105'
                          }
                          ${status === 'answered'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                          }
                        `}
                        title={`Question ${index + 1}${status === 'answered' ? ' (Answered)' : ' (Not Attempted)'}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="text-[11px] bg-gray-800/20 rounded-md p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    <span className="text-gray-400">Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
                    <span className="text-gray-400">Not Attempted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-blue-400 rounded-sm"></div>
                    <span className="text-gray-400">Current</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Content - Adjusts margin on desktop when sidebar is open */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : ''
        }`}>
          <div className="max-w-3xl mx-auto">
            {/* Question */}
            {currentQuestion && (
              <div className="mb-6 md:mb-8">
                {/* Question Number Badge - Mobile */}
                <div className="md:hidden mb-4 flex items-center justify-between">
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">
                    Question {currentQuestionIndex + 1} of {session.questions.length}
                  </span>
                  <span className="text-xs text-gray-500">
                    {session.domain} - {session.difficulty}
                  </span>
                </div>

                <p className="text-white text-lg md:text-xl mb-3 md:mb-4 font-medium leading-relaxed">{currentQuestion.questionText}</p>
                <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6 uppercase tracking-wider font-semibold">Choose the Correct Option:</p>

                {/* Options */}
                <div className="space-y-3 md:space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 md:p-5 rounded-xl border cursor-pointer transition-all group ${answers[currentQuestionIndex] === option
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                        }`}
                    >
                      <div className={`relative flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full border ${answers[currentQuestionIndex] === option ? 'border-blue-500' : 'border-gray-500 group-hover:border-gray-400'} mr-3 md:mr-4 shrink-0`}>
                        {answers[currentQuestionIndex] === option && (
                          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value={option}
                        checked={answers[currentQuestionIndex] === option}
                        onChange={() => handleAnswerSelect(currentQuestionIndex, option)}
                        className="hidden"
                      />
                      <span className={`text-base md:text-lg ${answers[currentQuestionIndex] === option ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 md:pt-8 border-t border-gray-800 gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 border border-gray-700 rounded-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                Previous
              </button>

              <span className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap px-1">
                Question <span className="text-white">{currentQuestionIndex + 1}</span> of <span className="text-white">{session.questions.length}</span>
              </span>

              {/* Show Submit button on last question, Next button otherwise */}
              {currentQuestionIndex === session.questions.length - 1 ? (
                <button
                  onClick={() => {
                    if (isRoadmapMode || isSubTopicMode) {
                      // Roadmap/Sub-topic mode: Submit directly without modal
                      handleSubmit();
                    } else {
                      // Standalone mode: Show confirmation modal
                      setShowSubmitModal(true);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm md:text-base"
                >
                  Next
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Submit Modal - Only show in standalone mode */}
      {showSubmitModal && !isRoadmapMode && !isSubTopicMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">Submit Assessment</h2>
                <p className="text-sm text-gray-400 mt-1">Please review your progress</p>
              </div>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setConfirmSubmit(false);
                }}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Progress Summary */}
              <h3 className="font-semibold text-gray-200 mb-4">Progress Summary</h3>
              <div className="flex justify-around mb-6 bg-gray-800/50 p-4 rounded-xl">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Attempted
                  </div>
                  <p className="text-3xl font-bold text-white">{answeredCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-1">
                    <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                    Unattempted
                  </div>
                  <p className="text-3xl font-bold text-gray-500">{unattemptedCount}</p>
                </div>
              </div>

              {/* Section Overview */}
              <h3 className="font-semibold text-gray-200 mb-3">Section Overview</h3>
              <div className="border border-gray-700 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-400">Section</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-400">Attempted</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-400">Unattempted</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-gray-300">Multiple Choice Questions</td>
                      <td className="text-center px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-green-400 font-medium">
                          {answeredCount}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3 text-gray-500">{unattemptedCount}</td>
                      <td className="text-center px-4 py-3 font-medium text-white">{session.questions.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer mb-6 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmSubmit}
                  onChange={(e) => setConfirmSubmit(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-600 rounded bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300">I confirm that I want to submit my assessment now</span>
              </label>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!confirmSubmit || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${confirmSubmit && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}