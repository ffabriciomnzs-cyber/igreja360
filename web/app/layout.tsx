import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Fonte da marca. `variable` + Tailwind (font-sans) em vez de className direto,
// para valer também dentro de portais/modais. Self-hosted pelo next/font:
// nenhuma requisição ao Google em runtime.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
