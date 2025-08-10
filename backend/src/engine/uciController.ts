import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

export class UCIController {
  private engine: ChildProcessWithoutNullStreams;
  private buffer = "";
  private onLineCallbacks: ((line: string) => void)[] = [];

  constructor(enginePath: string) {
    this.engine = spawn(enginePath);

    this.engine.stdout.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      let newlineIdx: number;
      while ((newlineIdx = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, newlineIdx).replace(/\r$/, "");
        this.buffer = this.buffer.slice(newlineIdx + 1);
        if (line.length) {
          this.onLineCallbacks.forEach(cb => cb(line));
        }
      }
    });

    this.engine.stderr.on("data", (chunk: Buffer) => {
      console.error("Engine stderr:", chunk.toString());
    });

    this.engine.on("exit", (code, signal) => {
      console.log("Engine exited", code, signal);
    });

    this.engine.on("error", (err) => {
      console.error("Engine error:", err);
    });
  }

  // Subscribe to engine lines
  onLine(cb: (line: string) => void) {
    this.onLineCallbacks.push(cb);
  }

  send(command: string) {
    if (!this.engine.stdin.writable) throw new Error("Engine stdin not writable");
    this.engine.stdin.write(command + "\n");
  }

  waitFor(pattern: RegExp, timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (line: string) => {
        if (pattern.test(line)) {
          this.onLineCallbacks = this.onLineCallbacks.filter(cb => cb !== handler);
          clearTimeout(timer);
          resolve(line);
        }
      };
      const timer = setTimeout(() => {
        this.onLineCallbacks = this.onLineCallbacks.filter(cb => cb !== handler);
        reject(new Error(`Timeout waiting for: ${pattern}`));
      }, timeout);
      this.onLineCallbacks.push(handler);
    });
  }

  async init() {
    this.send("uci");
    await this.waitFor(/^uciok$/);
    this.send("isready");
    await this.waitFor(/^readyok$/);
  }

  async goDepth(depth = 10, timeout = 200000): Promise<string | null> {
    this.send(`go depth ${depth}`);
    const best = await this.waitFor(/^bestmove\s+(\S+)/, timeout);
    const m = best.match(/^bestmove\s+(\S+)/);
    if (m && m[1]) {
        return m[1]
    }
    return null;
  }

  kill() {
    try { this.engine.kill(); } catch {}
  }
}
