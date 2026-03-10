import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const CORE_SUBJECTS = [
  {
    id: 1,
    title: 'Operating Systems',
    description: 'An introductory course on Operating Systems covering process management, memory handling, file systems, and system calls.',
    icon: '💻',
    color: 'bg-blue-600'
  },
  {
    id: 2,
    title: 'Database Management Systems',
    description: 'A Database Management System (DBMS) course teaches the fundamentals of storing, organizing, and managing data efficiently.',
    icon: '🗄️',
    color: 'bg-purple-600'
  },
  {
    id: 3,
    title: 'Computer Communication and Networks',
    description: 'A foundational course on Computer Communication and Networks focusing on network architecture, protocols, and data transmission.',
    icon: '🌐',
    color: 'bg-orange-600'
  }
];

const POPULAR_DOMAINS = [
  'Full Stack Java Development',
  'MERN Stack Development',
  'Python Full Stack',
  'Data Science & Machine Learning',
  'DevOps Engineering',
  'Cloud Architecture (AWS/Azure)',
  'Mobile App Development',
  'Cybersecurity',
  'AI/ML Engineering',
  'Blockchain Development'
];

export default function Roadmap() {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [aiGenerationStep, setAIGenerationStep] = useState(0);
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [formData, setFormData] = useState({
    primaryDomain: '',
    currentSkillLevel: '',
    timeCommitment: '',
    learningGoal: '',
    deadline: '',
    knownTopics: [],
    preferredLearningStyle: ''
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const response = await api.get('/roadmaps');
      setRoadmaps(response.data.data || []);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingRequirements = async () => {
    try {
      const response = await api.get('/requirements');
      if (response.data.success) {
        const profile = response.data.data;
        setFormData({
          primaryDomain: profile.primaryDomain || '',
          currentSkillLevel: profile.currentSkillLevel || '',
          timeCommitment: profile.timeCommitment || '',
          learningGoal: profile.learningGoal || '',
          deadline: profile.deadline ? new Date(profile.deadline).toISOString().split('T')[0] : '',
          knownTopics: profile.knownTopics || [],
          preferredLearningStyle: profile.preferredLearningStyle || ''
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.primaryDomain.trim()) {
      newErrors.primaryDomain = 'Primary domain is required';
    }

    if (!formData.currentSkillLevel) {
      newErrors.currentSkillLevel = 'Current skill level is required';
    }

    if (!formData.timeCommitment || formData.timeCommitment < 1) {
      newErrors.timeCommitment = 'Time commitment must be at least 1 hour per week';
    }

    if (!formData.learningGoal) {
      newErrors.learningGoal = 'Learning goal is required';
    }

    if (!formData.preferredLearningStyle) {
      newErrors.preferredLearningStyle = 'Preferred learning style is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // First, save requirements
      const reqResponse = await api({
        method: isEditing ? 'PUT' : 'POST',
        url: '/requirements',
        data: formData
      });

      if (reqResponse.data.success) {
        // Show AI generation interface
        setShowWizard(false);
        setShowAIGeneration(true);
        setAIGenerationStep(0);

        // Simulate AI processing steps
        await simulateAIGeneration();

        // Then, create roadmap from requirements with AI
        const roadmapResponse = await api.post('/roadmaps', {
          domain: formData.primaryDomain,
          level: formData.currentSkillLevel,
          goal: formData.learningGoal,
          LearningStyle: formData.preferredLearningStyle
        });

        if (roadmapResponse.data.success) {
          setGeneratedRoadmap(roadmapResponse.data.data);
          setAIGenerationStep(6); // Complete

          setTimeout(() => {
            setShowAIGeneration(false);
            setAIGenerationStep(0);
            setGeneratedRoadmap(null);
            fetchRoadmaps(); // Refresh roadmaps list
          }, 2000);
        } else {
          setErrors({ submit: roadmapResponse.data.message || 'Failed to create roadmap' });
          setShowAIGeneration(false);
        }
      } else {
        setErrors({ submit: reqResponse.data.message || 'Failed to save requirements' });
      }
    } catch (error) {
      console.error('Error saving requirements:', error);
      setErrors({ submit: 'Network error. Please try again.' });
      setShowAIGeneration(false);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIGeneration = () => {
    return new Promise((resolve) => {
      const steps = [
        { step: 1, delay: 800 },
        { step: 2, delay: 1200 },
        { step: 3, delay: 1000 },
        { step: 4, delay: 1500 },
        { step: 5, delay: 1000 }
      ];

      let currentDelay = 0;
      steps.forEach(({ step, delay }) => {
        currentDelay += delay;
        setTimeout(() => setAIGenerationStep(step), currentDelay);
      });

      setTimeout(resolve, currentDelay);
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenerateRoadmap = () => {
    // Reset form to empty state for fresh roadmap
    setFormData({
      primaryDomain: '',
      currentSkillLevel: '',
      timeCommitment: '',
      learningGoal: '',
      deadline: '',
      knownTopics: [],
      preferredLearningStyle: ''
    });
    setErrors({});
    setIsEditing(false);
    setShowWizard(true);
  };

  const handleBackToMain = () => {
    setShowWizard(false);
    setFormData({
      primaryDomain: '',
      currentSkillLevel: '',
      timeCommitment: '',
      learningGoal: '',
      deadline: '',
      knownTopics: [],
      preferredLearningStyle: ''
    });
    setErrors({});
    setShowSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // AI Generation Progress View
  if (showAIGeneration) {
    const aiSteps = [
      { id: 1, title: 'Analyzing User Profile', icon: '👤', desc: 'Processing your learning preferences and goals' },
      { id: 2, title: 'Generating Main Components', icon: '🧩', desc: 'Creating 6-12 major learning modules' },
      { id: 3, title: 'Identifying Branching Points', icon: '🔀', desc: 'Finding specialization opportunities' },
      { id: 4, title: 'Estimating Time Per Component', icon: '⏱️', desc: 'Calculating realistic time commitments' },
      { id: 5, title: 'Creating Dependency Map', icon: '🗺️', desc: 'Building prerequisite relationships' },
      { id: 6, title: 'Roadmap Complete!', icon: '✅', desc: 'Your personalized learning path is ready' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4" style={{ background: '#0A0E14' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{ rotate: aiGenerationStep < 6 ? 360 : 0 }}
              transition={{ duration: 2, repeat: aiGenerationStep < 6 ? Infinity : 0, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-3">
              {aiGenerationStep < 6 ? 'AI Roadmap Generation' : 'Generation Complete!'}
            </h2>
            <p className="text-gray-400 text-lg">
              {aiGenerationStep < 6
                ? 'Our AI is crafting your personalized learning journey...'
                : 'Your custom roadmap has been created successfully!'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
            <div className="space-y-6">
              {aiSteps.map((step) => {
                const isActive = aiGenerationStep === step.id;
                const isCompleted = aiGenerationStep > step.id;
                const isPending = aiGenerationStep < step.id;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.id * 0.1 }}
                    className={`flex items-start space-x-4 p-4 rounded-lg transition-all ${isActive ? 'bg-blue-900/30 border-2 border-blue-500' :
                      isCompleted ? 'bg-green-900/20 border border-green-700' :
                        'bg-gray-800/50 border border-gray-700'
                      }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isActive ? 'bg-blue-600 animate-pulse' :
                      isCompleted ? 'bg-green-600' :
                        'bg-gray-700'
                      }`}>
                      {isCompleted ? '✓' : step.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-lg font-semibold ${isActive ? 'text-blue-400' :
                          isCompleted ? 'text-green-400' :
                            'text-gray-400'
                          }`}>
                          {step.title}
                        </h3>
                        {isActive && (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm ${isActive || isCompleted ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-300">Overall Progress</span>
                <span className="text-sm font-bold text-blue-400">{Math.round((aiGenerationStep / 6) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(aiGenerationStep / 6) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 h-3 rounded-full"
                />
              </div>
            </div>

            {/* Generation Stats */}
            {generatedRoadmap && aiGenerationStep === 6 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-700"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{generatedRoadmap.totalModules || 0}</div>
                    <div className="text-xs text-gray-400">Modules</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{generatedRoadmap.estimatedTotalHours || 0}h</div>
                    <div className="text-xs text-gray-400">Total Hours</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{generatedRoadmap.duration || 'N/A'}</div>
                    <div className="text-xs text-gray-400">Duration</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Requirements Form View
  if (showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 pt-20 pb-12" style={{ background: '#0A0E14' }}>
        <div className="max-w-5xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={handleBackToMain}
            className="mb-6 flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Requirements
            </h2>
            <p className="text-gray-400 text-lg">
              Tell us about your learning journey to create a powerful personalized roadmap
            </p>
          </motion.div>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-600 text-white rounded-lg text-center"
            >
              ✓ Requirements {isEditing ? 'updated' : 'saved'} successfully!
            </motion.div>
          )}

          {/* Enhanced Requirements Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Primary Domain */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  <span className="text-blue-400">1.</span> Primary Domain *
                </label>
                <input
                  type="text"
                  value={formData.primaryDomain}
                  onChange={(e) => handleInputChange('primaryDomain', e.target.value)}
                  placeholder="e.g., Full Stack Java Development"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  list="domains"
                />
                <datalist id="domains">
                  {POPULAR_DOMAINS.map((domain, index) => (
                    <option key={index} value={domain} />
                  ))}
                </datalist>
                {errors.primaryDomain && (
                  <p className="text-red-400 text-sm mt-2">{errors.primaryDomain}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">Choose from popular domains or enter your own</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Skill Level */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">
                    <span className="text-blue-400">2.</span> Current Skill Level *
                  </label>
                  <select
                    value={formData.currentSkillLevel}
                    onChange={(e) => handleInputChange('currentSkillLevel', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your level</option>
                    <option value="Absolute Beginner">Absolute Beginner (No prior knowledge)</option>
                    <option value="Beginner">Beginner (Basic understanding)</option>
                    <option value="Intermediate">Intermediate (Some experience)</option>
                    <option value="Advanced">Advanced (Proficient)</option>
                  </select>
                  {errors.currentSkillLevel && (
                    <p className="text-red-400 text-sm mt-2">{errors.currentSkillLevel}</p>
                  )}
                </div>

                {/* Time Commitment */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">
                    <span className="text-blue-400">3.</span> Time Commitment (hours/week) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.timeCommitment}
                    onChange={(e) => handleInputChange('timeCommitment', parseInt(e.target.value))}
                    placeholder="e.g., 10"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.timeCommitment && (
                    <p className="text-red-400 text-sm mt-2">{errors.timeCommitment}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-2">How many hours per week can you dedicate?</p>
                </div>

                {/* Learning Goal */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">
                    <span className="text-blue-400">4.</span> Learning Goal *
                  </label>
                  <select
                    value={formData.learningGoal}
                    onChange={(e) => handleInputChange('learningGoal', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your goal</option>
                    <option value="Job-ready">Job-ready (Career transition)</option>
                    <option value="Project-based">Project-based (Build portfolio)</option>
                    <option value="Knowledge">Knowledge (Personal growth)</option>
                  </select>
                  {errors.learningGoal && (
                    <p className="text-red-400 text-sm mt-2">{errors.learningGoal}</p>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">
                    <span className="text-blue-400">5.</span> Target Completion Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-500 text-xs mt-2">When do you want to complete this?</p>
                </div>
              </div>

              {/* Known Topics */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  <span className="text-blue-400">6.</span> Known Topics (Optional)
                </label>
                <textarea
                  value={formData.knownTopics.join(', ')}
                  onChange={(e) => {
                    const topics = e.target.value.split(',').map(topic => topic.trim()).filter(topic => topic);
                    setFormData(prev => ({ ...prev, knownTopics: topics }));
                  }}
                  placeholder="e.g., HTML, CSS, JavaScript basics, Git"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
                <p className="text-gray-500 text-xs mt-2">List topics you already know (comma-separated)</p>
              </div>

              {/* Preferred Learning Style */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  <span className="text-blue-400">7.</span> Preferred Learning Style *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'Theory-first', label: 'Theory-first', desc: 'Learn concepts before practice' },
                    { value: 'Practice-first', label: 'Practice-first', desc: 'Hands-on learning approach' },
                    { value: 'Balanced', label: 'Balanced', desc: 'Mix of theory and practice' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => handleInputChange('preferredLearningStyle', style.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.preferredLearningStyle === style.value
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
                        }`}
                    >
                      <div className="font-semibold mb-1">{style.label}</div>
                      <div className="text-xs opacity-80">{style.desc}</div>
                    </button>
                  ))}
                </div>
                {errors.preferredLearningStyle && (
                  <p className="text-red-400 text-sm mt-2">{errors.preferredLearningStyle}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-800">
                {errors.submit && (
                  <p className="text-red-400 text-sm mb-4 text-center">{errors.submit}</p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-2xl"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-3"></div>
                      Processing Your Requirements...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate My AI-Powered Roadmap
                    </span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Roadmap View
  const hasRoadmaps = roadmaps.length > 0;

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      {/* Header with New Roadmap Button */}
      <div className="px-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Continue Learning</h1>
        </div>
        {hasRoadmaps && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateRoadmap}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Roadmap
          </motion.button>
        )}
      </div>

      {/* Empty State - Show when no roadmaps */}
      {!hasRoadmaps && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-6 mb-12"
        >
          <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">No Roadmaps Yet?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start your learning journey by creating a personalized roadmap
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateRoadmap}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Generate Your First Roadmap!
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Existing Roadmaps View - Show when roadmaps exist */}
      {hasRoadmaps && (
        <div className="px-6 mb-12">
          {/* Roadmap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap, index) => {
              const progressPercent = roadmap.modules
                ? Math.round((roadmap.modules.filter(m => m.markedAsKnown).length / roadmap.modules.length) * 100)
                : 0;
              const totalDays = roadmap.modules ? roadmap.modules.length : 0;

              return (
                <motion.div
                  key={roadmap._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/roadmap/${roadmap._id}`)}
                  className="bg-[#0f1115] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group flex flex-col sm:flex-row gap-6 relative overflow-hidden"
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Icon Section (Left) - Fixed Dimensions */}
                  <div className="flex-shrink-0">
                    <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:border-white/10 transition-colors">
                      <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <svg className="w-14 h-14 text-cyan-400 relative z-10 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content Section (Right) - Flexible */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 z-10">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-green-400 transition-colors truncate">
                        {roadmap.pathTitle || roadmap.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {roadmap.description || `Master ${roadmap.pathTitle || roadmap.title} with this fully structured learning path.`}
                      </p>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-5">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Progress</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white">{progressPercent}%</span>
                            <span className="text-xs text-gray-500 font-medium">completed</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                          {totalDays} Days
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-4 mt-auto pt-2 border-t border-gray-800/50">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 text-[11px] font-bold border border-gray-700 uppercase tracking-wide whitespace-nowrap">
                          {roadmap.currentSkillLevel || 'Beginner'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-blue-900/10 text-blue-400 text-[11px] font-bold border border-blue-900/20 uppercase tracking-wide whitespace-nowrap">
                          {roadmap.totalModules || 0} Modules
                        </span>
                      </div>

                      <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-lg shadow-green-900/20 whitespace-nowrap group-hover:translate-x-1 duration-300">
                        Continue
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Core Subjects Section - Always show */}
      <div className="px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Core <span className="text-green-500">Subjects</span>
          </h2>
          <p className="text-gray-400">
            Master fundamental computer science concepts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_SUBJECTS.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors cursor-pointer group border border-gray-800"
            >
              <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{subject.icon}</span>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                {subject.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {subject.description}
              </p>

              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
