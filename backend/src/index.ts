import express from 'express';
import cors from "cors"
import { WebSocketServer } from 'ws';
import { EngineProcess } from './engine/engineProcess.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: "https://dahlia.silasteague.com"
}));

app.get("/health", (req, res) => {
  res.send("OK");
});

const ENGINE_PATH = "engine/dahlia"

const server = app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
})

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    console.log('New client connected');
    const engine = new EngineProcess(ws, ENGINE_PATH);
})

console.log(`WebSocket server running on ${port}`)