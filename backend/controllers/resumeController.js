const { callGemini } = require('../services/geminiClient');
const pdf = require('pdf-parse');
const User = require('../models/User');

const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded' });
        }

        // Extract text from PDF
        const dataBuffer = req.file.buffer;
        let resumeText = '';

        try {
            const data = await pdf(dataBuffer);
            resumeText = data.text;
        } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            return res.status(400).json({
                message: 'Failed to parse PDF file',
                error: pdfError.message
            });
        }

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ message: 'Resume content is too short or could not be extracted' });
        }

        // Save to user profile with actual file data
        const user = await User.findByIdAndUpdate(req.user._id, {
            'resume.text': resumeText,
            'resume.fileName': req.file.originalname,
            'resume.data': req.file.buffer,
            'resume.contentType': req.file.mimetype,
            'resume.lastUploadedAt': new Date()
        }, { new: true });

        res.json({
            message: 'Resume uploaded successfully',
            fileName: req.file.originalname,
            uploadedAt: user.resume.lastUploadedAt
        });

    } catch (error) {
        console.error('Resume Upload Error:', error);
        res.status(500).json({
            message: 'Failed to upload resume',
            error: error.message
        });
    }
};

const viewResume = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.resume || !user.resume.data) {
            return res.status(404).json({ message: 'Resume file not found' });
        }

        res.set('Content-Type', user.resume.contentType || 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${user.resume.fileName}"`);
        res.send(user.resume.data);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving resume' });
    }
};

const deleteResume = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $unset: { resume: "" }
        });
        res.json({ message: 'Resume deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ message: 'Failed to delete resume' });
    }
};

const analyzeExistingResume = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.resume || !user.resume.text) {
            return res.status(404).json({ message: 'No resume found. Please upload one first.' });
        }

        const prompt = `
      Act as an expert Applicant Tracking System (ATS) and Career Coach. 
      Analyze the following resume text and provide a detailed assessment.
      
      Resume Text:
      """
      ${user.resume.text}
      """
      
      Respond STRICTLY in JSON format with the following structure:
      {
        "score": number (0-100),
        "summary": "a brief 2-3 sentence overview of the resume",
        "strengths": ["list of 3-5 key strengths"],
        "improvements": ["list of 3-5 specific areas to improve"],
        "missingKeywords": ["list of important keywords or skills missing (tailor to tech/modern industry)"],
        "suggestions": ["3-4 actionable tips for better ATS optimization"]
      }
    `;

        const aiResponse = await callGemini(prompt, {
            temperature: 0.7,
            responseType: 'json'
        });

        const parsedResult = JSON.parse(aiResponse);

        // Save analysis to user profile
        await User.findByIdAndUpdate(req.user._id, {
            'resume.score': parsedResult.score,
            'resume.analysis': parsedResult,
            'resume.lastAnalyzedAt': new Date()
        });

        res.json(parsedResult);

    } catch (error) {
        console.error('Resume Analysis Error:', error);
        res.status(500).json({
            message: 'Failed to analyze resume',
            error: error.message
        });
    }
};

const getResumeStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.resume || !user.resume.lastUploadedAt) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            fileName: user.resume.fileName,
            score: user.resume.score,
            analysis: user.resume.analysis,
            lastUploadedAt: user.resume.lastUploadedAt,
            lastAnalyzedAt: user.resume.lastAnalyzedAt
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching resume status' });
    }
};

module.exports = {
    uploadResume,
    viewResume,
    deleteResume,
    analyzeExistingResume,
    getResumeStatus
};
