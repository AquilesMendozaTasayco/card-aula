"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HiOutlineLogin, HiOutlineAcademicCap } from "react-icons/hi";

export default function AccesoPlataformaSection() {
  const colorRojo = "#8B0000";

  return (
    <section className="relative w-full py-20 overflow-hidden group">
      
      {/* 🖼️ Imagen de Fondo (Foco en el estudiante/docente moderno) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2074&auto=format&fit=crop')", 
        }}
      />

      {/* 🟥 Overlay Rojo Institucional con profundidad */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#2A1810]/fb via-[#8B0000]/95 to-[#8B0000]/80 backdrop-blur-[1px]" />

      {/* Línea decorativa superior */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 z-20" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-20 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12"
      >
        
        {/* 📝 Texto Invitación a la Plataforma */}
        <div className="max-w-2xl text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <HiOutlineAcademicCap className="text-white/60" size={24} />
            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Entorno Virtual de Aprendizaje</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-light text-white leading-tight">
            ¿Ya eres estudiante de CARD? <br />
            <span className="font-black uppercase tracking-tighter text-white">Ingresa a tu aula virtual hoy.</span>
          </h3>
          <p className="mt-4 text-white/80 text-lg font-light max-w-lg">
            Accede a tus materiales, cursos y certificaciones desde cualquier dispositivo.
          </p>
        </div>

        {/* 📥 Botón de Acceso (Link a /admin/login) */}
        <div className="flex flex-col items-center gap-4">
            <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0"
            >
            <Link
                href="/admin/login"
                className="flex items-center gap-4 bg-white text-[#8B0000] font-black px-10 py-5 transition-all duration-300 hover:bg-slate-900 hover:text-white shadow-2xl tracking-[0.2em] uppercase text-[11px] rounded-sm"
            >
                <HiOutlineLogin size={20} />
                Acceder ahora
            </Link>
            </motion.div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest italic">
              Conexión segura para usuarios registrados
            </span>
        </div>

      </motion.div>

      {/* Línea decorativa inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 z-20" />
    </section>
  );
}