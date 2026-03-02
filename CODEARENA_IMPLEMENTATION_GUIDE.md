# CodeArena Implementation Guide
## Step-by-Step Process for Adding Real Code Execution

---

## 📋 Overview

This guide will help you transform CodeArena from a basic code editor into a fully functional coding platform with:
- Real code execution
- Test case validation
- Submission tracking
- Multi-language support

**Estimated Time:** 4-6 hours
**Difficulty:** Intermediate
**Cost:** $0 (100% Free)

---

## 🎯 Phase 1: Backend Setup (2 hours)

### Step 1.1: Install Dependencies

```bash
cd backend
npm install axios
```

**What this does:** Adds axios for making HTTP requests to Piston API

---

### Step 1.2: Create Code Execution Controller

**File:** `backend/controllers/codeExecutionController.js`

```javascript
const axios = require('axios');

// Piston API endpoint
const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language mapping (Piston uses different names)
const LANGUAGE_MAP = {
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'cpp': 'c++',
  'c': 'c'
};

// Helper: Wrap user code with test case
function wrapCodeWithTest(userCode, testInput, language, functionName) {
  if (language === 'javascript') {
    return `
${userCode}

// Execute test
const result = ${functionName}(${Object.values(testInput).map(v => JSON.stringify(v)).join(', ')});
console.log(JSON.stringify(result));
    `.trim();
  }
  
  if (language === 'python') {
    const args = Object.values(testInput).map(v => JSON.stringify(v)).join(', ');
    return `
${userCode}

# Execute test
result = ${functionName}(${args})
print(result)
    `.trim();
  }
  
  // Add more languages as needed
  return userCode;
}

// Helper: Compare outputs
function compareOutputs(actual, expected) {
  try {
    const actualParsed = JSON.parse(actual);
    return JSON.stringify(actualParsed) === JSON.stringify(expected);
  } catch {
    return actual.trim() === String(expected).trim();
  }
}

// Run code with test cases
exports.runCode = async (req, res) => {
  try {
    const { code, language, testCases, functionName } = req.body;
    
    if (!code || !language || !testCases) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const results = [];
    
    // Execute each test case
    for (const testCase of testCases) {
      const wrappedCode = wrapCodeWithTest(
        code, 
        testCase.input, 
        language, 
        functionName
      );
      
      try {
        // Call Piston API
        const response = await axios.post(`${PISTON_API}/execute`, {
          language: LANGUAGE_MAP[language] || language,
          version: '*',
          files: [{ content: wrappedCode }],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1
        });
        
        const output = response.data.run.stdout.trim();
        const error = response.data.run.stderr;
        const exitCode = response.data.run.code;
        
        // Validate output
        const passed = exitCode === 0 && 
                      !error && 
                      compareOutputs(output, testCase.expectedOutput);
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: output,
          passed: passed,
          error: error || null,
          executionTime: response.data.run.time || 0
        });
        
      } catch (execError) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          passed: false,
          error: execError.message,
          executionTime: 0
        });
      }
    }
    
    const totalPassed = results.filter(r => r.passed).length;
    
    res.json({
      success: true,
      results: results,
      summary: {
        total: results.length,
        passed: totalPassed,
        failed: results.length - totalPassed,
        score: Math.round((totalPassed / results.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Code execution failed',
      error: error.message 
    });
  }
};

// Submit code (includes saving to database)
exports.submitCode = async (req, res) => {
  try {
    const { code, language, problemId, userId, testCases, functionName } = req.body;
    
    // First, run all test cases
    const runResult = await this.runCode(req, res);
    
    // Save submission to database
    // TODO: Add database model and save logic
    
    res.json({
      success: true,
      message: 'Code submitted successfully',
      ...runResult
    });
    
  } catch (error) {
    console.error('Code submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Code submission failed',
      error: error.message 
    });
  }
};

// Get supported languages
exports.getSupportedLanguages = async (req, res) => {
  try {
    const response = await axios.get(`${PISTON_API}/runtimes`);
    res.json({
      success: true,
      languages: response.data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch languages' 
    });
  }
};

module.exports = exports;
```

---

### Step 1.3: Create Routes

**File:** `backend/routes/codeExecutionRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const codeExecutionController = require('../controllers/codeExecutionController');
const protect = require('../middleware/authMiddleware');

// Run code with test cases
router.post('/run', protect, codeExecutionController.runCode);

// Submit code
router.post('/submit', protect, codeExecutionController.submitCode);

// Get supported languages
router.get('/languages', codeExecutionController.getSupportedLanguages);

module.exports = router;
```

---

### Step 1.4: Register Routes in Server

**File:** `backend/server.js`

Add this line with other route imports:
```javascript
const codeExecutionRoutes = require('./routes/codeExecutionRoutes');
```

