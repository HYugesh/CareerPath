# Roadmap Progress Calculation Fix

## Problem
Module detail page showed "100% Complete" but the roadmap overview page showed "0%" overall progress. The overall roadmap progress wasn't being calculated based on module completion.

## Root Cause
The roadmap progress field was never being updated automatically. It was only updated manually through the `updateRoadmapProgress` endpoint, which wasn't being called when modules were completed.

## Solution Implemented

### 1. Added Roadmap Progress Calculation Function
**File: `backend/controllers/roadmapController.js`**

```javascript
const calculateRoadmapProgress = (roadmap) => {
  if (!roadmap.modules || roadmap.modules.length === 0) {
    return 0;
  }

  let totalProgress = 0;
  let completedModules = 0;

  roadmap.modules.forEach(module => {
    let moduleProgress = 0;
    
    if (module.status === 'COMPLETED') {
      moduleProgress = 100;
      completedModules++;
    } else if (module.status === 'IN_PROGRESS' && module.subComponents) {
      // Calculate based on sub-components
      let reviewedCount = 0;
      let passedQuizCount = 0;
      let totalQuizTopics = 0;

      module.subComponents.forEach(subComponent => {
        if (subComponent.status === 'REVIEWED') {
          reviewedCount++;
        }

        if (subComponent.hasQuiz !== false) {
          totalQuizTopics++;
          const hasPassedQuiz = subComponent.quizAttempts?.some(attempt => attempt.passed);
          if (hasPassedQuiz) {
            passedQuizCount++;
          }
        }
      });

      const totalSubComponents = module.subComponents.length;
      
      if (totalQuizTopics === 0) {
        moduleProgress = Math.round((reviewedCount / totalSubComponents) * 100);
      } else {
        const reviewProgress = (reviewedCount / totalSubComponents) * 50;
        const quizProgress = (passedQuizCount / totalQuizTopics) * 50;
        moduleProgress = Math.round(reviewProgress + quizProgress);
      }
    }

    totalProgress += moduleProgress;
  });

  // Calculate average progress across all modules
  const overallProgress = Math.round(totalProgress / roadmap.modules.length);
  
  // Update roadmap status
  if (overallProgress === 0) {
    roadmap.status = 'not-started';
  } else if (overallProgress === 100) {
    roadmap.status = 'completed';
  } else {
    roadmap.status = 'in-progress';
  }

  return overallProgress;
};
```

### 2. Updated getRoadmapById to Calculate Progress
**File: `backend/controllers/roadmapController.js`**

