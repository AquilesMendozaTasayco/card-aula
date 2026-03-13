"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

const programas = [
  {
    id: "nombramiento-docente",
    titulo: "NOMBRAMIENTO DOCENTE 2026",
    estado: "INSCRIPCIONES ABIERTAS",
    descripcion:
      "Preparación integral de alto nivel para asegurar tu ingreso a la Carrera Pública Magisterial con metodologías probadas por expertos.",
    imagen: "/img1.webp", 
  },
  {
    id: "ascenso-escala",
    titulo: "ASCENSO DE ESCALA MAGISTERIAL",
    estado: "GRUPOS NUEVOS",
    descripcion:
      "Potenciamos tu trayectoria profesional para alcanzar el siguiente nivel en la escala magisterial con casuística avanzada.",
    imagen: "/img2.png",
  },
  {
    id: "dominio-lengua",
    titulo: "DOMINIO DE LENGUA ORIGINARIA",
    estado: "ESPECIALIZACIÓN",
    descripcion:
      "Domina el Quechua Central y Sureño para la Evaluación de Dominio Lingüístico con enfoque intercultural y práctico.",
    imagen: "/img3.jpg", 
  },
];

export default function ProgramasCards() {
  const WHATSAPP_NUMBER = "+51950017122";

  return (
    <section className="w-full py-16 md:py-24 bg-stone-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* 🏛️ Header Seccional CARD */}
        <div className="relative mb-12 md:mb-16 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <div className="w-8 md:w-12 h-[1px] bg-red-600"></div>
            <p className="text-red-600 font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[10px] md:text-xs">
              Programas de Alto Rendimiento
            </p>
          </div>
          {/* Tamaño de texto ajustado para móvil (text-3xl) vs desktop (text-6xl) */}
          <h2 className="text-3xl md:text-6xl font-light text-slate-900 leading-tight">
            Nuestros <span className="font-black text-[#8B0000]">CURSOS</span>
          </h2>
        </div>

        {/* 🗂️ Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {programas.map((curso, idx) => (
            <motion.div
              key={curso.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group bg-white border border-stone-200 rounded-sm overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Imagen con Overlay */}
              <div className="relative h-56 md:h-64 w-full overflow-hidden">
                <Image
                  src={curso.imagen}
                  alt={curso.titulo}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#8B0000] text-white px-3 py-1.5 text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase shadow-lg">
                    {curso.estado}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                {/* Título ajustado para móvil */}
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-4 min-h-[auto] md:min-h-[3.5rem]">
                  {curso.titulo}
                </h3>
                
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6 md:mb-8 flex-grow font-medium">
                  {curso.descripcion}
                </p>

                <div className="space-y-6">
                  <div className="h-[1px] w-full bg-stone-100" />
                  
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "").replace(/\s/g, "")}?text=Hola,%20deseo%20más%20información%20sobre%20el%20curso:%20${encodeURIComponent(curso.titulo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 font-black tracking-[0.2em] uppercase text-[10px] hover:bg-red-800 transition-all duration-500 group/btn"
                  >
                    <FaWhatsapp size={18} className="text-green-400 group-hover/btn:text-white transition-colors" />
                    Más Información
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 📜 Pie de sección */}
        <div className="mt-12 md:mt-16 flex items-center justify-center gap-6">
          <div className="h-[1px] flex-grow bg-stone-200 hidden md:block" />
          <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black tracking-widest text-stone-400 uppercase">
            <HiOutlineCheckBadge className="text-red-700" size={16} /> Certificación oficial garantizada
          </div>
          <div className="h-[1px] flex-grow bg-stone-200 hidden md:block" />
        </div>
      </div>
    </section>
  );
}