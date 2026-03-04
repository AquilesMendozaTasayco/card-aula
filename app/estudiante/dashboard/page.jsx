"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  BookOpen, PlayCircle, Award, CheckCircle,
  ChevronRight, Clock, TrendingUp, GraduationCap,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

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

export default function EstudianteDashboard() {
  const [uid, setUid]             = useState(null);
  const [nombre, setNombre]       = useState("");
  const [cursos, setCursos]       = useState([]);
  const [progreso, setProgreso]   = useState({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) setNombre(snap.data().nombre || "Estudiante");
      } catch { setNombre("Estudiante"); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    const cargar = async () => {
      try {
        const cSnap = await getDocs(query(
          collection(db, "cursos"),
          where("matriculados", "array-contains", uid)
        ));
        const cursosData = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCursos(cursosData);

        try {
          const pSnap = await getDoc(doc(db, "estudiantes_progreso", uid));
          if (pSnap.exists()) setProgreso(pSnap.data());
        } catch { /* sin progreso aún */ }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [uid]);

  const getPct = (curso) => {
    const total = curso.contenidos?.length || 0;
    if (total === 0) return 0;
    return Math.round(((progreso[curso.id] || []).length / total) * 100);
  };

  const finalizados  = cursos.filter(c => getPct(c) === 100);
  const enCurso      = cursos.filter(c => getPct(c) < 100);
  const totalRecursos = cursos.reduce((a, c) => a + (c.contenidos?.length || 0), 0);
  const completados   = cursos.reduce((a, c) => a + ((progreso[c.id] || []).length), 0);

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* ── BIENVENIDA ── */}
        <motion.div {...fade(0)} className="relative overflow-hidden bg-white border border-stone-200 shadow-sm">
          <div className="h-1.5 w-full flex">
            <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
            <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
            <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
          </div>

          {/* Decorativo */}
          <div className="absolute right-0 top-0 h-full w-64 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(${COLOR.marron} 1.5px, transparent 1.5px)`, backgroundSize: "22px 22px" }} />
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-[0.04]"
            style={{ backgroundColor: COLOR.naranja }} />

          <div className="relative p-8 md:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] mb-2" style={{ color: COLOR.naranja }}>
              {getSaludo()}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none mb-3">
              {nombre || "Estudiante"} 👋
            </h1>
            <p className="text-sm text-stone-400 font-medium max-w-lg leading-relaxed">
              Bienvenido a tu aula virtual. Continúa donde lo dejaste y sigue avanzando en tus cursos.
            </p>

            {/* Mini progreso general */}
            {!loading && cursos.length > 0 && (
              <div className="mt-6 max-w-sm">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-stone-400">Progreso general</span>
                  <span style={{ color: COLOR.rojo }}>
                    {totalRecursos > 0 ? Math.round((completados / totalRecursos) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: totalRecursos > 0 ? `${Math.round((completados / totalRecursos) * 100)}%` : "0%" }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    style={{ backgroundColor: COLOR.rojo }} />
                </div>
                <p className="text-[10px] text-stone-400 font-bold mt-1.5">
                  {completados} de {totalRecursos} recursos completados
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Mis Cursos",    value: cursos.length,     icon: BookOpen,      color: COLOR.rojo,    bg: "#fef2f2" },
            { label: "En Curso",      value: enCurso.length,    icon: PlayCircle,    color: COLOR.naranja, bg: "#fff7ed" },
            { label: "Finalizados",   value: finalizados.length, icon: CheckCircle,  color: "#16a34a",     bg: "#f0fdf4" },
            { label: "Certificados",  value: finalizados.filter(c => c.tituloFinal).length, icon: Award, color: "#ca8a04", bg: "#fefce8" },
          ].map((s, i) => (
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

        {/* ── MIS CURSOS ── */}
        <motion.div {...fade(0.4)}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
              <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Continuar Aprendiendo</h2>
            </div>
            <a href="/estudiante/cursos" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider hover:opacity-70 transition-opacity"
              style={{ color: COLOR.rojo }}>
              Ver todos <ChevronRight size={12} />
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-stone-100 animate-pulse" />)}
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-200 p-16 text-center">
              <GraduationCap size={40} className="mx-auto mb-3 text-stone-200" />
              <p className="text-[11px] font-black uppercase tracking-widest text-stone-300 mb-1">Aún no estás matriculado</p>
              <p className="text-[11px] text-stone-300">Contacta a tu administrador para que te asigne un curso.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cursos.slice(0, 5).map((curso, i) => {
                const pct       = getPct(curso);
                const finalizado = pct === 100;
                return (
                  <motion.a key={curso.id} href="/estudiante/cursos" {...fade(0.45 + i * 0.05)}
                    className="group flex items-center gap-5 bg-white border border-stone-200 p-5 hover:shadow-md hover:border-stone-300 transition-all">

                    {/* Portada mini */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                      {curso.portadaUrl
                        ? <img src={curso.portadaUrl} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-stone-300" /></div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-black text-slate-900 truncate">{curso.titulo}</p>
                        {finalizado && (
                          <span className="flex-shrink-0 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full">
                            ✓ Completado
                          </span>
                        )}
                      </div>

                      {/* Barra progreso */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: finalizado ? "#22c55e" : COLOR.rojo }} />
                        </div>
                        <span className="text-[10px] font-black flex-shrink-0"
                          style={{ color: finalizado ? "#22c55e" : COLOR.rojo }}>
                          {pct}%
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-stone-400 font-bold">
                        <span className="flex items-center gap-1"><PlayCircle size={10} /> {curso.contenidos?.length || 0} recursos</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {curso.clases?.length || 0} clases</span>
                        {finalizado && curso.tituloFinal && (
                          <span className="flex items-center gap-1 text-yellow-600"><Award size={10} /> Certificado disponible</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.a>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── CERTIFICADOS OBTENIDOS ── */}
        {finalizados.filter(c => c.tituloFinal).length > 0 && (
          <motion.div {...fade(0.6)}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-5 w-1 rounded-full" style={{ backgroundColor: "#ca8a04" }} />
              <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900">Mis Certificados</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {finalizados.filter(c => c.tituloFinal).map((curso, i) => (
                <motion.a key={curso.id} href={curso.tituloFinal} target="_blank" rel="noreferrer"
                  {...fade(0.65 + i * 0.05)}
                  className="group flex items-center gap-4 bg-white border border-yellow-100 p-5 hover:border-yellow-300 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Award size={18} className="text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-900 truncate">{curso.titulo}</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-0.5">Certificado disponible · Click para descargar</p>
                  </div>
                  <ChevronRight size={14} className="text-yellow-300 group-hover:text-yellow-500 transition-colors flex-shrink-0" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}