```javascript
const getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: id, userId });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    // Calculate and update overall progress
    const overallProgress = calculateRoadmapProgress(roadmap);
    roadmap.progress = overallProgress;
    
    // Save if progress changed
    if (roadmap.isModified('progress') || roadmap.isModified('status')) {
      await roadmap.save();
    }

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

### 3. Updated getUserRoadmaps to Calculate Progress for All Roadmaps
**File: `backend/controllers/roadmapController.js`**

```javascript
const getUserRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });

    // Calculate progress for each roadmap
    const roadmapsWithProgress = roadmaps.map(roadmap => {
      const overallProgress = calculateRoadmapProgress(roadmap);
      roadmap.progress = overallProgress;
      return roadmap;
    });

    // Save all roadmaps with updated progress
    await Promise.all(
      roadmapsWithProgress.map(roadmap => 
        roadmap.isModified('progress') || roadmap.isModified('status') 
          ? roadmap.save() 
          : Promise.resolve()
      )
    );

    res.status(200).json({
      success: true,
      count: roadmapsWithProgress.length,
      data: roadmapsWithProgress
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

### 4. Updated Module Controller to Update Roadmap Progress
**File: `backend/controllers/moduleController.js`**

```javascript
const checkAndUnlockNextModule = async (roadmap, currentModule) => {
  const moduleProgress = calculateModuleProgress(currentModule);
  console.log(`📊 Module "${currentModule.title}" progress: ${moduleProgress}%`);

  let nextModuleUnlocked = false;

  if (moduleProgress >= 90 && currentModule.status !== 'COMPLETED') {
    // ... unlock logic ...
  }

  // Calculate overall roadmap progress
  const overallProgress = calculateOverallRoadmapProgress(roadmap);
  roadmap.progress = overallProgress;
  console.log(`📈 Overall roadmap progress: ${overallProgress}%`);

  return { moduleProgress, nextModuleUnlocked, overallProgress };
};
```

## Progress Calculation Formula

### Module Progress:
```
If module is COMPLETED:
  Module Progress = 100%

If module is IN_PROGRESS:
  Review Progress = (Reviewed Sub-topics / Total Sub-topics) × 50%
  Quiz Progress = (Passed Quizzes / Total Quiz Topics) × 50%
  Module Progress = Review Progress + Quiz Progress

If module has no quizzes:
  Module Progress = (Reviewed Sub-topics / Total Sub-topics) × 100%
```

### Overall Roadmap Progress:
```
Total Progress = Sum of all module progress values
Overall Progress = Total Progress / Number of Modules
```

### Example Calculation:

**Roadmap with 3 Modules:**

**Module 1: "Introduction to Java"** (IN_PROGRESS)
- 7 sub-topics, all reviewed (7/7)
- 6 quiz topics, 6 passed (6/6)
- Module Progress = (7/7 × 50%) + (6/6 × 50%) = 50% + 50% = 100%

**Module 2: "Java Basics"** (LOCKED)
- Not started
- Module Progress = 0%

**Module 3: "Advanced Java"** (LOCKED)
- Not started
- Module Progress = 0%

**Overall Roadmap Progress:**
- Total = 100% + 0% + 0% = 100%
- Overall = 100% / 3 modules = 33.33% → 33%

## Roadmap Status Updates

The roadmap status is automatically updated based on progress:

```javascript
if (overallProgress === 0) {
  roadmap.status = 'not-started';
} else if (overallProgress === 100) {
  roadmap.status = 'completed';
} else {
  roadmap.status = 'in-progress';
}
```

## When Progress is Calculated

Progress is now calculated automatically in these scenarios:

### 1. Viewing Roadmap Detail
- User navigates to `/roadmap/:id`
- `getRoadmapById` is called
- Progress is calculated and saved

### 2. Viewing Roadmap List
- User navigates to `/roadmap`
- `getUserRoadmaps` is called
- Progress is calculated for all roadmaps

### 3. Completing Sub-Topics
- User marks sub-topic as reviewed
- `reviewSubComponent` is called
- Module progress is calculated
- Roadmap progress is updated

### 4. Passing Quizzes
- User passes a sub-topic quiz
- `submitSubTopicQuiz` is called
- Module progress is calculated
- Roadmap progress is updated

### 5. Passing Module Assessment
- User passes module assessment
- `submitModuleQuiz` is called
- Module progress is calculated
- Roadmap progress is updated

## Console Logs

The system now logs progress updates:

```
📊 Module "Introduction to Java" progress: 100%
✅ Module completed: Introduction to Java
🔓 Next module unlocked: Java Basics
📈 Overall roadmap progress: 33%
```

## Files Modified

1. **`backend/controllers/roadmapController.js`**
   - Added `calculateRoadmapProgress()` function
   - Updated `getRoadmapById()` to calculate progress
   - Updated `getUserRoadmaps()` to calculate progress for all roadmaps

2. **`backend/controllers/moduleController.js`**
   - Added `calculateOverallRoadmapProgress()` function
   - Updated `checkAndUnlockNextModule()` to update roadmap progress
   - Exported new function

## Benefits

### Accurate Progress Tracking:
- ✅ Module progress reflects actual completion
- ✅ Roadmap progress reflects all module progress
- ✅ Progress updates automatically
- ✅ No manual intervention needed

### Realistic Progress Display:
- ✅ 100% module completion shows correctly in roadmap
- ✅ Partial module completion shows percentage
- ✅ Overall progress is average of all modules
- ✅ Progress is consistent across all views

### User Experience:
- ✅ Users see their actual progress
- ✅ Progress motivates continued learning
- ✅ Clear indication of completion status
- ✅ Satisfying to see progress increase

## Testing Checklist

- [x] Complete all sub-topics in Module 1 → Module shows 100%
- [x] View roadmap detail → Overall progress calculated
- [x] View roadmap list → All roadmaps show correct progress
- [x] Complete Module 1 → Roadmap progress increases
- [x] Start Module 2 → Roadmap progress reflects both modules
- [x] Complete all modules → Roadmap shows 100%
- [x] Roadmap status updates (not-started → in-progress → completed)

## Result

✅ Module progress and roadmap progress are now synchronized
✅ Progress is calculated automatically on every view
✅ Progress reflects actual completion accurately
✅ Users see realistic and satisfying progress indicators
✅ No more 0% progress when modules are completed
