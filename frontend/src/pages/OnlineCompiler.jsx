import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import {
  Play, ChevronLeft, ChevronRight, ChevronDown,
  Terminal, Clock, Cpu, RotateCcw, Copy, Check,
  AlertCircle, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript', starter: '// JavaScript\nconsole.log("Hello, World!");\n' },
  { label: 'Python',     value: 'python',     monaco: 'python',     starter: '# Python\nprint("Hello, World!")\n' },
  { label: 'Java',       value: 'java',       monaco: 'java',       starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n' },
  { label: 'C++',        value: 'c++',        monaco: 'cpp',        starter: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n' },
  { label: 'C',          value: 'c',          monaco: 'c',          starter: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n' },
  { label: 'TypeScript', value: 'typescript', monaco: 'typescript', starter: '// TypeScript\nconst msg: string = "Hello, World!";\nconsole.log(msg);\n' },
  { label: 'Go',         value: 'go',         monaco: 'go',         starter: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n' },
  { label: 'Rust',       value: 'rust',       monaco: 'rust',       starter: 'fn main() {\n    println!("Hello, World!");\n}\n' },
  { label: 'Ruby',       value: 'ruby',       monaco: 'ruby',       starter: '# Ruby\nputs "Hello, World!"\n' },
  { label: 'PHP',        value: 'php',        monaco: 'php',        starter: '<?php\necho "Hello, World!\\n";\n?>\n' },
];

const STATUS_COLORS = {
  3: 'text-emerald-500',   // Accepted
  4: 'text-red-500',       // Wrong Answer
  5: 'text-orange-500',    // TLE
  6: 'text-red-500',       // Compilation Error
  default: 'text-red-400',
};

export default function OnlineCompiler({ embedded = false }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [outputTab, setOutputTab] = useState('output'); // 'output' | 'stdin'
  const langRef = useRef(null);

  const bg = isDark ? `${embedded ? 'h-full' : 'h-screen'} bg-[#0d1117] text-white flex flex-col` : `${embedded ? 'h-full' : 'h-screen'} text-gray-800 flex flex-col`;
  const bgStyle = isDark ? {} : { background: '#f8fafc' };

  const panelBg = isDark ? 'bg-[#0f1115] border-gray-800' : 'bg-white border-gray-200';
  const headerBg = isDark ? 'bg-[#0a0e14] border-gray-800' : 'bg-white border-gray-200';
  const sidebarBg = isDark ? 'bg-[#0a0e14] border-gray-800' : 'bg-white border-gray-200';
  const outputBg = isDark ? 'bg-[#0d1117]' : 'bg-gray-50';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const borderCol = isDark ? 'border-gray-800' : 'border-gray-200';

  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setResult(null);
    setOutputTab('output');
    try {
      const res = await axios.post('/code/run', {
        code,
        language: lang.value,
        testCases: [{ input: stdin, expectedOutput: null, isHidden: false }],
      });
      const r = res.data.results?.[0];
      setResult({
        stdout: r?.actualOutput || '',
        stderr: r?.error || '',
        status: res.data.results?.[0]?.passed !== undefined
          ? (r?.passed ? { id: 3, description: 'Accepted' } : { id: 4, description: 'Error' })
          : { id: 14, description: 'Error' },
        time: r?.executionTime || null,
        raw: r,
      });
    } catch (err) {
      setResult({
        stdout: '',
        stderr: err.response?.data?.message || err.message || 'Execution failed',
        status: { id: 14, description: 'Error' },
        time: null,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleLangChange = (l) => {
    setLang(l);
    setCode(l.starter);
    setResult(null);
    setLangOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setCode(lang.starter);
    setResult(null);
    setStdin('');
  };

  const statusColor = result
    ? STATUS_COLORS[result.status?.id] || STATUS_COLORS.default
    : '';

  const StatusIcon = result
    ? result.status?.id === 3 ? CheckCircle2 : XCircle
    : null;

  return (
    <div className={bg} style={bgStyle}>
      {/* Top bar */}
      <header className={`h-12 flex items-center justify-between px-4 border-b shrink-0 ${headerBg} ${borderCol}`}>
        <div className="flex items-center gap-3">
          {!embedded && (
            <>
              <button
                onClick={() => navigate('/coding')}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${textMuted} hover:${textMain}`}
              >
                <ChevronLeft size={14} /> Back
              </button>
              <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </>
          )}
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-blue-500" />
            <span className={`text-sm font-semibold ${textMain}`}>Online Compiler</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {lang.label}
              <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute top-full right-0 mt-1 w-40 rounded-xl border shadow-xl z-50 overflow-hidden ${
                    isDark ? 'bg-[#1a1f2e] border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => handleLangChange(l)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        lang.value === l.value
                          ? isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                          : isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border transition-all ${
              isDark ? 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600' : 'border-gray-200 text-gray-400 hover:text-gray-700'
            }`}
            title="Copy code"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className={`p-1.5 rounded-lg border transition-all ${
              isDark ? 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600' : 'border-gray-200 text-gray-400 hover:text-gray-700'
            }`}
            title="Reset to starter"
          >
            <RotateCcw size={13} />
          </button>

          {/* Run */}
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: '#0f766e', boxShadow: '0 2px 8px rgba(15,118,110,0.3)' }}
          >
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? 'Running…' : 'Run'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible sidebar — hidden when embedded in shell */}
        {!embedded && (
          <motion.aside
            animate={{ width: sidebarOpen ? 200 : 48 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`${sidebarBg} border-r ${borderCol} flex flex-col shrink-0 overflow-hidden relative`}
          >
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`absolute -right-3 top-4 w-6 h-6 rounded-full flex items-center justify-center z-20 border shadow-md transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
              }`}
            >
              {sidebarOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
            </button>
            <div className={`px-3 py-4 border-b ${borderCol}`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded-md bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Terminal size={12} className="text-blue-500" />
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={`text-xs font-bold whitespace-nowrap ${textMain}`}>
                      Compiler
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-1">
              {[{ icon: Terminal, label: 'Editor', active: true }, { icon: Clock, label: 'History', active: false }, { icon: Cpu, label: 'Languages', active: false }].map((item) => (
                <div key={item.label} className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-default ${item.active ? isDark ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-600' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <item.icon size={13} className="shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`px-3 py-3 border-t ${borderCol}`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>Language</div>
                  <div className="text-xs font-medium px-2 py-1.5 rounded-lg" style={{ background: isDark ? '#1e40af20' : '#dbeafe', color: '#1e40af' }}>
                    {lang.label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor
            height="100%"
            language={lang.monaco}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme={isDark ? 'vs-dark' : 'vs'}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              folding: true,
            }}
          />
        </div>

        {/* Output panel */}
        <div className={`w-80 flex flex-col border-l ${panelBg} ${borderCol} shrink-0`}>
          {/* Tabs */}
          <div className={`flex border-b ${borderCol} shrink-0`}>
            {['output', 'stdin'].map((tab) => (
              <button
                key={tab}
                onClick={() => setOutputTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  outputTab === tab
                    ? isDark ? 'text-white border-blue-500' : 'text-gray-900 border-blue-500'
                    : `${textMuted} border-transparent`
                }`}
              >
                {tab === 'stdin' ? 'Input (stdin)' : 'Output'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {outputTab === 'stdin' ? (
              <div className="flex-1 p-3 flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
                  Standard Input
                </p>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input for your program..."
                  className={`flex-1 w-full resize-none text-xs font-mono rounded-lg p-3 border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                    isDark
                      ? 'bg-[#0d1117] border-gray-700 text-gray-200 placeholder-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                  style={{ minHeight: 120 }}
                />
              </div>
            ) : (
              <div className={`flex-1 overflow-y-auto p-3 ${outputBg}`}>
                {running && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className={`text-xs ${textMuted}`}>Executing…</span>
                  </div>
                )}

                {!running && !result && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                    <Terminal size={28} className={textMuted} />
                    <span className={`text-xs ${textMuted}`}>Run your code to see output</span>
                  </div>
                )}

                {!running && result && (
                  <div className="space-y-3">
                    {/* Status bar */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isDark ? 'bg-gray-800/60' : 'bg-white border border-gray-200'
                    }`}>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>
                        {StatusIcon && <StatusIcon size={13} />}
                        {result.status?.description}
                      </div>
                      {result.time && (
                        <div className={`flex items-center gap-1 text-[10px] ${textMuted}`}>
                          <Clock size={10} />
                          {result.time}s
                        </div>
                      )}
                    </div>

                    {/* stdout */}
                    {result.stdout && (
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${textMuted}`}>Output</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap break-words p-3 rounded-lg ${
                          isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800 border border-gray-200'
                        }`}>
                          {result.stdout}
                        </pre>
                      </div>
                    )}

                    {/* stderr / error */}
                    {result.stderr && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-red-400">Error</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap break-words p-3 rounded-lg ${
                          isDark ? 'bg-red-900/20 text-red-300 border border-red-900/40' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {result.stderr}
                        </pre>
                      </div>
                    )}

                    {/* Empty output */}
                    {!result.stdout && !result.stderr && (
                      <div className={`text-xs ${textMuted} italic`}>No output produced.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Run button at bottom of panel */}
          <div className={`p-3 border-t ${borderCol} shrink-0`}>
            <button
              onClick={handleRun}
              disabled={running}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: '#0f766e', boxShadow: '0 2px 10px rgba(15,118,110,0.25)' }}
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {running ? 'Running…' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
