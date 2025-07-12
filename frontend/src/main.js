import {Chess} from "chess.js";

const game = new Chess();

const config = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start',
    pieceTheme: 'img/chesspieces/{piece}.png',
}

const board = Chessboard('board', config);