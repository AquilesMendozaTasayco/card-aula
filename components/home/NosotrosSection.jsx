"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Award } from "lucide-react";

export default function NosotrosCARD() {
  const colorRojo = "#8B0000"; 
  const colorAcento = "#EF3340";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full py-24 bg-stone-50 overflow-hidden">
      <motion.div 
        className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        
        {/* 📝 Columna de Texto Integrada */}
        <div className="relative z-10">
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4">
            <div className="w-12 h-[1px]" style={{ backgroundColor: colorAcento }}></div>
            <p className="font-bold tracking-[0.2em] uppercase text-sm" style={{ color: colorAcento }}>
              Nuestra Esencia Académica
            </p>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-light text-slate-900 leading-tight">
            Comprometidos con el <br />
            <span className="font-black" style={{ color: colorRojo }}>Magisterio Peruano.</span>
          </motion.h2>

          <motion.div variants={itemVariants} className="mt-8 space-y-6 text-slate-600 text-lg leading-relaxed max-w-xl">
            <p>
              En el <span className="text-slate-900 font-bold">Centro de Alto Rendimiento Docente (CARD)</span>, nuestra razón de ser es fortalecer las competencias pedagógicas y lingüísticas de los maestros, brindando programas formativos actualizados en planificación, evaluación y metodologías innovadoras.
            </p>
            
            <p className="border-l-4 border-red-700 pl-6 italic text-slate-500">
              "Buscamos ser la institución líder en formación docente, reconocida por su excelencia académica y por promover una educación inclusiva e intercultural que responda a las demandas reales de nuestro país."
            </p>

            <p>
              Bajo la dirección del <span className="text-slate-900 font-semibold">Mg. Reymer Luiz Basilio Gamarra</span>, impulsamos un servicio educativo de calidad, especializándonos en la preparación para el ascenso y el dominio de lenguas originarias como el quechua.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10 flex items-center gap-8">
            <Link
              href="/nosotros"
              className="inline-block bg-[#8B0000] text-white px-10 py-4 font-black tracking-widest uppercase text-[10px] hover:bg-slate-900 transition-all duration-300 shadow-xl"
            >
              Nuestra Trayectoria
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Award className="text-red-700" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Excelencia CARD</span>
            </div>
          </motion.div>
        </div>

        {/* 🖼️ Columna de Imagen */}
        <motion.div 
          className="relative group"
          variants={{
            hidden: { opacity: 0, x: 50 },
            visible: { opacity: 1, x: 0, transition: { duration: 1, ease: "easeOut" } }
          }}
        >
          {/* Cuadro decorativo de fondo */}
          <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-red-100 z-0 hidden md:block transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2"></div>
          
          {/* Contenedor de Imagen */}
          <div className="relative w-full h-[500px] md:h-[650px] z-10 shadow-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
              alt="Centro de Alto Rendimiento Docente"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
          </div>

          {/* Badge Flotante */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -top-8 -left-8 bg-white p-10 z-20 hidden lg:block shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-b-4"
            style={{ borderColor: colorRojo }}
          >
            <GraduationCap size={44} style={{ color: colorRojo }} className="mb-3" />
            <p className="text-slate-900 text-4xl font-black leading-none tracking-tighter">CARD</p>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase mt-2">
              Capacitación <br /> de alto nivel
            </p>
          </motion.div>
        </motion.div>

      </motion.div>
    </section>
  );
}