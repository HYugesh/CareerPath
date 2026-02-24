const { initializeClient } = require('./geminiClient');
const { getOpenAIClient } = require('./openaiClient');

/**
 * Generate detailed narrative content for a sub-component using AI
 * Produces 800-1000 word professional content WITHOUT lists
 */
async function generateSubComponentContent(subComponentTitle, moduleTitle, domain, difficultyLevel = 'Medium') {
  console.log(`📚 Generating professional narrative content for: ${subComponentTitle}`);
  console.log(`📖 Module: ${moduleTitle}, Domain: ${domain}, Level: ${difficultyLevel}`);

  // Detect if topic requires code examples (functional/logic topics)
  const requiresCode = /loop|function|method|class|syntax|statement|variable|array|object|implement|code|program|algorithm|data structure/i.test(subComponentTitle);
  const codeRequirement = requiresCode ? '\n\n[REQUIREMENT: INJECT_FULL_CODE_BLOCKS - This topic requires comprehensive code examples with Syntax Analysis section]' : '';

  const prompt = `You are a Professional Technical Content Writer creating educational content for ${domain}. Write comprehensive, well-structured content for: "${subComponentTitle}".

Context: Module "${moduleTitle}" | Difficulty: ${difficultyLevel}

IMPORTANT: Generate ORIGINAL content about "${subComponentTitle}" - DO NOT copy the React Virtual DOM example. The example below shows the STRUCTURE/FORMAT to follow, but you must write about "${subComponentTitle}" specifically.

CONTENT STRUCTURE (800-1000 words):

1. OPENING PARAGRAPH (100-150 words):
   Start with a compelling introduction that explains WHY "${subComponentTitle}" matters in ${domain}. Connect it to real-world development challenges. Set the context for what the reader will learn.
   
   STRUCTURE EXAMPLE (write about YOUR topic, not React):
   "Debugging React applications, particularly when dealing with performance issues, often hinges on understanding how the Virtual DOM works..."
   
   YOUR TASK: Write a similar opening about "${subComponentTitle}" in ${domain}.

2. MAIN CONCEPT EXPLANATION (200-300 words):
   Use a bold header followed by a colon about YOUR topic.
   Format: **Understanding [Your Topic]:**
   
   Explain the core concept of "${subComponentTitle}" in depth. Use technical language appropriately. Break down complex ideas into clear paragraphs.

3. KEY FEATURES/COMPONENTS (200-300 words):
   Introduce the features with a descriptive sentence, then use bullet points:
   
   • **Feature Name:** Detailed explanation (2-3 sentences minimum)
   • **Another Feature:** Technical details with examples
   • **Third Feature:** How it works in practice
   
   Write about the actual features of "${subComponentTitle}", not React features.

4. CODE EXAMPLE (150-200 words):
   Bold header: **Example:**
   
   Provide a realistic, working code example demonstrating "${subComponentTitle}" in ${domain}:
   - Use appropriate language for ${domain}
   - Include inline comments
   - Explain what the code demonstrates
   - Break down what happens when it runs

5. TECHNICAL BREAKDOWN (100-150 words):
   Explain the technical details or process step-by-step for "${subComponentTitle}".
   Use bold text for technical terms when first introduced.

6. CONCLUSION (100-150 words):
   Bold header: **Conclusion:**
   
   Summarize the key takeaways about "${subComponentTitle}". Emphasize practical applications in ${domain}.

CRITICAL RULES:
- Write about "${subComponentTitle}" specifically - NOT about React Virtual DOM
- Follow the STRUCTURE shown in examples, but with YOUR OWN content
- Use technical terminology appropriate for ${domain}
- Include working code examples relevant to "${subComponentTitle}"
- 800-1000 words total
- Professional, authoritative tone

FORMATTING REQUIREMENTS:
- Use **bold** for section headers with colons
- Use bullet points (•) for feature lists
- Use numbered lists (1., 2., 3.) for sequential steps
- Use code blocks with proper language tags for ${domain}
- Use inline \`code\` for technical terms${codeRequirement}

STRUCTURE REFERENCE (Follow this format, but write about "${subComponentTitle}"):

The examples below show the STRUCTURE to follow. Generate similar content about "${subComponentTitle}", NOT about React Virtual DOM.

✅ Opening Paragraph Structure:
"[Topic] is crucial for [domain] developers, particularly when [common challenge]. [Brief explanation of what it is]. [Why it matters]. [What reader will learn]."

Example (DO NOT COPY - just follow this structure):
"Debugging React applications, particularly when dealing with performance issues, often hinges on understanding how the Virtual DOM works..."

✅ Bold Header Structure:
**Understanding [Your Topic]:**

[Explanation paragraph 1]
[Explanation paragraph 2]

✅ Bullet Points Structure:
[Introductory sentence about features]

• **[Feature Name]:** [2-3 sentence explanation of this feature]

• **[Another Feature]:** [2-3 sentence explanation]

• **[Third Feature]:** [2-3 sentence explanation]

✅ Code Example Structure:
**Example:**

[Brief context about what this code demonstrates]

\`\`\`[language]
// Code with inline comments
// Explaining key parts
\`\`\`

[Explanation of what happens when code runs]

✅ Conclusion Structure:
**Conclusion:**

[Summary of key points]. [Practical applications]. [Connection to broader concepts]. [Final takeaway].

RETURN FORMAT - Valid JSON (no markdown blocks):
{
  "learningContent": {
    "explanation": "800-1000 word professional content. Use \\n\\n for paragraphs. Use **bold** for headers. Use bullet points (•) for lists. Include code blocks with proper formatting.",
    "contentSummary": "150-200 word summary for quiz generation covering key concepts and technical details.",
    "codeExamples": [
      {
        "language": "javascript",
        "code": "// Complete, working code example\\nimport React, { useState } from 'react';\\n\\nfunction Example() {\\n  const [value, setValue] = useState(0);\\n  \\n  return (\\n    <div>\\n      <p>Value: {value}</p>\\n      <button onClick={() => setValue(value + 1)}>\\n        Increment\\n      </button>\\n    </div>\\n  );\\n}\\n\\nexport default Example;",
        "description": "A practical example demonstrating the core concept with state management and user interaction"
      },
      {
        "language": "javascript",
        "code": "// Advanced example with optimization\\nimport React, { useState, useCallback, memo } from 'react';\\n\\nconst ChildComponent = memo(({ onClick }) => {\\n  console.log('Child rendered');\\n  return <button onClick={onClick}>Click</button>;\\n});\\n\\nfunction ParentComponent() {\\n  const [count, setCount] = useState(0);\\n  \\n  // Memoize callback to prevent unnecessary re-renders\\n  const handleClick = useCallback(() => {\\n    setCount(c => c + 1);\\n  }, []);\\n  \\n  return (\\n    <div>\\n      <p>Count: {count}</p>\\n      <ChildComponent onClick={handleClick} />\\n    </div>\\n  );\\n}\\n\\nexport default ParentComponent;",
        "description": "Advanced example showing performance optimization techniques using memo and useCallback to prevent unnecessary re-renders"
      }
    ],
    "keyTakeaways": [
      "First key concept with technical depth and practical application context",
      "Second important principle explaining the underlying mechanism",
      "Third critical understanding about performance implications",
      "Fourth practical insight about real-world usage patterns",
      "Fifth advanced consideration for production applications",
      "Sixth best practice with specific implementation guidance",
      "Seventh connection to related concepts in the ecosystem"
    ],
    "commonMistakes": [
      "First common mistake: Detailed explanation of what causes it, symptoms to watch for, and specific steps to fix it with code examples",
      "Second pitfall: Context about when this occurs, why it's problematic, and the correct approach with technical details",
      "Third error: Explanation of the root cause, impact on application behavior, and step-by-step correction strategy",
      "Fourth misconception: Clarification of the proper understanding with examples of correct vs incorrect usage",
      "Fifth anti-pattern: Guidance on better alternatives with performance benchmarks and industry best practices"
    ]
  },
  "externalResources": {
    "videos": [
      {
        "title": "Comprehensive tutorial on the topic",
        "url": "https://youtube.com/watch?v=example",
        "duration": "18:45",
        "platform": "YouTube"
      }
    ],
    "articles": [
      {
        "title": "In-depth technical article",
        "url": "https://blog.example.com/article",
        "source": "Official Blog"
      }
    ],
    "officialDocs": [
      {
        "title": "Official documentation reference",
        "url": "https://docs.example.com/topic",
        "section": "Core Concepts"
      }
    ]
  },
  "practiceExercise": {
    "question": "Build a practical application that demonstrates mastery of ${subComponentTitle}. Requirements: [specific technical requirements]. Expected behavior: [detailed description]. Constraints: [performance or technical constraints].",
    "hints": [
      "Consider the underlying mechanism and how it affects your implementation approach",
      "Think about edge cases and how the system handles unexpected inputs",
      "Review the performance implications of different implementation strategies",
      "Test your solution with various scenarios to ensure robustness"
    ],
    "solution": "Complete implementation with detailed comments explaining each decision, performance considerations, and alternative approaches. Include complexity analysis and production-ready error handling."
  }
}

Now generate professional technical content for: "${subComponentTitle}"

Remember:
- Start with compelling introduction explaining WHY it matters
- Use **bold headers** with colons for sections
- Use bullet points (•) for technical feature lists
- Include detailed code examples with comments
- Explain technical mechanisms in depth
- 800-1000 words total
- Professional, authoritative tone`;

  try {
    // Try Gemini first with professional content configuration
    const genAI = initializeClient();
    
    if (!genAI) {
      throw new Error('Gemini client not available - check API key');
    }
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const response = result.response;
    if (!response) {
      throw new Error('No response from Gemini');
    }
    
    let text = response.text();
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    console.log('📥 Raw response from Gemini (first 200 chars):', text.substring(0, 200));

    // Clean up response
    text = text.trim();
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

    const content = JSON.parse(text);
    
    // Validate content structure
    if (!content.learningContent || !content.learningContent.explanation) {
      throw new Error('Invalid content structure: missing explanation');
    }

    // Check word count (approximate)
    const wordCount = content.learningContent.explanation.split(/\s+/).length;
    console.log(`✅ Content generated successfully. Word count: ${wordCount}`);
    
    if (wordCount < 700) {
      console.warn(`⚠️ Content is shorter than expected (${wordCount} words). Consider regenerating.`);
    }

    return content;

  } catch (geminiError) {
    console.error('❌ Gemini failed:', geminiError.message);
    console.error('Full error:', geminiError);
    console.log('🔄 Trying OpenAI fallback...');

    try {
      const openai = getOpenAIClient();
      
      if (!openai) {
        throw new Error('OpenAI client not available');
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Professional Technical Content Writer. Generate ORIGINAL content about the specific topic provided. Return only valid JSON, no markdown formatting. Use bullet points and bold headers for professional technical content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
      });

      if (!completion || !completion.choices || !completion.choices[0]) {
        throw new Error('Invalid response from OpenAI');
      }

      let text = completion.choices[0].message.content.trim();
      
      if (!text) {
        throw new Error('Empty response from OpenAI');
      }
      
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

      const content = JSON.parse(text);
      
      // Validate content structure
      if (!content.learningContent || !content.learningContent.explanation) {
        throw new Error('Invalid content structure from OpenAI: missing explanation');
      }
      
      const wordCount = content.learningContent?.explanation?.split(/\s+/).length || 0;
      console.log(`✅ Content generated with OpenAI. Word count: ${wordCount}`);
      
      return content;

    } catch (openaiError) {
      console.error('❌ OpenAI also failed:', openaiError.message);
      console.error('Full error:', openaiError);
      console.log('📝 Using enhanced template fallback');

      // Return professional technical template content
      return {
        learningContent: {
          explanation: `${subComponentTitle} is a critical concept in ${domain} that directly impacts how developers build and optimize applications. Understanding this topic is essential for writing efficient, maintainable code and avoiding common performance pitfalls. This comprehensive guide will walk you through the core mechanisms, practical applications, and best practices for mastering ${subComponentTitle}.\n\n**Understanding ${subComponentTitle}:**\n\nThe fundamental principle behind ${subComponentTitle} lies in its approach to solving common challenges in ${moduleTitle}. When working with modern ${domain} applications, developers frequently encounter situations where traditional approaches fall short. ${subComponentTitle} addresses these limitations through a sophisticated mechanism that balances performance with developer experience.\n\nAt its core, ${subComponentTitle} operates by maintaining an optimized internal representation of your application's state. Instead of directly manipulating expensive operations, it creates an efficient intermediate layer. When changes occur in your application, the system doesn't immediately execute costly updates. Instead, it performs a series of intelligent comparisons to determine the minimal set of operations required.\n\nThe algorithm behind ${subComponentTitle} uses several key optimizations. It doesn't perform brute-force comparisons of every element. Instead, it leverages the structural properties of your code to make intelligent decisions about what needs updating. This approach significantly reduces computational overhead while maintaining correctness.\n\n**Key Features and Mechanisms:**\n\nThe implementation of ${subComponentTitle} incorporates several sophisticated features that work together to provide optimal performance:\n\n• **Intelligent Comparison:** The system compares structural elements efficiently. It starts at the top level and recursively examines nested components. If fundamental types have changed, it replaces entire sections rather than attempting granular updates. This prevents unnecessary work while ensuring correctness.\n\n• **Optimization Through Identification:** When working with collections of elements, providing unique identifiers is crucial for performance. The system uses these identifiers to track changes efficiently. If an identifier remains constant, the system attempts to reuse existing resources and update only what's necessary. Changes or removals of identifiers trigger appropriate additions or deletions, leading to optimal performance.\n\n• **Lifecycle Integration:** While the core algorithm operates behind the scenes, developers can leverage lifecycle hooks to further optimize behavior. Methods like shouldComponentUpdate and getDerivedStateFromProps allow selective prevention of unnecessary operations, giving you fine-grained control over performance characteristics.\n\n• **Batching and Scheduling:** Modern implementations batch multiple updates together and schedule them intelligently. Rather than executing every change immediately, the system groups related updates and processes them in an optimized order. This batching significantly improves performance in applications with frequent state changes.\n\n**Example:**\n\nConsider a practical implementation that demonstrates these concepts:\n\nIn this example, we create a component that manages internal state. When user interactions trigger state changes, the system creates a new representation based on the updated values. The comparison algorithm identifies that only specific text content has changed, not the overall structure. It efficiently updates only the affected portions, avoiding unnecessary manipulation of unchanged elements. This targeted approach is considerably faster than replacing entire sections of the interface.\n\n**Debugging and Optimization:**\n\nDebugging performance issues often involves identifying unnecessary operations. Professional development tools provide invaluable insights into what's happening behind the scenes:\n\n1. **Profiling Tools:** These tools allow you to identify performance bottlenecks by showing which components update most frequently and how much time each operation takes. This helps pinpoint areas that need optimization.\n\n2. **Inspection Capabilities:** Although you can't directly observe the internal representation, developer tools provide views of the component tree, props, and state. By examining these, you can deduce how the internal mechanisms are changing and identify potential sources of inefficiency.\n\n3. **Performance Monitoring:** Modern frameworks include built-in performance monitoring that highlights slow operations. These warnings help you identify components that might benefit from optimization techniques like memoization or lazy loading.\n\n**Best Practices:**\n\nTo maximize the benefits of ${subComponentTitle}, follow these industry-standard practices:\n\nAlways provide stable, unique identifiers when rendering lists of elements. This enables the system to track changes efficiently and reuse existing resources when possible. Avoid using array indices as identifiers, as they can lead to incorrect behavior when list order changes.\n\nLeverage memoization techniques to prevent unnecessary recalculations. When components receive the same props, memoization allows the system to skip redundant operations entirely. This is particularly valuable for expensive computations or complex rendering logic.\n\nStructure your application to minimize the scope of updates. When state changes affect only a small portion of your interface, ensure that only the relevant components re-render. This isolation prevents cascading updates that can degrade performance.\n\nUse profiling tools regularly during development to catch performance issues early. Don't wait until production to discover that certain operations are slower than expected. Proactive profiling helps you build performant applications from the start.\n\n**Conclusion:**\n\nMastering ${subComponentTitle} is essential for building high-performance ${domain} applications. By understanding the underlying mechanisms, leveraging optimization techniques, and following best practices, you can create applications that remain responsive even under heavy load. The key principles—intelligent comparison, efficient identification, lifecycle integration, and strategic batching—work together to provide the performance characteristics modern applications demand. Remember that minimizing unnecessary operations is fundamental to achieving optimal performance, and the tools and techniques discussed here will help you identify and resolve performance bottlenecks effectively.`,
          contentSummary: `${subComponentTitle} is a fundamental optimization technique in ${domain} that improves application performance through intelligent comparison and minimal updates. Key concepts include the internal representation mechanism, efficient comparison algorithms, unique identification for tracking changes, lifecycle integration for fine-grained control, and batching strategies for grouping updates. Understanding these mechanisms enables developers to write performant code, debug performance issues effectively, and apply best practices like memoization and component isolation. Critical assessment points include explaining the core algorithm, identifying appropriate use cases, recognizing optimization opportunities, and applying profiling tools to measure and improve performance.`,
          codeExamples: [
            {
              language: domain.toLowerCase().includes('python') ? 'python' : domain.toLowerCase().includes('java') ? 'java' : 'javascript',
              code: domain.toLowerCase().includes('python')
                ? `# Example demonstrating ${subComponentTitle}\n# This shows the fundamental concept in action\n\nclass Component:\n    def __init__(self):\n        self.state = {'count': 0}\n    \n    def update_state(self, new_value):\n        # Update internal state\n        self.state['count'] = new_value\n        # Trigger efficient update mechanism\n        self.render()\n    \n    def render(self):\n        # Render based on current state\n        print(f"Current count: {self.state['count']}")\n\n# Usage\ncomponent = Component()\ncomponent.update_state(5)\n# Output: Current count: 5`
                : domain.toLowerCase().includes('java')
                ? `// Example demonstrating ${subComponentTitle}\n// This shows the fundamental concept in action\n\npublic class Component {\n    private int count = 0;\n    \n    public void updateState(int newValue) {\n        // Update internal state\n        this.count = newValue;\n        // Trigger efficient update mechanism\n        render();\n    }\n    \n    private void render() {\n        // Render based on current state\n        System.out.println("Current count: " + count);\n    }\n    \n    public static void main(String[] args) {\n        Component component = new Component();\n        component.updateState(5);\n        // Output: Current count: 5\n    }\n}`
                : `// Example demonstrating ${subComponentTitle}\n// This shows the fundamental concept in action\n\nimport React, { useState } from 'react';\n\nfunction Component() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Current count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nexport default Component;\n// When button is clicked, only the text content updates\n// The structure remains unchanged, enabling efficient updates`,
              description: `Basic example demonstrating how ${subComponentTitle} works in practice. Notice how state changes trigger efficient updates that modify only what's necessary.`
            },
            {
              language: domain.toLowerCase().includes('python') ? 'python' : domain.toLowerCase().includes('java') ? 'java' : 'javascript',
              code: domain.toLowerCase().includes('python')
                ? `# Advanced example with optimization\n# Demonstrates performance best practices\n\nfrom functools import lru_cache\n\nclass OptimizedComponent:\n    def __init__(self):\n        self.state = {'items': []}\n    \n    @lru_cache(maxsize=128)\n    def expensive_calculation(self, value):\n        # Simulate expensive operation\n        return value ** 2\n    \n    def add_item(self, item):\n        # Use unique identifiers for efficient tracking\n        new_item = {'id': len(self.state['items']), 'value': item}\n        self.state['items'].append(new_item)\n        self.render()\n    \n    def render(self):\n        for item in self.state['items']:\n            result = self.expensive_calculation(item['value'])\n            print(f"Item {item['id']}: {result}")\n\n# Usage with optimization\ncomponent = OptimizedComponent()\ncomponent.add_item(5)\ncomponent.add_item(10)\n# Expensive calculations are cached for efficiency`
                : domain.toLowerCase().includes('java')
                ? `// Advanced example with optimization\n// Demonstrates performance best practices\n\nimport java.util.*;\n\npublic class OptimizedComponent {\n    private List<Item> items = new ArrayList<>();\n    private Map<Integer, Integer> cache = new HashMap<>();\n    \n    static class Item {\n        int id;\n        int value;\n        \n        Item(int id, int value) {\n            this.id = id;\n            this.value = value;\n        }\n    }\n    \n    private int expensiveCalculation(int value) {\n        // Use caching for expensive operations\n        return cache.computeIfAbsent(value, v -> v * v);\n    }\n    \n    public void addItem(int value) {\n        // Use unique identifiers for efficient tracking\n        Item item = new Item(items.size(), value);\n        items.add(item);\n        render();\n    }\n    \n    private void render() {\n        for (Item item : items) {\n            int result = expensiveCalculation(item.value);\n            System.out.println("Item " + item.id + ": " + result);\n        }\n    }\n}`
                : `// Advanced example with optimization\n// Demonstrates performance best practices\n\nimport React, { useState, useMemo, useCallback, memo } from 'react';\n\n// Memoized child component prevents unnecessary re-renders\nconst ListItem = memo(({ item, onUpdate }) => {\n  console.log('Rendering item:', item.id);\n  return (\n    <li>\n      {item.value}\n      <button onClick={() => onUpdate(item.id)}>Update</button>\n    </li>\n  );\n});\n\nfunction OptimizedList() {\n  const [items, setItems] = useState([\n    { id: 1, value: 'First' },\n    { id: 2, value: 'Second' }\n  ]);\n  \n  // Memoize expensive calculation\n  const processedItems = useMemo(() => {\n    console.log('Processing items...');\n    return items.map(item => ({\n      ...item,\n      processed: item.value.toUpperCase()\n    }));\n  }, [items]);\n  \n  // Memoize callback to prevent child re-renders\n  const handleUpdate = useCallback((id) => {\n    setItems(prev => prev.map(item =>\n      item.id === id\n        ? { ...item, value: item.value + '!' }\n        : item\n    ));\n  }, []);\n  \n  return (\n    <ul>\n      {processedItems.map(item => (\n        <ListItem\n          key={item.id}\n          item={item}\n          onUpdate={handleUpdate}\n        />\n      ))}\n    </ul>\n  );\n}\n\nexport default OptimizedList;\n// Uses memo, useMemo, and useCallback for optimal performance`,
              description: `Advanced example showing performance optimization techniques. Notice the use of memoization to prevent unnecessary recalculations and re-renders. The unique key prop enables efficient tracking of list changes.`
            }
          ],
          keyTakeaways: [
            `${subComponentTitle} optimizes ${domain} applications through intelligent comparison and minimal updates, significantly improving performance`,
            `The core algorithm uses structural analysis rather than brute-force comparison, making it highly efficient even for complex applications`,
            `Providing unique, stable identifiers when rendering collections is crucial for enabling efficient change tracking and resource reuse`,
            `Lifecycle methods and hooks provide fine-grained control over update behavior, allowing developers to prevent unnecessary operations`,
            `Batching and scheduling strategies group related updates together, reducing overhead and improving overall application responsiveness`,
            `Profiling tools and performance monitoring are essential for identifying bottlenecks and verifying that optimizations are effective`,
            `Best practices like memoization, component isolation, and strategic use of keys are fundamental to building high-performance applications`
          ],
          commonMistakes: [
            `Using array indices as keys when rendering lists: This causes incorrect behavior when list order changes because the system can't properly track which elements moved. Always use stable, unique identifiers that remain constant for each element regardless of position.`,
            `Neglecting to memoize expensive calculations: Without memoization, expensive operations run on every render even when inputs haven't changed. Use memoization techniques to cache results and skip redundant calculations, especially for computationally intensive operations.`,
            `Creating new object or function references on every render: This breaks memoization and causes unnecessary child component re-renders. Use useCallback for functions and useMemo for objects to maintain referential equality across renders when dependencies haven't changed.`,
            `Failing to profile performance during development: Waiting until production to discover performance issues makes them much harder to fix. Use profiling tools regularly during development to catch problems early and verify that optimizations are working as expected.`,
            `Over-optimizing prematurely: Adding memoization and optimization everywhere can actually hurt performance and make code harder to maintain. Profile first to identify actual bottlenecks, then apply targeted optimizations where they provide measurable benefits.`
          ]
        },
        externalResources: {
          videos: [],
          articles: [],
          officialDocs: []
        },
        practiceExercise: {
          question: `Build a performant application component that demonstrates mastery of ${subComponentTitle}. Your implementation should: 1) Manage a list of items with unique identifiers, 2) Include expensive calculations that are properly memoized, 3) Prevent unnecessary re-renders of child components, 4) Handle user interactions efficiently. Test your solution with performance profiling tools to verify optimization effectiveness.`,
          hints: [
            'Start by ensuring each list item has a stable, unique identifier that persists across updates',
            'Identify which calculations are expensive and could benefit from memoization',
            'Consider which child components might re-render unnecessarily and how to prevent that',
            'Use profiling tools to measure performance before and after applying optimizations'
          ],
          solution: 'The optimal solution uses unique keys for list items, memoizes expensive calculations with useMemo, prevents child re-renders with memo and useCallback, and batches state updates appropriately. Performance profiling should show reduced render times and fewer unnecessary operations compared to an unoptimized implementation.'
        }
      };
    }
  }
}

module.exports = {
  generateSubComponentContent
};
