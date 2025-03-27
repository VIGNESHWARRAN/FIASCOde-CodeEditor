# 🚀 FIASCOde - Web-Based Code Editor

## 📌 Overview
FIASCOde is a web-based code editor that supports Java and Python, allowing users to write, execute, and evaluate code. It integrates with DOMjudge for automated code submission and assessment.

---

## 🛠️ Dependencies
Ensure you have the following Node.js dependencies installed:

```json
"dependencies": {
    "adm-zip": "^0.5.16",
    "axios": "^1.8.1",
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "express": "^4.21.2",
    "fs": "^0.0.1-security",
    "path": "^0.12.7"
}
```

---

## 🔧 Configuration

### 1️⃣ Set DOMjudge Server IP
Modify **`public/Login.html`** at **lines 175 and 176** to include the IP address of your DOMjudge hosting server.

### 2️⃣ Update API Calls
Modify the following files to match your DOMjudge API endpoints:
- **`routes/authRoutes.js`**
- **`services/submissionService.js`**

### 3️⃣ Configure Compiler Paths
Edit **`services/executionService.js`** at **lines 6, 7, and 8** to specify the correct paths for Java and Python compilers.

---

## 🚀 How to Run
### 1️⃣ Start the DOMjudge Server
Ensure that your DOMjudge server is up and running.

### 2️⃣ Start the FIASCOde Server
Navigate to the project directory and run:
```bash
node server.js
```

---

## 📩 Contact & Support
For any issues or queries, reach out to me.

