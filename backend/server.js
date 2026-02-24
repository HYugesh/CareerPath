// backend/server.js
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables first

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
// const passport = require("./config/passport"); // Commented out for future OAuth implementation

const authRoutes = require("./routes/authRoutes");
// const oauthRoutes = require("./routes/oauthRoutes"); // Commented out for future OAuth implementation
const { generateCodingProblems } = require("./services/geminiService");
const aiClient = require("./aiClient");
const domainRoutes = require("./routes/domainRoutes.js");
const assessmentRoutes = require("./routes/assessmentRoutes.js");
const interviewRoutes = require("./routes/interviewRoutes.js");

const codingRoutes = require("./routes/codingRoutes.js");
const voiceRoutes = require("./routes/voiceRoutes.js");
const userRoutes = require("./routes/userRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const requirementsRoutes = require("./routes/requirementsRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");

const app = express();

// CORS configuration - Allow testing from HTML file and frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman, or file://)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Allow file:// protocol for testing
    if (origin.startsWith('file://') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for development
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (commented out for future OAuth implementation)
/*
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport (commented out for future OAuth implementation)
app.use(passport.initialize());
app.use(passport.session());
*/

// Request logging middleware removed for cleaner logs

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
// app.use("/api/auth", oauthRoutes); // Commented out for future OAuth implementation
app.use("/api/domains", domainRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/interview", interviewRoutes);

app.use("/api/coding", codingRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/requirements", requirementsRoutes);
app.use("/api/roadmaps", roadmapRoutes);

// Enhanced module system routes
app.use("/api/roadmaps", require("./routes/moduleRoutes"));
app.use("/api/roadmaps", require("./routes/roadmapQuizRoutes"));
app.use("/api/roadmaps", require("./routes/subComponentRoutes"));
app.use("/api/roadmaps", require("./routes/subTopicQuizRoutes"));

// AI code execution endpoint
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const aiResponse = await aiClient.sendPromptToAI(prompt);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI request error:', error.message);
    res.status(500).json({
      message: "AI request failed",
      error: error.message
    });
  }
});

// Generate coding problems with Gemini AI
app.post("/api/generate-problems", async (req, res) => {
  const { topics, difficulty, count } = req.body;
  try {
    const problems = await generateCodingProblems(topics, difficulty, parseInt(count));
    const exactProblems = problems.slice(0, parseInt(count));
    res.json({ problems: exactProblems });
  } catch (error) {
    console.error('Error generating problems:', error.message);
    const fallbackProblems = generateFallbackProblems(topics, difficulty, parseInt(count));
    res.json({ problems: fallbackProblems });
  }
});

// Fallback problem generator with diverse problems
function generateFallbackProblems(topics, difficulty, count) {
  const problemBank = {
    'Arrays': [
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
        ],
        constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
        testCases: [
          { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
          { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: true }
        ]
      },
      {
        title: 'Maximum Subarray',
        description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
        examples: [
          { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6.' }
        ],
        constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
        testCases: [
          { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
          { input: '[1]', expectedOutput: '1', isHidden: true }
        ]
      },
      {
        title: 'Contains Duplicate',
        description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
        examples: [
          { input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The value 1 appears at indices 0 and 3.' }
        ],
        constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
        testCases: [
          { input: '[1,2,3,1]', expectedOutput: 'true', isHidden: false },
          { input: '[1,2,3,4]', expectedOutput: 'false', isHidden: true }
        ]
      }
    ],
    'Strings': [
      {
        title: 'Valid Anagram',
        description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
        examples: [
          { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both strings contain the same characters with same frequency.' }
        ],
        constraints: ['1 ≤ s.length, t.length ≤ 5 × 10⁴'],
        testCases: [
          { input: '"anagram", "nagaram"', expectedOutput: 'true', isHidden: false },
          { input: '"rat", "car"', expectedOutput: 'false', isHidden: true }
        ]
      },
      {
        title: 'Valid Palindrome',
        description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
        examples: [
          { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' }
        ],
        constraints: ['1 ≤ s.length ≤ 2 × 10⁵'],
        testCases: [
          { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false },
          { input: '"race a car"', expectedOutput: 'false', isHidden: true }
        ]
      }
    ],
    'Linked Lists': [
      {
        title: 'Reverse Linked List',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        examples: [
          { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'The linked list is reversed.' }
        ],
        constraints: ['The number of nodes in the list is the range [0, 5000]'],
        testCases: [
          { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
          { input: '[1,2]', expectedOutput: '[2,1]', isHidden: true }
        ]
      }
    ]
  };

  const problems = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const topicProblems = problemBank[topic] || problemBank['Arrays'];
    const problemTemplate = topicProblems[i % topicProblems.length];

    problems.push({
      id: i + 1,
      title: problemTemplate.title,
      difficulty,
      topic,
      description: problemTemplate.description,
      examples: problemTemplate.examples,
      constraints: problemTemplate.constraints,
      testCases: problemTemplate.testCases
    });
  }

  return problems;
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));