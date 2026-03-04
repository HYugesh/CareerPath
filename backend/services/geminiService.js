/**
 * Gemini Service
 * Handles quiz generation, evaluation, and coding problems
 * Uses centralized Gemini client for optimized API usage
 */

const { callGemini } = require('./geminiClient');

/**
 * Generate quiz questions for a domain
 * @param {string} domain - The domain/topic for questions
 * @param {string} difficulty - Difficulty level (Beginner, Easy, Intermediate, Hard, Expert)
 * @param {number} numQuestions - Number of questions to generate (5-30)
 */
async function generateQuizQuestions(domain, difficulty, numQuestions = 15) {
  // Validate numQuestions (between 5 and 50)
  const questionCount = Math.min(Math.max(parseInt(numQuestions) || 15, 5), 50);

  // Create multiple unique identifiers to ensure maximum randomness
  const uniqueSeed = Date.now().toString(36);
  const randomId = Math.random().toString(36).substring(2, 10);
  const sessionHash = `${uniqueSeed}-${randomId}`;

  // Define difficulty-specific parameters
  const difficultyParams = {
    'Beginner': { complexity: 'basic foundational', depth: 'introductory concepts and definitions' },
    'Easy': { complexity: 'simple but practical', depth: 'common use cases and fundamental principles' },
    'Intermediate': { complexity: 'moderate depth', depth: 'problem-solving and real-world scenarios' },
    'Hard': { complexity: 'advanced and challenging', depth: 'edge cases, optimization, and trade-offs' },
    'Expert': { complexity: 'highly advanced', depth: 'deep technical details and architecture decisions' }
  };

  const params = difficultyParams[difficulty] || difficultyParams['Intermediate'];

  const prompt = `You are an expert technical assessment creator. Generate exactly ${questionCount} COMPLETELY NEW and UNIQUE multiple-choice questions SPECIFICALLY about "${domain}" at the "${difficulty}" level.

=== CRITICAL: TOPIC SPECIFICITY ===
SESSION ID: ${sessionHash}
TOPIC: "${domain}"

YOU MUST ONLY generate questions about: "${domain}"
DO NOT generate questions about other topics, technologies, or domains.
DO NOT mix in HTML, CSS, React, or web development questions unless "${domain}" explicitly mentions them.

IMPORTANT: If the domain contains multiple topics separated by commas or "Topics:", generate questions that cover ALL the topics mentioned, distributing questions evenly across them.

Example: If domain is "Java - Welcome to Java - Topics: What is Java?, Key Features, JVM/JRE/JDK, Setting Up JDK", generate questions about:
- What Java is and its history (2-3 questions)
- Key features of Java (2-3 questions)
- JVM, JRE, and JDK concepts (2-3 questions)
- Setting up the Java Development Kit (2-3 questions)

Example: If domain is "Java Functions", generate ONLY Java function questions.
Example: If domain is "Python - Control Flow - Topics: If statements, For loops, While loops", generate questions about all three loop types.

=== UNIQUENESS REQUIREMENTS ===
This is a FRESH session. Generate ENTIRELY NEW questions that have NEVER been used before.
DO NOT reuse common textbook questions. Create ORIGINAL questions specific to this session.
Each of the ${questionCount} questions MUST cover a DIFFERENT aspect of "${domain}" - absolutely NO repetition.

=== DIFFICULTY LEVEL ===
Complexity: ${params.complexity}
Depth: ${params.depth}

=== QUESTION DISTRIBUTION ===
If multiple topics are mentioned in the domain, distribute questions evenly across all topics.
Ensure comprehensive coverage of the entire domain, not just one aspect.
For beginner/introductory topics, focus on fundamental concepts and definitions.
For advanced topics, include scenario-based and problem-solving questions.

=== QUESTION STYLE REQUIREMENTS ===
1. Mix question formats: "What is...", "Which of the following...", "In a scenario where...", "What would happen if...", "Which best describes..."
2. Include practical examples and code snippets when relevant to "${domain}"
3. Vary the position of correct answers (don't always make it the first or last option)
4. Questions should test understanding of "${domain}" concepts, not other topics

=== FORMAT SPECIFICATION ===
Return ONLY a valid JSON array. No explanations, no markdown, no extra text.

Each object structure:
{
  "questionText": "Complete question about ${domain} ending with ?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Exact text of the correct option"
}

RULES:
- correctAnswer MUST exactly match one option
- Each option must be substantively different
- No "All of the above" or "None of the above" options
- No numbered/lettered prefixes on options
- Questions should be between 10-50 words
- Options should be between 2-20 words each
- ALL questions must be about "${domain}" ONLY
- Questions must be appropriate for the "${difficulty}" level
- ALL questions must be about "${domain}" ONLY`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.9, // High temperature for variety but not maximum to maintain focus
      maxOutputTokens: 8192,
      useCache: false, // CRITICAL: Never cache question generation
      responseType: 'json'
    });

    let questions;
    try {
      questions = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError.message);
      throw new Error('Invalid JSON response from AI');
    }

    if (!Array.isArray(questions)) {
      console.error('Response is not an array, using fallback');
      return generateFallbackQuestions(domain, difficulty);
    }

    // Validate and clean questions
    const validQuestions = questions
      .filter(q =>
        q.questionText &&
        typeof q.questionText === 'string' &&
        q.questionText.trim().length > 10 &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every(opt => typeof opt === 'string' && opt.trim().length > 0) &&
        q.correctAnswer &&
        typeof q.correctAnswer === 'string' &&
        q.options.includes(q.correctAnswer)
      )
      .map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.trim()
      }));

    // Remove duplicate questions based on question text similarity
    const uniqueQuestions = [];
    const seenTexts = new Set();

    for (const q of validQuestions) {
      // Create a normalized version for comparison
      const normalizedText = q.questionText.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        uniqueQuestions.push(q);
      }
    }
    if (uniqueQuestions.length >= 10) {
      return uniqueQuestions.slice(0, 15);
    }
    throw new Error('Insufficient unique questions generated');
  } catch (error) {
    console.log('Quiz generation failed, using fallback:', error.message);
    return generateFallbackQuestions(domain, difficulty);
  }
}

