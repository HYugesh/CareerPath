/**
 * Coding Controller
 * Handles coding questions generation using Gemini AI
 * Generates 10 test cases: 2 public (shown), 8 private (hidden)
 */

const { generateCodingProblems } = require('../services/geminiService');

// ============================================
// STATIC CODING PROBLEMS FOR TESTING MODE
// ============================================

const STATIC_CODING_PROBLEMS = {
  'Arrays': [
    {
      title: 'Two Sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
      constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' }
      ],
      testCases: [
        { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
        { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
        { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true }
      ]
    },
    {
      title: 'Find Missing Number',
      description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.`,
      constraints: ['n == nums.length', '1 ≤ n ≤ 10⁴'],
      examples: [
        { input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3, so 2 is missing' }
      ],
      testCases: [
        { input: '[3,0,1]', expectedOutput: '2', isHidden: false },
        { input: '[0,1]', expectedOutput: '2', isHidden: false },
        { input: '[9,6,4,2,3,5,7,0,1]', expectedOutput: '8', isHidden: true }
      ]
    },
    {
      title: 'Remove Duplicates',
      description: `Given a sorted array nums, remove the duplicates in-place such that each element appears only once and returns the new length.`,
      constraints: ['1 ≤ nums.length ≤ 3 * 10⁴', '-100 ≤ nums[i] ≤ 100'],
      examples: [
        { input: 'nums = [1,1,2]', output: '2', explanation: 'First two elements are 1 and 2' }
      ],
      testCases: [
        { input: '[1,1,2]', expectedOutput: '2', isHidden: false },
        { input: '[0,0,1,1,1,2,2,3,3,4]', expectedOutput: '5', isHidden: false },
        { input: '[1,2,3]', expectedOutput: '3', isHidden: true }
      ]
    },
    {
      title: 'Maximum Subarray',
      description: `Find the contiguous subarray with the largest sum and return its sum.`,
      constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
      examples: [
        { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has sum 6' }
      ],
      testCases: [
        { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
        { input: '[1]', expectedOutput: '1', isHidden: false },
        { input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true }
      ]
    },
    {
      title: 'Valid Parentheses',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
      constraints: ['1 ≤ s.length ≤ 10⁴'],
      examples: [
        { input: 's = "()"', output: 'true', explanation: 'Valid parentheses' }
      ],
      testCases: [
        { input: '"()"', expectedOutput: 'true', isHidden: false },
        { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
        { input: '"(]"', expectedOutput: 'false', isHidden: true }
      ]
    }
  ],
  'Strings': [
    {
      title: 'Reverse String',
      description: `Write a function that reverses a string. The input string is given as an array of characters s.`,
      constraints: ['1 ≤ s.length ≤ 10⁵'],
      examples: [
        { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: 'Reverse the array' }
      ],
      testCases: [
        { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
        { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: true }
      ]
    },
    {
      title: 'Valid Anagram',
      description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.`,
      constraints: ['1 ≤ s.length, t.length ≤ 5 * 10⁴'],
      examples: [
        { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both contain same characters' }
      ],
      testCases: [
        { input: '"anagram", "nagaram"', expectedOutput: 'true', isHidden: false },
        { input: '"rat", "car"', expectedOutput: 'false', isHidden: true }
      ]
    }
  ],
  'Linked Lists': [
    {
      title: 'Reverse Linked List',
      description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
      constraints: ['The number of nodes in the list is the range [0, 5000]'],
      examples: [
        { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reverse the linked list' }
      ],
      testCases: [
        { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
        { input: '[1,2]', expectedOutput: '[2,1]', isHidden: true }
      ]
    }
  ]
};

// ============================================
// STATIC HELPER FUNCTIONS
// ============================================

// Get starter code template
const getStarterCodeTemplate = (lang, functionName = 'solution', params = 'params') => {
  switch (lang) {
    case 'JavaScript':
      return `function ${functionName}(${params}) {\n    // Your code here\n    \n}`;
    case 'Python':
      return `def ${functionName}(${params}):\n    # Your code here\n    pass`;
    case 'Java':
      return `public class Solution {\n    public ReturnType ${functionName}(${params}) {\n        // Your code here\n        \n    }\n}`;
    case 'C++':
      return `class Solution {\npublic:\n    ReturnType ${functionName}(${params}) {\n        // Your code here\n        \n    }\n};`;
    default:
      return '// Your code here';
  }
};

// Generate static coding problems
const generateStaticCodingProblems = (topic, difficulty, language, count) => {
  console.log(`Generating ${count} static coding problems for ${topic} (${difficulty}) in ${language}`);

  // Get topic-specific problems or use Arrays as default
  let problems = STATIC_CODING_PROBLEMS[topic] || STATIC_CODING_PROBLEMS['Arrays'];

  // Shuffle and select problems
  const shuffled = [...problems].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Format problems with proper starter code and convert test cases to stdin format
  return selected.map((problem, index) => ({
    id: index + 1,
    title: problem.title,
    description: problem.description,
    constraints: problem.constraints,
    examples: problem.examples,
    starterCode: getStarterCodeTemplate(language, 'solution', 'params'),
    testCases: problem.testCases.map(tc => convertTestCaseToStdin(tc))
  }));
};

// Helper function to convert test case input format to stdin format
const convertTestCaseToStdin = (testCase) => {
  // Extract input and convert to stdin format
  let stdin = testCase.input;
  
  // Remove array brackets and convert comma-separated to space-separated
  // Example: '[2,7,11,15], 9' -> '2 7 11 15\n9'
  if (stdin.includes('[') && stdin.includes(']')) {
    // Split by comma outside brackets
    const parts = stdin.split(/\],\s*/);
    
    if (parts.length >= 2) {
      // First part is the array
      const arrayPart = parts[0].replace(/[\[\]]/g, '').replace(/,/g, ' ').trim();
      // Second part is the target/other input
      const otherPart = parts[1].replace(/[\[\]]/g, '').trim();
      stdin = `${arrayPart}\n${otherPart}`;
    } else {
      // Single array input
      stdin = stdin.replace(/[\[\]]/g, '').replace(/,/g, ' ').trim();
    }
  }
  
  // Keep expected output exactly as shown in problem statement
  // The expected output should match what's shown in examples
  // If it has brackets in the problem statement, keep them
  let expectedOutput = testCase.expectedOutput;
  
  return {
    stdin: stdin,
    expectedOutput: expectedOutput,
    isHidden: testCase.isHidden
  };
};

// Create mock execution results
const createMockExecutionResults = (code, testCases, language, testMode = 'submit') => {
  const hasReturn = code.includes('return');
  const hasLoop = code.includes('for') || code.includes('while');
  const hasCondition = code.includes('if');
  const hasDataStructure = code.includes('Map') || code.includes('Set') || code.includes('dict') || code.includes('{}');

  // Score the code quality
  let qualityScore = 0;
  if (hasReturn) qualityScore += 30;
  if (hasLoop) qualityScore += 25;
  if (hasCondition) qualityScore += 20;
  if (hasDataStructure) qualityScore += 25;

  // Adjust difficulty based on test mode
  let difficultyMultiplier = 1;
  if (testMode === 'public') {
    difficultyMultiplier = 0.7; // Public tests are easier
  } else if (testMode === 'custom') {
    difficultyMultiplier = 0.8; // Custom tests are moderately easier
  }

  return testCases.map((tc, index) => {
    // First test case more likely to pass if code looks reasonable
    const baseThreshold = testMode === 'public' ? 40 : 70;
    const passThreshold = (baseThreshold + (index * 5)) * difficultyMultiplier;
    const shouldPass = qualityScore >= passThreshold;

    if (!hasReturn) {
      return {
        testCaseIndex: index,
        status: "Error",
        errorDetail: "Function must return a value",
        isHidden: tc.isHidden
      };
    }

    return {
      testCaseIndex: index,
      status: shouldPass ? "Passed" : "Failed",
      actualOutput: shouldPass ? tc.expectedOutput : "incorrect_output",
      errorDetail: shouldPass ? null : "Check algorithm logic and edge cases",
      isHidden: tc.isHidden
    };
  });
};

// Generate mock performance analysis
const generateMockPerformanceAnalysis = (sessionDuration, totalAttempts, successRate, language, questions = [], userCodes = []) => {
  const avgTimePerProblem = sessionDuration / totalAttempts / 60000; // minutes

  let overallRating = Math.max(1, Math.min(10, Math.round(successRate / 10) || 5));
  if (avgTimePerProblem < 5) overallRating += 1; // Bonus for speed
  if (successRate > 80) overallRating += 1; // Bonus for accuracy

  const strengths = [
    "Completed the coding session successfully",
    `Effective use of ${language} programming language`,
    successRate > 70 ? "Good problem-solving approach" : "Persistent effort in problem-solving"
  ];

  const improvements = [
    "Focus on improving test case coverage",
    "Consider edge cases and boundary conditions",
    avgTimePerProblem > 10 ? "Work on solving problems more efficiently" : "Maintain coding speed while improving accuracy"
  ];

  const recommendations = [
    "Practice more coding problems daily",
    "Review solutions for failed test cases",
    "Study algorithm optimization techniques",
    "Focus on clean code principles"
  ];

  // Generate per-question analysis
  const questionAnalysis = questions.map((q, index) => {
    const code = userCodes[index] || '';
    const hasCode = code.trim().length > 0;
    
    return {
      questionTitle: q.title,
      questionId: q.id,
      userApproach: hasCode ? "Implemented a solution using standard approach" : "No code submitted",
      betterApproaches: hasCode ? [
        "Consider using optimized data structures for better time complexity",
        "Explore alternative algorithms that reduce space complexity"
      ] : ["Submit a solution to receive feedback"],
      rating: hasCode ? Math.max(5, Math.min(9, Math.round(successRate / 15))) : 3,
      feedback: hasCode 
        ? "Your solution demonstrates understanding of the problem. Consider optimizing for edge cases and performance."
        : "No solution was submitted for this problem."
    };
  });

  return {
    overallRating: Math.max(1, Math.min(10, overallRating)),
    strengths,
    improvements,
    codeQuality: {
      readability: Math.max(5, Math.min(9, 7 + Math.round(successRate / 50))),
      efficiency: Math.max(3, Math.min(8, Math.round(successRate / 15))),
      correctness: Math.max(1, Math.min(10, Math.round(successRate / 10)))
    },
    recommendations,
    summary: `You completed ${totalAttempts} coding attempts with a ${Math.round(successRate)}% success rate in ${Math.round(sessionDuration / 60000)} minutes. ${successRate >= 70 ? 'Great job! Keep up the excellent work.' : 'Keep practicing to improve your skills!'}`,
    questionAnalysis
  };
};

// @desc    Generate coding questions using Gemini AI
// @route   POST /api/coding/generate-questions
// @access  Public
const generateCodingQuestions = async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;

    if (!topic || !difficulty || !count) {
      return res.status(400).json({ message: 'Required fields: topic, difficulty, count' });
    }

    console.log(`[CODING] Generating ${count} questions for ${topic} (${difficulty})`);

    try {
      // Call Gemini AI to generate coding problems
      const problems = await generateCodingProblems([topic], difficulty, parseInt(count));

      // Ensure each problem has exactly 10 test cases (2 public, 8 private)
      const questionsWithTestCases = problems.map((problem, index) => {
        // Get existing test cases or create defaults
        let testCases = problem.testCases || [];
        
        // Ensure we have at least 10 test cases
        while (testCases.length < 10) {
          // Generate additional test cases based on the problem
          const isPublic = testCases.length < 2; // First 2 are public
          testCases.push({
            stdin: generateDefaultStdin(problem, testCases.length),
            expectedOutput: generateDefaultOutput(problem, testCases.length),
            isHidden: !isPublic
          });
        }

        // Mark first 2 as public (isHidden: false), rest as private (isHidden: true)
        testCases = testCases.slice(0, 10).map((tc, idx) => ({
          ...tc,
          isHidden: idx >= 2 // First 2 are public (false), rest are private (true)
        }));

        return {
          id: index + 1,
          title: problem.title,
          description: problem.description,
          input_format: problem.input_format,
          output_format: problem.output_format,
          constraints: problem.constraints || [],
          examples: problem.examples || [],
          starterCode: '', // Empty starter code - language agnostic
          testCases: testCases
        };
      });

      console.log(`[CODING] Successfully generated ${questionsWithTestCases.length} questions with 10 test cases each`);
      return res.json({ questions: questionsWithTestCases });

    } catch (aiError) {
      console.error('[CODING] Gemini AI generation failed:', aiError.message);
      console.log('[CODING] Falling back to static problems');
      
      // Fallback to static problems if AI fails
      const questions = generateStaticCodingProblems(topic, difficulty, 'JavaScript', count);
      return res.json({ questions });
    }

  } catch (error) {
    console.error('Error generating coding questions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Helper function to generate default stdin for additional test cases
function generateDefaultStdin(problem, index) {
  // Generate varied test cases based on problem type
  const baseInputs = [
    '5\n1 2 3 4 5\n10',
    '3\n-1 0 1\n0',
    '7\n10 20 30 40 50 60 70\n100',
    '4\n5 5 5 5\n10',
    '6\n-5 -4 -3 -2 -1 0\n-5',
    '8\n100 200 300 400 500 600 700 800\n900',
    '2\n1 1\n2',
    '10\n1 1 1 1 1 1 1 1 1 1\n5'
  ];
  
  return baseInputs[index % baseInputs.length];
}

// Helper function to generate default expected output
function generateDefaultOutput(problem, index) {
  // Generate varied outputs
  const baseOutputs = ['0 1', '1 2', '-1', '0', '5', '10', 'true', 'false'];
  return baseOutputs[index % baseOutputs.length];
}

// @desc    Execute code submission using mock execution - TESTING MODE
const executeCodingSubmission = async (req, res) => {
  try {
    const { code, language, testCases, problemDescription, testMode } = req.body;

    if (!code || !language || !testCases || !problemDescription) {
      return res.status(400).json({ message: 'All fields are required: code, language, testCases, problemDescription' });
    }

    const mode = testMode || 'submit'; // Default to full submission

    // ✅ TESTING MODE: Use mock execution with realistic delays
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // 1-2s delay

    const mockResults = createMockExecutionResults(code, testCases, language, mode);

    return res.json({ results: mockResults });

  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Create mock execution results based on code analysis
 */
function createMockResults(code, testCases, language, testMode = 'submit') {
  const hasReturn = code.includes('return');
  const hasLoop = code.includes('for') || code.includes('while');
  const hasCondition = code.includes('if');
  const hasDataStructure = code.includes('Map') || code.includes('Set') || code.includes('dict') || code.includes('{}');

  // Score the code quality
  let qualityScore = 0;
  if (hasReturn) qualityScore += 30;
  if (hasLoop) qualityScore += 25;
  if (hasCondition) qualityScore += 20;
  if (hasDataStructure) qualityScore += 25;

  // Adjust difficulty based on test mode
  let difficultyMultiplier = 1;
  if (testMode === 'public') {
    difficultyMultiplier = 0.7; // Public tests are easier
  } else if (testMode === 'custom') {
    difficultyMultiplier = 0.8; // Custom tests are moderately easier
  }

  return testCases.map((tc, index) => {
    // First test case more likely to pass if code looks reasonable
    const baseThreshold = testMode === 'public' ? 40 : 70;
    const passThreshold = (baseThreshold + (index * 5)) * difficultyMultiplier;
    const shouldPass = qualityScore >= passThreshold;

    if (!hasReturn) {
      return {
        testCaseIndex: index,
        status: "Error",
        errorDetail: "Function must return a value",
        isHidden: tc.isHidden
      };
    }

    return {
      testCaseIndex: index,
      status: shouldPass ? "Passed" : "Failed",
      actualOutput: shouldPass ? tc.expectedOutput : "incorrect_output",
      errorDetail: shouldPass ? null : "Check algorithm logic and edge cases",
      isHidden: tc.isHidden
    };
  });
}

/**
 * Generate fallback questions when AI is unavailable
 */
function generateFallbackQuestions(topic, difficulty, language, count) {
  console.log(`Generating ${count} fallback questions for ${topic}`);

  const getStarterCode = (lang, functionName, params) => {
    switch (lang) {
      case 'JavaScript':
        return `function ${functionName}(${params}) {\n    // Your code here\n    \n}`;
      case 'Python':
        return `def ${functionName}(${params}):\n    # Your code here\n    pass`;
      case 'Java':
        return `public class Solution {\n    public ReturnType ${functionName}(${params}) {\n        // Your code here\n        \n    }\n}`;
      case 'C++':
        return `class Solution {\npublic:\n    ReturnType ${functionName}(${params}) {\n        // Your code here\n        \n    }\n};`;
      default:
        return '// Your code here';
    }
  };

  const fallbackProblems = {
    'Arrays': [
      {
        title: 'Two Sum',
        functionName: 'twoSum',
        params: 'nums, target',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
        constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' }
        ],
        testCases: [
          { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
          { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
          { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true }
        ]
      },
      {
        title: 'Find Missing Number',
        functionName: 'findMissingNumber',
        params: 'nums',
        description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.`,
        constraints: ['n == nums.length', '1 ≤ n ≤ 10⁴'],
        examples: [
          { input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3, so 2 is missing' }
        ],
        testCases: [
          { input: '[3,0,1]', expectedOutput: '2', isHidden: false },
          { input: '[0,1]', expectedOutput: '2', isHidden: false },
          { input: '[9,6,4,2,3,5,7,0,1]', expectedOutput: '8', isHidden: true }
        ]
      },
      {
        title: 'Remove Duplicates',
        functionName: 'removeDuplicates',
        params: 'nums',
        description: `Given a sorted array nums, remove the duplicates in-place such that each element appears only once and returns the new length.`,
        constraints: ['1 ≤ nums.length ≤ 3 * 10⁴', '-100 ≤ nums[i] ≤ 100'],
        examples: [
          { input: 'nums = [1,1,2]', output: '2', explanation: 'First two elements are 1 and 2' }
        ],
        testCases: [
          { input: '[1,1,2]', expectedOutput: '2', isHidden: false },
          { input: '[0,0,1,1,1,2,2,3,3,4]', expectedOutput: '5', isHidden: false },
          { input: '[1,2,3]', expectedOutput: '3', isHidden: true }
        ]
      }
    ]
  };

  const problems = [];
  const topicProblems = fallbackProblems[topic] || fallbackProblems['Arrays'];

  for (let i = 0; i < count; i++) {
    const template = topicProblems[i % topicProblems.length];
    problems.push({
      id: i + 1,
      title: template.title,
      description: template.description,
      constraints: template.constraints,
      examples: template.examples,
      starterCode: getStarterCode(language, template.functionName, template.params),
      testCases: template.testCases
    });
  }

  return problems;
}

// @desc    Analyze coding performance using Gemini AI
analyzePerformance = async (req, res) => {
  try {
    const {
      sessionDuration,
      totalAttempts,
      questions,
      attempts,
      language,
      userCodes
    } = req.body;

    if (!sessionDuration || !questions || !language) {
      return res.status(400).json({ message: 'Missing required fields for performance analysis' });
    }

    const userId = req.user._id;

    // Generate unique session ID based on timestamp
    const sessionId = `session_${Date.now()}_${userId}`;

    console.log(`[PERFORMANCE] Starting analysis for session ${sessionId} with ${questions.length} questions`);

    // Import models
    const CodeSubmission = require('../models/CodeSubmission');
    const QuestionAnalysis = require('../models/QuestionAnalysis');
    const { analyzeCodeSubmission, suggestApproachForQuestion } = require('../services/geminiService');

    // Step 1: Fetch latest submission for each question using aggregation
    const questionIds = questions.map(q => q.id.toString());

    const latestSubmissions = await CodeSubmission.aggregate([
      {
        $match: {
          user: userId,
          questionId: { $in: questionIds }
        }
      },
      {
        $sort: { submittedAt: -1 }
      },
      {
        $group: {
          _id: "$questionId",
          latestSubmission: { $first: "$$ROOT" }
        }
      }
    ]);

    console.log(`[PERFORMANCE] Found ${latestSubmissions.length} submissions out of ${questions.length} questions`);

    // Create a map of questionId to submission for quick lookup
    const submissionMap = {};
    latestSubmissions.forEach(item => {
      submissionMap[item._id] = item.latestSubmission;
    });

    // Step 2: Analyze ALL questions (both attempted and unattempted)
    const analysisPromises = questions.map(async (question) => {
      const submission = submissionMap[question.id.toString()];

      if (submission) {
        // Question was attempted - analyze the submission
        try {
          console.log(`[PERFORMANCE] Analyzing submitted code for question ${question.id}: ${question.title}`);

          // Call Gemini AI to analyze the code
          const aiAnalysis = await analyzeCodeSubmission({
            code: submission.code,
            language: submission.language,
            questionTitle: submission.questionTitle,
            difficulty: submission.difficulty
          });

          // Store analysis in database
          const questionAnalysis = new QuestionAnalysis({
            user: userId,
            sessionId: sessionId,
            questionId: submission.questionId,
            questionTitle: submission.questionTitle,
            submissionId: submission._id,
            code: submission.code,
            language: submission.language,
            approach: aiAnalysis.approach,
            timeComplexity: aiAnalysis.timeComplexity || '',
            betterApproach: aiAnalysis.betterApproach || '',
            feedback: aiAnalysis.feedback,
            rating: aiAnalysis.rating
          });

          await questionAnalysis.save();

          console.log(`[PERFORMANCE] Saved analysis for question ${submission.questionId} with rating ${aiAnalysis.rating}/10`);

          return {
            questionId: submission.questionId,
            questionTitle: submission.questionTitle,
            attempted: true,
            userApproach: aiAnalysis.approach,
            timeComplexity: aiAnalysis.timeComplexity,
            betterApproaches: aiAnalysis.betterApproach ? [aiAnalysis.betterApproach] : [],
            rating: aiAnalysis.rating,
            feedback: aiAnalysis.feedback
          };
        } catch (error) {
          console.error(`[PERFORMANCE] Failed to analyze question ${question.id}:`, error.message);

          // Return fallback analysis for attempted question
          return {
            questionId: question.id.toString(),
            questionTitle: question.title,
            attempted: true,
            userApproach: "Unable to analyze approach",
            timeComplexity: "N/A",
            betterApproaches: [],
            rating: 5,
            feedback: "Analysis failed. Please try again."
          };
        }
      } else {
        // Question was NOT attempted - provide suggested approach
        try {
          console.log(`[PERFORMANCE] Question ${question.id} was not attempted. Generating suggested approach.`);

          // Call Gemini AI to suggest an approach for the unattempted question
          const suggestedApproach = await suggestApproachForQuestion({
            questionTitle: question.title,
            questionDescription: question.description || '',
            difficulty: question.difficulty || 'Medium',
            topic: question.topic || 'General',
            language: language
          });

          // Store unattempted analysis in database
          const questionAnalysis = new QuestionAnalysis({
            user: userId,
            sessionId: sessionId,
            questionId: question.id.toString(),
            questionTitle: question.title,
            submissionId: null, // No submission for unattempted questions
            code: '', // No code submitted
            language: language,
            approach: 'Not attempted',
            timeComplexity: suggestedApproach.timeComplexity || 'N/A',
            betterApproach: suggestedApproach.recommendedApproach || '',
            feedback: `You did not attempt this question. ${suggestedApproach.guidance || ''} ${suggestedApproach.feedback || ''}`,
            rating: 0 // 0 rating for unattempted questions
          });

          await questionAnalysis.save();

          console.log(`[PERFORMANCE] Saved unattempted analysis for question ${question.id}`);

          return {
            questionId: question.id.toString(),
            questionTitle: question.title,
            attempted: false,
            userApproach: "Not attempted",
            timeComplexity: suggestedApproach.timeComplexity || "N/A",
            betterApproaches: suggestedApproach.recommendedApproach ? [suggestedApproach.recommendedApproach] : [],
            rating: 0,
            feedback: `You did not attempt this question. ${suggestedApproach.guidance || ''} ${suggestedApproach.feedback || ''}`
          };
        } catch (error) {
          console.error(`[PERFORMANCE] Failed to generate suggestion for unattempted question ${question.id}:`, error.message);

          // Return fallback for unattempted question
          return {
            questionId: question.id.toString(),
            questionTitle: question.title,
            attempted: false,
            userApproach: "Not attempted",
            timeComplexity: "N/A",
            betterApproaches: [],
            rating: 0,
            feedback: "You did not attempt this question. Consider reviewing the problem statement and trying different approaches."
          };
        }
      }
    });

    const questionAnalysis = await Promise.all(analysisPromises);

    // Calculate overall metrics (only for attempted questions)
    const attemptedQuestions = questionAnalysis.filter(qa => qa.attempted);
    const totalTests = attempts?.reduce((sum, attempt) => sum + attempt.results.length, 0) || 0;
    const passedTests = attempts?.reduce((sum, attempt) =>
      sum + attempt.results.filter(r => r.status === "Passed").length, 0
    ) || 0;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgRating = attemptedQuestions.length > 0
      ? attemptedQuestions.reduce((sum, qa) => sum + qa.rating, 0) / attemptedQuestions.length
      : 0;

    // Build comprehensive analysis response
    const analysis = {
      sessionId: sessionId,
      overallRating: Math.round(avgRating),
      strengths: generateStrengths(questionAnalysis, successRate),
      improvements: generateImprovements(questionAnalysis, successRate),
      codeQuality: {
        readability: Math.round(avgRating * 0.8),
        efficiency: Math.round(avgRating * 0.7),
        correctness: Math.round((successRate / 10))
      },
      recommendations: generateRecommendations(questionAnalysis, language),
      summary: `You attempted ${attemptedQuestions.length} out of ${questions.length} problem(s)${attemptedQuestions.length > 0 ? ` with an average rating of ${avgRating.toFixed(1)}/10` : ''}. ${successRate > 0 ? `Test success rate: ${successRate.toFixed(1)}%.` : ''} ${attemptedQuestions.length < questions.length ? `${questions.length - attemptedQuestions.length} question(s) were not attempted.` : ''} Keep practicing to improve your problem-solving skills!`,
      questionAnalysis: questionAnalysis,
      // Session metadata for display
      sessionMetadata: {
        duration: Math.round(sessionDuration / 60000), // Convert to minutes
        language: language,
        difficulty: questions[0]?.difficulty || 'Medium',
        topic: questions[0]?.topic || 'General',
        totalQuestions: questions.length,
        attemptedQuestions: attemptedQuestions.length,
        totalSubmissions: totalAttempts,
        totalTests: totalTests,
        passedTests: passedTests,
        successRate: Math.round(successRate)
      }
    };

    console.log(`[PERFORMANCE] Analysis completed successfully. Overall rating: ${analysis.overallRating}/10, Attempted: ${attemptedQuestions.length}/${questions.length}`);
    return res.json({ analysis });

  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// Helper function to generate strengths based on analysis
function generateStrengths(questionAnalysis, successRate) {
  const strengths = [];
  
  const attemptedQuestions = questionAnalysis.filter(qa => qa.attempted !== false);
  const highRatings = questionAnalysis.filter(qa => qa.rating >= 8).length;
  
  if (highRatings > 0) {
    strengths.push(`Strong performance on ${highRatings} problem(s) with ratings 8+/10`);
  }
  
  if (successRate >= 80) {
    strengths.push("Excellent test case pass rate - shows strong attention to edge cases");
  } else if (successRate >= 60) {
    strengths.push("Good test case coverage - demonstrates solid problem-solving");
  }
  
  if (attemptedQuestions.length > 0) {
    strengths.push(`Attempted ${attemptedQuestions.length} out of ${questionAnalysis.length} problem(s)`);
  }
  
  // Analyze code quality from ratings
  const avgRating = attemptedQuestions.length > 0
    ? attemptedQuestions.reduce((sum, qa) => sum + qa.rating, 0) / attemptedQuestions.length
    : 0;
  
  if (avgRating >= 7) {
    strengths.push("Consistent code quality across problems");
  }
  
  if (strengths.length === 0) {
    strengths.push("Completed the coding session");
  }
  
  return strengths;
}

// Helper function to generate improvements based on analysis
function generateImprovements(questionAnalysis, successRate) {
  const improvements = [];
  
  const unattemptedCount = questionAnalysis.filter(qa => qa.attempted === false).length;
  if (unattemptedCount > 0) {
    improvements.push(`${unattemptedCount} problem(s) not attempted - try to attempt all questions`);
  }
  
  const lowRatings = questionAnalysis.filter(qa => qa.attempted !== false && qa.rating < 6).length;
  if (lowRatings > 0) {
    improvements.push(`${lowRatings} problem(s) need improvement (rating below 6/10)`);
  }
  
  const hasBetterApproaches = questionAnalysis.filter(qa => 
    qa.attempted !== false && 
    qa.betterApproaches.length > 0 && 
    !qa.betterApproaches[0].toLowerCase().includes('optimal')
  ).length;
  
  if (hasBetterApproaches > 0) {
    improvements.push("Consider more optimal approaches for better time/space complexity");
  }
  
  if (successRate < 60 && successRate > 0) {
    improvements.push("Focus on test case coverage and edge cases");
  }
  
  if (improvements.length === 0) {
    improvements.push("Continue practicing to maintain your skill level");
  }
  
  return improvements;
}

// Helper function to generate language-specific recommendations
function generateRecommendations(questionAnalysis, language) {
  const recommendations = [];
  
  const unattemptedCount = questionAnalysis.filter(qa => qa.attempted === false).length;
  const attemptedCount = questionAnalysis.filter(qa => qa.attempted !== false).length;
  const lowRatings = questionAnalysis.filter(qa => qa.attempted !== false && qa.rating < 6).length;
  
  // Language-specific practice recommendation
  if (attemptedCount > 0) {
    recommendations.push(`Practice more ${language} coding problems to improve fluency and syntax mastery`);
  }
  
  // Review better approaches
  const hasBetterApproaches = questionAnalysis.filter(qa => 
    qa.attempted !== false && 
    qa.betterApproaches.length > 0 && 
    !qa.betterApproaches[0].toLowerCase().includes('optimal')
  ).length;
  
  if (hasBetterApproaches > 0) {
    recommendations.push("Review the better approaches suggested for each problem to learn optimization techniques");
  }
  
  // Unattempted questions
  if (unattemptedCount > 0) {
    recommendations.push("Review the suggested approaches for unattempted questions to expand your problem-solving toolkit");
  }
  
  // Time and space complexity
  if (lowRatings > 0 || hasBetterApproaches > 0) {
    recommendations.push("Focus on time and space complexity optimization - analyze Big O notation for your solutions");
  }
  
  // Language-specific resources
  const languageResources = {
    'JavaScript': 'Study JavaScript-specific patterns like array methods (map, filter, reduce) and ES6+ features',
    'Python': 'Explore Python built-in functions, list comprehensions, and standard library modules',
    'Java': 'Master Java Collections Framework, streams API, and object-oriented design patterns',
    'C++': 'Focus on STL containers, algorithms, and memory management best practices',
    'C': 'Practice pointer manipulation, memory management, and efficient algorithm implementation',
    'C#': 'Learn LINQ, async/await patterns, and .NET framework utilities',
    'Ruby': 'Explore Ruby enumerable methods, blocks, and idiomatic Ruby patterns',
    'Go': 'Study Go concurrency patterns, interfaces, and standard library packages',
    'Rust': 'Master ownership, borrowing, and Rust\'s memory safety features',
    'PHP': 'Learn PHP array functions, modern PHP features, and best practices',
    'TypeScript': 'Leverage TypeScript type system, generics, and advanced type features',
    'Kotlin': 'Explore Kotlin extension functions, coroutines, and functional programming features',
    'R': 'Study R vectorization, data manipulation with dplyr, and statistical functions'
  };
  
  if (languageResources[language]) {
    recommendations.push(languageResources[language]);
  }
  
  // General recommendation
  recommendations.push("Solve problems daily to build consistency and improve pattern recognition");
  
  return recommendations.slice(0, 5); // Limit to 5 recommendations
};

module.exports = {
  generateCodingQuestions,
  executeCodingSubmission,
  analyzePerformance,
};