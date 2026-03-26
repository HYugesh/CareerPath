/**
 * Gemini Service
 * Handles quiz generation, evaluation, and coding problems
 * Uses centralized Gemini client for optimized API usage
 */

const { callGemini, callGeminiText, callGeminiJSON } = require('./geminiClient');

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
 * Generate coding problems with 10 test cases (2 public, 8 private)
 */
async function generateCodingProblems(topics, difficulty, count) {

  const prompt = `Generate ${count} unique ${difficulty} DSA problems for: ${topics.join(', ')}.

CRITICAL REQUIREMENTS:
- LeetCode/Codeforces-style format
- Each problem must be completely different
- Test cases MUST use stdin format (NOT JSON)
- Input format must be plain text that can be read from stdin
- Follow competitive programming conventions
- Generate EXACTLY 10 test cases per problem (2 public, 8 private)

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
- expectedOutput: "0 1"

For Maximum Subarray:
- stdin: "9\\n-2 1 -3 4 -1 2 1 -5 4"
  (9 = array size, followed by array elements)
- expectedOutput: "6"

TEST CASE REQUIREMENTS:
- Generate EXACTLY 10 test cases per problem
- First 2 test cases: isHidden = false (public, shown to user)
- Remaining 8 test cases: isHidden = true (private, hidden from user)
- Public test cases should be simple/medium difficulty
- Private test cases should include edge cases, large inputs, corner cases
- Vary the test cases to cover different scenarios

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
      "stdin": "Test case 1 stdin (simple case)",
      "expectedOutput": "Expected output 1",
      "isHidden": false
    },
    {
      "stdin": "Test case 2 stdin (medium case)",
      "expectedOutput": "Expected output 2",
      "isHidden": false
    },
    {
      "stdin": "Test case 3 stdin (edge case)",
      "expectedOutput": "Expected output 3",
      "isHidden": true
    },
    {
      "stdin": "Test case 4 stdin (large input)",
      "expectedOutput": "Expected output 4",
      "isHidden": true
    },
    {
      "stdin": "Test case 5 stdin (corner case)",
      "expectedOutput": "Expected output 5",
      "isHidden": true
    },
    {
      "stdin": "Test case 6 stdin (negative numbers)",
      "expectedOutput": "Expected output 6",
      "isHidden": true
    },
    {
      "stdin": "Test case 7 stdin (all same elements)",
      "expectedOutput": "Expected output 7",
      "isHidden": true
    },
    {
      "stdin": "Test case 8 stdin (maximum constraints)",
      "expectedOutput": "Expected output 8",
      "isHidden": true
    },
    {
      "stdin": "Test case 9 stdin (minimum constraints)",
      "expectedOutput": "Expected output 9",
      "isHidden": true
    },
    {
      "stdin": "Test case 10 stdin (special pattern)",
      "expectedOutput": "Expected output 10",
      "isHidden": true
    }
  ]
}]

IMPORTANT: 
- stdin field must contain ONLY plain text, NO JSON
- Use \\n for newlines in stdin
- Use spaces to separate array elements
- MUST include EXACTLY 10 test cases per problem
- First 2 test cases MUST have isHidden: false
- Remaining 8 test cases MUST have isHidden: true`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.9,
      maxOutputTokens: 8192,
      useCache: false, // Don't cache to get fresh problems
      responseType: 'json'
    });

    const problems = JSON.parse(jsonResponse);

    // Format and validate problems
    const formattedProblems = problems.slice(0, count).map((p, index) => {
      // Ensure we have exactly 10 test cases
      let testCases = Array.isArray(p.testCases) ? p.testCases : [];
      
      // If less than 10, generate additional ones
      while (testCases.length < 10) {
        const isPublic = testCases.length < 2;
        testCases.push({
          stdin: `${testCases.length + 1}\\n1 2 3\\n${testCases.length}`,
          expectedOutput: `${testCases.length}`,
          isHidden: !isPublic
        });
      }

      // Take only first 10 and ensure proper isHidden flags
      testCases = testCases.slice(0, 10).map((tc, idx) => ({
        stdin: tc.stdin || `${idx + 1}\\n1 2 3\\n${idx}`,
        expectedOutput: tc.expectedOutput || `${idx}`,
        isHidden: idx >= 2 // First 2 public, rest private
      }));

      return {
        id: index + 1,
        title: p.title || `${topics[0]} Problem ${index + 1}`,
        difficulty: p.difficulty || difficulty,
        topic: p.topic || topics[index % topics.length],
        description: p.description || 'Problem description not available.',
        input_format: p.input_format || 'Input format not specified',
        output_format: p.output_format || 'Output format not specified',
        examples: Array.isArray(p.examples) ? p.examples.slice(0, 2) : [],
        constraints: Array.isArray(p.constraints) ? p.constraints : [],
        testCases: testCases
      };
    });

    console.log(`[GEMINI] Generated ${formattedProblems.length} problems with 10 test cases each`);
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
 * Fallback coding problems with stdin format and 10 test cases (2 public, 8 private)
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
          // Public test cases (shown to user)
          { stdin: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
          { stdin: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false },
          // Private test cases (hidden from user)
          { stdin: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true },
          { stdin: '5\n1 5 3 7 9\n10', expectedOutput: '1 3', isHidden: true },
          { stdin: '6\n-1 -2 -3 -4 -5 -6\n-11', expectedOutput: '4 5', isHidden: true },
          { stdin: '7\n0 4 3 0 1 2 5\n0', expectedOutput: '0 3', isHidden: true },
          { stdin: '8\n10 20 30 40 50 60 70 80\n90', expectedOutput: '3 4', isHidden: true },
          { stdin: '4\n1 1 1 1\n2', expectedOutput: '0 1', isHidden: true },
          { stdin: '10\n5 5 5 5 5 5 5 5 5 5\n10', expectedOutput: '0 1', isHidden: true },
          { stdin: '2\n-1 1\n0', expectedOutput: '0 1', isHidden: true }
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
          // Public test cases
          { stdin: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
          { stdin: '1\n5', expectedOutput: '5', isHidden: false },
          // Private test cases
          { stdin: '1\n-1', expectedOutput: '-1', isHidden: true },
          { stdin: '5\n-1 -2 -3 -4 -5', expectedOutput: '-1', isHidden: true },
          { stdin: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true },
          { stdin: '6\n1 2 3 4 5 6', expectedOutput: '21', isHidden: true },
          { stdin: '8\n-2 -3 4 -1 -2 1 5 -3', expectedOutput: '7', isHidden: true },
          { stdin: '4\n1 -1 1 -1', expectedOutput: '1', isHidden: true },
          { stdin: '10\n10 -5 10 -5 10 -5 10 -5 10 -5', expectedOutput: '30', isHidden: true },
          { stdin: '3\n-10 5 -10', expectedOutput: '5', isHidden: true }
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
          // Public test cases
          { stdin: '3\n3 0 1', expectedOutput: '2', isHidden: false },
          { stdin: '2\n0 1', expectedOutput: '2', isHidden: false },
          // Private test cases
          { stdin: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8', isHidden: true },
          { stdin: '1\n1', expectedOutput: '0', isHidden: true },
          { stdin: '1\n0', expectedOutput: '1', isHidden: true },
          { stdin: '5\n0 1 2 3 4', expectedOutput: '5', isHidden: true },
          { stdin: '4\n4 3 2 1', expectedOutput: '0', isHidden: true },
          { stdin: '7\n7 6 5 4 3 2 0', expectedOutput: '1', isHidden: true },
          { stdin: '6\n1 2 3 4 5 6', expectedOutput: '0', isHidden: true },
          { stdin: '8\n0 1 2 3 4 5 6 7', expectedOutput: '8', isHidden: true }
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
          // Public test cases
          { stdin: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
          { stdin: 'race a car', expectedOutput: 'false', isHidden: false },
          // Private test cases
          { stdin: ' ', expectedOutput: 'true', isHidden: true },
          { stdin: 'a', expectedOutput: 'true', isHidden: true },
          { stdin: 'ab', expectedOutput: 'false', isHidden: true },
          { stdin: 'aba', expectedOutput: 'true', isHidden: true },
          { stdin: '0P', expectedOutput: 'false', isHidden: true },
          { stdin: 'A man a plan a canal Panama', expectedOutput: 'true', isHidden: true },
          { stdin: 'Was it a car or a cat I saw', expectedOutput: 'true', isHidden: true },
          { stdin: 'hello world', expectedOutput: 'false', isHidden: true }
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
      testCases: template.testCases // Already has 10 test cases (2 public, 8 private)
    });
  }

  return problems;
}