/**
 * Evaluate quiz answers
 */
async function evaluateQuizAnswers(questions, userAnswers) {

  // Calculate score first (no API needed)
  const correctAnswers = questions.filter((q, index) =>
    q.correctAnswer === userAnswers[index]
  ).length;

  const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

  // For simple evaluation, skip AI call
  if (questions.length <= 5) {
    return createFallbackEvaluation(correctAnswers, questions.length, scorePercentage);
  }

  const wrongAnswers = questions
    .map((q, i) => ({ q, userAnswer: userAnswers[i], index: i }))
    .filter(item => item.q.correctAnswer !== item.userAnswer)
    .slice(0, 5); // Limit to 5 wrong answers for shorter prompt

  const prompt = `Evaluate quiz: ${correctAnswers}/${questions.length} (${scorePercentage}%)

Wrong answers:
${wrongAnswers.map(w => `Q: ${w.q.questionText.substring(0, 50)}... User: ${w.userAnswer || 'None'}, Correct: ${w.q.correctAnswer}`).join('\n')}

Return JSON:
{"score": ${scorePercentage}, "upskillAreas": ["area1", "area2"], "strengths": ["str1"], "recommendations": "Brief feedback"}`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.3,
      maxOutputTokens: 1024,
      useCache: false,
      responseType: 'json'
    });

    const evaluation = JSON.parse(jsonResponse);
    evaluation.score = scorePercentage; // Ensure correct score
    return evaluation;

  } catch (error) {
    console.log('Evaluation failed, using fallback:', error.message);
    return createFallbackEvaluation(correctAnswers, questions.length, scorePercentage);
  }
}

/**
 * Generate coding problems
 */
