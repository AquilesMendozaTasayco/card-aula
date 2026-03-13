"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { 
  Home, 
  Info, 
  Mail, 
  LogIn, 
  GraduationCap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "INICIO", href: "/", icon: Home },
  { name: "NOSOTROS", href: "/nosotros", icon: Info },
  { name: "CURSOS", href: "/cursos", icon: GraduationCap }, // Ahora es un link directo
  { name: "CONTACTO", href: "/contacto", icon: Mail },      // Movido al final
];

const SOCIAL_LINKS = [
  { Icon: FaYoutube, url: "https://www.youtube.com/watch?v=0bWs3tij5m0" },
];

export default function NavbarTransparente() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkStyle = `group flex items-center gap-2 transition-all duration-300 tracking-[0.15em] text-[11px] font-black py-2 relative ${
    isScrolled ? "text-white/80 hover:text-white" : "text-white hover:text-white"
  }`;

  return (
    <nav 
      className={`w-full fixed top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-[#8B0000] py-3 shadow-2xl" 
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* ⬜ Logo */}
        <Link href="/" className="flex items-center group">
          <div className="relative w-[190px] h-[80px] transition-transform group-hover:scale-105">
            <Image
              src="/logo-11.png"
              alt="Logo"
              fill
              priority
              className="object-contain" 
            />
          </div>
        </Link>

        {/* 💻 Menú Desktop */}
        <div className="hidden lg:flex items-center space-x-9">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkStyle}>
              <link.icon 
                size={15} 
                className={`transition-all ${isScrolled ? "text-white/40 group-hover:text-white" : "text-white/70 group-hover:text-white"}`} 
              />
              <span>{link.name}</span>
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          ))}
        </div>

        {/* 🌐 Lado Derecho: Redes + Login */}
        <div className="hidden md:flex items-center space-x-6">
          <div className={`flex items-center space-x-3 border-r pr-6 ${isScrolled ? "border-white/10" : "border-white/20"}`}>
            {SOCIAL_LINKS.map(({ Icon, url }, idx) => (
              <a
                key={idx}
                href={url}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
          
          <Link 
            href="/login" 
            className={`w-11 h-11 flex items-center justify-center rounded-full shadow-lg transition-all group ${
              isScrolled ? "bg-white text-[#8B0000]" : "bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-[#8B0000]"
            }`}
            title="Ingresar al Aula"
          >
            <LogIn size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 📱 Botón Móvil */}
        <div className="lg:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
            {isOpen ? <HiX size={30} /> : <HiMenuAlt3 size={30} />}
          </button>
        </div>
      </div>

      {/* 📱 Menú Móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-[#8B0000] border-t border-white/5 shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-10 space-y-8">
              <div className="flex flex-col gap-5">
                {NAV_LINKS.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="flex items-center gap-4 text-white text-lg font-black uppercase tracking-widest"
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon size={22} className="opacity-50" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}