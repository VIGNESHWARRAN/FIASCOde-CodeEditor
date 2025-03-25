const { spawn } = require('child_process');
const { writeCodeToFile, deleteFile } = require('../utils/fileUtils');
const{encryptFile} = require('./Security');
const path = require('path');

const pythonPath = path.join(__dirname, '/path/to/pythoninterpreter(python.exe)');
const javaCompilerPath = path.join(__dirname, '/path/to/javac.exe');
const javaRuntimePath = path.join(__dirname, '/path/to/java.exe');


async function executeCode(language, code, input) {
    const fileName = language === 'python3' ? 'script.py' : 'Script.java';
    await writeCodeToFile(fileName, code);

    return new Promise((resolve, reject) => {
        let process;

        if (language === 'python3') {
            process = spawn(pythonPath, [fileName]);
            let outputLines = [];
            let runtimeError = '';

            const timeout = setTimeout(() => {
                console.error("⏳ Infinite Loop Detected: Python Process Timed Out.");
                process.kill();
                resolve({ error: "Python Runtime Error: Possible Infinite Loop (Process Timed Out)" });  // Encrypt even in case of timeout
            }, 5000);

            process.stdout.on('data', (data) => {
                outputLines.push(data.toString());
                if (outputLines.length > 1000) {
                    console.error("⚠️ Infinite Loop Detected: Excessive Output in Python.");
                    clearTimeout(timeout);
                    process.kill();
                    resolve({ error: "Python Runtime Error: Infinite Loop Detected (Excessive Output)" });// Encrypt even in case of excessive output
                }
            });

            process.stderr.on('data', (data) => {
                runtimeError += data.toString();
            });

            process.on('close', (exitCode) => {
                clearTimeout(timeout);// Encrypt after execution finishes
                
                if (exitCode !== 0) {
                    resolve({ error: `Python Error: ${extractPythonErrorType(runtimeError)}` });
                } else {
                    resolve({ output: outputLines.join('') });
                }
            });

            process.on('error', (err) => {
                console.error('🚨 Python Execution Failed:', err);
                resolve({ error: `Python Execution Error: ${err.message}` });
            });

            sendMultipleInputs(process, input, resolve);
        } 
        else if (language === 'java') {
            const compileProcess = spawn(javaCompilerPath, [fileName]);
            let compileError = '';

            compileProcess.stderr.on('data', (data) => {
                compileError += data.toString();
            });

            compileProcess.on('close', (compileCode) => {
                if (compileCode !== 0) {
                    return resolve({ error: parseJavaCompileError(compileError) });
                }

                console.log('✅ Compilation Successful. Running Java program...');
                const runProcess = spawn(javaRuntimePath, ['Script']);
                let outputLines = [];
                let runtimeError = '';

                const timeout = setTimeout(() => {
                    console.error("⏳ Infinite Loop Detected: Java Process Timed Out.");
                    runProcess.kill();
                    resolve({ error: "Java Runtime Error: Possible Infinite Loop (Process Timed Out)" });
                }, 5000);

                runProcess.stdout.on('data', (data) => {
                    outputLines.push(data.toString());
                    if (outputLines.length > 1000) {
                        console.error("⚠️ Infinite Loop Detected: Excessive Output in Java.");
                        clearTimeout(timeout);
                        runProcess.kill();
                        resolve({ error: "Java Runtime Error: Infinite Loop Detected (Excessive Output)" });
                    }
                });

                runProcess.stderr.on('data', (data) => {
                    runtimeError += data.toString();
                });

                runProcess.on('close', (exitCode) => {
                    clearTimeout(timeout);// Encrypt after execution finishes
                    
                    if (exitCode !== 0) {
                        resolve({ error: parseJavaRuntimeError(runtimeError) });
                    } else {
                        resolve({ output: outputLines.join('') });
                    }
                });

                runProcess.on('error', (err) => {
                    console.error('🚨 Java Execution Failed:', err);
                    resolve({ error: `Java Execution Error: ${err.message}` });
                });

                sendMultipleInputs(runProcess, input, resolve);
            });

            compileProcess.on('error', (err) => {
                console.error('🚨 Java Compilation Process Failed:', err);
                resolve({ error: `Java Compilation Process Error: ${err.message}` });
            });
        } else {
            return reject({ error: 'Unsupported language' });
        }
    });
}

function extractPythonErrorType(errorOutput) {
    const errorLines = errorOutput.trim().split("\n");
    const lastLine = errorLines[errorLines.length - 1];

    if (lastLine.includes(":")) {
        return lastLine.split(":")[0].trim(); // Extracts just the error type (e.g., "SyntaxError")
    }
    return "Unknown Python Error";
}

function parseJavaCompileError(errorOutput) {
    const lines = errorOutput.split('\n');
    const firstLine = lines.find(line => line.includes('error:')) || lines[0];

    if (/';' expected/.test(firstLine)) {
        return "Java Syntax Error: Missing semicolon (;)";
    } else if (/cannot find symbol/.test(firstLine)) {
        return "Java Compilation Error: Undefined variable or method";
    } else if (/incompatible types/.test(firstLine)) {
        return "Java Type Mismatch Error: Incompatible types";
    } else if (/missing return statement/.test(firstLine)) {
        return "Java Compilation Error: Missing return statement";
    } else if (/has private access/.test(firstLine)) {
        return "Java Compilation Error: Access Modifier Issue (Private method or variable)";
    } else if (/is already defined/.test(firstLine)) {
        return "Java Compilation Error: Duplicate Class or Method Name";
    } else if (/unreachable statement/.test(firstLine)) {
        return "Java Compilation Error: Unreachable Code";
    } else if (/cannot find symbol/.test(firstLine)) {
        return "Java Compilation Error: Missing Import or Undefined Reference";
    } else {
        return `Java Compilation Error: ${firstLine}`;
    }
}

