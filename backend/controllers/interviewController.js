require('dotenv').config();
const InterviewSession = require('../models/InterviewSession');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced intelligent fallback interview question generator with maximum uniqueness
const generateFallbackInterviewQuestions = (role, experience, domain, difficulty) => {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const dateHash = new Date().getTime() % 1000;

  // Question banks organized by type and domain
  const questionBanks = {
    'Web Development': {
      technical: [
        'Explain the difference between server-side and client-side rendering and when you would use each approach.',
        'How would you optimize a web application for better performance and user experience?',
        'Describe your approach to handling state management in a complex web application.',
        'What are the key considerations when designing a RESTful API?',
        'How do you ensure cross-browser compatibility in your web applications?',
        'Explain the concept of progressive web apps and their benefits.',
        'What strategies do you use for responsive web design?',
        'How would you implement authentication and authorization in a web application?'
      ],
      behavioral: [
        'Tell me about a time when you had to learn a new web technology quickly for a project.',
        'Describe a situation where you had to debug a complex issue in production.',
        'How do you stay current with the rapidly evolving web development landscape?',
        'Tell me about a project where you had to collaborate with designers and backend developers.',
        'Describe a time when you had to make a trade-off between code quality and delivery timeline.',
        'How do you handle feedback and code reviews from team members?',
        'Tell me about a challenging technical decision you made and its outcome.',
        'Describe your approach to mentoring junior developers.'
      ],
      situational: [
        'A client wants to add a feature that would significantly impact performance. How do you handle this?',
        'You discover a security vulnerability in a live application. What are your immediate steps?',
        'Your team is split on choosing between two different frameworks. How do you resolve this?',
        'A project deadline is approaching but the code quality is below standards. What do you do?',
        'You need to integrate with a third-party API that has poor documentation. How do you proceed?',
        'A team member consistently writes code that doesn\'t follow best practices. How do you address this?'
      ]
    },
    'Data Science': {
      technical: [
        'Explain the bias-variance tradeoff and how it affects model performance.',
        'How would you handle missing data in a dataset and what are the implications of each approach?',
        'Describe the process of feature engineering and its importance in machine learning.',
        'What are the key differences between supervised and unsupervised learning algorithms?',
        'How do you evaluate the performance of a classification model?',
        'Explain the concept of overfitting and strategies to prevent it.',
        'What is cross-validation and why is it important in model development?',
        'How would you approach a time series forecasting problem?'
      ],
      behavioral: [
        'Tell me about a data science project where your initial hypothesis was wrong.',
        'Describe a time when you had to explain complex statistical concepts to non-technical stakeholders.',
        'How do you approach cleaning and preprocessing messy real-world data?',
        'Tell me about a project where you had to work with limited or poor-quality data.',
        'Describe your process for staying updated with new developments in data science.',
        'How do you handle disagreements about model interpretations with team members?',
        'Tell me about a time when you had to make a recommendation based on uncertain data.',
        'Describe a situation where you had to balance model accuracy with interpretability.'
      ],
      situational: [
        'Your model performs well in testing but poorly in production. How do you investigate?',
        'A business stakeholder wants to use a model for a purpose it wasn\'t designed for. How do you respond?',
        'You have limited time to deliver insights from a large, complex dataset. What\'s your approach?',
        'Your analysis contradicts the business team\'s expectations. How do you handle this situation?',
        'You need to choose between a simple, interpretable model and a complex, accurate one. How do you decide?',
        'A colleague questions the statistical significance of your findings. How do you address their concerns?'
      ]
    },
    'Software Engineering': {
      technical: [
        'Explain the SOLID principles and how they improve code quality.',
        'How do you approach system design for a scalable application?',
        'What are the trade-offs between different database types (SQL vs NoSQL)?',
        'Describe your approach to writing maintainable and testable code.',
        'How do you handle error handling and logging in distributed systems?',
        'Explain the concept of microservices and when you would use this architecture.',
        'What strategies do you use for code optimization and performance tuning?',
        'How do you ensure code quality and consistency across a development team?'
      ],
      behavioral: [
        'Tell me about a time when you had to refactor a large codebase.',
        'Describe a situation where you had to work with legacy code and technical debt.',
        'How do you approach learning new programming languages or frameworks?',
        'Tell me about a project where you had to balance multiple competing requirements.',
        'Describe a time when you had to make a critical architectural decision.',
        'How do you handle pressure when working on time-sensitive projects?',
        'Tell me about a bug that was particularly challenging to fix.',
        'Describe your experience with agile development methodologies.'
      ],
      situational: [
        'Your application is experiencing performance issues under high load. How do you diagnose and fix this?',
        'A critical system component fails during peak business hours. What\'s your response plan?',
        'You need to integrate with a legacy system that has limited documentation. How do you proceed?',
        'Your team wants to adopt a new technology, but management is concerned about risks. How do you handle this?',
        'You discover that a feature you built has a security vulnerability. What are your next steps?',
        'A junior developer on your team is struggling with a complex task. How do you help them?'
      ]
    }
  };

  // Default questions for domains not in the bank
  const defaultQuestions = {
    technical: [
      `What are the most important technical skills for a ${role} in ${domain}?`,
      `How do you approach problem-solving in ${domain} projects?`,
      `What tools and technologies do you prefer for ${domain} work and why?`,
      `Describe a complex technical challenge you've faced in ${domain}.`
    ],
    behavioral: [
      `Tell me about your experience working in ${domain}.`,
      `How do you stay updated with developments in ${domain}?`,
      `Describe a time when you had to learn something new quickly in ${domain}.`,
      `How do you handle feedback and criticism of your work?`
    ],
    situational: [
      `How would you handle a situation where project requirements change mid-development?`,
      `What would you do if you disagreed with a technical decision made by your team lead?`
    ]
  };

  // Get questions for the specific domain or use defaults
  const domainQuestions = questionBanks[domain] || defaultQuestions;

  // Adjust questions based on experience level
  const experienceAdjustments = {
    'Entry Level (0-2 years)': {
      focus: 'learning, fundamentals, growth mindset',
      prefix: 'As someone starting their career, '
    },
    'Mid Level (3-5 years)': {
      focus: 'problem-solving, collaboration, technical depth',
      prefix: 'With your experience, '
    },
    'Senior Level (5+ years)': {
      focus: 'leadership, architecture, mentoring',
      prefix: 'As a senior professional, '
    }
  };

  // Enhanced question selection with maximum randomization and uniqueness
  const selectedQuestions = [];

  // Create multiple randomization factors for better distribution
  const primarySeed = randomSeed;
  const secondarySeed = dateHash;
  const tertiarySeed = timestamp % 1000;

  // Shuffle arrays using multiple seeds for better randomization
  const shuffleArray = (array, seed) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(((seed + i) * 9301 + 49297) % 233280 / 233280 * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 2 technical questions with enhanced randomization
  const technicalQuestions = shuffleArray(domainQuestions.technical, primarySeed);
  for (let i = 0; i < 2; i++) {
    const index = (primarySeed + secondarySeed + i * 7) % technicalQuestions.length;
    selectedQuestions.push({
      question: technicalQuestions[index],
      type: 'technical',
      context: 'Technical knowledge and problem-solving',
      difficulty: difficulty.toLowerCase()
    });
  }

  // 2 behavioral questions with different seed
  const behavioralQuestions = shuffleArray(domainQuestions.behavioral, secondarySeed);
  for (let i = 0; i < 2; i++) {
    const index = (secondarySeed + tertiarySeed + i * 11) % behavioralQuestions.length;
    selectedQuestions.push({
      question: behavioralQuestions[index],
      type: 'behavioral',
      context: 'Past experiences and soft skills',
      difficulty: difficulty.toLowerCase()
    });
  }

  // 1 situational question with tertiary seed
  const situationalQuestions = shuffleArray(domainQuestions.situational, tertiarySeed);
  const situationalIndex = (tertiarySeed + primarySeed * 13) % situationalQuestions.length;
  selectedQuestions.push({
    question: situationalQuestions[situationalIndex],
    type: 'situational',
    context: 'Problem-solving and decision-making',
    difficulty: difficulty.toLowerCase()
  });

  // Enhanced role-specific scenario questions with more variety
  const scenarioQuestions = [
    `Imagine you're leading a ${domain} project with tight deadlines. How would you ensure quality while meeting the timeline?`,
    `You're working on a ${domain} project and discover that the current approach won't scale. How do you handle this situation?`,
    `A stakeholder requests a feature that goes against best practices in ${domain}. How do you respond?`,
    `You need to choose between two different approaches for a ${domain} solution. Walk me through your decision-making process.`,
    `How would you onboard a new team member to a complex ${domain} project?`,
    `Describe how you would handle a situation where your ${domain} project is behind schedule.`,
    `You're tasked with modernizing a legacy ${domain} system. What's your strategic approach?`,
    `A critical ${domain} system fails during peak hours. Describe your incident response process.`,
    `You need to convince leadership to invest in ${domain} infrastructure improvements. How do you build your case?`,
    `A team member disagrees with your ${domain} technical decision. How do you handle the conflict?`,
    `You're asked to estimate a complex ${domain} project with many unknowns. What's your approach?`,
    `How would you handle a situation where ${domain} requirements keep changing mid-project?`
  ];

  const shuffledScenarios = shuffleArray(scenarioQuestions, primarySeed + secondarySeed);
  const scenarioIndex = (primarySeed + secondarySeed + tertiarySeed * 17) % shuffledScenarios.length;
  selectedQuestions.push({
    question: shuffledScenarios[scenarioIndex],
    type: 'scenario',
    context: 'Role-specific problem-solving',
    difficulty: difficulty.toLowerCase()
  });

  return {
    questions: selectedQuestions,
    timeLimit: 1800,
    totalQuestions: 6
  };
};

// STRICT fallback evaluation system with proper answer quality assessment
const generateFallbackEvaluation = (answers, session) => {
  const answerCount = answers.length;
  const totalQuestions = session.questions.length;

  // Start with base score of 1 (assume poor until proven otherwise)
  let baseScore = 1;

  // Strict answer quality assessment
  let totalQualityScore = 0;
  let validAnswers = 0;

  answers.forEach((answer, index) => {
    const answerText = answer.answer?.trim() || '';
    const answerLength = answerText.length;
    const words = answerText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    let answerScore = 0;

    // CRITICAL QUALITY CHECKS

    // 1. Check for nonsensical/gibberish answers
    const isGibberish = /^[a-zA-Z]*$/.test(answerText.replace(/\s/g, '')) &&
      !words.some(word => word.length > 2) &&
      wordCount < 3;

    const hasRandomChars = /[qxz]{2,}|[bcdfg]{3,}|[hjklmnp]{3,}/i.test(answerText);
    const isVeryShort = wordCount < 3 && answerLength < 15;
    const isRepeatedChars = /(.)\1{4,}/.test(answerText);

    if (isGibberish || hasRandomChars || isRepeatedChars) {
      answerScore = 0; // Automatic fail for gibberish
    } else if (isVeryShort) {
      answerScore = 1; // Very low score for extremely short answers
    } else {
      // 2. Length and structure assessment
      if (wordCount >= 20 && answerLength >= 100) answerScore += 3;
      else if (wordCount >= 10 && answerLength >= 50) answerScore += 2;
      else if (wordCount >= 5 && answerLength >= 25) answerScore += 1;

      // 3. Check for relevant keywords and concepts
      const technicalTerms = ['implement', 'design', 'architecture', 'solution', 'approach', 'experience',
        'project', 'team', 'challenge', 'result', 'development', 'system', 'process',
        'method', 'strategy', 'analysis', 'framework', 'technology', 'algorithm'];

      const domainTerms = {
        'Web Development': ['html', 'css', 'javascript', 'react', 'node', 'api', 'database', 'frontend', 'backend'],
        'Data Science': ['data', 'analysis', 'model', 'algorithm', 'statistics', 'python', 'machine learning', 'visualization'],
        'Software Engineering': ['code', 'programming', 'software', 'testing', 'debugging', 'version control', 'agile']
      };

      const relevantTerms = [...technicalTerms, ...(domainTerms[session.domain] || [])];
      const hasRelevantTerms = relevantTerms.some(term =>
        answerText.toLowerCase().includes(term.toLowerCase())
      );

      if (hasRelevantTerms) answerScore += 2;

      // 4. Check for coherent sentence structure
      const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const hasCoherentStructure = sentences.length >= 1 &&
        sentences.some(s => s.trim().split(/\s+/).length >= 4);

      if (hasCoherentStructure) answerScore += 1;

      // 5. Check for specific examples or details
      const hasSpecifics = /\b(for example|such as|specifically|in particular|like|including)\b/i.test(answerText) ||
        /\b\d+\b/.test(answerText) || // Contains numbers
        /\b(when|where|how|why|what)\b/i.test(answerText);

      if (hasSpecifics) answerScore += 1;
    }

    // Cap individual answer score at 7 (reserve 8-10 for exceptional answers)
    answerScore = Math.min(7, answerScore);
    totalQualityScore += answerScore;

    if (answerScore > 0) validAnswers++;
  });

  // Calculate final score based on answer quality
  if (validAnswers === 0) {
    baseScore = 1; // All answers were gibberish/invalid
  } else {
    const avgAnswerScore = totalQualityScore / answerCount;
    baseScore = Math.max(1, Math.min(8, avgAnswerScore)); // Cap at 8 for fallback system
  }

  // Slight bonus for completion (but not much if answers are poor)
  const completionBonus = (answerCount / totalQuestions) * 0.5;
  baseScore += completionBonus;

  // Final score capping
  const finalScore = Math.max(1, Math.min(8, Math.round(baseScore * 10) / 10));

  // Generate contextual feedback based on domain and role
  const domainSpecificFeedback = {
    'Web Development': {
      strengths: ['Understanding of web technologies', 'Problem-solving approach', 'Communication skills'],
      improvements: ['Technical depth in frameworks', 'Performance optimization knowledge', 'Security best practices'],
      recommendations: 'Focus on building full-stack projects and learning modern frameworks like React or Vue.js. Practice system design and performance optimization.',
      tips: 'Prepare specific examples of projects you\'ve built. Be ready to discuss technical trade-offs and explain your code architecture decisions.'
    },
    'Data Science': {
      strengths: ['Analytical thinking', 'Statistical understanding', 'Data interpretation skills'],
      improvements: ['Machine learning algorithms', 'Data visualization', 'Business impact communication'],
      recommendations: 'Work on end-to-end data science projects. Practice explaining complex concepts in simple terms and focus on business impact.',
      tips: 'Prepare to discuss your methodology, model selection process, and how you validate results. Have examples of insights you\'ve generated.'
    },
    'Software Engineering': {
      strengths: ['Problem decomposition', 'Code organization', 'Technical communication'],
      improvements: ['System design', 'Code optimization', 'Testing strategies'],
      recommendations: 'Practice system design problems and contribute to open-source projects. Focus on writing clean, maintainable code.',
      tips: 'Be prepared to code on a whiteboard or computer. Discuss your thought process and consider edge cases in your solutions.'
    }
  };

  const feedback = domainSpecificFeedback[session.domain] || {
    strengths: ['Communication skills', 'Problem-solving approach', 'Professional attitude'],
    improvements: ['Technical depth', 'Industry knowledge', 'Specific examples'],
    recommendations: `Continue developing your skills in ${session.domain} through hands-on projects and industry learning.`,
    tips: 'Prepare specific examples from your experience and practice explaining concepts clearly.'
  };

  // Adjust feedback based on experience level
  let experienceAdjustment = '';
  if (session.experience.includes('Entry')) {
    experienceAdjustment = ' Focus on building foundational skills and gaining practical experience.';
  } else if (session.experience.includes('Mid')) {
    experienceAdjustment = ' Work on developing leadership skills and deeper technical expertise.';
  } else if (session.experience.includes('Senior')) {
    experienceAdjustment = ' Focus on mentoring others and driving technical decisions at the architectural level.';
  }

  // Generate performance rating
  let performanceRating = 'Poor';
  if (finalScore >= 9) performanceRating = 'Exceptional';
  else if (finalScore >= 7) performanceRating = 'Strong';
  else if (finalScore >= 5) performanceRating = 'Adequate';
  else if (finalScore >= 3) performanceRating = 'Below Average';

  // Generate honest feedback based on actual performance
  let overallFeedback, technicalAssessment, communicationAssessment, behavioralAssessment;
  let actualStrengths, actualWeaknesses, actualRecommendations;

  if (finalScore <= 2) {
    overallFeedback = `Your responses were largely incoherent or irrelevant to the questions asked. This interview performance indicates significant preparation is needed.`;
    technicalAssessment = `Technical knowledge could not be assessed due to unclear or nonsensical responses. Fundamental understanding of ${session.domain} concepts needs development.`;
    communicationAssessment = `Communication was unclear and unprofessional. Responses lacked structure, coherence, and relevance to the questions.`;
    behavioralAssessment = `Professional readiness appears limited based on the quality of responses provided.`;
    actualStrengths = ['Showed up for the interview'];
    actualWeaknesses = ['Incoherent responses', 'Lack of preparation', 'Poor communication skills', 'No demonstration of relevant knowledge'];
    actualRecommendations = `Significant preparation is required before attempting interviews. Focus on: 1) Understanding basic ${session.domain} concepts, 2) Practicing clear communication, 3) Preparing specific examples from experience or projects.`;
  } else if (finalScore <= 4) {
    overallFeedback = `Your responses showed limited understanding and preparation. Several answers were unclear or did not adequately address the questions.`;
    technicalAssessment = `Technical knowledge in ${session.domain} appears very limited. Responses lacked depth and accuracy.`;
    communicationAssessment = `Communication needs significant improvement. Responses were often too brief or unclear.`;
    behavioralAssessment = `Professional competencies were not clearly demonstrated through the responses.`;
    actualStrengths = feedback.strengths.slice(0, 1); // Only give 1 strength
    actualWeaknesses = ['Limited technical knowledge', 'Poor communication clarity', 'Insufficient preparation', 'Lack of specific examples'];
    actualRecommendations = `Focus on fundamental skill development in ${session.domain}. Practice articulating thoughts clearly and prepare specific examples.`;
  } else {
    // Use original feedback for decent scores
    overallFeedback = `You completed ${answerCount} out of ${totalQuestions} questions. Your responses demonstrate ${finalScore >= 7 ? 'strong' : finalScore >= 5 ? 'adequate' : 'developing'} understanding of the field.`;
    technicalAssessment = `Technical knowledge in ${session.domain} appears ${finalScore >= 6 ? 'solid' : 'developing'}. ${finalScore >= 6 ? 'You demonstrate understanding of key concepts.' : 'Focus on strengthening fundamental concepts.'}`;
    communicationAssessment = `Communication shows ${finalScore >= 6 ? 'good clarity' : 'room for improvement'}. ${finalScore >= 6 ? 'You express ideas reasonably well.' : 'Work on providing more detailed and structured responses.'}`;
    behavioralAssessment = `Professional competencies are ${finalScore >= 6 ? 'developing positively' : 'emerging'}. Continue building confidence and showcasing problem-solving approach.`;
    actualStrengths = feedback.strengths;
    actualWeaknesses = feedback.improvements;
    actualRecommendations = feedback.recommendations + experienceAdjustment;
  }

  return {
    overallScore: finalScore,
    overallFeedback: overallFeedback,
    strengths: actualStrengths,
    weaknesses: actualWeaknesses,
    technicalAssessment: technicalAssessment,
    communicationAssessment: communicationAssessment,
    behavioralAssessment: behavioralAssessment,
    recommendations: actualRecommendations,
    focusAreas: [
      finalScore < 3 ? 'Basic communication skills' : finalScore < 6 ? `${session.domain} fundamentals` : `Advanced ${session.domain} concepts`,
      finalScore < 3 ? 'Interview preparation' : 'Communication and presentation skills',
      finalScore < 3 ? 'Professional readiness' : 'Practical project experience'
    ],
    interviewTips: finalScore < 3 ? 'Focus on basic preparation: understand the role, practice clear communication, and prepare relevant examples before attempting interviews.' : feedback.tips,
    performanceRating: performanceRating
  };
};

const startInterview = async (req, res) => {
  try {
    const { role, experience, domain, difficulty } = req.body;

    // Validate required fields
    if (!role || !experience || !domain) {
      return res.status(400).json({ message: 'Role, experience, and domain are required' });
    }

    let interviewData;

    try {
      // Enhanced uniqueness generation
      const timestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 100000);
      const userSeed = req.user.id.slice(-4); // Use last 4 chars of user ID for personalization
      const sessionHash = `${timestamp}-${randomSeed}-${userSeed}`;

      // Expanded variation prompts for maximum diversity
      const variationPrompts = [
        'Focus on real-world scenarios and practical applications with specific examples.',
        'Emphasize problem-solving and critical thinking with hypothetical challenges.',
        'Include questions about recent trends, emerging technologies, and best practices.',
        'Ask about overcoming obstacles, failures, and learning from mistakes.',
        'Focus on collaboration, team dynamics, and leadership experiences.',
        'Explore technical depth, implementation details, and architectural decisions.',
        'Ask about project experience, lessons learned, and process improvements.',
        'Include questions about scalability, optimization, and performance considerations.',
        'Focus on innovation, creativity, and out-of-the-box thinking.',
        'Emphasize mentoring, knowledge sharing, and team development.',
        'Ask about cross-functional collaboration and stakeholder management.',
        'Include questions about technical debt, refactoring, and code quality.',
        'Focus on user experience, accessibility, and inclusive design.',
        'Ask about data-driven decisions and metrics-based improvements.',
        'Include questions about security, privacy, and ethical considerations.'
      ];

      // Use multiple variation prompts for even more diversity
      const selectedVariations = [
        variationPrompts[randomSeed % variationPrompts.length],
        variationPrompts[(randomSeed + 7) % variationPrompts.length]
      ];

      // Models to try in order of preference
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let lastError = null;
      let aiResponse = null;

      for (const modelName of modelsToTry) {
        try {

          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 1.2,
              topP: 0.98,
              topK: 50
            }
          });

          const prompt = `Generate 6 COMPLETELY UNIQUE and HIGHLY DIVERSE interview questions for a ${experience} level ${role} position in ${domain} at ${difficulty} difficulty.

      CRITICAL UNIQUENESS REQUIREMENTS:
      - Every question must be ORIGINAL and NEVER REPEATED
      - Avoid common, generic interview questions
      - Create fresh perspectives on standard topics
      - ${selectedVariations[0]}
      - ${selectedVariations[1]}
      
      UNIQUE SESSION IDENTIFIER: ${sessionHash}
      GENERATION TIMESTAMP: ${new Date().toISOString()}
      RANDOMIZATION SEED: ${randomSeed}

      Question Distribution:
      - 2 technical questions with unique angles specific to ${role} in ${domain}
      - 2 behavioral questions tailored to ${experience} level professionals
      - 1 situational/problem-solving question with creative scenarios
      - 1 role-specific scenario question with industry-relevant challenges

      INNOVATION REQUIREMENTS:
      - Use current industry trends and challenges
      - Include modern tools, methodologies, and practices
      - Ask about emerging technologies and future considerations
      - Focus on real-world complexity and nuanced decision-making

      For each question, provide:
      - Completely original question text (no generic templates)
      - Question type (technical, behavioral, situational, scenario)
      - Contextual background if needed
      - Appropriate difficulty level

      Return JSON with this exact schema:
      {
        "questions": [
          {
            "question": "string",
            "type": "technical|behavioral|situational|scenario",
            "context": "string (optional background info)",
            "difficulty": "beginner|intermediate|advanced"
          }
        ],
        "timeLimit": 1800,
        "totalQuestions": 6,
        "sessionId": "${sessionHash}"
      }`;

          const result = await model.generateContent({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          });

          const responseText = result.response.text();
          aiResponse = JSON.parse(responseText);
          break; // Success, exit the model loop

        } catch (modelError) {
          lastError = modelError;

          // Continue to next model on any error
          if (modelError.message?.includes('429') || modelError.message?.includes('quota')) {
            continue;
          }
          if (modelError.message?.includes('404')) {
            continue;
          }
          continue;
        }
      }

      if (aiResponse) {
        interviewData = aiResponse;
        interviewData.generatedAt = new Date().toISOString();
        interviewData.uniqueHash = sessionHash;
      } else {
        throw lastError || new Error('All models failed');
      }

    } catch (aiError) {
      // Generate intelligent fallback questions with enhanced uniqueness
      interviewData = generateFallbackInterviewQuestions(role, experience, domain, difficulty);
      interviewData.usingFallback = true;
      interviewData.generatedAt = new Date().toISOString();
      interviewData.uniqueHash = `fallback-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }

    // Create interview session with enhanced metadata
    const session = await InterviewSession.create({
      user: req.user.id,
      role,
      experience,
      domain,
      difficulty,
      questions: interviewData.questions,
      timeLimit: interviewData.timeLimit || 1800,
      uniqueHash: interviewData.uniqueHash,
      generatedAt: interviewData.generatedAt
    });

    res.status(201).json({
      sessionId: session._id,
      questions: interviewData.questions,
      timeLimit: interviewData.timeLimit || 1800,
      usingFallback: interviewData.usingFallback || false,
      uniqueHash: interviewData.uniqueHash
    });
  } catch (error) {
    console.error("Error generating interview:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    res.status(500).json({
      message: 'Failed to generate interview questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const submitInterview = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Interview session not found' });

    // Check if the session belongs to the logged-in user
    if (session.user && session.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (session.isCompleted) return res.json(session);

    const { answers } = req.body;
    session.userAnswers = answers;

    let evaluation;

    try {
      // Models to try in order of preference
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let lastError = null;
      let aiEvaluation = null;

      for (const modelName of modelsToTry) {
        try {

          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 4096
            }
          });

          const prompt = `You are a STRICT interview evaluator. Analyze this ${session.experience} level ${session.role} interview performance in ${session.domain}.

      CRITICAL EVALUATION RULES:
      1. **ZERO TOLERANCE for nonsensical answers** - Random text, gibberish, or irrelevant responses = 1-2 score
      2. **STRICT QUALITY ASSESSMENT** - Only coherent, relevant, well-structured answers deserve high scores
      3. **NO BENEFIT OF DOUBT** - Unclear or vague responses should be penalized heavily
      4. **ANSWER RELEVANCE** - Responses must directly address the question asked

      INTERVIEW CONTEXT:
      - Role: ${session.role}
      - Experience Level: ${session.experience}
      - Domain: ${session.domain}
      - Difficulty: ${session.difficulty}

      DETAILED QUESTION-ANSWER ANALYSIS:
      ${answers.map((answer, index) => {
            const question = session.questions[index];
            return `
        Question ${index + 1} (${question?.type || 'general'}):
        Q: "${answer.question}"
        A: "${answer.answer}"
        Context: ${question?.context || 'N/A'}
        
        QUALITY CHECK: Is this answer coherent, relevant, and meaningful? Does it demonstrate understanding?
        `;
          }).join('\n')}

      STRICT EVALUATION CRITERIA:
      For each answer, check:
      1. **Answer Coherence**: Is the response understandable and logical?
      2. **Question Relevance**: Does the answer address what was asked?
      3. **Technical Accuracy**: Are technical concepts correct (if applicable)?
      4. **Communication Quality**: Is the response well-structured and clear?
      5. **Depth of Knowledge**: Does the answer show understanding beyond surface level?
      6. **Professional Competency**: Does the response demonstrate job-relevant skills?

      HARSH BUT FAIR SCORING GUIDELINES:
      - 9-10: Exceptional - Perfect answers, demonstrates mastery, exceeds expectations
      - 7-8: Strong - Good answers with depth, meets expectations clearly
      - 5-6: Adequate - Basic but acceptable answers, shows some understanding
      - 3-4: Below Average - Poor answers, significant issues, lacks understanding
      - 1-2: Poor - Nonsensical, irrelevant, or completely inadequate responses

      SPECIAL PENALTIES:
      - Random text/gibberish: Automatic 1-2 score
      - Completely irrelevant answers: Maximum 3 score
      - Very short answers (under 10 words): Maximum 4 score
      - Vague or unclear responses: Maximum 5 score

      PROVIDE HONEST, CRITICAL FEEDBACK:
      Return JSON with this exact schema:
      {
        "overallScore": number (1-10),
        "overallFeedback": "Honest assessment of overall performance quality",
        "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
        "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
        "technicalAssessment": "critical analysis of technical competency",
        "communicationAssessment": "honest analysis of communication quality",
        "behavioralAssessment": "assessment of professional behavior demonstrated",
        "recommendations": "specific steps needed for significant improvement",
        "focusAreas": ["critical area 1", "critical area 2", "critical area 3"],
        "interviewTips": "essential tips for future interview success",
        "performanceRating": "Exceptional|Strong|Adequate|Below Average|Poor"
      }`;

          const result = await model.generateContent({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          });

          const responseText = result.response.text();
          aiEvaluation = JSON.parse(responseText);
          break; // Success, exit the model loop

        } catch (modelError) {
          lastError = modelError;
          continue; // Try next model
        }
      }

      if (aiEvaluation) {
        evaluation = aiEvaluation;
      } else {
        throw lastError || new Error('All models failed');
      }

    } catch (aiError) {
      // Generate intelligent fallback evaluation
      evaluation = generateFallbackEvaluation(answers, session);
    }

    // Validate response format
    if (typeof evaluation.overallScore !== 'number') {
      throw new Error('Invalid response format from AI model');
    }

    // Save comprehensive evaluation results
    session.overallScore = evaluation.overallScore;
    session.overallFeedback = evaluation.overallFeedback;
    session.strengths = evaluation.strengths || [];
    session.weaknesses = evaluation.weaknesses || evaluation.improvements || [];
    session.technicalAssessment = evaluation.technicalAssessment || '';
    session.communicationAssessment = evaluation.communicationAssessment || '';
    session.behavioralAssessment = evaluation.behavioralAssessment || '';
    session.recommendations = evaluation.recommendations || '';
    session.focusAreas = evaluation.focusAreas || [];
    session.interviewTips = evaluation.interviewTips || '';
    session.performanceRating = evaluation.performanceRating || 'Adequate';
    session.isCompleted = true;

    const updatedSession = await session.save();

    res.json({
      overallScore: evaluation.overallScore,
      overallFeedback: evaluation.overallFeedback,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses || evaluation.improvements,
      technicalAssessment: evaluation.technicalAssessment,
      communicationAssessment: evaluation.communicationAssessment,
      behavioralAssessment: evaluation.behavioralAssessment,
      recommendations: evaluation.recommendations,
      focusAreas: evaluation.focusAreas,
      interviewTips: evaluation.interviewTips,
      performanceRating: evaluation.performanceRating
    });
  } catch (error) {
    console.error("CRITICAL ERROR in submitInterview:", error);
    res.status(500).json({ message: 'Failed to evaluate interview' });
  }
};

const getInterview = async (req, res) => {
  try {
    const interview = await InterviewSession.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview session not found' });

    // Check if the interview belongs to the logged-in user
    if (interview.user && interview.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch interview session' });
  }
};

module.exports = {
  startInterview,
  submitInterview,
  getInterview,
  generateFallbackInterviewQuestions,
  generateFallbackEvaluation
};