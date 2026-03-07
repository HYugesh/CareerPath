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
  isHidden?: boolean;
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
  questionAnalysis?: {
    questionTitle: string;
    questionId: number;
    userApproach: string;
    betterApproaches: string[];
    rating: number;
    feedback: string;
  }[];
}

interface Submission {
  _id: string;
  questionId: string;
  questionTitle: string;
  code: string;
  language: string;
  topic: string;
  difficulty: string;
  testResults: {
    passed: number;
    total: number;
    score: number;
  };
  submittedAt: string;
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
  const [problemPanelWidth, setProblemPanelWidth] = useState<number>(15); // percentage - reduced for more editor space
  const [resultsPanelWidth, setResultsPanelWidth] = useState<number>(50); // percentage - increased for bigger editor
  const [isResizingProblem, setIsResizingProblem] = useState<boolean>(false);
  const [isResizingResults, setIsResizingResults] = useState<boolean>(false);

  // Custom Test Cases State
  const [showCustomTests, setShowCustomTests] = useState(false);
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([]);
  const [customResults, setCustomResults] = useState<ExecutionResult[] | null>(null);
  const [middleTab, setMiddleTab] = useState<"problem" | "results">("problem");
  const [testCaseTab, setTestCaseTab] = useState<"cases" | "results" | "custom">("cases");

  // Custom Input State
  const [customInput, setCustomInput] = useState<string>("");
  
