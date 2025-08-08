import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
const port = process.env.PORT || 3001;

app.get('/', (_req, res) => {
    res.send('Backend is running.');
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', ws => {
    console.log('New client connected');
    ws.on('message', message => {
        console.log('Received: ', message.toString());
    })
})

const server = app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
})

server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
    });
})