import { useState, useEffect, useRef } from "react";
import axios from "../api/axiosConfig";
import Editor from "@monaco-editor/react";
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Settings,
  Terminal,
  BookOpen,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Timer,
  Trash2,
  Clock,
  History,
  ChevronDown,
  Plus,
  X,
  BarChart3,
  Award
} from "lucide-react";

type ViewType = "setup" | "coding" | "history" | "fullscreen-permission" | "performance-analysis";

// --- Types ---

type Difficulty = "Easy" | "Medium" | "Hard";
type Language = "JavaScript" | "Python" | "Java" | "C++";
type QuestionMode = "New" | "Previous";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CustomTestCase {
  input: string;
  expectedOutput: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: string;
  testCases: TestCase[];
}

interface ExecutionResult {
  testCaseIndex: number;
  status: "Passed" | "Failed" | "Error";
  actualOutput?: string;
  errorDetail?: string;
  isHidden: boolean;
}

interface PerformanceAnalysis {
  overallRating: number; // 1-10
  strengths: string[];
  improvements: string[];
  codeQuality: {
    readability: number;
    efficiency: number;
    correctness: number;
  };
  recommendations: string[];
  summary: string;
}

// Language mapping for Monaco Editor
const getMonacoLanguage = (language: Language): string => {
  switch (language) {
    case "JavaScript":
      return "javascript";
    case "Python":
      return "python";
    case "Java":
      return "java";
    case "C++":
      return "cpp";
    default:
      return "javascript";
  }
};

// --- API Client ---
// Using backend API instead of direct Gemini calls for better reliability

// Question history storage
interface QuestionHistory {
  id: string;
  timestamp: number;
  topic: string;
  difficulty: Difficulty;
  language: Language;
  count: number;
  questions: Question[];
}

