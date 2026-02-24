/**
 * Fix Roadmap Index Issue - Complete Fix
 * 
 * This script removes ALL old duplicate key indexes and ensures correct indexes exist
 * Old indexes to remove: user_1_domain_1, user_1_name_1, and any other old schema indexes
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixRoadmapIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('roadmaps');

    // Get all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(unique)' : '');
    });

    // List of old problematic indexes to remove
    const oldIndexes = [
      'user_1_domain_1',
      'user_1_name_1',
      'user_1',
      'domain_1',
      'name_1'
    ];

    console.log('\n🗑️  Removing old indexes...');
    for (const indexName of oldIndexes) {
      try {
        await collection.dropIndex(indexName);
        console.log(`  ✅ Dropped: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`  ⏭️  Skipped: ${indexName} (does not exist)`);
        } else {
          console.log(`  ⚠️  Error dropping ${indexName}:`, error.message);
        }
      }
    }

    // Drop any remaining indexes except _id_
    console.log('\n🧹 Cleaning up remaining indexes...');
    const currentIndexes = await collection.indexes();
    for (const index of currentIndexes) {
      if (index.name !== '_id_' && !index.name.startsWith('userId_')) {
        try {
          await collection.dropIndex(index.name);
          console.log(`  ✅ Dropped: ${index.name}`);
        } catch (error) {
          console.log(`  ⚠️  Could not drop ${index.name}:`, error.message);
        }
      }
    }

    // Create the correct indexes
    console.log('\n🔨 Creating new indexes...');
    
    // Index 1: userId + primaryDomain (non-unique, for querying)
    try {
      await collection.createIndex(
        { userId: 1, primaryDomain: 1 },
        { 
          unique: false,
          name: 'userId_1_primaryDomain_1'
        }
      );
      console.log('  ✅ Created: userId_1_primaryDomain_1 (non-unique)');
    } catch (error) {
      console.log('  ⚠️  userId_1_primaryDomain_1:', error.message);
    }

    // Index 2: userId + createdAt (for sorting)
    try {
      await collection.createIndex(
        { userId: 1, createdAt: -1 },
        { 
          name: 'userId_1_createdAt_-1'
        }
      );
      console.log('  ✅ Created: userId_1_createdAt_-1');
    } catch (error) {
      console.log('  ⚠️  userId_1_createdAt_-1:', error.message);
    }

    // Show final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(unique)' : '(non-unique)');
    });

    console.log('\n✅ Index fix completed successfully!');
    console.log('💡 You can now create multiple roadmaps per user');

  } catch (error) {
    console.error('❌ Error fixing index:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixRoadmapIndex();
