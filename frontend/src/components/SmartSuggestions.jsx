import { useState, useEffect } from 'react';

const generateSmartSuggestions = (existingSteps) => {
  const stepTypes = existingSteps.map(step => step.stepType);
  const lastStep = existingSteps[existingSteps.length - 1];
  const hasInterview = stepTypes.includes('interview');
  const conceptCount = stepTypes.filter(type => type === 'concept').length;
  const codingCount = stepTypes.filter(type => type === 'coding').length;
  const revisionCount = stepTypes.filter(type => type === 'revision').length;

  const suggestions = [];

  // If no interview step exists and we have enough content, suggest interview
  if (!hasInterview && existingSteps.length >= 5) {
    suggestions.push({
      title: "Final Assessment",
      stepType: "interview",
      objective: "Demonstrate mastery through comprehensive assessment and discussion",
      estimatedEffort: "2-3 hours",
      difficultyLevel: "Hard",
      tags: ["assessment", "interview", "final"],
      reason: "Every learning path should end with an assessment to validate knowledge"
    });
  }

  // If we have many concepts but few coding exercises
  if (conceptCount > codingCount + 1) {
    suggestions.push({
      title: "Hands-on Practice",
      stepType: "coding",
      objective: "Apply theoretical knowledge through practical implementation",
      estimatedEffort: "4-6 hours",
      difficultyLevel: "Medium",
      tags: ["practice", "implementation", "hands-on"],
      reason: "Balance theory with practical application"
    });
  }

  // If we have many steps without revision
  if (existingSteps.length > 4 && revisionCount === 0) {
    suggestions.push({
      title: "Knowledge Review",
      stepType: "revision",
      objective: "Review and consolidate learned concepts and skills",
      estimatedEffort: "2-3 hours",
      difficultyLevel: "Easy",
      tags: ["review", "consolidation", "reinforcement"],
      reason: "Regular review helps consolidate learning"
    });
  }

  // If last step was coding, suggest review or advanced concept
  if (lastStep?.stepType === 'coding') {
    suggestions.push({
      title: "Code Review & Optimization",
      stepType: "revision",
      objective: "Review implemented code and optimize for performance and maintainability",
      estimatedEffort: "2-4 hours",
      difficultyLevel: "Medium",
      tags: ["code-review", "optimization", "best-practices"],
      reason: "Follow up coding with review and optimization"
    });
  }

  // If last step was concept, suggest practical application
  if (lastStep?.stepType === 'concept') {
    suggestions.push({
      title: "Practical Application",
      stepType: "coding",
      objective: "Apply the learned concepts through hands-on implementation",
      estimatedEffort: "3-5 hours",
      difficultyLevel: "Medium",
      tags: ["application", "practice", "implementation"],
      reason: "Apply theoretical knowledge practically"
    });
  }

  // Advanced concepts suggestion
  if (conceptCount >= 2 && !existingSteps.some(step => step.tags?.includes('advanced'))) {
    suggestions.push({
      title: "Advanced Concepts",
      stepType: "concept",
      objective: "Explore advanced topics and specialized techniques",
      estimatedEffort: "4-6 hours",
      difficultyLevel: "Hard",
      tags: ["advanced", "specialized", "deep-dive"],
      reason: "Deepen understanding with advanced topics"
    });
  }

  // Project-based learning suggestion
  if (codingCount >= 2 && !existingSteps.some(step => step.tags?.includes('project'))) {
    suggestions.push({
      title: "Capstone Project",
      stepType: "coding",
      objective: "Build a comprehensive project that demonstrates all learned skills",
      estimatedEffort: "8-12 hours",
      difficultyLevel: "Hard",
      tags: ["project", "capstone", "portfolio"],
      reason: "Showcase skills with a comprehensive project"
    });
  }

  return suggestions.slice(0, 4); // Return top 4 suggestions
};

export default function SmartSuggestions({ isOpen, onClose, existingSteps, onSelectSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isOpen && existingSteps) {
      const smartSuggestions = generateSmartSuggestions(existingSteps);
      setSuggestions(smartSuggestions);
    }
  }, [isOpen, existingSteps]);

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
      case 'Easy': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'Medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'Hard': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Smart Suggestions</h2>
              <p className="text-indigo-200">AI-powered recommendations based on your current roadmap</p>
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

        {/* Suggestions */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-indigo-500 transition cursor-pointer"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">{getStepTypeIcon(suggestion.stepType)}</span>
                      <span className="text-xs px-2 py-1 rounded bg-indigo-600/20 text-indigo-400 font-medium">
                        {suggestion.stepType}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{suggestion.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded font-medium border ${getDifficultyColor(suggestion.difficultyLevel)}`}>
                          {suggestion.difficultyLevel}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-600/50 px-2 py-1 rounded">
                          {suggestion.estimatedEffort}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{suggestion.objective}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {suggestion.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-gray-600/30 text-gray-400 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-indigo-400 bg-indigo-600/20 px-2 py-1 rounded">
                          💡 {suggestion.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">No Suggestions Available</h3>
              <p className="text-gray-400">Your roadmap looks well-balanced! Add more steps to get personalized suggestions.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            💡 Suggestions are generated based on your current roadmap structure and learning best practices
          </p>
        </div>
      </div>
    </div>
  );
}