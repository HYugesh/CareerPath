const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadResume, viewResume, deleteResume, analyzeExistingResume, getResumeStatus } = require('../controllers/resumeController');
const protect = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'), false);
    }
});

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/view', protect, viewResume);
router.delete('/delete', protect, deleteResume);
router.post('/analyze-existing', protect, analyzeExistingResume);
router.get('/status', protect, getResumeStatus);

module.exports = router;
