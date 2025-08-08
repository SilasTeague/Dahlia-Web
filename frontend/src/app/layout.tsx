import type { Metadata } from 'next';
import './globals.css';
import './components/chessboard.css'

export const metadata: Metadata = {
  title: 'Dahlia Web',
  description: 'A web application that supports chess games against the Dahlia engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}