function parseJavaRuntimeError(errorOutput) {
    const lines = errorOutput.split('\n');
    const firstLine = lines.find(line => line.includes('Exception in thread "main"')) || lines[0];

    if (/java.lang.NullPointerException/.test(errorOutput)) {
        return "Java Runtime Error: Null Pointer Exception (Accessing a null object)";
    } else if (/java.lang.ArrayIndexOutOfBoundsException/.test(errorOutput)) {
        return "Java Runtime Error: Array Index Out of Bounds";
    } else if (/java.lang.NegativeArraySizeException/.test(errorOutput)) {  // ✅ Added this case
        return "Java Runtime Error: Negative Array Size Exception (Array size cannot be negative)";
    }else if (/java.lang.ClassCastException/.test(errorOutput)) {
        return "Java Runtime Error: Class Cast Exception (Invalid object type casting)";
    } else if (/java.lang.ArithmeticException/.test(errorOutput)) {
        return "Java Runtime Error: Arithmetic Exception (Division by zero)";
    } else if (/java.lang.IllegalArgumentException/.test(errorOutput)) {
        return "Java Runtime Error: Illegal Argument Exception (Invalid method argument)";
    } else if (/java.lang.NumberFormatException/.test(errorOutput)) {
        return "Java Runtime Error: Number Format Exception (Invalid string-to-number conversion)";
    } else if (/java.lang.StackOverflowError/.test(errorOutput)) {
        return "Java Stack Overflow Error: Infinite recursion or deep recursion";
    } else if (/java.lang.OutOfMemoryError/.test(errorOutput)) {
        return "Java Memory Error: Out of memory";
    } else if (/java.lang.NoClassDefFoundError/.test(errorOutput)) {
        return "Java Linkage Error: No Class Definition Found (Class missing at runtime)";
    } else if (/java.lang.ClassNotFoundException/.test(errorOutput)) {
        return "Java Runtime Error: Class Not Found Exception";
    } else if (/java.lang.IllegalStateException/.test(errorOutput)) {
        return "Java Runtime Error: Illegal State Exception (Method called at an inappropriate time)";
    } else if (/java.lang.UnsupportedOperationException/.test(errorOutput)) {
        return "Java Runtime Error: Unsupported Operation Exception";
    } else if (/java.util.ConcurrentModificationException/.test(errorOutput)) {
        return "Java Runtime Error: Concurrent Modification Exception (Unsafe collection modification)";
    } else if (/java.io.FileNotFoundException/.test(errorOutput)) {
        return "Java Runtime Error: File Not Found Exception";
    } else if (/java.io.IOException/.test(errorOutput)) {
        return "Java Runtime Error: General Input/Output Exception";
    } else if (/java.lang.SecurityException/.test(errorOutput)) {
        return "Java Runtime Error: Security Exception (Access violation)";
    } else if (/java.lang.NoSuchMethodError/.test(errorOutput)) {
        return "Java Linkage Error: No Such Method Found";
    } else if (/java.lang.AssertionError/.test(errorOutput)) {
        return "Java Runtime Error: Assertion Failed";
    } else if (/java.lang.InterruptedException/.test(errorOutput)) {
        return "Java Runtime Error: Thread Interrupted Exception";
    } else if (/java.util.concurrent.TimeoutException/.test(errorOutput)) {
        return "Java Runtime Error: Timeout Exception (Operation timed out)";
    } else {
        return `Java Runtime Error: ${firstLine}`;
    }
}

function parseJavaLinkageError(errorOutput) {
    if (/java.lang.NoClassDefFoundError/.test(errorOutput)) {
        return "Java Linkage Error: No Class Definition Found";
    } else if (/java.lang.UnsatisfiedLinkError/.test(errorOutput)) {
        return "Java Linkage Error: Native Method Link Failure";
    } else if (/java.lang.VerifyError/.test(errorOutput)) {
        return "Java Linkage Error: Bytecode Verification Failed";
    } else {
        return `Java Linkage Error: ${errorOutput.split('\n')[0]}`;
    }
}

function sendMultipleInputs(process, inputs, resolve) {
    let output = '', error = '';

    process.stdout.on('data', (data) => {
        output += data.toString();
    });

    process.stderr.on('data', (data) => {
        error += data.toString();
    });

    process.on('close', (code) => {
        if (code !== 0) {
            resolve({ output: null, error: error.trim() || 'Process exited with non-zero code' });
        } else {
            resolve({ output: output.trim(), error: error.trim() || null });
        }
    });

    if (inputs && Array.isArray(inputs)) {
        inputs.forEach((line) => process.stdin.write(line + '\n'));
        process.stdin.end();
    }
}
module.exports = { executeCode };
