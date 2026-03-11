"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash, ChevronRight, Loader2, Award, CheckCircle,
  XCircle, Download, GraduationCap,
  RotateCcw, X, User, BookOpen, BadgeCheck,
} from "lucide-react";

const colorRojo    = "#EF3340";
const colorNaranja = "#D65B2B";
const colorMarron  = "#8B4513";

async function buscarCodigo(codigo) {
  const codigoNorm = codigo.trim().toUpperCase();
  const snap = await getDocs(collection(db, "estudiantes_progreso"));
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    for (const key of Object.keys(data)) {
      if (key.startsWith("codigo_") && data[key]?.toUpperCase() === codigoNorm) {
        const cursoId = key.replace("codigo_", "");
        return { uid: docSnap.id, cursoId, encontrado: true };
      }
    }
  }
  return { encontrado: false };
}

async function buscarCurso(cursoId) {
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "cursos", cursoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function buscarEstudiante(uid) {
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "estudiantes", uid));
  return snap.exists() ? snap.data() : null;
}

export default function ValidarCertificadoPage() {
  const [codigo, setCodigo]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [estado, setEstado]             = useState(null);
  const [resultado, setResultado]       = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const handleValidar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    setEstado(null);
    setResultado(null);

    try {
      const found = await buscarCodigo(codigo);
      if (!found.encontrado) {
        setEstado("invalido");
        return;
      }
      const [curso, estudiante] = await Promise.all([
        buscarCurso(found.cursoId),
        buscarEstudiante(found.uid),
      ]);
      setResultado({ curso, estudiante, codigo: codigo.trim().toUpperCase() });
      setEstado("valido");
      setMostrarModal(true);
    } catch (err) {
      console.error(err);
      setEstado("invalido");
    } finally {
      setLoading(false);
    }
  };

  const resetear = () => {
    setCodigo("");
    setEstado(null);
    setResultado(null);
    setMostrarModal(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 relative overflow-hidden">

      {/* Decorativos */}
      <div className="absolute top-[-10%] left-[-5%] w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colorRojo }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colorNaranja }} />
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${colorMarron} 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />

      {/* ── CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10">

        <div className="h-2 w-full flex">
          <div className="h-full w-1/2" style={{ backgroundColor: colorRojo }} />
          <div className="h-full w-1/4" style={{ backgroundColor: colorNaranja }} />
          <div className="h-full w-1/4" style={{ backgroundColor: colorMarron }} />
        </div>

        <div className="p-8 md:p-12">

          <div className="text-center mb-10">
            <motion.div whileHover={{ rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-stone-50 rounded-2xl mb-6 shadow-inner border border-stone-100">
              <Award className="h-10 w-10" style={{ color: colorRojo }} />
            </motion.div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
              VALIDAR <span style={{ color: colorRojo }}>CÓDIGO</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-[1px] w-8 bg-stone-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Certificado de Finalización</p>
              <div className="h-[1px] w-8 bg-stone-300" />
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* Formulario (estado null o valido para poder revalirar) */}
            {estado !== "invalido" && (
              <motion.form key="form" onSubmit={handleValidar}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <div className="group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 block transition-colors group-focus-within:text-red-600">
                    Código de Finalización
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input type="text" placeholder="XXXX-YYYY-ZZZZ" value={codigo}
                      onChange={e => setCodigo(e.target.value.toUpperCase())}
                      required maxLength={20}
                      className="w-full border-b-2 border-stone-200 bg-transparent pl-7 py-2 text-sm font-black tracking-widest text-slate-900 outline-none transition-all focus:border-red-500 uppercase" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2">Ingresa el código que recibiste al completar tu curso.</p>
                </div>
                <button type="submit" disabled={loading || !codigo.trim()}
                  className="w-full group relative flex items-center justify-center py-4 px-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 overflow-hidden"
                  style={{ backgroundColor: colorRojo }}>
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {loading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <><span>Validar Código</span><ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </button>
              </motion.form>
            )}

            {/* Inválido */}
            {estado === "invalido" && (
              <motion.div key="invalido"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <XCircle size={40} style={{ color: colorRojo }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-black uppercase tracking-widest text-slate-900 mb-1">Código no válido</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      El código <span className="font-black tracking-wider text-slate-700">{codigo}</span> no corresponde a ningún certificado.
                    </p>
                  </div>
                </div>
                <button onClick={resetear}
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-black uppercase tracking-widest text-white"
                  style={{ backgroundColor: colorRojo }}>
                  <RotateCcw size={16} /> Intentar de nuevo
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex gap-1">
              {[colorRojo, colorNaranja, colorMarron].map((c, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[10px] font-medium text-stone-400">© 2026 Centro de Rendimiento Académico</span>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          MODAL CERTIFICADO VÁLIDO
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarModal && resultado && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMostrarModal(false)}
              className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="relative w-full max-w-md bg-white shadow-[0_40px_100px_rgba(0,0,0,0.35)] overflow-hidden z-10">

              {/* Barra triple */}
              <div className="h-1.5 w-full flex">
                <div className="h-full w-1/2" style={{ backgroundColor: colorRojo }} />
                <div className="h-full w-1/4" style={{ backgroundColor: colorNaranja }} />
                <div className="h-full w-1/4" style={{ backgroundColor: colorMarron }} />
              </div>

              {/* Portada hero */}
              <div className="relative h-48 bg-stone-900 overflow-hidden">
                {resultado.curso?.portadaUrl
                  ? <img src={resultado.curso.portadaUrl} className="w-full h-full object-cover opacity-55" alt="" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen size={52} className="text-stone-700" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badge verificado */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                  className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-green-500 shadow-lg">
                  <BadgeCheck size={13} className="text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Verificado</span>
                </motion.div>

                <button onClick={() => setMostrarModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors rounded-full">
                  <X size={15} />
                </button>

                {/* Código sobre portada */}
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/50 mb-1">Código de certificado</p>
                  <p className="text-[17px] font-black tracking-[0.22em] text-white drop-shadow">{resultado.codigo}</p>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="p-6 space-y-5">

                {/* Estudiante */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow"
                    style={{ backgroundColor: colorRojo }}>
                    {resultado.estudiante
                      ? `${resultado.estudiante.nombres?.[0] || ""}${resultado.estudiante.apellidos?.[0] || ""}`
                      : <User size={18} />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Estudiante</p>
                    <p className="text-[15px] font-black text-slate-900 leading-tight">
                      {resultado.estudiante ? `${resultado.estudiante.nombres} ${resultado.estudiante.apellidos}` : "—"}
                    </p>
                    {resultado.estudiante?.email && (
                      <p className="text-[11px] text-stone-400 mt-0.5">{resultado.estudiante.email}</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                {/* Curso */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                    style={{ backgroundColor: colorNaranja }}>
                    <GraduationCap size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Curso Completado</p>
                    <p className="text-[15px] font-black text-slate-900 leading-tight">{resultado.curso?.titulo || "—"}</p>
                    {resultado.curso?.descripcion && (
                      <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">{resultado.curso.descripcion}</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-stone-100" />

                {/* Sello */}
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100">
                  <CheckCircle size={17} className="text-green-500 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-green-700 leading-snug">
                    Este certificado ha sido verificado y es auténtico.
                  </p>
                </div>

                {/* Acciones */}
                <div className="space-y-2 pt-1">
                  {resultado.curso?.tituloFinal ? (
                    <a href={resultado.curso.tituloFinal} target="_blank" rel="noreferrer" download
                      className="w-full flex items-center justify-center gap-2 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:translate-y-[-2px] shadow-lg"
                      style={{ backgroundColor: colorNaranja }}>
                      <Download size={16} /> Descargar Certificado
                    </a>
                  ) : (
                    <div className="p-3 bg-stone-50 border border-dashed border-stone-200 text-center">
                      <p className="text-[11px] text-stone-400 font-bold">Certificado físico pendiente de emisión</p>
                    </div>
                  )}
                  <button onClick={() => { setMostrarModal(false); resetear(); }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                    <RotateCcw size={12} /> Validar otro código
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}