const Roadmap = require('../models/Roadmap');
const QuizSession = require('../models/QuizSession');
const { generateQuizQuestions } = require('../services/geminiService');
const { checkAndUnlockNextModule } = require('./moduleController');

/**
 * Generate and start a quiz for a specific module
 */
const startModuleQuiz = async (req, res) => {
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

    // Check if module is unlocked
    if (module.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Module is locked. Complete prerequisites first.'
      });
    }

    // Generate quiz questions based on ALL sub-component topics in the module
    // Build comprehensive topic list from sub-components
    let topicsList = [];

    if (module.subComponents && module.subComponents.length > 0) {
      // Use actual sub-component titles for better context
      topicsList = module.subComponents.map(sc => sc.title);
    } else if (module.topics && module.topics.length > 0) {
      // Fallback to module topics if no sub-components
      topicsList = module.topics;
    }

    // Build comprehensive domain context
    const topicsString = topicsList.length > 0 ? topicsList.join(', ') : module.title;
    const domain = `${roadmap.primaryDomain} - ${module.title} - Topics: ${topicsString}`;
    const difficulty = module.difficultyLevel;
    const numQuestions = 10; // Standard quiz size

    console.log(`🎯 Generating MODULE ASSESSMENT quiz for: ${module.title}`);
    console.log(`📚 Primary Domain: ${roadmap.primaryDomain}`);
    console.log(`📋 Sub-topics covered: ${topicsList.join(', ')}`);
    console.log(`⚡ Difficulty: ${difficulty}`);
    console.log(`❓ Number of questions: ${numQuestions}`);

    const questions = await generateQuizQuestions(domain, difficulty, numQuestions);

    // Create quiz session
    const quizSession = new QuizSession({
      user: userId,
      domain: module.title,
      difficulty: difficulty,
      questions: questions,
      timeLimitSeconds: 600, // 10 minutes for module quiz
      roadmapModule: {
        roadmapId: roadmap._id,
        moduleId: module.moduleId,
        isRoadmapMode: true
      }
    });

    await quizSession.save();

    // Update module status to IN_PROGRESS
    if (module.status === 'UNLOCKED') {
      module.status = 'IN_PROGRESS';
      await roadmap.save();
    }

    res.status(201).json({
      success: true,
      message: 'Quiz started successfully',
      sessionId: quizSession._id,
      data: {
        domain: quizSession.domain,
        difficulty: quizSession.difficulty,
        numQuestions: questions.length,
        timeLimit: quizSession.timeLimitSeconds,
        moduleTitle: module.title
      }
    });
  } catch (error) {
    console.error('Error starting module quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message
    });
  }
};

/**
 * Submit module quiz and update progress
 */
const submitModuleQuiz = async (req, res) => {
  try {
    const { roadmapId, moduleId, sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Get quiz session
    const quizSession = await QuizSession.findOne({
      _id: sessionId,
      user: userId,
      'roadmapModule.isRoadmapMode': true
    });

    if (!quizSession) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }

    // Get roadmap
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

    // Grade the quiz
    let correctCount = 0;
    const gradedAnswers = answers.map(answer => {
      const question = quizSession.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return { ...answer, isCorrect: false };

      const isCorrect = question.correctAnswer.toLowerCase().trim() ===
        answer.selectedOption.toLowerCase().trim();

      if (isCorrect) correctCount++;

      return {
        questionId: answer.questionId,
        questionText: question.questionText,
        selectedOption: answer.selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const totalQuestions = quizSession.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70; // 70% passing score

    // Update quiz session
    quizSession.userAnswers = gradedAnswers;
    quizSession.score = score;
    quizSession.isCompleted = true;
    await quizSession.save();

    // Update module knowledge check
    if (!module.knowledgeCheck) {
      module.knowledgeCheck = {
        questions: [],
        passingScore: 80,
        attemptsAllowed: 3,
        attempts: [],
        status: 'NOT_ATTEMPTED'
      };
    }

    const attemptNumber = (module.knowledgeCheck.attempts?.length || 0) + 1;

    // Add attempt with proper data structure
    module.knowledgeCheck.attempts.push({
      attemptNumber,
      score,
      answers: gradedAnswers.map(ans => ({
        questionId: ans.questionId, // Keep as string (ObjectId)
        questionText: ans.questionText,
        selectedOption: ans.selectedOption,
        correctAnswer: ans.correctAnswer,
        userAnswer: ans.selectedOption, // For consistency
        isCorrect: ans.isCorrect
      })),
      completedAt: new Date()
    });

    // Update status
    if (passed) {
      module.knowledgeCheck.status = 'PASSED';
      if (module.completionCriteria?.quizScore) {
        module.completionCriteria.quizScore.completed = true;
      }
      
      // CRITICAL: Mark module as completed when quiz is passed
      console.log(`✅ Module quiz passed with ${score}% - Marking module as complete`);
    } else if (attemptNumber >= module.knowledgeCheck.attemptsAllowed) {
      module.knowledgeCheck.status = 'FAILED';
      module.knowledgeCheck.cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      module.knowledgeCheck.status = 'IN_PROGRESS';
    }

    // Check module progress and unlock next module if needed
    const { moduleProgress, nextModuleUnlocked, moduleCompleted } = await checkAndUnlockNextModule(roadmap, module);

    await roadmap.save();

    const responseMessage = passed
      ? (nextModuleUnlocked ? `🎉 Quiz passed with ${score}%! Module completed. Next module unlocked!` : `✅ Quiz passed with ${score}%! Module completed.`)
      : `Quiz completed with ${score}%. You need 70% to pass. ${module.knowledgeCheck.attemptsAllowed - attemptNumber} attempt(s) remaining.`;

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        score,
        passed,
        correctCount,
        totalQuestions,
        answers: gradedAnswers,
        attemptNumber,
        attemptsRemaining: module.knowledgeCheck.attemptsAllowed - attemptNumber,
        moduleStatus: module.status,
        moduleProgress,
        moduleCompleted,
        nextModuleUnlocked
      }
    });
  } catch (error) {
    console.error('Error submitting module quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

/**
 * Get quiz session for module
 */
const getModuleQuizSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const quizSession = await QuizSession.findOne({
      _id: sessionId,
      user: userId
    });

    if (!quizSession) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }

    // Don't send correct answers
    const sessionData = {
      _id: quizSession._id,
      domain: quizSession.domain,
      difficulty: quizSession.difficulty,
      timeLimitSeconds: quizSession.timeLimitSeconds,
      startedAt: quizSession.startedAt,
      isCompleted: quizSession.isCompleted,
      roadmapModule: quizSession.roadmapModule,
      questions: quizSession.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty
      }))
    };

    res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error fetching quiz session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz session',
      error: error.message
    });
  }
};

module.exports = {
  startModuleQuiz,
  submitModuleQuiz,
  getModuleQuizSession
};
