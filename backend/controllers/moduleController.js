/**
 * Calculate module progress based on sub-topic completion and quiz scores
 * Progress = (Reviewed Sub-topics + Passed Quizzes) / (Total Sub-topics * 2) * 100
 */
const calculateModuleProgress = (module) => {
  if (!module.subComponents || module.subComponents.length === 0) {
    // If no sub-components, check if module quiz is passed
    if (module.knowledgeCheck?.status === 'PASSED') {
      return 100;
    }
    return 0;
  }

  let reviewedCount = 0;
  let passedQuizCount = 0;
  let totalQuizTopics = 0;

  module.subComponents.forEach(subComponent => {
    // Count reviewed sub-topics
    if (subComponent.status === 'REVIEWED') {
      reviewedCount++;
    }

    // Count passed quizzes (only for topics that have quizzes)
    if (subComponent.hasQuiz !== false) {
      totalQuizTopics++;
      const hasPassedQuiz = subComponent.quizAttempts?.some(attempt => attempt.passed);
      if (hasPassedQuiz) {
        passedQuizCount++;
      }
    }
  });

  const totalSubComponents = module.subComponents.length;
  
  // If module quiz is passed, module is 100% complete regardless of sub-component progress
  if (module.knowledgeCheck?.status === 'PASSED') {
    return 100;
  }
  
  // If no quiz topics, progress is based only on reviewed content
  if (totalQuizTopics === 0) {
    return Math.round((reviewedCount / totalSubComponents) * 100);
  }

  // Progress calculation: 50% for reviewing content + 50% for passing quizzes
  const reviewProgress = (reviewedCount / totalSubComponents) * 50;
  const quizProgress = (passedQuizCount / totalQuizTopics) * 50;
  
  return Math.round(reviewProgress + quizProgress);
};

/**
 * Check and unlock next module if current module reaches 90% progress OR module quiz is passed
 * Also updates overall roadmap progress
 */
const checkAndUnlockNextModule = async (roadmap, currentModule) => {
  const moduleProgress = calculateModuleProgress(currentModule);
  console.log(`📊 Module "${currentModule.title}" progress: ${moduleProgress}%`);
  console.log(`📝 Module quiz status: ${currentModule.knowledgeCheck?.status || 'NOT_ATTEMPTED'}`);

  let nextModuleUnlocked = false;
  let moduleCompleted = false;

  // Module is complete if:
  // 1. Module quiz is passed (70%+), OR
  // 2. Progress reaches 100% (all sub-topics reviewed and quizzes passed)
  const isModuleComplete = currentModule.knowledgeCheck?.status === 'PASSED' || moduleProgress === 100;

  if (isModuleComplete && currentModule.status !== 'COMPLETED') {
    // Mark current module as completed
    currentModule.status = 'COMPLETED';
    currentModule.completed = true;
    currentModule.completedAt = new Date();
    moduleCompleted = true;
    console.log(`✅ Module completed: ${currentModule.title}`);

    // Find and unlock next module
    const currentModuleIndex = roadmap.modules.findIndex(m => m.moduleId === currentModule.moduleId);
    if (currentModuleIndex !== -1 && currentModuleIndex < roadmap.modules.length - 1) {
      const nextModule = roadmap.modules[currentModuleIndex + 1];
      
      // Unlock next module if it's locked
      if (nextModule.status === 'LOCKED') {
        nextModule.status = 'UNLOCKED';
        nextModuleUnlocked = true;
        console.log(`🔓 Next module unlocked: ${nextModule.title} (Module ${nextModule.moduleId})`);
      }
    }
  } else if (moduleProgress >= 90 && currentModule.status !== 'COMPLETED') {
    // If progress is 90%+ but not complete, still unlock next module
    const currentModuleIndex = roadmap.modules.findIndex(m => m.moduleId === currentModule.moduleId);
    if (currentModuleIndex !== -1 && currentModuleIndex < roadmap.modules.length - 1) {
      const nextModule = roadmap.modules[currentModuleIndex + 1];
      
      if (nextModule.status === 'LOCKED') {
        nextModule.status = 'UNLOCKED';
        nextModuleUnlocked = true;
        console.log(`🔓 Next module unlocked (90% progress): ${nextModule.title}`);
      }
    }
  }

  // Calculate overall roadmap progress
  const overallProgress = calculateOverallRoadmapProgress(roadmap);
  roadmap.progress = overallProgress;
  console.log(`📈 Overall roadmap progress: ${overallProgress}%`);

  return { moduleProgress, nextModuleUnlocked, overallProgress, moduleCompleted };
};

/**
 * Calculate overall roadmap progress based on all modules
 */
