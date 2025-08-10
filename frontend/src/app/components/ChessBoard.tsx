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
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState('White to move');
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [boardJsLoaded, setBoardJsLoaded] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to backend WebSocket');
      setConnected(true);
      // Send start message to initialize game
      socket.send(JSON.stringify({ type: "start" }));
    };

    socket.onmessage = (event) => {
      console.log('From engine:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === "engineMove" && data.data?.move) {
          const engineMove = data.data.move;
          console.log('Engine move:', engineMove);
          
          // Apply engine move to the game
          try {
            const move = gameRef.current.move(engineMove);
            if (move) {
              boardInstanceRef.current?.position(gameRef.current.fen());
              updateStatus();
            }
          } catch (err) {
            console.error('Failed to apply engine move:', engineMove, err);
          }
        } else if (data.type === "error") {
          console.error('Engine error:', data.data?.message);
          setStatus(`Error: ${data.data?.message || 'Unknown error'}`);
        } else if (data.type === "engineOutput") {
          // Just log engine debug output
          console.log('Engine debug:', data.data?.line);
        } else if (data.type === "gameStarted") {
          console.log('Game started');
        }
      } catch (err) {
        console.error('Invalid message from backend:', event.data, err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    socket.onclose = (event) => {
      console.log('Disconnected from backend. Code:', event.code, 'Reason:', event.reason);
      setConnected(false);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

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

  useEffect(() => {
    if (!jqueryLoaded || !boardJsLoaded || !boardRef.current) return;

    const config = {
      draggable: true,
      position: 'start',
      pieceTheme: '/img/chesspieces/{piece}.png',
      onDragStart: (source: string, piece: string) => {
        if (gameRef.current.isGameOver()) return false;
        
        // Only allow white pieces to move (assuming player is white)
        if (!piece.startsWith('w')) return false;
        
        // Only allow moves when it's white's turn
        if (gameRef.current.turn() !== 'w') return false;
        
        return true;
      },
      onDrop: (source: string, target: string, piece: string) => {
        try {
          // Check if this is a promotion move
          const sourceRank = source[1];
          const targetRank = target[1];
          const isPawn = piece.toLowerCase().includes('p');
          const isPromotion = isPawn && 
            ((piece.startsWith('w') && sourceRank === '7' && targetRank === '8') ||
             (piece.startsWith('b') && sourceRank === '2' && targetRank === '1'));

          // Attempt the move - only add promotion for actual promotion moves
          const moveOptions: any = {
            from: source,
            to: target,
          };
          
          if (isPromotion) {
            moveOptions.promotion = 'q'; // TODO: Add promotion GUI
          }

          const move = gameRef.current.move(moveOptions);
          
          if (move === null) {
            console.log('Invalid move attempted:', source, 'to', target);
            return 'snapback';
          }

          console.log('Valid move made:', move);
          updateStatus();
          
          // Send move to backend - use UCI format (e.g., "e2e4")
          let uciMove = `${source}${target}`;
          if (isPromotion) {
            uciMove += 'q'; // Add promotion piece (again, awating GUI implementation for other promotions)
          }
          
          if (socketRef.current) {
            console.log('WebSocket state:', socketRef.current.readyState);
            console.log('Connected state:', connected);
            
            if (socketRef.current.readyState === WebSocket.OPEN) {
              const message = { 
                type: "move", 
                data: { move: uciMove }
              };
              console.log('Sending to backend:', message);
              try {
                socketRef.current.send(JSON.stringify(message));
              } catch (err) {
                console.error('Error sending message:', err);
                setConnected(false);
              }
            } else {
              console.warn('WebSocket not open. State:', socketRef.current.readyState);
              setConnected(false);
            }
          } else {
            console.warn('Cannot send move - no WebSocket connection');
          }

        } catch (e) {
          console.log('Invalid move error:', e);
          return 'snapback';
        }
      },
      onSnapEnd: () => {
        // Ensure board position matches game state
        if (boardInstanceRef.current) {
          boardInstanceRef.current.position(gameRef.current.fen());
        }
      },
    };

    boardInstanceRef.current = window.Chessboard(boardRef.current, config);
    updateStatus();

    return () => {
      boardInstanceRef.current?.destroy();
    };
  }, [jqueryLoaded, boardJsLoaded]);

  const resetGame = () => {
    gameRef.current.reset();
    boardInstanceRef.current?.position('start');
    updateStatus();
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify({ type: "start" }));
    }
  };

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
      
        <div style={{ marginTop: '10px' }}>
            <div id="status">{status}</div>
        </div>
        <button onClick={resetGame} className="bg-yellow-400 hover:bg-yellow-500 relative h-12 overflow-hidden rounded bg-neutral-950 px-5 py-2.5 text-white transition-all duration-300 hover:bg-neutral-800 hover:ring-2 hover:ring-neutral-800 hover:ring-offset-2">
            New Game
        </button>
    </div>
  );
}