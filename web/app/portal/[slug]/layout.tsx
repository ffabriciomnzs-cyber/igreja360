import type { Metadata, Viewport } from 'next';

// Metadados do portal por igreja: liga o manifesto PWA, ícones e modo "app" no iOS.
export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  return {
    manifest: `/portal/${params.slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Portal',
    },
    icons: {
      icon: '/icons/icon-192.png',
      apple: '/icons/apple-touch-icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export default function PortalSlugLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
