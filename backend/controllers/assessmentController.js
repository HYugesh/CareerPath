/**
 * Assessment Controller - AI-POWERED MODE
 * Handles quiz sessions and evaluations
 * ✅ AI-generated questions for ALL domains (predefined + custom)
 * ✅ Fallback to static questions only if AI fails
 */

require('dotenv').config();
const QuizSession = require('../models/QuizSession');
const { generateQuizQuestions, evaluateQuizAnswers } = require('../services/geminiService');

// ============================================
// STATIC QUESTION POOLS (FALLBACK ONLY)
// ============================================

const STATIC_QUIZ_QUESTIONS = {
  'Artificial Intelligence': [
    { questionText: "What is the primary goal of artificial intelligence?", options: ["Replace humans entirely", "Perform tasks requiring human intelligence", "Make computers faster", "Reduce hardware complexity"], correctAnswer: "Perform tasks requiring human intelligence" },
    { questionText: "Which is a type of machine learning?", options: ["Supervised learning", "Database learning", "Network learning", "Hardware learning"], correctAnswer: "Supervised learning" },
    { questionText: "What does NLP stand for?", options: ["Natural Language Processing", "Neural Learning Protocol", "Network Layer Programming", "Numerical Logic Processing"], correctAnswer: "Natural Language Processing" },
    { questionText: "What is a neural network inspired by?", options: ["Computer circuits", "The human brain", "Database structures", "Network protocols"], correctAnswer: "The human brain" },
    { questionText: "Which AI technique is used for image recognition?", options: ["Convolutional Neural Networks", "Linear Regression", "SQL Queries", "HTTP Protocols"], correctAnswer: "Convolutional Neural Networks" },
    { questionText: "What is the Turing Test designed to evaluate?", options: ["Computer speed", "Machine's ability to exhibit intelligent behavior", "Network bandwidth", "Storage capacity"], correctAnswer: "Machine's ability to exhibit intelligent behavior" },
    { questionText: "Which is an example of a weak AI?", options: ["General problem solver", "Voice assistant like Siri", "Human consciousness simulation", "Self-aware robot"], correctAnswer: "Voice assistant like Siri" },
    { questionText: "What is reinforcement learning?", options: ["Learning from labeled data", "Learning through trial and error with rewards", "Learning from unlabeled data", "Learning from rules"], correctAnswer: "Learning through trial and error with rewards" },
    { questionText: "What does GPT stand for in GPT models?", options: ["General Processing Technology", "Generative Pre-trained Transformer", "Global Programming Tool", "Graphics Processing Terminal"], correctAnswer: "Generative Pre-trained Transformer" },
    { questionText: "Which is a common application of AI in healthcare?", options: ["Medical diagnosis assistance", "Building construction", "Road paving", "Textile manufacturing"], correctAnswer: "Medical diagnosis assistance" },
    { questionText: "What is computer vision?", options: ["Displaying images on screen", "AI field enabling computers to interpret visual data", "Monitor resolution technology", "Graphics card capability"], correctAnswer: "AI field enabling computers to interpret visual data" },
    { questionText: "What is an AI agent?", options: ["Human AI researcher", "Software that perceives and acts in an environment", "Hardware component", "Programming language"], correctAnswer: "Software that perceives and acts in an environment" },
    { questionText: "Which company developed ChatGPT?", options: ["Google", "OpenAI", "Microsoft", "Amazon"], correctAnswer: "OpenAI" },
    { questionText: "What is deep learning?", options: ["Surface-level data analysis", "Neural networks with multiple layers", "Simple rule-based systems", "Manual data entry"], correctAnswer: "Neural networks with multiple layers" },
    { questionText: "What is the purpose of training data in AI?", options: ["To test the final model", "To teach the model patterns and relationships", "To deploy the model", "To delete old models"], correctAnswer: "To teach the model patterns and relationships" }
  ],
  'Machine Learning': [
    { questionText: "What is overfitting in machine learning?", options: ["Model performs well on training but poorly on new data", "Model is too simple", "Training takes too long", "Dataset is too small"], correctAnswer: "Model performs well on training but poorly on new data" },
    { questionText: "Which algorithm is used for classification?", options: ["Linear Regression", "Decision Tree", "K-means", "PCA"], correctAnswer: "Decision Tree" },
    { questionText: "What is the purpose of cross-validation?", options: ["To increase training speed", "To evaluate model performance on unseen data", "To reduce dataset size", "To encrypt data"], correctAnswer: "To evaluate model performance on unseen data" },
    { questionText: "What does the bias-variance tradeoff refer to?", options: ["Balance between model complexity and generalization", "Balance between speed and accuracy", "Balance between storage and memory", "Balance between input and output"], correctAnswer: "Balance between model complexity and generalization" },
    { questionText: "Which is an unsupervised learning algorithm?", options: ["Linear Regression", "Logistic Regression", "K-means Clustering", "Random Forest"], correctAnswer: "K-means Clustering" },
    { questionText: "What is a confusion matrix used for?", options: ["Creating confusion in models", "Evaluating classification model performance", "Generating random data", "Encrypting predictions"], correctAnswer: "Evaluating classification model performance" },
    { questionText: "What is feature engineering?", options: ["Building computer hardware", "Creating and selecting input variables for models", "Designing user interfaces", "Writing documentation"], correctAnswer: "Creating and selecting input variables for models" },
    { questionText: "What is gradient descent?", options: ["A type of data structure", "An optimization algorithm to minimize loss", "A sorting algorithm", "A database query method"], correctAnswer: "An optimization algorithm to minimize loss" },
    { questionText: "What is the purpose of regularization?", options: ["To speed up training", "To prevent overfitting", "To increase model complexity", "To add more features"], correctAnswer: "To prevent overfitting" },
    { questionText: "What is a hyperparameter?", options: ["Parameter learned during training", "Parameter set before training begins", "Output of the model", "Type of dataset"], correctAnswer: "Parameter set before training begins" },
    { questionText: "What does accuracy measure in classification?", options: ["Speed of prediction", "Proportion of correct predictions", "Size of the model", "Training time"], correctAnswer: "Proportion of correct predictions" },
    { questionText: "What is ensemble learning?", options: ["Using a single model", "Combining multiple models for better predictions", "Reducing model size", "Simplifying algorithms"], correctAnswer: "Combining multiple models for better predictions" },
    { questionText: "What is the purpose of a test set?", options: ["To train the model", "To tune hyperparameters", "To evaluate final model performance", "To preprocess data"], correctAnswer: "To evaluate final model performance" },
    { questionText: "What is a decision boundary?", options: ["The edge of a dataset", "Line separating different classes in classification", "Maximum training iterations", "Minimum loss value"], correctAnswer: "Line separating different classes in classification" },
    { questionText: "What does the learning rate control?", options: ["How fast data is loaded", "Step size in gradient descent optimization", "Number of features", "Size of the dataset"], correctAnswer: "Step size in gradient descent optimization" }
  ],
  'Web Development': [
    { questionText: "What does HTML stand for?", options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Markup Language"], correctAnswer: "HyperText Markup Language" },
    { questionText: "Which is a JavaScript framework?", options: ["React", "Python", "MySQL", "Apache"], correctAnswer: "React" },
    { questionText: "What is CSS used for?", options: ["Server-side logic", "Styling web pages", "Database management", "Network configuration"], correctAnswer: "Styling web pages" },
    { questionText: "What does API stand for?", options: ["Application Programming Interface", "Automated Program Integration", "Application Process Integration", "Advanced Programming Interface"], correctAnswer: "Application Programming Interface" },
    { questionText: "Which HTTP method is used to retrieve data?", options: ["POST", "GET", "PUT", "DELETE"], correctAnswer: "GET" },
    { questionText: "What is the DOM in web development?", options: ["Direct Object Model", "Document Object Model", "Data Output Method", "Dynamic Object Manager"], correctAnswer: "Document Object Model" },
    { questionText: "Which is a CSS preprocessor?", options: ["JavaScript", "SASS", "PHP", "Node.js"], correctAnswer: "SASS" },
    { questionText: "What is responsive web design?", options: ["Fast loading websites", "Websites that adapt to different screen sizes", "Secure websites", "Animated websites"], correctAnswer: "Websites that adapt to different screen sizes" },
    { questionText: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Standard Object Naming", "JavaScript Online Network", "Java Syntax Object Node"], correctAnswer: "JavaScript Object Notation" },
    { questionText: "Which is a backend programming language?", options: ["HTML", "CSS", "Node.js", "Bootstrap"], correctAnswer: "Node.js" },
    { questionText: "What is the purpose of a web server?", options: ["To style web pages", "To serve web content to clients", "To write JavaScript code", "To design databases"], correctAnswer: "To serve web content to clients" },
    { questionText: "What is a cookie in web development?", options: ["A type of image", "Small data stored on client's browser", "A server component", "A CSS property"], correctAnswer: "Small data stored on client's browser" },
    { questionText: "What does HTTPS provide over HTTP?", options: ["Faster loading", "Encrypted communication", "Better styling", "More storage"], correctAnswer: "Encrypted communication" },
    { questionText: "What is a REST API?", options: ["A sleeping API", "Architectural style for web services", "Database type", "Frontend framework"], correctAnswer: "Architectural style for web services" },
    { questionText: "What is the purpose of npm?", options: ["To style pages", "To manage JavaScript packages", "To create databases", "To design layouts"], correctAnswer: "To manage JavaScript packages" }
  ],
  'Data Science': [
    { questionText: "What is the purpose of data cleaning?", options: ["Making data look pretty", "Removing errors and inconsistencies", "Adding more data", "Encrypting data"], correctAnswer: "Removing errors and inconsistencies" },
    { questionText: "Which Python library is commonly used for data manipulation?", options: ["Django", "pandas", "Flask", "PyGame"], correctAnswer: "pandas" },
    { questionText: "What is a histogram used for?", options: ["Showing relationships between variables", "Displaying distribution of a single variable", "Creating pie charts", "Drawing network diagrams"], correctAnswer: "Displaying distribution of a single variable" },
    { questionText: "What does EDA stand for?", options: ["Electronic Data Analysis", "Exploratory Data Analysis", "Extended Data Architecture", "Efficient Data Algorithm"], correctAnswer: "Exploratory Data Analysis" },
    { questionText: "What is the median of a dataset?", options: ["The most common value", "The average value", "The middle value when sorted", "The range of values"], correctAnswer: "The middle value when sorted" },
    { questionText: "Which visualization shows correlation between two variables?", options: ["Bar chart", "Scatter plot", "Pie chart", "Histogram"], correctAnswer: "Scatter plot" },
    { questionText: "What is a null value in data?", options: ["Zero", "Missing or undefined data", "Negative number", "Maximum value"], correctAnswer: "Missing or undefined data" },
    { questionText: "What is SQL used for?", options: ["Styling web pages", "Querying and managing databases", "Creating animations", "Building mobile apps"], correctAnswer: "Querying and managing databases" },
    { questionText: "What is the purpose of normalization in data preprocessing?", options: ["Deleting data", "Scaling features to a common range", "Adding more features", "Encrypting data"], correctAnswer: "Scaling features to a common range" },
    { questionText: "What is a correlation coefficient of 1 indicate?", options: ["No relationship", "Perfect positive relationship", "Perfect negative relationship", "Random relationship"], correctAnswer: "Perfect positive relationship" },
    { questionText: "Which library is used for data visualization in Python?", options: ["NumPy", "matplotlib", "scikit-learn", "TensorFlow"], correctAnswer: "matplotlib" },
    { questionText: "What is the difference between mean and mode?", options: ["They are the same", "Mean is average, mode is most frequent", "Mean is middle value, mode is average", "Mode is average, mean is most frequent"], correctAnswer: "Mean is average, mode is most frequent" },
    { questionText: "What is a data pipeline?", options: ["Physical data cable", "Series of data processing steps", "Type of database", "Data storage format"], correctAnswer: "Series of data processing steps" },
    { questionText: "What is the purpose of a box plot?", options: ["Showing data distribution and outliers", "Creating 3D visualizations", "Drawing network graphs", "Animating data"], correctAnswer: "Showing data distribution and outliers" },
    { questionText: "What is feature scaling?", options: ["Removing features", "Transforming features to similar ranges", "Adding new features", "Renaming features"], correctAnswer: "Transforming features to similar ranges" }
  ]
};

// ============================================
// STATIC HELPER FUNCTIONS
// ============================================

// Generate static quiz questions
const generateStaticQuizQuestions = (domain, difficulty, numQuestions = 15) => {
  console.log(`Generating ${numQuestions} static questions for ${domain} at ${difficulty} level`);

  // Get domain-specific questions or use AI as default
  let questions = STATIC_QUIZ_QUESTIONS[domain];

  if (!questions) {
    // Find closest match or use AI questions
    const domainLower = domain.toLowerCase();
    if (domainLower.includes('web') || domainLower.includes('frontend') || domainLower.includes('backend')) {
      questions = STATIC_QUIZ_QUESTIONS['Web Development'];
    } else if (domainLower.includes('machine') || domainLower.includes('ml')) {
      questions = STATIC_QUIZ_QUESTIONS['Machine Learning'];
    } else if (domainLower.includes('data') || domainLower.includes('analytics')) {
      questions = STATIC_QUIZ_QUESTIONS['Data Science'];
    } else {
      questions = STATIC_QUIZ_QUESTIONS['Artificial Intelligence'];
    }
  }

  // Shuffle questions and return requested number
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(numQuestions, shuffled.length));
};

// Generate mock evaluation
const generateMockEvaluation = (correctAnswers, totalQuestions, scorePercentage) => {
  let performance = 'needs improvement';
  if (scorePercentage >= 80) performance = 'excellent';
  else if (scorePercentage >= 60) performance = 'good';
  else if (scorePercentage >= 40) performance = 'fair';

  const upskillAreas = scorePercentage < 60
    ? ["Core concepts", "Problem solving", "Technical knowledge"]
    : ["Advanced topics", "Specialized skills"];

  const strengths = scorePercentage >= 60
    ? ["Good understanding", "Strong basics", "Clear thinking"]
    : ["Effort", "Participation", "Learning attitude"];

  return {
    score: scorePercentage,
    upskillAreas,
    strengths,
    recommendations: `Score: ${correctAnswers}/${totalQuestions} (${scorePercentage}%). Performance: ${performance}. ${scorePercentage >= 60 ? 'Well done! Keep building on your strengths.' : 'Keep studying and practicing. You can improve!'}`
  };
};

/**
 * Start a new assessment - AI-POWERED MODE
 * Always uses AI generation for fresh, unique questions
 */
const startAssessment = async (req, res) => {
  try {
    const { domain, difficulty, timeLimitSeconds, numQuestions = 15 } = req.body;

    // Validate numQuestions (between 5 and 50)
    const validatedNumQuestions = Math.min(Math.max(parseInt(numQuestions) || 15, 5), 50);

    let questions;

    // Always use AI generation for all domains
    console.log(`🤖 Generating AI questions for: ${domain} (${difficulty}, ${validatedNumQuestions} questions)`);
    
    try {
      questions = await generateQuizQuestions(domain, difficulty, validatedNumQuestions);
      console.log(`✅ Generated ${questions.length} AI questions successfully`);
    } catch (error) {
      console.error('❌ AI generation failed, using fallback:', error.message);
      // Fallback to static questions only if AI fails
      questions = generateStaticQuizQuestions(domain, difficulty, validatedNumQuestions);
      console.log(`📚 Using ${questions.length} fallback static questions`);
    }

    const session = await QuizSession.create({
      user: req.user.id,
      domain,
      difficulty,
      questions,
      timeLimitSeconds
    });

    res.status(201).json({ sessionId: session._id });

  } catch (error) {
    console.error("Error starting assessment:", error);
    res.status(500).json({ message: 'Failed to start assessment', error: error.message });
  }
};

/**
 * Submit assessment answers - AI-POWERED MODE
 * Always uses AI evaluation for detailed feedback
 */
const submitAssessment = async (req, res) => {
  try {

    const session = await QuizSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.user && session.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (session.isCompleted) {
      return res.json(session);
    }

    if (!req.body.answers || !Array.isArray(req.body.answers)) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    session.userAnswers = req.body.answers;

    // Calculate score
    const totalQuestions = session.questions.length;
    let correctAnswers = 0;

    session.userAnswers.forEach((answer) => {
      const questionIndex = (answer.qNo || 1) - 1;
      if (questionIndex >= 0 && questionIndex < session.questions.length) {
        const question = session.questions[questionIndex];
        if (answer.selectedOption === question.correctAnswer) {
          correctAnswers++;
        }
      }
    });

    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

    let evaluation;

    // Always use AI evaluation for all domains
    console.log(`🤖 Using AI evaluation for: ${session.domain}`);
    
    try {
      // Extract user answers array
      const userAnswersArray = session.userAnswers.map(a => a.selectedOption);
      evaluation = await evaluateQuizAnswers(session.questions, userAnswersArray);
      evaluation.score = scorePercentage; // Ensure correct score
      console.log(`✅ AI evaluation completed successfully`);
    } catch (error) {
      console.error('❌ AI evaluation failed, using fallback:', error.message);
      evaluation = generateMockEvaluation(correctAnswers, totalQuestions, scorePercentage);
      console.log(`📚 Using fallback mock evaluation`);
    }

    // Update session
    session.score = evaluation.score;
    session.upskillAreas = evaluation.upskillAreas || [];
    session.strengths = evaluation.strengths || [];
    session.recommendations = evaluation.recommendations || '';
    session.report = evaluation.recommendations || '';
    session.isCompleted = true;

    const updatedSession = await session.save();
    res.json(updatedSession);

  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ message: 'Failed to submit assessment', error: error.message });
  }
};

/**
 * Get assessment by ID
 */
const getAssessment = async (req, res) => {
  try {
    const assessment = await QuizSession.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (assessment.user && assessment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assessment' });
  }
};

module.exports = { startAssessment, submitAssessment, getAssessment };