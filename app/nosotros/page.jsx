"use client";

import PageHero from "@/components/PageHero"; 
import QuienesSomos from "@/components/nosotros/QuienesSomos";
import CulturaCorporativa from "@/components/nosotros/CulturaCorporativa";
import Principios from "@/components/nosotros/Principios";

export default function NosotrosPage() {
  // Imagen de alta calidad: Perspectiva de edificio corporativo/construcción moderna
  const imagenHero = "https://images.pexels.com/photos/443383/pexels-photo-443383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  return (
    <main className="bg-white">
      {/* PageHero con imagen de internet optimizada */}
      <PageHero 
        title="Nuestra Empresa" 
        image={imagenHero} 
        breadcrumb="Nosotros"
      />
      
      
      <QuienesSomos />
      
      <CulturaCorporativa />
      
      <Principios />
    </main>
  );
}