import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import DifficultyIcon from '../components/DifficultyIcon';
import SystemCheck from '../components/SystemCheck';
import { Clock, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DifficultySelection() {
  const { domain } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [questionCount, setQuestionCount] = useState(15);
  const [timeLimit, setTimeLimit] = useState(15);

  const difficulties = [
    { name: 'Beginner',     level: 1, color: 'text-emerald-500', ring: 'ring-emerald-500', border: 'border-emerald-500' },
    { name: 'Easy',         level: 2, color: 'text-green-500',   ring: 'ring-green-500',   border: 'border-green-500'   },
    { name: 'Intermediate', level: 3, color: 'text-amber-500',   ring: 'ring-amber-500',   border: 'border-amber-500'   },
    { name: 'Hard',         level: 4, color: 'text-orange-500',  ring: 'ring-orange-500',  border: 'border-orange-500'  },
    { name: 'Expert',       level: 5, color: 'text-red-500',     ring: 'ring-red-500',     border: 'border-red-500'     },
  ];

  const handleQuestionCountChange = (e) => {
    const v = parseInt(e.target.value) || 0;
    if (v >= 0 && v <= 50) setQuestionCount(v);
  };

  const handleTimeLimitChange = (e) => {
    const v = parseInt(e.target.value) || 0;
    if (v >= 0 && v <= 120) setTimeLimit(v);
  };

  const handleProceed = () => {
    const vq = Math.min(Math.max(questionCount, 5), 50);
    const vt = Math.min(Math.max(timeLimit, 5), 120);
    setQuestionCount(vq);
    setTimeLimit(vt);
    if (selectedDifficulty) setShowSystemCheck(true);
  };

  const handleSystemCheckClose = () => {
    setShowSystemCheck(false);
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const handleStart = async () => {
    if (!selectedDifficulty) return;
    setLoading(true);
    setShowSystemCheck(false);
    try {
      const vq = Math.min(Math.max(questionCount, 5), 50);
      const vt = Math.min(Math.max(timeLimit, 5), 120);
      const res = await axios.post('/assessment/start', {
        domain,
        difficulty: selectedDifficulty,
        timeLimitSeconds: vt * 60,
        numQuestions: vq,
      });
      navigate(`/assessment/quiz/${res.data.sessionId}`);
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      alert(`Failed to start assessment: ${msg}`);
      setLoading(false);
    }
  };

  const isValidSettings = questionCount >= 5 && questionCount <= 50 && timeLimit >= 5 && timeLimit <= 120;

  // ── Theme tokens ──
  const page    = isDark ? 'min-h-screen text-white' : 'min-h-screen ds-page';
  const pageStyle = isDark ? { background: 'linear-gradient(to right, #000001, #000000)' } : {};

  const heading = isDark ? 'text-3xl font-bold text-white mb-3' : 'text-3xl font-bold text-gray-900 mb-3';
  const sub     = isDark ? 'text-gray-400 text-lg' : 'text-gray-500 text-lg';

  const loadBox = isDark
    ? 'text-center p-16 bg-gray-900 rounded-2xl border border-gray-800'
    : 'text-center p-16 bg-white rounded-2xl border border-blue-100 shadow-lg';

  const settingBox = isDark
    ? 'flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 shadow-sm hover:border-blue-500/50 transition-colors'
    : 'flex items-center gap-3 ds-setting-box rounded-xl px-5 py-3 shadow-sm transition-all';

  const labelCls  = isDark ? 'font-medium text-gray-300' : 'font-medium text-gray-600';
  const hintCls   = isDark ? 'text-xs text-gray-500' : 'text-xs text-gray-400';
  const minCls    = isDark ? 'text-gray-400 font-medium' : 'text-gray-500 font-medium';

  const numInput  = isDark
    ? 'w-16 text-center text-lg font-bold text-blue-400 bg-gray-800 border border-gray-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    : 'w-16 text-center text-lg font-bold text-blue-600 bg-white border border-blue-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm';

  const sectionTitle = isDark ? 'text-lg font-semibold text-gray-300 mb-4 text-center' : 'text-lg font-semibold text-gray-700 mb-4 text-center';

  const diffCardBase = (level, isSelected) => {
    if (isDark) {
      return isSelected
        ? `${level.border} ring-2 ring-offset-2 ring-offset-gray-900 ${level.ring} shadow-lg bg-gray-800`
        : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800 hover:shadow-md';
    }
    return isSelected
      ? `${level.border} ring-2 ring-offset-2 ring-offset-white ${level.ring} shadow-lg ds-diff-card-selected`
      : 'ds-diff-card border-transparent hover:shadow-md hover:-translate-y-1';
  };

  const diffIconBg = (level, isSelected) => isDark
    ? `${level.color.replace('text-', 'bg-').replace('500', '900/50')}`
    : `ds-diff-icon-bg`;

  const startBtn = selectedDifficulty && isValidSettings
    ? 'px-10 py-4 rounded-xl font-bold text-lg transition-all transform bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 shadow-lg shadow-blue-500/30'
    : isDark
      ? 'px-10 py-4 rounded-xl font-bold text-lg bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
      : 'px-10 py-4 rounded-xl font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200';

  return (
    <div className={page} style={pageStyle}>
      <div className="max-w-4xl mx-auto py-24 px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={heading}>Assessment</h2>
          <p className={sub}>
            Domain: <span className="text-blue-500 font-semibold">{decodeURIComponent(domain)}</span>
          </p>
        </div>

        {loading ? (
          <div className={loadBox}>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-6" />
            <p className="text-2xl text-blue-500 font-bold">Generating Your Quiz...</p>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Preparing {questionCount} questions tailored to your settings.
            </p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Settings */}
            <div className="flex flex-wrap justify-center gap-6">
              <div className={settingBox}>
                <FileText className="w-5 h-5 text-blue-500" />
                <label className={labelCls}>Questions:</label>
                <input type="number" min="5" max="50" value={questionCount}
                  onChange={handleQuestionCountChange} className={numInput} />
                <span className={hintCls}>(5-50)</span>
              </div>

              <div className={settingBox}>
                <Clock className="w-5 h-5 text-blue-500" />
                <label className={labelCls}>Time:</label>
                <input type="number" min="5" max="120" value={timeLimit}
                  onChange={handleTimeLimitChange} className={numInput} />
                <span className={minCls}>min</span>
                <span className={hintCls}>(5-120)</span>
              </div>
            </div>

            {/* Difficulty Cards */}
            <div>
              <h3 className={sectionTitle}>Select Difficulty Level</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {difficulties.map(level => (
                  <button
                    key={level.name}
                    onClick={() => setSelectedDifficulty(level.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none min-w-[110px] ${diffCardBase(level, selectedDifficulty === level.name)}`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center mb-2 rounded-lg ${diffIconBg(level, selectedDifficulty === level.name)} ${level.color}`}>
                      <DifficultyIcon level={level.level} color={level.color} />
                    </div>
                    <span className={`font-bold text-sm ${level.color}`}>{level.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <button onClick={handleProceed} disabled={!selectedDifficulty || !isValidSettings}
                className={startBtn}>
                {!selectedDifficulty ? 'Select a Difficulty' : 'Start Assessment'}
              </button>
            </div>
          </div>
        )}

        <SystemCheck isOpen={showSystemCheck} onClose={handleSystemCheckClose} onStart={handleStart} />
      </div>
    </div>
  );
}
