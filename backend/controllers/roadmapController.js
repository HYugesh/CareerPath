const Roadmap = require('../models/Roadmap');
const RequirementsProfile = require('../models/RequirementsProfile');
const { generateRoadmapBlueprint } = require('../services/roadmapAIService');
const { generateSubComponentsForModule, generateSubComponentsForRoadmap } = require('../services/subComponentGenerationService');

/**
 * Calculate overall roadmap progress based on module completion
 */
const calculateRoadmapProgress = (roadmap) => {
  if (!roadmap.modules || roadmap.modules.length === 0) {
    return 0;
  }

  let totalProgress = 0;
  let completedModules = 0;

  roadmap.modules.forEach(module => {
    // Calculate module progress
    let moduleProgress = 0;
    
    if (module.status === 'COMPLETED') {
      moduleProgress = 100;
      completedModules++;
    } else if (module.status === 'IN_PROGRESS' && module.subComponents && module.subComponents.length > 0) {
      // Calculate based on sub-components
      let reviewedCount = 0;
      let passedQuizCount = 0;
      let totalQuizTopics = 0;

      module.subComponents.forEach(subComponent => {
        if (subComponent.status === 'REVIEWED') {
          reviewedCount++;
        }

        if (subComponent.hasQuiz !== false) {
          totalQuizTopics++;
          const hasPassedQuiz = subComponent.quizAttempts?.some(attempt => attempt.passed);
          if (hasPassedQuiz) {
            passedQuizCount++;
          }
        }
      });

      const totalSubComponents = module.subComponents.length;
      
      if (totalQuizTopics === 0) {
        // No quizzes, progress based on reviews only
        moduleProgress = Math.round((reviewedCount / totalSubComponents) * 100);
      } else {
        // 50% for reviews + 50% for quizzes
        const reviewProgress = (reviewedCount / totalSubComponents) * 50;
        const quizProgress = (passedQuizCount / totalQuizTopics) * 50;
        moduleProgress = Math.round(reviewProgress + quizProgress);
      }
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

// Get all roadmaps for a user
const getUserRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });

    // Calculate progress for each roadmap
    const roadmapsWithProgress = roadmaps.map(roadmap => {
      const overallProgress = calculateRoadmapProgress(roadmap);
      roadmap.progress = overallProgress;
      return roadmap;
    });

    // Save all roadmaps with updated progress (batch update)
    await Promise.all(
      roadmapsWithProgress.map(roadmap => 
        roadmap.isModified('progress') || roadmap.isModified('status') 
          ? roadmap.save() 
          : Promise.resolve()
      )
    );

    res.status(200).json({
      success: true,
      count: roadmapsWithProgress.length,
      data: roadmapsWithProgress
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create a new roadmap from requirements with AI generation
const createRoadmap = async (req, res) => {
  try {
    const userId = req.user.id;

    // Extract parameters from request body if available (Phase 1: Dynamic Blueprint)
    const { domain, level, goal, LearningStyle } = req.body;

    // Generate AI roadmap blueprint (Skeleton only)
    console.log('🤖 Generating AI roadmap blueprint for user:', userId);

    // Create overrides object from body
    const overrides = (domain || level) ? {
      primaryDomain: domain,
      currentSkillLevel: level,
      learningGoal: goal,
      preferredLearningStyle: LearningStyle
    } : null;

    let requirements = null;
    if (!overrides) {
      requirements = await RequirementsProfile.findOne({ userId });
      if (!requirements) {
        return res.status(404).json({
          success: false,
          message: 'Requirements profile not found. Please complete the requirements form first.'
        });
      }
    }

    const aiRoadmap = await generateRoadmapBlueprint(userId, overrides);

    // Determine title
    const userTitle = overrides ? overrides.primaryDomain : requirements.primaryDomain;


    // Create roadmap with AI-generated structure
    const roadmap = new Roadmap({
      userId,
      // From requirements or overrides
      primaryDomain: userTitle,
      currentSkillLevel: overrides ? overrides.currentSkillLevel : requirements.currentSkillLevel,
      timeCommitment: overrides ? 10 : (requirements.timeCommitment || 10),
      learningGoal: overrides ? overrides.learningGoal : requirements.learningGoal,
      deadline: overrides ? null : requirements.deadline,
      knownTopics: overrides ? [] : (requirements.knownTopics || []),
      preferredLearningStyle: overrides ? overrides.preferredLearningStyle : requirements.preferredLearningStyle,
      // Use user's exact input as title (not AI-generated)
      title: userTitle,
      pathTitle: userTitle,
      description: aiRoadmap.description || `A comprehensive learning journey for ${userTitle}`,
      totalModules: aiRoadmap.totalModules || aiRoadmap.modules.length,
      estimatedTotalHours: aiRoadmap.estimatedTotalHours,
      modules: aiRoadmap.modules, // Use skeleton modules directly
      learningPath: aiRoadmap.learningPath,
      duration: calculateDuration(overrides ? 10 : requirements.timeCommitment, overrides ? null : requirements.deadline, aiRoadmap.estimatedTotalHours),
      tags: [userTitle, overrides ? overrides.currentSkillLevel : requirements.currentSkillLevel, overrides ? overrides.learningGoal : requirements.learningGoal],
      aiGenerated: true,
      aiProvider: aiRoadmap.aiProvider || 'gemini',
      generationMetadata: {
        usedFallback: aiRoadmap.usedFallback || false,
        generatedAt: new Date(),
        model: aiRoadmap.aiProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'
      }
    });

    // Initialize module statuses: First module UNLOCKED, rest LOCKED
    if (roadmap.modules && roadmap.modules.length > 0) {
      roadmap.modules.forEach((module, index) => {
        if (index === 0) {
          // First module is unlocked
          module.status = 'UNLOCKED';
          console.log(`✅ Module 1 "${module.title}" is UNLOCKED`);
        } else {
          // All other modules are locked
          module.status = 'LOCKED';
        }

        // Sanitize branchingOptions - ensure it's an array of strings
        if (module.branchingOptions) {
          if (typeof module.branchingOptions === 'string') {
            // If it's a string, try to parse it or set to empty array
            try {
              const parsed = JSON.parse(module.branchingOptions);
              if (Array.isArray(parsed)) {
                // Extract titles or convert to simple strings
                module.branchingOptions = parsed.map(opt =>
                  typeof opt === 'string' ? opt : (opt.title || opt.optionId || JSON.stringify(opt))
                );
              } else {
                module.branchingOptions = [];
              }
            } catch (e) {
              module.branchingOptions = [];
            }
          } else if (Array.isArray(module.branchingOptions)) {
            // Ensure all elements are strings
            module.branchingOptions = module.branchingOptions.map(opt =>
              typeof opt === 'string' ? opt : (opt.title || opt.optionId || JSON.stringify(opt))
            );
          } else {
            module.branchingOptions = [];
          }
        }

        // Initialize completion criteria if not present
        if (!module.completionCriteria) {
          module.completionCriteria = {
            contentReview: { required: false, completed: false },
            quizScore: { required: true, completed: false },
            codingChallenges: { required: false, completed: false }
          };
        }

        // Initialize knowledge check if not present
        if (!module.knowledgeCheck) {
          module.knowledgeCheck = {
            questions: [],
            passingScore: 80,
            attemptsAllowed: 3,
            attempts: [],
            status: 'NOT_ATTEMPTED'
          };
        }
      });
    }

    await roadmap.save();

    console.log('✅ Roadmap created successfully:', roadmap._id);

    res.status(201).json({
      success: true,
      message: 'Roadmap created successfully',
      data: roadmap
    });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: error.message
    });
  }
};

// Get a single roadmap by ID
const getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: id, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Calculate and update overall progress
    const overallProgress = calculateRoadmapProgress(roadmap);
    roadmap.progress = overallProgress;
    
    // Save if progress changed
    if (roadmap.isModified('progress') || roadmap.isModified('status')) {
      await roadmap.save();
    }

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update roadmap progress and modules
const updateRoadmapProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { progress, status, modules } = req.body;

    // Find the roadmap first
    const roadmap = await Roadmap.findOne({ _id: id, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Update fields
    if (progress !== undefined) roadmap.progress = progress;
    if (status !== undefined) roadmap.status = status;

    // Update modules if provided
    if (modules && Array.isArray(modules)) {
      console.log('📝 Updating modules:', modules.length);
      roadmap.modules = modules;

      // Recalculate total modules and hours
      roadmap.totalModules = modules.length;
      roadmap.estimatedTotalHours = modules.reduce((total, module) => {
        return total + (module.estimatedHours || 0);
      }, 0);

      console.log('✅ Updated totalModules:', roadmap.totalModules);
      console.log('✅ Updated estimatedTotalHours:', roadmap.estimatedTotalHours);
    }

    // Save the updated roadmap
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Roadmap updated successfully',
      data: roadmap
    });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a roadmap
const deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOneAndDelete({ _id: id, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to calculate duration
function calculateDuration(hoursPerWeek, deadline, totalHours) {
  if (deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = Math.abs(end - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  }

  // Calculate based on total hours and weekly commitment
  if (totalHours && hoursPerWeek) {
    const weeks = Math.ceil(totalHours / hoursPerWeek);
    if (weeks <= 4) return `${weeks} weeks`;
    return `${Math.ceil(weeks / 4)} months`;
  }

  // Default estimation based on hours per week
  if (hoursPerWeek >= 20) return '1-2 months';
  if (hoursPerWeek >= 10) return '2-4 months';
  return '3-6 months';
}

// Hydrate a specific module with content (Phase 2)
const hydrateModule = async (req, res) => {
  try {
    const { id, moduleId } = req.params;
    const userId = req.user.id;
    const { requestType, moduleContext, adaptiveMetadata, scalingConfig } = req.body;

    if (requestType !== 'HYDRATE_MODULE_CONTENT') {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }

    // 1. Find the roadmap
    const roadmap = await Roadmap.findOne({ _id: id, userId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    // 2. Find the module
    const moduleIndex = roadmap.modules.findIndex(m => m.moduleId === parseInt(moduleId));
    if (moduleIndex === -1) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const module = roadmap.modules[moduleIndex];

    // 3. Check if already hydrated
    if (module.subComponents && module.subComponents.length > 0) {
      console.log('✅ Module already hydrated, returning existing content.');
      return res.status(200).json({
        success: true,
        data: module.subComponents
      });
    }

    // 4. Generate Content (Phase 2 Call)
    console.log(`💧 hydration triggered for Module ${moduleId}: ${module.title}`);
    const { generateAdaptiveModuleContent } = require('../services/subComponentGenerationService');

    // Get future topics to prevent contamination
    const futureModules = roadmap.modules.filter(m => m.moduleId > parseInt(moduleId));
    const futureTopics = futureModules.map(m => m.title).slice(0, 5); // Take next 5 modules as context

    // Ensure domain and additional context is passed correctly
    const contextWithDomain = {
      ...moduleContext,
      domain: roadmap.primaryDomain,
      moduleObjective: module.objective || module.description || '',
      futureTopics: futureTopics
    };

    const newContent = await generateAdaptiveModuleContent(
      contextWithDomain,
      adaptiveMetadata,
      scalingConfig
    );

    // 5. Save to DB using atomic update to prevent VersionError
    const updateFields = {
      "modules.$.subComponents": newContent
    };

    // Auto-start module if it was just visited
    if (module.status === 'LOCKED' || module.status === 'UNLOCKED') {
      updateFields["modules.$.status"] = 'IN_PROGRESS';
    }

    const updatedRoadmap = await Roadmap.findOneAndUpdate(
      {
        _id: id,
        userId,
        "modules.moduleId": parseInt(moduleId)
      },
      {
        $set: updateFields
      },
      { new: true } // Return updated doc
    );

    if (!updatedRoadmap) {
      throw new Error('Failed to save hydrated content: Roadmap modified concurrently');
    }

    console.log(`✅ Hydration success. Generated ${newContent.length} sub-topics.`);

    res.status(200).json({
      success: true,
      message: 'Module hydrated successfully',
      data: newContent
    });

  } catch (error) {
    console.error('❌ Hydration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to hydrate module'
    });
  }
};

module.exports = {
  getUserRoadmaps,
  createRoadmap,
  getRoadmapById,
  updateRoadmapProgress,
  deleteRoadmap,
  hydrateModule
};
