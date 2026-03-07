"use client";

import { Target, Eye, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function CulturaCorporativa() {
  const COLOR_ROJO = "#8B0000";
  const COLOR_NARANJA = "#D65B2B";
  const COLOR_FONDO = "#2A1810";

  return (
    <section className="relative w-full py-24 overflow-hidden bg-[#2A1810]">
      {/* IMAGEN DE FONDO CON OVERLAY INSTITUCIONAL */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-40"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg')" }} 
        />
        {/* Gradiente CARD: Café oscuro a negro */}
        <div 
          className="absolute inset-0 opacity-90"
          style={{ 
            background: `linear-gradient(135deg, ${COLOR_FONDO} 0%, #000000 100%)` 
          }} 
        />
      </div>

      <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24">
        {/* TÍTULO DE SECCIÓN ESTILO CARD */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <Award size={32} style={{ color: COLOR_ROJO }} className="mb-4" />
            <h2 className="text-4xl md:text-6xl font-light text-white uppercase tracking-tighter">
              Nuestra <span className="font-black" style={{ color: COLOR_ROJO }}>Cultura</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-4">
              Excelencia y Compromiso Magisterial
            </p>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-6 h-1.5" 
              style={{ backgroundColor: COLOR_ROJO }} 
            />
          </motion.div>
        </div>

        {/* CONTENEDOR DE CARDS (MISIÓN Y VISIÓN) */}
        <div className="grid md:grid-cols-2 gap-0 border border-white/10 shadow-2xl overflow-hidden rounded-sm">
          
          {/* MISIÓN */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group relative p-12 md:p-20 bg-white/5 backdrop-blur-md border-r border-white/10 overflow-hidden"
          >
            {/* Viga decorativa superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-red-900/20 rounded-xl" style={{ color: COLOR_ROJO }}>
                  <Target size={40} />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Misión</h3>
              </div>
              <p className="text-gray-300 text-xl leading-relaxed font-light italic border-l-4 pl-6" style={{ borderColor: COLOR_ROJO }}>
                "Nuestra misión es afirmarnos como una institución líder, comprometida con los docentes en el <span className="text-white font-black not-italic">fiel cumplimiento de los programas formativos</span> adjudicados, garantizando excelencia académica y pedagógica."
              </p>
            </div>
          </motion.div>

          {/* VISIÓN */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group relative p-12 md:p-20 bg-white/5 backdrop-blur-md overflow-hidden"
          >
            {/* Viga decorativa superior naranja */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-orange-900/20 rounded-xl" style={{ color: COLOR_NARANJA }}>
                  <Eye size={40} />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Visión</h3>
              </div>
              <p className="text-gray-300 text-xl leading-relaxed font-light italic border-l-4 pl-6" style={{ borderColor: COLOR_NARANJA }}>
                "Ser el Centro de Alto Rendimiento <span className="text-white font-black not-italic">referente y líder</span> en el mercado peruano, reconocido por su innovación pedagógica, calidad en lenguas originarias y éxito en el ascenso magisterial."
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* DETALLE DE VIGA TRICOLOR INFERIOR (Sello del Hero) */}
      <div className="absolute bottom-0 left-0 w-full h-2 flex">
        <div className="h-full w-1/2" style={{ backgroundColor: COLOR_ROJO }} />
        <div className="h-full w-1/4" style={{ backgroundColor: COLOR_NARANJA }} />
        <div className="h-full w-1/4" style={{ backgroundColor: "#502814" }} />
      </div>

      {/* ELEMENTOS ORTOGONALES DE DISEÑO */}
      <div className="absolute top-10 right-10 w-32 h-32 border-r border-t border-white/5 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-32 h-32 border-l border-b border-white/5 pointer-events-none" />
    </section>
  );
}