// Get question history from localStorage
const getQuestionHistory = (): QuestionHistory[] => {
  try {
    const history = localStorage.getItem('codeArenaHistory');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

// Save questions to history
const saveToHistory = (topic: string, difficulty: Difficulty, language: Language, count: number, questions: Question[]) => {
  const history = getQuestionHistory();
  const newEntry: QuestionHistory = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    topic,
    difficulty,
    language,
    count,
    questions
  };

  history.unshift(newEntry);
  // Keep only last 20 entries
  const trimmedHistory = history.slice(0, 20);
  localStorage.setItem('codeArenaHistory', JSON.stringify(trimmedHistory));
};

// --- Components ---

const GeminiCodeArena = () => {
  const [view, setView] = useState<ViewType>("setup");
  const [loading, setLoading] = useState(false);

  // Setup State
  const [selectedTopic, setSelectedTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [count, setCount] = useState(3);
  const [timeLimit, setTimeLimit] = useState<number | null>(30);
  const [questionMode, setQuestionMode] = useState<QuestionMode>("New");

  // Coding State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [results, setResults] = useState<ExecutionResult[] | null>(null);
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenNotification, setShowFullscreenNotification] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  // Custom Test Cases State
  const [showCustomTests, setShowCustomTests] = useState(false);
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([]);
  const [customResults, setCustomResults] = useState<ExecutionResult[] | null>(null);
  const [middleTab, setMiddleTab] = useState<"problem" | "results">("problem");

  // Performance Analysis State
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [analyzingPerformance, setAnalyzingPerformance] = useState(false);

  // Session tracking for analysis
  const [sessionData, setSessionData] = useState<{
    startTime: number;
    attempts: { questionId: number; code: string; results: ExecutionResult[]; timestamp: number }[];
  }>({ startTime: Date.now(), attempts: [] });

  // History State
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on component mount
  useEffect(() => {
    setQuestionHistory(getQuestionHistory());
  }, []);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown) {
        const target = event.target as Element;
        if (!target.closest('.language-dropdown')) {
          setShowLanguageDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageDropdown]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      // Constrain between 25% and 60%
      if (newWidth >= 25 && newWidth <= 60) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Fullscreen management
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
        setShowFullscreenNotification(true);
        // Hide notification after 3 seconds
        setTimeout(() => setShowFullscreenNotification(false), 3000);

        // Hide the main navbar by adding a CSS class to body
        document.body.classList.add('fullscreen-coding-mode');

        // Also try to hide navbar by targeting common navbar selectors
        const navbar = document.querySelector('nav') ||
          document.querySelector('[role="navigation"]') ||
          document.querySelector('.navbar') ||
          document.querySelector('header');
        if (navbar) {
          (navbar as HTMLElement).style.display = 'none';
        }

      } catch (error) {
        console.log("Fullscreen not supported or denied");
        setIsFullscreen(false);
        // If fullscreen fails, go back to permission page and show error
        setView("fullscreen-permission");
        setFullscreenError("Fullscreen access was denied. Please allow fullscreen access to continue with the coding session.");
      }
    };

    const exitFullscreen = async () => {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        setShowFullscreenNotification(false);

        // Restore the main navbar
        document.body.classList.remove('fullscreen-coding-mode');

        // Restore navbar visibility
        const navbar = document.querySelector('nav') ||
          document.querySelector('[role="navigation"]') ||
          document.querySelector('.navbar') ||
          document.querySelector('header');
        if (navbar) {
          (navbar as HTMLElement).style.display = '';
        }

      } catch (error) {
        console.log("Exit fullscreen failed");
      }
    };

    // Enter fullscreen when entering coding view
    if (view === "coding" && !isFullscreen) {
      enterFullscreen();
    } else if (isFullscreen && (view as ViewType) !== "coding") {
      // Exit fullscreen when leaving coding view
      exitFullscreen();
    }

    return () => {
      // Don't add fullscreen change listener here to avoid conflicts
    };
  }, [view]);

  // Separate effect for handling fullscreen changes (ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;

      // Only handle ESC key exits (when user manually exits fullscreen while in coding view)
      if (!isCurrentlyFullscreen && view === "coding" && isFullscreen) {
        console.log("User pressed ESC - exiting session");
        setIsFullscreen(false);

        // Restore the main navbar when exiting via ESC
        document.body.classList.remove('fullscreen-coding-mode');
        const navbar = document.querySelector('nav') ||
          document.querySelector('[role="navigation"]') ||
          document.querySelector('.navbar') ||
          document.querySelector('header');
        if (navbar) {
          (navbar as HTMLElement).style.display = '';
        }

        setView("setup");
        setQuestions([]);
      } else if (isCurrentlyFullscreen && view === "coding") {
        // Successfully entered fullscreen
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [view, isFullscreen]);

  // Cleanup fullscreen on component unmount
  useEffect(() => {
    // Inject CSS for fullscreen mode
    const style = document.createElement('style');
    style.id = 'fullscreen-coding-styles';
    style.textContent = `
      /* Hide navbar and other UI elements in fullscreen coding mode */
      body.fullscreen-coding-mode nav,
      body.fullscreen-coding-mode header,
      body.fullscreen-coding-mode [role="navigation"],
      body.fullscreen-coding-mode .navbar,
      body.fullscreen-coding-mode .header,
      body.fullscreen-coding-mode .top-nav,
      body.fullscreen-coding-mode .main-nav {
        display: none !important;
      }
      
      /* Ensure fullscreen content takes full height */
      body.fullscreen-coding-mode {
        overflow: hidden;
      }
      
      /* Make sure the coding area uses full viewport */
      body.fullscreen-coding-mode .coding-container {
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;

    if (!document.getElementById('fullscreen-coding-styles')) {
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup on component unmount
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }

      // Restore navbar
      document.body.classList.remove('fullscreen-coding-mode');
      const navbar = document.querySelector('nav') ||
        document.querySelector('[role="navigation"]') ||
        document.querySelector('.navbar') ||
        document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.display = '';
      }

      // Remove injected styles
      const injectedStyle = document.getElementById('fullscreen-coding-styles');
      if (injectedStyle) {
        injectedStyle.remove();
      }
    };
  }, []);

  const topics = [
    { name: "Arrays", category: "basic" },
    { name: "Strings", category: "basic" },
    { name: "Math & Numbers", category: "basic" },
    { name: "Basic Algorithms", category: "basic" },
    { name: "HashMap", category: "intermediate" },
    { name: "Two Pointers", category: "intermediate" },
    { name: "Sliding Window", category: "intermediate" },
    { name: "Stack", category: "intermediate" },
    { name: "Binary Search", category: "advanced" },
    { name: "Linked List", category: "advanced" },
    { name: "Trees", category: "advanced" },
    { name: "Dynamic Programming", category: "advanced" },
    { name: "Graphs", category: "advanced" }
  ];

  // --- Effects ---

  useEffect(() => {
    if (view === "coding" && timeLimit !== null) {
      setTimeLeft(timeLimit * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, timeLimit]);

  // --- Actions ---

  const generateQuestions = async () => {
    if (!selectedTopic) {
      alert("Please select a topic first");
      return;
    }

    // First show fullscreen permission page
    setView("fullscreen-permission");
  };

  const proceedWithFullscreen = async () => {
    setLoading(true);
    setFullscreenError(null); // Clear any previous error

    try {
      // If "Previous" mode is selected, ONLY load from history - no fallback to new generation
      if (questionMode === "Previous") {
        const history = getQuestionHistory();
        const matchingHistory = history.find(h =>
          h.topic === selectedTopic &&
          h.difficulty === difficulty &&
          h.language === language &&
          h.count === count
        );

        if (matchingHistory) {
          setQuestions(matchingHistory.questions);
          // Generate starter code for the current language
          const initialStarterCode = generateStarterCode(language, matchingHistory.questions[0]?.title || "");
          setUserCode(initialStarterCode);
          setCurrentQIndex(0);
          setResults(null);
          setView("coding");
          // Reset session data
          setSessionData({ startTime: Date.now(), attempts: [] });
          setLoading(false);
          return;
        } else {
          // No matching history found - show error and return to setup
          setFullscreenError(`No previous questions found for ${selectedTopic} (${difficulty}, ${language}, ${count} problems). Please select "New" mode to generate fresh questions or try different settings.`);
          setView("fullscreen-permission");
          setLoading(false);
          return;
        }
      }

      // "New" mode - always generate fresh questions
      console.log("Generating new questions via backend API:", { selectedTopic, difficulty, language, count });

      // Call backend API to generate questions
      const response = await axios.post("/coding/generate-questions", {
        topic: selectedTopic,
        difficulty: difficulty,
        language: language,
        count: count
      });

      const { questions: generatedQuestions } = response.data;

      if (generatedQuestions && generatedQuestions.length > 0) {
        console.log(`Successfully received ${generatedQuestions.length} questions from backend`);

        // Save to history (only for "New" mode)
        saveToHistory(selectedTopic, difficulty, language, count, generatedQuestions);
        setQuestionHistory(getQuestionHistory());

        setQuestions(generatedQuestions);
        // Generate starter code for the current language
        const initialStarterCode = generateStarterCode(language, generatedQuestions[0]?.title || "");
        setUserCode(initialStarterCode);
        setCurrentQIndex(0);
        setResults(null);
        setView("coding");
        // Reset session data
        setSessionData({ startTime: Date.now(), attempts: [] });
      } else {
        throw new Error("No questions received from backend");
      }

    } catch (error) {
      console.error("Failed to generate questions:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      alert(`Failed to generate questions: ${errorMessage}`);
      setView("setup");
    } finally {
      setLoading(false);
    }
  };

  // Test Code - Only run public test cases
  const handleTestCode = async () => {
    setExecuting(true);
    setResults(null);
    const currentQuestion = questions[currentQIndex];

    try {
      console.log("Testing code with public test cases only");

      // Filter only public test cases
      const publicTestCases = currentQuestion.testCases.filter(tc => !tc.isHidden);

      // Call backend API to execute code with public test cases only
      const response = await axios.post("/coding/execute-code", {
        code: userCode,
        language: language,
        testCases: publicTestCases,
        problemDescription: currentQuestion.description,
        testMode: "public" // Indicate this is public testing only
      });

      const { results: executionResults } = response.data;
      setResults(executionResults);
      setMiddleTab("results");

    } catch (error) {
      console.error("Test execution failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";

      // Fallback error results for public test cases only
      const publicTestCases = currentQuestion.testCases.filter(tc => !tc.isHidden);
      setResults(publicTestCases.map((tc, i) => ({
        testCaseIndex: i,
        status: "Error" as const,
        errorDetail: `System Error: ${errorMessage}`,
        isHidden: false
      })));
    } finally {
      setExecuting(false);
    }
  };

  // Submit Code - Run all test cases (public + private)
  const handleSubmitCode = async () => {
    setSubmitting(true);
    setResults(null);
    const currentQuestion = questions[currentQIndex];

    try {
      console.log("Submitting code with all test cases");

      // Call backend API to execute code with all test cases
      const response = await axios.post("/coding/execute-code", {
        code: userCode,
        language: language,
        testCases: currentQuestion.testCases,
        problemDescription: currentQuestion.description,
        testMode: "submit" // Indicate this is full submission
      });

      const { results: executionResults } = response.data;
      setResults(executionResults);
      setMiddleTab("results");

      // Track this attempt in session data
      setSessionData(prev => ({
        ...prev,
        attempts: [...prev.attempts, {
          questionId: currentQuestion.id,
          code: userCode,
          results: executionResults,
          timestamp: Date.now()
        }]
      }));

    } catch (error) {
      console.error("Submission failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";

      // Fallback error results for all test cases
      setResults(currentQuestion.testCases.map((tc, i) => ({
        testCaseIndex: i,
        status: "Error" as const,
        errorDetail: `System Error: ${errorMessage}`,
        isHidden: tc.isHidden
      })));
    } finally {
      setSubmitting(false);
    }
  };

  // Run Custom Test Cases
  const handleRunCustomTests = async () => {
    if (customTestCases.length === 0) return;

    setExecuting(true);
    setCustomResults(null);

    try {
      console.log("Running custom test cases");

      // Convert custom test cases to the expected format
      const customTests = customTestCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: false
      }));

      // Call backend API to execute code with custom test cases
      const response = await axios.post("/coding/execute-code", {
        code: userCode,
        language: language,
        testCases: customTests,
        problemDescription: questions[currentQIndex].description,
        testMode: "custom"
      });

      const { results: executionResults } = response.data;
      setCustomResults(executionResults);

    } catch (error) {
      console.error("Custom test execution failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";

      // Fallback error results
      setCustomResults(customTestCases.map((tc, i) => ({
        testCaseIndex: i,
        status: "Error" as const,
        errorDetail: `System Error: ${errorMessage}`,
        isHidden: false
      })));
    } finally {
      setExecuting(false);
    }
  };

  // Add custom test case
  const addCustomTestCase = () => {
    setCustomTestCases(prev => [...prev, { input: "", expectedOutput: "" }]);
  };

  // Remove custom test case
  const removeCustomTestCase = (index: number) => {
    setCustomTestCases(prev => prev.filter((_, i) => i !== index));
  };

  // Update custom test case
  const updateCustomTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    setCustomTestCases(prev => prev.map((tc, i) =>
      i === index ? { ...tc, [field]: value } : tc
    ));
  };

  // End session and analyze performance
  const endSessionAndAnalyze = async () => {
    setAnalyzingPerformance(true);

    try {
      console.log("Analyzing session performance");

      // Prepare session data for analysis
      const analysisData = {
        sessionDuration: Date.now() - sessionData.startTime,
        totalAttempts: sessionData.attempts.length,
        questions: questions.map(q => ({
          id: q.id,
          title: q.title,
          difficulty: difficulty,
          topic: selectedTopic
        })),
        attempts: sessionData.attempts,
        language: language,
        userCodes: sessionData.attempts.map(a => a.code)
      };

      // Call backend API for performance analysis
      const response = await axios.post("/coding/analyze-performance", analysisData);

      const { analysis } = response.data;
      setPerformanceAnalysis(analysis);
      setView("performance-analysis");

    } catch (error) {
      console.error("Performance analysis failed:", error);

      // Fallback basic analysis
      const totalTests = sessionData.attempts.reduce((sum, attempt) => sum + attempt.results.length, 0);
      const passedTests = sessionData.attempts.reduce((sum, attempt) =>
        sum + attempt.results.filter(r => r.status === "Passed").length, 0
      );

      const fallbackAnalysis: PerformanceAnalysis = {
        overallRating: Math.round((passedTests / totalTests) * 10) || 5,
        strengths: ["Completed the coding session", "Attempted multiple problems"],
        improvements: ["Focus on test case coverage", "Consider edge cases", "Optimize code efficiency"],
        codeQuality: {
          readability: 7,
          efficiency: 6,
          correctness: Math.round((passedTests / totalTests) * 10) || 5
        },
        recommendations: [
          "Practice more problems of similar difficulty",
          "Review failed test cases to understand edge cases",
          "Focus on code optimization and clean coding practices"
        ],
        summary: `You completed ${sessionData.attempts.length} attempts with ${Math.round((passedTests / totalTests) * 100)}% test success rate. Keep practicing to improve your problem-solving skills!`
      };

      setPerformanceAnalysis(fallbackAnalysis);
      setView("performance-analysis");
    } finally {
      setAnalyzingPerformance(false);
    }
  };

  // Helper function to generate starter code for different languages
  const generateStarterCode = (language: Language, problemTitle: string) => {
    // Extract function name from problem title (convert to camelCase)
    const cleanTitle = problemTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanTitle.toLowerCase().split(/\s+/).filter(word => word.length > 0);

    let functionName = 'solution';
    if (words.length > 0) {
      functionName = words[0] + words.slice(1).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
    }

    switch (language) {
      case 'JavaScript':
        return `function ${functionName}(params) {\n    // Your code here\n    \n}`;
      case 'Python':
        // Convert camelCase to snake_case for Python
        const pythonFunctionName = functionName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `def ${pythonFunctionName}(params):\n    # Your code here\n    pass`;
      case 'Java':
        return `public class Solution {\n    public ReturnType ${functionName}(params) {\n        // Your code here\n        \n    }\n}`;
      case 'C++':
        return `class Solution {\npublic:\n    ReturnType ${functionName}(params) {\n        // Your code here\n        \n    }\n};`;
      default:
        return '// Your code here';
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setShowLanguageDropdown(false);

    // Update starter code based on the new language and current question
    const currentQuestion = questions[currentQIndex];
    if (currentQuestion) {
      const newStarterCode = generateStarterCode(newLanguage, currentQuestion.title);
      setUserCode(newStarterCode);
    }
  };

  const changeQuestion = (delta: number) => {
    const newIndex = currentQIndex + delta;
    if (newIndex >= 0 && newIndex < questions.length) {
      setCurrentQIndex(newIndex);
      // Generate starter code for the new question in the current language
      const newQuestion = questions[newIndex];
      const newStarterCode = generateStarterCode(language, newQuestion?.title || "");
      setUserCode(newStarterCode);
      setResults(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Setup View ---
  if (view === "setup") {
    return (
      <div className="min-h-screen text-slate-300 font-sans p-8 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        {/* Header Section */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-10 h-10 bg-gray-900 border border-slate-700 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/10">
            <Cpu className="text-[#60A5FA]" size={20} />
          </div>
          <h1 className="text-4xl font-bold text-[#22D3EE] mb-1 tracking-tight">CodeArena</h1>
          <p className="text-slate-500 text-xs">Master Data Structures & Algorithms with an AI-powered adaptive interview environment.</p>
        </div>

        {/* Main Setup Card */}
        <div className="w-full max-w-4xl bg-gray-900/80 border border-slate-800 rounded-[2rem] p-4 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle top-right gradient glow */}
          <div className="absolute top-0 right-0 w-64 h-1 bg-gradient-to-l from-[#10B981] to-transparent opacity-50" />

          <div className="grid grid-cols-12 gap-4">
            {/* Left Column: Topic Selection */}
            <div className="col-span-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-[#60A5FA]">
                <BookOpen size={14} />
                SELECT TOPIC
              </div>
              <div className={`grid grid-cols-2 gap-1 pr-2 ${questionMode === "Previous"
                ? "max-h-[180px] overflow-y-auto custom-scrollbar"
                : "max-h-fit"
                }`}>
                {topics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => setSelectedTopic(topic.name)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${selectedTopic === topic.name
                      ? "bg-[#2563EB] border-[#3B82F6] text-white shadow-lg shadow-blue-500/20"
                      : "bg-gray-900 border-slate-800 text-slate-400 hover:border-slate-600"
                      }`}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Settings */}
            <div className="col-span-6 flex flex-col gap-3">
              {/* Difficulty */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-yellow-500">
                  <Zap size={14} /> DIFFICULTY
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-slate-800">
                  {(["Easy", "Medium", "Hard"] as Difficulty[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${difficulty === lvl
                        ? "bg-[#113230] text-[#14B8A6]"
                        : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-[#38BDF8]">
                  <Clock size={14} /> TIME LIMIT
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-slate-800">
                  {[15, 30, 45, 60, null].map((time) => (
                    <button
                      key={time || "inf"}
                      onClick={() => setTimeLimit(time)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${timeLimit === time
                        ? "bg-[#0B2C3B] text-[#38BDF8]"
                        : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      {time ? `${time} min` : "∞"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#60A5FA]">
                    <Settings size={14} /> COUNT
                  </div>
                  <span className="text-2xl font-bold text-[#60A5FA]">{count}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full accent-[#60A5FA] bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-bold uppercase">
                  <span>1 Problem</span>
                  <span>5 Problems</span>
                </div>
              </div>

              {/* Question Mode */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-[#22D3EE]">
                  <History size={14} /> QUESTION MODE
                </div>
                <div className="flex bg-black/40 p-1 rounded-lg border border-slate-800 gap-1">
                  <button
                    onClick={() => setQuestionMode("New")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 ${questionMode === "New"
                      ? "bg-[#1E293B] text-[#22D3EE]"
                      : "text-slate-500 hover:text-slate-300"
                      }`}
                  >
                    <span className="text-sm">+</span> New
                  </button>
                  <button
                    onClick={() => setQuestionMode("Previous")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 ${questionMode === "Previous"
                      ? "bg-[#1E293B] text-[#22D3EE]"
                      : "text-slate-500 hover:text-slate-300"
                      }`}
                  >
                    <History size={12} /> Previous
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between items-center">
            <button
              onClick={() => setView("history")}
              className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-slate-300"
            >
              <History size={18} /> View History ({questionHistory.length})
            </button>
            <button
              onClick={generateQuestions}
              disabled={loading || !selectedTopic}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${loading || !selectedTopic
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-[#2563EB] hover:bg-[#4d51e0] text-white shadow-blue-500/30"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building Environment...
                </>
              ) : !selectedTopic ? (
                <>
                  Select a Topic First
                </>
              ) : (
                <>
                  {questionMode === "Previous" ? "Load Previous" : "Begin Challenge"} <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- History View ---
  if (view === "history") {
    return (
      <div className="min-h-screen text-slate-300 font-sans p-24" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("setup")}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-px h-6 bg-slate-700"></div>
              <h1 className="text-2xl font-bold text-[#22D3EE]">Question History</h1>
            </div>
            <button
              onClick={() => {
                if (confirm("Clear all history?")) {
                  localStorage.removeItem('codeArenaHistory');
                  setQuestionHistory([]);
                }
              }}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>

          {/* History List */}
          {questionHistory.length === 0 ? (
            <div className="text-center py-16">
              <History size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No History Yet</h3>
              <p className="text-slate-500 mb-6">Start solving problems to build your history</p>
              <button
                onClick={() => setView("setup")}
                className="px-6 py-3 bg-[#2563EB] hover:bg-[#4d51e0] text-white rounded-lg font-medium transition-colors"
              >
                Start Coding
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {questionHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-900/80 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{entry.topic}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${entry.difficulty === 'Easy' ? "bg-green-500/20 text-green-400" :
                          entry.difficulty === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                          {entry.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {entry.language}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {entry.count} problems
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setQuestions(entry.questions);
                        setSelectedTopic(entry.topic);
                        setDifficulty(entry.difficulty);
                        setLanguage(entry.language);
                        setCount(entry.count);
                        // Generate starter code for the selected language
                        const historyStarterCode = generateStarterCode(entry.language, entry.questions[0]?.title || "");
                        setUserCode(historyStarterCode);
                        setCurrentQIndex(0);
                        setResults(null);
                        setView("coding");
                      }}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#4d51e0] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Load Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Fullscreen Permission View ---
  if (view === "fullscreen-permission") {
    return (
      <div className="min-h-screen text-slate-300 font-sans p-8 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        <div className="w-full max-w-2xl bg-gray-900/80 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-sm relative overflow-hidden text-center">
          {/* Subtle top gradient glow */}
          <div className="absolute top-0 right-0 w-64 h-1 bg-gradient-to-l from-[#10B981] to-transparent opacity-50" />

          <div className="space-y-6">
            {/* Error Message */}
            {fullscreenError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Fullscreen Access Required
                </div>
                <p className="text-red-300 text-xs">{fullscreenError}</p>
              </div>
            )}

            {/* Icon */}
            <div className="w-16 h-16 bg-gray-900 border border-slate-700 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <Cpu className="text-[#60A5FA]" size={32} />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-[#22D3EE] mb-2 tracking-tight">Fullscreen Coding Mode</h1>
              <p className="text-slate-400 text-sm">For the best coding experience, CodeArena requires fullscreen mode</p>
              <p className="text-amber-400 text-xs mt-2">⚠️ Your browser may ask for fullscreen permission - please click "Allow"</p>
            </div>

            {/* Features */}
            <div className="bg-gray-900 border border-slate-800 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Maximum screen space for coding
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Distraction-free environment
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Professional IDE-like experience
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Press ESC anytime to exit
                </li>
              </ul>
            </div>

            {/* Session Info */}
            <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Topic:</span>
                  <span className="text-white ml-2 font-medium">{selectedTopic}</span>
                </div>
                <div>
                  <span className="text-slate-500">Difficulty:</span>
                  <span className={`ml-2 font-medium ${difficulty === 'Easy' ? 'text-green-400' :
                    difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{difficulty}</span>
                </div>
                <div>
                  <span className="text-slate-500">Language:</span>
                  <span className="text-white ml-2 font-medium">{language}</span>
                </div>
                <div>
                  <span className="text-slate-500">Problems:</span>
                  <span className="text-white ml-2 font-medium">{count}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setView("setup");
                  setFullscreenError(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl font-medium text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={proceedWithFullscreen}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${loading
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-[#2563EB] hover:bg-[#4d51e0] text-white shadow-blue-500/30"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Enter Fullscreen
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Coding View ---
  if (view === "coding") {
    const currentQuestion = questions[currentQIndex];

    return (
      <div className="h-screen flex flex-col relative coding-container overflow-hidden" style={{ background: '#0A0E14', color: '#E2E8F0' }}>
        {/* Fullscreen Notification */}
        {showFullscreenNotification && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-[#2563EB]/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-xl border border-blue-400/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span>Entered fullscreen coding mode</span>
              <span className="text-blue-200 text-xs ml-2">Press ESC to exit</span>
            </div>
          </div>
        )}

        {/* Header - Bristom Style */}
        <div className="h-16 border-b border-slate-800 bg-[#0A0E14] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#2563EB]" />
              </div>
              <span className="font-bold text-xl tracking-tight">Code<span className="text-[#2563EB]">Arena</span></span>
            </div>
          </div>

          {/* Central Timer Pill */}
          {timeLimit !== null && (
            <div className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Timer className="w-5 h-5" />
              <span className="font-bold text-lg font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={endSessionAndAnalyze}
              disabled={submitting || analyzingPerformance}
              className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              {analyzingPerformance ? <Loader2 className="w-5 h-5 animate-spin" /> : "End Session"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0A0E14]">
          {/* Left Sidebar - Bristom Style */}
          <div className="w-[260px] border-r border-slate-800 flex flex-col p-6 space-y-8 overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">
                {selectedTopic} - Test #{currentQuestion?.id || '62'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">({difficulty})</p>
              <div className="mt-4 space-y-1 text-[11px] text-slate-500">
                <p>USER: YUGESH</p>
                <p>SESSION ID: {Date.now().toString().slice(-8)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 text-slate-300">Questions</h4>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all border ${currentQIndex === idx
                      ? "bg-[#2563EB] border-[#3B82F6] text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="w-4 h-4 bg-[#6366F1] rounded shadow-sm shadow-indigo-500/20"></div>
                <span>Attempted</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="w-4 h-4 bg-slate-700 rounded"></div>
                <span>Not Attempted</span>
              </div>
            </div>
          </div>

          {/* Middle Panel - Problem Statement */}
          <div className="flex-1 border-r border-slate-800 flex flex-col bg-[#0A0E14]">
            {/* Tabs */}
            <div className="flex p-4 gap-2">
              <button
                onClick={() => setMiddleTab("problem")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${middleTab === "problem"
                  ? "bg-white/10 border-slate-600 text-slate-200"
                  : "bg-white/5 border-slate-700 text-slate-400 hover:bg-white/10"
                  }`}
              >
                Problem
              </button>
              <button
                onClick={() => setMiddleTab("results")}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${middleTab === "results"
                  ? "bg-white/10 border-slate-600 text-slate-200"
                  : "bg-white/5 border-slate-700 text-slate-400 hover:bg-white/10"
                  }`}
              >
                <History size={14} /> Submit
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {middleTab === "problem" ? (
                <>
                  {/* Status Alert (from Bristom) */}
                  {results && results.some(r => r.status !== 'Passed') && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">Didn't score enough</span>
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-bold mb-4">{currentQuestion?.title}</h2>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                      {currentQuestion?.description}
                    </div>

                    {/* Examples styled like Bristom */}
                    <div className="space-y-4">
                      {currentQuestion?.examples.map((ex, i) => (
                        <div key={i} className="space-y-2">
                          <h3 className="text-sm font-bold text-slate-400">Example {i + 1}:</h3>
                          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-sm">
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">Input:</span>
                              <span className="text-cyan-400">{ex.input}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">Output:</span>
                              <span className="text-emerald-400">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <div className="flex gap-2 text-slate-400 italic font-sans text-xs pt-1">
                                <span className="not-italic font-bold text-slate-500 shrink-0">Explanation:</span>
                                <span>{ex.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div className="mt-8">
                      <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Constraints:
                      </h3>
                      <ul className="space-y-2">
                        {currentQuestion?.constraints.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 bg-red-500/50 rounded-full"></div>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4">Test Results</h2>
                  {!results ? (
                    <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-8 text-center">
                      <p className="text-slate-500 italic">No submission results yet. Run or Submit your code to see results here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {results.map((res, i) => (
                        <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-300">Test Case {i + 1}</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${res.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {res.status}
                            </span>
                          </div>
                          {res.status !== 'Passed' && (
                            <div className="mt-2 text-xs font-mono space-y-2">
                              {res.errorDetail && (
                                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-red-400">
                                  <p className="font-bold mb-1 opacity-70">Error Message:</p>
                                  <pre className="whitespace-pre-wrap">{res.errorDetail}</pre>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                  <p className="font-bold mb-1 opacity-50">Expected:</p>
                                  <pre className="text-emerald-400">{res.expectedOutput || "N/A"}</pre>
                                </div>
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                  <p className="font-bold mb-1 opacity-50">Actual:</p>
                                  <pre className="text-red-400">{res.actualOutput || "N/A"}</pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Editor & Results */}
          <div className="flex-1 flex flex-col bg-[#0A0E14] relative">
            {/* Editor Header with Bristom Style Dropdown */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative language-dropdown">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="flex items-center gap-6 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-medium hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-[#2563EB]" />
                      <span>{language}</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showLanguageDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#1A1F26] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                      {(["JavaScript", "Python", "Java", "C++"] as Language[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-slate-700/50 border-b border-slate-800 last:border-0 ${language === lang ? "text-[#2563EB] bg-blue-500/5 font-bold" : "text-slate-400"}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 min-h-0 px-4">
              <div className="h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={userCode}
                  onChange={(value) => setUserCode(value || "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    padding: { top: 20 },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    glyphMargin: false,
                    folding: true,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Bottom Execution Section (Bristom Style) */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showCustomTests}
                      onChange={() => setShowCustomTests(!showCustomTests)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-[#10B981] transition-all"></div>
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Use Custom Testcase</span>
                </label>

                <button
                  onClick={handleRunCustomTests}
                  className="bg-black border border-slate-700 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                >
                  <Play size={14} /> Run custom testcases
                </button>
              </div>

              {/* Custom Input/Output Grid */}
              <div className="grid grid-cols-2 gap-4 h-32">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Custom Input</span>
                  <textarea
                    value={customTestCases[0]?.input || ""}
                    onChange={(e) => {
                      if (customTestCases.length === 0) {
                        setCustomTestCases([{ input: e.target.value, expectedOutput: "" }]);
                      } else {
                        updateCustomTestCase(0, 'input', e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-cyan-400 resize-none hover:border-slate-700 focus:border-[#2563EB] transition-all outline-none"
                    placeholder="Enter your test cases here..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Output</span>
                  <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-sm font-mono overflow-y-auto">
                    {customResults ? (
                      <pre className={`whitespace-pre-wrap ${customResults[0]?.status === 'Passed' ? "text-emerald-400" : "text-red-400"}`}>
                        {customResults[0]?.status === 'Passed'
                          ? (customResults[0]?.actualOutput || "Passed")
                          : (customResults[0]?.errorDetail || customResults[0]?.actualOutput || customResults[0]?.status || "Error")}
                      </pre>
                    ) : (
                      <span className="text-slate-600 italic">Target output will appear here...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Submission Button */}
              <button
                onClick={handleTestCode}
                disabled={executing}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 mt-4"
              >
                {executing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
                Run & Submit
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="h-16 border-t border-slate-800 bg-[#0A0E14] flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => changeQuestion(-1)}
            disabled={currentQIndex === 0}
            className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 transition-all font-bold group"
          >
            <div className="w-8 h-8 rounded-lg border border-slate-700 flex items-center justify-center group-hover:bg-slate-800">
              <ChevronLeft size={20} />
            </div>
            <span>Previous</span>
          </button>

          <div className="flex gap-2">
            {/* Navigated elsewhere or removed */}
          </div>

          <button
            onClick={() => changeQuestion(1)}
            disabled={currentQIndex === questions.length - 1}
            className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 transition-all font-bold group"
          >
            <span>Next</span>
            <div className="w-8 h-8 rounded-lg border border-slate-700 flex items-center justify-center group-hover:bg-slate-800">
              <ChevronRight size={20} />
            </div>
          </button>
        </div>
      </div >
    );
  }

  // --- Performance Analysis View ---
  if (view === "performance-analysis") {
    return (
      <div className="min-h-screen text-slate-300 font-sans p-20" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#22D3EE]">Performance Analysis</h1>
                <p className="text-slate-400 text-sm">Your coding session analysis and recommendations</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Reset all states and go back to setup
                setView("setup");
                setQuestions([]);
                setResults(null);
                setCustomResults(null);
                setPerformanceAnalysis(null);
                setSessionData({ startTime: Date.now(), attempts: [] });
                setShowCustomTests(false);
                setCustomTestCases([]);
              }}
              className="px-6 py-3 bg-[#2563EB] hover:bg-[#4d51e0] text-white rounded-lg font-medium transition-colors"
            >
              New Session
            </button>
          </div>

          {performanceAnalysis && (
            <div className="grid gap-6">
              {/* Overall Rating */}
              <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Overall Performance</h2>
                  <div className="flex items-center gap-2">
                    <div className={`text-3xl font-bold ${performanceAnalysis.overallRating >= 8 ? 'text-green-400' :
                      performanceAnalysis.overallRating >= 6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                      {performanceAnalysis.overallRating}/10
                    </div>
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-6 mx-0.5 rounded ${i < performanceAnalysis.overallRating
                            ? performanceAnalysis.overallRating >= 8 ? 'bg-green-400' :
                              performanceAnalysis.overallRating >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                            : 'bg-slate-700'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{performanceAnalysis.summary}</p>
              </div>

              {/* Code Quality Metrics */}
              <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Code Quality Metrics</h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {performanceAnalysis.codeQuality.readability}/10
                    </div>
                    <div className="text-sm text-slate-400">Readability</div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performanceAnalysis.codeQuality.readability * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {performanceAnalysis.codeQuality.efficiency}/10
                    </div>
                    <div className="text-sm text-slate-400">Efficiency</div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performanceAnalysis.codeQuality.efficiency * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {performanceAnalysis.codeQuality.correctness}/10
                    </div>
                    <div className="text-sm text-slate-400">Correctness</div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${performanceAnalysis.codeQuality.correctness * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Strengths
                  </h2>
                  <ul className="space-y-3">
                    {performanceAnalysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Areas for Improvement
                  </h2>
                  <ul className="space-y-3">
                    {performanceAnalysis.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0"></div>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Recommendations for Next Session
                </h2>
                <div className="grid gap-3">
                  {performanceAnalysis.recommendations.map((recommendation, i) => (
                    <div key={i} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Stats */}
              <div className="bg-gray-900/80 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Session Statistics</h2>
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {Math.round((Date.now() - sessionData.startTime) / 60000)}
                    </div>
                    <div className="text-sm text-slate-400">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-1">
                      {sessionData.attempts.length}
                    </div>
                    <div className="text-sm text-slate-400">Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">
                      {questions.length}
                    </div>
                    <div className="text-sm text-slate-400">Problems</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">
                      {sessionData.attempts.reduce((sum, attempt) =>
                        sum + attempt.results.filter(r => r.status === "Passed").length, 0
                      )}
                    </div>
                    <div className="text-sm text-slate-400">Tests Passed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!performanceAnalysis && (
            <div className="text-center py-16">
              <Loader2 size={48} className="mx-auto text-slate-600 mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Analyzing Performance...</h3>
              <p className="text-slate-500">Please wait while we analyze your coding session</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null; // This should never be reached
};

export default GeminiCodeArena;