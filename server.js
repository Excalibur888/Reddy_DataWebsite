const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const path = require('path');
const PORT = 80;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket server
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    ws.send('Welcome to the WebSocket server!');

    // Handle messages from the client
    ws.on('message', (message) => {
        console.log('Received message:', message);
    });
});

// Define a route to serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});