import type { Metadata } from 'next';
import './globals.css';
import FloatingWA from '@/components/FloatingWA';

export const metadata: Metadata = {
  metadataBase: new URL('https://llabrown.com.ar'),
  title: 'La Libertad Avanza · Almirante Brown | #Tu voz construye',
  description: 'Sitio oficial de La Libertad Avanza en Almirante Brown. Concejales, proyectos de ordenanza, recorridas territoriales, mapa electoral y participación ciudadana. Coordinación: Juan Pedro Aquino.',
  keywords: [
    'La Libertad Avanza',
    'Almirante Brown',
    'Juan Pedro Aquino',
    'Concejales Brown',
    'Tu voz construye',
    'Adrogué',
    'Burzaco',
    'Glew',
    'Longchamps',
    'Claypole',
    'Justicia Electoral PBA'
  ],
  authors: [{ name: 'La Libertad Avanza Almirante Brown' }],
  openGraph: {
    title: 'La Libertad Avanza · Almirante Brown | #Tu voz construye',
    description: 'Más libertad para los vecinos de Almirante Brown. Conocé nuestro equipo, proyectos y mapa territorial interactivo.',
    url: 'https://llabrown.com.ar',
    siteName: 'LLA Almirante Brown',
    images: [
      {
        url: '/img/logo.png',
        width: 800,
        height: 600,
        alt: 'La Libertad Avanza Almirante Brown'
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  icons: {
    icon: '/img/logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0b0614] text-slate-100 min-h-screen font-sans antialiased selection:bg-purple-600 selection:text-white">
        {children}
        <FloatingWA />
      </body>
    </html>
  );
}
