import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

export default function ProgressAnalytics({ roadmap, isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (isOpen && roadmap) {
      calculateAnalytics();
    }
  }, [isOpen, roadmap]);

  const calculateAnalytics = () => {
    const steps = roadmap.steps || [];
    const completedSteps = Array.isArray(roadmap.completedSteps) 
      ? roadmap.completedSteps 
      : [];

    // Basic progress
    const totalSteps = steps.length;
    const completedCount = completedSteps.length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    // Step type analysis
    const stepTypeAnalysis = {
      concept: { total: 0, completed: 0 },
      coding: { total: 0, completed: 0 },
      revision: { total: 0, completed: 0 },
      interview: { total: 0, completed: 0 }
    };

    // Difficulty analysis
    const difficultyAnalysis = {
      Easy: { total: 0, completed: 0 },
      Medium: { total: 0, completed: 0 },
      Hard: { total: 0, completed: 0 }
    };

    // Time analysis
    let totalEstimatedHours = 0;
    let completedEstimatedHours = 0;

    steps.forEach((step, index) => {
      const stepId = step.stepId || step.id || `step_${index + 1}`;
      const isCompleted = completedSteps.includes(stepId);
      
      // Step type analysis
      const stepType = step.stepType || 'concept';
      if (stepTypeAnalysis[stepType]) {
        stepTypeAnalysis[stepType].total++;
        if (isCompleted) stepTypeAnalysis[stepType].completed++;
      }

      // Difficulty analysis
      const difficulty = step.difficultyLevel || 'Medium';
      if (difficultyAnalysis[difficulty]) {
        difficultyAnalysis[difficulty].total++;
        if (isCompleted) difficultyAnalysis[difficulty].completed++;
      }

      // Time analysis
      const effort = step.estimatedEffort || '2-3 hours';
      const hours = parseEstimatedHours(effort);
      totalEstimatedHours += hours;
      if (isCompleted) completedEstimatedHours += hours;
    });

    // Learning velocity (steps per week - mock calculation)
    const createdDate = new Date(roadmap.createdAt || Date.now());
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const stepsPerWeek = Math.round((completedCount / daysSinceCreation) * 7 * 10) / 10;

    // Estimated completion
    const remainingSteps = totalSteps - completedCount;
    const estimatedDaysToComplete = stepsPerWeek > 0 ? Math.ceil((remainingSteps / stepsPerWeek) * 7) : 0;

    setAnalytics({
      basic: {
        totalSteps,
        completedCount,
        progressPercentage,
        remainingSteps
      },
      stepTypes: stepTypeAnalysis,
      difficulty: difficultyAnalysis,
      time: {
        totalEstimatedHours: Math.round(totalEstimatedHours),
        completedEstimatedHours: Math.round(completedEstimatedHours),
        remainingHours: Math.round(totalEstimatedHours - completedEstimatedHours)
      },
      velocity: {
        stepsPerWeek,
        estimatedDaysToComplete
      }
    });
  };

  const parseEstimatedHours = (effort) => {
    const match = effort.match(/(\d+)(?:-(\d+))?\s*hours?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2;
    }
    return 3; // Default fallback
  };

  const getStepTypeIcon = (stepType) => {
    switch (stepType) {
      case 'concept': return '📚';
      case 'coding': return '💻';
      case 'revision': return '🔄';
      case 'interview': return '🎯';
      default: return '📝';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen || !analytics) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Progress Analytics</h2>
              <p className="text-cyan-200">Detailed insights into your learning journey</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Progress */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Overall Progress</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24">
                  <CircularProgressbar
                    value={analytics.basic.progressPercentage}
                    text={`${analytics.basic.progressPercentage}%`}
                    styles={buildStyles({
                      textSize: '16px',
                      textColor: '#fff',
                      pathColor: analytics.basic.progressPercentage >= 70 ? '#10B981' : 
                                analytics.basic.progressPercentage >= 40 ? '#F59E0B' : '#EF4444',
                      trailColor: 'rgba(255, 255, 255, 0.2)'
                    })}
                  />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.basic.completedCount} / {analytics.basic.totalSteps}
                  </div>
                  <div className="text-gray-400">Steps Completed</div>
                  <div className="text-sm text-cyan-400 mt-1">
                    {analytics.basic.remainingSteps} steps remaining
                  </div>
                </div>
              </div>
            </div>

            {/* Time Analysis */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Time Investment</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Estimated:</span>
                  <span className="text-white font-semibold">{analytics.time.totalEstimatedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Invested:</span>
                  <span className="text-green-400 font-semibold">{analytics.time.completedEstimatedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining:</span>
                  <span className="text-yellow-400 font-semibold">{analytics.time.remainingHours}h</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${analytics.time.totalEstimatedHours > 0 ? 
                        (analytics.time.completedEstimatedHours / analytics.time.totalEstimatedHours) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Step Type Breakdown */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Learning Activities</h3>
              <div className="space-y-4">
                {Object.entries(analytics.stepTypes).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getStepTypeIcon(type)}</span>
                      <span className="text-white capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{data.completed}/{data.total}</span>
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Difficulty Mastery</h3>
              <div className="space-y-4">
                {Object.entries(analytics.difficulty).map(([difficulty, data]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        difficulty === 'Easy' ? 'bg-green-500' :
                        difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`font-medium ${getDifficultyColor(difficulty)}`}>{difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{data.completed}/{data.total}</span>
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            difficulty === 'Easy' ? 'bg-green-500' :
                            difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Velocity */}
            <div className="bg-gray-700/50 rounded-lg p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Learning Velocity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {analytics.velocity.stepsPerWeek}
                  </div>
                  <div className="text-gray-400">Steps per week</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {analytics.velocity.estimatedDaysToComplete}
                  </div>
                  <div className="text-gray-400">Days to completion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {Math.round((analytics.basic.completedCount / Math.max(1, analytics.basic.totalSteps)) * 100)}%
                  </div>
                  <div className="text-gray-400">Journey complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            📊 Analytics are calculated based on your progress and estimated completion times
          </p>
        </div>
      </div>
    </div>
  );
}