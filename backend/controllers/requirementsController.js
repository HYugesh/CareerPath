const RequirementsProfile = require('../models/RequirementsProfile');

// Create or update requirements profile
const saveRequirements = async (req, res) => {
  try {
    const { 
      primaryDomain, 
      currentSkillLevel, 
      timeCommitment, 
      learningGoal, 
      deadline, 
      knownTopics, 
      preferredLearningStyle 
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!primaryDomain || !currentSkillLevel || !timeCommitment || !learningGoal || !preferredLearningStyle) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if profile already exists
    let profile = await RequirementsProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.primaryDomain = primaryDomain;
      profile.currentSkillLevel = currentSkillLevel;
      profile.timeCommitment = timeCommitment;
      profile.learningGoal = learningGoal;
      profile.deadline = deadline || null;
      profile.knownTopics = knownTopics || [];
      profile.preferredLearningStyle = preferredLearningStyle;
      
      await profile.save();
    } else {
      // Create new profile
      profile = new RequirementsProfile({
        userId,
        primaryDomain,
        currentSkillLevel,
        timeCommitment,
        learningGoal,
        deadline: deadline || null,
        knownTopics: knownTopics || [],
        preferredLearningStyle
      });
      
      await profile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Requirements profile saved successfully',
      data: profile
    });

  } catch (error) {
    console.error('Error saving requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get requirements profile by user ID
const getRequirements = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await RequirementsProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Requirements profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update requirements profile
const updateRequirements = async (req, res) => {
  try {
    const { 
      primaryDomain, 
      currentSkillLevel, 
      timeCommitment, 
      learningGoal, 
      deadline, 
      knownTopics, 
      preferredLearningStyle 
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!primaryDomain || !currentSkillLevel || !timeCommitment || !learningGoal || !preferredLearningStyle) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const profile = await RequirementsProfile.findOneAndUpdate(
      { userId },
      {
        primaryDomain,
        currentSkillLevel,
        timeCommitment,
        learningGoal,
        deadline: deadline || null,
        knownTopics: knownTopics || [],
        preferredLearningStyle
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Requirements profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Requirements profile updated successfully',
      data: profile
    });

  } catch (error) {
    console.error('Error updating requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  saveRequirements,
  getRequirements,
  updateRequirements
};
