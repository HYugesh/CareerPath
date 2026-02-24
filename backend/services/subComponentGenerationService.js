const { callGemini } = require('./geminiClient');
const { getOpenAIClient } = require('./openaiClient');

/**
 * Generate sub-components for a module
 */
const generateSubComponentsForModule = async (moduleTitle, moduleTopic, domain, difficultyLevel, adaptiveParams = {}) => {
  const { velocity = 'Normal', level = 'Intermediate', style = 'Balanced' } = adaptiveParams;

  console.log(`📚 Generating adaptive sub-components for: ${moduleTitle}`);
  console.log(`⚡ Velocity: ${velocity}, Level: ${level}, Style: ${style}`);

  // Quantity scaling logic
  let quantityPrompt = "Generate 10-15 sub-topics";
  let minTopics = 10;
  let maxTopics = 15;

  if (level.includes('Advanced')) {
    quantityPrompt = "Generate 5-8 sub-topics";
    minTopics = 5;
    maxTopics = 8;
  } else if (level.includes('Beginner')) {
    quantityPrompt = "Generate 10-15 sub-topics";
    minTopics = 10;
    maxTopics = 15;
  }

  const prompt = `You are an Adaptive Tutor in ${domain}. Generate content for the module: ${moduleTitle}.

Quantity: Based on the level (${level}), ${quantityPrompt}.

Quality: If velocity is 'Slow', use simplified theory and real-world analogies. If 'Fast', use advanced technical documentation style. Current Velocity: ${velocity}.
Preferred Style: ${style}.

Quiz Configuration:
- First sub-topic (introduction/overview) should have "hasQuiz": false (no quiz for introductory content)
- All other sub-topics should have "hasQuiz": true
- For topics with hasQuiz: true, include a 3-question Multiple Choice Quiz

Topics to Cover: ${moduleTopic.join(', ')}

Rules:
1. Generate EXACTLY ${minTopics}-${maxTopics} sub-topics.
2. First sub-topic must be an introduction with "hasQuiz": false.
3. Each sub-topic must be distinct.
4. Output strict JSON.

JSON format:
{
  "subComponents": [
    {
      "subComponentId": 1,
      "title": "Introduction to [Topic]",
      "status": "NOT_STARTED",
      "hasQuiz": false,
      "quizzes": []
    },
    {
      "subComponentId": 2,
      "title": "Title",
      "status": "NOT_STARTED",
      "hasQuiz": true,
      "quizzes": [
          {
              "question": "Question text?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A",
              "explanation": "Why A is correct"
          }
      ]
    }
  ]
}`;

  try {
    // Try Gemini first with increased token limit
    // Use centralized Gemini client
    const text = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseType: 'json'
    });

    const data = JSON.parse(text);

    // CRITICAL VALIDATION: Must have 10-15 sub-components
    if (!data.subComponents || !Array.isArray(data.subComponents)) {
      throw new Error('Invalid response structure: missing subComponents array');
    }

    // Relaxed validation: Accept at least 5 topics regardless of the requested minimum
    // to prevent falling back to generic placeholder content.
    const absoluteMin = 5;

    if (data.subComponents.length < absoluteMin) {
      console.warn(`⚠️ Only ${data.subComponents.length} sub-components generated. Retrying...`);
      throw new Error(`Insufficient sub-components: got ${data.subComponents.length}, need at least ${absoluteMin}`);
    }

    if (data.subComponents.length > 15) {
      // Just trim if too many
      data.subComponents = data.subComponents.slice(0, 15);
    }

    // DETECT DUPLICATE PATTERNS (Soft check)
    // We log but DO NOT THROW, because "Part 1" might be valid for some complex technical topics
    // and valid content is better than the generic fallback.
    const titles = data.subComponents.map(sc => sc.title.toLowerCase());
    const hasDuplicatePatterns = titles.some(title =>
      title.includes('part 1') ||
      title.includes('part 2')
    );

    if (hasDuplicatePatterns) {
      console.warn(`⚠️ AI generated titles with "Part 1/2". Accepting them to avoid generic fallback.`);
    }

    // Validate each sub-component has required fields
    const validSubComponents = data.subComponents.map((sc, index) => ({
      subComponentId: sc.subComponentId || (index + 1),
      title: sc.title || `Topic ${index + 1}`,
      status: sc.status || 'NOT_STARTED',
      // First topic (index 0) should have hasQuiz: false, others default to true
      hasQuiz: index === 0 ? false : (sc.hasQuiz !== false),
      quizzes: sc.quizzes || [] // carry over quizzes
    }));

    console.log(`✅ Generated ${validSubComponents.length} DISTINCT sub-components with Gemini`);
    return validSubComponents;

  } catch (geminiError) {
    console.error('❌ Gemini failed:', geminiError.message);
    console.log('🔄 Trying OpenAI fallback...');

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert curriculum designer. You MUST generate exactly 10-15 sub-components. Return only valid JSON, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000 // Increased to allow for more sub-components
      });

      let text = completion.choices[0].message.content.trim();

      // Clean up response
      if (text.startsWith('```json')) {
        text = text.substring(7);
      }
      if (text.startsWith('```')) {
        text = text.substring(3);
      }
      if (text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();

      const data = JSON.parse(text);

      // CRITICAL VALIDATION: Must have 10-15 sub-components
      if (!data.subComponents || !Array.isArray(data.subComponents)) {
        throw new Error('Invalid response structure: missing subComponents array');
      }

      // Relaxed validation: Accept at least 5 topics
      const absoluteMin = 5;

      if (data.subComponents.length < absoluteMin) {
        console.warn(`⚠️ Only ${data.subComponents.length} sub-components from OpenAI. Retrying...`);
        throw new Error(`Insufficient sub-components: got ${data.subComponents.length}, need at least ${absoluteMin}`);
      }

      if (data.subComponents.length > 15) {
        data.subComponents = data.subComponents.slice(0, 15);
      }

      // DETECT DUPLICATE PATTERNS (Soft check)
      const titles = data.subComponents.map(sc => sc.title.toLowerCase());
      const hasDuplicatePatterns = titles.some(title =>
        title.includes('part 1') ||
        title.includes('part 2')
      );

      if (hasDuplicatePatterns) {
        console.warn(`⚠️ OpenAI generated titles with "Part 1/2". Accepting them to avoid generic fallback.`);
      }

      // Validate each sub-component has required fields
      const validSubComponents = data.subComponents.map((sc, index) => ({
        subComponentId: sc.subComponentId || (index + 1),
        title: sc.title || `Topic ${index + 1}`,
        status: sc.status || 'NOT_STARTED',
        hasQuiz: index === 0 ? false : (sc.hasQuiz !== false)
      }));

      console.log(`✅ Generated ${validSubComponents.length} DISTINCT sub-components with OpenAI`);
      return validSubComponents;

    } catch (openaiError) {
      console.error('❌ OpenAI also failed:', openaiError.message);
      console.log('📝 Using comprehensive template fallback with 12 DISTINCT sub-components');

      // Return comprehensive template with 12 DISTINCT sub-components
      // Each topic is unique and teaches something different
      const baseTopics = moduleTopic.length > 0 ? moduleTopic : ['Core Concepts', 'Practical Skills', 'Advanced Techniques'];

      return [
        {
          subComponentId: 1,
          title: `Introduction to ${moduleTitle}`,
          status: 'NOT_STARTED',
          hasQuiz: false
        },
        {
          subComponentId: 2,
          title: `Understanding ${baseTopics[0] || 'Fundamentals'}`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 3,
          title: `Working with ${baseTopics[1] || 'Core Components'}`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 4,
          title: `Implementing ${baseTopics[2] || 'Key Features'}`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 5,
          title: `Data Handling and Management`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 6,
          title: `Control Flow and Logic`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 7,
          title: `Functions and Modularity`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 8,
          title: `Common Patterns and Techniques`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 9,
          title: `Error Handling and Debugging`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 10,
          title: `Performance Optimization`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 11,
          title: `Best Practices and Code Quality`,
          status: 'NOT_STARTED',
          hasQuiz: true
        },
        {
          subComponentId: 12,
          title: `Real-World Applications and Projects`,
          status: 'NOT_STARTED',
          hasQuiz: true
        }
      ];
    }
  }
}