  // Test Cases Tab State
  const [testCasesTab, setTestCasesTab] = useState<"cases" | "results" | "custom">("cases");
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  
  // Submission View State
  const [showSubmittedCode, setShowSubmittedCode] = useState<boolean>(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  
  // Test Cases Panel Height State (for vertical resizing)
  const [testCasesPanelHeight, setTestCasesPanelHeight] = useState<number>(35); // percentage
  const [isResizingTestCases, setIsResizingTestCases] = useState<boolean>(false);

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

      // Constrain between 10% and 30% - reduced for smaller description panel
      if (newWidth >= 10 && newWidth <= 30) {
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

      // Constrain between 50% and 70% - large editor area
      if (newWidth >= 50 && newWidth <= 70) {
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

  // Handle test cases panel vertical resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingTestCases) return;

      // Get the editor panel element to calculate relative position
      const editorPanel = document.querySelector('.editor-panel-container');
      if (!editorPanel) return;

      const rect = editorPanel.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const newHeight = (relativeY / rect.height) * 100;

      // Constrain between 20% and 60%
      if (newHeight >= 20 && newHeight <= 60) {
        setTestCasesPanelHeight(100 - newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingTestCases(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingTestCases) {
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTestCases]);

  // Fullscreen management
  useEffect(() => {
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

    // Show notification when entering coding view in fullscreen
    if (view === "coding" && isFullscreen) {
      setShowFullscreenNotification(true);
      setTimeout(() => setShowFullscreenNotification(false), 3000);
      
      // Hide the main navbar
      document.body.classList.add('fullscreen-coding-mode');
      const navbar = document.querySelector('nav') ||
        document.querySelector('[role="navigation"]') ||
        document.querySelector('.navbar') ||
        document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.display = 'none';
      }
    }

    // Exit fullscreen when leaving coding view
    if (isFullscreen && (view as ViewType) !== "coding") {
      exitFullscreen();
    }

    return () => {
      // Cleanup
    };
  }, [view, isFullscreen]);

  // Separate effect for handling fullscreen changes (ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;

      // Only handle ESC key exits (when user manually exits fullscreen while in coding view)
      if (!isCurrentlyFullscreen && view === "coding" && isFullscreen) {
        console.log("User pressed ESC - exiting session automatically");
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

        // Automatically end session and return to setup
        setView("setup");
        setQuestions([]);
        setResults(null);
        setTestResults(null);
        setCustomInput("");
        setCurrentQIndex(0);
        setUserCode("");
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

    setLoading(true);
    setFullscreenError(null);

    try {
      // If "Previous" mode is selected, ONLY load from history
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
          
          // Load saved code for the first question if available
          const firstQuestion = matchingHistory.questions[0];
          const savedCode = loadCodeForQuestion(firstQuestion.id);
          setUserCode(savedCode || generateStarterCode(language, firstQuestion?.title || ""));
          setCurrentQIndex(0);
          setResults(null);
          setTestResults(null);
          
          // Show fullscreen permission page after loading questions
          setView("fullscreen-permission");
          setLoading(false);
          return;
        } else {
          // No matching history found
          alert(`No previous questions found for ${selectedTopic} (${difficulty}, ${language}, ${count} problems). Please select "New" mode to generate fresh questions or try different settings.`);
          setLoading(false);
          return;
        }
      }

      // "New" mode - generate fresh questions
      // Clear previously saved codes when starting NEW session
      clearSavedCodes();
      
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
        setTestResults(null);
        
        // Show fullscreen permission page after questions are generated
        setView("fullscreen-permission");
      } else {
        throw new Error("No questions received from backend");
      }

    } catch (error) {
      console.error("Failed to generate questions:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      alert(`Failed to generate questions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const proceedWithFullscreen = async () => {
    // Questions are already loaded at this point
    // Just request fullscreen and enter coding mode
    
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        console.log("✓ Fullscreen access granted - entering coding mode");
        
        // Load saved code for the first question if available (only for active sessions)
        const firstQuestion = questions[0];
        if (firstQuestion && questionMode === "New") {
          // For new sessions, load any in-progress code
          const savedCode = loadCodeForQuestion(firstQuestion.id);
          if (savedCode) {
            setUserCode(savedCode);
          }
        } else if (firstQuestion && questionMode === "Previous") {
          // For previous sessions, clear editor and fetch submissions
          setUserCode('');
          await fetchSubmissionsForQuestion(firstQuestion.id);
        }
        
        // Enter coding view
        setView("coding");
        // Reset session data
        setSessionData({ startTime: Date.now(), attempts: [] });
      }
    } catch (fullscreenError) {
      console.error("Fullscreen request failed:", fullscreenError);
      setFullscreenError("Fullscreen access was denied. Please click 'Allow' when your browser asks for fullscreen permission, then try again.");
    }
  };
  // Run Code - Execute code with public test cases using Judge0 API
  const handleRunCode = async () => {
    // Save current code
    if (questions[currentQIndex]) {
      saveCodeForQuestion(questions[currentQIndex].id, userCode);
    }

    // Disable Run button and set loading state
    setIsRunning(true);
    setTestResults(null);

    const currentQuestion = questions[currentQIndex];

    // Determine execution mode based on custom input
    const isCustomMode = customInput.trim().length > 0;
    
    // Switch to appropriate tab based on mode
    if (isCustomMode) {
      setTestCasesTab("custom");
    } else {
      setTestCasesTab("results");
    }

    // Switch to results tab on mobile
    if (isMobile) {
      setActiveTab('results');
    }

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
        
        // Track this attempt for performance analysis
        const executionResults: ExecutionResult[] = response.data.results.map((result: TestResult, index: number) => ({
          testCaseIndex: index,
          status: result.passed ? "Passed" : (result.error ? "Error" : "Failed"),
          actualOutput: result.actualOutput,
          expectedOutput: result.expectedOutput,
          errorDetail: result.error,
          isHidden: result.isHidden || false
        }));
        
        setSessionData(prev => ({
          ...prev,
          attempts: [...prev.attempts, {
            questionId: currentQuestion.id,
            code: userCode,
            results: executionResults,
            timestamp: Date.now()
          }]
        }));
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
    // Save current code
    if (questions[currentQIndex]) {
      saveCodeForQuestion(questions[currentQIndex].id, userCode);
    }

    // Disable Submit button and set loading state
    setIsSubmitting(true);
    
    // Switch to submissions tab in middle panel
    setMiddleTab("results");
    
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
        questionTitle: currentQuestion.title,
        topic: selectedTopic,
        difficulty: difficulty,
        testCases: allTestCases
      });
      
      if (response.data.success) {
        // Store the submission results to display in UI
        setTestResults(response.data);
        
        // Fetch updated submissions list from database
        await fetchSubmissionsForQuestion(currentQuestion.id);
        
        // Track this attempt for performance analysis
        const executionResults: ExecutionResult[] = response.data.results.map((result: TestResult, index: number) => ({
          testCaseIndex: index,
          status: result.passed ? "Passed" : (result.error ? "Error" : "Failed"),
          actualOutput: result.actualOutput,
          expectedOutput: result.expectedOutput,
          errorDetail: result.error,
          isHidden: result.isHidden || false
        }));
        
        setSessionData(prev => ({
          ...prev,
          attempts: [...prev.attempts, {
            questionId: currentQuestion.id,
            code: userCode,
            results: executionResults,
            timestamp: Date.now()
          }]
        }));
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
    // Save current code before ending session
    if (questions[currentQIndex]) {
      saveCodeForQuestion(questions[currentQIndex].id, userCode);
    }

    setAnalyzingPerformance(true);

    try {
      console.log("Analyzing session performance");

      // Collect all saved code for each question (including code that wasn't run/submitted)
      const allUserCodes = questions.map(q => {
        const savedCode = loadCodeForQuestion(q.id);
        return savedCode || '';
      }).filter(code => code.trim().length > 0);

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
        userCodes: allUserCodes // Send all saved code, not just from attempts
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

  // Save code for current question to localStorage
  const saveCodeForQuestion = (questionId: number, code: string) => {
    try {
      const savedCodes = JSON.parse(localStorage.getItem('codeArenaSavedCodes') || '{}');
      savedCodes[questionId] = code;
      localStorage.setItem('codeArenaSavedCodes', JSON.stringify(savedCodes));
    } catch (error) {
      console.error('Failed to save code:', error);
    }
  };

  // Load saved code for a question
  const loadCodeForQuestion = (questionId: number): string => {
    try {
      const savedCodes = JSON.parse(localStorage.getItem('codeArenaSavedCodes') || '{}');
      return savedCodes[questionId] || '';
    } catch (error) {
      console.error('Failed to load code:', error);
      return '';
    }
  };

  // Clear all saved codes (call when starting new session)
  const clearSavedCodes = () => {
    try {
      localStorage.removeItem('codeArenaSavedCodes');
    } catch (error) {
      console.error('Failed to clear saved codes:', error);
    }
  };

  // Fetch submissions from database for current question
  const fetchSubmissionsForQuestion = async (questionId: number) => {
    setLoadingSubmissions(true);
    try {
      const response = await axios.get('/code/submissions');
      if (response.data.success) {
        // Filter submissions for the current question
        const questionSubmissions = response.data.submissions.filter(
          (sub: Submission) => sub.questionId === questionId.toString()
        );
        setSubmissions(questionSubmissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setShowLanguageDropdown(false);

    // Save current code before changing language
    if (questions[currentQIndex]) {
      saveCodeForQuestion(questions[currentQIndex].id, userCode);
    }

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
      // Save current code before switching
      if (questions[currentQIndex]) {
        saveCodeForQuestion(questions[currentQIndex].id, userCode);
      }

      setCurrentQIndex(newIndex);
      
      // Load saved code for the new question
      const newQuestion = questions[newIndex];
      const savedCode = loadCodeForQuestion(newQuestion.id);
      
      // Use saved code if available, otherwise use starter code
      const codeToLoad = savedCode || generateStarterCode(language, newQuestion?.title || "");
      setUserCode(codeToLoad);
      
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
                  Generating Questions...
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
                      onClick={async () => {
                        setQuestions(entry.questions);
                        setSelectedTopic(entry.topic);
                        setDifficulty(entry.difficulty);
                        setLanguage(entry.language);
                        setCount(entry.count);
                        
                        // Clear editor - don't load saved code for previous sessions
                        setUserCode('');
                        setCurrentQIndex(0);
                        setResults(null);
                        setTestResults(null);
                        
                        // Fetch submissions for the first question
                        if (entry.questions[0]) {
                          await fetchSubmissionsForQuestion(entry.questions[0].id);
                        }
                        
                        // Request fullscreen before entering coding mode
                        try {
                          if (document.documentElement.requestFullscreen) {
                            await document.documentElement.requestFullscreen();
                            setIsFullscreen(true);
                            console.log("✓ Fullscreen access granted - entering coding mode from history");
                            setView("coding");
                            // Reset session data
                            setSessionData({ startTime: Date.now(), attempts: [] });
                          }
                        } catch (fullscreenError) {
                          console.error("Fullscreen request failed:", fullscreenError);
                          // If fullscreen fails, still allow entering coding mode
                          alert("Fullscreen access was denied. You can still code, but for the best experience, please allow fullscreen access.");
                          setView("coding");
                          // Reset session data
                          setSessionData({ startTime: Date.now(), attempts: [] });
                        }
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
                  // Clear questions when going back
                  setQuestions([]);
                  setUserCode("");
                }}
                className="flex-1 px-6 py-3 rounded-xl font-medium text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={proceedWithFullscreen}
                className="flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg bg-[#2563EB] hover:bg-[#4d51e0] text-white shadow-blue-500/30"
              >
                Enter Fullscreen
                <ChevronRight size={20} />
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
      <div className="h-screen flex flex-col relative coding-container overflow-hidden" style={{ background: '#1E1E1E', color: '#E2E8F0' }}>
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

        {/* Top Header */}
        <div className="h-12 bg-[#252526] border-b border-[#3E3E42] flex items-center justify-between px-4 shrink-0 z-[200]">
          {/* Left - Session Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#2563EB]" />
              <span className="font-semibold text-slate-300">{selectedTopic}</span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{difficulty}</span>
          </div>

          {/* Center - Timer */}
          {timeLimit !== null && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-md text-white" style={{ background: 'linear-gradient(90deg, #5B21B6 0%, #3B82F6 100%)' }}>
              <Timer className="w-4 h-4" />
              <span className="font-bold font-mono text-sm">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Right - End Exam Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={endSessionAndAnalyze}
              disabled={isSubmitting || analyzingPerformance}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-1.5 rounded-md font-medium transition-all text-sm"
            >
              {analyzingPerformance ? <Loader2 className="w-4 h-4 animate-spin" /> : "End Exam"}
            </button>
          </div>
        </div>

        {/* Main Content Area - 3 Column Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Questions List */}
          {problemPanelVisible ? (
            <>
              <div style={{ width: `${problemPanelWidth}%` }} className="bg-[#1E1E1E] border-r border-[#3E3E42] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-10 bg-[#252526] border-b border-[#3E3E42] flex items-center justify-between px-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase">Questions</span>
                  <button
                    onClick={() => setProblemPanelVisible(false)}
                    className="p-1 hover:bg-[#2D2D30] rounded transition-colors"
                    title="Hide questions panel"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto">
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={async () => {
                        if (questions[currentQIndex]) {
                          saveCodeForQuestion(questions[currentQIndex].id, userCode);
                        }
                        setCurrentQIndex(index);
                        const savedCode = loadCodeForQuestion(q.id);
                        setUserCode(savedCode || generateStarterCode(language, q.title));
                        setTestResults(null);
                        
                        // Fetch submissions for this question
                        await fetchSubmissionsForQuestion(q.id);
                      }}
                      className={`w-full text-left px-3 py-2.5 border-b border-[#3E3E42] transition-colors ${
                        currentQIndex === index
                          ? 'bg-[#2D2D30] border-l-2 border-l-[#3B82F6]'
                          : 'hover:bg-[#252526]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${
                          currentQIndex === index ? 'text-[#3B82F6]' : 'text-slate-500'
                        }`}>
                          {index + 1}.
                        </span>
                        <span className={`text-sm font-medium ${
                          currentQIndex === index ? 'text-white' : 'text-slate-300'
                        }`}>
                          {q.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resize Handle */}
              <div
                className="w-1 bg-[#3E3E42] hover:bg-[#3B82F6] cursor-col-resize transition-colors"
                onMouseDown={() => setIsResizingProblem(true)}
              />
            </>
          ) : (
            /* Show Questions Button (when hidden) */
            <button
              onClick={() => setProblemPanelVisible(true)}
              className="w-8 bg-[#252526] border-r border-[#3E3E42] hover:bg-[#2D2D30] transition-colors flex items-center justify-center"
              title="Show questions panel"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Center Panel - Problem Description */}
          <div 
            style={{ 
              width: `${100 - (problemPanelVisible ? problemPanelWidth : 0) - (resultsPanelVisible ? resultsPanelWidth : 0)}%` 
            }} 
            className="bg-[#1E1E1E] flex flex-col overflow-hidden"
          >

            {/* Tabs */}
            <div className="h-10 bg-[#252526] border-b border-[#3E3E42] flex items-center px-3 gap-4">
              <button
                onClick={() => setMiddleTab("problem")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  middleTab === "problem"
                    ? 'text-white border-b-2 border-[#3B82F6]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setMiddleTab("results")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  middleTab === "results"
                    ? 'text-white border-b-2 border-[#3B82F6]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Submissions
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {middleTab === "problem" && (
                <div className="space-y-6 max-w-4xl">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white">
                    {currentQuestion?.title}
                  </h2>

                  {/* Description */}
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {currentQuestion?.description}
                  </div>

                  {/* Examples */}
                  {currentQuestion?.examples && currentQuestion.examples.length > 0 && (
                    <div className="space-y-4">
                      {currentQuestion.examples.map((ex, i) => (
                        <div key={i} className="bg-[#252526] rounded-lg p-4 border border-[#3E3E42]">
                          <div className="text-sm font-semibold text-slate-300 mb-3">
                            Example {i + 1}:
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-slate-400 text-xs font-semibold">Input:</span>
                              <pre className="bg-[#1E1E1E] p-3 rounded mt-1 text-sm text-slate-300 overflow-x-auto font-mono">
                                {ex.input}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs font-semibold">Output:</span>
                              <pre className="bg-[#1E1E1E] p-3 rounded mt-1 text-sm text-slate-300 overflow-x-auto font-mono">
                                {ex.output}
                              </pre>
                            </div>
                            {ex.explanation && (
                              <div className="text-slate-400 text-xs mt-2">
                                <span className="font-semibold">Explanation:</span> {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {currentQuestion?.constraints && currentQuestion.constraints.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Constraints:
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                        {currentQuestion.constraints.map((constraint, i) => (
                          <li key={i}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {middleTab === "results" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Submissions</h3>
                  
                  {loadingSubmissions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
                    </div>
                  ) : submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((submission, idx) => (
                        <div key={submission._id} className="bg-[#252526] rounded-lg border border-[#3E3E42] overflow-hidden">
                          {/* Submission Header */}
                          <div className="p-4 border-b border-[#3E3E42]">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-slate-300">
                                Submission #{submissions.length - idx}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(submission.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs text-slate-400">Test Cases Passed:</span>
                                <div className={`text-lg font-bold mt-1 ${
                                  submission.testResults.passed === submission.testResults.total
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                }`}>
                                  {submission.testResults.passed} / {submission.testResults.total}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400">Score:</span>
                                <div className="text-lg font-bold text-[#3B82F6] mt-1">
                                  {submission.testResults.score}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* View Code Button */}
                          <button
                            onClick={() => {
                              if (expandedSubmissionId === submission._id) {
                                setExpandedSubmissionId(null);
                              } else {
                                setExpandedSubmissionId(submission._id);
                              }
                            }}
                            className="w-full bg-[#1E1E1E] hover:bg-[#2D2D30] text-slate-300 px-4 py-2 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <Code2 className="w-4 h-4" />
                            {expandedSubmissionId === submission._id ? 'Hide Code' : 'View Code'}
                          </button>

                          {/* Submitted Code Display */}
                          {expandedSubmissionId === submission._id && (
                            <div className="border-t border-[#3E3E42]">
                              <div className="bg-[#252526] px-4 py-2 border-b border-[#3E3E42] flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">CODE</span>
                                <span className="text-xs text-slate-500">{submission.language}</span>
                              </div>
                              <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono bg-[#1E1E1E] max-h-[400px] overflow-y-auto">
                                {submission.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : testResults ? (
                    /* Show current session result if no database submissions */
                    <div className="space-y-6">
                      {/* Summary Card */}
                      <div className="bg-[#252526] rounded-lg p-6 border border-[#3E3E42]">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 text-lg">Test Cases Passed:</span>
                            <span className={`font-bold text-2xl ${
                              testResults.summary.passed === testResults.summary.total
                                ? 'text-green-400'
                                : 'text-yellow-400'
                            }`}>
                              {testResults.summary.passed} / {testResults.summary.total}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 text-lg">Score:</span>
                            <span className="font-bold text-2xl text-[#3B82F6]">
                              {testResults.summary.score}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Code Button */}
                      <button
                        onClick={() => setShowSubmittedCode(!showSubmittedCode)}
                        className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Code2 className="w-5 h-5" />
                        {showSubmittedCode ? 'Hide Submitted Code' : 'View Submitted Code'}
                      </button>

                      {/* Submitted Code Display */}
                      {showSubmittedCode && (
                        <div className="bg-[#1E1E1E] rounded-lg border border-[#3E3E42] overflow-hidden">
                          <div className="bg-[#252526] px-4 py-2 border-b border-[#3E3E42] flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-300">Submitted Code</span>
                            <span className="text-xs text-slate-400">{language}</span>
                          </div>
                          <pre className="p-4 text-sm text-slate-300 overflow-x-auto font-mono max-h-[500px] overflow-y-auto">
                            {userCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet</p>
                      <p className="text-sm mt-2">Submit your code to see results here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor & Test Cases */}
          {resultsPanelVisible && (
            <>
              {/* Resize Handle */}
              <div
                className="w-1 bg-[#3E3E42] hover:bg-[#2563EB] cursor-col-resize transition-colors"
                onMouseDown={() => setIsResizingResults(true)}
              />

              <div style={{ width: `${resultsPanelWidth}%` }} className="bg-[#1E1E1E] border-l border-[#3E3E42] flex flex-col overflow-hidden editor-panel-container">
                {/* Editor Section */}
                <div style={{ height: `${100 - testCasesPanelHeight}%` }} className="flex flex-col overflow-hidden border-b border-[#3E3E42]">
                  {/* Editor Header */}
                  <div className="h-10 bg-[#252526] border-b border-[#3E3E42] flex items-center justify-between px-3 z-[200] relative">
                    {/* Language Selector (moved from right) */}
                    <div className="relative language-dropdown">
                      <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="flex items-center gap-2 bg-[#3E3E42] hover:bg-[#4E4E52] text-slate-300 px-3 py-1 rounded text-xs font-medium transition-all"
                      >
                        <span>{language}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      
                      {showLanguageDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3E3E42] rounded-lg shadow-xl z-[300] min-w-[140px] max-h-[300px] overflow-y-auto">
                          {(["JavaScript", "Python", "Java", "C++", "C", "C#", "Ruby", "Go", "Rust", "PHP", "TypeScript", "Kotlin", "R"] as Language[]).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handleLanguageChange(lang)}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                language === lang
                                  ? "text-white"
                                  : "text-slate-300 hover:bg-[#3E3E42]"
                              }`}
                              style={language === lang ? { background: 'linear-gradient(90deg, #5B21B6 0%, #3B82F6 100%)' } : {}}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Run and Submit Buttons (moved from top header) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={isRunning || isSubmitting}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 text-xs"
                      >
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run
                      </button>
                      <button
                        onClick={handleSubmitCode}
                        disabled={isRunning || isSubmitting}
                        className="bg-[#10B981] hover:bg-[#059669] disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 text-xs"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={getMonacoLanguage(language)}
                      value={userCode}
                      onChange={(value) => setUserCode(value || "")}
                      theme="vs-dark"
                      options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        minimap: { enabled: false },
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        lineNumbers: "on",
                        glyphMargin: false,
                        folding: true,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                </div>

                {/* Horizontal Resize Handle */}
                <div
                  className="h-1 bg-[#3E3E42] hover:bg-[#3B82F6] cursor-row-resize transition-colors"
                  onMouseDown={() => setIsResizingTestCases(true)}
                />

                {/* Test Cases / Results Section */}
                <div style={{ height: `${testCasesPanelHeight}%` }} className="flex flex-col overflow-hidden">
                  {/* Tabs */}
                  <div className="h-10 bg-[#252526] border-b border-[#3E3E42] flex items-center px-3 gap-4">
                    <button
                      onClick={() => setTestCasesTab("cases")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        testCasesTab === "cases"
                          ? "text-white border-b-2 border-[#3B82F6]"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Test Cases
                    </button>
                    <button
                      onClick={() => setTestCasesTab("results")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        testCasesTab === "results"
                          ? "text-white border-b-2 border-[#3B82F6]"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Test Results
                    </button>
                    <button
                      onClick={() => setTestCasesTab("custom")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        testCasesTab === "custom"
                          ? "text-white border-b-2 border-[#3B82F6]"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Input / Output
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden bg-[#1E1E1E]">
                    {/* Test Cases Tab - Show public test cases from description */}
                    {testCasesTab === "cases" && (
                      <div className="h-full flex">
                        {/* Test Case List */}
                        <div className="w-32 border-r border-[#3E3E42] bg-[#252526] p-2 space-y-2 overflow-y-auto">
                          {currentQuestion?.examples?.map((ex, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTestCaseIndex(index)}
                              className={`w-full px-3 py-2 text-xs font-semibold rounded transition-colors text-left ${
                                selectedTestCaseIndex === index
                                  ? "bg-white text-black"
                                  : "bg-[#1E1E1E] text-slate-300 hover:bg-[#2D2D30]"
                              }`}
                            >
                              Case {index + 1}
                            </button>
                          ))}
                        </div>
                        
                        {/* Test Case Details */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                          {currentQuestion?.examples?.[selectedTestCaseIndex] && (
                            <>
                              <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  Input
                                </label>
                                <div className="bg-[#252526] border border-[#3E3E42] rounded px-3 py-2 text-slate-300 text-sm font-mono whitespace-pre-wrap">
                                  {currentQuestion.examples[selectedTestCaseIndex].input}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                  Output
                                </label>
                                <div className="bg-[#252526] border border-[#3E3E42] rounded px-3 py-2 text-slate-300 text-sm font-mono whitespace-pre-wrap">
                                  {currentQuestion.examples[selectedTestCaseIndex].output}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Test Results Tab - Show run/submit results */}
                    {testCasesTab === "results" && (
                      <div className="h-full overflow-y-auto p-4">
                        {testResults ? (
                          <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-[#252526] rounded-lg p-4 border border-[#3E3E42]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-300">Test Cases Passed:</span>
                                <span className={`font-bold ${
                                  testResults.summary.passed === testResults.summary.total
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                }`}>
                                  {testResults.summary.passed} / {testResults.summary.total}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Score:</span>
                                <span className="font-bold text-[#3B82F6]">
                                  {testResults.summary.score}%
                                </span>
                              </div>
                            </div>

                            {/* Individual Results */}
                            {testResults.results.map((result, index) => (
                              <div
                                key={index}
                                className={`bg-[#252526] rounded-lg p-4 border ${
                                  result.passed
                                    ? 'border-green-500/30'
                                    : 'border-red-500/30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-slate-300">
                                    Test Case {index + 1}
                                    {result.isHidden && <span className="ml-2 text-xs text-slate-500">(Hidden)</span>}
                                  </span>
                                  {result.passed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                  )}
                                </div>
                                {!result.isHidden && result.error && (
                                  <div className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded">
                                    {result.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                            Run your code to see test results
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Input/Output Tab */}
                    {testCasesTab === "custom" && (
                      <div className="h-full overflow-y-auto p-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Custom Input
                            </label>
                            {customInput && (
                              <button 
                                onClick={() => setCustomInput("")}
                                className="hover:bg-[#3E3E42] p-1 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                              </button>
                            )}
                          </div>
                          <textarea
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            className="w-full h-32 bg-[#252526] border border-[#3E3E42] rounded px-3 py-2 text-slate-300 text-xs font-mono focus:outline-none focus:border-[#3B82F6] resize-none"
                            placeholder="Enter your custom test input here..."
                          />
                        </div>
                        
                        {testResults && testResults.isCustomMode && (
                          <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Output
                            </label>
                            <div className="bg-[#252526] border border-[#3E3E42] rounded px-3 py-2 text-slate-300 text-xs font-mono whitespace-pre-wrap min-h-[80px]">
                              {testResults.results[0]?.actualOutput || testResults.results[0]?.error || "No output"}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Show Results Panel Button (when hidden) */}
          {!resultsPanelVisible && (
            <button
              onClick={() => setResultsPanelVisible(true)}
              className="w-8 bg-[#252526] border-l border-[#3E3E42] hover:bg-[#2D2D30] transition-colors flex items-center justify-center"
              title="Show editor panel"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Performance Analysis View ---
  if (view === "performance-analysis") {
    return (
      <div className="min-h-screen text-slate-300 font-sans" style={{ background: 'linear-gradient(135deg, #0B0E14 0%, #1a1f2e 100%)' }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Header with Gradient */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Award className="text-white" size={40} />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                      Performance Analysis
                    </h1>
                    <p className="text-slate-400">Comprehensive evaluation of your coding session</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setView("setup");
                    setQuestions([]);
                    setResults(null);
                    setCustomResults(null);
                    setPerformanceAnalysis(null);
                    setSessionData({ startTime: Date.now(), attempts: [] });
                    setShowCustomTests(false);
                    setCustomTestCases([]);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Session
                </button>
              </div>
            </div>
          </div>

          {performanceAnalysis && (
            <div className="space-y-8">
              {/* Overall Performance Card with Visual Rating */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-cyan-400" />
                        Overall Performance Score
                      </h2>
                      <p className="text-slate-400 text-sm">Your aggregate performance across all problems</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-6xl font-black mb-1 ${
                        performanceAnalysis.overallRating >= 8 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        performanceAnalysis.overallRating >= 6 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        'bg-gradient-to-r from-red-400 to-pink-400'
                      } bg-clip-text text-transparent`}>
                        {performanceAnalysis.overallRating}
                      </div>
                      <div className="text-slate-400 text-sm font-medium">out of 10</div>
                    </div>
                  </div>
                  
                  {/* Visual Rating Bar */}
                  <div className="mb-6">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                            i < performanceAnalysis.overallRating
                              ? performanceAnalysis.overallRating >= 8 ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50' :
                                performanceAnalysis.overallRating >= 6 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50' :
                                'bg-gradient-to-r from-red-400 to-pink-500 shadow-lg shadow-red-500/50'
                              : 'bg-slate-700/50'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Needs Work</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-slate-200 leading-relaxed text-lg">{performanceAnalysis.summary}</p>
                  </div>
                </div>
              </div>

              {/* Code Quality Metrics - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Code2 className="w-7 h-7 text-blue-400" />
                    Code Quality Breakdown
                  </h2>
                  <div className="grid grid-cols-3 gap-8">
                    {/* Readability */}
                    <div className="relative group/metric">
                      <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-xl group-hover/metric:bg-blue-500/10 transition-all"></div>
                      <div className="relative bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Readability</div>
                          <BookOpen className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-4xl font-black text-blue-400 mb-4">
                          {performanceAnalysis.codeQuality.readability}<span className="text-2xl text-slate-600">/10</span>
                        </div>
                        <div className="relative w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/50"
                            style={{ width: `${performanceAnalysis.codeQuality.readability * 10}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-3">How easy your code is to understand</p>
                      </div>
                    </div>

                    {/* Efficiency */}
                    <div className="relative group/metric">
                      <div className="absolute inset-0 bg-cyan-500/5 rounded-xl blur-xl group-hover/metric:bg-cyan-500/10 transition-all"></div>
                      <div className="relative bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Efficiency</div>
                          <Zap className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-4xl font-black text-cyan-400 mb-4">
                          {performanceAnalysis.codeQuality.efficiency}<span className="text-2xl text-slate-600">/10</span>
                        </div>
                        <div className="relative w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-1000 shadow-lg shadow-cyan-500/50"
                            style={{ width: `${performanceAnalysis.codeQuality.efficiency * 10}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-3">Time & space complexity optimization</p>
                      </div>
                    </div>

                    {/* Correctness */}
                    <div className="relative group/metric">
                      <div className="absolute inset-0 bg-green-500/5 rounded-xl blur-xl group-hover/metric:bg-green-500/10 transition-all"></div>
                      <div className="relative bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Correctness</div>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-4xl font-black text-green-400 mb-4">
                          {performanceAnalysis.codeQuality.correctness}<span className="text-2xl text-slate-600">/10</span>
                        </div>
                        <div className="relative w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-lg shadow-green-500/50"
                            style={{ width: `${performanceAnalysis.codeQuality.correctness * 10}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-3">Accuracy of your solutions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Question Analysis - Enhanced */}
              {performanceAnalysis.questionAnalysis && performanceAnalysis.questionAnalysis.length > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <Terminal className="w-7 h-7 text-purple-400" />
                      Detailed Question Analysis
                    </h2>
                    <div className="space-y-6">
                      {performanceAnalysis.questionAnalysis.map((qa, index) => (
                        <div key={qa.questionId} className="relative group/question">
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/5 to-slate-600/5 rounded-xl blur-xl group-hover/question:from-slate-700/10 group-hover/question:to-slate-600/10 transition-all"></div>
                          <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all">
                            {/* Question Header with Rating Badge */}
                            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-6 py-4 border-b border-slate-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{qa.questionTitle}</h3>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400">Individual Performance</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${
                                    qa.rating >= 8 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' :
                                    qa.rating >= 6 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30' :
                                    'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    {qa.rating >= 8 ? <CheckCircle2 className="w-5 h-5" /> :
                                     qa.rating >= 6 ? <AlertCircle className="w-5 h-5" /> :
                                     <XCircle className="w-5 h-5" />}
                                    {qa.rating}/10
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-6 space-y-5">
                              {/* Your Approach */}
                              <div className="relative">
                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                                <div className="pl-4">
                                  <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                    <Code2 className="w-4 h-4" />
                                    Your Approach
                                  </h4>
                                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                                    <p className="text-slate-300 leading-relaxed">{qa.userApproach}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Better Approaches */}
                              {qa.betterApproaches && qa.betterApproaches.length > 0 && (
                                <div className="relative">
                                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full"></div>
                                  <div className="pl-4">
                                    <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                      <Sparkles className="w-4 h-4" />
                                      Recommended Approaches
                                    </h4>
                                    <div className="space-y-3">
                                      {qa.betterApproaches.map((approach, i) => (
                                        <div key={i} className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg">
                                              {i + 1}
                                            </div>
                                            <p className="text-slate-300 leading-relaxed flex-1">{approach}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Feedback */}
                              <div className="relative">
                                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                                <div className="pl-4">
                                  <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Expert Feedback
                                  </h4>
                                  <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-lg p-4">
                                    <p className="text-slate-300 leading-relaxed">{qa.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl group-hover:blur-3xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        Your Strengths
                      </span>
                    </h2>
                    <ul className="space-y-3">
                      {performanceAnalysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-slate-300 leading-relaxed">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-2xl group-hover:blur-3xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        Growth Areas
                      </span>
                    </h2>
                    <ul className="space-y-3">
                      {performanceAnalysis.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
                            <Zap className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-slate-300 leading-relaxed">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Personalized Recommendations
                    </span>
                  </h2>
                  <div className="grid gap-4">
                    {performanceAnalysis.recommendations.map((recommendation, i) => (
                      <div key={i} className="relative group/rec">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl blur-lg group-hover/rec:from-blue-500/10 group-hover/rec:to-purple-500/10 transition-all"></div>
                        <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg">
                              {i + 1}
                            </div>
                            <p className="text-slate-300 leading-relaxed flex-1 pt-1">{recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Stats */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-cyan-400" />
                    Session Statistics
                  </h2>
                  <div className="grid grid-cols-4 gap-6">
                    <div className="relative group/stat">
                      <div className="absolute inset-0 bg-cyan-500/5 rounded-xl blur-lg group-hover/stat:bg-cyan-500/10 transition-all"></div>
                      <div className="relative text-center bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
                        <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
                        <div className="text-3xl font-black text-cyan-400 mb-2">
                          {Math.round((Date.now() - sessionData.startTime) / 60000)}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Minutes</div>
                      </div>
                    </div>
                    <div className="relative group/stat">
                      <div className="absolute inset-0 bg-orange-500/5 rounded-xl blur-lg group-hover/stat:bg-orange-500/10 transition-all"></div>
                      <div className="relative text-center bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-orange-500/50 transition-all">
                        <Send className="w-6 h-6 text-orange-400 mx-auto mb-3" />
                        <div className="text-3xl font-black text-orange-400 mb-2">
                          {sessionData.attempts.length}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Attempts</div>
                      </div>
                    </div>
                    <div className="relative group/stat">
                      <div className="absolute inset-0 bg-purple-500/5 rounded-xl blur-lg group-hover/stat:bg-purple-500/10 transition-all"></div>
                      <div className="relative text-center bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-purple-500/50 transition-all">
                        <Code2 className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                        <div className="text-3xl font-black text-purple-400 mb-2">
                          {questions.length}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Problems</div>
                      </div>
                    </div>
                    <div className="relative group/stat">
                      <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-lg group-hover/stat:bg-emerald-500/10 transition-all"></div>
                      <div className="relative text-center bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                        <div className="text-3xl font-black text-emerald-400 mb-2">
                          {sessionData.attempts.reduce((sum, attempt) =>
                            sum + attempt.results.filter(r => r.status === "Passed").length, 0
                          )}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tests Passed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!performanceAnalysis && (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                <Loader2 size={64} className="relative text-cyan-400 mb-6 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analyzing Your Performance...</h3>
              <p className="text-slate-400">Our AI is evaluating your code and generating personalized insights</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null; // This should never be reached
};

export default GeminiCodeArena;