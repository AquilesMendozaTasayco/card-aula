"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHero({ image, title, breadcrumb }) {
  const COLOR_ROJO = "#8B0000";
  const COLOR_NARANJA = "#D65B2B";
  const COLOR_FONDO_OSCURO = "#2A1810";

  return (
    <section className="relative w-full h-[45vh] md:h-[60vh] flex items-center bg-[#2A1810] overflow-hidden">
      
      {/* Fondo con imagen y overlay de gradiente rojo/café */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: image 
              ? `linear-gradient(to right, rgba(42,24,16,0.95), rgba(42,24,16,0.4)), url(${image})`
              : `linear-gradient(135deg, #2A1810 0%, #4a2010 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20">
        <div className="max-w-3xl">
          {/* Tag superior con el Rojo Institucional */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-black tracking-[0.4em] text-[10px] md:text-xs uppercase mb-4 text-red-600"
          >
            Centro de Alto Rendimiento Docente
          </motion.p>

          {/* Título: Primera palabra Light, resto Black */}
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl text-white font-light leading-tight uppercase tracking-tighter"
          >
            {title.split(' ')[0]} <span className="font-black">{title.split(' ').slice(1).join(' ')}</span>
          </motion.h1>

          {/* Breadcrumb con estilo de cápsula minimalista */}
          {breadcrumb && (
            <motion.nav 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex items-center gap-4"
            >
              <div className="flex items-center gap-3 px-5 py-2.5 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full">
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                  Inicio
                </Link>
                <ChevronRight size={12} className="text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {breadcrumb}
                </span>
              </div>
            </motion.nav>
          )}
        </div>
      </div>

      {/* Indicador visual lateral con el color Rojo */}
      <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-4 z-20">
        <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-red-700 to-transparent" />
        <span className="text-[10px] font-black text-red-700 [writing-mode:vertical-lr] uppercase tracking-widest">
          CARD 2024
        </span>
      </div>

      {/* Viga inferior tricolor idéntica al Login */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 flex">
        <div className="h-full w-1/2" style={{ backgroundColor: COLOR_ROJO }} />
        <div className="h-full w-1/4" style={{ backgroundColor: COLOR_NARANJA }} />
        <div className="h-full w-1/4" style={{ backgroundColor: "#502814" }} />
      </div>

    </section>
  );
}