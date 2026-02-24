const express = require("express");
const router = express.Router();
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const {
  startInterview,
  submitInterview,
  getInterview,
} = require("../controllers/interviewController");

// Start a new interview session - Authentication required
router.post("/start", protect, startInterview);

// Submit interview and receive AI feedback
router.post("/:id/submit", protect, submitInterview);

// Get a specific interview session
router.get("/:id", protect, getInterview);

// Minimal start interview endpoint for Phase 1
router.post("/start-interview", (req, res) => {
  res.json({
    duration: 1800, // 30 minutes in seconds
    sessionStarted: true
  });
});

// Minimal submit answer endpoint for Phase 2
router.post("/submit-answer", (req, res) => {
  console.log("--- New Transcript Received ---");
  console.log("Content:", req.body.transcript);
  console.log("-------------------------------");
  res.json({
    status: "received",
    success: true
  });
});

// Generate dynamic question using Ollama
router.post("/generate-question", async (req, res) => {
  const { role, phase, difficulty, alreadyAsked } = req.body;

  if (!role || !phase) {
    return res.status(400).json({ message: "Role and phase are required" });
  }

  const performanceHint = req.body.performanceHint || "Neutral start";

  const prompt = `You are a professional technical interviewer.
You are interviewing a candidate for the role: ${role}.

Your goal is to conduct a realistic, structured interview that:
- Starts from basic concepts
- Gradually moves to intermediate and advanced concepts
- Asks follow-up questions when appropriate
- Probes deeper if the candidate seems strong
- Simplifies if the candidate seems weak

Interview rules you MUST follow:
1. Ask ONLY ONE question at a time.
2. NEVER repeat any previously asked question.
3. Do NOT explain the answer. Only ask the question.
4. Keep questions clear, precise, and interview-style.
5. Adjust difficulty based on the interview phase and performance signal.

Current Interview Context:
- Role: ${role}
- Phase: ${phase}
- Difficulty: ${difficulty || 'intermediate'}
- Candidate performance signal: ${performanceHint}
- List of already asked questions: [${alreadyAsked ? alreadyAsked.join(" | ") : ""}]

You MUST:
- Avoid any question similar to those in the list of already asked questions.
- Generate a new, original interview question appropriate for the ${phase} phase.
- Return ONLY the question text, nothing else.`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt: prompt,
      stream: false
    });

    const question = response.data.response.trim();
    res.json({ question });
  } catch (error) {
    console.error("Ollama connection error:", error.message);

    // Fallback logic if Ollama is not running
    const fallbacks = {
      intro: "Tell me about a challenging project you've completed recently.",
      core: "How do you optimize the performance of a web application?",
      closing: "Do you have any questions for us about the company culture?"
    };

    res.json({
      question: fallbacks[phase] || "Tell me about yourself.",
      warning: "Ollama offline, used fallback"
    });
  }
});

// Evaluate user answer using Ollama
router.post("/evaluate-answer", async (req, res) => {
  const { question, answer, role } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "Question and answer are required" });
  }

  const prompt = `You are a technical interviewer for ${role || 'Software Engineer'}.
Question: ${question}
Candidate Answer: ${answer}

Evaluate this answer.
Return ONLY valid JSON in this format:
{
  "score": number between 0 and 10,
  "skillTag": "short topic name",
  "level": "strong" or "average" or "weak",
  "reason": "short one-line explanation"
}`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt: prompt,
      stream: false
    });

    try {
      // Try to parse JSON from response
      const resultText = response.data.response.trim();
      // Simple extraction in case LLM adds markdown or fluff
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultText);
      res.json(evaluation);
    } catch (parseError) {
      console.error("JSON parse error from AI:", parseError);
      res.json({
        score: 5,
        skillTag: "Communication",
        level: "average",
        reason: "Evaluation received but format was invalid."
      });
    }
  } catch (error) {
    console.error("Evaluation error:", error.message);
    res.status(500).json({ message: "Evaluation failed" });
  }
});

// Test endpoint for fallback system (no auth required)
router.post("/test-fallback", async (req, res) => {
  try {
    const { role, experience, domain, difficulty } = req.body;

    // Import the fallback function
    const { generateFallbackInterviewQuestions } = require("../controllers/interviewController");

    const questions = generateFallbackInterviewQuestions(role, experience, domain, difficulty);

    res.json({
      success: true,
      message: "Fallback system working correctly",
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fallback test failed",
      error: error.message
    });
  }
});

// Finalize interview and aggregate data
router.post("/finalize-interview", async (req, res) => {
  const { userId, role, evaluations } = req.body;
  const UserSkillProfile = require("../models/UserSkillProfile");
  const UserProgressSummary = require("../models/UserProgressSummary");

  if (!userId || !evaluations || !evaluations.length) {
    return res.status(400).json({ message: "UserId and evaluations are required" });
  }

  // Group by skillTag and compute averages
  const skillGroups = {};
  evaluations.forEach(ev => {
    if (!skillGroups[ev.skillTag]) {
      skillGroups[ev.skillTag] = { sum: 0, count: 0 };
    }
    skillGroups[ev.skillTag].sum += ev.score;
    skillGroups[ev.skillTag].count += 1;
  });

  const skillScores = {};
  const strongSkills = [];
  const weakSkills = [];
  let totalScoreSum = 0;

  Object.keys(skillGroups).forEach(tag => {
    const avg = skillGroups[tag].sum / skillGroups[tag].count;
    skillScores[tag] = avg;
    totalScoreSum += avg;

    if (avg >= 7) strongSkills.push(tag);
    if (avg <= 4) weakSkills.push(tag);
  });

  const overallScore = totalScoreSum / Object.keys(skillGroups).length;

  try {
    // Upsert into user_skill_profiles
    await UserSkillProfile.findOneAndUpdate(
      { userId, role },
      {
        skillScores,
        strongSkills,
        weakSkills,
        overallScore,
      },
      { upsert: true, new: true }
    );

    // Insert into user_progress_summaries
    await UserProgressSummary.create({
      userId,
      date: new Date(),
      overallScore,
      strongSkills,
      weakSkills
    });

    res.json({
      overallScore,
      skillScores,
      strongSkills,
      weakSkills
    });
  } catch (error) {
    console.error("Finalize error:", error.message);
    res.status(500).json({ message: "Failed to finalize interview" });
  }
});

module.exports = router;