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
type Language = "JavaScript" | "Python" | "Java" | "C++" | "C" | "C#" | "Ruby" | "Go" | "Rust" | "PHP" | "TypeScript" | "Kotlin" | "R";
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
  input_format?: string;
  output_format?: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: string;
  testCases: TestCase[];
}

interface ExecutionResult {
  testCaseIndex: number;
  status: "Passed" | "Failed" | "Error";
  actualOutput?: string;
  expectedOutput?: any;
  errorDetail?: string;
  isHidden: boolean;
}

interface TestResult {
  input: Record<string, any>;
  expectedOutput: any;
  actualOutput: string | null;
  passed: boolean;
  error: string | null;
  executionTime: number;
}

interface ExecutionResponse {
  success: boolean;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    score: number;
  };
  message?: string;
  isCustomMode?: boolean;
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
    case "C":
      return "c";
    case "C#":
      return "csharp";
    case "Ruby":
      return "ruby";
    case "Go":
      return "go";
    case "Rust":
      return "rust";
    case "PHP":
      return "php";
    case "TypeScript":
      return "typescript";
    case "Kotlin":
      return "kotlin";
    case "R":
      return "r";
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

// Extract function name from user code
const extractFunctionName = (code: string): string => {
  // JavaScript: function functionName(...)
  const jsMatch = code.match(/function\s+(\w+)/);
  if (jsMatch) return jsMatch[1];
  
  // Python: def function_name(...)
  const pyMatch = code.match(/def\s+(\w+)/);
  if (pyMatch) return pyMatch[1];
  
  // Default fallback
  return 'solution';
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
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenNotification, setShowFullscreenNotification] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  // Code Execution State (for Judge0 API integration)
  const [testResults, setTestResults] = useState<ExecutionResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Responsive Layout State
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<'problem' | 'editor' | 'results'>('problem');

  // Panel visibility state for desktop
  const [problemPanelVisible, setProblemPanelVisible] = useState<boolean>(true);
  const [resultsPanelVisible, setResultsPanelVisible] = useState<boolean>(true);
  
  // Panel width state for resizing
  const [problemPanelWidth, setProblemPanelWidth] = useState<number>(30); // percentage
  const [resultsPanelWidth, setResultsPanelWidth] = useState<number>(20); // percentage
  const [isResizingProblem, setIsResizingProblem] = useState<boolean>(false);
  const [isResizingResults, setIsResizingResults] = useState<boolean>(false);

  // Custom Test Cases State
  const [showCustomTests, setShowCustomTests] = useState(false);
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([]);
  const [customResults, setCustomResults] = useState<ExecutionResult[] | null>(null);
  const [middleTab, setMiddleTab] = useState<"problem" | "results">("problem");

  // Custom Input State
  const [customInput, setCustomInput] = useState<string>("");

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

  // Handle viewport resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      setIsMobile(width < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Handle problem panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingProblem) return;

      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      // Constrain between 15% and 50%
      if (newWidth >= 15 && newWidth <= 50) {
        setProblemPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingProblem(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingProblem) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingProblem]);

  // Handle results panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingResults) return;

      const containerWidth = window.innerWidth;
      const distanceFromRight = containerWidth - e.clientX;
      const newWidth = (distanceFromRight / containerWidth) * 100;

      // Constrain between 15% and 40%
      if (newWidth >= 15 && newWidth <= 40) {
        setResultsPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingResults(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingResults) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingResults]);

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
  // Run Code - Execute code with public test cases using Judge0 API
  const handleRunCode = async () => {
    // Disable Run button and set loading state
    setIsRunning(true);
    setTestResults(null);

    // Switch to results tab on mobile
    if (isMobile) {
      setActiveTab('results');
    }

    const currentQuestion = questions[currentQIndex];

    // Determine execution mode based on custom input
    const isCustomMode = customInput.trim().length > 0;

    let testCases;
    if (isCustomMode) {
      // Custom Input Mode: Create synthetic test case
      testCases = [{
        input: customInput,
        expectedOutput: null,
        isHidden: false
      }];
    } else {
      // Test Case Mode: Use predefined public test cases
      testCases = currentQuestion.testCases.filter(tc => !tc.isHidden);
    }

    try {
      // Send POST request to /code/run
      const response = await axios.post('/code/run', {
        code: userCode,
        language: language.toLowerCase(),
        testCases: testCases,
        isCustomMode: isCustomMode  // Flag for backend
      });

      // Update testResults state with response
      if (response.data.success) {
        setTestResults(response.data);
        // Results will be displayed in the UI, no need for alert
      }

    } catch (error) {
      console.error("Run code failed:", error);
      // Handle errors by showing error in test results
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      setTestResults({
        success: false,
        summary: { passed: 0, total: 1, failed: 1, score: 0 },
        results: [{
          input: {},
          expectedOutput: null,
          actualOutput: null,
          passed: false,
          error: `Failed to run code: ${errorMessage}`,
          executionTime: 0
        }],
        isCustomMode: isCustomMode
      });
    } finally {
      // Re-enable Run button after completion
      setIsRunning(false);
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

  // Submit Code - Submit code with all test cases using Judge0 API
  const handleSubmitCode = async () => {
    // Disable Submit button and set loading state
    setIsSubmitting(true);
    
    // Switch to results tab on mobile
    if (isMobile) {
      setActiveTab('results');
    }
    
    const currentQuestion = questions[currentQIndex];
    
    try {
      // Combine publicTestCases and privateTestCases
      const allTestCases = currentQuestion.testCases;
      
      // Send POST request to /code/submit with code, language, problemId, all testCases
      const response = await axios.post('/code/submit', {
        code: userCode,
        language: language.toLowerCase(),
        problemId: currentQuestion.id.toString(),
        testCases: allTestCases
      });
      
      if (response.data.success) {
        // Store the submission results to display in UI
        setTestResults(response.data);
        // Results will be displayed in the UI, no need for alert
      }
      
    } catch (error) {
      console.error("Submit code failed:", error);
      // Handle errors by showing error in test results
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      setTestResults({
        success: false,
        summary: { passed: 0, total: 1, failed: 1, score: 0 },
        results: [{
          input: {},
          expectedOutput: null,
          actualOutput: null,
          passed: false,
          error: `Failed to submit code: ${errorMessage}`,
          executionTime: 0
        }]
      });
    } finally {
      // Re-enable Submit button after completion
      setIsSubmitting(false);
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
    // Return blank editor for all languages
    return '';
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
      // Clear test results when changing questions
      setTestResults(null);
    }
  };

  const handleTabSwitch = (tab: 'problem' | 'editor' | 'results') => {
    setActiveTab(tab);
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
            
            {/* Language Selector */}
            <div className="relative language-dropdown">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Code2 className="w-4 h-4" />
                <span>{language}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[160px] max-h-[400px] overflow-y-auto">
                  {(["JavaScript", "Python", "Java", "C++", "C", "C#", "Ruby", "Go", "Rust", "PHP", "TypeScript", "Kotlin", "R"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-2.5 transition-colors ${
                        language === lang
                          ? "bg-[#2563EB] text-white"
                          : "text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
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
              disabled={isSubmitting || analyzingPerformance}
              className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              {analyzingPerformance ? <Loader2 className="w-5 h-5 animate-spin" /> : "End Session"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0A0E14]">
          {!isMobile ? (
            // Desktop 3-Column Layout with Resizable Panels
            <div className="flex h-full w-full">
              {/* Problem Panel - Collapsible & Resizable */}
              {problemPanelVisible && (
                <>
                  <div style={{ width: `${problemPanelWidth}%` }} className="border-r border-slate-800 overflow-y-auto flex flex-col relative">
                    {/* Panel Header with Minimize Button */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
                      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Problem
                      </h3>
                      <button
                        onClick={() => setProblemPanelVisible(false)}
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                        title="Hide problem panel"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  
                  <div className="p-6 space-y-6">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-slate-200 mb-4">
                    {currentQuestion?.title}
                  </h2>

                  {/* Description */}
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {currentQuestion?.description}
                  </div>

                  {/* Input Format */}
                  {currentQuestion?.input_format && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        Input Format
                      </h3>
                      <div className="text-slate-400 text-sm">
                        {currentQuestion.input_format}
                      </div>
                    </div>
                  )}

                  {/* Output Format */}
                  {currentQuestion?.output_format && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        Output Format
                      </h3>
                      <div className="text-slate-400 text-sm">
                        {currentQuestion.output_format}
                      </div>
                    </div>
                  )}

                  {/* Constraints */}
                  {currentQuestion?.constraints && currentQuestion.constraints.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        Constraints
                      </h3>
                      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                        {currentQuestion.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {currentQuestion?.examples && currentQuestion.examples.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        Examples
                      </h3>
                      {currentQuestion.examples.map((ex, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-lg p-4 mb-3">
                          <div className="text-xs text-slate-500 mb-2">Example {i + 1}</div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-slate-400 text-sm">Input:</span>
                              <pre className="bg-slate-900 p-2 rounded mt-1 text-sm text-slate-300 overflow-x-auto">
                                {ex.input}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">Output:</span>
                              <pre className="bg-slate-900 p-2 rounded mt-1 text-sm text-slate-300 overflow-x-auto">
                                {ex.output}
                              </pre>
                            </div>
                            {ex.explanation && (
                              <div className="text-slate-400 text-sm mt-2">
                                <span className="font-semibold">Explanation:</span> {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  </div>
                  
                  {/* Resize Handle for Problem Panel */}
                  <div
                    className="w-1 bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors relative group"
                    onMouseDown={() => setIsResizingProblem(true)}
                    title="Drag to resize"
                  >
                    <div className="absolute inset-y-0 -left-1 -right-1" />
                  </div>
                </>
              )}

              {/* Show Problem Panel Button (when hidden) */}
              {!problemPanelVisible && (
                <button
                  onClick={() => setProblemPanelVisible(true)}
                  className="w-10 border-r border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors flex items-center justify-center"
                  title="Show problem panel"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Editor Panel - Flexible Width */}
              <div 
                style={{ 
                  width: `${100 - (problemPanelVisible ? problemPanelWidth : 0) - (resultsPanelVisible ? resultsPanelWidth : 0)}%` 
                }} 
                className="border-r border-slate-800 flex flex-col overflow-hidden"
              >
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden">
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

                {/* Custom Input Textarea */}
                <div className="border-t border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400">
                      Custom Input
                    </label>
                    {customInput && (
                      <button 
                        onClick={() => setCustomInput("")}
                        className="hover:bg-slate-800 p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="w-full h-[75px] bg-slate-900 border border-slate-800 
                               rounded-lg p-3 text-sm font-mono text-slate-300 
                               focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Enter custom input (one value per line)..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="border-t border-slate-800 p-4 flex gap-3">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run Code
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSubmitCode}
                    disabled={isRunning || isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Show Results Panel Button (when hidden) */}
              {!resultsPanelVisible && (
                <button
                  onClick={() => setResultsPanelVisible(true)}
                  className="w-10 border-r border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors flex items-center justify-center"
                  title="Show results panel"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Results Panel - Collapsible & Resizable */}
              {resultsPanelVisible && (
                <>
                  {/* Resize Handle for Results Panel */}
                  <div
                    className="w-1 bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors relative group"
                    onMouseDown={() => setIsResizingResults(true)}
                    title="Drag to resize"
                  >
                    <div className="absolute inset-y-0 -left-1 -right-1" />
                  </div>
                  
                  <div style={{ width: `${resultsPanelWidth}%` }} className="overflow-y-auto flex flex-col relative">
                  {/* Panel Header with Minimize Button */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Results
                    </h3>
                    <button
                      onClick={() => setResultsPanelVisible(false)}
                      className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                      title="Hide results panel"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                {!testResults ? (
                  <div className="p-6 text-center text-slate-500">
                    <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Run your code to see results</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-2">Test Results</div>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-slate-200">
                          {testResults.summary.passed}/{testResults.summary.total}
                        </div>
                        <div className="text-sm text-slate-400">
                          Score: {testResults.summary.score}%
                        </div>
                      </div>
                    </div>

                    {/* Individual Results */}
                    <div className="space-y-2">
                      {testResults.results.map((result, index) => (
                        <div
                          key={index}
                          className={`rounded-lg p-3 border ${
                            result.passed
                              ? 'bg-green-900/20 border-green-700/50'
                              : 'bg-red-900/20 border-red-700/50'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result.passed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="font-semibold text-sm text-slate-200">
                                Test Case {index + 1}
                              </span>
                            </div>
                            {result.executionTime && (
                              <span className="text-xs text-slate-400">
                                {result.executionTime}ms
                              </span>
                            )}
                          </div>

                          {/* Expected Output */}
                          <div className="mb-2">
                            <div className="text-xs text-slate-500 mb-1">Expected:</div>
                            <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(result.expectedOutput)}
                            </pre>
                          </div>

                          {/* Actual Output */}
                          <div className="mb-2">
                            <div className="text-xs text-slate-500 mb-1">Actual:</div>
                            <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                              {result.actualOutput || 'No output'}
                            </pre>
                          </div>

                          {/* Error Message */}
                          {result.error && (
                            <div className="text-xs text-red-400 mt-2">
                              {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                </div>
                </>
              )}
            </div>
          ) : (
            // Mobile Tabbed Layout
            <div className="flex flex-col h-full w-full">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => handleTabSwitch('problem')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'problem'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Problem
                </button>
                <button
                  onClick={() => handleTabSwitch('editor')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'editor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => handleTabSwitch('results')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'results'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Results
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'problem' && (
                  <div className="p-6 space-y-6">
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">
                      {currentQuestion?.title}
                    </h2>

                    {/* Description */}
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {currentQuestion?.description}
                    </div>

                    {/* Input Format */}
                    {currentQuestion?.input_format && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                          Input Format
                        </h3>
                        <div className="text-slate-400 text-sm">
                          {currentQuestion.input_format}
                        </div>
                      </div>
                    )}

                    {/* Output Format */}
                    {currentQuestion?.output_format && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                          Output Format
                        </h3>
                        <div className="text-slate-400 text-sm">
                          {currentQuestion.output_format}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {currentQuestion?.constraints && currentQuestion.constraints.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                          Constraints
                        </h3>
                        <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                          {currentQuestion.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Examples */}
                    {currentQuestion?.examples && currentQuestion.examples.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                          Examples
                        </h3>
                        {currentQuestion.examples.map((ex, i) => (
                          <div key={i} className="bg-slate-800/50 rounded-lg p-4 mb-3">
                            <div className="text-xs text-slate-500 mb-2">Example {i + 1}</div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-slate-400 text-sm">Input:</span>
                                <pre className="bg-slate-900 p-2 rounded mt-1 text-sm text-slate-300 overflow-x-auto">
                                  {ex.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-slate-400 text-sm">Output:</span>
                                <pre className="bg-slate-900 p-2 rounded mt-1 text-sm text-slate-300 overflow-x-auto">
                                  {ex.output}
                                </pre>
                              </div>
                              {ex.explanation && (
                                <div className="text-slate-400 text-sm mt-2">
                                  <span className="font-semibold">Explanation:</span> {ex.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'editor' && (
                  <div className="flex flex-col h-full">
                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden">
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

                    {/* Custom Input Textarea */}
                    <div className="border-t border-slate-800 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-400">
                          Custom Input
                        </label>
                        {customInput && (
                          <button 
                            onClick={() => setCustomInput("")}
                            className="hover:bg-slate-800 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="w-full h-[120px] bg-slate-900 border border-slate-800 
                                   rounded-lg p-3 text-sm font-mono text-slate-300 
                                   focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter custom input (one value per line)..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-800 p-4 flex gap-3">
                      <button
                        onClick={handleRunCode}
                        disabled={isRunning || isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Run Code
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={isRunning || isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'results' && (
                  <div className="p-4">
                    {!testResults ? (
                      <div className="p-6 text-center text-slate-500">
                        <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Run your code to see results</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Summary */}
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-2">Test Results</div>
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-slate-200">
                              {testResults.summary.passed}/{testResults.summary.total}
                            </div>
                            <div className="text-sm text-slate-400">
                              Score: {testResults.summary.score}%
                            </div>
                          </div>
                        </div>

                        {/* Individual Results */}
                        <div className="space-y-2">
                          {testResults.results.map((result, index) => (
                            <div
                              key={index}
                              className={`rounded-lg p-3 border ${
                                result.passed
                                  ? 'bg-green-900/20 border-green-700/50'
                                  : 'bg-red-900/20 border-red-700/50'
                              }`}
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {result.passed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  <span className="font-semibold text-sm text-slate-200">
                                    Test Case {index + 1}
                                  </span>
                                </div>
                                {result.executionTime && (
                                  <span className="text-xs text-slate-400">
                                    {result.executionTime}ms
                                  </span>
                                )}
                              </div>

                              {/* Expected Output */}
                              <div className="mb-2">
                                <div className="text-xs text-slate-500 mb-1">Expected:</div>
                                <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                                  {JSON.stringify(result.expectedOutput)}
                                </pre>
                              </div>

                              {/* Actual Output */}
                              <div className="mb-2">
                                <div className="text-xs text-slate-500 mb-1">Actual:</div>
                                <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                                  {result.actualOutput || 'No output'}
                                </pre>
                              </div>

                              {/* Error Message */}
                              {result.error && (
                                <div className="text-xs text-red-400 mt-2">
                                  {result.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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