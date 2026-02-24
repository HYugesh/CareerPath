/**
 * Test script to verify sub-component generation produces 10-15 topics
 * Run with: node backend/test-subcomponent-generation.js
 */

const { generateSubComponentsForModule } = require('./services/subComponentGenerationService');

async function testSubComponentGeneration() {
  console.log('🧪 Testing Sub-Component Generation\n');
  console.log('=' .repeat(60));
  
  const testCases = [
    {
      moduleTitle: 'Introduction to Java and Setup',
      moduleTopic: ['Java basics', 'JDK installation', 'IDE setup'],
      domain: 'Java',
      difficultyLevel: 'Easy'
    },
    {
      moduleTitle: 'State Management in React',
      moduleTopic: ['useState', 'useReducer', 'Context API', 'Redux'],
      domain: 'React',
      difficultyLevel: 'Medium'
    },
    {
      moduleTitle: 'Advanced Python Concepts',
      moduleTopic: ['Decorators', 'Generators', 'Context Managers', 'Metaclasses'],
      domain: 'Python',
      difficultyLevel: 'Hard'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test Case ${i + 1}: ${testCase.moduleTitle}`);
    console.log('-'.repeat(60));
    
    try {
      const subComponents = await generateSubComponentsForModule(
        testCase.moduleTitle,
        testCase.moduleTopic,
        testCase.domain,
        testCase.difficultyLevel
      );

      console.log(`\n✅ Generated ${subComponents.length} sub-components`);
      
      // Validation
      if (subComponents.length < 10) {
        console.error(`❌ FAILED: Only ${subComponents.length} sub-components (need 10-15)`);
      } else if (subComponents.length > 15) {
        console.error(`❌ FAILED: Too many sub-components (${subComponents.length}, max 15)`);
      } else {
        console.log(`✅ PASSED: Correct number of sub-components (${subComponents.length})`);
      }

      // Check first topic has no quiz
      if (subComponents[0].hasQuiz === false) {
        console.log(`✅ PASSED: First topic has no quiz (intro topic)`);
      } else {
        console.error(`❌ FAILED: First topic should have hasQuiz: false`);
      }

      // Check other topics have quizzes
      const topicsWithQuiz = subComponents.slice(1).filter(sc => sc.hasQuiz !== false).length;
      if (topicsWithQuiz === subComponents.length - 1) {
        console.log(`✅ PASSED: All non-intro topics have quizzes`);
      } else {
        console.error(`❌ FAILED: Only ${topicsWithQuiz} out of ${subComponents.length - 1} non-intro topics have quizzes`);
      }

      // Display topics
      console.log(`\n📚 Generated Topics:`);
      subComponents.forEach((sc, index) => {
        const quizIcon = sc.hasQuiz === false ? '📖' : '📝';
        console.log(`  ${quizIcon} ${sc.subComponentId}. ${sc.title}`);
      });

      // Wait between tests to avoid rate limiting
      if (i < testCases.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Testing Complete\n');
}

// Run the test
testSubComponentGeneration().catch(console.error);
