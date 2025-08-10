import type WebSocket from "ws";
import { UCIController } from "./uciController.js";

type ClientMsg =
  | { type: "start" }
  | { type: "move"; data: { move: string } }
  | { type: "setFen"; data: { fen: string } }
  | { type: "stop" }

export class EngineProcess {
  private uci: UCIController;
  private ws: WebSocket;
  private moves: string[] = [];
  private fen?: string | undefined;

  constructor(ws: WebSocket, enginePath: string) {
    this.ws = ws;
    this.uci = new UCIController(enginePath);

    // Forward engine output and parse bestmove
    this.uci.onLine((line: string) => {
      this.send({ type: "engineOutput", data: { line } });
      const m = line.match(/^bestmove\s+(\S+)/);
      if (m) {
        this.send({ type: "engineMove", data: { move: m[1] } });
      }
    });

    this.ws.on("message", (raw) => void this.handleMessage(raw.toString()));
    this.ws.on("close", () => this.shutdown());

    // Initialize engine
    this.uci.init().catch((err) => {
      this.send({ type: "error", data: { message: "Engine init failed: " + err.message } });
    });
  }

  public send(obj: any) {
    if (this.ws.readyState === (this.ws as any).OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  private async handleMessage(raw: string) {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return this.send({ type: "error", data: { message: "Invalid JSON" } });
    }

    try {
      if (msg.type === "move") {
        const move = msg.data.move;
        this.moves.push(move);

        const posCmd = this.fen
          ? `position fen ${this.fen} moves ${this.moves.join(" ")}`
          : `position startpos moves ${this.moves.join(" ")}`;

        this.uci.send(posCmd);

        const best = await this.uci.goDepth(8);
        if (best) {
          this.moves.push(best);
          this.send({ type: "engineMove", data: { move: best } });
        }
      } else if (msg.type === "setFen") {
        this.fen = msg.data.fen;
        this.moves = [];
      } else if (msg.type === "stop") {
        this.uci.send("stop");
      } else if (msg.type === "start") {
        // Reset game state
        this.fen = undefined;
        this.moves = [];
        this.send({ type: "gameStarted", data: {} });
      }
    } catch (error) {
      this.send({ type: "error", data: { message: "Failed to process move: " + (error as Error).message } });
    }
  }

  shutdown() {
    this.uci.kill();
  }
}