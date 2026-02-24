import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  Settings,
  LogOut,
  MessageSquare,
  ChevronRight,
  Award,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  User,
  History
} from 'lucide-react';

// Import avatar images
import avatarMale1Idle from '../assets/avatar_male_1_idle.png';
import avatarMale1Talking from '../assets/avatar_male_1_talking.png';
import avatarMale2Idle from '../assets/avatar_male_2_idle.png';
import avatarMale2Talking from '../assets/avatar_male_2_talking.png';
import avatarMale3Idle from '../assets/avatar_male_3_idle.png';
import avatarMale3Talking from '../assets/avatar_male_3_talking.png';
import avatarFemale1Idle from '../assets/avatar_female_1_idle.png';
import avatarFemale1Talking from '../assets/avatar_female_1_talking.png';
import avatarFemale2Idle from '../assets/avatar_female_2_idle.png';
import avatarFemale2Talking from '../assets/avatar_female_2_talking.png';

/**
 * Redesigned Interview Room
 */

// ============================================
// STATIC DATA FOR TESTING MODE
// ============================================

const STATIC_QUESTIONS = {
  'Frontend Developer': {
    intro: [
      "Tell me about your experience with React and modern JavaScript frameworks.",
      "What drew you to frontend development?",
      "Describe a challenging UI component you've built recently."
    ],
    core: [
      "How do you handle state management in large React applications?",
      "Explain the difference between controlled and uncontrolled components.",
      "How would you optimize the performance of a React application?",
      "What's your approach to responsive web design?",
      "How do you ensure cross-browser compatibility?"
    ],
    closing: [
      "What frontend technologies are you most excited to learn next?",
      "Do you have any questions about our frontend tech stack?"
    ]
  },
  'Backend Developer': {
    intro: [
      "Tell me about your experience with server-side development.",
      "What programming languages do you prefer for backend work?",
      "Describe a complex API you've designed and implemented."
    ],
    core: [
      "How do you design RESTful APIs?",
      "Explain your approach to database optimization.",
      "How do you handle authentication and authorization?",
      "What's your strategy for handling high-traffic applications?",
      "How do you ensure data security in your applications?"
    ],
    closing: [
      "What backend technologies are you interested in exploring?",
      "Do you have questions about our infrastructure and deployment process?"
    ]
  },
  'Full Stack Developer': {
    intro: [
      "Tell me about your full-stack development experience.",
      "How do you balance frontend and backend responsibilities?",
      "Describe a project where you handled the entire development stack."
    ],
    core: [
      "How do you ensure consistency between frontend and backend?",
      "What's your approach to API design and integration?",
      "How do you handle data flow in full-stack applications?",
      "Explain your deployment and DevOps practices.",
      "How do you manage database relationships and queries?"
    ],
    closing: [
      "What full-stack technologies excite you most?",
      "Do you have questions about our development workflow?"
    ]
  }
};

const SKILL_TAGS = [
  'JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'TypeScript',
  'API Design', 'Database Design', 'Problem Solving', 'Communication',
  'System Design', 'Testing', 'Performance', 'Security'
];

const generateMockQuestion = (role, phase, alreadyAsked) => {
  const rolePool = STATIC_QUESTIONS[role] || STATIC_QUESTIONS['Frontend Developer'];
  const questions = rolePool[phase] || rolePool['intro'];
  const availableQuestions = questions.filter(q => !alreadyAsked.includes(q));

  if (availableQuestions.length === 0) {
    return questions[Math.floor(Math.random() * questions.length)];
  }

  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
};

const generateMockEvaluation = () => {
  const score = Math.floor(Math.random() * 6) + 5;
  const skillTag = SKILL_TAGS[Math.floor(Math.random() * SKILL_TAGS.length)];
  const level = score >= 8 ? 'strong' : score >= 6 ? 'average' : 'weak';

  const reasons = {
    strong: 'Excellent technical knowledge and clear communication',
    average: 'Good understanding with room for improvement',
    weak: 'Basic knowledge, needs more experience'
  };

  return {
    score,
    skillTag,
    level,
    reason: reasons[level]
  };
};

