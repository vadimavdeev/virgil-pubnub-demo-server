require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const jwtGenerator = require('./makeJwtGenerator')({
    appId: process.env.VIRGIL_APP_ID,
    apiKeyData: process.env.VIRGIL_API_KEY,
    apiKeyId: process.env.VIRGIL_API_KEY_ID
});

const app = express();

app.enable('trust proxy');
app.use(enableCORS);
app.use(rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300 // limit each IP to 300 requests per windowMs
}));

app.get('/virgil-jwt', (req, res) => {
    const jwt = jwtGenerator.generateToken(process.env.DEMO_USER_IDENTITY);
    res.send(jwt.toString());
});

app.get('/channel-private-key', (req, res) => {
    res.send(process.env.DEMO_CHANNEL_ENCRYPTED_PRIVATE_KEY);
});

function enableCORS(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.header('Access-Control-Max-Age', '86400');
	next();
}

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
