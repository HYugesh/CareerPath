const User = require('../models/User');
const QuizSession = require('../models/QuizSession');
const InterviewSession = require('../models/InterviewSession');
const Roadmap = require('../models/Roadmap');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        role: user.role,
        experience: user.experience,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.location = req.body.location || user.location;
      user.role = req.body.role || user.role;
      user.experience = req.body.experience || user.experience;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        role: updatedUser.role,
        experience: updatedUser.experience,
        createdAt: updatedUser.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch Quiz stats
    const quizzes = await QuizSession.find({ user: userId, isCompleted: true });
    const totalAssessments = quizzes.length;
    const avgQuizScore = totalAssessments > 0
      ? quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / totalAssessments
      : 0;

    // Fetch Interview stats
    const interviews = await InterviewSession.find({ user: userId, isCompleted: true });
    const totalInterviews = interviews.length;
    const avgInterviewScore = totalInterviews > 0
      ? (interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / totalInterviews) * 10 // Convert 1-10 to 1-100
      : 0;

    // Fetch Roadmap stats
    const roadmaps = await Roadmap.find({ userId });
    const activeRoadmaps = roadmaps.length;

    let completedSteps = 0;
    let totalSteps = 0;

    roadmaps.forEach(roadmap => {
      if (roadmap.modules && roadmap.modules.length > 0) {
        roadmap.modules.forEach(module => {
          totalSteps++;
          if (module.status === 'COMPLETED' || module.completed) {
            completedSteps++;
          }
        });
      }
    });

    // Calculate aggregated Average Score
    const totalScoresCount = (totalAssessments > 0 ? 1 : 0) + (totalInterviews > 0 ? 1 : 0);
    const averageScore = totalScoresCount > 0
      ? Math.round((avgQuizScore + avgInterviewScore) / totalScoresCount)
      : 0;

    // Fetch recent activities
    const recentQuizzes = await QuizSession.find({ user: userId, isCompleted: true })
      .sort({ createdAt: -1 })
      .limit(5);
    const recentInterviews = await InterviewSession.find({ user: userId, isCompleted: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [
      ...recentQuizzes.map(q => ({
        id: q._id,
        type: 'assessment',
        title: `Completed ${q.domain} Assessment`,
        time: q.updatedAt || q.createdAt,
        score: `${q.score}%`,
        icon: 'CheckCircle2',
        color: 'text-emerald-400'
      })),
      ...recentInterviews.map(i => ({
        id: i._id,
        type: 'interview',
        title: `Mock Interview: ${i.role}`,
        time: i.updatedAt || i.createdAt,
        score: `${i.overallScore}/10`,
        icon: 'Mail',
        color: 'text-cyan-400'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      totalAssessments,
      totalInterviews,
      activeRoadmaps,
      completedSteps,
      totalSteps,
      averageScore: averageScore || 0,
      recentActivities: activities
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
};