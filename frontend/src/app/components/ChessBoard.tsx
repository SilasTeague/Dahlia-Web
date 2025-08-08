'use client';

import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Script from 'next/script';
import Head from 'next/head';

declare global {
  interface Window {
    Chessboard: any;
    $: any;
  }
}

export default function ChessBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstanceRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const [status, setStatus] = useState('White to move');
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [boardJsLoaded, setBoardJsLoaded] = useState(false);

  useEffect(() => {
    if (!jqueryLoaded || !boardJsLoaded || !boardRef.current) return;

    const updateStatus = () => {
      let newStatus = '';
      const moveColor = gameRef.current.turn() === 'w' ? 'White' : 'Black';
      if (gameRef.current.isCheckmate()) {
        newStatus = `Game over, ${moveColor} is in checkmate.`;
      } else if (gameRef.current.isDraw()) {
        newStatus = 'Game over, drawn position.';
      } else {
        newStatus = `${moveColor} to move`;
        if (gameRef.current.isCheck()) {
          newStatus += `, ${moveColor} is in check`;
        }
      }
      setStatus(newStatus);
    };

    const config = {
      draggable: true,
      position: 'start',
      pieceTheme: '/img/chesspieces/{piece}.png',
      onDragStart: (source: string, piece: string) => {
        if (!gameRef.current.isGameOver()) {
          if ((gameRef.current.turn() === 'w' && piece.startsWith('b')) ||
              (gameRef.current.turn() === 'b' && piece.startsWith('w'))) {
            return false;
          }
        }
        return true;
      },
      onDrop: (source: string, target: string) => {
        try {
            const move = gameRef.current.move({
            from: source,
            to: target,
            promotion: 'q', // TODO: Add GUI to handle promotions
            });
            if (move === null) return 'snapback';
            updateStatus();
        } catch (e) {
            console.log('Invalid move', e);
            return 'snapback';
        }
      },
      onSnapEnd: () => {
        boardInstanceRef.current.position(gameRef.current.fen());
      },
    };

    boardInstanceRef.current = window.Chessboard(boardRef.current, config);
    updateStatus();

    return () => {
      boardInstanceRef.current?.destroy();
    };
  }, [jqueryLoaded, boardJsLoaded]);

  return (
    <div className="chess-container">
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css"
        />
      </Head>

      <Script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        strategy="afterInteractive"
        onLoad={() => setJqueryLoaded(!!window.$)}
      />
      <Script
        src="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js"
        strategy="afterInteractive"
        onLoad={() => setBoardJsLoaded(!!window.Chessboard)}
      />

      <div id="board" ref={boardRef} style={{ width: '100%', maxWidth: '400px' }}></div>
      <div id="status">{status}</div>
    </div>
  );
}
