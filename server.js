
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const path = require('path');
const PORT = 80;

let data = null;

function hexToUtf8(hex) {
    return Buffer.from(hex, 'hex').toString('utf-8');
}

function parseMessage(message) {
    try {
        return JSON.parse(message);
    } catch (error) {
//        console.error('Error parsing message:', error);
        return null;
    }
}


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket server
wss.on('connection', (ws) => {
//    console.log('WebSocket connection established');

    // Handle messages from the client
    ws.on('message', (message) => {
//        console.log('Received message:', message);
        const decodedMessage = hexToUtf8(message);
//        console.log('Decoded message:', decodedMessage);
        data = parseMessage(decodedMessage);
//        console.log('Parsed data:', data);
    });
});

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data', function(req, res){
    if (data) res.send(data);
    console.log("data requested : ", data);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