async function generateCodingProblems(topics, difficulty, count) {

  const prompt = `Generate ${count} unique ${difficulty} DSA problems for: ${topics.join(', ')}.

CRITICAL REQUIREMENTS:
- LeetCode/Codeforces-style format
- Each problem must be completely different
- Test cases MUST use stdin format (NOT JSON)
- Input format must be plain text that can be read from stdin
- Follow competitive programming conventions

INPUT FORMAT RULES:
1. Use space-separated values for arrays: "2 7 11 15"
2. Use newlines to separate different inputs: "2 7 11 15\\n9"
3. First line often contains array size or count
4. NO JSON objects in stdin
5. Plain text only

EXAMPLE TEST CASE FORMAT:
For Two Sum problem:
- stdin: "4\\n2 7 11 15\\n9"
  (4 = array size, "2 7 11 15" = array, 9 = target)
- expected_output: "0 1"

For Maximum Subarray:
- stdin: "9\\n-2 1 -3 4 -1 2 1 -5 4"
  (9 = array size, followed by array elements)
- expected_output: "6"

Return JSON array with this EXACT structure:
[{
  "id": 1,
  "title": "Problem Title",
  "difficulty": "${difficulty}",
  "topic": "${topics[0]}",
  "description": "Clear problem statement with input/output format explained",
  "input_format": "Detailed explanation of stdin format (e.g., 'First line: array size n\\nSecond line: n space-separated integers\\nThird line: target value')",
  "output_format": "Explanation of expected output format",
  "examples": [
    {
      "input": "Example stdin text (e.g., '4\\n2 7 11 15\\n9')",
      "output": "Example output (e.g., '0 1')",
      "explanation": "Why this output is correct"
    }
  ],
  "constraints": ["1 ≤ n ≤ 10^4", "constraint2"],
  "testCases": [
    {
      "stdin": "Plain text input exactly as it appears in stdin",
      "expectedOutput": "Expected output as plain text",
      "isHidden": false
    },
    {
      "stdin": "Another test case stdin",
      "expectedOutput": "Expected output",
      "isHidden": true
    }
  ]
}]

IMPORTANT: 
- stdin field must contain ONLY plain text, NO JSON
- Use \\n for newlines in stdin
- Use spaces to separate array elements
- Include at least 3 test cases per problem (2 public, 1+ hidden)`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.9,
      maxOutputTokens: 6144,
      useCache: true,
      responseType: 'json'
    });

    const problems = JSON.parse(jsonResponse);

    // Format and validate problems
    const formattedProblems = problems.slice(0, count).map((p, index) => ({
      id: index + 1,
      title: p.title || `${topics[0]} Problem ${index + 1}`,
      difficulty: p.difficulty || difficulty,
      topic: p.topic || topics[index % topics.length],
      description: p.description || 'Problem description not available.',
      input_format: p.input_format || 'Input format not specified',
      output_format: p.output_format || 'Output format not specified',
      examples: Array.isArray(p.examples) ? p.examples : [],
      constraints: Array.isArray(p.constraints) ? p.constraints : [],
      testCases: Array.isArray(p.testCases) && p.testCases.length >= 2 ? p.testCases : [
        { stdin: '3\\n1 2 3', expectedOutput: '6', isHidden: false },
        { stdin: '5\\n-1 -2 -3 -4 -5', expectedOutput: '-1', isHidden: true }
      ]
    }));

    return formattedProblems;

  } catch (error) {
    console.log('Coding problems generation failed, using fallback:', error.message);
    return generateFallbackCodingProblems(topics, difficulty, count);
  }
}

/**
 * Fallback quiz questions - Comprehensive set of 15 unique questions per domain
 */
