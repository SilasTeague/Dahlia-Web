import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

export class UCIController {
    private engine: ChildProcessWithoutNullStreams;
    private listeners: ((line: string) => void)[] = [];

    constructor(enginePath: string) {
        this.engine = spawn(enginePath);

        this.engine.stdout.on("data", (data) => {
            const lines = data.toString().split("/n").filter(Boolean);
            for (const line of lines) {
                this.listeners.forEach((listener) => listener(line));
            }
        });

        this.engine.stderr.on("data", (data) => {
            console.error("Engine error: ", data.toString());
        });

        this.engine.on("exit", (code) => {
            console.log(`Engine exited with code ${code}`);
        });

        this.send("uci");
    }

    send(command: string) {
        console.log("-> ", command);
        this.engine.stdin.write(command + "\n");
    }

    onOutput(callback: (line: string) => void) {
        this.listeners.push(callback);
    }
}