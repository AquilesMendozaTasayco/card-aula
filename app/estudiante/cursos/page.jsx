"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import {
  BookOpen, PlayCircle, FileText, Link as LinkIcon,
  Award, CheckCircle, Clock, X, Download, ExternalLink,
  ChevronRight, Lock, Youtube, File, Paperclip,
  GraduationCap, BarChart3
} from "lucide-react";
import { motion as m } from "framer-motion";

const COLOR = {
  rojo:    "#EF3340",
  naranja: "#D65B2B",
  marron:  "#8B4513",
};

const ICON_TIPO = { video: Youtube, pdf: FileText, enlace: LinkIcon, archivo: File };

function getYoutubeEmbed(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function EstudianteCursosPage() {
  const [uid, setUid]                   = useState(null);
  const [cursos, setCursos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cursoActivo, setCursoActivo]   = useState(null);
  const [contenidoActivo, setContenidoActivo] = useState(null);
  const [progreso, setProgreso]         = useState({}); // { [cursoId]: [contenidoId, ...] }
  const [tab, setTab]                   = useState("en_curso"); // "en_curso" | "finalizados"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      await cargarCursos(user.uid);
    });
    return () => unsub();
  }, []);

  const cargarCursos = async (userId) => {
    try {
      setLoading(true);
      // Obtener cursos donde el estudiante está matriculado
      // Asumimos que en Firestore los cursos tienen campo matriculados: [uid, uid, ...]
      // y el progreso está en estudiantes/{uid}/progreso/{cursoId}
      const cursosSnap = await getDocs(query(
        collection(db, "cursos"),
        where("matriculados", "array-contains", userId)
      ));
      const cursosData = cursosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCursos(cursosData);

      // Cargar progreso del estudiante
      const progSnap = await getDoc(doc(db, "estudiantes_progreso", userId));
      if (progSnap.exists()) {
        setProgreso(progSnap.data());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const marcarCompletado = async (cursoId, contenidoId) => {
    if (!uid) return;
    const yaCompleto = (progreso[cursoId] || []).includes(contenidoId);
    if (yaCompleto) return;

    const nuevo = { ...progreso, [cursoId]: [...(progreso[cursoId] || []), contenidoId] };
    setProgreso(nuevo);

    try {
      await updateDoc(doc(db, "estudiantes_progreso", uid), {
        [cursoId]: arrayUnion(contenidoId),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Si el doc no existe, crearlo
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "estudiantes_progreso", uid), {
        [cursoId]: [contenidoId],
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    // Verificar si completó todo el curso
    const curso = cursos.find(c => c.id === cursoId);
    if (curso) {
      const totalContenidos = curso.contenidos?.length || 0;
      const completados = nuevo[cursoId]?.length || 0;
      if (totalContenidos > 0 && completados >= totalContenidos) {
        Swal.fire({
          icon: "success",
          title: "🎉 ¡Curso Completado!",
          html: curso.tituloFinal
            ? `<p class="text-sm text-gray-600">Has completado <strong>${curso.titulo}</strong>.<br>Tu certificado ya está disponible.</p>`
            : `<p class="text-sm text-gray-600">Has completado <strong>${curso.titulo}</strong>.</p>`,
          confirmButtonColor: COLOR.rojo,
          confirmButtonText: curso.tituloFinal ? "Ver Certificado" : "¡Genial!",
          background: "#fff",
          customClass: { popup: "rounded-2xl" },
        }).then(r => {
          if (r.isConfirmed && curso.tituloFinal) {
            window.open(curso.tituloFinal, "_blank");
          }
        });
      }
    }
  };

  const getPorcentaje = (curso) => {
    const total = curso.contenidos?.length || 0;
    if (total === 0) return 0;
    const completados = (progreso[curso.id] || []).length;
    return Math.round((completados / total) * 100);
  };

  const esFinalizado = (curso) => getPorcentaje(curso) === 100;

  const cursosEnCurso   = cursos.filter(c => !esFinalizado(c));
  const cursosFinalizados = cursos.filter(c => esFinalizado(c));
  const cursosVista = tab === "en_curso" ? cursosEnCurso : cursosFinalizados;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 border-b border-stone-200 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
              Mis <span style={{ color: COLOR.rojo }}>Cursos</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 mt-4 ml-4">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900">{cursos.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Total</p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: COLOR.naranja }}>{cursosEnCurso.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">En Curso</p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <p className="text-2xl font-black text-green-500">{cursosFinalizados.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Finalizados</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-8 border-b border-stone-200">
          {[
            { id: "en_curso", label: `En Curso (${cursosEnCurso.length})`, icon: BarChart3 },
            { id: "finalizados", label: `Finalizados (${cursosFinalizados.length})`, icon: CheckCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                tab === id ? "border-b-2 text-white" : "border-transparent text-stone-400 hover:text-slate-700"
              }`}
              style={tab === id ? { borderColor: COLOR.rojo, color: COLOR.rojo } : {}}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* GRID CURSOS */}
        {cursosVista.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 p-24 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-stone-200" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">
              {tab === "en_curso" ? "No tienes cursos en progreso" : "Aún no has completado ningún curso"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cursosVista.map((curso, idx) => {
              const pct = getPorcentaje(curso);
              const finalizado = esFinalizado(curso);
              return (
                <motion.div key={curso.id} layout
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => { setCursoActivo(curso); setContenidoActivo(null); }}>

                  {/* Portada */}
                  <div className="relative h-36 bg-stone-100 overflow-hidden">
                    {curso.portadaUrl ? (
                      <img src={curso.portadaUrl} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={curso.titulo} />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <BookOpen size={36} className="text-stone-200" />
                      </div>
                    )}
                    {finalizado && (
                      <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-3">
                          <CheckCircle size={24} className="text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-tighter">
                        {curso.nivel || "Sin nivel"}
                      </span>
                    </div>
                    {finalizado && curso.tituloFinal && (
                      <div className="absolute top-2 right-2 bg-yellow-400 p-1 rounded" title="Certificado disponible">
                        <Award size={14} className="text-yellow-900" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLOR.naranja }}>
                      {curso.categoria || "Sin categoría"}
                    </p>
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight mb-3 line-clamp-2">{curso.titulo}</h3>

                    {/* Barra progreso */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1.5">
                        <span className="text-stone-400">Progreso</span>
                        <span style={{ color: finalizado ? "#22c55e" : COLOR.rojo }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: finalizado ? "#22c55e" : COLOR.rojo }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold">
                      <span className="flex items-center gap-1"><PlayCircle size={11} />
                        {(progreso[curso.id] || []).length}/{curso.contenidos?.length || 0}
                      </span>
                      <span className="flex items-center gap-1"><Clock size={11} />{curso.duracion || "—"}</span>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all"
                      style={{ backgroundColor: finalizado ? "#22c55e" : COLOR.rojo }}>
                      {finalizado ? <><CheckCircle size={13} /> Ver Certificado</> : <><PlayCircle size={13} /> Continuar</>}
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* MODAL DETALLE CURSO */}
        <AnimatePresence>
          {cursoActivo && (
            <div className="fixed inset-0 z-[100] flex">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setCursoActivo(null)} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

              <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">

                <div className="h-1.5 w-full flex flex-shrink-0">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>

                {/* Header panel */}
                <div className="flex-shrink-0">
                  <div className="relative h-40 bg-stone-900 overflow-hidden">
                    {cursoActivo.portadaUrl && (
                      <img src={cursoActivo.portadaUrl} className="h-full w-full object-cover opacity-50" alt="" />
                    )}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{cursoActivo.categoria}</p>
                      <h2 className="text-xl font-black text-white leading-tight">{cursoActivo.titulo}</h2>
                    </div>
                    <button onClick={() => setCursoActivo(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors rounded-full">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Progreso del curso */}
                  <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                      <span className="text-stone-400">Tu progreso</span>
                      <span style={{ color: esFinalizado(cursoActivo) ? "#22c55e" : COLOR.rojo }}>
                        {getPorcentaje(cursoActivo)}% completado
                      </span>
                    </div>
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${getPorcentaje(cursoActivo)}%`, backgroundColor: esFinalizado(cursoActivo) ? "#22c55e" : COLOR.rojo }} />
                    </div>
                  </div>
                </div>

                {/* Contenidos */}
                <div className="flex-1 overflow-y-auto">
                  {/* Reproductor/Visor activo */}
                  <AnimatePresence>
                    {contenidoActivo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="border-b border-stone-200">
                        {contenidoActivo.tipo === "video" && getYoutubeEmbed(contenidoActivo.url) ? (
                          <div className="aspect-video w-full bg-black">
                            <iframe src={getYoutubeEmbed(contenidoActivo.url)} className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen title={contenidoActivo.titulo} />
                          </div>
                        ) : contenidoActivo.tipo === "pdf" ? (
                          <div className="p-6 bg-stone-50 flex flex-col items-center gap-3">
                            <FileText size={40} style={{ color: COLOR.naranja }} />
                            <p className="text-[12px] font-black text-slate-900">{contenidoActivo.titulo}</p>
                            <a href={contenidoActivo.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                              style={{ backgroundColor: COLOR.rojo }}>
                              <ExternalLink size={13} /> Ver PDF
                            </a>
                          </div>
                        ) : (
                          <div className="p-6 bg-stone-50 flex flex-col items-center gap-3">
                            <LinkIcon size={36} style={{ color: COLOR.naranja }} />
                            <p className="text-[12px] font-black text-slate-900">{contenidoActivo.titulo}</p>
                            <a href={contenidoActivo.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                              style={{ backgroundColor: COLOR.rojo }}>
                              <ExternalLink size={13} /> Abrir enlace
                            </a>
                          </div>
                        )}
                        <div className="px-4 py-3 flex justify-between items-center bg-white border-t border-stone-100">
                          <p className="text-[11px] font-black text-slate-700 truncate mr-4">{contenidoActivo.titulo}</p>
                          {!(progreso[cursoActivo.id] || []).includes(contenidoActivo.id) && (
                            <button onClick={() => marcarCompletado(cursoActivo.id, contenidoActivo.id)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white"
                              style={{ backgroundColor: "#22c55e" }}>
                              <CheckCircle size={12} /> Marcar completado
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Lista contenidos */}
                  <div className="p-6 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">
                      Contenido del Curso
                    </p>
                    {(cursoActivo.contenidos || []).length === 0 ? (
                      <p className="text-center text-[11px] text-stone-300 font-bold py-8">Sin contenidos disponibles</p>
                    ) : (cursoActivo.contenidos || []).map((c, i) => {
                      const completado = (progreso[cursoActivo.id] || []).includes(c.id);
                      const activo = contenidoActivo?.id === c.id;
                      const Icon = ICON_TIPO[c.tipo] || Paperclip;
                      return (
                        <motion.div key={c.id || i} whileHover={{ x: 2 }}
                          onClick={() => setContenidoActivo(activo ? null : c)}
                          className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                            activo ? "border-red-200 bg-red-50" :
                            completado ? "border-green-100 bg-green-50" :
                            "border-stone-100 hover:border-stone-200 bg-white"
                          }`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            completado ? "bg-green-500" : activo ? "" : "bg-stone-100"
                          }`}
                          style={activo && !completado ? { backgroundColor: COLOR.rojo } : {}}>
                            {completado ? <CheckCircle size={14} className="text-white" /> : <Icon size={14} className={activo ? "text-white" : "text-stone-400"} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-black truncate ${activo ? "text-red-700" : completado ? "text-green-700" : "text-slate-900"}`}>
                              {i + 1}. {c.titulo}
                            </p>
                            <p className="text-[9px] uppercase font-bold text-stone-400">{c.tipo}</p>
                          </div>
                          {completado && <span className="text-[9px] font-black text-green-500 uppercase">✓</span>}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Certificado si está disponible */}
                  {esFinalizado(cursoActivo) && cursoActivo.tituloFinal && (
                    <div className="mx-6 mb-6 p-5 border-2 border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-3 mb-3">
                        <GraduationCap size={24} style={{ color: COLOR.naranja }} />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-900">¡Certificado Disponible!</p>
                          <p className="text-[10px] text-stone-500">Has completado este curso</p>
                        </div>
                      </div>
                      <a href={cursoActivo.tituloFinal} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ backgroundColor: COLOR.naranja }}>
                        <Award size={14} /> Descargar Certificado
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}