Add this line with other route registrations:
```javascript
app.use('/api/code', codeExecutionRoutes);
```

---

### Step 1.5: Test Backend API

```bash
# Start backend server
cd backend
npm run dev

# Test with curl or Postman
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "function twoSum(nums, target) { return [0,1]; }",
    "language": "javascript",
    "functionName": "twoSum",
    "testCases": [
      {
        "input": {"nums": [2,7,11,15], "target": 9},
        "expectedOutput": [0,1]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "input": {"nums": [2,7,11,15], "target": 9},
      "expectedOutput": [0,1],
      "actualOutput": "[0,1]",
      "passed": true,
      "error": null,
      "executionTime": 45
    }
  ],
  "summary": {
    "total": 1,
    "passed": 1,
    "failed": 0,
    "score": 100
  }
}
```

---

## 🎨 Phase 2: Frontend Integration (2 hours)

### Step 2.1: Update GeminiCodeArena Component

**File:** `frontend/src/pages/GeminiCodeArena.tsx` (or .jsx if converted)

Add these functions:

```javascript
// Add to component state
const [testResults, setTestResults] = useState(null);
const [isRunning, setIsRunning] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

// Run code function
const handleRunCode = async () => {
  setIsRunning(true);
  setTestResults(null);
  
  try {
    const response = await axios.post('/api/code/run', {
      code: userCode,
      language: selectedLanguage.toLowerCase(),
      functionName: extractFunctionName(userCode),
      testCases: currentProblem.publicTestCases
    });
    
    if (response.data.success) {
      setTestResults(response.data);
      // Show success message
      alert(`Tests Passed: ${response.data.summary.passed}/${response.data.summary.total}`);
    }
  } catch (error) {
    console.error('Run error:', error);
    alert('Failed to run code: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsRunning(false);
  }
};

// Submit code function
const handleSubmitCode = async () => {
  setIsSubmitting(true);
  
  try {
    const allTestCases = [
      ...currentProblem.publicTestCases,
      ...currentProblem.privateTestCases
    ];
    
    const response = await axios.post('/api/code/submit', {
      code: userCode,
      language: selectedLanguage.toLowerCase(),
      functionName: extractFunctionName(userCode),
      problemId: currentProblem.id,
      testCases: allTestCases
    });
    
    if (response.data.success) {
      const score = response.data.summary.score;
      if (score === 100) {
        alert('🎉 All tests passed! Perfect solution!');
      } else {
        alert(`Submitted! Score: ${score}% (${response.data.summary.passed}/${response.data.summary.total} tests passed)`);
      }
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('Failed to submit code: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsSubmitting(false);
  }
};

// Helper: Extract function name from code
const extractFunctionName = (code) => {
  // JavaScript
  const jsMatch = code.match(/function\s+(\w+)/);
  if (jsMatch) return jsMatch[1];
  
  // Python
  const pyMatch = code.match(/def\s+(\w+)/);
  if (pyMatch) return pyMatch[1];
  
  return 'solution';
};
```

---

### Step 2.2: Update UI Buttons

Replace existing Run/Submit buttons with:

```jsx
{/* Run Button */}
<button
  onClick={handleRunCode}
  disabled={isRunning || !userCode}
  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
>
  {isRunning ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      Running...
    </>
  ) : (
    <>
      <Play className="w-5 h-5" />
      Run Code
    </>
  )}
</button>

{/* Submit Button */}
<button
  onClick={handleSubmitCode}
  disabled={isSubmitting || !userCode}
  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
>
  {isSubmitting ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      Submitting...
    </>
  ) : (
    <>
      <Send className="w-5 h-5" />
      Submit
    </>
  )}
</button>
```

---

### Step 2.3: Add Test Results Display

Add this component to display results:

