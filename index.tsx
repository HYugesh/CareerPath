import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Cpu,
  RefreshCw,
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
  Lightbulb,
  Award,
  Trash2
} from "lucide-react";

// --- Types ---

type Difficulty = "Easy" | "Medium" | "Hard";
type Language = "JavaScript" | "Python" | "Java" | "C++";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean; // "Private" test cases
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

interface AnalysisResult {
  isOptimized: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string;
  rating: number; // 1-10
}

// --- API Client ---

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const App = () => {
  const [view, setView] = useState<"setup" | "coding">("setup");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // Setup State
  const [topic, setTopic] = useState("Arrays & Hashing");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [count, setCount] = useState(3);
  const [timeLimit, setTimeLimit] = useState<number | null>(30); // Minutes, null for unlimited

  // Coding State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [results, setResults] = useState<ExecutionResult[] | null>(null);
  const [executing, setExecuting] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0); // Seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const topics = [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Dynamic Programming",
    "Graphs"
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
    setLoading(true);
    setLoadingMessage("Gemini is crafting your interview problems...");
    
    try {
      const model = "gemini-2.5-flash";
      const prompt = `Create ${count} unique Data Structures and Algorithms problems.
      Topic: ${topic}
      Difficulty: ${difficulty}
      Language: ${language}
      
      Requirements:
      1. Similar style to LeetCode/GeeksForGeeks.
      2. 'starterCode': Just provide the function signature/definition that is expected.
      3. 'examples': Provide 2 public examples for the problem description.
      4. 'testCases': Must include ALL test cases to be run. Specifically, include the 2 public examples (isHidden: false) AND 2 additional hidden edge cases (isHidden: true). Total 4 test cases.
      5. Ensure test case inputs/outputs are strings or clearly formatted values.
      6. In the 'description', explicitly state the required function name and signature the user must implement so they know what to write in a blank editor.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
                examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      input: { type: Type.STRING },
                      output: { type: Type.STRING },
                      explanation: { type: Type.STRING }
                    }
                  }
                },
                starterCode: { type: Type.STRING },
                testCases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      input: { type: Type.STRING },
                      expectedOutput: { type: Type.STRING },
                      isHidden: { type: Type.BOOLEAN }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "[]");
      if (data.length > 0) {
        setQuestions(data);
        setUserCode(""); // Start with blank editor
        setCurrentQIndex(0);
        setResults(null);
        setAnalysis(null);
        setView("coding");
      }
    } catch (error) {
      console.error("Failed to generate questions", error);
      alert("Something went wrong generating questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setResults(null);
    setAnalysis(null);
    const currentQuestion = questions[currentQIndex];

    try {
      const prompt = `
        You are a Code Execution Engine and Judge.
        
        Problem Description: ${currentQuestion.description}
        Language: ${language}
        
        User Code:
        ${userCode}
        
        Test Cases to Execute:
        ${JSON.stringify(currentQuestion.testCases.map((tc, i) => ({
            id: i,
            input: tc.input,
            expected: tc.expectedOutput
        })))}
        
        Task:
        1. Mentally execute the user's code with the provided input for EACH test case.
        2. Determine if the Actual Output matches the Expected Output perfectly.
        3. If there is a syntax error, runtime error, or infinite loop, report "Error" as the status.
        4. Be strict with output formatting.
        
        Return a JSON array containing the result for each test case.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                testCaseId: { type: Type.INTEGER },
                status: { type: Type.STRING, enum: ["Passed", "Failed", "Error"] },
                actualOutput: { type: Type.STRING },
                errorDetail: { type: Type.STRING }
              }
            }
          }
        }
      });

      const rawResults = JSON.parse(response.text || "[]");
      
      const processedResults = currentQuestion.testCases.map((tc, index) => {
         const res = rawResults.find((r: any) => r.testCaseId === index);
         return {
            testCaseIndex: index,
            status: (res?.status || "Error") as "Passed" | "Failed" | "Error",
            actualOutput: res?.actualOutput,
            errorDetail: res?.errorDetail || (res ? undefined : "Execution Failed"),
            isHidden: tc.isHidden
         };
      });

      setResults(processedResults);

    } catch (error) {
      console.error("Execution failed", error);
      setResults(currentQuestion.testCases.map((tc, i) => ({
         testCaseIndex: i,
         status: "Error",
         errorDetail: "System Error: Could not execute code.",
         isHidden: tc.isHidden
      })));
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    setAnalyzing(true);
    setShowAnalysis(true);
    const currentQuestion = questions[currentQIndex];

    try {
        const prompt = `
          Analyze the following solution for the problem: "${currentQuestion.title}".
          
          Problem Description: ${currentQuestion.description}
          Language: ${language}
          User Code:
          ${userCode}

          Provide a strict JSON response with:
          1. isOptimized: boolean
          2. timeComplexity: string (e.g., O(n))
          3. spaceComplexity: string (e.g., O(1))
          4. suggestions: string (A concise paragraph on how to optimize or improve the code. If it's already optimal, praise it.)
          5. rating: number (1-10 based on code quality and efficiency)
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isOptimized: { type: Type.BOOLEAN },
                        timeComplexity: { type: Type.STRING },
                        spaceComplexity: { type: Type.STRING },
                        suggestions: { type: Type.STRING },
                        rating: { type: Type.INTEGER }
                    }
                }
            }
        });

        const result = JSON.parse(response.text);
        setAnalysis(result);

    } catch (e) {
        console.error("Analysis failed", e);
        setAnalysis({
            isOptimized: false,
            timeComplexity: "Unknown",
            spaceComplexity: "Unknown",
            suggestions: "Could not analyze code at this time.",
            rating: 0
        });
    } finally {
        setAnalyzing(false);
    }
  };

  const changeQuestion = (delta: number) => {
    const newIndex = currentQIndex + delta;
    if (newIndex >= 0 && newIndex < questions.length) {
      setCurrentQIndex(newIndex);
      setUserCode(""); // Blank editor for new question
      setResults(null);
      setAnalysis(null);
      setShowAnalysis(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Styles ---

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translate(0px, 0px); }
        50% { transform: translate(10px, -15px); }
        100% { transform: translate(0px, 0px); }
      }
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.2; }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-float {
        animation: float 8s ease-in-out infinite;
      }
      .animate-pulse-slow {
        animation: pulse-slow 4s ease-in-out infinite;
      }
      .scrollbar-fancy::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .scrollbar-fancy::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.5);
      }
      .scrollbar-fancy::-webkit-scrollbar-thumb {
        background: rgba(71, 85, 105, 0.5);
        border-radius: 4px;
      }
      .scrollbar-fancy::-webkit-scrollbar-thumb:hover {
        background: rgba(99, 102, 241, 0.5);
      }
      .glass-card {
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // --- Views ---

  if (view === "setup") {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden relative flex items-center justify-center p-4">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-4s' }}></div>
        </div>

        <div className="max-w-4xl w-full relative z-10 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-2 ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm group">
              <Cpu className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Gemini CodeArena
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              Master Data Structures & Algorithms with an AI-powered adaptive interview environment.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50 relative overflow-hidden">
             
             {/* Glowing border effect */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              
              {/* Topic Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> Select Topic
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto scrollbar-fancy pr-2">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        topic === t
                          ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/40 border-indigo-400/50 scale-[1.02]"
                          : "bg-slate-800/40 text-slate-400 border-transparent hover:bg-slate-700/60 hover:text-slate-200 hover:border-slate-600/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-center">
                {/* Language Selection */}
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 delay-75">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Code2 className="w-4 h-4 text-indigo-400" /> Language
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["JavaScript", "Python", "Java", "C++"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l as Language)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                          language === l
                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                            : "bg-slate-800/40 border-transparent text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 delay-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-yellow-400" /> Difficulty
                  </label>
                  <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                          difficulty === d
                            ? d === 'Easy' ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : d === 'Medium' ? "bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Timer Selection */}
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 delay-125">
                   <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Timer className="w-4 h-4 text-cyan-400" /> Time Limit
                   </label>
                   <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 overflow-x-auto">
                     {[15, 30, 45, 60, null].map((t) => (
                        <button
                          key={t || "inf"}
                          onClick={() => setTimeLimit(t)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                            timeLimit === t
                              ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {t ? `${t} min` : "∞"}
                        </button>
                     ))}
                   </div>
                </div>

                {/* Count */}
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500 delay-150">
                   <div className="flex justify-between items-end">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Settings className="w-4 h-4 text-indigo-400" /> Count
                      </label>
                      <span className="text-2xl font-bold text-indigo-400 tabular-nums">{count}</span>
                   </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
                  />
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>1 Problem</span>
                    <span>5 Problems</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
              <button
                onClick={generateQuestions}
                disabled={loading}
                className={`relative overflow-hidden flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] group ${
                  loading
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40"
                }`}
              >
                 {/* Shiny effect overlay */}
                 {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"></div>}

                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="animate-pulse">Building Environment...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Challenge</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            {loading && (
               <div className="mt-6 text-center text-slate-400 text-sm animate-pulse-slow flex flex-col items-center justify-center gap-3">
                 <div className="flex gap-1">
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0ms'}}></span>
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '150ms'}}></span>
                   <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '300ms'}}></span>
                 </div>
                 <span className="text-indigo-300 font-medium">{loadingMessage}</span>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Coding View ---
  
  const currentQuestion = questions[currentQIndex];

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden animate-in fade-in duration-700 relative">
      
      {/* Background blobs for coding view too, but subtler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px] animate-float"></div>
      </div>

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="glass-card max-w-2xl w-full max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
                 <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-amber-400" /> AI Code Analysis
                 </h2>
                 <button onClick={() => setShowAnalysis(false)} className="text-slate-400 hover:text-white transition-colors">
                    <XCircle className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f172a]">
                 {analyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                       <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                       <p className="text-slate-400 animate-pulse">Analyzing complexity and optimization...</p>
                    </div>
                 ) : analysis ? (
                    <>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                             <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Time Complexity</div>
                             <div className="text-xl font-mono text-cyan-300">{analysis.timeComplexity}</div>
                          </div>
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                             <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Space Complexity</div>
                             <div className="text-xl font-mono text-purple-300">{analysis.spaceComplexity}</div>
                          </div>
                       </div>
                       
                       <div className={`p-4 rounded-xl border ${analysis.isOptimized ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                          <div className="flex items-center gap-2 mb-2">
                             {analysis.isOptimized ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Lightbulb className="w-5 h-5 text-amber-400" />}
                             <span className={`font-bold ${analysis.isOptimized ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {analysis.isOptimized ? "Optimized Solution" : "Optimization Needed"}
                             </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{analysis.suggestions}</p>
                       </div>
                       
                       <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 flex items-center justify-between">
                          <span className="font-bold text-slate-400">Code Rating</span>
                          <div className="flex items-center gap-1">
                             {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-2 h-8 rounded-full ${i < analysis.rating ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                             ))}
                             <span className="ml-3 text-2xl font-bold text-white">{analysis.rating}/10</span>
                          </div>
                       </div>
                    </>
                 ) : (
                    <div className="text-rose-400 text-center">Failed to analyze.</div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 shadow-lg shadow-black/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-lg tracking-tight">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
               <Cpu className="w-5 h-5" />
            </div>
            CodeArena
          </div>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              currentQuestion.title ? "border-slate-700 bg-slate-800/50 text-slate-300" : ""
            }`}>
               {topic}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
              difficulty === 'Easy' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
              difficulty === 'Medium' ? "border-amber-500/20 bg-amber-500/10 text-amber-400" :
              "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* Timer Display */}
        {timeLimit !== null && (
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
             <Timer className="w-5 h-5" />
             {formatTime(timeLeft)}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
             <button 
               onClick={() => changeQuestion(-1)}
               disabled={currentQIndex === 0}
               className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 flex items-center text-xs font-mono font-medium text-slate-400 border-x border-white/5 mx-1">
              {currentQIndex + 1} / {questions.length}
            </span>
            <button 
               onClick={() => changeQuestion(1)}
               disabled={currentQIndex === questions.length - 1}
               className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={() => {
              if(confirm("Exit session? Progress will be lost.")) {
                 setView("setup");
                 setQuestions([]);
              }
            }}
            className="ml-2 text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 px-4 py-2 rounded-lg"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Left Panel: Problem Description */}
        <div className="w-1/2 md:w-5/12 border-r border-white/5 flex flex-col bg-[#0f172a]/60 backdrop-blur-sm">
           <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-fancy">
              <div className="animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 text-sm font-bold shrink-0 border border-white/10">
                    {currentQuestion.id}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-100 leading-tight">{currentQuestion.title}</h2>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed">
                   {currentQuestion.description}
                </div>
              </div>

              <div className="animate-in slide-in-from-left-4 duration-500 delay-100">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Examples
                </h3>
                <div className="space-y-4">
                  {currentQuestion.examples.map((ex, i) => (
                    <div key={i} className="bg-[#1e293b]/50 rounded-xl p-5 border border-white/5 hover:border-indigo-500/20 transition-colors group">
                      <div className="grid grid-cols-[60px_1fr] gap-3 text-sm mb-3">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wide py-1">Input</span>
                        <code className="font-mono text-indigo-200 bg-[#020617] px-3 py-1.5 rounded-md border border-white/5 group-hover:border-indigo-500/20 transition-colors">{ex.input}</code>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-3 text-sm">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wide py-1">Output</span>
                        <code className="font-mono text-emerald-200 bg-[#020617] px-3 py-1.5 rounded-md border border-white/5 group-hover:border-emerald-500/20 transition-colors">{ex.output}</code>
                      </div>
                      {ex.explanation && (
                        <div className="mt-4 text-xs text-slate-500 border-t border-white/5 pt-3 italic">
                          <span className="font-semibold text-slate-400 not-italic mr-1">Note:</span> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="animate-in slide-in-from-left-4 duration-500 delay-200">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Constraints
                </h3>
                <ul className="grid gap-2">
                  {currentQuestion.constraints.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 px-3 py-2 rounded-lg border border-white/5">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                       {c}
                    </li>
                  ))}
                </ul>
              </div>
           </div>
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="flex-1 flex flex-col bg-[#0b1120]">
          
          {/* Editor Header */}
          <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#1e293b]/30">
             <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">{language}</span>
             </div>
             <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
               Ready
             </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative group">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="w-full h-full bg-[#0b1120] p-6 font-mono text-sm leading-7 text-slate-300 resize-none focus:outline-none selection:bg-indigo-500/30"
              spellCheck={false}
              placeholder={`// Write your ${language} solution here...`}
            />
          </div>

          {/* Action Bar */}
          <div className="h-16 border-t border-white/5 bg-[#0f172a] px-6 flex items-center justify-between shrink-0 z-20">
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                     if(confirm("Clear all code?")) {
                       setUserCode("");
                     }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors uppercase tracking-wider"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
             </div>
             
             <div className="flex items-center gap-3">
               <button
                  onClick={handleRunCode}
                  disabled={executing || analyzing}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${
                    executing || analyzing
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                  }`}
                >
                  {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>Run Code</span>
                </button>

               <button
                 onClick={handleSubmit}
                 disabled={executing || analyzing}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${
                   executing || analyzing 
                     ? "bg-slate-800 text-slate-400 cursor-wait border border-white/5"
                     : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40"
                 }`}
               >
                 {analyzing ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                   </>
                 ) : (
                   <>
                     <Send className="w-4 h-4" /> Submit
                   </>
                 )}
               </button>
             </div>
          </div>

          {/* Test Results Panel */}
          {results && (
            <div className="h-[40%] border-t border-white/5 bg-[#0f172a]/95 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 relative">
               
               <div className="h-12 border-b border-white/5 flex items-center px-6 bg-[#1e293b]/50 shrink-0">
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-2.5">
                    <Terminal className="w-4 h-4 text-indigo-400" /> Test Results
                  </span>
                  <div className="ml-auto flex gap-3">
                     {results.filter(r => r.status === 'Passed').length === results.length && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold animate-pulse-slow">
                           All Passed!
                        </span>
                     )}
                     <div className="flex gap-1.5">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                           {results.filter(r => r.status === 'Passed').length} Passed
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                           {results.filter(r => r.status !== 'Passed').length} Failed
                        </span>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-fancy bg-[#020617]/50">
                 {results.map((res, i) => (
                   <div key={i} className={`rounded-xl border p-4 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in ${
                      res.status === 'Passed' 
                        ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10" 
                        : "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30 hover:bg-rose-500/10"
                   }`} style={{animationDelay: `${i * 100}ms`, animationFillMode: 'backwards'}}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          {res.isHidden ? (
                             <span className="flex items-center gap-1.5 text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                               <Settings className="w-3 h-3" /> Private Case {i - (results.length - 2) + 1}
                             </span>
                          ) : (
                             <span className="px-2 py-0.5">Public Case {i + 1}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-bold">
                          {res.status === 'Passed' ? (
                            <span className="text-emerald-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                              <CheckCircle2 className="w-4 h-4" /> Passed
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]">
                              <XCircle className="w-4 h-4" /> {res.status === 'Error' ? 'Runtime Error' : 'Failed'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display inputs for public cases */}
                      {!res.isHidden && (
                         <div className="grid grid-cols-2 gap-4 text-xs font-mono mt-2">
                            <div>
                               <div className="text-slate-500 mb-1.5 font-semibold">Input</div>
                               <div className="bg-[#020617] p-2.5 rounded-lg border border-white/5 text-indigo-200 truncate" title={currentQuestion.testCases[i].input}>
                                 {currentQuestion.testCases[i].input}
                               </div>
                            </div>
                            <div>
                               <div className="text-slate-500 mb-1.5 font-semibold">Expected</div>
                               <div className="bg-[#020617] p-2.5 rounded-lg border border-white/5 text-emerald-200 truncate" title={currentQuestion.testCases[i].expectedOutput}>
                                 {currentQuestion.testCases[i].expectedOutput}
                               </div>
                            </div>
                         </div>
                      )}
                      
                      {/* Show actual output for public cases or specific error for private */}
                      {res.status !== 'Passed' && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                           <div className="text-xs text-slate-500 mb-1.5 font-semibold flex items-center gap-2">
                             {res.isHidden ? <><Sparkles className="w-3 h-3" /> AI Debug Hint</> : "Output / Error"}
                           </div>
                           <div className="bg-black/40 p-3 rounded-lg border border-rose-500/20 text-rose-200 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner">
                             {res.isHidden 
                               ? "Hidden test case failed. This usually means an edge case (like empty input, max values, or negatives) was missed." 
                               : (res.errorDetail || res.actualOutput)}
                           </div>
                        </div>
                      )}
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<App />);