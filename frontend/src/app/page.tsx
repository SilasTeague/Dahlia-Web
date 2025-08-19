import ChessBoard from '@/app/components/ChessBoard';

export default function Page() {
    async function activateBackend() {
      try {
        const response = await fetch("https://dahlia-web-irbt.onrender.com");
        if (response) {
          console.log("Render already activated.");
        }
      } catch (error) {
        console.log("Request sent to backend. Activating backend.")
      }
    }
  
    activateBackend();
  return (
    <ChessBoard />
  );
}