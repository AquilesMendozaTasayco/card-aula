"use client";

import Image from "next/image";
import { ShieldCheck, Clock, Check, GraduationCap, Award, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function QuienesSomos() {
  const COLOR_ROJO = "#8B0000";
  const COLOR_NARANJA = "#D65B2B";
  const COLOR_OSCURO = "#2A1810";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section className="py-24 bg-stone-50 overflow-hidden relative">
      {/* Marca de agua decorativa académica */}
      <div className="absolute top-0 left-0 p-10 opacity-[0.03] pointer-events-none">
        <GraduationCap size={300} />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* TEXTO IZQUIERDA: Identidad CARD */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 48 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-[2px]" 
                style={{ backgroundColor: COLOR_ROJO }} 
              />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em]" style={{ color: COLOR_ROJO }}>
                Liderazgo en Formación
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light uppercase tracking-tighter mb-8 text-slate-900 leading-[1.1]">
              Nuestra <span className="font-black" style={{ color: COLOR_ROJO }}>Misión</span>
            </h2>

            <div className="space-y-6 text-slate-600 text-lg leading-relaxed mb-10 border-l-2 pl-8 font-medium" style={{ borderColor: COLOR_ROJO + '40' }}>
              <p>
                En el <strong className="text-slate-900 font-black">Centro de Alto Rendimiento Docente (CARD)</strong>, nuestra razón de ser es fortalecer las competencias pedagógicas y lingüísticas de los maestros, brindando programas actualizados en planificación y evaluación.
              </p>
              
              <p className="italic text-slate-500 font-light text-xl leading-relaxed">
                "Buscamos ser la institución líder en formación docente, reconocida por promover una educación <span className="text-slate-900 font-bold">inclusiva e intercultural</span> que responda a las demandas reales de nuestro país."
              </p>

              <p>
                Bajo la dirección del <strong style={{ color: COLOR_ROJO }} className="font-black">Mg. Reymer Luiz Basilio Gamarra</strong>, impulsamos un servicio de calidad, especializándonos en Ascenso de Escala y dominio de lenguas originarias como el Quechua.
              </p>
            </div>

            {/* GRID DE PILARES CARD */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: <Award size={20} />, label: "Excelencia Académica" },
                { icon: <BookOpen size={20} />, label: "Dominio Lingüístico" },
                { icon: <Check size={20} />, label: "Ascenso Magisterial" },
                { icon: <ShieldCheck size={20} />, label: "Certificación Oficial" },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 bg-white border-r-4 transition-all duration-300 hover:shadow-xl group" 
                  style={{ borderRightColor: COLOR_ROJO }}
                >
                  <div style={{ color: COLOR_ROJO }} className="group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* IMAGEN DERECHA CON VIGA TRICOLOR */}
          <motion.div 
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative group"
          >
            {/* Viga decorativa lateral (Firma visual de CARD) */}
            <div className="absolute -left-4 top-10 bottom-10 w-1.5 flex flex-col z-20">
              <div className="h-1/2 w-full" style={{ backgroundColor: COLOR_ROJO }} />
              <div className="h-1/4 w-full" style={{ backgroundColor: COLOR_NARANJA }} />
              <div className="h-1/4 w-full" style={{ backgroundColor: COLOR_OSCURO }} />
            </div>

            <div className="relative z-10 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-visible">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.7 }}
                className="overflow-hidden bg-slate-200"
              >
                <Image
                  src="/director-o-clase.jpg" // Asegúrate de tener esta imagen o usa un placeholder
                  alt="Mg. Reymer Luiz Basilio Gamarra - CARD"
                  width={700}
                  height={600}
                  className="object-cover h-[550px] w-full grayscale-[10%] hover:grayscale-0 transition-all duration-1000"
                />
              </motion.div>

              {/* Badge de Años de Trayectoria o Sello CARD */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1, type: "spring", stiffness: 120 }}
                className="absolute -bottom-10 -right-6 md:-right-12 bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.2)] z-30 border-t-4"
                style={{ borderTopColor: COLOR_ROJO }}
              >
                <GraduationCap size={40} style={{ color: COLOR_ROJO }} className="mb-2" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block leading-tight">
                  Líder en <br /> Capacitación <br /> <span className="text-slate-900">CARD 2024</span>
                </span>
              </motion.div>
            </div>

            {/* Puntos decorativos color Naranja */}
            <div className="absolute -top-10 -right-10 opacity-20 -z-10">
              <div className="grid grid-cols-5 gap-2">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_NARANJA }} />
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}