module.exports = {
  generateQuizQuestions,
  evaluateQuizAnswers,
  generateCodingProblems
};


/**
 * Analyze coding performance using Gemini AI
 * @param {Object} sessionData - Session data including attempts, questions, and user codes
 * @returns {Promise<Object>} - Performance analysis with ratings and recommendations
 */
async function analyzeCodePerformance(sessionData) {
  const {
    sessionDuration,
    totalAttempts,
    questions,
    attempts,
    language,
    userCodes,
    successRate
  } = sessionData;

  const sessionMinutes = Math.round(sessionDuration / 60000);
  const avgTimePerProblem = totalAttempts > 0 ? sessionMinutes / totalAttempts : 0;

  // Prepare code samples for analysis - match userCodes with questions
  const codeSamples = userCodes.map((code, index) => {
    const question = questions[index];
    // Find attempt for this question if it exists
    const attempt = attempts.find(a => a.questionId === question?.id);
    
    return {
      questionTitle: question?.title || `Problem ${index + 1}`,
      questionId: question?.id || index + 1,
      questionDifficulty: question?.difficulty || 'Medium',
      code: code,
      results: attempt?.results || [],
      wasExecuted: !!attempt
    };
  }).filter(sample => sample.code && sample.code.trim().length > 0);

  const prompt = `You are an expert coding instructor analyzing a student's coding session performance.

SESSION SUMMARY:
- Programming Language: ${language}
- Session Duration: ${sessionMinutes} minutes
- Total Attempts: ${totalAttempts}
- Success Rate: ${successRate ? successRate.toFixed(1) : 'N/A'}%
- Average Time per Problem: ${avgTimePerProblem.toFixed(1)} minutes

QUESTIONS ATTEMPTED:
${questions.map((q, i) => `${i + 1}. ${q.title} (${q.difficulty || 'Medium'} - ${q.topic || 'General'})`).join('\n')}

CODE SAMPLES:
${codeSamples.map((sample, i) => `
Problem ${i + 1}: ${sample.questionTitle} (${sample.questionDifficulty})
Code:
\`\`\`${language.toLowerCase()}
${sample.code}
\`\`\`
${sample.wasExecuted ? `Test Results: ${sample.results.filter(r => r.status === "Passed").length}/${sample.results.length} passed` : 'Not executed'}
`).join('\n')}

