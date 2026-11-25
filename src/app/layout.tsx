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
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'La Libertad Avanza Almirante Brown | Bloque de Concejales y Gestión Vecinal',
    template: '%s | LLA Almirante Brown',
  },
  description:
    'Bloque de concejales y consejeros escolares de La Libertad Avanza en Almirante Brown. Cargá reclamos barriales con código de seguimiento, consultá expedientes en el HCD y sumate en las 12 localidades.',
  keywords: [
    'La Libertad Avanza Almirante Brown',
    'Juan Pedro Aquino',
    'Concejales Almirante Brown',
    'HCD Almirante Brown',
    'Reclamos vecinales Almirante Brown',
    'Digesto HCD Brown',
    'Adrogué',
    'Burzaco',
    'Glew',
    'Longchamps',
    'Claypole',
    'Rafael Calzada',
    'San José',
    'Solano',
  ],
  authors: [{ name: 'La Libertad Avanza Almirante Brown' }],
  openGraph: {
    title: 'La Libertad Avanza Almirante Brown',
    description:
      'Reclamos vecinales con código de seguimiento, proyectos de baja de tasas en el HCD y presencia en las 12 localidades de Almirante Brown.',
    url: 'https://llabrown.com.ar',
    siteName: 'La Libertad Avanza Almirante Brown',
    images: [
      {
        url: '/img/a6.jpg',
        width: 1600,
        height: 1200,
        alt: 'Bloque de Concejales de La Libertad Avanza en Almirante Brown',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Libertad Avanza Almirante Brown',
    description:
      'Reclamos barriales con seguimiento legislativo, expedientes en el HCD y trabajo territorial en Almirante Brown.',
    images: ['/img/a6.jpg'],
  },
  icons: { icon: '/img/logo.png' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://llabrown.com.ar/#organization',
      name: 'La Libertad Avanza Almirante Brown',
      url: 'https://llabrown.com.ar',
      logo: 'https://llabrown.com.ar/img/logo.png',
      description:
        'Bloque institucional de concejales y consejeros escolares de La Libertad Avanza en el Partido de Almirante Brown, Provincia de Buenos Aires.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Humberto Primo 990',
        addressLocality: 'Burzaco',
        addressRegion: 'Provincia de Buenos Aires',
        addressCountry: 'AR',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+54-9-11-3159-6936',
        contactType: 'Atención vecinal',
        areaServed: 'Almirante Brown',
        availableLanguage: ['es'],
      },
      sameAs: [
        'https://www.instagram.com/lalibertadavanza_altebrownok',
        'https://www.facebook.com/lalibertadavanzaaltebrown',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://llabrown.com.ar/#website',
      url: 'https://llabrown.com.ar',
      name: 'La Libertad Avanza Almirante Brown',
      inLanguage: 'es-AR',
      publisher: {
        '@id': 'https://llabrown.com.ar/#organization',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-[#1d1d1d] antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#371859] focus:shadow-lg"
        >
          Saltar al contenido principal
        </a>
        {children}
        <FloatingWA />
      </body>
    </html>
  );
}
