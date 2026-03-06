/**
 * Code Execution Controller
 * Handles code execution using Judge0 API for all programming languages
 * Supports JavaScript, Python, Java, C++, C, and more
 */

const { executeCode } = require('../services/judge0Service');
const { languageMap } = require('../utils/languageMap');
const { compareOutput } = require('../utils/outputComparator');

/**
 * Wrap user code with proper class structure for languages that require it
 * @param {string} code - User's code
 * @param {string} language - Programming language
 * @returns {string} - Wrapped code ready for execution
 */
const wrapCodeForExecution = (code, language) => {
  const lang = language.toLowerCase();
  
  // Java: Wrap in Main class if not already present
  if (lang === 'java') {
    // Check if code already has a public class Main
    if (code.includes('public class Main') || code.includes('class Main')) {
      return code;
    }
    
    // Check if code has any other public class definition
    const hasPublicClass = /public\s+class\s+\w+/.test(code);
    
    if (hasPublicClass) {
      // Replace the class name with Main
      return code.replace(/public\s+class\s+(\w+)/, 'public class Main');
    }
    
    // If no class definition, wrap the code in Main class
    // This handles cases where user writes only methods
    return `import java.util.*;

public class Main {
${code}
}`;
  }
  
  // C#: Wrap in Main class if not already present
  if (lang === 'c#' || lang === 'csharp' || lang === 'cs') {
    // Check if code already has a class Main or Program
    if (code.includes('class Main') || code.includes('class Program')) {
      return code;
    }
    
    // Check if code has any other class definition
    const hasClass = /class\s+\w+/.test(code);
    
    if (hasClass) {
      // Replace the class name with Program (C# convention)
      return code.replace(/class\s+(\w+)/, 'class Program');
    }
    
    // If no class definition, wrap the code in Program class
    return `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
${code}
}`;
  }
  
  // C++: Wrap in main function if not present (optional, for future use)
  if (lang === 'c++' || lang === 'cpp') {
    if (code.includes('int main(')) {
      return code;
    }
    // For now, return as-is. Can add wrapping logic if needed.
    return code;
  }
  
  // Python, JavaScript, Ruby, Go, Rust, PHP, TypeScript, Kotlin, R: No wrapping needed
  return code;
};

/**
 * Run code against public test cases
 * POST /api/code/run
 */
const runCode = async (req, res) => {
  try {
    // Extract required fields from request body
    const { code, language, testCases } = req.body;
    
    // Validate that all required fields are present
    if (!code || !language || !testCases) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Convert language name to Judge0 language ID
    const languageId = languageMap[language.toLowerCase()];
    
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }
    
    // Wrap code with proper structure for languages that need it
    const wrappedCode = wrapCodeForExecution(code, language);
    
    console.log(`[CODE_EXEC] Running code with language: ${language} (ID: ${languageId})`);
    
    // Initialize results array
    const results = [];
    
    // Iterate through each test case sequentially
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // Step 1: Extract stdin directly from test case
        const stdin = testCase.stdin || testCase.input || '';
        
        // Step 2: Execute code using Judge0 API
        const executionResult = await executeCode(languageId, wrappedCode, stdin);
        
        // Step 3: Extract stdout, stderr, and compile_output from Judge0 response
        const stdout = executionResult.stdout || '';
        const stderr = executionResult.stderr || '';
        const compileOutput = executionResult.compile_output || '';
        const status = executionResult.status || {};
        
        // Step 4: Compare stdout with expected output
        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput || testCase.expected_output || '';
        
        // For custom input mode (no expected output), skip comparison
        const isCustomMode = !expectedOutput || expectedOutput === 'null';
        const outputsMatch = isCustomMode ? true : compareOutput(actualOutput, expectedOutput);
        
        // Step 5: Determine if test passed (status.id === 3 means "Accepted" in Judge0)
        const isAccepted = status.id === 3;
        const passed = isAccepted && outputsMatch;
        
        // Step 6: Capture error messages for failed tests
        let error = null;
        if (compileOutput) {
          error = `Compilation Error: ${compileOutput}`;
        } else if (stderr) {
          error = `Runtime Error: ${stderr}`;
        } else if (!outputsMatch && isAccepted && !isCustomMode) {
          error = 'Output does not match expected result';
        } else if (!isAccepted) {
          error = `Execution Error: ${status.description || 'Unknown error'}`;
        }
        
        // Step 7: Build result object for this test case
        results.push({
          testCaseIndex: i,
          passed: passed,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput || null,
          error: error,
          executionTime: executionResult.time || 0,
          input: testCase.input || stdin,
          isHidden: testCase.isHidden || false
        });
      } catch (error) {
        // Capture error message and mark test as failed
        console.error('[CODE_EXEC] Test execution error:', error);
        results.push({
          testCaseIndex: i,
          passed: false,
          expectedOutput: testCase.expectedOutput || testCase.expected_output || '',
          actualOutput: null,
          error: error.message || 'Test execution failed',
          executionTime: 0,
          input: testCase.input || '',
          isHidden: testCase.isHidden || false
        });
      }
    }
    
    // Calculate summary statistics
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    // Step 8: Return structured response
    return res.status(200).json({
      success: true,
      results: results,
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        score: score
      }
    });
  } catch (error) {
    console.error('[CODE_EXEC] Error in runCode:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: error.message
    });
  }
};

