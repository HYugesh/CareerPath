# Database Migrations

This directory contains database migration scripts for the AI Learning Platform.

## Available Migrations

### add-importance-level.js

**Purpose**: Adds the `importanceLevel` field to existing subtopics (subComponents) in roadmaps.

**Requirements**: 6.4, 6.5 from the two-phase-module-content-generation spec

**What it does**:
- Finds all roadmaps with subtopics
- Adds `importanceLevel: 'medium'` to any subtopic that doesn't have this field
- Preserves existing `importanceLevel` values (doesn't overwrite)
- Provides detailed logging of the migration process

**When to run**:
- After deploying the schema changes that add the `importanceLevel` field
- On existing production databases that have roadmaps created before this feature

**How to run**:

```bash
# From the project root
node backend/migrations/add-importance-level.js

# Or from the backend directory
cd backend
node migrations/add-importance-level.js
```

**Expected output**:
```
🔄 Starting migration: Add importanceLevel to subtopics...
📊 Found X roadmaps with subtopics to migrate.
✅ Migration complete!
   - Total subtopics found: X
   - Subtopics updated: X
   - Subtopics already had importanceLevel: X
```

**Safety**:
- ✅ Idempotent: Can be run multiple times safely
- ✅ Non-destructive: Only adds missing fields, never removes or overwrites
- ✅ Backward compatible: Works with both old and new data structures

## Testing Migrations

### test-migration.js

Manual test script that:
1. Creates sample roadmap data with mixed scenarios
2. Runs the migration logic
3. Verifies the results
4. Cleans up test data

**How to run**:
```bash
node backend/migrations/test-migration.js
```

### test-existing-data.js

Simulates existing data by inserting raw documents without the `importanceLevel` field, then tests the migration.

**How to run**:
```bash
node backend/migrations/test-existing-data.js
```

## Migration Best Practices

1. **Always backup your database** before running migrations in production
2. **Test migrations** on a staging environment first
3. **Run during low-traffic periods** to minimize impact
4. **Monitor the output** to ensure expected results
5. **Keep migrations idempotent** so they can be safely re-run

## Schema Changes

The `importanceLevel` field was added to the Roadmap model schema:

```javascript
subComponents: [{
  // ... other fields
  importanceLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium' // Default for backward compatibility
  }
}]
```

**Note**: The schema default only applies to **new documents**. Existing documents in the database need the migration script to add this field.