const avatarOptions = [
  { name: 'Male 1', idle: avatarMale1Idle, talking: avatarMale1Talking },
  { name: 'Male 2', idle: avatarMale2Idle, talking: avatarMale2Talking },
  { name: 'Male 3', idle: avatarMale3Idle, talking: avatarMale3Talking },
  { name: 'Female 1', idle: avatarFemale1Idle, talking: avatarFemale1Talking },
  { name: 'Female 2', idle: avatarFemale2Idle, talking: avatarFemale2Talking },
];

function Avatar({ isSpeaking, avatarIndex = 0 }) {
  const currentAvatar = avatarOptions[avatarIndex] || avatarOptions[0];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
          y: isSpeaking ? [0, -4, 0] : 0
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut"
        }}
        className="relative w-full max-w-[400px] h-full flex items-center justify-center"
      >
        <img
          src={isSpeaking ? currentAvatar.talking : currentAvatar.idle}
          alt="AI Interviewer"
          className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(37,99,235,0.2)]"
        />

        {/* Speaking waves effect */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-48 h-48 rounded-full border border-blue-500/30"
            />
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="w-48 h-48 rounded-full border border-blue-500/20"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function InterviewRoom() {
  const navigate = useNavigate();
  // State
  const [timeLeft, setTimeLeft] = useState(600);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState(600);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [interviewEndTime, setInterviewEndTime] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('intro');
  const [isInterviewRunning, setIsInterviewRunning] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [role, setRole] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [alreadyAskedQuestions, setAlreadyAskedQuestions] = useState([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [answerEvaluations, setAnswerEvaluations] = useState([]);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [currentQuestionForEvaluation, setCurrentQuestionForEvaluation] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerStatus, setAnswerStatus] = useState('');
  const [cameraStatus, setCameraStatus] = useState('pending');
  const [captionText, setCaptionText] = useState('Waiting to begin...');
  const [showCaptions, setShowCaptions] = useState(true);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load config
  useEffect(() => {
    const savedConfig = localStorage.getItem('interviewConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setRole(config.role || 'Frontend Developer');
        setDifficulty(config.experience || 'intermediate');
        setInterviewDuration((config.duration || 20) * 60);
        setTimeLeft((config.duration || 20) * 60);
        // Randomly choose an avatar gender for variety
        setSelectedAvatarIndex(Math.floor(Math.random() * avatarOptions.length));
      } catch (error) {
        console.error('Failed to load interview configuration:', error);
      }
    }
  }, []);

  // Camera setup
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      return;
    }

    async function startCamera() {
      try {
        setCameraStatus('pending');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraStatus('active');
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraStatus('denied');
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let combinedFinal = '';
      let combinedInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          combinedFinal += transcript + ' ';
        } else {
          combinedInterim += transcript;
        }
      }

      setFinalTranscript(combinedFinal.trim());
      setInterimTranscript(combinedInterim);

      // Update captions only if we are in answering mode
      // This prevents overwriting other status messages
      if (combinedFinal || combinedInterim) {
        setCaptionText((combinedFinal + combinedInterim).trim());
      }
    };

    recognition.onerror = (e) => console.error('Recognition error:', e.error);
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Timer: Optimized to use functional updates and avoid restart on every second
  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Logic Helpers
  const determineNextPhase = () => {
    const now = Date.now();
    const timeRemainingMinutes = (interviewEndTime - now) / 1000 / 60;
    if (timeRemainingMinutes < 2 && currentPhase !== 'closing') return 'closing';
    if (currentPhase === 'intro' && questionsAsked >= 2) return 'core';
    return currentPhase;
  };

  const shouldEndInterview = () => {
    if (!interviewEndTime) return false;
    if (Date.now() >= interviewEndTime) return true;
    return false;
  };

  const askNextQuestion = async () => {
    if (shouldEndInterview()) {
      endInterview();
      return;
    }

    const nextPhase = determineNextPhase();
    if (nextPhase !== currentPhase) setCurrentPhase(nextPhase);

    setIsGeneratingQuestion(true);
    await new Promise(r => setTimeout(r, 1500));

    const nextQuestion = generateMockQuestion(role, nextPhase, alreadyAskedQuestions);
    setAlreadyAskedQuestions(prev => [...prev, nextQuestion]);
    setCurrentQuestionText(nextQuestion);
    setCurrentQuestionForEvaluation(nextQuestion);
    setQuestionsAsked(prev => prev + 1);
    setIsGeneratingQuestion(false);

    speakQuestion(nextQuestion);
  };

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCaptionText(text);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCaptionText('');
    };
    window.speechSynthesis.speak(utterance);
  };

  const endInterview = () => {
    setIsInterviewRunning(false);
    setIsTimerRunning(false);
    const endMessage = "Thank you. The interview is now complete. You can view your performance summary shortly.";
    setCurrentQuestionText(endMessage);
    speakQuestion(endMessage);
  };

  const handleStartInterview = async () => {
    // Permission checks... (simplified for brevity but matching core logic)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      alert("Microphone permission required.");
      return;
    }

    const duration = interviewDuration;
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    setInterviewStartTime(startTime);
    setInterviewEndTime(endTime);
    setTimeLeft(duration);
    setIsInterviewStarted(true);
    setIsTimerRunning(true);
    setIsInterviewRunning(true);
    setCurrentPhase('intro');
    setQuestionsAsked(0);
    setAlreadyAskedQuestions([]);
    setAnswerEvaluations([]);

    setTimeout(() => askNextQuestion(), 1000);
  };

  const handleStartAnswer = () => {
    if (!isInterviewStarted || isAnswering || isSpeaking) return;
    try {
      setFinalTranscript('');
      setInterimTranscript('');
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsAnswering(true);
      setAnswerStatus('Listening...');
      setCaptionText('Listening... Go ahead.');

      // Setup audio level monitoring
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          const updateLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setAudioLevel(average);
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }).catch(err => console.error("Audio monitor error:", err));
      }
    } catch (e) { console.error(e); }
  };

  const handleStopAnswer = async () => {
    if (!isAnswering) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setAudioLevel(0);
    setIsAnswering(false);
    setAnswerStatus('');

    // Use a more robust way to combine the transcripts
    let completeTranscript = finalTranscript.trim();
    if (interimTranscript.trim() && !completeTranscript.includes(interimTranscript.trim())) {
      completeTranscript += ' ' + interimTranscript.trim();
    }
    completeTranscript = completeTranscript.trim();

    // Simple deduplication: if the same phrase is repeated twice back-to-back, fix it
    const words = completeTranscript.split(' ');
    if (words.length >= 4) {
      const half = Math.floor(words.length / 2);
      const firstHalf = words.slice(0, half).join(' ');
      const secondHalf = words.slice(half).join(' ');
      if (firstHalf === secondHalf) {
        completeTranscript = firstHalf;
      }
    }
    if (completeTranscript) {
      setIsEvaluatingAnswer(true);
      setCaptionText('Analyzing your response...');
      await new Promise(r => setTimeout(r, 2000));

      const evaluation = generateMockEvaluation();
      setAnswerEvaluations(prev => [...prev, { ...evaluation, question: currentQuestionForEvaluation, answer: completeTranscript }]);
      setIsEvaluatingAnswer(false);

      setTimeout(() => askNextQuestion(), 1000);
    } else {
      setCaptionText('No response detected. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen text-slate-200 overflow-hidden font-sans" style={{ background: '#0A0E14' }}>

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-screen p-16">

        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <BrainCircuit className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">{role} Mock Interview</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isInterviewRunning ? 'bg-emerald-500 animate-pulse' : (isInterviewStarted ? 'bg-blue-500' : 'bg-slate-500')}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {isInterviewRunning ? 'Session Live' : (isInterviewStarted ? 'Completed' : 'Not Started')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl px-6 py-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className={`text-2xl font-black font-mono tracking-tighter ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => navigate('/interview-landing')}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative">

          {/* Video Grid: Split equally */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

            {/* Interviewer Frame */}
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-[40px] relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex-1 overflow-hidden">
                <Avatar isSpeaking={isSpeaking} avatarIndex={selectedAvatarIndex} />
              </div>

              {/* Interviewer Status Label */}
              <div className="absolute top-8 left-8">
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-ping' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Interviewer</span>
                </div>
              </div>
            </div>

            {/* User Camera Frame */}
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-[40px] relative overflow-hidden flex flex-col group">
              {cameraStatus === 'active' && !isVideoOff ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute top-8 left-8">
                    <div className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <VideoOff className="text-slate-500 w-8 h-8" />
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Camera Disabled</p>
                </div>
              )}

              {/* Mic Indicator Overlay */}
              <div className="absolute bottom-8 right-8 flex items-end gap-3 px-4 py-3 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/5 shadow-2xl">
                {isAnswering && (
                  <div className="flex items-center gap-1 h-6">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: audioLevel > 5 ? [8, Math.min(24, 8 + (audioLevel * (i + 1) / 4)), 8] : 8
                        }}
                        transition={{ duration: 0.2, repeat: Infinity }}
                        className="w-1 bg-blue-400 rounded-full"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center">
                  {isAnswering ? <Mic className="text-blue-400 animate-pulse w-5 h-5" /> : <MicOff className="text-slate-500 w-5 h-5" />}
                </div>
              </div>

              {/* User Label */}
              <div className="absolute top-8 right-8">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 backdrop-blur-md">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Candidate (You)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Captions Area: Subtle YouTube-style subtitles */}
          <div className="h-20 flex items-center justify-center mt-4">
            <AnimatePresence>
              {(captionText || isGeneratingQuestion || isEvaluatingAnswer) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-2xl px-8"
                >
                  <div className="bg-black/60 backdrop-blur-sm rounded px-6 py-2.5 text-center">
                    {isGeneratingQuestion ? (
                      <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-[10px] tracking-widest uppercase">
                        <Sparkles className="animate-spin" size={12} /> Generating Question...
                      </div>
                    ) : isEvaluatingAnswer ? (
                      <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-[10px] tracking-widest uppercase">
                        <BrainCircuit className="animate-pulse" size={12} /> Analyzing Response...
                      </div>
                    ) : (
                      <p className="text-white/90 text-sm leading-snug font-medium tracking-wide">
                        {captionText}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Control Dock */}
        <div className="mt-4 flex justify-center pb-4">
          {!isInterviewStarted ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartInterview}
              className="group px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[24px] shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all"
            >
              Begin Personal Interview <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-3 shadow-2xl"
            >
              <div className="flex items-center gap-1.5 px-3 border-r border-slate-800">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
              </div>

              <div className="flex items-center gap-2 px-2">
                {!isAnswering ? (
                  <button
                    onClick={handleStartAnswer}
                    disabled={isSpeaking || isGeneratingQuestion}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                  >
                    <Play size={18} fill="white" /> Give Answer
                  </button>
                ) : (
                  <button
                    onClick={handleStopAnswer}
                    className="px-8 py-4 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-2xl flex items-center gap-2 transition-all"
                  >
                    <div className="w-2 h-2 bg-slate-950 rounded-full animate-pulse" /> Submit Answer
                  </button>
                )}
              </div>

              <div className="pl-3 border-l border-slate-800 mr-2">
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to end the interview session?")) {
                      endInterview();
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-4 bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 group rounded-2xl transition-all text-slate-400 font-bold"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scrollbar & Animation Styles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
