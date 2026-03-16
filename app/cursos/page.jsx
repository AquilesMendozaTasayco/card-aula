"use client";

import PageHero from "@/components/PageHero";
import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineCheckBadge, HiOutlineAcademicCap } from "react-icons/hi2";
import Image from "next/image";
import Link from "next/link";

const CURSOS_DATA = [
  {
    id: "nombramiento",
    titulo: "NOMBRAMIENTO DOCENTE 2026",
    tag: "INGRESO A LA CPM",
    descripcion: "Programa de alto rendimiento diseñado para asegurar tu ingreso a la Carrera Pública Magisterial. Incluye preparación integral en razonamiento lógico, comprensión lectora y conocimientos pedagógicos específicos por niveles.",
    beneficios: ["Simulacros ilimitados", "Especialistas del MINEDU", "Acceso 24/7 a plataforma"],
    imagen: "/img1.webp",
  },
  {
    id: "ascenso",
    titulo: "ASCENSO DE ESCALA MAGISTERIAL",
    tag: "CRECIMIENTO PROFESIONAL",
    descripcion: "Potenciamos tu trayectoria profesional para alcanzar el siguiente nivel en la escala magisterial. Basado en casuística pedagógica avanzada y análisis crítico de las rúbricas de evaluación vigentes.",
    beneficios: ["Casuística por áreas", "Asesoría personalizada", "Certificación válida para escalafón"],
    imagen: "/img2.png",
  },
  {
    id: "quechua",
    titulo: "DOMINIO DE LENGUAS: QUECHUA",
    tag: "DOMINIO LINGÜÍSTICO",
    descripcion: "Especialización integral en Quechua Central y Sureño. Prepárate para la evaluación de dominio lingüístico con expertos en educación intercultural bilingüe y metodología práctica.",
    beneficios: ["Preparación oral y escrita", "Nivel Básico a Avanzado", "Vocabulario técnico pedagógico"],
    imagen: "/img3.jpg",
  },
];

const STAFF_DATA = {
  director: {
    nombre: "Mg. Reymer Basilio",
    cargo: "Director Académico CARD",
    frase: "Liderando la formación continua con rigor científico y compromiso pedagógico para el magisterio nacional.",
    imagen: "/1.png",
  },
  docentes: [
    { nombre: "Mg. Erik Espinoza", especialidad: "Razonamiento Matemático", foto: "/2.png" },
    { nombre: "Mg. Elías Nieto", especialidad: "Comprensión Lectora", foto: "/3.png" },
    { nombre: "Dra. Zenaida Tinoco", especialidad: "Primaria", foto: "/4.png" },
    { nombre: "Dr. Gilberto Milla", especialidad: "Primaria", foto: "/5.png" },
    { nombre: "Mg. Susana Ancachi", especialidad: "Inicial", foto: "/6.png" },
    { nombre: "Mg. Rosario Nuñez", especialidad: "Inicial", foto: "/7.png" },
    { nombre: "Dr. Pedro Vega", especialidad: "Primaria", foto: "/8.png" },
  ]
};

export default function CursosPage() {
  const WHATSAPP_NUMBER = "+51950017122";
  const imagenHero = "https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&w=1260";
  const imagenCTA = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop";

  // Duplicamos el array para el efecto de carrusel infinito suave
  const infiniteDocentes = [...STAFF_DATA.docentes, ...STAFF_DATA.docentes];

  return (
    <main className="bg-white">
      {/* ── HERO ── */}
      <PageHero title="Nuestros Cursos" image={imagenHero} breadcrumb="Cursos" />

      {/* ── INTRO ── */}
      <section className="py-20 bg-stone-50 border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-[1px] bg-red-600"></div>
            <p className="text-red-600 font-black tracking-[0.3em] uppercase text-xs">Excelencia Académica</p>
            <div className="w-12 h-[1px] bg-red-600"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-8 leading-tight">
            Formación de <span className="font-black text-[#8B0000]">ALTO NIVEL</span>
          </h2>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-light">
            Programas especializados diseñados para responder a las exigencias del sistema educativo actual.
          </p>
        </div>
      </section>

      {/* ── LISTADO DE CURSOS ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          {CURSOS_DATA.map((curso, idx) => (
            <motion.div 
              key={curso.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
            >
              <div className="w-full lg:w-1/2 relative h-[350px] md:h-[500px] shadow-2xl overflow-hidden group rounded-sm bg-stone-100 border border-stone-200">
                <Image src={curso.imagen} alt={curso.titulo} fill className="object-cover transition-transform duration-[2s] group-hover:scale-110" />
                <div className="absolute top-6 left-6">
                  <span className="bg-[#8B0000] text-white px-5 py-2 text-[10px] font-black tracking-[0.2em] uppercase shadow-xl">{curso.tag}</span>
                </div>
              </div>
              <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">{curso.titulo}</h3>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">{curso.descripcion}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  {curso.beneficios.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                      <HiOutlineCheckBadge className="text-red-700 shrink-0" size={22} />
                      <span className="text-slate-800 text-[11px] font-black uppercase tracking-widest">{b}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-6">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "").replace(/\s/g, "")}?text=Información:%20${encodeURIComponent(curso.titulo)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 font-black tracking-[0.2em] uppercase text-[11px] hover:bg-[#8B0000] transition-all duration-500 shadow-xl active:scale-95"
                  >
                    <FaWhatsapp size={20} className="text-green-400" /> Más Información
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}