"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaFacebookF, FaYoutube } from "react-icons/fa";
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone } from "react-icons/hi";

export default function FooterCARD() {
  const currentYear = new Date().getFullYear();

  // 🎨 Estilos basados en el Rojo del Navbar
  const colorRojoFondo = "#8B0000"; 
  const linkStyle = "text-white/70 hover:text-white transition-all duration-300 text-[10px] uppercase tracking-[0.2em] block py-1 hover:translate-x-1";
  const iconBoxStyle = "w-10 h-10 flex items-center justify-center border border-white/20 text-white hover:bg-white hover:text-[#8B0000] transition-all duration-400 rounded-sm";

  return (
    <footer style={{ backgroundColor: colorRojoFondo }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
          
          {/* 🏛️ Columna 1: Branding CARD */}
          <div className="space-y-10">
            <div className="flex items-center">
              <img src="/logo-11.png" alt="CARD Logo" className="h-20" />
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed max-w-xs font-medium uppercase tracking-wider">
              Centro de Alto Rendimiento Docente. <br />
              <span className="text-white/60">Liderando la actualización pedagógica con excelencia académica.</span>
            </p>
            
            {/* Redes Sociales Actualizadas */}
            <div className="flex flex-wrap gap-3">
              <a href="https://www.youtube.com/watch?v=0bWs3tij5m0" target="_blank" rel="noopener noreferrer" className={iconBoxStyle}>
                <FaYoutube size={14} />
              </a>
              <a href="https://www.facebook.com/CARD.PERU2021" target="_blank" rel="noopener noreferrer" className={iconBoxStyle}>
                <FaFacebookF size={14} />
              </a>
            </div>
          </div>

          {/* 🔗 Columna 2: Navegación */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px] mb-10 border-l-2 border-white pl-4">
              Menú Principal
            </h4>
            <ul className="space-y-5">
              <li><Link href="/" className={linkStyle}>Inicio</Link></li>
              <li><Link href="/nosotros" className={linkStyle}>Nosotros</Link></li>
              <li><Link href="/contacto" className={linkStyle}>Contacto</Link></li>
              <li><Link href="/cursos" className={linkStyle}>Cursos</Link></li>
            </ul>
          </div>

          {/* 🏗️ Columna 3: Aula Virtual */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px] mb-10 border-l-2 border-white pl-4">
              Aula Virtual
            </h4>
            <ul className="space-y-5">
              <li><Link href="/login" className={linkStyle}>Acceso Estudiantes</Link></li>
              <li><Link href="/cursos/" className={linkStyle}>Nombramiento Docente</Link></li>
              <li><Link href="/cursos/" className={linkStyle}>Ascenso de Escala</Link></li>
              <li><Link href="/cursos/" className={linkStyle}>Lengua Quechua</Link></li>
            </ul>
          </div>

          {/* 📍 Columna 4: Datos de Contacto */}
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px] mb-10 border-l-2 border-white pl-4">
              Contacto
            </h4>
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="p-2 border border-white/20 group-hover:bg-white group-hover:text-[#8B0000] transition-all">
                  <HiOutlineLocationMarker size={18} />
                </div>
                <p className="text-white/80 text-[10px] leading-relaxed uppercase tracking-[0.15em]">
                  Huancayo, Junín <br /> 
                  <span className="text-white/50 text-[9px]">Servicio a nivel nacional</span>
                </p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="p-2 border border-white/20 group-hover:bg-white group-hover:text-[#8B0000] transition-all">
                  <HiOutlinePhone size={18} />
                </div>
                <p className="text-white/80 text-[10px] tracking-[0.2em]">+51 950 017 122</p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="p-2 border border-white/20 group-hover:bg-white group-hover:text-[#8B0000] transition-all">
                  <HiOutlineMail size={18} />
                </div>
                <p className="text-white/80 text-[10px] tracking-[0.1em] lowercase">informes@card.edu.pe</p>
              </div>
            </div>
          </div>

        </div>

        {/* 📜 Barra Legal Inferior y Crédito Actualizado */}
        <div className="mt-24 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-white/40 text-[9px] tracking-[0.3em] uppercase font-medium">
              © {currentYear} CENTRO DE ALTO RENDIMIENTO DOCENTE.
            </p>
            <p className="text-white/40 text-[8px] tracking-[0.1em] uppercase mt-1">
              Mg. Reymer Luiz Basilio Gamarra - Director General
            </p>
          </div>

          {/* Crédito de Desarrollador con Logo */}
          <a 
            href="https://www.emocion.pe/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex flex-col items-center gap-2 group transition-opacity hover:opacity-80"
          >
            <p className="text-white/30 text-[7px] tracking-[0.4em] uppercase">
              Desarrollado por:
            </p>
            <img 
              src="/branding.png" 
              alt="Branding Emoción" 
              className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-all"
            />
          </a>

          <div className="flex gap-8 text-white/40 text-[9px] tracking-[0.3em] uppercase font-medium">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Reclamos</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}