Analyze this coding session and provide a comprehensive performance evaluation in the following JSON format:

{
  "overallRating": <number 1-10>,
  "strengths": [<array of 2-4 specific strengths observed in the actual code>],
  "improvements": [<array of 2-4 specific areas for improvement based on code analysis>],
  "codeQuality": {
    "readability": <number 1-10>,
    "efficiency": <number 1-10>,
    "correctness": <number 1-10>
  },
  "recommendations": [<array of 3-5 actionable recommendations for improving coding skills>],
  "summary": "<2-3 sentence summary of overall performance>",
  "questionAnalysis": [
    {
      "questionTitle": "<question title>",
      "questionId": <question id>,
      "userApproach": "<brief description of the approach the user took>",
      "betterApproaches": [<array of 1-3 alternative/better approaches with brief explanations>],
      "rating": <number 1-10 for this specific question>,
      "feedback": "<specific feedback on this solution - what was good, what could be improved>"
    }
  ]
}

ANALYSIS GUIDELINES:
1. Be specific and constructive in feedback - reference actual code patterns you see
2. For each question, analyze the user's approach and suggest better alternatives if applicable
3. Provide individual ratings for each question based on code quality, efficiency, and correctness
4. If the user's approach is already optimal, acknowledge it and provide minor improvements
5. Consider the difficulty level and time taken
6. Focus on ${language}-specific best practices and idioms
7. If code wasn't executed, still analyze the logic and approach
8. For better approaches, explain WHY they are better (time complexity, space complexity, readability, etc.)

Return ONLY the JSON object, no markdown, no explanations.`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 3000
    });

    // Parse and validate the response
    const analysis = JSON.parse(jsonResponse);

    // Ensure all required fields exist
    if (!analysis.overallRating || !analysis.strengths || !analysis.improvements || 
        !analysis.codeQuality || !analysis.recommendations || !analysis.summary) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    console.log('[GEMINI] Performance analysis generated successfully');
    return analysis;

  } catch (error) {
    console.error('[GEMINI] Performance analysis error:', error.message);
    throw error;
  }
}

/**
 * Analyze a single code submission using Gemini AI
 * @param {Object} params - Analysis parameters
 * @param {string} params.code - The student's code
 * @param {string} params.language - Programming language
 * @param {string} params.questionTitle - Question title
 * @param {string} params.difficulty - Question difficulty
 * @returns {Object} Analysis result with approach, betterApproach, feedback, rating
 */
async function analyzeCodeSubmission({ code, language, questionTitle, difficulty }) {
  const prompt = `You are a senior software engineer reviewing a student's coding exam submission.

