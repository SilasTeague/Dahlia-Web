from flask import Flask, request, jsonify

import subprocess

app = Flask(__name__)

@app.route("/move", methods=["POST"])
def get_move():
    data = request.get_json()
    fen = data.get("fen")
    result = subprocess.run(
        ["./engine-bin/dahlia", "fen", fen],
        capture_output=True,
        text=True
    )
    move = result.stdout.strip()
    return jsonify({"move": move})

if __name__ == "__main__":
    app.run(debug=True)
