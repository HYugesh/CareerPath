/**
 * AI Content Service
 * Handles roadmap generation and learning content
 * Uses centralized Gemini client for optimized API usage
 */

const { callGemini } = require('./geminiClient');

/**
 * Generate enhanced roadmap steps with AI
 */
const generateEnhancedRoadmapSteps = async (domainName) => {
  console.log(`Generating roadmap for: ${domainName}`);

  const prompt = `Create a learning roadmap for "${domainName}" with 8-10 steps.

Each step needs: title, description, subtopics (3-5), estimatedHours (5-20), difficulty (beginner/intermediate/advanced), prerequisites.

Return JSON array:
[{"title": "Step", "description": "What to learn", "subtopics": ["topic1"], "estimatedHours": 10, "difficulty": "beginner", "prerequisites": []}]`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 4096,
      useCache: true,
      responseType: 'json'
    });

    let steps;
    try {
      steps = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse roadmap JSON:', parseError.message);
      throw new Error('AI returned invalid roadmap JSON');
    }
    
    if (!Array.isArray(steps)) {
      console.error('Roadmap response is not an array');
      throw new Error('Invalid roadmap structure');
    }
    
    if (steps.length >= 5) {
      console.log(`Generated ${steps.length} roadmap steps`);
      return steps;
    }

    throw new Error('Insufficient steps generated');

  } catch (error) {
    console.log('Roadmap generation failed, using fallback:', error.message);
    return generateFallbackSteps(domainName);
  }
};

/**
 * Generate detailed explanation for a specific step
 */
const generateStepExplanation = async (stepTitle, domainName) => {
  console.log(`Generating explanation for: ${stepTitle}`);

  const prompt = `Explain the learning step "${stepTitle}" for ${domainName}.

Return JSON:
{"explanation": "Detailed explanation", "importance": "Why it matters", "keyConcepts": ["concept1"], "practicalApplications": ["app1"]}`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
      useCache: true,
      responseType: 'json'
    });

    let explanation;
    try {
      explanation = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse explanation JSON:', parseError.message);
      throw new Error('AI returned invalid explanation JSON');
    }

    return explanation;

  } catch (error) {
    console.log('Explanation generation failed:', error.message);
    return {
      explanation: `This step focuses on ${stepTitle} which is important for ${domainName}.`,
      importance: `Understanding ${stepTitle} builds a solid foundation.`,
      keyConcepts: ["Core concepts", "Best practices", "Common patterns"],
      practicalApplications: ["Industry applications", "Real-world projects"]
    };
  }
};

/**
 * Generate resource recommendations for a step
 */
const generateResourceRecommendations = async (stepTitle, domainName) => {
  console.log(`Generating resources for: ${stepTitle}`);

  const prompt = `Recommend 4-6 learning resources for "${stepTitle}" in ${domainName}.

Return JSON array:
[{"title": "Resource", "description": "Brief desc", "type": "documentation|tutorial|course|book|video|practice", "difficulty": "beginner|intermediate|advanced", "cost": "free|paid", "url": ""}]`;

  try {
    const jsonResponse = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
      useCache: true,
      responseType: 'json'
    });

    let resources;
    try {
      resources = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse resources JSON:', parseError.message);
      throw new Error('AI returned invalid resources JSON');
    }
    
    if (!Array.isArray(resources)) {
      console.error('Resources response is not an array');
      throw new Error('Invalid resources structure');
    }

    return resources;

  } catch (error) {
    console.log('Resource generation failed:', error.message);
    return [
      { title: "Official Documentation", description: `Documentation for ${stepTitle}`, type: "documentation", difficulty: "intermediate", cost: "free", url: "" },
      { title: "Interactive Tutorial", description: `Hands-on tutorial for ${stepTitle}`, type: "tutorial", difficulty: "beginner", cost: "free", url: "" }
    ];
  }
};

/**
 * Fallback roadmap steps
 */
function generateFallbackSteps(domainName) {
  console.log('Using fallback steps for:', domainName);

  return [
    { title: `Learn ${domainName} Fundamentals`, description: `Master basic concepts of ${domainName}`, subtopics: ["Core concepts", "Basic terminology", "Key principles"], estimatedHours: 15, difficulty: "beginner", prerequisites: [] },
    { title: "Set Up Development Environment", description: `Configure your environment for ${domainName}`, subtopics: ["Tool installation", "Environment setup", "Configuration"], estimatedHours: 8, difficulty: "beginner", prerequisites: ["Basic computer skills"] },
    { title: "Practice with Simple Examples", description: `Work through basic exercises in ${domainName}`, subtopics: ["Simple exercises", "Code examples", "Practice problems"], estimatedHours: 12, difficulty: "beginner", prerequisites: ["Fundamentals"] },
    { title: "Build Your First Project", description: `Create a small project using ${domainName}`, subtopics: ["Project planning", "Implementation", "Testing"], estimatedHours: 20, difficulty: "intermediate", prerequisites: ["Basic practice"] },
    { title: "Learn Intermediate Concepts", description: `Dive deeper into ${domainName} topics`, subtopics: ["Advanced concepts", "Best practices", "Design patterns"], estimatedHours: 18, difficulty: "intermediate", prerequisites: ["First project"] },
    { title: "Work on Complex Project", description: `Build a sophisticated project using ${domainName}`, subtopics: ["Complex implementation", "Integration", "Optimization"], estimatedHours: 25, difficulty: "intermediate", prerequisites: ["Intermediate concepts"] },
    { title: "Master Advanced Techniques", description: `Learn advanced techniques and optimization`, subtopics: ["Advanced techniques", "Performance", "Scalability"], estimatedHours: 22, difficulty: "advanced", prerequisites: ["Complex project"] },
    { title: "Build Portfolio Project", description: `Create a comprehensive portfolio project`, subtopics: ["Portfolio planning", "Full implementation", "Documentation"], estimatedHours: 30, difficulty: "advanced", prerequisites: ["Advanced techniques"] }
  ];
}

module.exports = {
  generateEnhancedRoadmapSteps,
  generateStepExplanation,
  generateResourceRecommendations
};