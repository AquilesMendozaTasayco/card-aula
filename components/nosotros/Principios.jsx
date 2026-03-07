"use client";

import { CheckCircle2, Users, TrendingUp, Handshake, ShieldCheck, BookOpen, GraduationCap, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Principios() {
  const COLOR_ROJO = "#8B0000";
  const COLOR_NARANJA = "#D65B2B";
  const COLOR_OSCURO = "#2A1810";

  const principios = [
    {
      title: "Excelencia Académica",
      desc: "Mantener los más altos estándares en formación docente y rigor pedagógico en el mercado peruano.",
      icon: <GraduationCap size={24} />
    },
    {
      title: "Innovación Continua",
      desc: "Ser la mejor opción mediante metodologías actualizadas y herramientas digitales de vanguardia.",
      icon: <TrendingUp size={24} />
    },
    {
      title: "Enfoque Humano",
      desc: "Valorar al maestro como el eje central del cambio social y motor de nuestra institución.",
      icon: <Users size={24} />
    },
    {
      title: "Eficacia en Ascenso",
      desc: "Garantizar resultados concretos en la preparación para la escala magisterial y metas profesionales.",
      icon: <CheckCircle2 size={24} />
    },
    {
      title: "Identidad Cultural",
      desc: "Promover el dominio de lenguas originarias y el respeto por nuestra herencia intercultural.",
      icon: <Globe size={24} />
    },
    {
      title: "Calidad Certificada",
      desc: "Compromiso absoluto con la veracidad técnica y pedagógica en cada módulo formativo.",
      icon: <ShieldCheck size={24} />
    },
    {
      title: "Pedagogía Inclusiva",
      desc: "Desarrollar estrategias que respondan a la diversidad real de las aulas en todo el país.",
      icon: <BookOpen size={24} />
    },
    {
      title: "Impacto Nacional",
      desc: "Contribuir directamente al fortalecimiento del sistema educativo público del Perú.",
      icon: <Handshake size={24} />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    },
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        
        {/* CABECERA CON LÍNEA TÉCNICA CARD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: COLOR_ROJO }}>
              ¿Por qué elegir CARD?
            </span>
            <h2 className="text-4xl md:text-6xl font-light uppercase tracking-tighter mt-4 text-slate-900 leading-none">
              Nuestros <span className="font-black" style={{ color: COLOR_ROJO }}>Principios</span>
            </h2>
          </motion.div>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1.5px] flex-grow bg-slate-100 mb-2 ml-4 hidden md:block origin-left" 
          />
        </div>

        {/* GRILLA DE PRINCIPIOS ESTILO PANEL ACADÉMICO */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t border-slate-100"
        >
          {principios.map((p, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="p-10 border-r border-b border-slate-100 hover:bg-stone-50 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Número de fondo con fuente pesada */}
              <span className="absolute -top-2 -right-2 text-6xl font-black opacity-[0.03] group-hover:opacity-[0.07] group-hover:-translate-x-4 transition-all duration-500 text-slate-900">
                0{i + 1}
              </span>

              <motion.div 
                whileHover={{ scale: 1.1, y: -5 }}
                className="mb-8 inline-block p-3 bg-stone-100 rounded-lg group-hover:bg-red-50 transition-colors" 
                style={{ color: COLOR_ROJO }}
              >
                {p.icon}
              </motion.div>

              <h3 className="text-xs font-black uppercase tracking-widest mb-4 pr-8 text-slate-900 leading-tight">
                {p.title}
              </h3>
              
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                {p.desc}
              </p>

              {/* Viga tricolor lateral interna que aparece en hover */}
              <div className="absolute left-0 top-0 h-0 w-1 transition-all duration-500 group-hover:h-full flex flex-col">
                <div className="flex-grow w-full" style={{ backgroundColor: COLOR_ROJO }} />
                <div className="h-1/4 w-full" style={{ backgroundColor: COLOR_NARANJA }} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* PIE DE SECCIÓN CON VIGA FIRMA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16 p-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6"
        >
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-[4px] font-black text-slate-900">
                  Centro de Alto Rendimiento Docente
                </p>
                <p className="text-[9px] uppercase tracking-[2px] font-bold text-slate-400 mt-1">
                  Formación con Propósito y Excelencia 2024
                </p>
              </div>
            </div>

            {/* Viga decorativa pequeña */}
            <div className="flex h-1.5 w-32">
              <div className="h-full w-1/2" style={{ backgroundColor: COLOR_ROJO }} />
              <div className="h-full w-1/4" style={{ backgroundColor: COLOR_NARANJA }} />
              <div className="h-full w-1/4" style={{ backgroundColor: COLOR_OSCURO }} />
            </div>
        </motion.div>
      </div>
    </section>
  );
}