Question: ${questionTitle}
Difficulty: ${difficulty}
Language: ${language}

Analyze the following code and provide:
1. **Approach Used**: Describe the algorithm/approach the student used
2. **Time Complexity**: Explain the time complexity (e.g., O(n), O(n²))
3. **Better Approach**: If a more optimal approach exists, describe it. If the current approach is optimal, say "Current approach is optimal"
4. **Code Quality Feedback**: Provide constructive feedback on code quality, readability, and correctness
5. **Rating**: Rate the solution from 1 to 10 (1=poor, 10=excellent)

Return ONLY valid JSON in this exact format:
{
  "approach": "description of approach used",
  "timeComplexity": "time complexity explanation",
  "betterApproach": "better approach or 'Current approach is optimal'",
  "feedback": "constructive feedback",
  "rating": 7
}

Code to analyze:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

IMPORTANT: Return ONLY the JSON object, no additional text.`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2048,
      useCache: false,
      responseType: 'json'
    });

    const analysis = JSON.parse(jsonResponse);

    // Validate and sanitize the response
    return {
      approach: analysis.approach || "Unable to determine approach",
      timeComplexity: analysis.timeComplexity || "Not analyzed",
      betterApproach: analysis.betterApproach || "",
      feedback: analysis.feedback || "No feedback available",
      rating: Math.min(Math.max(parseInt(analysis.rating) || 5, 1), 10)
    };

  } catch (error) {
    console.error('[GEMINI] Code analysis failed:', error.message);
    
    // Return fallback analysis
    return {
      approach: "Unable to analyze approach due to AI error",
      timeComplexity: "Not analyzed",
      betterApproach: "",
      feedback: "Analysis failed. Please try again later.",
      rating: 5
    };
  }
}

/**
 * Suggest approach for an unattempted question using Gemini AI
 * @param {Object} params - Question parameters
 * @param {string} params.questionTitle - Question title
 * @param {string} params.questionDescription - Question description
 * @param {string} params.difficulty - Question difficulty
 * @param {string} params.topic - Question topic
 * @param {string} params.language - Programming language
 * @returns {Object} Suggested approach with guidance
 */
async function suggestApproachForQuestion({ questionTitle, questionDescription, difficulty, topic, language }) {
  const prompt = `You are an expert coding instructor helping a student who did not attempt a coding problem.

Question: ${questionTitle}
Difficulty: ${difficulty}
Topic: ${topic}
Language: ${language}

Question Description:
${questionDescription}

The student did not attempt this question. Provide educational guidance to help them understand how to approach this problem.

Return ONLY valid JSON in this exact format:
{
  "approach": "Not Attempted",
  "recommendedApproach": "detailed explanation of the recommended approach/algorithm to solve this problem",
  "timeComplexity": "expected time complexity of the recommended approach (e.g., O(n), O(n log n))",
  "guidance": "step-by-step guidance on how to implement the solution",
  "feedback": "encouraging feedback and learning tips for this type of problem"
}

