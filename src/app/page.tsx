import Header from '@/components/Header';
import Hero from '@/components/Hero';
import InteractiveTour from '@/components/InteractiveTour';
import ElectoralMap from '@/components/ElectoralMap';
import TerritorioGallery from '@/components/TerritorioGallery';
import ProyectosSection from '@/components/ProyectosSection';
import EquipoSection from '@/components/EquipoSection';
import ContactoSection from '@/components/ContactoSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0614] text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <Header />
      <Hero />
      <InteractiveTour />
      <ElectoralMap />
      <TerritorioGallery />
      <ProyectosSection />
      <EquipoSection />
      <ContactoSection />
      <Footer />
    </main>
  );
}
