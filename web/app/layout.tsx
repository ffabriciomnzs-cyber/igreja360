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
    // suppressHydrationWarning: o script abaixo pode acrescentar a classe
    // `dark` antes de o React hidratar, e essa diferença é proposital.
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo ANTES da primeira pintura — sem isso, quem usa
            modo escuro veria um flash branco a cada navegação. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('igreja360.theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
