import HeroCarousel from "@/components/home/Hero";
import NosotrosSection from "@/components/home/NosotrosSection";
import ProyectosSlider from "@/components/home/ProyectosSlider";
import BrochureSection from "@/components/home/BrochureSection";

export default function Home() {
  return (
    <main>
      <HeroCarousel />
      <NosotrosSection />
      <BrochureSection />
      <ProyectosSlider />
    </main>
  );
}