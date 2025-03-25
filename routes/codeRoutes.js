const express = require('express');
const { executeCode } = require('../services/executionService');
const { submitCode } = require('../services/submissionService');
const path = require('path');
const router = express.Router();
router.get('/submission-details', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'submission_details.html'));
});
// Run code execution
router.post('/run-code', async (req, res) => {
    try {
        const { language, code, input } = req.body;
        const result = await executeCode(language, code, input);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit code to DOMjudge
router.post('/submit-code', async (req, res) => {
    try {
        const { problemId, language } = req.body;
        await submitCode(problemId, language);
        res.send({ message: 'Code submitted successfully' });
        
    } catch (error) {
        res.status(500).send({ error: 'Failed to submit code' });
    }
});

module.exports = router;
