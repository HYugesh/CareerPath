/**
 * AI Roadmap Blueprint Service
 * Generates personalized learning path structures using Gemini AI
 * Separate from controllers for clean architecture
 */

const { callGemini } = require('./geminiClient');
const { generateRoadmapWithOpenAI, fixOpenAIJSON } = require('./openaiClient');
const RequirementsProfile = require('../models/RequirementsProfile');

// Rate limiting for roadmap generation
const generationRateLimit = new Map();
const GENERATION_COOLDOWN = 60 * 1000; // 1 minute between generations
const MAX_GENERATIONS_PER_DAY = 10;

/**
 * Fallback template for when AI fails
 */
const FALLBACK_TEMPLATE = {
    pathTitle: "Full Stack Development Learning Path",
    description: "A comprehensive learning journey from fundamentals to job-ready skills",
    totalModules: 8,
    estimatedTotalHours: 120,
    modules: [
        {
            moduleId: 1,
            title: "Programming Fundamentals",
            moduleType: "concept",
            objective: "Master core programming concepts including variables, data types, control flow, and functions",
            difficultyLevel: "Easy",
            estimatedHours: 15,
            prerequisites: [],
            topics: ["Variables & Data Types", "Control Flow", "Functions", "Basic Algorithms"],
            tags: ["fundamentals", "basics", "programming"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 2,
            title: "Data Structures & Algorithms",
            moduleType: "concept",
            objective: "Learn essential data structures and algorithmic thinking",
            difficultyLevel: "Easy",
            estimatedHours: 20,
            prerequisites: [1],
            topics: ["Arrays & Lists", "Hash Maps", "Stacks & Queues", "Basic Sorting"],
            tags: ["data-structures", "algorithms"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 3,
            title: "Hands-on Coding Practice",
            moduleType: "coding",
            objective: "Apply fundamental concepts through coding exercises and challenges",
            difficultyLevel: "Easy",
            estimatedHours: 12,
            prerequisites: [1, 2],
            topics: ["Problem Solving", "Code Implementation", "Debugging", "Testing"],
            tags: ["practice", "coding", "exercises"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 4,
            title: "Object-Oriented Programming",
            moduleType: "concept",
            objective: "Master OOP principles including classes, inheritance, and polymorphism",
            difficultyLevel: "Medium",
            estimatedHours: 18,
            prerequisites: [2],
            topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Design Patterns"],
            tags: ["oop", "design-patterns"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 5,
            title: "Build a Real-World Project",
            moduleType: "project",
            objective: "Create a complete application applying all learned concepts",
            difficultyLevel: "Medium",
            estimatedHours: 25,
            prerequisites: [3, 4],
            topics: ["Project Planning", "Implementation", "Testing", "Deployment"],
            tags: ["project", "portfolio", "real-world"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 6,
            title: "Advanced Concepts & Best Practices",
            moduleType: "concept",
            objective: "Explore advanced topics including system design and architecture",
            difficultyLevel: "Hard",
            estimatedHours: 15,
            prerequisites: [4],
            topics: ["System Design", "Architecture", "Performance", "Security"],
            tags: ["advanced", "system-design"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 7,
            title: "Comprehensive Revision",
            moduleType: "revision",
            objective: "Review and consolidate all concepts through quizzes and practice",
            difficultyLevel: "Medium",
            estimatedHours: 10,
            prerequisites: [5, 6],
            topics: ["Concept Review", "Practice Problems", "Mock Tests", "Gap Analysis"],
            tags: ["revision", "review", "consolidation"],
            isBranching: false,
            branchingOptions: []
        },
        {
            moduleId: 8,
            title: "Interview Preparation & Assessment",
            moduleType: "interview",
            objective: "Complete mock interviews and prepare for technical assessments",
            difficultyLevel: "Hard",
            estimatedHours: 15,
            prerequisites: [7],
            topics: ["Technical Interviews", "Behavioral Questions", "System Design", "Live Coding"],
            tags: ["interview", "preparation", "assessment"],
            isBranching: false,
            branchingOptions: []
        }
    ],
    learningPath: {
        foundational: [1, 2, 3],
        intermediate: [4, 5],
        advanced: [6, 7, 8]
    }
};

/**
 * Check rate limiting for a user
 */
const checkRateLimit = (userId) => {
    const userKey = userId.toString();
    const now = Date.now();
    const userLimits = generationRateLimit.get(userKey);

    if (!userLimits) {
        return { allowed: true };
    }

    // Check cooldown
    if (now - userLimits.lastGeneration < GENERATION_COOLDOWN) {
        const waitTime = Math.ceil((GENERATION_COOLDOWN - (now - userLimits.lastGeneration)) / 1000);
        return {
            allowed: false,
            reason: `Please wait ${waitTime} seconds before generating again`
        };
    }

    // Check daily limit
    const today = new Date().toDateString();
    if (userLimits.date === today && userLimits.count >= MAX_GENERATIONS_PER_DAY) {
        return {
            allowed: false,
            reason: `Daily limit of ${MAX_GENERATIONS_PER_DAY} generations reached. Try again tomorrow.`
        };
    }

    return { allowed: true };
};

/**
 * Update rate limit after generation
 */
const updateRateLimit = (userId) => {
    const userKey = userId.toString();
    const now = Date.now();
    const today = new Date().toDateString();
    const existing = generationRateLimit.get(userKey);

    if (existing && existing.date === today) {
        generationRateLimit.set(userKey, {
            lastGeneration: now,
            count: existing.count + 1,
            date: today
        });
    } else {
        generationRateLimit.set(userKey, {
            lastGeneration: now,
            count: 1,
            date: today
        });
    }
};

/**
 * Build the AI prompt for roadmap generation (ultra-concise for reliability)
 */
/**
 * Build the AI prompt for roadmap generation (updated for Phase 1: Dynamic Blueprint)
 */
const buildPrompt = (requirements) => {
    const {
        primaryDomain,
        currentSkillLevel,
        learningGoal,
        preferredLearningStyle
    } = requirements;

    // Scaling Rule
    let minModules = 12;
    let maxModules = 15;

    if (currentSkillLevel.includes('Intermediate')) {
        minModules = 8;
        maxModules = 10;
    } else if (currentSkillLevel.includes('Advanced')) {
        minModules = 5;
        maxModules = 7;
    } else {
        // Beginner or others
        minModules = 12;
        maxModules = 15;
    }

    return `You are a Curriculum Architect. Act as a specialized educator for ${primaryDomain}.

Scaling Rule: If level is '${currentSkillLevel}', generate ${minModules}-${maxModules} modules.
The final module must always be an 'Interview' type.

User Profile:
- Domain: ${primaryDomain}
- Level: ${currentSkillLevel}
- Goal: ${learningGoal}
- LearningStyle: ${preferredLearningStyle}

Generate only the moduleId, title, and objective for each. Do not generate content.
Ensure a logical prerequisite flow. Set the first module to 'active' and all others to 'locked'.

Output format: Strict JSON.
Example structure:
{
  "modules": [
    {
      "moduleId": 1,
      "title": "Module Title",
      "objective": "Clear objective",
      "status": "active"
    },
    ...
  ]
}`;
};

/**
 * Extract and fix JSON from AI response (robust version)
 */
const extractJSON = (text) => {
    try {
        // Step 1: Remove markdown code blocks
        let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

        // Step 2: Remove any leading/trailing whitespace
        cleaned = cleaned.trim();

        // Step 3: Find JSON boundaries
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
            throw new Error('No valid JSON object found');
        }

        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

        // Step 4: Fix common JSON issues

        // Remove trailing commas before closing braces/brackets
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

        // Remove comments (// and /* */)
        cleaned = cleaned.replace(/\/\/.*$/gm, '');
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

        // Fix unterminated strings by finding unmatched quotes
        // This is a simple heuristic - count quotes per line
        const lines = cleaned.split('\n');
        const fixedLines = lines.map(line => {
            // Skip lines that are just structural (braces, brackets)
            if (line.trim().match(/^[{}\[\],]*$/)) return line;

            // Count unescaped quotes
            const quoteCount = (line.match(/(?<!\\)"/g) || []).length;

            // If odd number of quotes, likely unterminated string
            if (quoteCount % 2 !== 0) {
                // Try to close the string before any trailing comma or brace
                if (line.includes(',') && !line.trim().endsWith('"')) {
                    line = line.replace(/,\s*$/, '",');
                } else if (!line.trim().endsWith('"') && !line.trim().endsWith(',')) {
                    line = line.trimEnd() + '"';
                }
            }

            return line;
        });

        cleaned = fixedLines.join('\n');

        // Step 5: Fix missing quotes around property names
        // Match unquoted keys like: moduleId: 1 -> "moduleId": 1
        cleaned = cleaned.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

        // Step 6: Ensure arrays and objects are properly closed
        // Count opening and closing braces/brackets
        const openBraces = (cleaned.match(/\{/g) || []).length;
        const closeBraces = (cleaned.match(/\}/g) || []).length;
        const openBrackets = (cleaned.match(/\[/g) || []).length;
        const closeBrackets = (cleaned.match(/\]/g) || []).length;

        // Add missing closing brackets
        if (openBrackets > closeBrackets) {
            cleaned += ']'.repeat(openBrackets - closeBrackets);
        }

        // Add missing closing braces
        if (openBraces > closeBraces) {
            cleaned += '}'.repeat(openBraces - closeBraces);
        }

        // Step 7: Try to parse - if it fails, return null
        try {
            JSON.parse(cleaned);
            return cleaned;
        } catch (parseError) {
            console.error('JSON parse failed after cleanup:', parseError.message);
            console.error('Problematic JSON snippet:', cleaned.substring(0, 500));
            return null;
        }

    } catch (error) {
        console.error('JSON extraction failed:', error.message);
        return null;
    }
};

/**
 * Validate AI response structure
 */
const validateRoadmapResponse = (data) => {
    const errors = [];

    // Check required fields (relaxed for skeleton)
    if (!data.modules || !Array.isArray(data.modules)) {
        errors.push('Missing or invalid modules array');
        return { valid: false, errors };
    }

    // Check module count (very relaxed - accept 1+ modules)
    if (data.modules.length < 1) {
        errors.push(`Too few modules: ${data.modules.length}`);
    }

    // Validate each module - only require core skeleton fields
    data.modules.forEach((module, index) => {
        if (!module.moduleId) module.moduleId = index + 1;

        if (!module.title || typeof module.title !== 'string') {
            errors.push(`Module ${index + 1}: Missing or invalid title`);
        }

        if (!module.objective || typeof module.objective !== 'string') {
            // If AI forgets objective, we can default it, but better to flag if crucial
            // The user explicitly asked for objective
            errors.push(`Module ${index + 1}: Missing or invalid objective`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Attempt to fix common AI response issues
 */
const fixRoadmapResponse = (data) => {
    // Ensure modules have sequential IDs
    data.modules.forEach((module, index) => {
        module.moduleId = index + 1;
    });

    // Fix missing prerequisites
    data.modules.forEach(module => {
        if (!module.prerequisites || !Array.isArray(module.prerequisites)) {
            module.prerequisites = [];
        }
    });

    // Fix missing topics
    data.modules.forEach(module => {
        if (!module.topics || !Array.isArray(module.topics)) {
            module.topics = [module.moduleType, module.title.split(' ')[0]];
        }
    });

    // Fix missing tags
    data.modules.forEach(module => {
        if (!module.tags || !Array.isArray(module.tags)) {
            module.tags = [];
        }

        // Fill defaults for skeleton generation
        if (!module.moduleType) module.moduleType = 'concept';
        // Make sure last module is interview if not set
        // (logic to check if it's the last one is tricky here, but we can trust the prompt mostly)

        if (!module.difficultyLevel) module.difficultyLevel = 'Medium';
        if (!module.estimatedHours) module.estimatedHours = 10;
        if (module.isBranching === undefined) module.isBranching = false;
        if (!module.branchingOptions) module.branchingOptions = [];
    });

    // Enforce "Interview" type for the last module
    if (data.modules.length > 0) {
        const lastModule = data.modules[data.modules.length - 1];
        if (lastModule.moduleType !== 'interview') {
            lastModule.moduleType = 'interview';
            lastModule.title = lastModule.title.includes('Interview') ? lastModule.title : 'Final Interview & Assessment';
        }
    }

    // Add description if missing
    if (!data.description) {
        data.description = `A personalized learning path with ${data.modules.length} comprehensive modules`;
    }

    // Add totalModules if missing
    if (!data.totalModules) {
        data.totalModules = data.modules.length;
    }

    // Calculate total hours if missing
    if (!data.estimatedTotalHours) {
        data.estimatedTotalHours = data.modules.reduce((sum, m) => sum + (m.estimatedHours || 0), 0);
    }

    // Add learning path if missing
    // Add learning path if missing
    if (!data.learningPath) {
        // Simple sequential path for now, or based on difficulty if available
        data.learningPath = {
            foundational: data.modules.slice(0, Math.floor(data.modules.length / 3)).map(m => m.moduleId),
            intermediate: data.modules.slice(Math.floor(data.modules.length / 3), Math.floor(2 * data.modules.length / 3)).map(m => m.moduleId),
            advanced: data.modules.slice(Math.floor(2 * data.modules.length / 3)).map(m => m.moduleId)
        };
    }

    return data;
};

/**
 * Calculate total estimated hours from modules
 */
const calculateTotalHours = (modules) => {
    return modules.reduce((total, module) => {
        return total + (module.estimatedHours || 0);
    }, 0);
};

/**
 * Generate roadmap blueprint using AI
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Generated roadmap data
 */
/**
 * Generate roadmap blueprint using AI
 * @param {string} userId - User ID
 * @param {Object} requirementsOverride - Optional requirements override (from body)
 * @returns {Promise<Object>} - Generated roadmap data
 */
const generateRoadmapBlueprint = async (userId, requirementsOverride = null) => {
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
    }

    // Fetch user requirements
    // Fetch user requirements or use override
    let requirements;
    if (requirementsOverride) {
        // Map frontend payload keys to service expectations if needed, 
        // but ideally they match 'primaryDomain', 'currentSkillLevel', etc.
        // The user request payload: { domain, level, goal, LearningStyle }
        // The service logic uses: primaryDomain, currentSkillLevel, learningGoal, preferredLearningStyle.
        // So we need to map them if they come from the simplified payload.
        requirements = {
            primaryDomain: requirementsOverride.domain || requirementsOverride.primaryDomain,
            currentSkillLevel: requirementsOverride.level || requirementsOverride.currentSkillLevel,
            learningGoal: requirementsOverride.goal || requirementsOverride.learningGoal,
            preferredLearningStyle: requirementsOverride.LearningStyle || requirementsOverride.preferredLearningStyle,
            // Carry over other potential fields
            ...requirementsOverride
        };
    } else {
        requirements = await RequirementsProfile.findOne({ userId });
        if (!requirements) {
            throw new Error('Requirements profile not found. Please complete your learning preferences first.');
        }
    }

    // Build prompt
    const prompt = buildPrompt(requirements);

    let roadmapData;
    let usedFallback = false;
    let aiProvider = 'none';

    // Try Gemini first
    try {
        // Call Gemini AI with optimized token settings
        console.log('🔄 Calling Gemini AI for roadmap generation...');

        const aiResponse = await callGemini(prompt, {
            temperature: 0.8, // Higher for more complete responses
            maxOutputTokens: 4096, // Maximum for complete generation
            useCache: false,
            responseType: 'json',
            retries: 3 // More retries
        });

        console.log('📥 Received Gemini response, length:', aiResponse.length);

        // The response should already be cleaned by geminiClient
        // But let's validate it
        try {
            roadmapData = JSON.parse(aiResponse);
            console.log('✅ Gemini JSON parsed successfully');
            aiProvider = 'gemini';
        } catch (parseError) {
            console.error('❌ Failed to parse Gemini response:', parseError.message);
            throw new Error('Gemini JSON parsing failed');
        }

        // Validate response structure
        const validation = validateRoadmapResponse(roadmapData);
        if (!validation.valid) {
            console.warn('⚠️ Gemini response validation issues:', validation.errors);

            // Try to fix the response
            roadmapData = fixRoadmapResponse(roadmapData);

            // Re-validate
            const revalidation = validateRoadmapResponse(roadmapData);
            if (!revalidation.valid) {
                console.error('❌ Could not fix Gemini response, trying OpenAI...');
                throw new Error('Gemini validation failed');
            }
        }

        console.log('✅ Gemini roadmap generated successfully with', roadmapData.modules.length, 'modules');

    } catch (geminiError) {
        console.error('❌ Gemini generation failed:', geminiError.message);

        // Try OpenAI as fallback
        try {
            console.log('🔄 Trying OpenAI as fallback...');

            const openaiResponse = await generateRoadmapWithOpenAI(prompt);
            console.log('📥 Received OpenAI response, length:', openaiResponse.length);

            // Parse OpenAI response
            try {
                roadmapData = fixOpenAIJSON(openaiResponse);
                console.log('✅ OpenAI JSON parsed successfully');
                aiProvider = 'openai';
            } catch (parseError) {
                console.error('❌ Failed to parse OpenAI response:', parseError.message);
                throw new Error('OpenAI JSON parsing failed');
            }

            // Validate OpenAI response
            const validation = validateRoadmapResponse(roadmapData);
            if (!validation.valid) {
                console.warn('⚠️ OpenAI response validation issues:', validation.errors);

                // Try to fix
                roadmapData = fixRoadmapResponse(roadmapData);

                // Re-validate
                const revalidation = validateRoadmapResponse(roadmapData);
                if (!revalidation.valid) {
                    console.error('❌ Could not fix OpenAI response, using fallback template');
                    throw new Error('OpenAI validation failed');
                }
            }

            console.log('✅ OpenAI roadmap generated successfully with', roadmapData.modules.length, 'modules');

        } catch (openaiError) {
            console.error('❌ OpenAI generation also failed:', openaiError.message);

            // Use fallback template as last resort
            roadmapData = JSON.parse(JSON.stringify(FALLBACK_TEMPLATE));
            // Use exact user input as title
            roadmapData.pathTitle = requirements.primaryDomain;
            roadmapData.description = `A comprehensive learning journey for ${requirements.primaryDomain}`;

            // Adjust difficulty based on user level
            if (requirements.currentSkillLevel === 'Advanced') {
                roadmapData.modules.forEach(module => {
                    if (module.difficultyLevel === 'Easy') module.difficultyLevel = 'Medium';
                    else if (module.difficultyLevel === 'Medium') module.difficultyLevel = 'Hard';
                });
            } else if (requirements.currentSkillLevel === 'Absolute Beginner') {
                roadmapData.modules.forEach(module => {
                    if (module.difficultyLevel === 'Hard') module.difficultyLevel = 'Medium';
                });
            }

            usedFallback = true;
            aiProvider = 'fallback';
            console.log('✅ Using fallback template with', roadmapData.modules.length, 'modules');
        }
    }

    // Calculate total hours (safe check)
    if (roadmapData && roadmapData.modules && Array.isArray(roadmapData.modules)) {
        roadmapData.estimatedTotalHours = calculateTotalHours(roadmapData.modules);
    } else {
        console.error('❌ Invalid roadmapData structure');
        roadmapData = JSON.parse(JSON.stringify(FALLBACK_TEMPLATE));
        roadmapData.estimatedTotalHours = calculateTotalHours(roadmapData.modules);
        usedFallback = true;
    }

    // Update rate limiting
    updateRateLimit(userId);

    return {
        ...roadmapData,
        usedFallback,
        aiProvider // 'gemini', 'openai', or 'fallback'
    };
};

module.exports = {
    generateRoadmapBlueprint,
    validateRoadmapResponse,
    checkRateLimit,
    FALLBACK_TEMPLATE
};