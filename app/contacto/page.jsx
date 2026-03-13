"use client";

import PageHero from "@/components/PageHero";
import { MapPin, Mail, Phone, Facebook, Instagram, Linkedin, Send, GraduationCap, MessageSquareText } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactoPage() {
  const COLOR_ROJO = "#8B0000";
  const COLOR_NARANJA = "#D65B2B";
  const COLOR_OSCURO = "#2A1810";

  return (
    <main className="bg-white min-h-screen">
      <PageHero 
        title="Canales de Atención" 
        image="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg" 
        breadcrumb="Contacto" 
      />

      {/* SECCIÓN DE CONTACTO CENTRALIZADA */}
      <section className="py-24 relative overflow-hidden">
        {/* Elemento decorativo de fondo */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
          <MessageSquareText size={500} />
        </div>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          
          {/* CABECERA DE CONTACTO */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="flex h-1.5 w-24 mb-6">
                <div className="h-full w-1/2" style={{ backgroundColor: COLOR_ROJO }} />
                <div className="h-full w-1/2" style={{ backgroundColor: COLOR_NARANJA }} />
              </div>
              <h2 className="text-4xl md:text-6xl font-light uppercase tracking-tighter text-slate-900">
                Inicia tu <span className="font-black" style={{ color: COLOR_ROJO }}>Formación</span>
              </h2>
              <p className="mt-6 text-slate-500 text-lg font-medium leading-relaxed">
                Nuestra central de atención magisterial está disponible para asesorarte en procesos de ascenso, nombramiento y dominio de lenguas originarias.
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-stretch">
            
            {/* PANEL DE INFORMACIÓN (4 columnas) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-4"
            >
              {[
                { 
                  icon: <Phone size={24} />, 
                  label: "Línea Directa", 
                  value: "+51 987 654 321", 
                  sub: "Atención Lunes a Sábado",
                  color: COLOR_ROJO 
                },
                { 
                  icon: <Mail size={24} />, 
                  label: "Consultas Académicas", 
                  value: "informes@card.edu.pe", 
                  sub: "Respuesta en menos de 24h",
                  color: COLOR_NARANJA 
                },
                { 
                  icon: <MapPin size={24} />, 
                  label: "Sede Institucional", 
                  value: "Urb. Las Flores MZ F lote 10", 
                  sub: "Trujillo - La Libertad",
                  color: COLOR_OSCURO 
                },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="bg-stone-50 p-8 border-l-4 group hover:bg-white hover:shadow-2xl transition-all duration-500"
                  style={{ borderLeftColor: item.color }}
                >
                  <div className="mb-4" style={{ color: item.color }}>{item.icon}</div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mb-2">{item.label}</h4>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{item.value}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{item.sub}</p>
                </div>
              ))}

            </motion.div>

            {/* FORMULARIO ESTILO "EXPEDIENTE" (7 columnas) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 bg-white p-8 md:p-14 border border-slate-100 shadow-[30px_30px_80px_rgba(0,0,0,0.05)] relative"
            >
              {/* Pestaña decorativa de formulario */}
              <div className="absolute top-0 right-10 px-6 py-2 text-[10px] font-black text-white uppercase tracking-widest" style={{ backgroundColor: COLOR_ROJO }}>
                Formulario de Inscripción
              </div>

              <form className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nombres Completos</label>
                    <input type="text" className="w-full py-2 outline-none text-slate-800 font-bold placeholder:text-slate-200" placeholder="Ej. Reymer Luiz" />
                  </div>
                  <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">DNI / Documento</label>
                    <input type="text" className="w-full py-2 outline-none text-slate-800 font-bold placeholder:text-slate-200" placeholder="00000000" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Correo Electrónico</label>
                    <input type="email" className="w-full py-2 outline-none text-slate-800 font-bold placeholder:text-slate-200" placeholder="docente@ejemplo.com" />
                  </div>
                  <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Número de Celular</label>
                    <input type="tel" className="w-full py-2 outline-none text-slate-800 font-bold placeholder:text-slate-200" placeholder="+51 --- --- ---" />
                  </div>
                </div>

                <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Especialidad / Interés</label>
                  <select className="w-full py-2 outline-none text-slate-800 font-bold bg-transparent">
                    <option>Ascenso de Escala</option>
                    <option>Dominio de Quechua</option>
                    <option>Preparación Nombramiento</option>
                    <option>Otros Programas</option>
                  </select>
                </div>

                <div className="relative border-b-2 border-slate-100 focus-within:border-red-800 transition-colors">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Mensaje o Consulta</label>
                  <textarea rows="3" className="w-full py-2 outline-none text-slate-800 font-bold placeholder:text-slate-200 resize-none" placeholder="¿En qué podemos ayudarte?"></textarea>
                </div>

                <motion.button 
                  type="submit" 
                  whileHover={{ y: -4, shadow: "0 20px 40px rgba(139, 0, 0, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 text-white font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 transition-all"
                  style={{ backgroundColor: COLOR_ROJO }}
                >
                  Enviar Solicitud <Send size={16} />
                </motion.button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      {/* MAPA CON ESTILO CARD (MODERNO) */}
      <section className="px-6 md:px-12 lg:px-24 pb-24">
        <div className="w-full h-[500px] relative border-4 border-stone-50 overflow-hidden shadow-inner">
          {/* Badge flotante sobre el mapa */}
          <div className="absolute top-10 left-10 z-20 bg-white p-6 shadow-2xl border-t-4" style={{ borderTopColor: COLOR_ROJO }}>
             <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Nuestra Sede Central</h4>
             <p className="text-sm font-black text-slate-800">Trujillo, La Libertad</p>
          </div>
          
          <iframe 
            title="Ubicación CARD"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15801.439812921562!2d-79.0279!3d-8.1127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ad3d86641e176b%3A0x6d90a8a649692451!2sTrujillo!5e0!3m2!1ses-419!2spe!4v1710000000000" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
          />
        </div>
      </section>
    </main>
  );
}