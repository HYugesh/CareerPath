import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SubComponentViewer from '../components/SubComponentViewer';

export default function ModuleDetail() {
  const { roadmapId, moduleId } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [module, setModule] = useState(null);
  const [selectedSubComponent, setSelectedSubComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrating, setIsHydrating] = useState(false);

  useEffect(() => {
    fetchModuleData();
  }, [roadmapId, moduleId]);

  const hydrateModuleContent = async (targetModule, roadmapData) => {
    setIsHydrating(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        requestType: 'HYDRATE_MODULE_CONTENT',
        moduleContext: {
          moduleId: targetModule.moduleId,
          moduleTitle: targetModule.title,
          skillLevel: roadmapData.currentSkillLevel || 'Beginner',
          domain: roadmapData.primaryDomain
        },
        adaptiveMetadata: {
          velocity: 'Normal',
          preferredStyle: roadmapData.preferredLearningStyle || 'Balanced',
          knownTopics: roadmapData.knownTopics || []
        },
        scalingConfig: {
          minSubTopics: 10,
          maxSubTopics: 12
        }
      };

      const response = await fetch(`/api/roadmaps/${roadmapId}/modules/${moduleId}/hydrate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        const newSubComponents = resData.data;

        // Update local state
        setModule(prev => ({
          ...prev,
          subComponents: newSubComponents
        }));

        if (newSubComponents.length > 0) {
          setSelectedSubComponent(newSubComponents[0]);
        }
      } else {
        console.error('Failed to hydrate module');
      }
    } catch (error) {
      console.error('Error hydrating module:', error);
    } finally {
      setIsHydrating(false);
    }
  };

  const fetchModuleData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roadmaps/${roadmapId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoadmap(data.data);
        const foundModule = data.data.modules.find(m => m.moduleId === parseInt(moduleId));
        setModule(foundModule);

        // Trigger progress check to update module status and unlock next module if needed
        if (foundModule) {
          checkModuleProgress(foundModule);
        }

        // Auto-select first sub-component if available, otherwise hydrate
        if (foundModule?.subComponents && foundModule.subComponents.length > 0) {
          setSelectedSubComponent(foundModule.subComponents[0]);
        } else if (foundModule) {
          // Trigger hydration if unlocked or active (or just always for detail view logic)
          hydrateModuleContent(foundModule, data.data);
        }
      } else {
        navigate(`/roadmap/${roadmapId}`);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
      navigate(`/roadmap/${roadmapId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkModuleProgress = async (currentModule) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/roadmaps/${roadmapId}/modules/${currentModule.moduleId}/check-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Silently check progress - don't show errors to user
    } catch (error) {
      console.error('Error checking module progress:', error);
    }
  };

  const handleSubComponentStatusChange = () => {
    fetchModuleData();
  };

  const handleStartQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/roadmaps/${roadmapId}/modules/${moduleId}/quiz/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to quiz page in roadmap mode
        navigate(`/roadmap/${roadmapId}/module/${moduleId}/quiz/${data.sessionId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Loading module...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Module not found</div>
      </div>
    );
  }

  const completedCount = module.subComponents?.filter(sc => sc.status === 'REVIEWED').length || 0;
  const totalCount = module.subComponents?.length || 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gradient-to-r from-[#0A0E14] to-[#0D1117] sticky top-16 z-10 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/roadmap/${roadmapId}`)}
                className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20">
                    M{module.moduleId}
                  </span>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {module.title}
                  </h1>
                </div>
                <p className="text-gray-400 text-sm mt-1.5">{roadmap?.title}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400 font-medium">Learning Progress</div>
                <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {progressPercentage}% Complete
                </div>
              </div>
              <div className="w-40 h-2.5 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/50"
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-[1800px] mx-auto">
        {/* Left Sidebar - Sub-Components Navigation */}
        <div className="w-80 border-r border-gray-800/50 bg-gradient-to-b from-[#0A0E14] to-[#0D1117] h-[calc(100vh-140px)] sticky top-[140px] overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <div className="mb-6 pb-4 border-b border-gray-800/50">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Learning Topics
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 font-medium">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </div>

            {/* Sub-Components List */}
            <div className="space-y-2">
              {isHydrating ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 animate-pulse">
                  <svg className="w-8 h-8 text-cyan-500 mb-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium">Generating personalized content...</p>
                  <p className="text-xs mt-1 opacity-70">Tailoring to your {roadmap?.preferredLearningStyle || 'learning'} style</p>
                </div>
              ) : module.subComponents && module.subComponents.length > 0 ? (
                module.subComponents.map((subComponent, index) => {
                  const isSelected = selectedSubComponent?.subComponentId === subComponent.subComponentId;
                  const isCompleted = subComponent.status === 'REVIEWED';
                  const isInProgress = subComponent.status === 'IN_PROGRESS';

                  return (
                    <button
                      key={subComponent.subComponentId}
                      onClick={() => setSelectedSubComponent(subComponent)}
                      className={`
                        w-full text-left p-4 rounded-xl transition-all duration-200 border group
                        ${isSelected
                          ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                          : 'bg-gray-900/30 border-gray-800/50 hover:bg-gray-900/50 hover:border-gray-700/50 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Number/Status Icon */}
                        <div className={`
                          w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all
                          ${isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                            : isInProgress
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                              : isSelected
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                                : 'bg-gray-800/50 text-gray-400 group-hover:bg-gray-700/50'
                          }
                        `}>
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            String(index + 1).padStart(2, '0')
                          )}
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-semibold text-sm mb-1 line-clamp-2 transition-colors
                            ${isSelected ? 'text-cyan-300' : 'text-gray-200 group-hover:text-white'}
                          `}>
                            {subComponent.title}
                          </h3>
                          {isCompleted && subComponent.reviewedAt && (
                            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No sub-components available</p>
                  <p className="text-xs mt-2">This module doesn't have detailed content yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selectedSubComponent ? (
            <motion.div
              key={selectedSubComponent.subComponentId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sub-Component Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/30">
                    Topic {module.subComponents.findIndex(sc => sc.subComponentId === selectedSubComponent.subComponentId) + 1} of {totalCount}
                  </span>
                  <span className={`
                    px-4 py-1.5 text-xs font-bold rounded-full border
                    ${selectedSubComponent.status === 'REVIEWED'
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedSubComponent.status === 'IN_PROGRESS'
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                    }
                  `}>
                    {selectedSubComponent.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
                  {selectedSubComponent.title}
                </h2>
              </div>

              {/* Sub-Component Content */}
              <SubComponentViewer
                subComponent={selectedSubComponent}
                roadmapId={roadmapId}
                moduleId={module.moduleId}
                onStatusChange={handleSubComponentStatusChange}
                isDetailView={true}
                allSubComponents={module.subComponents || []}
                onNavigate={setSelectedSubComponent}
              />

              {/* Module Assessment - Only show when on last sub-topic AND it is completed */}
              {selectedSubComponent &&
                module.subComponents &&
                module.subComponents.findIndex(sc => sc.subComponentId === selectedSubComponent.subComponentId) === module.subComponents.length - 1 &&
                selectedSubComponent.status === 'REVIEWED' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 pt-8 border-t border-gray-800/50"
                  >
                    <div className="bg-gradient-to-br from-[#0D1117] to-[#161B22] border border-blue-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-blue-500/10 transition-colors" />

                      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 transform group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-white tracking-tight">Final Module Assessment</h3>
                              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-md tracking-widest">
                                Certification Step
                              </span>
                            </div>
                            <p className="text-gray-400 text-base max-w-md">
                              Congratulations on completing all topics! Demonstrate your mastery of <strong>{module.title}</strong> to unlock the next module.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 min-w-[280px]">
                          {/* Status Label */}
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${module.knowledgeCheck?.status === 'PASSED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                              {module.knowledgeCheck?.status === 'PASSED' ? 'Achievement Unlocked' : 'Assessment Ready'}
                            </span>
                          </div>

                          {/* Quiz Button */}
                          <button
                            onClick={handleStartQuiz}
                            disabled={module.knowledgeCheck?.status === 'PASSED'}
                            className={`
                            w-full px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-4
                            ${module.knowledgeCheck?.status === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_40px_rgba(37,99,235,0.2)] hover:shadow-[0_0_50px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:translate-y-0'
                              }
                          `}
                          >
                            {module.knowledgeCheck?.status === 'PASSED' ? (
                              <>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Passed
                              </>
                            ) : (
                              <>
                                <span>Start Final Quiz</span>
                                <svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </>
                            )}
                          </button>

                          {/* Stats Summary */}
                          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>10 Mins</span>
                            <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>10 Questions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              {isHydrating ? (
                <div className="text-center text-gray-400">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                    Crafting Your Curriculum
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Our AI is analyzing your profile to generate the perfect learning path for this module.
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-lg">Select a topic to start learning</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
