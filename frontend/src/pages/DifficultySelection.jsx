import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import DifficultyIcon from '../components/DifficultyIcon';
import SystemCheck from '../components/SystemCheck';
import { Clock, FileText } from 'lucide-react';

export default function DifficultySelection() {
  const { domain } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // Custom settings
  const [questionCount, setQuestionCount] = useState(15);
  const [timeLimit, setTimeLimit] = useState(15);

  // Difficulties with colors
  const difficulties = [
    { name: 'Beginner', level: 1, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', selectedBorder: 'border-emerald-500' },
    { name: 'Easy', level: 2, color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200', hoverBorder: 'hover:border-green-400', selectedBorder: 'border-green-500' },
    { name: 'Intermediate', level: 3, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBorder: 'hover:border-amber-400', selectedBorder: 'border-amber-500' },
    { name: 'Hard', level: 4, color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBorder: 'hover:border-orange-400', selectedBorder: 'border-orange-500' },
    { name: 'Expert', level: 5, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverBorder: 'hover:border-red-400', selectedBorder: 'border-red-500' },
  ];

  const handleQuestionCountChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    // Clamp between 5 and 50
    if (value >= 0 && value <= 50) {
      setQuestionCount(value);
    }
  };

  const handleTimeLimitChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    // Clamp between 5 and 120
    if (value >= 0 && value <= 120) {
      setTimeLimit(value);
    }
  };

  const handleDifficultyClick = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleProceed = () => {
    // Validate inputs before proceeding
    const validQuestions = Math.min(Math.max(questionCount, 5), 50);
    const validTime = Math.min(Math.max(timeLimit, 5), 120);
    setQuestionCount(validQuestions);
    setTimeLimit(validTime);

    if (selectedDifficulty) {
      setShowSystemCheck(true);
    }
  };

  const handleSystemCheckClose = () => {
    setShowSystemCheck(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const handleStart = async () => {
    if (!selectedDifficulty) return;

    setLoading(true);
    setShowSystemCheck(false);
    try {
      const validQuestions = Math.min(Math.max(questionCount, 5), 50);
      const validTime = Math.min(Math.max(timeLimit, 5), 120);
      const timeLimitSeconds = validTime * 60;

      const res = await axios.post('/assessment/start', {
        domain,
        difficulty: selectedDifficulty,
        timeLimitSeconds,
        numQuestions: validQuestions
      });
      navigate(`/assessment/quiz/${res.data.sessionId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Failed to start assessment:', errorMessage);
      alert(`Failed to start assessment: ${errorMessage}`);
      setLoading(false);
    }
  };

  const selectedLevel = difficulties.find(d => d.name === selectedDifficulty);
  const isValidSettings = questionCount >= 5 && questionCount <= 50 && timeLimit >= 5 && timeLimit <= 120;

  return (
    <div className="min-h-screen text-white overflow-hidden" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
      <div className="max-w-4xl mx-auto py-24 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Assessment
          </h2>
          <p className="text-gray-400 text-lg">
            Domain: <span className="text-blue-400 font-semibold">{decodeURIComponent(domain)}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-center p-16 bg-gray-900 rounded-2xl border border-gray-800">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <p className="text-2xl text-blue-400 font-bold">Generating Your Quiz...</p>
            <p className="text-gray-400 mt-2">Preparing {questionCount} questions tailored to your settings.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Settings - Direct Input */}
            <div className="flex flex-wrap justify-center gap-6">
              {/* Question Count Input */}
              <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 shadow-sm hover:border-blue-500/50 transition-colors">
                <FileText className="w-5 h-5 text-blue-400" />
                <label className="font-medium text-gray-300">Questions:</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                  className="w-16 text-center text-lg font-bold text-blue-400 bg-gray-800 border border-gray-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-xs text-gray-500">(5-50)</span>
              </div>

              {/* Time Limit Input */}
              <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 shadow-sm hover:border-blue-500/50 transition-colors">
                <Clock className="w-5 h-5 text-blue-400" />
                <label className="font-medium text-gray-300">Time:</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={timeLimit}
                  onChange={handleTimeLimitChange}
                  className="w-16 text-center text-lg font-bold text-blue-400 bg-gray-800 border border-gray-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-400 font-medium">min</span>
                <span className="text-xs text-gray-500">(5-120)</span>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">Select Difficulty Level</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {difficulties.map(level => (
                  <button
                    key={level.name}
                    onClick={() => handleDifficultyClick(level.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none min-w-[110px] ${selectedDifficulty === level.name
                      ? `${level.selectedBorder} ring-2 ring-offset-2 ring-offset-gray-900 ${level.color.replace('text-', 'ring-')} shadow-lg bg-gray-800`
                      : `bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800 hover:shadow-md`
                      }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center mb-2 rounded-lg ${level.bgColor.replace('50', '900/50')} ${level.color}`}>
                      <DifficultyIcon level={level.level} color={level.color} />
                    </div>
                    <span className={`font-bold text-sm ${level.color}`}>{level.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleProceed}
                disabled={!selectedDifficulty || !isValidSettings}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all transform ${selectedDifficulty && isValidSettings
                  ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 shadow-lg shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
              >
                {!selectedDifficulty ? 'Select a Difficulty' : 'Start Assessment'}
              </button>
            </div>

            {/* Summary Info */}
            {/* {selectedDifficulty && (
              <div className="text-center text-sm text-gray-500">
                <span className={`font-semibold ${selectedLevel?.color}`}>{selectedDifficulty}</span>
                {' • '}
                <span className="font-semibold text-blue-400">{questionCount} questions</span>
                {' • '}
                <span className="font-semibold text-blue-400">{timeLimit} minutes</span>
              </div>
            )} */}
          </div>
        )}

        <SystemCheck
          isOpen={showSystemCheck}
          onClose={handleSystemCheckClose}
          onStart={handleStart}
        />
      </div>
    </div>
  );
}