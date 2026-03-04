/**
 * Coding Controller - TESTING MODE
 * Handles coding questions generation and code execution using static data
 * ❌ Removed: Gemini AI dependencies
 * ✅ Added: Static problem pools and mock execution
 */

// ❌ TESTING MODE: Removed AI dependency
// const { callGemini } = require('../services/geminiClient');

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
const generateMockPerformanceAnalysis = (sessionDuration, totalAttempts, successRate, language) => {
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
    summary: `You completed ${totalAttempts} coding attempts with a ${Math.round(successRate)}% success rate in ${Math.round(sessionDuration / 60000)} minutes. ${successRate >= 70 ? 'Great job! Keep up the excellent work.' : 'Keep practicing to improve your skills!'}`
  };
};

// @desc    Generate coding questions using static data - TESTING MODE
const generateCodingQuestions = async (req, res) => {
  try {
    const { topic, difficulty, language, count } = req.body;

    if (!topic || !difficulty || !language || !count) {
      return res.status(400).json({ message: 'All fields are required: topic, difficulty, language, count' });
    }

    // ✅ TESTING MODE: Use static problem generation
    const questions = generateStaticCodingProblems(topic, difficulty, language, count);

    return res.json({ questions });

  } catch (error) {
    console.error('Error generating coding questions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

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

// @desc    Analyze coding performance using mock analysis - TESTING MODE
const analyzePerformance = async (req, res) => {
  try {
    const {
      sessionDuration,
      totalAttempts,
      questions,
      attempts,
      language,
      userCodes
    } = req.body;

    if (!sessionDuration || !totalAttempts || !questions || !attempts || !language) {
      return res.status(400).json({ message: 'Missing required fields for performance analysis' });
    }

    // Calculate basic metrics
    const totalTests = attempts.reduce((sum, attempt) => sum + attempt.results.length, 0);
    const passedTests = attempts.reduce((sum, attempt) =>
      sum + attempt.results.filter(r => r.status === "Passed").length, 0
    );
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // ✅ TESTING MODE: Use mock analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay

    const analysis = generateMockPerformanceAnalysis(sessionDuration, totalAttempts, successRate, language);

    return res.json({ analysis });

  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  generateCodingQuestions,
  executeCodingSubmission,
  analyzePerformance,
};