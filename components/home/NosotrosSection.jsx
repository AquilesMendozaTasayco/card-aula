"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full py-16 md:py-24 bg-stone-50 overflow-hidden">
      <motion.div 
        className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        
        {/* 📝 Columna de Texto */}
        <div className="relative z-10 order-2 md:order-1">
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
            <div className="w-8 md:w-12 h-[1px]" style={{ backgroundColor: colorAcento }}></div>
            <p className="font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs" style={{ color: colorAcento }}>
              Nuestra Esencia Académica
            </p>
          </motion.div>

          {/* Tamaño de letra reducido para mejor ajuste en móviles */}
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-light text-slate-900 leading-tight">
            Comprometidos con el <br />
            <span className="font-black" style={{ color: colorRojo }}>Magisterio Peruano.</span>
          </motion.h2>

          <motion.div variants={itemVariants} className="mt-6 space-y-5 text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
            <p>
              En el <span className="text-slate-900 font-bold">Centro de Alto Rendimiento Docente (CARD)</span>, nuestra razón de ser es fortalecer las competencias pedagógicas y lingüísticas de los maestros peruano.
            </p>
            
            <p className="border-l-4 border-red-700 pl-6 italic text-slate-500 text-sm md:text-base">
              "Buscamos ser la institución líder en formación docente, reconocida por su excelencia académica y por promover una educación inclusiva e intercultural."
            </p>

            <p className="text-sm md:text-base">
              Bajo la dirección del <span className="text-slate-900 font-semibold">Mg. Reymer Luiz Basilio Gamarra</span>, impulsamos un servicio educativo de calidad.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/nosotros"
              className="inline-block bg-[#8B0000] text-white px-8 py-4 font-black tracking-widest uppercase text-[10px] hover:bg-slate-900 transition-all duration-300 shadow-xl active:scale-95"
            >
              Nuestra Trayectoria
            </Link>
            <div className="flex items-center gap-2">
              <Award className="text-red-700" size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Excelencia CARD</span>
            </div>
          </motion.div>
        </div>

        {/* 🖼️ Columna de Imagen con Logo */}
        <motion.div 
          className="relative group order-1 md:order-2"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { duration: 1, ease: "easeOut" } }
          }}
        >
          {/* Cuadro decorativo de fondo */}
          <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-red-100 z-0 hidden md:block"></div>
          
          {/* Contenedor de Imagen Principal */}
          <div className="relative w-full h-[380px] md:h-[600px] z-10 shadow-2xl overflow-hidden rounded-sm">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
              alt="Centro de Alto Rendimiento Docente"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          {/* Badge con el Logo solicitado */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -top-6 -left-6 md:-top-10 md:-left-10 bg-white p-4 md:p-6 z-20 shadow-2xl border-b-4"
            style={{ borderColor: colorRojo }}
          >
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <Image
                src="/logo-11.png" 
                alt="CARD Logo"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </section>
  );
}