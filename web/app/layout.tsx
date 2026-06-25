import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Igreja360 — Gestão clara. Igreja saudável.',
  description: 'Plataforma de gestão completa para igrejas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