```jsx
{/* Test Results Panel */}
{testResults && (
  <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
    <h3 className="text-xl font-bold text-white mb-4">Test Results</h3>
    
    {/* Summary */}
    <div className="flex gap-4 mb-6">
      <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
        <span className="text-green-400 font-bold">{testResults.summary.passed} Passed</span>
      </div>
      <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
        <span className="text-red-400 font-bold">{testResults.summary.failed} Failed</span>
      </div>
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-2">
        <span className="text-blue-400 font-bold">Score: {testResults.summary.score}%</span>
      </div>
    </div>
    
    {/* Individual Test Cases */}
    <div className="space-y-3">
      {testResults.results.map((result, index) => (
        <div 
          key={index}
          className={`p-4 rounded-lg border ${
            result.passed 
              ? 'bg-green-900/20 border-green-700' 
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">Test Case {index + 1}</span>
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          <div className="text-sm space-y-1">
            <div className="text-gray-400">
              Input: <span className="text-white font-mono">{JSON.stringify(result.input)}</span>
            </div>
            <div className="text-gray-400">
              Expected: <span className="text-white font-mono">{JSON.stringify(result.expectedOutput)}</span>
            </div>
            <div className="text-gray-400">
              Your Output: <span className={`font-mono ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                {result.actualOutput || 'No output'}
              </span>
            </div>
            {result.error && (
              <div className="text-red-400 mt-2">
                Error: {result.error}
              </div>
            )}
            <div className="text-gray-500 text-xs mt-1">
              Execution time: {result.executionTime}ms
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 🧪 Phase 3: Testing (1 hour)

### Step 3.1: Test with Simple Problem

Create a test problem:

```javascript
const testProblem = {
  title: "Two Sum",
  description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
  difficulty: "Easy",
  
  starterCode: {
    javascript: "function twoSum(nums, target) {\n  // Your code here\n}",
    python: "def two_sum(nums, target):\n    # Your code here\n    pass"
  },
  
  publicTestCases: [
    {
      input: { nums: [2,7,11,15], target: 9 },
      expectedOutput: [0,1]
    },
    {
      input: { nums: [3,2,4], target: 6 },
      expectedOutput: [1,2]
    }
  ],
  
  privateTestCases: [
    {
      input: { nums: [3,3], target: 6 },
      expectedOutput: [0,1]
    }
  ]
};
```

### Step 3.2: Test Scenarios

1. ✅ **Correct Solution** - Should pass all tests
2. ❌ **Wrong Solution** - Should fail some tests
3. ⚠️ **Syntax Error** - Should show error message
4. ⏱️ **Timeout** - Should handle long-running code
5. 🔄 **Multiple Languages** - Test JavaScript, Python, etc.

---

## 🚀 Phase 4: Deployment (1 hour)

### Step 4.1: Environment Variables

Add to `backend/.env`:
```
PISTON_API_URL=https://emkc.org/api/v2/piston
```

### Step 4.2: Deploy Backend

**Render.com:**
1. Connect GitHub repo
2. Select `backend` folder
3. Add environment variables
4. Deploy

**Railway.app:**
1. New Project → Deploy from GitHub
2. Select backend service
3. Add environment variables
4. Deploy

### Step 4.3: Deploy Frontend

**Vercel:**
1. Import GitHub repo
2. Framework: Vite
3. Root directory: `frontend`
4. Add environment variable: `VITE_API_URL=your-backend-url`
5. Deploy

### Step 4.4: Test Production

Visit your deployed app and test:
- ✅ Code execution works
- ✅ Test cases validate
- ✅ Results display correctly
- ✅ Submission saves

---

## 📊 Phase 5: Optional Enhancements

### 5.1: Add Submission History

Create database model:
```javascript
// backend/models/Submission.js
const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  problemId: String,
  code: String,
  language: String,
  passed: Number,
  total: Number,
  score: Number,
  submittedAt: { type: Date, default: Date.now }
});
```

### 5.2: Add Leaderboard

Track user scores and display rankings.

### 5.3: Add More Languages

Extend language support in controller.

### 5.4: Add Code Templates

Provide starter code for each language.

---

## ✅ Checklist

### Backend
- [ ] Install axios
- [ ] Create codeExecutionController.js
- [ ] Create codeExecutionRoutes.js
- [ ] Register routes in server.js
- [ ] Test API with Postman/curl

### Frontend
- [ ] Add handleRunCode function
- [ ] Add handleSubmitCode function
- [ ] Update Run/Submit buttons
- [ ] Add test results display
- [ ] Test in browser

### Testing
- [ ] Test correct solution
- [ ] Test wrong solution
- [ ] Test syntax errors
- [ ] Test multiple languages
- [ ] Test edge cases

### Deployment
- [ ] Add environment variables
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test production

---

## 🆘 Troubleshooting

### Issue: "Piston API not responding"
**Solution:** Check internet connection, Piston API might be down temporarily

### Issue: "Test cases not validating"
**Solution:** Check function name extraction and output parsing logic

### Issue: "Code execution timeout"
**Solution:** Increase timeout in Piston API call (run_timeout parameter)

### Issue: "Wrong output format"
**Solution:** Ensure console.log outputs valid JSON

---

## 📚 Resources

- Piston API Docs: https://github.com/engineer-man/piston
- Piston Runtimes: https://emkc.org/api/v2/piston/runtimes
- Monaco Editor: https://microsoft.github.io/monaco-editor/

---

## 🎉 Success Criteria

Your CodeArena is ready when:
- ✅ Users can write code in the editor
- ✅ "Run" button executes code with public test cases
- ✅ Test results show pass/fail with details
- ✅ "Submit" button runs all test cases (public + private)
- ✅ Score is calculated and displayed
- ✅ Works in production after deployment
- ✅ Multiple programming languages supported

---

**Estimated Total Time:** 4-6 hours
**Total Cost:** $0 (100% Free)

Good luck with your implementation! 🚀