/**
 * Submit code against all test cases (public + private)
 * POST /api/code/submit
 */
const submitCode = async (req, res) => {
  try {
    // Extract required fields from request body
    const { code, language, testCases, userId, problemId } = req.body;
    
    // Validate that all required fields are present
    if (!code || !language || !testCases) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Convert language name to Judge0 language ID
    const languageId = languageMap[language.toLowerCase()];
    
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }
    
    // Log submission for future tracking
    console.log('[CODE_EXEC] Code submission:', {
      userId: userId || 'anonymous',
      problemId: problemId || 'unknown',
      language,
      languageId,
      testCount: testCases.length
    });
    
    // Wrap code with proper structure for languages that need it
    const wrappedCode = wrapCodeForExecution(code, language);
    
    // Initialize results array
    const results = [];
    
    // Iterate through each test case sequentially (public + private)
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        // Step 1: Extract stdin directly from test case
        const stdin = testCase.stdin || testCase.input || '';
        
        // Step 2: Execute code using Judge0 API
        const executionResult = await executeCode(languageId, wrappedCode, stdin);
        
        // Step 3: Extract stdout, stderr, and compile_output from Judge0 response
        const stdout = executionResult.stdout || '';
        const stderr = executionResult.stderr || '';
        const compileOutput = executionResult.compile_output || '';
        const status = executionResult.status || {};
        
        // Step 4: Compare stdout with expected output
        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput || testCase.expected_output || '';
        
        // For custom input mode (no expected output), skip comparison
        const isCustomMode = !expectedOutput || expectedOutput === 'null';
        const outputsMatch = isCustomMode ? true : compareOutput(actualOutput, expectedOutput);
        
        // Step 5: Determine if test passed (status.id === 3 means "Accepted" in Judge0)
        const isAccepted = status.id === 3;
        const passed = isAccepted && outputsMatch;
        
        // Step 6: Capture error messages for failed tests
        let error = null;
        if (compileOutput) {
          error = `Compilation Error: ${compileOutput}`;
        } else if (stderr) {
          error = `Runtime Error: ${stderr}`;
        } else if (!outputsMatch && isAccepted && !isCustomMode) {
          error = 'Output does not match expected result';
        } else if (!isAccepted) {
          error = `Execution Error: ${status.description || 'Unknown error'}`;
        }
        
        // Step 7: Build result object for this test case
        results.push({
          testCaseIndex: i,
          passed: passed,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput || null,
          error: error,
          executionTime: executionResult.time || 0,
          input: testCase.input || stdin,
          isHidden: testCase.isHidden || false
        });
      } catch (error) {
        // Capture error and mark test as failed
        console.error('[CODE_EXEC] Test execution error:', error);
        results.push({
          testCaseIndex: i,
          passed: false,
          expectedOutput: testCase.expectedOutput || testCase.expected_output || '',
          actualOutput: null,
          error: error.message || 'Test execution failed',
          executionTime: 0,
          input: testCase.input || '',
          isHidden: testCase.isHidden || false
        });
      }
    }
    
    // Calculate summary statistics
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    // Step 8: Return structured response
    return res.status(200).json({
      success: true,
      results: results,
      summary: {
        total: total,
        passed: passed,
        failed: failed,
        score: score
      },
      message: 'Code submitted successfully'
    });
  } catch (error) {
    console.error('[CODE_EXEC] Error in submitCode:', error);
    res.status(500).json({
      success: false,
      message: 'Code submission failed',
      error: error.message
    });
  }
};

/**
 * Get supported programming languages
 * GET /api/code/languages
 */
const getSupportedLanguages = async (req, res) => {
  try {
    console.log('[CODE_EXEC] Fetching supported languages');
    
    // Return commonly used languages for the UI
    const commonLanguages = [
      { language: 'javascript', version: 'Latest', alias: 'JavaScript' },
      { language: 'python', version: 'Latest', alias: 'Python' },
      { language: 'java', version: 'Latest', alias: 'Java' },
      { language: 'c++', version: 'Latest', alias: 'C++' },
      { language: 'c', version: 'Latest', alias: 'C' }
    ];
    
    console.log('[CODE_EXEC] Successfully fetched', commonLanguages.length, 'languages');
    
    // Return list of supported languages and versions
    res.status(200).json({
      success: true,
      languages: commonLanguages
    });
  } catch (error) {
    console.error('[CODE_EXEC] Error fetching supported languages:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported languages'
    });
  }
};

module.exports = {
  runCode,
  submitCode,
  getSupportedLanguages
};
