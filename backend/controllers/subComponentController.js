const Roadmap = require('../models/Roadmap');
const { generateSubComponentContent: generateContentAI } = require('../services/moduleContentService');

/**
 * Get all sub-components for a module
 */
const getModuleSubComponents = async (req, res) => {
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
      data: {
        moduleTitle: module.title,
        subComponents: module.subComponents || []
      }
    });
  } catch (error) {
    console.error('Error fetching sub-components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-components',
      error: error.message
    });
  }
};

/**
 * Mark a sub-component as reviewed
 */
const markSubComponentReviewed = async (req, res) => {
  try {
    const { roadmapId, moduleId, subComponentId } = req.params;
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
      sc => sc.subComponentId === parseInt(subComponentId)
    );

    if (!subComponent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-component not found'
      });
    }

    // Toggle reviewed status
    if (subComponent.status === 'REVIEWED') {
      subComponent.status = 'IN_PROGRESS';
      subComponent.reviewedAt = null;
    } else {
      subComponent.status = 'REVIEWED';
      subComponent.reviewedAt = new Date();
    }

    // Update module status to IN_PROGRESS if it was UNLOCKED
    if (module.status === 'UNLOCKED') {
      module.status = 'IN_PROGRESS';
    }

    // Check if all sub-components are reviewed
    const allReviewed = module.subComponents.every(sc => sc.status === 'REVIEWED');
    if (allReviewed && module.completionCriteria?.contentReview) {
      module.completionCriteria.contentReview.completed = true;
    }

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Sub-component status updated',
      data: {
        subComponent: {
          subComponentId: subComponent.subComponentId,
          title: subComponent.title,
          status: subComponent.status,
          reviewedAt: subComponent.reviewedAt
        },
        moduleStatus: module.status,
        allReviewed
      }
    });
  } catch (error) {
    console.error('Error updating sub-component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub-component',
      error: error.message
    });
  }
};

/**
 * Generate AI content for a sub-component
 */
const generateSubComponentContent = async (req, res) => {
  try {
    const { roadmapId, moduleId, subComponentId } = req.params;
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
      sc => sc.subComponentId === parseInt(subComponentId)
    );

    if (!subComponent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-component not found'
      });
    }

    console.log(`🎨 Generating content for: ${subComponent.title}`);

    // Generate detailed content using AI
    const content = await generateContentAI(
      subComponent.title,
      module.title,
      roadmap.primaryDomain
    );

    // Update sub-component with generated content
    subComponent.learningContent = content.learningContent;
    subComponent.externalResources = content.externalResources;
    subComponent.practiceExercise = content.practiceExercise;

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: 'Content generated successfully',
      data: {
        subComponentId: subComponent.subComponentId,
        title: subComponent.title,
        learningContent: subComponent.learningContent,
        externalResources: subComponent.externalResources,
        practiceExercise: subComponent.practiceExercise
      }
    });
  } catch (error) {
    console.error('Error generating sub-component content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
};

module.exports = {
  getModuleSubComponents,
  markSubComponentReviewed,
  generateSubComponentContent
};
