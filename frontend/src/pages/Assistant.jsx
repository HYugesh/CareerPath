import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axiosConfig';
import VoiceRecorder from '../components/VoiceRecorder';
import TextToSpeech from '../components/TextToSpeech';
// import InterviewRoom from '../components/InterviewRoom'; // Removed - using standalone page instead

export default function Assistant() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('setup'); // setup, interview, feedback
  const [interviewData, setInterviewData] = useState({
    role: '',
    experience: '',
    domain: '',
    difficulty: 'intermediate'
  });
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({
    useServerSTT: false,
    autoPlayQuestions: false,
    voiceEnabled: false
  });
  const textareaRef = useRef(null);

  // Check voice service status on mount
  useEffect(() => {
    const checkVoiceServices = async () => {
      try {
        const response = await axios.get('/voice/status');
        if (response.data.success) {
          setVoiceSettings(prev => ({
            ...prev,
            voiceEnabled: true,
            serverSTTAvailable: response.data.services.whisper,
            serverTTSAvailable: response.data.services.tts
          }));
        }
      } catch (error) {
        console.log('Voice services not available:', error);
      }
    };

    checkVoiceServices();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && currentStep === 'interview') {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, currentStep]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentAnswer]);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      if (window.confirm('Please login to start a mock interview. Would you like to login now?')) {
        navigate('/login');
      }
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/interview/start', interviewData);
      setSessionId(response.data.sessionId);
      setQuestions(response.data.questions);
      setTimeLeft(response.data.timeLimit || 1800); // 30 minutes default

      // Show friendly message if using fallback system
      if (response.data.usingFallback) {
        alert('🎯 ' + response.data.message);
      }

      setCurrentStep('interview');
    } catch (error) {
      console.error('Failed to start interview:', error);

      // Check if it's a quota/API error
      if (error.response?.status === 500 && error.response?.data?.message?.includes('quota')) {
        alert('🤖 AI service is temporarily unavailable due to high demand. Your interview will use our intelligent fallback system with curated questions. The experience remains fully functional!');
      } else if (error.response?.status === 429) {
        alert('⏱️ Service is experiencing high traffic. Please wait a moment and try again.');
      } else {
        alert('❌ Failed to start interview. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    const answerText = currentAnswer.trim() || transcript.trim();
    if (!answerText) {
      alert('Please provide an answer before proceeding.');
      return;
    }

    const newAnswer = {
      questionIndex: currentQuestionIndex,
      question: questions[currentQuestionIndex].question,
      answer: answerText,
      inputMethod: voiceMode ? 'voice' : 'text'
    };

    setUserAnswers([...userAnswers, newAnswer]);
    setCurrentAnswer('');
    setTranscript('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Don't reset timer - let it continue counting down
    } else {
      handleInterviewComplete();
    }
  };

  const handleTranscriptionComplete = (transcribedText) => {
    setTranscript(transcribedText);
    // Always update the current answer with the transcript in voice mode
    setCurrentAnswer(transcribedText);
  };

  const handleRecordingStateChange = (recording) => {
    setIsRecording(recording);
  };

  const handleInterviewComplete = async () => {
    setLoading(true);

    try {
      const response = await axios.post(`/interview/${sessionId}/submit`, {
        answers: userAnswers
      });
      setFeedback(response.data);
      setCurrentStep('feedback');
    } catch (error) {
      console.error('Failed to submit interview:', error);
      alert('Failed to submit interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (currentStep === 'setup') {
    const roleCategories = [
      { id: 'web', title: 'Web Development', icon: '🌐', roles: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'React Engineer'] },
      { id: 'data', title: 'Data & AI', icon: '🤖', roles: ['Data Scientist', 'ML Engineer', 'Data Engineer', 'AI Specialist'] },
      { id: 'mobile', title: 'Mobile Dev', icon: '📱', roles: ['iOS Developer', 'Android Developer', 'React Native Developer', 'Flutter Developer'] },
      { id: 'cloud', title: 'Cloud & Ops', icon: '☁️', roles: ['DevOps Engineer', 'Cloud Architect', 'SRE', 'Cybersecurity Specialist'] },
    ];

    return (
      <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 -right-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-6xl mx-auto py-20 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              AI Interview Master
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Simulate high-stakes interviews with our advanced AI. Get real-time feedback and detailed performance analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Quick Select */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center mb-4">
                <span className="bg-blue-500 w-2 h-6 rounded-full mr-3"></span>
                Quick Start Categories
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {roleCategories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInterviewData({ ...interviewData, domain: cat.title, role: cat.roles[0] })}
                    className={`p-4 rounded-xl border transition-all text-left flex items-center glass ${interviewData.domain === cat.title
                      ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    <span className="text-3xl mr-4">{cat.icon}</span>
                    <div>
                      <h3 className="font-bold text-white">{cat.title}</h3>
                      <p className="text-xs text-gray-400">{cat.roles.length} Roles available</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="glass p-6 rounded-2xl border border-white/10 mt-8">
                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pro Tip
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  "Use Voice Mode to practice your verbal delivery. Our AI evaluates not just what you say, but how clearly you articulate your thoughts."
                </p>
              </div>
            </div>

            {/* Right Column: Custom Setup Form */}
            <div className="lg:col-span-2">
              <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
                <form onSubmit={handleSetupSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 ml-1">Desired Job Role</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={interviewData.role}
                          onChange={(e) => setInterviewData({ ...interviewData, role: e.target.value })}
                          placeholder="e.g. Senior Backend Architect"
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🎯</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 ml-1">Experience Level</label>
                      <div className="relative">
                        <select
                          required
                          value={interviewData.experience}
                          onChange={(e) => setInterviewData({ ...interviewData, experience: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="" className="bg-gray-900">Choose level...</option>
                          <option value="entry" className="bg-gray-900">Entry (0-2y)</option>
                          <option value="mid" className="bg-gray-900">Mid-Career (2-5y)</option>
                          <option value="senior" className="bg-gray-900">Senior (5+y)</option>
                          <option value="lead" className="bg-gray-900">Lead / Architect</option>
                        </select>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📈</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 ml-1">Specialization</label>
                      <div className="relative">
                        <select
                          required
                          value={interviewData.domain}
                          onChange={(e) => setInterviewData({ ...interviewData, domain: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="" className="bg-gray-900">Select domain...</option>
                          {roleCategories.map(c => <option key={c.id} value={c.title} className="bg-gray-900">{c.title}</option>)}
                          <option value="Other" className="bg-gray-900">Other / Specialized</option>
                        </select>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💎</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300 ml-1">Challenge Level</label>
                      <div className="relative">
                        <select
                          value={interviewData.difficulty}
                          onChange={(e) => setInterviewData({ ...interviewData, difficulty: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="beginner" className="bg-gray-900 text-green-400">Standard Practice</option>
                          <option value="intermediate" className="bg-gray-900 text-yellow-400">FAANG Standard</option>
                          <option value="advanced" className="bg-gray-900 text-red-500">Unicorn Elite</option>
                        </select>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔥</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-900/30 to-emerald-900/30 p-6 rounded-2xl border border-blue-500/20">
                    <h3 className="font-bold text-white flex items-center mb-3">
                      <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Interview Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={voiceSettings.autoPlayQuestions}
                          onChange={(e) => setVoiceSettings(prev => ({ ...prev, autoPlayQuestions: e.target.checked }))}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">Narrate Questions (TTS)</span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={voiceSettings.useServerSTT}
                          onChange={(e) => setVoiceSettings(prev => ({ ...prev, useServerSTT: e.target.checked }))}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">HD Voice Recognition</span>
                      </label>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white font-black text-lg rounded-2xl shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden relative"
                  >
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Initializing AI Simulation...</span>
                      </>
                    ) : (
                      <>
                        <span>BEGIN INTERVIEW SESSION</span>
                        <svg className="w-6 h-6 animate-bounce-horizontal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'interview') {
    return (
      <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        {/* Abstract Background Blur */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto py-24 px-6 relative z-10 min-h-screen flex flex-col">
          {/* InterviewRoom component removed - using standalone /interview page instead */}
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 max-w-2xl">
              <svg className="w-20 h-20 mx-auto mb-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-3xl font-bold mb-4 text-white">Interview Room Moved</h2>
              <p className="text-slate-400 mb-8 text-lg">
                The interview experience has been moved to a dedicated page for better performance and user experience.
              </p>
              <button
                onClick={() => navigate('/interview')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/20"
              >
                Go to Interview Room →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'feedback') {
    return (
      <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        <div className="absolute inset-0 bg-blue-600/5 blur-[200px] pointer-events-none" />

        <div className="max-w-6xl mx-auto py-20 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-16"
          >
            <div className="inline-block p-4 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-4">
              ANALYSIS COMPLETE
            </h1>
            <p className="text-gray-400 text-xl font-medium tracking-wide">
              Your Performance Profile for <span className="text-white underline underline-offset-8 decoration-blue-500">{interviewData.role}</span>
            </p>
          </motion.div>

          {feedback && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Score Card */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-4 glass p-8 rounded-[2.5rem] border border-white/10 text-center relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500" />
                <h3 className="text-sm font-black text-gray-500 tracking-[0.3em] uppercase mb-8">Performance Score</h3>
                <div className="relative inline-block mb-10">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="url(#scoreGradient)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={552}
                      strokeDashoffset={552 - (552 * feedback.overallScore) / 10}
                      className="transition-all duration-[2s] ease-out stroke-linecap-round"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-white">{feedback.overallScore}</span>
                    <span className="text-xs font-bold text-gray-500">OUT OF 10</span>
                  </div>
                </div>

                <div className={`py-3 px-6 rounded-2xl border mb-6 inline-block font-black text-sm tracking-widest ${feedback.performanceRating === 'Exceptional' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                  'bg-blue-900/20 border-blue-500/30 text-blue-400'
                  }`}>
                  {feedback.performanceRating?.toUpperCase()}
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-6 px-4">
                  {feedback.overallFeedback}
                </p>

                <TextToSpeech
                  text={`Your session analysis is complete. You achieved an overall score of ${feedback.overallScore} out of 10. ${feedback.overallFeedback}`}
                  autoPlay={true}
                />
              </motion.div>

              {/* Feed Content */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Specific Assessments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Technical Skills', 'Communication', 'Behavioral'].map((label, idx) => {
                    const value = idx === 0 ? feedback.technicalAssessment : idx === 1 ? feedback.communicationAssessment : feedback.behavioralAssessment;
                    if (!value) return null;
                    return (
                      <motion.div
                        key={label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="glass p-8 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {idx === 0 ? '💻' : idx === 1 ? '💬' : '🤝'}
                          </div>
                          <h4 className="font-black text-white tracking-wider uppercase text-xs">{label}</h4>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {value}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Positives & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass p-8 rounded-[2rem] border border-green-500/20 bg-green-500/5 relative overflow-hidden">
                    <h4 className="text-xs font-black text-green-400 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">✓</span>
                      Core Strengths
                    </h4>
                    <ul className="space-y-4">
                      {feedback.strengths?.map((str, i) => (
                        <li key={i} className="flex gap-4 group">
                          <span className="text-green-500 font-bold shrink-0">→</span>
                          <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass p-8 rounded-[2rem] border border-orange-500/20 bg-orange-500/5">
                    <h4 className="text-xs font-black text-orange-400 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center">⚠</span>
                      Growth Points
                    </h4>
                    <ul className="space-y-4">
                      {(feedback.weaknesses || feedback.improvements)?.map((weak, i) => (
                        <li key={i} className="flex gap-4 group">
                          <span className="text-orange-500 font-bold shrink-0">→</span>
                          <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                {feedback.recommendations && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass p-8 rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-900/10 to-transparent"
                  >
                    <h4 className="text-xs font-black text-blue-400 tracking-[0.2em] uppercase mb-4">Strategic Roadmap Recommendations</h4>
                    <p className="text-gray-300 leading-relaxed italic">
                      {feedback.recommendations}
                    </p>
                  </motion.div>
                )}

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentStep('setup');
                      setSessionId(null);
                      setQuestions([]);
                      setCurrentQuestionIndex(0);
                      setUserAnswers([]);
                      setCurrentAnswer('');
                      setFeedback(null);
                    }}
                    className="flex-1 px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-blue-900/20"
                  >
                    Start New Simulation
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/assessment')}
                    className="flex-1 px-8 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all"
                  >
                    Review Assessments
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}