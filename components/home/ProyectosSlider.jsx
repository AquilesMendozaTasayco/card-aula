"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheckBadge } from "react-icons/hi2";

const programas = [
  {
    id: "nombramiento-docente",
    titulo: "NOMBRAMIENTO DOCENTE 2026",
    estado: "INSCRIPCIONES ABIERTAS",
    descripcion:
      "Preparación integral de alto nivel para asegurar tu ingreso a la Carrera Pública Magisterial con metodologías probadas.",
    caracteristicas: [
      "Comprensión Lectora Crítica",
      "Razonamiento Lógico Matemático",
      "Conocimientos Pedagógicos",
      "Simulacros Tipo Examen",
    ],
    imagenPrincipal: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?q=80&w=2070&auto=format&fit=crop", 
    imagenHover: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop",
    href: "/cursos/nombramiento",
  },
  {
    id: "quechua-central-sureno",
    titulo: "DOMINIO DE LENGUAS: QUECHUA",
    estado: "ESPECIALIZACIÓN",
    descripcion:
      "Domina el Quechua Central y Sureño para la Evaluación de Dominio Lingüístico. Formación con enfoque intercultural.",
    caracteristicas: [
      "Niveles: Básico, Intermedio, Avanzado",
      "Preparación para Examen Oral",
      "Preparación para Examen Escrito",
      "Certificación Oficial",
    ],
    imagenPrincipal: "https://images.unsplash.com/photo-1584905066891-039130095827?q=80&w=2070&auto=format&fit=crop", 
    imagenHover: "https://images.unsplash.com/photo-1517147177326-b37599372b73?q=80&w=2070&auto=format&fit=crop",
    href: "/cursos/quechua",
  },
  {
    id: "ascenso-escala",
    titulo: "ASCENSO DE ESCALA MAGISTERIAL",
    estado: "GRUPOS NUEVOS",
    descripcion:
      "Potenciamos tu trayectoria profesional para alcanzar el siguiente nivel en la escala magisterial con expertos en el área.",
    caracteristicas: [
      "Casuística Pedagógica Avanzada",
      "Especialidades por Áreas",
      "Asesoría Personalizada",
      "Recursos Digitales 24/7",
    ],
    imagenPrincipal: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    imagenHover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    href: "/cursos/ascenso",
  },
];

function BadgeEstado({ estado }) {
  return (
    <span className="bg-[#8B0000] text-white px-5 py-2 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg">
      {estado}
    </span>
  );
}

export default function ProgramasSlider() {
  const [index, setIndex] = useState(0);
  const total = programas.length;
  const curso = programas[index];

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <section className="w-full py-24 bg-stone-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* 🏛️ Header Seccional CARD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[1px] bg-red-600"></div>
              <p className="text-red-600 font-black tracking-[0.3em] uppercase text-xs">
                Programas de Alto Rendimiento
              </p>
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight">
              Nuestras <span className="font-black text-[#8B0000]">ESPECIALIZACIONES</span>
            </h2>
          </div>

          {/* Controles Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={prev}
              className="p-5 border border-slate-200 text-slate-900 hover:bg-red-800 hover:text-white transition-all duration-300 shadow-sm"
            >
              <HiOutlineArrowLeft size={24} />
            </button>
            <button
              onClick={next}
              className="p-5 border border-slate-200 text-slate-900 hover:bg-red-800 hover:text-white transition-all duration-300 shadow-sm"
            >
              <HiOutlineArrowRight size={24} />
            </button>
          </div>
        </div>

        {/* 🖼️ Contenedor del Slide */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={curso.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Imagen Izquierda (Efecto Swap) */}
            <div className="group relative w-full h-[450px] md:h-[600px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.1)] rounded-sm">
              <Image
                src={curso.imagenPrincipal}
                alt={curso.titulo}
                fill
                className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:opacity-40"
                priority
              />
              <Image
                src={curso.imagenHover}
                alt={curso.titulo}
                fill
                className="object-cover scale-110 opacity-0 transition-all duration-1000 group-hover:opacity-100 group-hover:scale-100"
              />
              <div className="absolute top-0 left-0 z-10">
                <BadgeEstado estado={curso.estado} />
              </div>
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/40 transition-colors duration-500" />
            </div>

            {/* Info Derecha */}
            <div className="space-y-8">
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                {curso.titulo}
              </h3>

              <p className="text-slate-600 text-xl leading-relaxed font-light">
                {curso.descripcion}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 border-y border-slate-200 py-10">
                {curso.caracteristicas.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <HiOutlineCheckBadge className="text-red-700" size={20} />
                    <span className="text-slate-800 text-xs font-black uppercase tracking-widest">{c}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center gap-10">
                <Link
                  href={curso.href}
                  className="w-full sm:w-auto inline-block bg-slate-900 text-white px-12 py-5 font-black tracking-[0.2em] uppercase text-[11px] hover:bg-red-800 transition-all duration-500 shadow-xl rounded-sm"
                >
                  Más información
                </Link>

                {/* Indicadores Lineales */}
                <div className="flex items-center gap-4">
                  {programas.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setIndex(i)}
                      className={`h-[3px] transition-all duration-700 ${
                        i === index ? "w-16 bg-red-700" : "w-6 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controles Móvil */}
        <div className="mt-12 flex md:hidden items-center gap-2">
          <button onClick={prev} className="flex-1 py-5 border border-slate-900 text-slate-900 font-black uppercase text-[10px] tracking-widest">
            Anterior
          </button>
          <button onClick={next} className="flex-1 py-5 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
            Siguiente
          </button>
        </div>

      </div>
    </section>
  );
}