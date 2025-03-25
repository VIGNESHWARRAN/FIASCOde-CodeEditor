const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { execSync } = require('child_process'); // Import execSync to run shell commands

const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');

const app = express();
const port = 3000;

// Kill any process using port 3000 before starting
try {
    console.log(`🔍 Checking for process on port ${port}...`);
    if (process.platform === 'win32') {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' })
            .toString()
            .split('\n')
            .forEach(line => {
                const match = line.match(/\s+\d+\.\d+\.\d+\.\d+:(\d+)\s+\S+\s+\S+\s+(\d+)/);
                if (match && match[1] === `${port}`) {
                    const pid = match[2];
                    console.log(`🛑 Killing process ${pid} on port ${port}...`);
                    execSync(`taskkill /PID ${pid} /F`);
                }
            });
    } else {
        execSync(`fuser -k ${port}/tcp`); // Linux/macOS
    }
} catch (err) {
    console.warn(`⚠️ No process found on port ${port} or failed to kill it.`);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use(authRoutes);
app.use(codeRoutes);

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
