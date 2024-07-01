
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
        return null;
    }
}


app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const decodedMessage = hexToUtf8(message);
        data = parseMessage(decodedMessage);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data', function(req, res){
    if (data) res.send(data);
    console.log("data requested : ", data);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
