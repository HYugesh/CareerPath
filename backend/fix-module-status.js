/**
 * Migration Script: Fix Module Status
 * Unlocks the first module in all existing roadmaps
 * Run with: node fix-module-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');

async function fixModuleStatus() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all roadmaps
    const roadmaps = await Roadmap.find({});
    console.log(`📊 Found ${roadmaps.length} roadmaps`);

    let updatedCount = 0;

    for (const roadmap of roadmaps) {
      let needsUpdate = false;

      if (roadmap.modules && roadmap.modules.length > 0) {
        roadmap.modules.forEach((module, index) => {
          // Set first module to UNLOCKED if it's LOCKED
          if (index === 0 && (!module.status || module.status === 'LOCKED')) {
            module.status = 'UNLOCKED';
            needsUpdate = true;
            console.log(`  ✅ Unlocked Module 1 in roadmap: ${roadmap.title}`);
          }
          
          // Ensure all other modules have a status
          if (index > 0 && !module.status) {
            module.status = 'LOCKED';
            needsUpdate = true;
          }

          // Initialize completion criteria if missing
          if (!module.completionCriteria) {
            module.completionCriteria = {
              contentReview: { required: false, completed: false },
              quizScore: { required: true, completed: false },
              codingChallenges: { required: false, completed: false }
            };
            needsUpdate = true;
          }

          // Initialize knowledge check if missing
          if (!module.knowledgeCheck) {
            module.knowledgeCheck = {
              questions: [],
              passingScore: 80,
              attemptsAllowed: 3,
              attempts: [],
              status: 'NOT_ATTEMPTED'
            };
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          await roadmap.save();
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Updated ${updatedCount} roadmaps`);
    console.log(`📊 ${roadmaps.length - updatedCount} roadmaps were already correct`);

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixModuleStatus();
