"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

// Rutas donde NO se muestra Navbar ni Footer
const RUTAS_SIN_LAYOUT = ["/admin", "/estudiante", "/login"];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  const ocultarLayout = RUTAS_SIN_LAYOUT.some(ruta => pathname.startsWith(ruta));

  return (
    <>
      {!ocultarLayout && <Navbar />}
      {children}
      {!ocultarLayout && <Footer />}
    </>
  );
}