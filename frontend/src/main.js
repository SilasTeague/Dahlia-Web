import {Chess} from "chess.js";

const game = new Chess();

const config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
}

const board = Chessboard('board', config);