const calculateOverallRoadmapProgress = (roadmap) => {
  if (!roadmap.modules || roadmap.modules.length === 0) {
    return 0;
  }

  let totalProgress = 0;

  roadmap.modules.forEach(module => {
    let moduleProgress = 0;
    
    if (module.status === 'COMPLETED') {
      moduleProgress = 100;
    } else if (module.status === 'IN_PROGRESS' && module.subComponents && module.subComponents.length > 0) {
      moduleProgress = calculateModuleProgress(module);
    }

    totalProgress += moduleProgress;
  });

  // Calculate average progress across all modules
  const overallProgress = Math.round(totalProgress / roadmap.modules.length);
  
  // Update roadmap status based on progress
  if (overallProgress === 0) {
    roadmap.status = 'not-started';
  } else if (overallProgress === 100) {
    roadmap.status = 'completed';
  } else {
    roadmap.status = 'in-progress';
  }

  return overallProgress;
};

const Roadmap = require('../models/Roadmap');

/**
 * Get a specific module by ID
 */
const getModuleById = async (req, res) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Unlock a module (check prerequisites)
 */
const unlockModule = async (req, res) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if already unlocked
    if (module.status !== 'LOCKED') {
      return res.status(200).json({
        success: true,
        message: 'Module already unlocked',
        data: module
      });
    }

    // Check prerequisites
    const completedModuleIds = roadmap.modules
      .filter(m => m.status === 'COMPLETED')
      .map(m => m.moduleId);

    const prerequisitesMet = module.prerequisites.every(prereqId =>
      completedModuleIds.includes(prereqId)
    );

    if (!prerequisitesMet) {
      return res.status(400).json({
        success: false,
        message: 'Prerequisites not met',
        missingPrerequisites: module.prerequisites.filter(
          prereqId => !completedModuleIds.includes(prereqId)
        )
      });
    }

    // Unlock the module
    module.status = 'UNLOCKED';
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Module unlocked successfully',
      data: module
    });
  } catch (error) {
    console.error('Error unlocking module:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update module status
 */
const updateModuleStatus = async (req, res) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Update status
    module.status = status;

    if (status === 'COMPLETED') {
      module.completed = true;
      module.completedAt = new Date();
    }

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Module status updated successfully',
      data: module
    });
  } catch (error) {
    console.error('Error updating module status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark sub-component as reviewed
 */
const reviewSubComponent = async (req, res) => {
  try {
    const { roadmapId, moduleId, subId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const subComponent = module.subComponents?.find(
      s => s.subComponentId === parseInt(subId)
    );

    if (!subComponent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-component not found'
      });
    }

    // Mark as reviewed
    subComponent.status = 'REVIEWED';
    subComponent.reviewedAt = new Date();

    // Update module status to IN_PROGRESS if not already
    if (module.status === 'UNLOCKED') {
      module.status = 'IN_PROGRESS';
    }

    // Check if all sub-components are reviewed
    const allReviewed = module.subComponents.every(s => s.status === 'REVIEWED');
    if (allReviewed && module.completionCriteria?.contentReview) {
      module.completionCriteria.contentReview.completed = true;
    }

    // Check module progress and unlock next module if needed
    const { moduleProgress, nextModuleUnlocked } = await checkAndUnlockNextModule(roadmap, module);

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: nextModuleUnlocked 
        ? 'Sub-component marked as reviewed. Next module unlocked!'
        : 'Sub-component marked as reviewed',
      data: subComponent,
      moduleProgress,
      nextModuleUnlocked
    });
  } catch (error) {
    console.error('Error reviewing sub-component:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Check if module can be completed
 */
const checkModuleCompletion = async (req, res) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const criteria = module.completionCriteria || {};
    const checks = {
      contentReview: true,
      quiz: true,
      codingChallenges: true
    };

    // Check content review
    if (criteria.contentReview?.required) {
      const allReviewed = module.subComponents?.every(
        s => s.status === 'REVIEWED'
      ) || false;
      checks.contentReview = allReviewed;
    }

    // Check quiz
    if (criteria.quizScore?.required) {
      checks.quiz = module.knowledgeCheck?.status === 'PASSED';
    }

    // Check coding challenges
    if (criteria.codingChallenges?.required) {
      checks.coding = module.codingChallenges?.overallStatus === 'PASSED';
    }

    const canComplete = Object.values(checks).every(check => check === true);
    
    // Calculate current progress
    const moduleProgress = calculateModuleProgress(module);

    res.status(200).json({
      success: true,
      canComplete,
      checks,
      moduleProgress,
      data: module
    });
  } catch (error) {
    console.error('Error checking module completion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Manually trigger progress check and unlock (useful for fixing stuck modules)
 */
const triggerProgressCheck = async (req, res) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    const module = roadmap.modules.find(m => m.moduleId === parseInt(moduleId));

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check module progress and unlock next module if needed
    const { moduleProgress, nextModuleUnlocked } = await checkAndUnlockNextModule(roadmap, module);

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: nextModuleUnlocked 
        ? 'Progress checked. Next module unlocked!'
        : 'Progress checked successfully',
      data: {
        moduleProgress,
        nextModuleUnlocked,
        moduleStatus: module.status,
        completed: module.completed
      }
    });
  } catch (error) {
    console.error('Error triggering progress check:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getModuleById,
  unlockModule,
  updateModuleStatus,
  reviewSubComponent,
  checkModuleCompletion,
  calculateModuleProgress,
  checkAndUnlockNextModule,
  triggerProgressCheck,
  calculateOverallRoadmapProgress
};