IMPORTANT: 
- Be educational and encouraging
- Explain the recommended approach clearly
- Provide step-by-step guidance
- Include time complexity analysis
- Return ONLY the JSON object, no additional text`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.5,
      maxOutputTokens: 3072,
      useCache: false,
      responseType: 'json'
    });

    const suggestion = JSON.parse(jsonResponse);

    // Validate response completeness
    const isComplete = suggestion.recommendedApproach && 
                      suggestion.recommendedApproach.length > 20 &&
                      suggestion.guidance && 
                      suggestion.guidance.length > 20;

    if (!isComplete) {
      console.log('[GEMINI] Incomplete suggestion response, using fallback');
      return generateFallbackSuggestion(difficulty, topic);
    }

    // Validate and sanitize the response
    return {
      approach: "Not Attempted",
      recommendedApproach: suggestion.recommendedApproach || "No approach suggested",
      timeComplexity: suggestion.timeComplexity || "N/A",
      guidance: suggestion.guidance || "Practice similar problems to improve",
      feedback: suggestion.feedback || "Keep practicing and you'll improve!"
    };

  } catch (error) {
    console.error('[GEMINI] Approach suggestion failed:', error.message);
    return generateFallbackSuggestion(difficulty, topic);
  }
}

/**
 * Generate fallback suggestion when AI fails
 */
function generateFallbackSuggestion(difficulty, topic) {
  const difficultyGuidance = {
    'Easy': {
      recommendedApproach: "Start by understanding the problem requirements. For Easy problems, focus on basic data structures like arrays, strings, and simple loops. Break down the problem into smaller steps.",
      guidance: "1. Read the problem carefully\n2. Identify input and output format\n3. Think about edge cases\n4. Write pseudocode first\n5. Implement step by step\n6. Test with examples",
      timeComplexity: "O(n) or O(n log n)"
    },
    'Medium': {
      recommendedApproach: "Medium problems often require combining multiple concepts. Consider using hash maps for O(1) lookups, two-pointer techniques, or sliding window approaches. Think about optimization.",
      guidance: "1. Analyze the problem constraints\n2. Consider time and space complexity\n3. Think about optimal data structures\n4. Plan your algorithm before coding\n5. Handle edge cases\n6. Optimize after getting a working solution",
      timeComplexity: "O(n) to O(n log n)"
    },
    'Hard': {
      recommendedApproach: "Hard problems require advanced algorithms and data structures. Consider dynamic programming, graph algorithms, or complex data structures. Focus on optimization and handling all edge cases.",
      guidance: "1. Break down the problem into subproblems\n2. Identify patterns (DP, graphs, trees)\n3. Consider multiple approaches\n4. Analyze time/space tradeoffs\n5. Implement carefully with edge cases\n6. Test thoroughly",
      timeComplexity: "O(n log n) to O(n²)"
    }
  };

  const guidance = difficultyGuidance[difficulty] || difficultyGuidance['Medium'];

  return {
    approach: "Not Attempted",
    recommendedApproach: guidance.recommendedApproach,
    timeComplexity: guidance.timeComplexity,
    guidance: guidance.guidance,
    feedback: `This is a ${difficulty} level ${topic} problem. Take your time to understand the requirements and practice similar problems to build your skills.`
  };
}

/**
 * Phase 1: Generate subtopic metadata only (titles, descriptions, importance levels)
 * @param {string} moduleTitle - The module title
 * @param {string} moduleDescription - The module description
 * @param {string} domain - The learning domain
 * @param {string} skillLevel - The skill level (Beginner, Intermediate, Advanced, Expert)
 * @returns {Promise<Array>} Array of subtopic metadata objects
 */
async function generateSubtopicMetadata(moduleTitle, moduleDescription, domain, skillLevel) {
  console.log(`[GEMINI] Phase 1: Generating subtopic metadata for "${moduleTitle}"`);
 
  const prompt = `You are an expert curriculum designer for ${domain} education.
 
Generate subtopic metadata for the module: "${moduleTitle}"
Description: ${moduleDescription}
Skill Level: ${skillLevel}
 
Generate 5-12 subtopics. For each subtopic return ONLY:
- title (3-8 words)
- description (1-2 sentences, 15-30 words)
- importanceLevel: exactly "high", "medium", or "low"
 
Distribution: 2-3 high, 3-5 medium, 1-3 low.
 
Return ONLY a valid JSON array, no markdown, no extra text:
[
  {
    "title": "Subtopic Title",
    "description": "Brief 1-2 sentence description.",
    "importanceLevel": "high"
  }
]`;
 
  const jsonResponse = await callGeminiJSON(prompt, {
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
 
  const metadata = JSON.parse(jsonResponse);
 
  if (!Array.isArray(metadata)) {
    throw new Error("Phase 1: response is not an array");
  }
 
  const valid = metadata
    .filter(
      (item) =>
        item.title &&
        item.description &&
        ["high", "medium", "low"].includes(item.importanceLevel)
    )
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      importanceLevel: item.importanceLevel,
    }));
 
  if (valid.length < 5) {
    throw new Error(`Only ${valid.length} valid subtopics — need at least 5`);
  }
 
  console.log(`[GEMINI] Phase 1 complete: ${valid.length} subtopics`);
  return valid;
}

async function fetchSubtopicExplanation(subtopicTitle, subtopicDescription, importanceLevel, moduleContext, domain) {
  const { moduleTitle, skillLevel } = moduleContext;
 
  const wordCountRanges = {
    high:   { min: 800,  max: 1500 },
    medium: { min: 500,  max: 800  },
    low:    { min: 300,  max: 500  },
  };
  const wc = wordCountRanges[importanceLevel] || wordCountRanges.medium;
 
  const prompt = `You are an expert ${domain} educator writing learning material.
 
