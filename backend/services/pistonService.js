/**
 * Piston Service
 * Unified code execution service using Piston API for all programming languages
 * Supports JavaScript, Python, Java, C++, C, and more
 */

const axios = require('axios');

// Piston API endpoint - using public API
// For production, consider running a local Piston instance:
// docker run -d --name piston -p 2000:2000 ghcr.io/engineer-man/piston:latest
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API
const LANGUAGE_MAP = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'cpp': 'c++',
  'c++': 'c++',
  'c': 'c'
};

/**
 * Execute code using Piston API
 * @param {string} language - Programming language (javascript, python, java, cpp, c)
 * @param {string} code - Complete user code
 * @param {string} stdin - Input data as string
 * @returns {Promise<Object>} - Execution result with stdout, stderr, code, executionTime
 */
async function executeCode(language, code, stdin = '') {
  try {
    // Map language to Piston API language identifier
    const pistonLanguage = LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();
    
    // Prepare request payload
    const payload = {
      language: pistonLanguage,
      version: '*', // Use latest version
      files: [
        {
          name: 'Main',
          content: code
        }
      ],
      stdin: stdin || '',
      args: [],
      compile_timeout: 10000, // 10 seconds for compilation
      run_timeout: 3000, // 3 seconds for execution
      compile_memory_limit: -1, // No limit
      run_memory_limit: -1 // No limit
    };
    
    console.log(`[PISTON] Executing ${pistonLanguage} code via Piston API`);
    
    // Make POST request to Piston API
    const response = await axios.post(`${PISTON_API_URL}/execute`, payload, {
      timeout: 15000, // 15 second total timeout for the HTTP request
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Extract execution results from response
    const { run, compile } = response.data;
    
    // Combine compile and run stderr if compilation failed
    const stderr = compile?.stderr || run?.stderr || '';
    const stdout = run?.stdout || '';
    const exitCode = run?.code !== undefined ? run.code : (compile?.code || 1);
    
    console.log(`[PISTON] Execution completed with exit code ${exitCode}`);
    
    return {
      stdout: stdout,
      stderr: stderr,
      code: exitCode, // Exit code (0 = success)
      signal: run?.signal || null,
      output: stdout,
      executionTime: run?.executionTime || 0
    };
  } catch (error) {
    console.error('[PISTON] API error:', error.response?.data || error.message);
    
    // Handle different error scenarios
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        stdout: '',
        stderr: 'Execution timeout: The code took too long to execute',
        code: 1,
        signal: 'TIMEOUT',
        output: '',
        executionTime: 0
      };
    }
    
    if (error.response?.status === 401) {
      return {
        stdout: '',
        stderr: 'Piston API authentication failed. Please check your API configuration.',
        code: 1,
        signal: null,
        output: '',
        executionTime: 0
      };
    }
    
    if (error.response?.status === 429) {
      return {
        stdout: '',
        stderr: 'Rate limit exceeded. Please try again later or use a local Piston instance.',
        code: 1,
        signal: null,
        output: '',
        executionTime: 0
      };
    }
    
    // Generic error
    return {
      stdout: '',
      stderr: `Code execution failed: ${error.message || 'Unknown error'}`,
      code: 1,
      signal: null,
      output: '',
      executionTime: 0
    };
  }
}

/**
 * Get list of supported languages from Piston API
 * @returns {Promise<Array>} - List of supported languages with versions
 */
async function getSupportedLanguages() {
  try {
    console.log('[PISTON] Fetching supported languages from Piston API');
    
    const response = await axios.get(`${PISTON_API_URL}/runtimes`, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('[PISTON] Failed to fetch supported languages:', error.message);
    
    // Return hardcoded fallback list
    return [
      { language: 'javascript', version: '18.15.0', aliases: ['js', 'node-javascript', 'node-js'] },
      { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
      { language: 'java', version: '15.0.2', aliases: [] },
      { language: 'c++', version: '10.2.0', aliases: ['cpp', 'g++'] },
      { language: 'c', version: '10.2.0', aliases: ['gcc'] }
    ];
  }
}

module.exports = {
  executeCode,
  getSupportedLanguages
};