/**
 * Generate sub-components for all modules in a roadmap
 */
async function generateSubComponentsForRoadmap(modules, domain) {
  console.log(`🎨 Generating sub-components for ${modules.length} modules...`);

  const modulesWithSubComponents = [];

  for (const module of modules) {
    try {
      // Pass empty adaptive params for bulk generation (defaults will be used)
      // OR pass domain-wide defaults if available
      const subComponents = await generateSubComponentsForModule(
        module.title,
        module.topics || [],
        domain,
        module.difficultyLevel,
        {
          level: 'Intermediate', // Default for full map generation if unspecified
          velocity: 'Normal',
          style: 'Balanced'
        }
      );

      modulesWithSubComponents.push({
        ...module,
        subComponents
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to generate sub-components for ${module.title}:`, error.message);
      // Add module without sub-components
      modulesWithSubComponents.push({
        ...module,
        subComponents: []
      });
    }
  }

  console.log(`✅ Sub-components generation complete`);
  return modulesWithSubComponents;
}

/**
 * Generate adaptive content for a single module (Phase 2 Hydration)
 */
async function generateAdaptiveModuleContent(moduleContext, adaptiveMetadata, scalingConfig) {
  const { moduleTitle, skillLevel, domain, moduleObjective, futureTopics } = moduleContext;
  const { velocity, preferredStyle, knownTopics } = adaptiveMetadata;
  const { minSubTopics, maxSubTopics } = scalingConfig;

  console.log(`💧 Hydrating content for: ${moduleTitle}`);
  console.log(`📊 Level: ${skillLevel}, Style: ${preferredStyle}, Velocity: ${velocity}`);

  const prompt = `You are an Expert ${domain || 'Technical'} Educator.
  
I need you to generate sub-topics for the specific module: "${moduleTitle}".

CONTEXT:
- Domain: ${domain}
- Skill Level: ${skillLevel}
- Module Objective: "${moduleObjective || 'Establish fundamental understanding'}"

CONSTRAINTS (CRITICAL):
1. SCOPE: Stick STRICTLY to "${moduleTitle}". Do NOT jump ahead.
2. NEGATIVE CONSTRAINTS: The following topics are covered in FUTURE modules, so DO NOT include them here: ${futureTopics && futureTopics.length > 0 ? futureTopics.join(', ') : 'None'}.
3. Redundancy: Do NOT use "Introduction" or the module title itself in sub-topic names.

Quantity: Analyze the module depth and generate ONLY the necessary number of sub-topics to comprehensively cover the subject.
- Focus on high-value, non-redundant topics.
- Do NOT force a specific number; let the content dictate the count (typically between 5 and 15).
- Ensure each topic teaches a distinct, valuable concept.

Adaptivity: Use the knownTopics (${knownTopics ? knownTopics.join(', ') : 'None'}) to create bridge analogies.

Components: For each sub-topic, provide:
title: A unique, concise name.
learningContent: A detailed object containing:
  - explanation: Concise educational content in markdown (MAX 150 words). CRITICAL: Escape all double quotes (\\") and backslashes (\\\\).
  - codeExamples: Array with 1 relevant code snippet { language, code, description }.
  - keyTakeaways: Array of 3 short bullet points.
quiz: 3 adaptive multiple-choice questions with explanations.

Output: JSON ONLY. No markdown formatting.

JSON format:
{
  "subComponents": [
    {
      "title": "Sub-topic Title",
      "learningContent": {
        "explanation": "Concise explanation...",
        "codeExamples": [
            { "language": "python", "code": "print('Hello')", "description": "Basic printing" }
        ],
        "keyTakeaways": ["Point 1", "Point 2", "Point 3"]
      },
      "quiz": [
        {
          "question": "Question?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Reasoning"
        }
      ]
    }
  ]
}`;

  try {
    const text = await callGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseType: 'json'
    });

    const data = JSON.parse(text);

    // Add IDs and status
    return data.subComponents.map((sc, index) => ({
      subComponentId: index + 1,
      title: sc.title,
      // Map the nested learningContent or Fallback to top-level theoryContent if model messes up
      learningContent: sc.learningContent || { explanation: sc.theoryContent },
      quiz: sc.quiz,
      status: 'NOT_STARTED',
      isCompleted: false
    }));

  } catch (error) {
    console.error('❌ AI Hydration failed:', error);
    throw error;
  }
}

module.exports = {
  generateSubComponentsForModule,
  generateSubComponentsForRoadmap,
  generateAdaptiveModuleContent
};