Write a detailed explanation for this subtopic:
Title: "${subtopicTitle}"
Description: ${subtopicDescription}
Module: "${moduleTitle}"
Skill Level: ${skillLevel}
 
REQUIREMENTS:
- Length: ${wc.min}–${wc.max} words
- Use markdown: ## headings, bullet points, bold for key terms
- Sections to include: Overview, Key Concepts, Practical Examples
- Appropriate for ${skillLevel} learners
- Do NOT include code blocks here (code will be in a separate section)
- Return ONLY the markdown text, no JSON, no preamble`;
 
  // responseType: 'text' → no JSON parsing, no chance of parse failure
  const explanation = await callGeminiText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });
 
  return explanation.trim();
}
 
/**
 * Call 2b — Small structured JSON (code examples + key takeaways only)
 * This JSON is small and safe to parse.
 */
async function fetchSubtopicStructuredData(subtopicTitle, moduleContext, domain) {
  const { moduleTitle, skillLevel } = moduleContext;
 
  const prompt = `You are an expert ${domain} educator.
 
For the subtopic "${subtopicTitle}" in module "${moduleTitle}" at ${skillLevel} level:
 
Return ONLY valid JSON with this exact structure — no markdown, no extra text:
{
  "codeExamples": [
    {
      "language": "javascript",
      "code": "// short working code example",
      "description": "What this demonstrates"
    }
  ],
  "keyTakeaways": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ]
}
 
Rules:
- 2-4 code examples relevant to the subtopic (use language appropriate for ${domain})
- 3-5 key takeaways as short strings
- Code examples must be short (5-20 lines each)
- Return ONLY the JSON object`;
 
  const jsonResponse = await callGeminiJSON(prompt, {
    temperature: 0.5,
    maxOutputTokens: 2048,
  });
 
  const data = JSON.parse(jsonResponse);
 
  return {
    codeExamples: Array.isArray(data.codeExamples) ? data.codeExamples : [],
    keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
  };
}


/**
 * Phase 2: Generate detailed content for a specific subtopic
 * @param {string} subtopicTitle - The subtopic title
 * @param {string} subtopicDescription - The subtopic description
 * @param {string} importanceLevel - The importance level (high, medium, low)
 * @param {Object} moduleContext - Context about the module
 * @param {string} domain - The learning domain
 * @returns {Promise<Object>} Subtopic content object
 */
async function generateSubtopicContent(
  subtopicTitle,
  subtopicDescription,
  importanceLevel,
  moduleContext,
  domain
) {
  console.log(`[GEMINI] Phase 2: Generating content for "${subtopicTitle}" (${importanceLevel})`);
 
  // Run both calls — explanation is mandatory, structured data is best-effort
  const [explanation, structuredData] = await Promise.allSettled([
    fetchSubtopicExplanation(subtopicTitle, subtopicDescription, importanceLevel, moduleContext, domain),
    fetchSubtopicStructuredData(subtopicTitle, moduleContext, domain),
  ]);
 
  if (explanation.status === "rejected") {
    console.error(`[GEMINI] Phase 2 explanation failed: ${explanation.reason}`);
    throw new Error(`Failed to generate explanation for "${subtopicTitle}": ${explanation.reason}`);
  }
 
  const explanationText = explanation.value;
  const { codeExamples, keyTakeaways } =
    structuredData.status === "fulfilled"
      ? structuredData.value
      : { codeExamples: [], keyTakeaways: [] };
 
  if (structuredData.status === "rejected") {
    console.warn(`[GEMINI] Phase 2 structured data failed (non-fatal): ${structuredData.reason}`);
  }
 
  const wordCount = explanationText.split(/\s+/).length;
  console.log(`[GEMINI] Phase 2 complete: ${wordCount} words, ${codeExamples.length} code examples`);
 
  return {
    // 'content' is what SubComponentViewer renders via dangerouslySetInnerHTML
    content: explanationText,
    // Keep the old 'explanation' field for backward compatibility
    explanation: explanationText,
    codeExamples,
    keyTakeaways,
    // Sections derived from the explanation for backward compat
    sections: [],
  };
}

module.exports = {
  generateQuizQuestions,
  evaluateQuizAnswers,
  generateCodingProblems,
  analyzeCodePerformance,
  analyzeCodeSubmission,
  suggestApproachForQuestion,
  generateSubtopicMetadata,
  generateSubtopicContent
};
