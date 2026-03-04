/**
 * Judge0 Service
 * Code execution service using Judge0 Community API
 * Supports multiple programming languages via Judge0's language IDs
 */

const axios = require('axios');

// Judge0 Community API endpoint
const JUDGE0_API_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

/**
 * Execute code using Judge0 API
 * @param {number} languageId - Judge0 language ID (e.g., 63 for JavaScript, 71 for Python)
 * @param {string} sourceCode - Complete user code
 * @param {string} stdin - Input data as string
 * @returns {Promise<Object>} - Execution result with stdout, stderr, compile_output, status
 */
async function executeCode(languageId, sourceCode, stdin = '') {
  try {
    console.log(`[JUDGE0] Executing code with language ID ${languageId}`);
    
    // Prepare request payload
    const payload = {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin
    };
    
    // Make POST request to Judge0 API
    const response = await axios.post(JUDGE0_API_URL, payload, {
      timeout: 30000, // 30 second timeout for the HTTP request
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Extract execution results from response
    const result = response.data;
    
    console.log(`[JUDGE0] Execution completed with status: ${result.status?.description || 'Unknown'}`);
    
    // Return the complete Judge0 response
    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      status: result.status || {},
      time: result.time || null,
      memory: result.memory || null,
      token: result.token || null
    };
  } catch (error) {
    console.error('[JUDGE0] API error:', error.response?.data || error.message);
    
    // Handle different error scenarios
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        stdout: '',
        stderr: 'Execution timeout: The request took too long to complete',
        compile_output: '',
        status: { id: 13, description: 'Time Limit Exceeded' },
        time: null,
        memory: null,
        token: null
      };
    }
    
    if (error.response?.status === 401) {
      return {
        stdout: '',
        stderr: 'Judge0 API authentication failed. Please check your API configuration.',
        compile_output: '',
        status: { id: 14, description: 'Authentication Error' },
        time: null,
        memory: null,
        token: null
      };
    }
    
    if (error.response?.status === 429) {
      return {
        stdout: '',
        stderr: 'Rate limit exceeded. Please try again later.',
        compile_output: '',
        status: { id: 14, description: 'Rate Limit Exceeded' },
        time: null,
        memory: null,
        token: null
      };
    }
    
    if (error.response?.status === 422) {
      return {
        stdout: '',
        stderr: 'Invalid request: ' + (error.response?.data?.message || 'Check language ID and source code'),
        compile_output: '',
        status: { id: 14, description: 'Invalid Request' },
        time: null,
        memory: null,
        token: null
      };
    }
    
    // Generic error
    return {
      stdout: '',
      stderr: `Code execution failed: ${error.message || 'Unknown error'}`,
      compile_output: '',
      status: { id: 14, description: 'System Error' },
      time: null,
      memory: null,
      token: null
    };
  }
}

/**
 * Judge0 Language ID mapping
 * Common languages supported by Judge0
 */
const LANGUAGE_IDS = {
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'python': 71,      // Python (3.8.1)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'c++': 54,         // C++ (GCC 9.2.0)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'c': 50,           // C (GCC 9.2.0)
  'csharp': 51,      // C# (Mono 6.6.0.161)
  'ruby': 72,        // Ruby (2.7.0)
  'go': 60,          // Go (1.13.5)
  'rust': 73,        // Rust (1.40.0)
  'php': 68,         // PHP (7.4.1)
  'typescript': 74   // TypeScript (3.7.4)
};

/**
 * Get Judge0 language ID from language name
 * @param {string} language - Language name (e.g., 'javascript', 'python')
 * @returns {number} - Judge0 language ID
 */
function getLanguageId(language) {
  const normalizedLanguage = language.toLowerCase();
  return LANGUAGE_IDS[normalizedLanguage] || LANGUAGE_IDS['javascript'];
}

module.exports = {
  executeCode,
  getLanguageId,
  LANGUAGE_IDS
};
