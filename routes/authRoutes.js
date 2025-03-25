const express = require('express');
const axios = require('axios');
const path = require('path');
const { errorPage } = require('../utils/htmlUtils');

const router = express.Router();
global.storedUsername = '';
global.storedPassword = '';
global.Host = 'localhost';
// Serve Login Page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'Login.html'));
});

// Handle Login
router.post('/login', async (req, res) => {
    const { roll_number, password,server,emergency_ip } = req.body;
    if (emergency_ip && emergency_ip.trim() !== '') {
        global.Host = emergency_ip;
    } else {
        global.Host = server;
    }
    try {
        const authTest = await axios.get(
            `http://${global.Host}:12345/api/v4/contests/FIASCOde_Finals/account`,
            { auth: { username: roll_number, password } }
        );

        if (authTest.status === 200) {
            global.storedUsername = roll_number;
            global.storedPassword = password;
            res.redirect(`/code.html?username=${roll_number}&password=${password}`);
        } else {
            res.send(errorPage('Username or password is incorrect'));
        }
    } catch (error) {
        res.send(errorPage('Username or password is incorrect'));
    }
});

module.exports = router;