function generateFallbackQuestions(domain, difficulty) {

  const fallbackQuestions = {
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

  // Get domain-specific questions or use AI as default
  let questions = fallbackQuestions[domain];

  if (!questions) {
    // Find closest match or use AI questions
    const domainLower = domain.toLowerCase();
    if (domainLower.includes('web') || domainLower.includes('frontend') || domainLower.includes('backend')) {
      questions = fallbackQuestions['Web Development'];
    } else if (domainLower.includes('machine') || domainLower.includes('ml')) {
      questions = fallbackQuestions['Machine Learning'];
    } else if (domainLower.includes('data') || domainLower.includes('analytics')) {
      questions = fallbackQuestions['Data Science'];
    } else {
      questions = fallbackQuestions['Artificial Intelligence'];
    }
  }

  // Return the questions (already 15 unique questions per domain)
  return questions.slice(0, 15);
}

/**
 * Fallback evaluation
 */
function createFallbackEvaluation(correct, total, percentage) {
  let performance = 'needs improvement';
  if (percentage >= 80) performance = 'excellent';
  else if (percentage >= 60) performance = 'good';
  else if (percentage >= 40) performance = 'fair';

  return {
    score: percentage,
    upskillAreas: ["Core concepts", "Problem solving", "Technical knowledge"],
    strengths: percentage >= 60 ? ["Good understanding", "Strong basics"] : ["Effort", "Participation"],
    recommendations: `Score: ${correct}/${total} (${percentage}%). Performance: ${performance}. ${percentage >= 60 ? 'Well done!' : 'Keep studying and try again.'}`
  };
}

/**
 * Fallback coding problems with stdin format
 */
function generateFallbackCodingProblems(topics, difficulty, count) {

  const problemBank = {
    'Arrays': [
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.\n\nYour program should read from stdin and write to stdout.',
        input_format: 'First line: integer n (array size)\nSecond line: n space-separated integers (array elements)\nThird line: integer target',
        output_format: 'Two space-separated integers representing the indices',
        examples: [
          { 
            input: '4\n2 7 11 15\n9', 
            output: '0 1', 
            explanation: 'nums[0] + nums[1] = 2 + 7 = 9' 
          }
        ],
        constraints: ['2 ≤ n ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
        testCases: [
          { stdin: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
          { stdin: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: true },
          { stdin: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true }
        ]
      },
      {
        title: 'Maximum Subarray',
        description: 'Find the contiguous subarray with the largest sum and return the sum.\n\nYour program should read from stdin and write to stdout.',
        input_format: 'First line: integer n (array size)\nSecond line: n space-separated integers (array elements)',
        output_format: 'Single integer representing the maximum sum',
        examples: [
          { 
            input: '9\n-2 1 -3 4 -1 2 1 -5 4', 
            output: '6', 
            explanation: 'Subarray [4,-1,2,1] has the largest sum = 6' 
          }
        ],
        constraints: ['1 ≤ n ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
        testCases: [
          { stdin: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
          { stdin: '1\n1', expectedOutput: '1', isHidden: true },
          { stdin: '5\n-1 -2 -3 -4 -5', expectedOutput: '-1', isHidden: true }
        ]
      },
      {
        title: 'Find Missing Number',
        description: 'Given an array containing n distinct numbers in the range [0, n], return the only number that is missing.\n\nYour program should read from stdin and write to stdout.',
        input_format: 'First line: integer n (array size)\nSecond line: n space-separated integers',
        output_format: 'Single integer representing the missing number',
        examples: [
          { 
            input: '3\n3 0 1', 
            output: '2', 
            explanation: 'n = 3 since there are 3 numbers, so all numbers are in range [0,3]. 2 is missing.' 
          }
        ],
        constraints: ['1 ≤ n ≤ 10⁴'],
        testCases: [
          { stdin: '3\n3 0 1', expectedOutput: '2', isHidden: false },
          { stdin: '2\n0 1', expectedOutput: '2', isHidden: true },
          { stdin: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8', isHidden: true }
        ]
      }
    ],
    'Strings': [
      {
        title: 'Valid Palindrome',
        description: 'Given a string s, return true if it is a palindrome, false otherwise. Consider only alphanumeric characters and ignore cases.\n\nYour program should read from stdin and write to stdout.',
        input_format: 'Single line: string s',
        output_format: 'true or false',
        examples: [
          { 
            input: 'A man, a plan, a canal: Panama', 
            output: 'true', 
            explanation: 'After removing non-alphanumeric and converting to lowercase: "amanaplanacanalpanama" is a palindrome' 
          }
        ],
        constraints: ['1 ≤ s.length ≤ 2 × 10⁵'],
        testCases: [
          { stdin: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
          { stdin: 'race a car', expectedOutput: 'false', isHidden: true },
          { stdin: ' ', expectedOutput: 'true', isHidden: true }
        ]
      }
    ]
  };

  const problems = [];
  const topicProblems = problemBank[topics[0]] || problemBank['Arrays'];

  for (let i = 0; i < count; i++) {
    const template = topicProblems[i % topicProblems.length];
    problems.push({
      id: i + 1,
      title: template.title,
      difficulty,
      topic: topics[i % topics.length],
      description: template.description,
      input_format: template.input_format,
      output_format: template.output_format,
      examples: template.examples,
      constraints: template.constraints,
      testCases: template.testCases
    });
  }

  return problems;
}

module.exports = {
  generateQuizQuestions,
  evaluateQuizAnswers,
  generateCodingProblems
};