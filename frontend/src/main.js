import {Chess} from "chess.js";

let board = null;
const game = new Chess();

const statusElement = document.getElementById('status');
statusElement.textContent = "";

let selectedSquare = null;
let suppressNextDrop = false;

function onDragStart(source, piece, position, orientation) {
    if (game.isGameOver()) return false;

    // Only allow dragging the side to move
    if ((game.turn() === 'w' && piece.startsWith('b')) ||
        (game.turn() === 'b' && piece.startsWith('w'))) {
        return false;
    }
}

function onDrop(source, target) {
    try {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // TODO: other promotions
        });

        updateStatus();
    } catch (error) {
        console.log(error);
    }
    
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.isCheckmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
    } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
        status = 'Game over, drawn position.';
    } else {
        status = `${moveColor} to move`;
        if (game.isCheck()) {
            status += `, ${moveColor} is in check`;
        }
    }

    statusElement.textContent = status;
}


function onSquareClick(square) {
    console.log("Clicked square:", square); 
    if (!selectedSquare) {
        // First click: pick a piece to move
        const piece = game.get(square);
        if (!piece) return;

        const turn = game.turn();
        const isTurn = (turn === 'w' && piece.color === 'w') || (turn === 'b' && piece.color === 'b');
        if (!isTurn) return;

        selectedSquare = square;
    } else {
        // Second click: attempt move
        const piece = game.get(square);
        const turn = game.turn();
        if (piece && piece.color === turn) {
            selectedSquare = square;
            return;
        }
        try {
            const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
            });

            selectedSquare = null;
            board.position(game.fen());
            updateStatus();  
        } catch (error) {
            console.log(error);
        }
    }
}

function enableSquareClicking() {
  const boardElement = document.getElementById('board');

  boardElement.addEventListener('click', function (event) {
    let target = event.target;

    if (!target.classList.contains('square-55d63')) return;

    const classList = Array.from(target.classList);
    const squareClass = classList.find(c => /^square-[a-h][1-8]$/.test(c));
    if (!squareClass) return;

    const square = squareClass.replace('square-', '');
    onSquareClick(square);
  });
}


// Chessboard.js config
const config = {
    draggable: true,
    position: 'start',
    pieceTheme: '/img/chesspieces/{piece}.png',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = Chessboard('board', config);

enableSquareClicking();
updateStatus();
