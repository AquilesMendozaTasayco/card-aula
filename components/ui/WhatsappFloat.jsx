"use client";

import { useState } from "react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsappFloat({
  phone = "51999999999",
  message = "Hola, estoy interesado en un proyecto. ¿Me brindan información, por favor?",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const colorAzul = "#1E3A5F";
  const colorVerde = "#8DBA4D";

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center justify-center">
      
      {/* 🟢 TOOLTIP: APARECE SOLO AL HACER HOVER */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-20 hidden md:block bg-white text-[#1E3A5F] px-5 py-3 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-l-4 border-[#8DBA4D] whitespace-nowrap pointer-events-none"
          >
            <p className="text-[10px] font-black uppercase tracking-[2px] italic">
              ¿En qué podemos <span style={{ color: colorVerde }}>ayudarte?</span>
            </p>
            {/* Triángulo del tooltip */}
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-white border-b-[8px] border-b-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 BOTÓN PRINCIPAL */}
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        {/* EFECTO DE PULSO (Se detiene al hacer hover para no distraer) */}
        {!isHovered && (
          <motion.span 
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-[#25D366] -z-10"
          />
        )}

        <Link
          href={url}
          target="_blank"
          rel="noreferrer"
          className="h-16 w-16 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all border-4 border-transparent hover:border-white"
        >
          <FaWhatsapp size={35} className="drop-shadow-md" />
          
          {/* Badge de "En Línea" */}
          <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
             <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full animate-pulse" />
          </span>
        </Link>
      </motion.div>
    </div>
  );
}