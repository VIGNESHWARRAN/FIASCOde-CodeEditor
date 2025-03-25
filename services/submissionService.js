const axios = require('axios');
const AdmZip = require('adm-zip');
const { writeCodeToFile, readFile } = require('../utils/fileUtils');
const{encryptFile, decryptFile} = require('./Security');
const path = require('path');
const fs = require('fs').promises;
const submissionsFilePath = 'public/submissions.json';
const { executeCode } = require('./executionService'); // Import the executeCode function

async function readSubmissions() {
    try {
        await fs.access(submissionsFilePath).catch(async () => {
            await fs.writeFile(submissionsFilePath, JSON.stringify([]), 'utf8'); // Create if missing
        });

        const data = await fs.readFile(submissionsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading submissions:", error);
        return [];
    }
}

async function saveSubmissions(submissions) {
    try {
        await fs.writeFile(submissionsFilePath, JSON.stringify(submissions, null, 2), 'utf8');
    } catch (error) {
        console.error("Error saving submissions:", error);
    }
}


async function submitCode(problemId, language) {
    let filePath = language === 'python3' ? 'script.py' : 'Script.java';
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    let submissionsDir = 'submissions';
    let submissionFilePath = path.join(submissionsDir, `${problemId}_${timestamp}.${language === 'python3' ? 'py' : 'java'}`);

    try {
        const content = await fs.readFile(filePath, 'utf8');

        if (containsRaiseOrThrow(content, language)) {
            console.log(`🚨 Code contains forbidden keyword ('raise' in Python or 'throw' in Java). Submission aborted.`);
            return;
        }

        // Execute the code and capture the result
        const result = await executeCode(language, content, []);
        console.log(result);
        // Replace the source code with a print statement of the output/error
        let modifiedCode = '';
        if (result.error) {
            modifiedCode = language === 'python3'
                ? `print("${result.error}")`
                : `public class Script { public static void main(String[] args) { System.out.println("${result.error}"); } }`;
        }
        // Ensure submissions directory exists
        await fs.mkdir(submissionsDir, { recursive: true });

        // Save the modified code to the submission file
        await writeCodeToFile(submissionFilePath, modifiedCode);
        await writeCodeToFile(filePath,modifiedCode);
        console.log(`Submission saved: ${submissionFilePath}`);

        const url = `http://${global.Host}:12345/api/v4/contests/FIASCOde_Finals/submissions`;
        const zip = new AdmZip();
        zip.addLocalFile(filePath);
        const zipFilePath = `submission.zip`;
        zip.writeZip(zipFilePath);

        const zipContent = await fs.readFile(zipFilePath);
        const encodedZip = zipContent.toString('base64');

        const payload = {
            language_id: language,
            problem_id: problemId,
            files: [{ data: encodedZip, mime: 'application/zip' }],
        };

        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        const auth = { username: global.storedUsername, password: global.storedPassword };

        const response = await axios.post(url, payload, { headers, auth });

        setTimeout(async () => {
            await checkSubmission(response.data.id);
        }, 12000);
    } catch (error) {
        console.error('Error submitting code:', error.response ? error.response.data : error.message);
    }
}

async function checkSubmission(submissionId) {
    const submissionUrl = `http://${global.Host}:12345/api/v4/contests/FIASCOde_Finals/submissions/${submissionId}`;
    const judgementUrl = `http://${global.Host}:12345/api/v4/judgements?submission_id=${submissionId}`;

    try {
        const auth = { username: storedUsername, password: storedPassword };

        // Fetch submission details
        const submissionResponse = await axios.get(submissionUrl, { auth });
        console.log('Submission Response:', submissionResponse.data);

        // Fetch judgement details
        const judgementResponse = await axios.get(judgementUrl, { auth });
        console.log('Judgement Response:', judgementResponse.data);

        // Extract judgement type (default to "Pending" if no judgement exists)
        const judgementType = judgementResponse.data.length > 0
            ? judgementResponse.data[0].judgement_type_id
            : "Pending";

        // Prepare submission data
        const submissionData = {
            problem_id: submissionResponse.data.problem_id,
            submissionId: submissionId,
            judgement_type_id: judgementType, // Use the correct judgement type
            contest_time: submissionResponse.data.contest_time,
            language_id: submissionResponse.data.language_id,
        };

        // Read existing submissions
        let submissions = await readSubmissions();

        // Check if the submission already exists
        const existingSubmissionIndex = submissions.findIndex(sub => sub.submissionId === submissionId);

        if (existingSubmissionIndex !== -1) {
            // Update the existing submission
            submissions[existingSubmissionIndex] = submissionData;
        } else {
            // Append the new submission
            submissions.push(submissionData);
        }

        // Save the updated submissions
        await saveSubmissions(submissions);
    } catch (error) {
        console.error('Error checking submission status:', error.response ? error.response.data : error.message);
    }
}
function containsRaiseOrThrow(content, language) {
    if (language === 'python3') {
        return content.includes('raise');
    } else if (language === 'java') {
        return content.includes('throw');
    }
    return false; // No check needed for other languages
}

module.exports = { submitCode };