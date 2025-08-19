'use client';

import { useEffect } from 'react';
import ChessBoard from '@/app/components/ChessBoard';

export default function Page() {
  useEffect(() => {
    const activateBackend = async () => {
      try {
        const response = await fetch("https://dahlia-web-irbt.onrender.com");
        if (response.ok) {
          console.log("Render already activated.");
        }
      } catch (error) {
        console.log("Request sent to backend. Activating backend.");
      }
    };

    activateBackend();
  }, []);

  return (
    <ChessBoard />
  );
}
