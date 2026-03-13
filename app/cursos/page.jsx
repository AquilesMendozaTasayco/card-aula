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

      {/* ── SECCIÓN STAFF (FONDO BLANCO / CARRUSEL AUTOMÁTICO) ── */}
      <section className="py-24 bg-white border-t border-stone-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <div className="flex items-center justify-center gap-3 text-red-600 mb-2">
              <HiOutlineAcademicCap size={28} />
              <span className="font-black tracking-[0.4em] uppercase text-xs">Excelencia CARD</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase">
              Nuestro <span className="text-red-700 underline decoration-stone-200 underline-offset-8">Staff</span>
            </h2>
          </div>

          {/* Director Destacado */}
          <div className="flex flex-col md:flex-row gap-12 items-center mb-24 border border-stone-200 p-8 md:p-12 rounded-sm shadow-sm bg-stone-50/50">
            <div className="w-48 h-48 md:w-64 md:h-64 relative rounded-sm overflow-hidden border border-stone-200 shrink-0 shadow-lg">
              <Image src={STAFF_DATA.director.imagen} alt={STAFF_DATA.director.nombre} fill className="object-cover" />
            </div>
            <div className="text-center md:text-left space-y-4">
              <span className="text-red-700 font-black tracking-[0.2em] text-[10px] uppercase border-b-2 border-red-700 pb-1">Dirección Académica</span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase">{STAFF_DATA.director.nombre}</h3>
              <p className="text-slate-600 text-lg font-light italic max-w-2xl italic leading-relaxed">"{STAFF_DATA.director.frase}"</p>
            </div>
          </div>

          {/* Carrusel Automático de 6 Profesores */}
          <div className="relative">
            <motion.div 
              className="flex gap-6"
              animate={{ x: [0, -1920] }} // Ajusta según el ancho total
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {infiniteDocentes.map((docente, index) => (
                <div key={index} className="min-w-[280px] md:min-w-[320px] bg-white border border-stone-200 group">
                  {/* Se eliminó la clase 'grayscale' para mostrar color normal */}
                  <div className="relative h-[400px] w-full transition-all duration-700 overflow-hidden">
                    <Image src={docente.foto} alt={docente.nombre} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-70" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      <p className="text-red-500 font-black text-[9px] tracking-[0.3em] uppercase mb-1">{docente.especialidad}</p>
                      <h4 className="text-white font-black text-lg uppercase tracking-tight">{docente.nombre}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative py-20 md:py-24 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image src={imagenCTA} alt="Fondo" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#2A1810]/85" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white/5 backdrop-blur-md border border-white/10 p-10 md:p-14 text-center rounded-sm">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-8 leading-tight uppercase tracking-tight">
              ¿Tienes dudas sobre la <span className="font-black">MODALIDAD DE ESTUDIO</span>?
            </h2>
            <Link href="/contacto" className="inline-block border border-white text-white px-12 py-5 font-black tracking-[0.3em] uppercase text-[11px] hover:bg-white hover:text-[#2A1810] transition-all duration-500 shadow-2xl">
              Hablar con un asesor
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}