
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES & INTERFACES ---
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum QuestionMode {
  NEW = 'New',
  PREVIOUS = 'Previous'
}

export type Topic = string;

export interface AppConfig {
  topic: Topic;
  difficulty: Difficulty;
  timeLimit: number | '∞';
  count: number;
  mode: QuestionMode;
}

export interface Example {
  input: string;
  output: string;
  note?: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  examples: Example[];
  constraints: string[];
}

export interface TestResult {
  passed: boolean;
  name: string;
  input: string;
  expected: string;
  actual?: string;
  error?: string;
  type: 'runtime' | 'logic';
}

// --- CONSTANTS ---
const TOPICS = [
  'Arrays', 'Strings', 'Math & Numbers', 'Basic Algorithms', 
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack',
  'Binary Search', 'Linked List', 'Trees', 'Tries'
];

const TIME_LIMITS = [15, 30, 45, 60, '∞'];

const Icons = {
  Processor: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
  ),
  History: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Topic: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  ),
  Difficulty: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  ),
  Time: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  // Fix: Added missing Mode icon to Icons object
  Mode: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
  ),
  Play: () => (
    <svg className="w-3.5 h-3.5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  )
};

// --- GEMINI API HELPERS ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateProblems = async (config: AppConfig): Promise<Problem[]> => {
  const prompt = `Generate exactly ${config.count} high-quality coding interview problems for a software engineering candidate.
  Topic: ${config.topic}
  Difficulty: ${config.difficulty}
  
  Return exactly as a JSON array where each object matches this schema:
  {
    "id": number,
    "title": "string",
    "description": "string (Markdown)",
    "examples": [{"input": "string", "output": "string", "note": "string"}],
    "constraints": ["string"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    output: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                },
              },
              constraints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["id", "title", "description", "examples", "constraints"],
          },
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini problem generation error:", error);
    return [{
      id: 1,
      title: "Reverse an Array",
      description: "Given an array `arr`, reverse the order of its elements. The function should modify the array in-place and return the modified array. Implement the function `reverseArray(arr)`.",
      examples: [
        { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]", note: "The array [1,2,3,4,5] is reversed to [5,4,3,2,1]." },
        { input: '["hello", "world"]', output: '["world", "hello"]', note: 'The array containing strings ["hello", "world"] is reversed to ["world", "hello"].' }
      ],
      constraints: ["0 <= arr.length <= 1000", "Elements can be of any type", "The array should be modified in-place."]
    }];
  }
};

const evaluateCode = async (problem: Problem, code: string, language: string) => {
  const prompt = `Evaluate the following user code for the problem: "${problem.title}".
  Language: ${language}
  Code: \`\`\`${language}\n${code}\n\`\`\`
  
  Run this against 2 test cases. If code has errors, set 'passed' to false and provide 'error'.
  Return exactly as JSON:
  {
    "results": [
      {
        "passed": boolean,
        "name": "PUBLIC CASE 1",
        "input": "string",
        "expected": "string",
        "actual": "string",
        "error": "string (optional)",
        "type": "runtime" | "logic"
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      // Fix: Added responseSchema to evaluateCode config for proper JSON response extraction
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passed: { type: Type.BOOLEAN },
                  name: { type: Type.STRING },
                  input: { type: Type.STRING },
                  expected: { type: Type.STRING },
                  actual: { type: Type.STRING },
                  error: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["passed", "name", "input", "expected", "actual", "type"]
              }
            }
          },
          required: ["results"]
        }
      },
    });
    return JSON.parse(response.text);
  } catch (err: any) {
    return {
      results: [{
        passed: false,
        name: "PUBLIC CASE 1",
        input: problem.examples[0].input,
        expected: problem.examples[0].output,
        actual: "",
        error: `System Error: Could not execute code. [GoogleGenAI Error]: ${err.message}`,
        type: "runtime"
      }]
    };
  }
};

// --- SUB-COMPONENT: CONFIG VIEW ---
const ConfigView: React.FC<{ 
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  onStart: () => void;
  isLoading: boolean;
}> = ({ config, setConfig, onStart, isLoading }) => {
  const previousSessions = [
    { id: 1, topic: 'Arrays', date: '2023-11-20', score: '3/3' },
    { id: 2, topic: 'Trees', date: '2023-11-15', score: '1/3' },
    { id: 3, topic: 'Sliding Window', date: '2023-11-10', score: '2/3' },
  ];

  return (
    <div className="w-full max-w-4xl animate-in fade-in duration-700 slide-in-from-bottom-4 flex flex-col items-center">
      <div className="text-center mb-10 space-y-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-[#111225] rounded-xl border border-[#2d2e4a] text-indigo-400">
            <Icons.Processor />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold text-indigo-400 tracking-tight">CodeArena</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          The ultimate AI-powered environment for mastering technical interviews and algorithms.
        </p>
      </div>

      <div className={`bg-[#111225] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-[#2d2e4a] w-full transition-all duration-300 relative ${
        config.mode === QuestionMode.PREVIOUS ? 'max-h-[600px] overflow-y-auto custom-scrollbar' : 'max-h-none'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <div>
            {config.mode === QuestionMode.NEW ? (
              <>
                <div className="flex items-center gap-2 mb-4 text-[#a855f7] font-bold text-[10px] tracking-widest uppercase">
                  <Icons.Topic />
                  <span>Select Topic</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setConfig({ ...config, topic })}
                      className={`px-3 py-3 rounded-xl text-left text-[11px] font-bold transition-all border ${
                        config.topic === topic 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                          : 'bg-[#1a1b3a] border-transparent text-gray-500 hover:border-gray-600 hover:text-gray-300'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 text-indigo-400 font-bold text-[10px] tracking-widest uppercase">
                  <Icons.History />
                  <span>Previous Sessions</span>
                </div>
                <div className="space-y-3 pr-2">
                  {previousSessions.map((session) => (
                    <div key={session.id} className="bg-[#1a1b3a] border border-[#2d2e4a] p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500 transition-colors cursor-pointer">
                      <div>
                        <div className="text-sm font-bold text-gray-200">{session.topic}</div>
                        <div className="text-[10px] text-gray-500">{session.date}</div>
                      </div>
                      <div className="text-xs font-mono font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                        {session.score}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 text-yellow-400 font-bold text-[10px] tracking-widest uppercase">
                <Icons.Difficulty />
                <span>Difficulty</span>
              </div>
              <div className="flex bg-[#0a0b1e] rounded-xl p-1 border border-[#2d2e4a]">
                {Object.values(Difficulty).map((d) => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      config.difficulty === d 
                        ? 'bg-[#152e35] text-emerald-400 border border-emerald-500/20' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold text-[10px] tracking-widest uppercase">
                <Icons.Time />
                <span>Time Limit</span>
              </div>
              <div className="flex items-center justify-between bg-[#0a0b1e] rounded-xl p-1 border border-[#2d2e4a]">
                {TIME_LIMITS.map((t) => (
                  <button
                    key={String(t)}
                    onClick={() => setConfig({ ...config, timeLimit: t as any })}
                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      config.timeLimit === t 
                        ? 'bg-[#152e35] text-cyan-400 border border-cyan-500/20' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t}{t !== '∞' ? 'm' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#a855f7] font-bold text-[10px] tracking-widest uppercase">
                  <Icons.Settings />
                  <span>Question Count</span>
                </div>
                <span className="text-2xl font-black text-indigo-400">{config.count}</span>
              </div>
              <input 
                type="range" min="1" max="5" value={config.count}
                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-[#1a1b3a] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 text-pink-400 font-bold text-[10px] tracking-widest uppercase">
                <Icons.Mode />
                <span>Question Mode</span>
              </div>
              <div className="flex bg-[#0a0b1e] rounded-xl p-1 border border-[#2d2e4a]">
                {Object.values(QuestionMode).map((m) => (
                  <button
                    key={m}
                    onClick={() => setConfig({ ...config, mode: m })}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                      config.mode === m 
                        ? 'bg-[#2d2345] text-indigo-400 border border-indigo-500/20' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {m === QuestionMode.NEW ? <span className="text-sm">+</span> : <Icons.History />}
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#2d2e4a]">
          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-[10px] font-bold uppercase tracking-widest">
            <Icons.History />
            <span>Session History</span>
          </button>
          
          <button 
            disabled={isLoading}
            onClick={onStart}
            className={`gradient-purple px-12 py-3.5 rounded-xl font-black text-white text-sm flex items-center gap-3 hover:opacity-90 transition-all shadow-2xl disabled:opacity-50 min-w-[180px] justify-center uppercase tracking-widest`}
          >
            {isLoading ? <span className="animate-pulse">Loading...</span> : <>Begin Session <Icons.ChevronRight /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: CODING VIEW ---
const CodingView: React.FC<{ 
  config: AppConfig;
  problems: Problem[];
  onEnd: () => void;
}> = ({ config, problems, onEnd }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(typeof config.timeLimit === 'number' ? config.timeLimit * 60 : 3600);
  const [lang, setLang] = useState('JavaScript');
  const [code, setCode] = useState('// Write your solution here...');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const problem = problems[currentIdx] || problems[0];

  useEffect(() => {
    if (config.timeLimit === '∞') return;
    const timer = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [config.timeLimit]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  const handleTest = async () => {
    setIsEvaluating(true);
    const evaluation = await evaluateCode(problem, code, lang);
    setTestResults(evaluation.results);
    setIsEvaluating(false);
  };

  const handleClear = () => { if(window.confirm("Clear all code?")) { setCode(`// Resetting environment for ${problem.title}...`); setTestResults(null); }};

  return (
    <div className="w-full max-w-[1600px] h-[calc(100vh-64px)] flex flex-col gap-4 animate-in fade-in duration-500 pb-4">
      {/* Dynamic Session Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0a0b1e] rounded-xl border border-[#1a1b3a] shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-5 border-r border-[#1a1b3a]">
            <div className="p-1.5 bg-[#111225] rounded-lg text-indigo-400 border border-[#2d2e4a]"><Icons.Processor /></div>
            <span className="font-black text-xl text-indigo-300 tracking-tight">CodeArena</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-[#1a1b3a] rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{config.topic}</span>
            <span className="px-4 py-1.5 bg-emerald-950/40 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/10 uppercase tracking-widest">{config.difficulty}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-2xl font-mono font-bold text-gray-100 bg-[#111225] px-5 py-1 rounded-xl border border-[#1a1b3a]">
          <Icons.Time /><span>{formatTime(timeLeft)}</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3 bg-[#111225] p-1 rounded-xl border border-[#1a1b3a]">
            <button onClick={() => setCurrentIdx(p => p-1)} disabled={currentIdx === 0} className="p-2 hover:text-white text-gray-500 disabled:opacity-10 transition-all"><Icons.ChevronLeft /></button>
            <span className="text-[11px] font-black text-gray-400 min-w-[40px] text-center tracking-widest uppercase">{currentIdx + 1} / {problems.length}</span>
            <button onClick={() => setCurrentIdx(p => p+1)} disabled={currentIdx === problems.length - 1} className="p-2 hover:text-white text-gray-500 disabled:opacity-10 transition-all"><Icons.ChevronRight /></button>
          </div>
          <button onClick={onEnd} className="text-[10px] font-black text-gray-600 hover:text-red-500 transition-colors uppercase tracking-widest">End Session</button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Side: Problem Spec (420px Fixed) */}
        <div className="w-[420px] bg-[#0a0b1e] rounded-xl border border-[#1a1b3a] flex flex-col overflow-hidden shadow-inner">
          <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 h-full">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-[#2d2e4a] flex items-center justify-center text-gray-100 font-black text-lg shadow-lg border border-[#3d3e5a]">
                {currentIdx + 1}
              </div>
              <h2 className="text-3xl font-black text-gray-100 tracking-tight leading-tight">{problem.title}</h2>
            </div>
            
            <div className="text-gray-400 leading-relaxed text-sm font-medium">
              {problem.description}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] tracking-widest uppercase">
                <Icons.Topic />
                <span>Problem Examples</span>
              </div>
              
              {problem.examples.map((ex, i) => (
                <div key={i} className="bg-[#111225]/60 border border-[#1a1b3a] rounded-2xl p-6 space-y-5 shadow-lg">
                  <div className="space-y-3">
                    <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Input</span>
                    <div className="bg-[#050614] p-4 rounded-xl font-mono text-xs text-indigo-300 border border-[#1a1b3a]">{ex.input}</div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Output</span>
                    <div className="bg-[#050614] p-4 rounded-xl font-mono text-xs text-emerald-400 border border-[#1a1b3a]">{ex.output}</div>
                  </div>
                  {ex.note && (
                    <p className="text-[10px] italic text-gray-600 border-l-2 border-indigo-500/30 pl-3">
                      <span className="font-black uppercase not-italic text-gray-500 text-[8px] mr-1">Note:</span> {ex.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4 pb-12">
              <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] tracking-widest uppercase">
                <Icons.Difficulty />
                <span>Technical Constraints</span>
              </div>
              <ul className="space-y-3">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-400 text-xs font-medium">
                    <span className="text-rose-400 mt-1 flex-shrink-0">●</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Editor */}
        <div className="flex-1 bg-[#050614] rounded-xl border border-[#1a1b3a] flex flex-col overflow-hidden relative shadow-2xl">
          <div className="flex items-center justify-between px-6 py-3 bg-[#0a0b1e] border-b border-[#1a1b3a]">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase flex items-center gap-2">Language:</span>
              <div className="flex bg-[#111225] rounded-xl p-1 border border-[#2d2e4a]">
                {['JavaScript', 'Python', 'Java', 'C++'].map((l) => (
                  <button 
                    key={l} 
                    onClick={() => setLang(l)} 
                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lang === l ? 'bg-[#1e204a] text-indigo-400 border border-indigo-500/20 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              Environment Ready
            </div>
          </div>

          <div className="flex-1 relative font-mono text-sm overflow-hidden bg-[#050614]">
            <div className="absolute top-0 left-0 w-8 h-full bg-[#0a0b1e]/30 border-r border-[#1a1b3a]/50 pointer-events-none"></div>
            <textarea 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              spellCheck={false}
              className="w-full h-full bg-transparent pl-12 pr-8 py-8 outline-none resize-none text-gray-300 font-mono leading-relaxed custom-scrollbar" 
              autoFocus 
            />
          </div>

          {/* Bottom Results Panel */}
          {testResults && (
            <div className="absolute bottom-[64px] left-0 w-full bg-[#0a0b1e] border-t border-[#1a1b3a] max-h-[65%] overflow-y-auto custom-scrollbar p-8 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-indigo-400 font-black text-xs tracking-widest uppercase">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  <span>Execution Results</span>
                </div>
                <div className="flex gap-3">
                  <span className="px-5 py-1.5 bg-emerald-950/30 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                    {testResults.filter(r => r.passed).length} Passed
                  </span>
                  <span className="px-5 py-1.5 bg-rose-950/30 text-rose-400 rounded-full text-[10px] font-black border border-rose-500/20 uppercase tracking-widest shadow-lg shadow-rose-500/5">
                    {testResults.filter(r => !r.passed).length} Failed
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                {testResults.map((res, i) => (
                  <div key={i} className="bg-[#111225] border border-[#1a1b3a] rounded-2xl p-6 shadow-xl hover:border-[#2d2e4a] transition-all">
                    <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#1a1b3a]/50">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{res.name}</span>
                      {!res.passed && (
                        <div className="flex items-center gap-3 text-rose-500 font-black text-[10px] uppercase tracking-wider bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20">
                           <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                           {res.type === 'runtime' ? 'Runtime Error' : 'Logic Failed'}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                       <div className="space-y-3">
                         <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Input</label>
                         <div className="bg-[#050614] p-4 rounded-xl font-mono text-xs text-gray-400 border border-[#1a1b3a]">{res.input}</div>
                       </div>
                       <div className="space-y-3">
                         <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Expected</label>
                         <div className="bg-[#050614] p-4 rounded-xl font-mono text-xs text-emerald-400/80 border border-[#1a1b3a]">{res.expected}</div>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">System Output / Error Log</label>
                       <div className={`p-5 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap border ${res.passed ? 'bg-emerald-950/10 text-emerald-400/80 border-emerald-900/20' : 'bg-rose-950/10 text-rose-300/80 border-rose-900/20'}`}>
                         {res.error || res.actual || "No output generated."}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="h-16 px-8 flex items-center justify-between bg-[#0a0b1e] border-t border-[#1a1b3a] z-30">
            <button 
              onClick={handleClear} 
              className="flex items-center text-gray-600 hover:text-gray-300 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <Icons.Trash />Clear All
            </button>
            <div className="flex items-center gap-5">
              <button 
                onClick={handleTest} 
                disabled={isEvaluating} 
                className="px-8 py-2.5 bg-[#1a1b3a] text-gray-300 rounded-xl font-black text-[10px] flex items-center transition-all hover:bg-[#212347] border border-[#2d2e4a] uppercase tracking-widest disabled:opacity-50"
              >
                <Icons.Play />{isEvaluating ? 'Testing...' : 'Test Code'}
              </button>
              <button 
                onClick={handleTest} 
                disabled={isEvaluating} 
                className="gradient-purple px-10 py-2.5 text-white rounded-xl font-black text-[10px] flex items-center transition-all hover:opacity-90 shadow-2xl shadow-indigo-500/30 uppercase tracking-widest disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {isEvaluating ? 'Analyzing...' : 'Submit & Analyze'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ENTRY POINT ---
const App: React.FC = () => {
  const [view, setView] = useState<'config' | 'coding'>('config');
  const [config, setConfig] = useState<AppConfig>({
    topic: 'Arrays & Hashing',
    difficulty: Difficulty.EASY,
    timeLimit: 30,
    count: 3,
    mode: QuestionMode.NEW,
  });
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    const fetched = await generateProblems(config);
    setProblems(fetched);
    setIsLoading(false);
    setView('coding');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050614] overflow-x-hidden text-gray-100">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {view === 'config' ? (
          <ConfigView config={config} setConfig={setConfig} onStart={handleStart} isLoading={isLoading} />
        ) : (
          <CodingView config={config} problems={problems} onEnd={() => setView('config')} />
        )}
      </main>
    </div>
  );
};

export default App;
