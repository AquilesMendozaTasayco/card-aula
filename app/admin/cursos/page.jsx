"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, arrayUnion, arrayRemove
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  Plus, Pencil, Trash2, X, Save, BookOpen, Search,
  Upload, Youtube, FileText, Link as LinkIcon, Users,
  Eye, Award, PlayCircle, UserPlus, CheckCircle,
  ChevronDown, CalendarDays, Paperclip, File,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

const CURSO_VACIO     = { titulo: "", descripcion: "", portadaUrl: "", activo: true, contenidos: [], clases: [], tituloFinal: "" };
const CONTENIDO_VACIO = { tipo: "video", titulo: "", url: "", adjuntos: [] };
const CLASE_VACIA     = { titulo: "", descripcion: "", materiales: [] };
const ICON_TIPO       = { video: Youtube, pdf: FileText, enlace: LinkIcon, archivo: File };

export default function AdminCursosPage() {
  const [cursos, setCursos]               = useState([]);
  const [estudiantes, setEstudiantes]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [showMatricula, setShowMatricula] = useState(null);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(CURSO_VACIO);
  const [nuevoContenido, setNuevoContenido] = useState(CONTENIDO_VACIO);
  const [nuevaClase, setNuevaClase]       = useState(CLASE_VACIA);
  const [subiendo, setSubiendo]           = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [subiendoMaterial, setSubiendoMaterial] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [busqueda, setBusqueda]           = useState("");
  const [tab, setTab]                     = useState("info");
  const [matriculados, setMatriculados]   = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, "cursos"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "estudiantes"), orderBy("apellidos", "asc"))),
      ]);
      setCursos(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEstudiantes(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar", confirmButtonColor: COLOR.rojo });
    } finally { setLoading(false); }
  };

  const subirPortada = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendoPortada(true);
      const r = ref(storage, `cursos/portadas/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const urlPortada = await getDownloadURL(r);
      setForm(p => ({ ...p, portadaUrl: urlPortada }));
      Swal.fire({ icon: "success", title: "Portada cargada", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir portada", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoPortada(false); }
  };

  const subirPDF = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      Swal.fire({ icon: "warning", title: "Solo archivos PDF", confirmButtonColor: COLOR.rojo }); return;
    }
    try {
      setSubiendo(true);
      const r = ref(storage, `cursos/pdfs/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setNuevoContenido(p => ({ ...p, url, tipo: "pdf", titulo: p.titulo || file.name.replace(".pdf", "") }));
      Swal.fire({ icon: "success", title: "PDF subido", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir PDF", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendo(false); }
  };

  const subirTitulo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendo(true);
      const r = ref(storage, `cursos/titulos/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setForm(p => ({ ...p, tituloFinal: url }));
      Swal.fire({ icon: "success", title: "Certificado cargado", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendo(false); }
  };

  const subirMaterialClase = async (e, claseIdx) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendoMaterial(true);
      const r = ref(storage, `cursos/clases/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      const material = { nombre: file.name, url, tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
      setForm(p => {
        const clases = [...(p.clases || [])];
        clases[claseIdx] = { ...clases[claseIdx], materiales: [...(clases[claseIdx].materiales || []), material] };
        return { ...p, clases };
      });
      Swal.fire({ icon: "success", title: "Material subido", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir material", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoMaterial(false); }
  };

  // ── Subir múltiples adjuntos al nuevo contenido ──────────────────────────
  const subirAdjuntosContenido = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setSubiendoAdjunto(true);
      const nuevosAdjuntos = await Promise.all(
        files.map(async (file) => {
          const r = ref(storage, `cursos/adjuntos/${Date.now()}_${file.name}`);
          await uploadBytes(r, file);
          const url = await getDownloadURL(r);
          return { id: Date.now().toString() + Math.random(), nombre: file.name, url, titulo: "", tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
        })
      );
      setNuevoContenido(p => ({ ...p, adjuntos: [...(p.adjuntos || []), ...nuevosAdjuntos] }));
      Swal.fire({ icon: "success", title: `${files.length} archivo${files.length > 1 ? "s" : ""} subido${files.length > 1 ? "s" : ""}`, timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir adjunto", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoAdjunto(false); e.target.value = ""; }
  };

  const actualizarTituloAdjunto = (adjId, titulo) => {
    setNuevoContenido(p => ({
      ...p,
      adjuntos: (p.adjuntos || []).map(a => a.id === adjId ? { ...a, titulo } : a)
    }));
  };

  const quitarAdjuntoNuevo = (adjId) => {
    setNuevoContenido(p => ({ ...p, adjuntos: (p.adjuntos || []).filter(a => a.id !== adjId) }));
  };

  // ── Adjuntos sobre contenidos ya guardados en form ───────────────────────
  const subirAdjuntoContenidoExistente = async (e, contId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setSubiendoAdjunto(true);
      const nuevosAdjuntos = await Promise.all(
        files.map(async (file) => {
          const r = ref(storage, `cursos/adjuntos/${Date.now()}_${file.name}`);
          await uploadBytes(r, file);
          const url = await getDownloadURL(r);
          return { id: Date.now().toString() + Math.random(), nombre: file.name, url, titulo: "", tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
        })
      );
      setForm(p => ({
        ...p,
        contenidos: (p.contenidos || []).map(c =>
          c.id === contId ? { ...c, adjuntos: [...(c.adjuntos || []), ...nuevosAdjuntos] } : c
        )
      }));
      Swal.fire({ icon: "success", title: `${files.length} archivo${files.length > 1 ? "s" : ""} subido${files.length > 1 ? "s" : ""}`, timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir adjunto", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoAdjunto(false); e.target.value = ""; }
  };

  const actualizarTituloAdjuntoExistente = (contId, adjId, titulo) => {
    setForm(p => ({
      ...p,
      contenidos: (p.contenidos || []).map(c =>
        c.id === contId
          ? { ...c, adjuntos: (c.adjuntos || []).map(a => a.id === adjId ? { ...a, titulo } : a) }
          : c
      )
    }));
  };

  const quitarAdjuntoExistente = (contId, adjId) => {
    setForm(p => ({
      ...p,
      contenidos: (p.contenidos || []).map(c =>
        c.id === contId ? { ...c, adjuntos: (c.adjuntos || []).filter(a => a.id !== adjId) } : c
      )
    }));
  };
  // ─────────────────────────────────────────────────────────────────────────

  const agregarContenido = () => {
    if (!nuevoContenido.titulo || (!nuevoContenido.url && (nuevoContenido.adjuntos || []).length === 0)) {
      Swal.fire({ icon: "warning", title: "Completa el título y agrega una URL o al menos un archivo", confirmButtonColor: COLOR.rojo }); return;
    }
    setForm(p => ({ ...p, contenidos: [...(p.contenidos || []), { ...nuevoContenido, id: Date.now().toString() }] }));
    setNuevoContenido(CONTENIDO_VACIO);
  };

  const agregarClase = () => {
    if (!nuevaClase.titulo) {
      Swal.fire({ icon: "warning", title: "El título de la clase es requerido", confirmButtonColor: COLOR.rojo }); return;
    }
    setForm(p => ({ ...p, clases: [...(p.clases || []), { ...nuevaClase, id: Date.now().toString(), materiales: [] }] }));
    setNuevaClase(CLASE_VACIA);
  };

  const quitarContenido     = (id) => setForm(p => ({ ...p, contenidos: p.contenidos.filter(c => c.id !== id) }));
  const quitarClase         = (id) => setForm(p => ({ ...p, clases: p.clases.filter(c => c.id !== id) }));
  const quitarMaterialClase = (ci, mi) => setForm(p => {
    const clases = [...(p.clases || [])];
    clases[ci] = { ...clases[ci], materiales: clases[ci].materiales.filter((_, i) => i !== mi) };
    return { ...p, clases };
  });

  const abrirCrear  = () => { setEditing(null); setForm(CURSO_VACIO); setTab("info"); setShowModal(true); };
  const abrirEditar = (c) => { setEditing(c); setForm({ ...CURSO_VACIO, ...c }); setTab("info"); setShowModal(true); };

  const guardar = async () => {
    if (!form.titulo || !form.descripcion) {
      Swal.fire({ icon: "warning", title: "Nombre y descripción son requeridos", confirmButtonColor: COLOR.rojo }); return;
    }
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, "cursos", editing.id), data);
      } else {
        await addDoc(collection(db, "cursos"), { ...data, createdAt: serverTimestamp(), matriculados: [] });
      }
      setShowModal(false); fetchAll();
      Swal.fire({ icon: "success", title: editing ? "Curso actualizado" : "Curso creado", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al guardar", confirmButtonColor: COLOR.rojo }); }
  };

  const eliminar = async (curso) => {
    const res = await Swal.fire({
      title: `¿Eliminar "${curso.titulo}"?`, text: "Esta acción no se puede deshacer.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLOR.rojo, cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-2xl" },
    });
    if (!res.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "cursos", curso.id)); fetchAll();
      Swal.fire({ icon: "success", title: "Eliminado", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al eliminar", confirmButtonColor: COLOR.rojo }); }
  };

  const abrirMatricula = (curso) => { setShowMatricula(curso); setMatriculados(curso.matriculados || []); };

  const toggleMatricula = async (estId) => {
    const ya    = matriculados.includes(estId);
    const nuevo = ya ? matriculados.filter(id => id !== estId) : [...matriculados, estId];
    setMatriculados(nuevo);
    try {
      await updateDoc(doc(db, "cursos", showMatricula.id), {
        matriculados: ya ? arrayRemove(estId) : arrayUnion(estId),
        updatedAt: serverTimestamp(),
      });
      setCursos(prev => prev.map(c => c.id === showMatricula.id ? { ...c, matriculados: nuevo } : c));
    } catch {
      Swal.fire({ icon: "error", title: "Error al actualizar matrícula", confirmButtonColor: COLOR.rojo });
      setMatriculados(matriculados);
    }
  };

  const toggleMatriculaEnForm = async (estId) => {
    const esMat  = (form.matriculados || []).includes(estId);
    const nuevos = esMat
      ? (form.matriculados || []).filter(id => id !== estId)
      : [...(form.matriculados || []), estId];
    setForm(p => ({ ...p, matriculados: nuevos }));
    if (editing) {
      await updateDoc(doc(db, "cursos", editing.id), {
        matriculados: esMat ? arrayRemove(estId) : arrayUnion(estId),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  const filtrados = cursos.filter(c => c.titulo?.toLowerCase().includes(busqueda.toLowerCase()));

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${tab === id ? "" : "border-transparent text-stone-400 hover:text-slate-700"}`}
      style={tab === id ? { borderColor: COLOR.rojo, color: COLOR.rojo } : {}}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.naranja }} />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Gestión de <span style={{ color: COLOR.rojo }}>Cursos</span>
              </h1>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] ml-4">
              {cursos.length} curso{cursos.length !== 1 ? "s" : ""} registrado{cursos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Buscar curso..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-9 pr-4 py-3 text-[11px] font-medium bg-white border border-stone-200 outline-none focus:border-red-400 transition-all w-56" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={abrirCrear}
              className="flex items-center gap-2 px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-lg"
              style={{ backgroundColor: COLOR.rojo }}>
              <Plus size={15} /> Nuevo Curso
            </motion.button>
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 p-24 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-stone-200" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">No hay cursos registrados</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((curso, idx) => (
              <motion.div key={curso.id} layout
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="group bg-white border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                <div className="relative h-40 bg-stone-100 overflow-hidden">
                  {curso.portadaUrl ? (
                    <img src={curso.portadaUrl} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" alt={curso.titulo} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                      <BookOpen size={40} className="text-stone-300" />
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 px-2 py-1 text-[9px] font-black uppercase tracking-tighter shadow-sm ${curso.activo ? "bg-green-500 text-white" : "bg-stone-400 text-white"}`}>
                    {curso.activo ? "Activo" : "Inactivo"}
                  </span>
                  {curso.tituloFinal && (
                    <div className="absolute top-3 right-3 bg-yellow-400 p-1.5 rounded shadow" title="Tiene certificado">
                      <Award size={13} className="text-yellow-900" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-[15px] font-black text-slate-900 leading-tight mb-2 line-clamp-2">{curso.titulo}</h3>
                  <p className="text-[11px] text-stone-400 line-clamp-2 mb-4 leading-relaxed">{curso.descripcion}</p>
                  <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold mb-4 pb-4 border-b border-stone-100">
                    <span className="flex items-center gap-1"><PlayCircle size={11} /> {curso.contenidos?.length || 0} recursos</span>
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> {curso.clases?.length || 0} clases</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {curso.matriculados?.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => abrirMatricula(curso)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: COLOR.naranja }}>
                      <UserPlus size={13} /> Matricular
                    </button>
                    <button onClick={() => abrirEditar(curso)}
                      className="p-2.5 border border-stone-200 hover:border-stone-400 text-stone-400 hover:text-slate-700 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => eliminar(curso)}
                      className="p-2.5 border border-stone-200 hover:border-red-200 text-stone-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── MODAL CREAR / EDITAR ── */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white shadow-2xl flex flex-col">

                <div className="h-1.5 w-full flex flex-shrink-0">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>

                <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} style={{ color: COLOR.rojo }} />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                      {editing ? "Editar" : "Nuevo"} <span style={{ color: COLOR.rojo }}>Curso</span>
                    </h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-slate-900"><X size={20} /></button>
                </div>

                <div className="flex border-b border-stone-100 flex-shrink-0 px-4 overflow-x-auto">
                  <TabBtn id="info"       label="General" />
                  <TabBtn id="contenido"  label="Contenido" />
                  <TabBtn id="clases"     label="Clases" />
                  <TabBtn id="titulo"     label="Certificado" />
                  <TabBtn id="matriculas" label="Matrículas" />
                </div>

                <div className="overflow-y-auto flex-1 p-8">

                  {/* General */}
                  {tab === "info" && (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Nombre del Curso <span style={{ color: COLOR.rojo }}>*</span></label>
                        <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                          placeholder="Ej: Fundamentos de Excel"
                          className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Descripción <span style={{ color: COLOR.rojo }}>*</span></label>
                        <textarea rows={4} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                          placeholder="Describe de qué trata el curso..."
                          className="w-full border-2 border-stone-200 bg-transparent p-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all resize-none" />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-100">
                        <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="h-4 w-4" />
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-600">Curso activo (visible para estudiantes)</label>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 block">Imagen de Portada</label>
                        {form.portadaUrl ? (
                          <div className="group relative h-36 overflow-hidden border border-stone-200">
                            <img src={form.portadaUrl} className="h-full w-full object-cover" alt="Portada" />
                            <button onClick={() => setForm(p => ({ ...p, portadaUrl: "" }))}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={20} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex h-36 cursor-pointer items-center justify-center border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all gap-3">
                            {subiendoPortada
                              ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                              : <><Upload size={24} className="text-stone-300" /><span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subir portada</span></>
                            }
                            <input type="file" accept="image/*" onChange={subirPortada} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Contenido ── */}
                  {tab === "contenido" && (
                    <div className="space-y-6">
                      {/* Formulario nuevo contenido */}
                      <div className="p-5 bg-stone-50 border border-stone-200 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Agregar recurso</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Tipo</label>
                            <div className="relative">
                              <select value={nuevoContenido.tipo}
                                onChange={e => setNuevoContenido(p => ({ ...p, tipo: e.target.value, url: "" }))}
                                className="w-full appearance-none border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400">
                                <option value="video">Video YouTube</option>
                                <option value="pdf">PDF</option>
                                <option value="enlace">Enlace externo</option>
                              </select>
                              <ChevronDown size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Título</label>
                            <input value={nuevoContenido.titulo}
                              onChange={e => setNuevoContenido(p => ({ ...p, titulo: e.target.value }))}
                              placeholder="Ej: Introducción"
                              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                          </div>
                        </div>

                        {/* URL o PDF principal */}
                        {nuevoContenido.tipo === "pdf" ? (
                          <label className="flex items-center gap-3 p-3 border border-dashed border-stone-300 cursor-pointer hover:bg-white transition-all">
                            {subiendo ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Upload size={16} className="text-stone-400" />}
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">{nuevoContenido.url ? "✅ PDF cargado" : "Subir PDF principal"}</span>
                            <input type="file" accept=".pdf" onChange={subirPDF} className="hidden" />
                          </label>
                        ) : (
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">URL</label>
                            <input value={nuevoContenido.url}
                              onChange={e => setNuevoContenido(p => ({ ...p, url: e.target.value }))}
                              placeholder={nuevoContenido.tipo === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                          </div>
                        )}

                        {/* ── Adjuntos del nuevo contenido ── */}
                        <div className="border-t border-stone-200 pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                              Archivos adjuntos ({(nuevoContenido.adjuntos || []).length}) — opcional
                            </p>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-500">
                              {subiendoAdjunto
                                ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                                : <Paperclip size={11} />}
                              Adjuntar archivos
                              <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*,video/*" onChange={subirAdjuntosContenido} className="hidden" />
                            </label>
                          </div>
                          {(nuevoContenido.adjuntos || []).length === 0
                            ? <p className="text-[9px] text-stone-300 font-bold">Sin adjuntos aún</p>
                            : (nuevoContenido.adjuntos || []).map(adj => (
                              <div key={adj.id} className="flex items-center gap-2 bg-white border border-stone-100 p-2 rounded">
                                <FileText size={13} style={{ color: COLOR.naranja }} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-stone-400 truncate mb-1">{adj.nombre}</p>
                                  <input
                                    value={adj.titulo}
                                    onChange={e => actualizarTituloAdjunto(adj.id, e.target.value)}
                                    placeholder="Título opcional..."
                                    className="w-full border-b border-stone-200 bg-transparent py-0.5 text-[11px] font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                                </div>
                                <button onClick={() => quitarAdjuntoNuevo(adj.id)} className="p-1 hover:text-red-500 text-stone-300 flex-shrink-0"><X size={12} /></button>
                              </div>
                            ))}
                        </div>

                        <button onClick={agregarContenido}
                          className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                          style={{ backgroundColor: COLOR.rojo }}>
                          <Plus size={13} /> Agregar
                        </button>
                      </div>

                      {/* Lista de contenidos ya agregados */}
                      <div className="space-y-2">
                        {(form.contenidos || []).length === 0
                          ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">Sin recursos agregados</p>
                          : (form.contenidos || []).map((c, i) => {
                            const Icon = ICON_TIPO[c.tipo] || Paperclip;
                            return (
                              <div key={c.id || i} className="bg-white border border-stone-200 overflow-hidden">
                                {/* Cabecera del contenido */}
                                <div className="flex items-center gap-3 p-3">
                                  <Icon size={15} style={{ color: COLOR.naranja }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-900 truncate">{c.titulo}</p>
                                    <p className="text-[9px] text-stone-400 uppercase font-bold">{c.tipo}</p>
                                  </div>
                                  <button onClick={() => quitarContenido(c.id)} className="p-1.5 hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors rounded"><X size={13} /></button>
                                </div>

                                {/* Adjuntos del contenido existente */}
                                <div className="px-3 pb-3 bg-stone-50 border-t border-stone-100 pt-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                                      Adjuntos ({(c.adjuntos || []).length})
                                    </p>
                                    <label className="flex items-center gap-1 cursor-pointer text-[9px] font-black uppercase tracking-wider px-2.5 py-1 border border-stone-200 bg-white hover:bg-stone-100 transition-colors text-stone-500">
                                      {subiendoAdjunto
                                        ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                                        : <Paperclip size={10} />}
                                      Adjuntar
                                      <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*,video/*" onChange={e => subirAdjuntoContenidoExistente(e, c.id)} className="hidden" />
                                    </label>
                                  </div>
                                  {(c.adjuntos || []).length === 0
                                    ? <p className="text-[9px] text-stone-300 font-bold">Sin adjuntos</p>
                                    : (c.adjuntos || []).map(adj => (
                                      <div key={adj.id} className="flex items-center gap-2 bg-white border border-stone-100 p-2 rounded">
                                        <FileText size={12} style={{ color: COLOR.naranja }} className="flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[9px] text-stone-400 truncate mb-0.5">{adj.nombre}</p>
                                          <input
                                            value={adj.titulo}
                                            onChange={e => actualizarTituloAdjuntoExistente(c.id, adj.id, e.target.value)}
                                            placeholder="Título opcional..."
                                            className="w-full border-b border-stone-200 bg-transparent py-0.5 text-[11px] font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                                        </div>
                                        <button onClick={() => quitarAdjuntoExistente(c.id, adj.id)} className="p-1 hover:text-red-500 text-stone-300 flex-shrink-0"><X size={11} /></button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Clases */}
                  {tab === "clases" && (
                    <div className="space-y-6">
                      <div className="p-5 bg-stone-50 border border-stone-200 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Nueva Clase</p>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Título</label>
                          <input value={nuevaClase.titulo} onChange={e => setNuevaClase(p => ({ ...p, titulo: e.target.value }))}
                            placeholder="Ej: Clase 1 — Introducción"
                            className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Descripción (opcional)</label>
                          <textarea rows={2} value={nuevaClase.descripcion} onChange={e => setNuevaClase(p => ({ ...p, descripcion: e.target.value }))}
                            placeholder="De qué trata esta clase..."
                            className="w-full border-2 border-stone-200 bg-transparent p-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 resize-none transition-all" />
                        </div>
                        <button onClick={agregarClase}
                          className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                          style={{ backgroundColor: COLOR.rojo }}>
                          <Plus size={13} /> Agregar Clase
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(form.clases || []).length === 0
                          ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">Sin clases agregadas</p>
                          : (form.clases || []).map((clase, ci) => (
                            <div key={clase.id || ci} className="bg-white border border-stone-200 overflow-hidden">
                              <div className="flex items-center gap-3 p-4 border-b border-stone-100">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                                  style={{ backgroundColor: COLOR.naranja }}>{ci + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-black text-slate-900">{clase.titulo}</p>
                                  {clase.descripcion && <p className="text-[10px] text-stone-400 truncate">{clase.descripcion}</p>}
                                </div>
                                <button onClick={() => quitarClase(clase.id)} className="p-1.5 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded flex-shrink-0"><X size={13} /></button>
                              </div>
                              <div className="p-3 bg-stone-50">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Material ({(clase.materiales || []).length}) — opcional</p>
                                  <label className="flex items-center gap-1 cursor-pointer text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-500">
                                    {subiendoMaterial ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Upload size={11} />}
                                    Subir
                                    <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" onChange={e => subirMaterialClase(e, ci)} className="hidden" />
                                  </label>
                                </div>
                                {(clase.materiales || []).length === 0
                                  ? <p className="text-[9px] text-stone-300 font-bold">Sin material aún</p>
                                  : (clase.materiales || []).map((mat, mi) => (
                                    <div key={mi} className="flex items-center gap-2 py-1.5">
                                      <FileText size={12} style={{ color: COLOR.naranja }} />
                                      <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{mat.nombre}</span>
                                      <button onClick={() => quitarMaterialClase(ci, mi)} className="p-1 hover:text-red-500 text-stone-300"><X size={11} /></button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Certificado */}
                  {tab === "titulo" && (
                    <div className="space-y-6">
                      <div className="p-5 bg-stone-50 border border-stone-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">¿Qué es esto?</p>
                        <p className="text-[12px] text-stone-500 leading-relaxed">Sube la plantilla del certificado que se entregará al completar el 100% del curso.</p>
                      </div>
                      {form.tituloFinal ? (
                        <div className="border border-stone-200 p-6 text-center bg-white">
                          <Award size={40} className="mx-auto mb-3" style={{ color: COLOR.naranja }} />
                          <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-4">Certificado cargado</p>
                          <div className="flex justify-center gap-2">
                            <a href={form.tituloFinal} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600">
                              <Eye size={13} /> Ver
                            </a>
                            <button onClick={() => setForm(p => ({ ...p, tituloFinal: "" }))}
                              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-4 py-2 border border-red-200 hover:bg-red-50 text-red-500">
                              <Trash2 size={13} /> Quitar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-stone-200 cursor-pointer hover:bg-stone-50 transition-all gap-3">
                          {subiendo ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                            : <><Award size={36} className="text-stone-200" /><span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subir certificado / título</span><span className="text-[9px] text-stone-300 font-bold">PDF, PNG, JPG</span></>}
                          <input type="file" accept=".pdf,image/*" onChange={subirTitulo} className="hidden" />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Matrículas en modal editar/crear */}
                  {tab === "matriculas" && (
                    <div className="space-y-3">
                      {!editing && (
                        <div className="p-3 bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-medium">
                          Guarda el curso primero para poder matricular estudiantes.
                        </div>
                      )}
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                        {(form.matriculados || []).length} matriculado{(form.matriculados || []).length !== 1 ? "s" : ""}
                      </p>
                      {estudiantes.length === 0
                        ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">No hay estudiantes registrados</p>
                        : estudiantes.map(est => {
                          const mat = (form.matriculados || []).includes(est.id);
                          return (
                            <div key={est.id} className="flex items-center justify-between p-3 bg-white border border-stone-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                                  style={{ backgroundColor: mat ? COLOR.rojo : "#d1d5db" }}>
                                  {est.nombres?.[0]}{est.apellidos?.[0]}
                                </div>
                                <div>
                                  <p className="text-[12px] font-black text-slate-900">{est.nombres} {est.apellidos}</p>
                                  <p className="text-[10px] text-stone-400">{est.email}</p>
                                </div>
                              </div>
                              <button onClick={() => toggleMatriculaEnForm(est.id)} disabled={!editing}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${mat ? "text-red-500 border border-red-200 hover:bg-red-50" : "text-white"}`}
                                style={!mat ? { backgroundColor: COLOR.rojo } : {}}>
                                {mat ? "Quitar" : "Matricular"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="flex border-t border-stone-100 flex-shrink-0">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar}
                    className="flex-[2] px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: COLOR.rojo }}>
                    <Save size={15} /> {editing ? "Guardar Cambios" : "Crear Curso"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL MATRÍCULAS RÁPIDO */}
        <AnimatePresence>
          {showMatricula && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowMatricula(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md max-h-[85vh] overflow-hidden bg-white shadow-2xl flex flex-col">
                <div className="h-1.5 w-full flex flex-shrink-0">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserPlus size={15} style={{ color: COLOR.rojo }} />
                      <h2 className="text-[13px] font-black uppercase tracking-tighter text-slate-900">
                        Matrículas — <span style={{ color: COLOR.rojo }}>{showMatricula.titulo}</span>
                      </h2>
                    </div>
                    <p className="text-[10px] text-stone-400 font-bold mt-0.5">{matriculados.length} matriculados</p>
                  </div>
                  <button onClick={() => setShowMatricula(null)} className="text-stone-400 hover:text-slate-900"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-5 space-y-2">
                  {estudiantes.length === 0
                    ? <p className="text-center text-[11px] text-stone-300 font-bold py-12">No hay estudiantes registrados</p>
                    : estudiantes.map(est => {
                      const mat = matriculados.includes(est.id);
                      return (
                        <div key={est.id} className="flex items-center justify-between p-3 bg-white border border-stone-100 hover:border-stone-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black"
                              style={{ backgroundColor: mat ? COLOR.rojo : "#e5e7eb" }}>
                              {mat ? <CheckCircle size={15} /> : `${est.nombres?.[0]}${est.apellidos?.[0]}`}
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-slate-900">{est.nombres} {est.apellidos}</p>
                              <p className="text-[10px] text-stone-400">{est.email}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleMatricula(est.id)}
                            className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${mat ? "border border-red-200 text-red-500 hover:bg-red-50" : "text-white"}`}
                            style={!mat ? { backgroundColor: COLOR.rojo } : {}}>
                            {mat ? "Quitar" : "Matricular"}
                          </button>
                        </div>
                      );
                    })}
                </div>
                <div className="flex-shrink-0 p-4 border-t border-stone-100">
                  <button onClick={() => setShowMatricula(null)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: COLOR.rojo }}>
                    Listo
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}