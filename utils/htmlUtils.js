function errorPage(message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Login Failed</title></head>
        <body>
            <h2>${message}</h2>
            <a href="/">Try again</a>
        </body>
        </html>
    `;
}

module.exports = { errorPage };
