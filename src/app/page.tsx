import Header from '@/components/Header';
import Hero from '@/components/Hero';
import PlataformasStrip from '@/components/PlataformasStrip';
import NacionSection from '@/components/NacionSection';
import ElectoralMap from '@/components/ElectoralMap';
import ReclamosSection from '@/components/ReclamosSection';
import TerritorioGallery from '@/components/TerritorioGallery';
import EquipoSection from '@/components/EquipoSection';
import ContactoSection from '@/components/ContactoSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main id="contenido" className="min-h-screen bg-white text-[#1d1d1d] flex flex-col selection:bg-[#371859] selection:text-white">
      <Header />
      <Hero />
      <PlataformasStrip />
      <NacionSection />
      <ElectoralMap />
      <ReclamosSection />
      <TerritorioGallery />
      <EquipoSection />
      <ContactoSection />
      <Footer />
    </main>
  );
}
