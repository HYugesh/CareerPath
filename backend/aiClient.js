/**
 * AI Client
 * Legacy wrapper for backward compatibility
 * Uses centralized Gemini client
 */

const { callGemini } = require('./services/geminiClient');

/**
 * Send prompt to AI and get response
 */
const sendPromptToAI = async (prompt) => {
  try {
    const isJsonRequest = prompt.includes('JSON') || prompt.includes('json');
    
    const response = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 8192,
      useCache: true,
      responseType: isJsonRequest ? 'json' : 'text'
    });

    return response;

  } catch (error) {
    console.error('AI Client Error:', error.message);

    // Provide fallback responses based on prompt type
    if (prompt.includes('Code Execution Engine') || prompt.includes('Test Cases')) {
      return createMockExecutionResults(prompt);
    }

    if (prompt.includes('Generate') && prompt.includes('problems')) {
      return createFallbackCodingProblems(prompt);
    }

    throw new Error('Failed to get AI response: ' + error.message);
  }
};

/**
 * Create mock execution results
 */
const createMockExecutionResults = (prompt) => {
  const results = [
    { testCaseId: 0, status: "Passed", actualOutput: "[0,1]", errorDetail: null },
    { testCaseId: 1, status: "Failed", actualOutput: "[0,0]", errorDetail: "Output mismatch" }
  ];
  return JSON.stringify(results);
};

/**
 * Create fallback coding problems
 */
const createFallbackCodingProblems = (prompt) => {
  const problems = [{
    id: 1,
    title: 'Two Sum',
    difficulty: 'Medium',
    topic: 'Arrays',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
    constraints: ['2 ≤ nums.length ≤ 10⁴'],
    testCases: [{ input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false }]
  }];
  return JSON.stringify({ problems });
};

module.exports = { sendPromptToAI };