import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SubComponentViewer from '../components/SubComponentViewer';

export default function RoadmapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [modules, setModules] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const [selectedSubComponent, setSelectedSubComponent] = useState(null);
  const [newModule, setNewModule] = useState({
    title: '',
    moduleType: 'concept',
    objective: '',
    difficultyLevel: 'Easy',
    estimatedHours: 10,
    prerequisites: [],
    topics: ['', '', ''],
    tags: ['', ''],
    priority: 'must-learn'
  });

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roadmaps/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoadmap(data.data);
        setModules(data.data.modules || []);
      } else {
        navigate('/roadmap');
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      navigate('/roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle module reorder
  const handleReorder = (moduleId, direction) => {
    const index = modules.findIndex(m => m.moduleId === moduleId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    ) {
      return;
    }

    const newModules = [...modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];

    // Update module IDs
    newModules.forEach((module, idx) => {
      module.moduleId = idx + 1;
    });

    setModules(newModules);
  };

  // Handle module deletion
  const handleDelete = (moduleId) => {
    if (window.confirm('Are you sure you want to remove this module?')) {
      const newModules = modules.filter(m => m.moduleId !== moduleId);
      newModules.forEach((module, idx) => {
        module.moduleId = idx + 1;
      });
      setModules(newModules);
    }
  };

  // Handle mark as known
  const handleMarkAsKnown = (moduleId) => {
    const newModules = modules.map(m =>
      m.moduleId === moduleId
        ? { ...m, markedAsKnown: !m.markedAsKnown }
        : m
    );
    setModules(newModules);
    // In a real app, we would save this state to the backend here or via a save button
    // For now, we update local state.
  };

  // Handle priority toggle
  const handlePriorityToggle = (moduleId) => {
    const newModules = modules.map(m =>
      m.moduleId === moduleId
        ? { ...m, priority: m.priority === 'must-learn' ? 'nice-to-have' : 'must-learn' }
        : m
    );
    setModules(newModules);
  };

  // Save changes
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roadmaps/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ modules })
      });

      if (response.ok) {
        alert('Roadmap updated successfully!');
        setIsEditing(false);
        fetchRoadmap();
      }
    } catch (error) {
      console.error('Error updating roadmap:', error);
      alert('Failed to update roadmap');
    }
  };

  // Handle add new module
  const handleAddModule = () => {
    // Validate form
    if (!newModule.title.trim()) {
      alert('Module title is required');
      return;
    }
    if (!newModule.objective.trim()) {
      alert('Module objective is required');
      return;
    }

    // Filter out empty topics and tags
    const filteredTopics = newModule.topics.filter(t => t.trim());
    const filteredTags = newModule.tags.filter(t => t.trim());

    if (filteredTopics.length === 0) {
      alert('At least one topic is required');
      return;
    }

    // Create new module with next ID
    const newModuleData = {
      moduleId: modules.length + 1,
      title: newModule.title,
      moduleType: newModule.moduleType,
      objective: newModule.objective,
      difficultyLevel: newModule.difficultyLevel,
      estimatedHours: parseInt(newModule.estimatedHours),
      prerequisites: newModule.prerequisites,
      topics: filteredTopics,
      tags: filteredTags.length > 0 ? filteredTags : [newModule.moduleType, newModule.difficultyLevel.toLowerCase()],
      isBranching: false,
      branchingOptions: [],
      priority: newModule.priority,
      markedAsKnown: false
    };

    // Add to modules list
    setModules([...modules, newModuleData]);

    // Reset form
    setNewModule({
      title: '',
      moduleType: 'concept',
      objective: '',
      difficultyLevel: 'Easy',
      estimatedHours: 10,
      prerequisites: [],
      topics: ['', '', ''],
      tags: ['', ''],
      priority: 'must-learn'
    });

    // Close form
    setShowAddModule(false);
    alert('Module added! Remember to save changes.');
  };

  // Handle topic change
  const handleTopicChange = (index, value) => {
    const newTopics = [...newModule.topics];
    newTopics[index] = value;
    setNewModule({ ...newModule, topics: newTopics });
  };

  // Handle tag change
  const handleTagChange = (index, value) => {
    const newTags = [...newModule.tags];
    newTags[index] = value;
    setNewModule({ ...newModule, tags: newTags });
  };

  // Handle start quiz for module
  const handleStartQuiz = async (moduleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roadmaps/${id}/modules/${moduleId}/quiz/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to quiz page in roadmap mode using the dedicated route
        navigate(`/roadmap/${id}/module/${moduleId}/quiz/${data.sessionId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    }
  };

  const [hydratingModules, setHydratingModules] = useState({});

  // Hydrate module content
  const hydrateModule = async (moduleId) => {
    const module = modules.find(m => m.moduleId === moduleId);
    if (!module || (module.subComponents && module.subComponents.length > 0)) {
      return;
    }

    setHydratingModules(prev => ({ ...prev, [moduleId]: true }));

    try {
      const token = localStorage.getItem('token');
      const payload = {
        requestType: 'HYDRATE_MODULE_CONTENT',
        moduleContext: {
          moduleId: module.moduleId,
          moduleTitle: module.title,
          skillLevel: roadmap.currentSkillLevel || 'Beginner',
          domain: roadmap.primaryDomain
        },
        adaptiveMetadata: {
          velocity: 'Normal', // Could be dynamic based on user progress
          preferredStyle: roadmap.preferredLearningStyle || 'Balanced',
          knownTopics: roadmap.knownTopics || []
        },
        scalingConfig: {
          minSubTopics: 10,
          maxSubTopics: 12
        }
      };

      const response = await fetch(`/api/roadmaps/${id}/modules/${moduleId}/hydrate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with new sub-components
        setModules(prevModules =>
          prevModules.map(m =>
            m.moduleId === moduleId
              ? { ...m, subComponents: data.data }
              : m
          )
        );
      } else {
        console.error('Failed to hydrate module');
      }
    } catch (error) {
      console.error('Error hydrating module:', error);
    } finally {
      setHydratingModules(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  // Toggle module expansion
  const toggleModuleExpansion = (moduleId) => {
    if (expandedModule !== moduleId) {
      // Opening a module
      hydrateModule(moduleId);
    }
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Loading roadmap...</div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Roadmap not found</div>
      </div>
    );
  }

  const completedModulesCount = modules.filter(m => m.markedAsKnown).length;
  const progressPercentage = modules.length > 0 ? Math.round((completedModulesCount / modules.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black text-white pt-24 px-6 pb-12"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            {roadmap.pathTitle || roadmap.title}
          </h1>
          <button
            onClick={() => navigate('/roadmap')}
            className="px-4 py-2 bg-[#0A0E14] border border-gray-800 rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-all flex items-center gap-2"
          >
            <span>←</span> Back to Roadmaps
          </button>
        </div>

        {/* Progress Board */}
        <div className="bg-[#0A0E14] border border-gray-800 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-medium">Overall Progress</span>
            </div>
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden w-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute h-full bg-[#1e293b] rounded-full"
                style={{ backgroundColor: '#2e3b4e' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute h-full bg-blue-600/50 rounded-full"
              // Added missing style here in the previous thought block, fixing it now.
              />
            </div>
            <div className="text-right mt-1 text-green-500 font-bold text-sm">
              {progressPercentage}%
            </div>
          </div>

          {/* Stats (Replacing Certificate) */}
          <div className="flex items-center gap-4 border-l border-gray-800 pl-8 w-full md:w-auto">
            <div className="w-10 h-10 rounded-full bg-green-900/20 text-green-500 flex items-center justify-center border border-green-900/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm">Course Duration</div>
              <div className="text-gray-400 text-xs">{roadmap.estimatedTotalHours || 0} Hours Total</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 font-semibold transition-all relative ${activeTab === 'overview' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              Overview
              {activeTab === 'overview' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`pb-4 px-2 font-semibold transition-all relative ${activeTab === 'progress' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              Progress
              {activeTab === 'progress' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`pb-4 px-2 font-semibold transition-all relative ${activeTab === 'customize' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              Customize
              {activeTab === 'customize' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {modules.map((module, index) => {
                // Logic consistent with Progress tab
                const isLocked = module.status === 'LOCKED';
                const isCompleted = module.status === 'COMPLETED' || module.markedAsKnown;
                const isActive = module.status === 'IN_PROGRESS' || (module.status === 'UNLOCKED' && !isCompleted);

                return (
                  <motion.div
                    key={module.moduleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (isLocked) {
                        alert('Please complete the previous module to unlock this one.');
                        return;
                      }
                      navigate(`/roadmap/${id}/module/${module.moduleId}`);
                    }}
                    className={`
                        relative p-6 rounded-xl border h-[240px] flex flex-col justify-between transition-all duration-300 group
                        ${isLocked
                        ? 'bg-[#0f1115]/50 border-gray-800 cursor-not-allowed opacity-60'
                        : isActive
                          ? 'bg-[#0f1115] border-yellow-600/50 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:border-yellow-500/70 cursor-pointer'
                          : 'bg-[#0f1115] border-gray-800 hover:border-gray-700/80 hover:bg-[#13161c] cursor-pointer'
                      }
                    `}
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`
                                text-[10px] font-bold px-2 py-1 rounded-md
                                ${isLocked ? 'bg-gray-800 text-gray-500' : isActive ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}
                            `}>
                          M{module.moduleId}
                        </span>
                        {isLocked && (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-lg leading-tight mb-2 line-clamp-2 ${isActive ? 'text-white' : isLocked ? 'text-gray-500' : 'text-gray-200'}`}>
                        {module.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">
                        {module.objective}
                      </p>
                    </div>

                    {/* Footer Status */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800/50">
                      <span className="text-gray-500 text-xs font-mono">
                        {module.subComponents?.length || 0} topics
                      </span>
                      <span className={`
                            text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider
                            ${isCompleted
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : isActive
                            ? 'bg-[#3A2D0C] text-yellow-500 border border-yellow-700/30'
                            : isLocked
                              ? 'bg-gray-800/50 text-gray-600 border border-gray-700/50'
                              : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }
                        `}>
                        {isCompleted ? 'Completed' : isActive ? 'In Progress' : isLocked ? 'Locked' : 'Pending'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {modules.map((module, index) => {
                const isLocked = module.status === 'LOCKED';
                const isUnlocked = module.status === 'UNLOCKED';
                const isInProgress = module.status === 'IN_PROGRESS';
                const isCompleted = module.status === 'COMPLETED';
                const isExpanded = expandedModule === module.moduleId;

                // Calculate module progress
                const quizStatus = module.knowledgeCheck?.status || 'NOT_ATTEMPTED';
                const quizPassed = quizStatus === 'PASSED';
                const quizAttempts = module.knowledgeCheck?.attempts?.length || 0;
                const quizAttemptsRemaining = (module.knowledgeCheck?.attemptsAllowed || 3) - quizAttempts;

                return (
                  <motion.div
                    key={module.moduleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      bg-[#0f1115] border rounded-xl overflow-hidden transition-all
                      ${isLocked ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-gray-700'}
                    `}
                  >
                    {/* Module Header */}
                    <div
                      onClick={() => !isLocked && toggleModuleExpansion(module.moduleId)}
                      className={`p-6 flex items-center justify-between ${!isLocked ? 'cursor-pointer hover:bg-[#13161c]' : ''} transition-colors`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Module Number Badge */}
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                          ${isCompleted ? 'bg-green-600 text-white' :
                            isInProgress ? 'bg-blue-600 text-white' :
                              isUnlocked ? 'bg-yellow-600 text-white' :
                                'bg-gray-800 text-gray-500'}
                        `}>
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            module.moduleId
                          )}
                        </div>

                        {/* Module Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-lg text-white">{module.title}</h3>
                            <span className={`
                              px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                              ${isCompleted ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                isInProgress ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  isUnlocked ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                    'bg-gray-800 text-gray-500 border border-gray-700'}
                            `}>
                              {module.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{module.objective}</p>
                        </div>

                        {/* Expand Icon */}
                        {!isLocked && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-500"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        )}

                        {/* Lock Icon */}
                        {isLocked && (
                          <div className="text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && !isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-800"
                        >
                          <div className="p-6 space-y-6">
                            {hydratingModules[module.moduleId] ? (
                              <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating personalized content...</span>
                              </div>
                            ) : (
                              <>
                                {/* Module Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="text-gray-400 text-xs mb-1">Difficulty</div>
                                    <div className="text-white font-bold">{module.difficultyLevel}</div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="text-gray-400 text-xs mb-1">Est. Hours</div>
                                    <div className="text-white font-bold">{module.estimatedHours}h</div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="text-gray-400 text-xs mb-1">Type</div>
                                    <div className="text-white font-bold capitalize">{module.moduleType}</div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="text-gray-400 text-xs mb-1">Topics</div>
                                    <div className="text-white font-bold">{module.topics?.length || 0}</div>
                                  </div>
                                </div>

                                {/* Sub-Components Section */}
                                {module.subComponents && module.subComponents.length > 0 && (
                                  <div className="bg-cyan-900/10 border border-cyan-900/30 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                          </svg>
                                        </div>
                                        <div>
                                          <h4 className="text-white font-bold">Learning Content</h4>
                                          <p className="text-gray-400 text-sm">
                                            {module.subComponents.filter(sc => sc.status === 'REVIEWED').length} of {module.subComponents.length} topics reviewed
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-cyan-400 font-bold text-2xl">
                                        {Math.round((module.subComponents.filter(sc => sc.status === 'REVIEWED').length / module.subComponents.length) * 100)}%
                                      </div>
                                    </div>

                                    {/* Sub-Components List */}
                                    <div className="space-y-3">
                                      {module.subComponents.map((subComponent) => (
                                        <SubComponentViewer
                                          key={subComponent.subComponentId}
                                          subComponent={subComponent}
                                          roadmapId={id}
                                          moduleId={module.moduleId}
                                          onStatusChange={() => fetchRoadmap()}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Knowledge Check (Quiz) Section */}
                                <div className="bg-purple-900/10 border border-purple-900/30 rounded-xl p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="text-white font-bold">Knowledge Check (Quiz)</h4>
                                        <p className="text-gray-400 text-sm">Test your understanding with 10 questions</p>
                                      </div>
                                    </div>
                                    <div className={`
                                  px-3 py-1 rounded-full text-xs font-bold uppercase
                                  ${quizPassed ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                        quizAttempts > 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                          'bg-gray-800 text-gray-500 border border-gray-700'}
                                `}>
                                      {quizStatus.replace('_', ' ')}
                                    </div>
                                  </div>

                                  {/* Quiz Stats */}
                                  {quizAttempts > 0 && (
                                    <div className="mb-4 p-4 bg-gray-900/50 rounded-lg">
                                      <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                          <div className="text-gray-400 text-xs mb-1">Attempts</div>
                                          <div className="text-white font-bold">{quizAttempts}/3</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-400 text-xs mb-1">Best Score</div>
                                          <div className="text-white font-bold">
                                            {Math.max(...(module.knowledgeCheck?.attempts?.map(a => a.score) || [0]))}%
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-gray-400 text-xs mb-1">Remaining</div>
                                          <div className="text-white font-bold">{quizAttemptsRemaining}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Quiz Action Button */}
                                  <button
                                    onClick={() => handleStartQuiz(module.moduleId)}
                                    disabled={quizPassed || quizAttemptsRemaining === 0}
                                    className={`
                                  w-full px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                                  ${quizPassed ? 'bg-green-600 text-white cursor-default' :
                                        quizAttemptsRemaining === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                                          'bg-purple-600 hover:bg-purple-500 text-white'}
                                `}
                                  >
                                    {quizPassed ? (
                                      <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Quiz Passed
                                      </>
                                    ) : quizAttemptsRemaining === 0 ? (
                                      <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        No Attempts Left
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {quizAttempts > 0 ? 'Retry Quiz' : 'Start Quiz'}
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Coding Challenges Section (Coming Soon) */}
                                <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-6 opacity-50">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="text-white font-bold">Coding Challenges</h4>
                                        <p className="text-gray-400 text-sm">Practice with hands-on problems</p>
                                      </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-500 border border-gray-700">
                                      COMING SOON
                                    </span>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full px-6 py-3 bg-gray-800 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                                  >
                                    Start Coding Challenge
                                  </button>
                                </div>

                                {/* Interview Prep Section (Coming Soon) */}
                                <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-6 opacity-50">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="text-white font-bold">Interview Preparation</h4>
                                        <p className="text-gray-400 text-sm">Practice interview questions</p>
                                      </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-500 border border-gray-700">
                                      COMING SOON
                                    </span>
                                  </div>
                                  <button
                                    disabled
                                    className="w-full px-6 py-3 bg-gray-800 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                                  >
                                    Start Interview Prep
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Customize Tab */}
          {activeTab === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header / Actions */}
              <div className="bg-[#0A0E14] border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-24 z-10 backdrop-blur-xl bg-opacity-80">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-900/50 text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Customize Roadmap</h2>
                    <p className="text-gray-400 text-sm">Reorder, prioritize, or remove modules to fit your goals.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setShowAddModule(true)}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-900/20 flex-1 md:flex-none flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Module
                      </button>
                      <button
                        onClick={() => {
                          setModules(roadmap.modules);
                          setIsEditing(false);
                          setShowAddModule(false);
                        }}
                        className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all font-medium border border-gray-700 hover:border-gray-600 flex-1 md:flex-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-green-900/20 flex-1 md:flex-none flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-900/20 w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Enable Editing
                    </button>
                  )}
                </div>
              </div>

              {/* Add Module Form */}
              {showAddModule && isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-6 border-2 border-purple-500/50"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="p-2 bg-purple-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </span>
                      Add New Module
                    </h3>
                    <button
                      onClick={() => setShowAddModule(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Module Title */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Module Title *
                      </label>
                      <input
                        type="text"
                        value={newModule.title}
                        onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                        placeholder=""
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Module Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Module Type *
                      </label>
                      <select
                        value={newModule.moduleType}
                        onChange={(e) => setNewModule({ ...newModule, moduleType: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="concept">Concept (Theory)</option>
                        <option value="coding">Coding (Practice)</option>
                        <option value="project">Project (Build)</option>
                        <option value="revision">Revision (Review)</option>
                        <option value="interview">Interview (Prep)</option>
                      </select>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Difficulty Level *
                      </label>
                      <select
                        value={newModule.difficultyLevel}
                        onChange={(e) => setNewModule({ ...newModule, difficultyLevel: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Estimated Hours *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={newModule.estimatedHours}
                        onChange={(e) => setNewModule({ ...newModule, estimatedHours: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Priority *
                      </label>
                      <select
                        value={newModule.priority}
                        onChange={(e) => setNewModule({ ...newModule, priority: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="must-learn">Must Learn</option>
                        <option value="nice-to-have">Nice to Have</option>
                      </select>
                    </div>

                    {/* Objective */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Learning Objective *
                      </label>
                      <textarea
                        value={newModule.objective}
                        onChange={(e) => setNewModule({ ...newModule, objective: e.target.value })}
                        placeholder="What will you learn in this module?"
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {/* Topics */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Topics Covered (at least 1 required)
                      </label>
                      <div className="space-y-2">
                        {newModule.topics.map((topic, index) => (
                          <input
                            key={index}
                            type="text"
                            value={topic}
                            onChange={(e) => handleTopicChange(index, e.target.value)}
                            placeholder={`Topic ${index + 1}`}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Tags (optional)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {newModule.tags.map((tag, index) => (
                          <input
                            key={index}
                            type="text"
                            value={tag}
                            onChange={(e) => handleTagChange(index, e.target.value)}
                            placeholder={`Tag ${index + 1}`}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddModule(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddModule}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Module
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Module List */}
              <div className="grid grid-cols-1 gap-4">
                {modules.map((module, index) => (
                  <motion.div
                    key={module.moduleId}
                    layoutId={module.moduleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`
                        relative overflow-hidden rounded-xl border transition-all duration-300
                        ${isEditing ? 'cursor-move hover:border-gray-500' : ''}
                        ${module.markedAsKnown
                        ? 'bg-gray-900/40 border-gray-800 opacity-60'
                        : 'bg-[#0f1115] border-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center p-5 gap-6">
                      {/* Drag Handle (Visible only in edit mode) */}
                      {isEditing && (
                        <div className="hidden md:flex flex-col gap-1 text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                        </div>
                      )}

                      {/* Index Badge */}
                      <div className={`
                            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner
                            ${module.markedAsKnown
                          ? 'bg-green-900/20 text-green-500 border border-green-500/20'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }
                         `}>
                        {module.moduleId}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-bold text-lg truncate ${module.markedAsKnown ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {module.title}
                          </h3>
                          {module.priority === 'must-learn' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-900/50 uppercase tracking-wide">
                              Must Learn
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm truncate">
                          {module.objective}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {/* Status Toggle */}
                        <button
                          onClick={() => handleMarkAsKnown(module.moduleId)}
                          disabled={!isEditing}
                          className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                                    ${module.markedAsKnown
                              ? 'bg-green-500/10 border-green-500/30 text-green-500'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }
                                    ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                `}
                        >
                          {module.markedAsKnown ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              <span className="hidden md:inline">Done</span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                              <span className="hidden md:inline">Mark Done</span>
                            </>
                          )}
                        </button>

                        {/* Priority Toggle */}
                        <button
                          onClick={() => handlePriorityToggle(module.moduleId)}
                          disabled={!isEditing}
                          className={`
                                    p-2 rounded-lg transition-all border
                                    ${module.priority === 'must-learn'
                              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
                            }
                                    ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                `}
                          title="Toggle Priority"
                        >
                          <svg className="w-5 h-5" fill={module.priority === 'must-learn' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        </button>

                        {/* Move Up/Down & Delete */}
                        {isEditing && (
                          <div className="flex items-center gap-1 pl-3 border-l border-gray-800 ml-1">
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleReorder(module.moduleId, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button
                                onClick={() => handleReorder(module.moduleId, 'down')}
                                disabled={index === modules.length - 1}
                                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            </div>
                            <button
                              onClick={() => handleDelete(module.moduleId)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
