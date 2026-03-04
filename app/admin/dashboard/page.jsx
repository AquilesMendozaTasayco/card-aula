"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Users, BookOpen, GraduationCap, TrendingUp,
  Award, CalendarDays, ChevronRight, BarChart3,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513", fondo: "#2A1810" };

function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" },
});

export default function AdminDashboard() {
  const [nombre, setNombre]         = useState("");
  const [stats, setStats]           = useState({ estudiantes: 0, cursos: 0, matriculas: 0, certificados: 0 });
  const [cursos, setCursos]         = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) setNombre(snap.data().nombre || "Administrador");
      } catch { setNombre("Administrador"); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [eSnap, cSnap] = await Promise.all([
          getDocs(collection(db, "estudiantes")),
          getDocs(collection(db, "cursos")),
        ]);
        const estudiantesData  = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const cursosData       = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalMatriculas  = cursosData.reduce((acc, c) => acc + (c.matriculados?.length || 0), 0);
        const cursosConCert    = cursosData.filter(c => c.tituloFinal).length;
        setStats({ estudiantes: estudiantesData.length, cursos: cursosData.length, matriculas: totalMatriculas, certificados: cursosConCert });
        setCursos(cursosData.slice(0, 4));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, []);

  const STAT_CARDS = [
    { label: "Estudiantes",   value: stats.estudiantes, icon: Users,         color: COLOR.rojo,    bg: "#fef2f2" },
    { label: "Cursos",        value: stats.cursos,      icon: BookOpen,       color: COLOR.naranja, bg: "#fff7ed" },
    { label: "Matrículas",    value: stats.matriculas,  icon: GraduationCap,  color: COLOR.marron,  bg: "#fdf8f0" },
    { label: "Con Certificado", value: stats.certificados, icon: Award,       color: "#16a34a",     bg: "#f0fdf4" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* ── BIENVENIDA ── */}
        <motion.div {...fade(0)} className="relative overflow-hidden rounded-none bg-white border border-stone-200 shadow-sm">
          {/* Barra triple */}
          <div className="h-1.5 w-full flex">
            <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
            <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
            <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
          </div>

          {/* Fondo decorativo */}
          <div className="absolute right-0 top-0 h-full w-72 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(${COLOR.marron} 1.5px, transparent 1.5px)`, backgroundSize: "22px 22px" }} />
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-5"
            style={{ backgroundColor: COLOR.rojo }} />

          <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] mb-2" style={{ color: COLOR.naranja }}>
                {getSaludo()}
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none mb-3">
                {nombre ? nombre : "Administrador"}
              </h1>
              <p className="text-sm text-stone-400 font-medium max-w-md leading-relaxed">
                Bienvenido al panel de control del Aula Virtual. Aquí puedes gestionar estudiantes, cursos y matrículas.
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Fecha actual</p>
                <p className="text-[13px] font-black text-slate-700">
                  {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div className="flex gap-1 mt-2">
                {[COLOR.rojo, COLOR.naranja, COLOR.marron].map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s, i) => (
            <motion.div key={s.label} {...fade(0.1 + i * 0.07)}
              className="bg-white border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <TrendingUp size={13} className="text-stone-200 mt-1" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                {loading ? <span className="text-stone-200 animate-pulse">—</span> : s.value}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{s.label}</p>
              <div className="mt-3 h-0.5 w-8 rounded-full" style={{ backgroundColor: s.color }} />
            </motion.div>
          ))}
        </div>

        {/* ── CURSOS RECIENTES ── */}
        <motion.div {...fade(0.4)}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
              <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Cursos Recientes</h2>
            </div>
            <a href="/admin/cursos" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider hover:opacity-70 transition-opacity"
              style={{ color: COLOR.rojo }}>
              Ver todos <ChevronRight size={12} />
            </a>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-200 p-12 text-center">
              <BookOpen size={32} className="mx-auto mb-3 text-stone-200" />
              <p className="text-[11px] font-black uppercase tracking-widest text-stone-300">Sin cursos aún</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {cursos.map((curso, i) => (
                <motion.div key={curso.id} {...fade(0.45 + i * 0.05)}
                  className="bg-white border border-stone-200 p-5 flex items-center gap-4 hover:border-stone-300 transition-colors group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                    {curso.portadaUrl
                      ? <img src={curso.portadaUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen size={18} className="text-stone-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-900 truncate">{curso.titulo}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                        <Users size={10} /> {curso.matriculados?.length || 0} matriculados
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                        <CalendarDays size={10} /> {curso.clases?.length || 0} clases
                      </span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${curso.activo ? "bg-green-400" : "bg-stone-300"}`} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── ACCESOS RÁPIDOS ── */}
        <motion.div {...fade(0.55)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-5 w-1 rounded-full" style={{ backgroundColor: COLOR.naranja }} />
            <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Accesos Rápidos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Nuevo Estudiante", href: "/admin/estudiantes", icon: Users,     color: COLOR.rojo },
              { label: "Nuevo Curso",      href: "/admin/cursos",      icon: BookOpen,  color: COLOR.naranja },
              { label: "Ver Reportes",     href: "/admin/reportes",    icon: BarChart3, color: COLOR.marron },
            ].map((acc, i) => (
              <a key={acc.label} href={acc.href}
                className="group bg-white border border-stone-200 p-5 flex items-center gap-4 hover:shadow-md transition-all hover:border-stone-300">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: acc.color + "15" }}>
                  <acc.icon size={16} style={{ color: acc.color }} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-slate-900 transition-colors">
                  {acc.label}
                </span>
                <ChevronRight size={13} className="ml-auto text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}