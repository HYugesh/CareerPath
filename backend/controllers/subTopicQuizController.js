const Roadmap = require('../models/Roadmap');
const QuizSession = require('../models/QuizSession');
const { generateQuizQuestions } = require('../services/geminiService');

/**
 * Calculate module progress based on sub-topic completion and quiz scores
 * Progress = (Reviewed Sub-topics + Passed Quizzes) / (Total Sub-topics * 2) * 100
 */
const calculateModuleProgress = (module) => {
  if (!module.subComponents || module.subComponents.length === 0) {
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
 * Generate and start a quiz for a specific sub-topic
 */
const startSubTopicQuiz = async (req, res) => {
  try {
    const { roadmapId, moduleId, subComponentId } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId })
      .select('+modules.subComponents.learningContent.contentSummary'); // Include hidden summary

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
        message: 'Sub-topic not found'
      });
    }

    // Check if this sub-topic has quiz enabled
    if (subComponent.hasQuiz === false) {
      return res.status(400).json({
        success: false,
        message: 'This introductory topic does not have a quiz. Please proceed to the next topic.'
      });
    }

    // Check if content has been generated
    if (!subComponent.learningContent || !subComponent.learningContent.explanation) {
      return res.status(400).json({
        success: false,
        message: 'Please generate content for this topic before taking the quiz.'
      });
    }

    // Get content summary for quiz generation (if available)
    const contentSummary = subComponent.learningContent.contentSummary || 
                          subComponent.learningContent.explanation.substring(0, 500);

    // Generate quiz questions specifically based on the content
    // Include roadmap domain for better context
    const specificDomain = `${roadmap.primaryDomain} - ${module.title} - ${subComponent.title}`;
    const difficulty = module.difficultyLevel;
    const numQuestions = 5; // 5 questions per sub-topic

    console.log(`🎯 Generating content-based quiz for: ${subComponent.title}`);
    console.log(`📚 Module: ${module.title}`);
    console.log(`🎓 Primary Domain: ${roadmap.primaryDomain}`);
    console.log(`🎯 Specific Topic: ${specificDomain}`);
    console.log(`⚡ Difficulty: ${difficulty}`);
    console.log(`📝 Using content summary for quiz generation`);

    const questions = await generateQuizQuestions(specificDomain, difficulty, numQuestions);

    // Create quiz session
    const quizSession = new QuizSession({
      user: userId,
      domain: subComponent.title,
      difficulty: difficulty,
      questions: questions,
      timeLimitSeconds: 300, // 5 minutes for sub-topic quiz
      roadmapModule: {
        roadmapId: roadmap._id,
        moduleId: module.moduleId,
        subComponentId: subComponent.subComponentId,
        isRoadmapMode: true,
        isSubTopicQuiz: true
      }
    });

    await quizSession.save();

    res.status(201).json({
      success: true,
      message: 'Sub-topic quiz started successfully',
      sessionId: quizSession._id,
      data: {
        domain: quizSession.domain,
        difficulty: quizSession.difficulty,
        numQuestions: questions.length,
        timeLimit: quizSession.timeLimitSeconds,
        subTopicTitle: subComponent.title
      }
    });
  } catch (error) {
    console.error('Error starting sub-topic quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message
    });
  }
};

/**
 * Submit sub-topic quiz and update progress
 */
const submitSubTopicQuiz = async (req, res) => {
  try {
    const { roadmapId, moduleId, subComponentId, sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Get quiz session
    const quizSession = await QuizSession.findOne({
      _id: sessionId,
      user: userId,
      'roadmapModule.isSubTopicQuiz': true
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

    const subComponent = module.subComponents?.find(
      sc => sc.subComponentId === parseInt(subComponentId)
    );

    if (!subComponent) {
      return res.status(404).json({
        success: false,
        message: 'Sub-topic not found'
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
    const passed = score >= 70; // 70% passing score for sub-topic quizzes

    // Update quiz session
    quizSession.userAnswers = gradedAnswers;
    quizSession.score = score;
    quizSession.isCompleted = true;
    await quizSession.save();

    // Initialize sub-component quiz tracking if not exists
    if (!subComponent.quizAttempts) {
      subComponent.quizAttempts = [];
    }

    // Add quiz attempt to sub-component
    subComponent.quizAttempts.push({
      attemptNumber: subComponent.quizAttempts.length + 1,
      score,
      passed,
      completedAt: new Date()
    });

    // Update sub-component status based on quiz result
    if (passed && subComponent.status === 'NOT_STARTED') {
      subComponent.status = 'IN_PROGRESS';
    }

    // Calculate module progress after quiz submission
    const moduleProgress = calculateModuleProgress(module);
    console.log(`📊 Module progress: ${moduleProgress}%`);

    // Check if module reached 90% and unlock next module
    let nextModuleUnlocked = false;
    if (moduleProgress >= 90 && module.status !== 'COMPLETED') {
      // Find next module
      const currentModuleIndex = roadmap.modules.findIndex(m => m.moduleId === module.moduleId);
      if (currentModuleIndex !== -1 && currentModuleIndex < roadmap.modules.length - 1) {
        const nextModule = roadmap.modules[currentModuleIndex + 1];
        
        // Unlock next module if it's locked
        if (nextModule.status === 'LOCKED') {
          nextModule.status = 'UNLOCKED';
          nextModuleUnlocked = true;
          console.log(`🔓 Next module unlocked: ${nextModule.title}`);
        }
      }

      // Mark current module as completed if progress is 100%
      if (moduleProgress === 100) {
        module.status = 'COMPLETED';
        module.completed = true;
        module.completedAt = new Date();
        console.log(`✅ Module completed: ${module.title}`);
      }
    }

    await roadmap.save();

    const responseMessage = passed 
      ? (nextModuleUnlocked ? 'Quiz passed! Next module unlocked!' : 'Quiz passed! Great job!')
      : 'Quiz completed. Keep practicing!';

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        score,
        passed,
        correctCount,
        totalQuestions,
        answers: gradedAnswers,
        attemptNumber: subComponent.quizAttempts.length,
        subTopicTitle: subComponent.title,
        moduleProgress,
        nextModuleUnlocked
      }
    });
  } catch (error) {
    console.error('Error submitting sub-topic quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

module.exports = {
  startSubTopicQuiz,
  submitSubTopicQuiz
};
