import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import FloatingWA from '@/components/FloatingWA';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const viewport: Viewport = {
  themeColor: '#371859',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://llabrown.com.ar'),
  title: {
    default: 'La Libertad Avanza · Almirante Brown',
    template: '%s · LLA Almirante Brown',
  },
  description:
    'Bloque de concejales y consejeros escolares de La Libertad Avanza en Almirante Brown. Proyectos en el HCD, reclamos vecinales con seguimiento y presencia en las 13 localidades del distrito.',
  keywords: [
    'La Libertad Avanza',
    'Almirante Brown',
    'Juan Pedro Aquino',
    'Concejales Almirante Brown',
    'HCD Almirante Brown',
    'Reclamos vecinales',
    'Adrogué',
    'Burzaco',
    'Glew',
    'Longchamps',
    'Claypole',
  ],
  authors: [{ name: 'La Libertad Avanza Almirante Brown' }],
  openGraph: {
    title: 'La Libertad Avanza · Almirante Brown',
    description: 'Concejales en el HCD, reclamos con número de seguimiento y trabajo en cada barrio de Brown.',
    url: 'https://llabrown.com.ar',
    siteName: 'LLA Almirante Brown',
    images: [{ url: '/img/a10.jpg', width: 568, height: 820, alt: 'Tu voz construye — Almirante Brown' }],
    locale: 'es_AR',
    type: 'website',
  },
  icons: { icon: '/img/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white font-sans text-[#1d1d1d] antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#371859] focus:shadow-lg"
        >
          Saltar al contenido
        </a>
        {children}
        <FloatingWA />
      </body>
    </html>
  );
}
