const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");
const Roadmap = require("../models/Roadmap");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Migration Script: Add importanceLevel to existing subtopics
 * 
 * This script adds the importanceLevel field to all existing subComponents
 * in the Roadmap collection. The default value is set to 'medium' for
 * backward compatibility.
 * 
 * Requirements: 6.4, 6.5
 */

async function migrateImportanceLevel() {
  try {
    await connectDB();
    console.log("🔄 Starting migration: Add importanceLevel to subtopics...");

    // Find all roadmaps that have modules with subComponents
    const roadmaps = await Roadmap.find({
      "modules.subComponents": { $exists: true, $ne: [] }
    });

    console.log(`📊 Found ${roadmaps.length} roadmaps with subtopics to migrate.`);

    let totalUpdated = 0;
    let totalSubtopics = 0;

    for (const roadmap of roadmaps) {
      let roadmapModified = false;

      for (const module of roadmap.modules) {
        if (module.subComponents && module.subComponents.length > 0) {
          for (const subComponent of module.subComponents) {
            totalSubtopics++;

            // Only add importanceLevel if it doesn't exist
            if (!subComponent.importanceLevel) {
              subComponent.importanceLevel = 'medium';
              roadmapModified = true;
              totalUpdated++;
            }
          }
        }
      }

      // Save the roadmap if any modifications were made
      if (roadmapModified) {
        await roadmap.save();
      }
    }

    console.log(`✅ Migration complete!`);
    console.log(`   - Total subtopics found: ${totalSubtopics}`);
    console.log(`   - Subtopics updated: ${totalUpdated}`);
    console.log(`   - Subtopics already had importanceLevel: ${totalSubtopics - totalUpdated}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error("Failed to disconnect:", e);
    }
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateImportanceLevel();
}

module.exports = { migrateImportanceLevel };
