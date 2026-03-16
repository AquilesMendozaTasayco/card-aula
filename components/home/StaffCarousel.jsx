"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HiOutlineAcademicCap } from "react-icons/hi2";

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

const StaffCarousel = () => {
  // Duplicamos el array para el efecto de carrusel infinito suave
  const infiniteDocentes = [...STAFF_DATA.docentes, ...STAFF_DATA.docentes];

  return (
    <section className="py-24 bg-white border-t border-stone-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Cabecera de Sección */}
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
            <Image 
              src={STAFF_DATA.director.imagen} 
              alt={STAFF_DATA.director.nombre} 
              fill 
              className="object-cover" 
            />
          </div>
          <div className="text-center md:text-left space-y-4">
            <span className="text-red-700 font-black tracking-[0.2em] text-[10px] uppercase border-b-2 border-red-700 pb-1">
              {STAFF_DATA.director.cargo}
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase">
              {STAFF_DATA.director.nombre}
            </h3>
            <p className="text-slate-600 text-lg font-light italic max-w-2xl leading-relaxed">
              "{STAFF_DATA.director.frase}"
            </p>
          </div>
        </div>

        {/* Carrusel Automático de Profesores */}
        <div className="relative">
          <motion.div 
            className="flex gap-6"
            animate={{ x: [0, -1920] }} 
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {infiniteDocentes.map((docente, index) => (
              <div key={index} className="min-w-[280px] md:min-w-[320px] bg-white border border-stone-200 group">
                <div className="relative h-[400px] w-full transition-all duration-700 overflow-hidden">
                  <Image 
                    src={docente.foto} 
                    alt={docente.nombre} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  {/* Overlay Gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-70" />
                  
                  {/* Información del Docente */}
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <p className="text-red-500 font-black text-[9px] tracking-[0.3em] uppercase mb-1">
                      {docente.especialidad}
                    </p>
                    <h4 className="text-white font-black text-lg uppercase tracking-tight">
                      {docente.nombre}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default StaffCarousel;