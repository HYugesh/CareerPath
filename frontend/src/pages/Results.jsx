import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Enhanced question section component with dark theme styling
const QuestionSection = ({ title, questions, status }) => {
  if (!questions || questions.length === 0) return null;

  // Define section colors based on status for dark theme
  const sectionColors = {
    Incorrect: {
      border: 'border-red-900',
      bg: 'bg-red-900/10',
      headerBg: 'bg-red-900/30',
      iconColor: 'text-red-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    Unattempted: {
      border: 'border-amber-900',
      bg: 'bg-amber-900/10',
      headerBg: 'bg-amber-900/30',
      iconColor: 'text-amber-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    Correct: {
      border: 'border-emerald-900',
      bg: 'bg-emerald-900/10',
      headerBg: 'bg-emerald-900/30',
      iconColor: 'text-emerald-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  };

  const { border, bg, headerBg, icon } = sectionColors[status];

  return (
    <div className={`mb-10 ${bg} rounded-xl border ${border} overflow-hidden`}>
      <h3 className={`text-xl font-bold p-5 flex items-center text-white ${headerBg}`}>
        {icon}
        {title} ({questions.length})
      </h3>
      <div className="p-5 space-y-5">
        {questions.map((q, index) => (
          <div key={index} className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-sm">
            <p className="font-semibold text-lg mb-4 text-white">{q.qNo}. {q.questionText}</p>
            <div className="space-y-3">
              {q.options.map((option, oIndex) => {
                const isCorrect = option === q.correctAnswer;
                const isUserChoice = option === q.userAnswer;

                let style = 'border-gray-700 bg-gray-800 text-gray-400';
                let icon = null;

                if (isCorrect) {
                  style = 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400 font-semibold';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  );
                }

                if (isUserChoice && !isCorrect) {
                  style = 'border-red-500/50 bg-red-900/20 text-red-400 font-semibold';
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  );
                }

                return (
                  <div key={oIndex} className={`flex items-center p-4 border rounded-lg ${style}`}>
                    <span className="flex-grow">{option}</span>
                    {icon}
                  </div>
                );
              })}

              {status === 'Unattempted' && (
                <div className="flex items-center mt-3 text-sm text-amber-400 bg-amber-900/20 p-3 rounded-lg border border-amber-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You did not attempt this question. The correct answer is highlighted in green.
                </div>
              )}

              {status === 'Incorrect' && (
                <div className="flex items-center mt-3 text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your answer was incorrect. The correct answer is highlighted in green.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Upskilling Summary Component with dark theme
const UpskillingSummary = ({ results, summary }) => {
  if (!summary) return null;

  const getPerformanceFeedback = () => {
    const { scorePercentage } = summary;
    if (scorePercentage >= 80) {
      return "Excellent performance! You've demonstrated strong knowledge in this domain.";
    } else if (scorePercentage >= 60) {
      return "Good job! You have a solid understanding, but there's room for improvement.";
    } else if (scorePercentage >= 40) {
      return "You're on the right track, but need more practice to strengthen your knowledge.";
    } else {
      return "This topic needs more attention. Consider reviewing the fundamentals.";
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-10 shadow-lg">
      <h3 className="text-xl font-bold mb-6 pb-3 border-b border-blue-500/30 flex items-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Upskilling Recommendations
      </h3>

      <p className="mb-6 text-blue-300 font-medium">{getPerformanceFeedback()}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Areas to Focus On */}
        {results.upskillAreas && results.upskillAreas.length > 0 && (
          <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-6">
            <h4 className="font-bold text-orange-400 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Areas to Focus On
            </h4>
            <ul className="space-y-2">
              {results.upskillAreas.map((area, index) => (
                <li key={index} className="text-gray-300 flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Your Strengths */}
        {results.strengths && results.strengths.length > 0 && (
          <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-6">
            <h4 className="font-bold text-emerald-400 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your Strengths
            </h4>
            <ul className="space-y-2">
              {results.strengths.map((strength, index) => (
                <li key={index} className="text-gray-300 flex items-start">
                  <span className="text-emerald-500 mr-2">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Learning Recommendations */}
      {results.recommendations && (
        <div className="mt-6 bg-blue-900/10 border border-blue-900/30 rounded-xl p-6">
          <h4 className="font-bold text-blue-400 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Next Steps for Learning
          </h4>
          <p className="text-gray-300 leading-relaxed">{results.recommendations}</p>
        </div>
      )}

      {/* Fallback for when AI data is not available */}
      {(!results.upskillAreas || results.upskillAreas.length === 0) &&
        (!results.strengths || results.strengths.length === 0) &&
        !results.recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-5">
              <h5 className="font-semibold text-emerald-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Strengths
              </h5>
              <p className="text-gray-400 text-sm">
                You answered {summary.correctCount} questions correctly. Keep building on these strengths!
              </p>
            </div>

            <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-5">
              <h5 className="font-semibold text-red-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Areas for Improvement
              </h5>
              <p className="text-gray-400 text-sm">
                You missed {summary.incorrectCount} questions. Review these topics to improve your understanding.
              </p>
            </div>

            <div className="bg-amber-900/10 border border-amber-900/30 rounded-xl p-5">
              <h5 className="font-semibold text-amber-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Time Management
              </h5>
              <p className="text-gray-400 text-sm">
                You left {summary.unattemptedCount} questions unanswered. Consider practicing under time pressure.
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default function Results() {
  const { id: assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!results) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/assessment/${assessmentId}`);
          setResults(res.data);
        } catch (err) {
          setError('Failed to load assessment results.');
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [assessmentId, results]);

  // Processes and groups the questions into the required sections
  const { incorrectQs, unattemptedQs, correctQs, summary } = useMemo(() => {
    if (!results || !results.questions) {
      return { incorrectQs: [], unattemptedQs: [], correctQs: [], summary: {} };
    }

    const questionsList = results.questions;
    const userAnswersList = results.userAnswers ?? [];

    const incorrect = [];
    const unattempted = [];
    const correct = [];

    questionsList.forEach((question, index) => {
      const userAnswerObj = userAnswersList.find(a => a.qNo === (index + 1));
      const fullQuestionData = {
        ...question,
        qNo: index + 1,
        userAnswer: userAnswerObj ? userAnswerObj.selectedOption : null,
      };

      if (!userAnswerObj) {
        unattempted.push(fullQuestionData);
      } else if (userAnswerObj.selectedOption === question.correctAnswer) {
        correct.push(fullQuestionData);
      } else {
        incorrect.push(fullQuestionData);
      }
    });

    const totalQuestions = questionsList.length;
    const correctCount = correct.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    return {
      incorrectQs: incorrect,
      unattemptedQs: unattempted,
      correctQs: correct,
      summary: {
        totalQuestions,
        scorePercentage,
        correctCount: correctCount,
        incorrectCount: incorrect.length,
        unattemptedCount: unattempted.length
      }
    };
  }, [results]);

  if (loading) return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    </div>
  );

  if (!results) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md">
        <p className="text-xl text-gray-600">Could not find results data.</p>
      </div>
    </div>
  );

  // Determine score color
  const getScoreColor = () => {
    if (summary.scorePercentage >= 70) return '#10B981'; // Emerald
    if (summary.scorePercentage >= 40) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
      <div className="max-w-4xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-white">
          Assessment Results
        </h2>

        {/* Score summary card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-lg">
          <div className="w-40 h-40 flex-shrink-0">
            <CircularProgressbar
              value={summary.scorePercentage}
              text={`${summary.scorePercentage}%`}
              styles={buildStyles({
                textColor: '#fff',
                textSize: '20px',
                pathColor: getScoreColor(),
                trailColor: '#374151',
                backgroundColor: '#111827',
                pathTransitionDuration: 0.5
              })}
            />
          </div>
          <div className='text-center md:text-left flex-grow'>
            <h3 className="text-2xl font-bold text-white">Your Score: {summary.correctCount} / {summary.totalQuestions}</h3>
            <div className="flex flex-wrap gap-3 mt-5 justify-center md:justify-start">
              <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-4 py-2 rounded-full flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Correct: {summary.correctCount}
              </span>
              <span className="bg-red-900/30 text-red-400 border border-red-900 px-4 py-2 rounded-full flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Incorrect: {summary.incorrectCount}
              </span>
              <span className="bg-amber-900/30 text-amber-400 border border-amber-900 px-4 py-2 rounded-full flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Unattempted: {summary.unattemptedCount}
              </span>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/assessment')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition-colors font-medium flex items-center shadow-lg shadow-blue-900/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Try Another Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Upskilling recommendations */}
        <UpskillingSummary results={results} summary={summary} />

        {/* Question sections in the specified order */}
        <QuestionSection title="Incorrect Questions" questions={incorrectQs} status="Incorrect" />
        <QuestionSection title="Unattempted Questions" questions={unattemptedQs} status="Unattempted" />
        <QuestionSection title="Correct Questions" questions={correctQs} status="Correct" />
      </div>
    </div>
  );
}