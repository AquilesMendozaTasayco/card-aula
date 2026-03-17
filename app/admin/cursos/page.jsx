"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, arrayUnion, arrayRemove, setDoc, getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  Plus, Pencil, Trash2, X, Save, BookOpen, Search,
  Upload, Youtube, FileText, Link as LinkIcon, Users,
  Eye, Award, PlayCircle, UserPlus, CheckCircle,
  ChevronDown, CalendarDays, Paperclip, File,
  Info, Clock, BarChart3, GraduationCap, Hash,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };
const PAGE_SIZE = 8;

const CURSO_VACIO     = { titulo: "", descripcion: "", portadaUrl: "", activo: true, contenidos: [], clases: [], tituloFinal: "" };
const CONTENIDO_VACIO = { tipo: "video", titulo: "", url: "", adjuntos: [] };
const CLASE_VACIA     = { titulo: "", descripcion: "", fecha: "", hora: "", materiales: [], videosClase: [], archivosClase: [] };
const ICON_TIPO       = { video: Youtube, pdf: FileText, enlace: LinkIcon, archivo: File };

function usePaginacion(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [items.length]);
  return { slice, page, setPage, totalPages };
}

function Pager({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-3">
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
        className="px-3 py-1.5 text-[10px] font-black border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors">‹</button>
      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
        className="px-3 py-1.5 text-[10px] font-black border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors">›</button>
    </div>
  );
}

export default function AdminCursosPage() {
  const [cursos, setCursos]               = useState([]);
  const [estudiantes, setEstudiantes]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [showMatricula, setShowMatricula] = useState(null);
  const [showDetalle, setShowDetalle]     = useState(null);
  const [editing, setEditing]             = useState(null);
  const [form, setForm]                   = useState(CURSO_VACIO);
  const [nuevoContenido, setNuevoContenido] = useState(CONTENIDO_VACIO);
  const [nuevaClase, setNuevaClase]       = useState(CLASE_VACIA);
  const [subiendo, setSubiendo]           = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [subiendoMaterial, setSubiendoMaterial] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [subiendoCertificado, setSubiendoCertificado] = useState(false);
  const [busqueda, setBusqueda]           = useState("");
  const [tab, setTab]                     = useState("info");
  const [matriculados, setMatriculados]   = useState([]);
  const [busqMatModal, setBusqMatModal]   = useState("");
  const [busqMatRapido, setBusqMatRapido] = useState("");
  const [progresoMap, setProgresoMap]     = useState({});

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

  const fetchProgreso = async (cursoId) => {
    const estIds = cursos.find(c => c.id === cursoId)?.matriculados || [];
    const map = {};
    await Promise.all(estIds.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "estudiantes_progreso", uid));
        if (snap.exists()) map[uid] = snap.data();
      } catch {}
    }));
    setProgresoMap(prev => ({ ...prev, ...map }));
  };

  // ── Subidas ───────────────────────────────────────────────────────────
  const subirPortada = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendoPortada(true);
      const r = ref(storage, `cursos/portadas/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      setForm(p => ({ ...p, portadaUrl: "" }));
      const url = await getDownloadURL(r);
      setForm(p => ({ ...p, portadaUrl: url }));
      Swal.fire({ icon: "success", title: "Portada cargada", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir portada", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoPortada(false); }
  };

  const subirCertificadoCurso = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendoCertificado(true);
      const r = ref(storage, `cursos/certificados/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setForm(p => ({ ...p, tituloFinal: url }));
      Swal.fire({ icon: "success", title: "Certificado del curso cargado", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir certificado", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoCertificado(false); }
  };

  const subirCertificadoEstudiante = async (e, cursoId, estId) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const r = ref(storage, `certificados/${cursoId}/${estId}_${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      await setDoc(doc(db, "estudiantes_progreso", estId), {
        [`certificado_${cursoId}`]: url,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProgresoMap(prev => ({
        ...prev,
        [estId]: { ...(prev[estId] || {}), [`certificado_${cursoId}`]: url },
      }));
      Swal.fire({ icon: "success", title: "Certificado subido", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error al subir certificado", confirmButtonColor: COLOR.rojo });
    }
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

  const subirArchivoClase = async (e, claseIdx) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setSubiendoMaterial(true);
      const r = ref(storage, `cursos/clases/contenido/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      const archivo = { nombre: file.name, url, tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
      setForm(p => {
        const clases = [...(p.clases || [])];
        clases[claseIdx] = { ...clases[claseIdx], archivosClase: [...(clases[claseIdx].archivosClase || []), archivo] };
        return { ...p, clases };
      });
      Swal.fire({ icon: "success", title: "Archivo subido", timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir archivo", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoMaterial(false); }
  };

  // ── Adjuntos de contenido ─────────────────────────────────────────────
  const subirAdjuntosContenido = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    try {
      setSubiendoAdjunto(true);
      const nuevos = await Promise.all(files.map(async (file) => {
        const r = ref(storage, `cursos/adjuntos/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        return { id: Date.now().toString() + Math.random(), nombre: file.name, url, titulo: "", tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
      }));
      setNuevoContenido(p => ({ ...p, adjuntos: [...(p.adjuntos || []), ...nuevos] }));
      Swal.fire({ icon: "success", title: `${files.length} archivo${files.length > 1 ? "s" : ""} subido${files.length > 1 ? "s" : ""}`, timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir adjunto", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoAdjunto(false); e.target.value = ""; }
  };

  const actualizarTituloAdjunto = (adjId, titulo) =>
    setNuevoContenido(p => ({ ...p, adjuntos: (p.adjuntos || []).map(a => a.id === adjId ? { ...a, titulo } : a) }));

  const quitarAdjuntoNuevo = (adjId) =>
    setNuevoContenido(p => ({ ...p, adjuntos: (p.adjuntos || []).filter(a => a.id !== adjId) }));

  const subirAdjuntoContenidoExistente = async (e, contId) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    try {
      setSubiendoAdjunto(true);
      const nuevos = await Promise.all(files.map(async (file) => {
        const r = ref(storage, `cursos/adjuntos/${Date.now()}_${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        return { id: Date.now().toString() + Math.random(), nombre: file.name, url, titulo: "", tipo: file.type.includes("pdf") ? "pdf" : "archivo" };
      }));
      setForm(p => ({
        ...p,
        contenidos: (p.contenidos || []).map(c =>
          c.id === contId ? { ...c, adjuntos: [...(c.adjuntos || []), ...nuevos] } : c
        ),
      }));
      Swal.fire({ icon: "success", title: `${files.length} archivo${files.length > 1 ? "s" : ""} subido${files.length > 1 ? "s" : ""}`, timer: 1000, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir adjunto", confirmButtonColor: COLOR.rojo }); }
    finally { setSubiendoAdjunto(false); e.target.value = ""; }
  };

  const actualizarTituloAdjuntoExistente = (contId, adjId, titulo) =>
    setForm(p => ({
      ...p,
      contenidos: (p.contenidos || []).map(c =>
        c.id === contId ? { ...c, adjuntos: (c.adjuntos || []).map(a => a.id === adjId ? { ...a, titulo } : a) } : c
      ),
    }));

  const quitarAdjuntoExistente = (contId, adjId) =>
    setForm(p => ({
      ...p,
      contenidos: (p.contenidos || []).map(c =>
        c.id === contId ? { ...c, adjuntos: (c.adjuntos || []).filter(a => a.id !== adjId) } : c
      ),
    }));

  // ── Contenidos ────────────────────────────────────────────────────────
  const agregarContenido = () => {
    if (!nuevoContenido.titulo || (!nuevoContenido.url && (nuevoContenido.adjuntos || []).length === 0)) {
      Swal.fire({ icon: "warning", title: "Completa el título y agrega una URL o al menos un archivo", confirmButtonColor: COLOR.rojo }); return;
    }
    setForm(p => ({ ...p, contenidos: [...(p.contenidos || []), { ...nuevoContenido, id: Date.now().toString() }] }));
    setNuevoContenido(CONTENIDO_VACIO);
  };

  // ── Clases ────────────────────────────────────────────────────────────
  const agregarVideoAClase = (claseIdx) => {
    const url = prompt("URL de YouTube:"); if (!url) return;
    const titulo = prompt("Título del video:") || "Video";
    setForm(p => {
      const clases = [...(p.clases || [])];
      clases[claseIdx] = { ...clases[claseIdx], videosClase: [...(clases[claseIdx].videosClase || []), { titulo, url, id: Date.now().toString() }] };
      return { ...p, clases };
    });
  };

  const quitarVideoClase = (ci, vi) => setForm(p => {
    const clases = [...(p.clases || [])];
    clases[ci] = { ...clases[ci], videosClase: clases[ci].videosClase.filter((_, i) => i !== vi) };
    return { ...p, clases };
  });

  const quitarArchivoClase = (ci, ai) => setForm(p => {
    const clases = [...(p.clases || [])];
    clases[ci] = { ...clases[ci], archivosClase: clases[ci].archivosClase.filter((_, i) => i !== ai) };
    return { ...p, clases };
  });

  const agregarClase = () => {
    if (!nuevaClase.titulo) {
      Swal.fire({ icon: "warning", title: "El título de la clase es requerido", confirmButtonColor: COLOR.rojo }); return;
    }
    setForm(p => ({ ...p, clases: [...(p.clases || []), { ...nuevaClase, id: Date.now().toString(), materiales: [], videosClase: [], archivosClase: [] }] }));
    setNuevaClase(CLASE_VACIA);
  };

  const quitarContenido     = (id) => setForm(p => ({ ...p, contenidos: p.contenidos.filter(c => c.id !== id) }));
  const quitarClase         = (id) => setForm(p => ({ ...p, clases: p.clases.filter(c => c.id !== id) }));
  const quitarMaterialClase = (ci, mi) => setForm(p => {
    const clases = [...(p.clases || [])];
    clases[ci] = { ...clases[ci], materiales: clases[ci].materiales.filter((_, i) => i !== mi) };
    return { ...p, clases };
  });

  const clasesOrdenadas = useMemo(() => {
    return [...(form.clases || [])].sort((a, b) => {
      const da  = a.fecha ? new Date(`${a.fecha}T${a.hora || "00:00"}`) : new Date(0);
      const db_ = b.fecha ? new Date(`${b.fecha}T${b.hora || "00:00"}`) : new Date(0);
      return da - db_;
    });
  }, [form.clases]);

  // ── CRUD ──────────────────────────────────────────────────────────────
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

  // ── Matrícula ─────────────────────────────────────────────────────────
  const abrirMatricula = async (curso) => {
    setShowMatricula(curso); setMatriculados(curso.matriculados || []); setBusqMatRapido("");
    await fetchProgreso(curso.id);
  };

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

  // ── Marcar completado con código MANUAL ───────────────────────────────
  const marcarCompletadoAdmin = async (cursoId, estId, estNombre) => {
    const { value: codigoManual, isConfirmed } = await Swal.fire({
      title: "Marcar como completado",
      html: `
        <p style="font-size:13px;color:#6b7280;margin-bottom:12px">
          Estudiante: <strong>${estNombre}</strong>
        </p>
        <label style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;display:block;margin-bottom:6px">
          Código de certificado
        </label>
        <input
          id="swal-codigo"
          placeholder="Ej: EXCEL-BÁSICO-2024"
          style="width:100%;padding:10px 12px;border:2px solid #e5e7eb;font-size:14px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;outline:none;font-family:monospace"
          maxlength="40"
        />
        <p style="font-size:10px;color:#a8a29e;margin-top:6px">
          Escribe el código que recibirá el estudiante en su certificado.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLOR.rojo,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        // Forzar uppercase mientras escribe
        const input = document.getElementById("swal-codigo");
        if (input) input.addEventListener("input", () => { input.value = input.value.toUpperCase(); });
      },
      preConfirm: () => {
        const val = document.getElementById("swal-codigo")?.value?.trim().toUpperCase();
        if (!val) {
          Swal.showValidationMessage("El código no puede estar vacío");
          return false;
        }
        return val;
      },
    });

    if (!isConfirmed || !codigoManual) return;

    try {
      await setDoc(doc(db, "estudiantes_progreso", estId), {
        [`completado_${cursoId}`]: true,
        [`codigo_${cursoId}`]: codigoManual,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setProgresoMap(prev => ({
        ...prev,
        [estId]: {
          ...(prev[estId] || {}),
          [`completado_${cursoId}`]: true,
          [`codigo_${cursoId}`]: codigoManual,
        },
      }));

      Swal.fire({
        icon: "success",
        title: "Curso marcado como completado",
        html: `
          <p style="font-size:13px;color:#6b7280">Código asignado:</p>
          <p style="font-size:18px;font-weight:900;letter-spacing:0.2em;margin-top:8px;color:#EF3340">${codigoManual}</p>
        `,
        confirmButtonColor: COLOR.rojo,
      });
    } catch {
      Swal.fire({ icon: "error", title: "Error al marcar", confirmButtonColor: COLOR.rojo });
    }
  };

  const toggleMatriculaEnForm = async (estId) => {
    const esMat  = (form.matriculados || []).includes(estId);
    const nuevos = esMat ? (form.matriculados || []).filter(id => id !== estId) : [...(form.matriculados || []), estId];
    setForm(p => ({ ...p, matriculados: nuevos }));
    if (editing) {
      await updateDoc(doc(db, "cursos", editing.id), {
        matriculados: esMat ? arrayRemove(estId) : arrayUnion(estId),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────
  const filtrados          = cursos.filter(c => c.titulo?.toLowerCase().includes(busqueda.toLowerCase()));
  const estFiltradosModal  = estudiantes.filter(e => `${e.nombres} ${e.apellidos} ${e.email}`.toLowerCase().includes(busqMatModal.toLowerCase()));
  const estFiltradosRapido = estudiantes.filter(e => `${e.nombres} ${e.apellidos} ${e.email}`.toLowerCase().includes(busqMatRapido.toLowerCase()));
  const pagModal  = usePaginacion(estFiltradosModal);
  const pagRapido = usePaginacion(estFiltradosRapido);

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${tab === id ? "" : "border-transparent text-stone-400 hover:text-slate-700"}`}
      style={tab === id ? { borderColor: COLOR.rojo, color: COLOR.rojo } : {}}>
      {label}
    </button>
  );

  const formatFechaClase = (fecha, hora) => {
    if (!fecha) return "Sin fecha";
    const d = new Date(`${fecha}T${hora || "00:00"}`);
    return d.toLocaleString("es-PE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // ── Componente reutilizable: fila de estudiante con certificado ────────
  const FilaEstudiante = ({ est, cursoId, enModal = false }) => {
    const prog       = progresoMap[est.id] || {};
    const completado = prog[`completado_${cursoId}`];
    const codigo     = prog[`codigo_${cursoId}`];
    const certUrl    = prog[`certificado_${cursoId}`];
    const mat        = enModal ? matriculados.includes(est.id) : true;

    return (
      <div className="border border-stone-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black"
              style={{ backgroundColor: completado ? "#22c55e" : mat ? COLOR.rojo : "#e5e7eb" }}>
              {completado ? <CheckCircle size={14} /> : `${est.nombres?.[0]}${est.apellidos?.[0]}`}
            </div>
            <div>
              <p className="text-[12px] font-black text-slate-900">{est.nombres} {est.apellidos}</p>
              {codigo ? (
                <p className="text-[9px] font-black tracking-wider" style={{ color: COLOR.naranja }}>
                  <Hash size={8} className="inline mr-0.5" />{codigo}
                </p>
              ) : (
                <p className="text-[10px] text-stone-400">{est.email}</p>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 flex-shrink-0">
            {mat && !completado && (
              <button
                onClick={() => marcarCompletadoAdmin(cursoId, est.id, `${est.nombres} ${est.apellidos}`)}
                className="p-2 text-white flex items-center gap-1"
                style={{ backgroundColor: "#22c55e" }}
                title="Marcar como completado">
                <CheckCircle size={13} />
              </button>
            )}
            {completado && (
              <span className="px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-green-600 border border-green-200 bg-green-50 flex items-center gap-1">
                <GraduationCap size={11} /> Fin.
              </span>
            )}
            {enModal && (
              <button
                onClick={() => toggleMatricula(est.id)}
                className={`px-3 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                  mat ? "border border-red-200 text-red-500 hover:bg-red-50" : "text-white"
                }`}
                style={!mat ? { backgroundColor: COLOR.rojo } : {}}>
                {mat ? "Quitar" : "+"}
              </button>
            )}
          </div>
        </div>

        {completado && (
          <div className="px-3 pb-2.5 pt-2 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Award size={12} style={{ color: certUrl ? "#22c55e" : COLOR.naranja }} />
              <span className="text-[9px] font-black uppercase tracking-wider"
                style={{ color: certUrl ? "#22c55e" : COLOR.naranja }}>
                {certUrl ? "Certificado listo" : "Sin certificado aún"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {certUrl && (
                <a href={certUrl} target="_blank" rel="noreferrer"
                  className="text-[9px] font-black uppercase tracking-wider underline"
                  style={{ color: COLOR.naranja }}>
                  Ver
                </a>
              )}
              <label
                className="flex items-center gap-1 cursor-pointer px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-white"
                style={{ backgroundColor: certUrl ? COLOR.marron : COLOR.rojo }}>
                <Upload size={9} />
                {certUrl ? "Reemplazar" : "Subir"}
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={e => subirCertificadoEstudiante(e, cursoId, est.id)}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

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
                    <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-tighter bg-amber-500 text-white shadow-sm">
                      <Award size={10} /> Cert.
                    </span>
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
                    <button onClick={() => { setShowDetalle(curso); fetchProgreso(curso.id); }}
                      className="p-2.5 border border-stone-200 hover:border-blue-200 text-stone-400 hover:text-blue-500 transition-colors" title="Ver detalle">
                      <Info size={14} />
                    </button>
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

        {/* ═══════════════ MODAL DETALLE ═══════════════ */}
        <AnimatePresence>
          {showDetalle && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowDetalle(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white shadow-2xl flex flex-col">
                <div className="h-1.5 w-full flex flex-shrink-0">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>
                <div className="relative h-44 bg-stone-900 flex-shrink-0 overflow-hidden">
                  {showDetalle.portadaUrl && <img src={showDetalle.portadaUrl} className="h-full w-full object-cover opacity-60" alt="" />}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60">
                    <h2 className="text-xl font-black text-white leading-tight">{showDetalle.titulo}</h2>
                  </div>
                  <button onClick={() => setShowDetalle(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Recursos",     value: showDetalle.contenidos?.length || 0, icon: PlayCircle },
                      { label: "Clases",       value: showDetalle.clases?.length || 0,     icon: CalendarDays },
                      { label: "Matriculados", value: showDetalle.matriculados?.length || 0, icon: Users },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-stone-50 border border-stone-100 p-4 text-center">
                        <Icon size={18} className="mx-auto mb-1 text-stone-400" />
                        <p className="text-2xl font-black text-slate-900">{value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">
                      Estudiantes Matriculados ({(showDetalle.matriculados || []).length})
                    </p>
                    {(showDetalle.matriculados || []).length === 0 ? (
                      <p className="text-[11px] text-stone-300 font-bold">Sin estudiantes matriculados</p>
                    ) : (
                      <div className="space-y-2">
                        {estudiantes
                          .filter(e => (showDetalle.matriculados || []).includes(e.id))
                          .map(est => (
                            <FilaEstudiante key={est.id} est={est} cursoId={showDetalle.id} enModal={false} />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 p-4 border-t border-stone-100 flex gap-2">
                  <button onClick={() => { setShowDetalle(null); abrirEditar(showDetalle); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors">
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => setShowDetalle(null)}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: COLOR.rojo }}>
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══════════════ MODAL CREAR / EDITAR ═══════════════ */}
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
                  <TabBtn id="matriculas" label="Matrículas" />
                </div>
                <div className="overflow-y-auto flex-1 p-8">

                  {/* ── General ── */}
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
                              : <><Upload size={24} className="text-stone-300" /><span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subir portada</span></>}
                            <input type="file" accept="image/*" onChange={subirPortada} className="hidden" />
                          </label>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">Certificado General del Curso</label>
                        <p className="text-[10px] text-stone-400 mb-3 leading-relaxed">PDF o imagen que aplica a todos los estudiantes que completen este curso.</p>
                        {form.tituloFinal ? (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100">
                            <div className="flex items-center gap-2">
                              <Award size={14} className="text-green-500" />
                              <span className="text-[11px] font-black text-green-700">Certificado cargado</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <a href={form.tituloFinal} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-wider text-green-600 underline">Ver</a>
                              <button onClick={() => setForm(p => ({ ...p, tituloFinal: "" }))} className="text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-600">Quitar</button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex h-24 cursor-pointer items-center justify-center gap-3 border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all">
                            {subiendoCertificado
                              ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                              : <><Award size={20} className="text-stone-300" /><span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subir certificado (PDF / imagen)</span></>}
                            <input type="file" accept=".pdf,image/*" onChange={subirCertificadoCurso} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Contenido ── */}
                  {tab === "contenido" && (
                    <div className="space-y-6">
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
                        <div className="border-t border-stone-200 pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Archivos adjuntos ({(nuevoContenido.adjuntos || []).length}) — opcional</p>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-500">
                              {subiendoAdjunto ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Paperclip size={11} />}
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
                                  <input value={adj.titulo} onChange={e => actualizarTituloAdjunto(adj.id, e.target.value)}
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
                      <div className="space-y-2">
                        {(form.contenidos || []).length === 0
                          ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">Sin recursos agregados</p>
                          : (form.contenidos || []).map((c, i) => {
                            const Icon = ICON_TIPO[c.tipo] || Paperclip;
                            return (
                              <div key={c.id || i} className="bg-white border border-stone-200 overflow-hidden">
                                <div className="flex items-center gap-3 p-3">
                                  <Icon size={15} style={{ color: COLOR.naranja }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-900 truncate">{c.titulo}</p>
                                    <p className="text-[9px] text-stone-400 uppercase font-bold">{c.tipo}</p>
                                  </div>
                                  <button onClick={() => quitarContenido(c.id)} className="p-1.5 hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors rounded"><X size={13} /></button>
                                </div>
                                <div className="px-3 pb-3 bg-stone-50 border-t border-stone-100 pt-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Adjuntos ({(c.adjuntos || []).length})</p>
                                    <label className="flex items-center gap-1 cursor-pointer text-[9px] font-black uppercase tracking-wider px-2.5 py-1 border border-stone-200 bg-white hover:bg-stone-100 transition-colors text-stone-500">
                                      {subiendoAdjunto ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Paperclip size={10} />}
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
                                          <input value={adj.titulo} onChange={e => actualizarTituloAdjuntoExistente(c.id, adj.id, e.target.value)}
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

                  {/* ── Clases ── */}
                  {tab === "clases" && (
                    <div className="space-y-6">
                      <div className="p-5 bg-stone-50 border border-stone-200 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Nueva Clase</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Título <span style={{ color: COLOR.rojo }}>*</span></label>
                            <input value={nuevaClase.titulo} onChange={e => setNuevaClase(p => ({ ...p, titulo: e.target.value }))}
                              placeholder="Ej: Clase 1 — Introducción"
                              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Fecha</label>
                            <input type="date" value={nuevaClase.fecha} onChange={e => setNuevaClase(p => ({ ...p, fecha: e.target.value }))}
                              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Hora</label>
                            <input type="time" value={nuevaClase.hora} onChange={e => setNuevaClase(p => ({ ...p, hora: e.target.value }))}
                              className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1.5 block">Descripción (opcional)</label>
                            <textarea rows={2} value={nuevaClase.descripcion} onChange={e => setNuevaClase(p => ({ ...p, descripcion: e.target.value }))}
                              placeholder="De qué trata esta clase..."
                              className="w-full border-2 border-stone-200 bg-transparent p-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 resize-none transition-all" />
                          </div>
                        </div>
                        <button onClick={agregarClase}
                          className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white"
                          style={{ backgroundColor: COLOR.rojo }}>
                          <Plus size={13} /> Agregar Clase
                        </button>
                      </div>
                      <div className="space-y-3">
                        {clasesOrdenadas.length === 0
                          ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">Sin clases agregadas</p>
                          : clasesOrdenadas.map((clase, ci) => {
                            const realIdx = (form.clases || []).findIndex(c => c.id === clase.id);
                            return (
                              <div key={clase.id || ci} className="bg-white border border-stone-200 overflow-hidden">
                                <div className="flex items-center gap-3 p-4 border-b border-stone-100">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                                    style={{ backgroundColor: COLOR.naranja }}>{ci + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-900">{clase.titulo}</p>
                                    {clase.fecha && (
                                      <p className="text-[10px] text-stone-400 font-bold flex items-center gap-1 mt-0.5">
                                        <CalendarDays size={10} /> {formatFechaClase(clase.fecha, clase.hora)}
                                      </p>
                                    )}
                                  </div>
                                  <button onClick={() => quitarClase(clase.id)} className="p-1.5 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded flex-shrink-0"><X size={13} /></button>
                                </div>
                                <div className="p-3 bg-stone-50 space-y-3">
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Videos YouTube ({(clase.videosClase || []).length})</p>
                                      <button onClick={() => agregarVideoAClase(realIdx)}
                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 border border-stone-200 bg-white hover:bg-stone-50 text-stone-500 transition-colors">
                                        <Plus size={10} /> Agregar
                                      </button>
                                    </div>
                                    {(clase.videosClase || []).map((v, vi) => (
                                      <div key={vi} className="flex items-center gap-2 py-1.5 pl-1">
                                        <Youtube size={12} style={{ color: COLOR.rojo }} />
                                        <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{v.titulo}</span>
                                        <button onClick={() => quitarVideoClase(realIdx, vi)} className="p-1 hover:text-red-500 text-stone-300"><X size={11} /></button>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Archivos/PDFs ({(clase.archivosClase || []).length})</p>
                                      <label className="flex items-center gap-1 cursor-pointer text-[9px] font-black uppercase tracking-wider px-2 py-1 border border-stone-200 bg-white hover:bg-stone-50 text-stone-500 transition-colors">
                                        {subiendoMaterial ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Upload size={10} />}
                                        Subir
                                        <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" onChange={e => subirArchivoClase(e, realIdx)} className="hidden" />
                                      </label>
                                    </div>
                                    {(clase.archivosClase || []).map((a, ai) => (
                                      <div key={ai} className="flex items-center gap-2 py-1.5 pl-1">
                                        <FileText size={12} style={{ color: COLOR.naranja }} />
                                        <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{a.nombre}</span>
                                        <button onClick={() => quitarArchivoClase(realIdx, ai)} className="p-1 hover:text-red-500 text-stone-300"><X size={11} /></button>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Material extra ({(clase.materiales || []).length})</p>
                                      <label className="flex items-center gap-1 cursor-pointer text-[9px] font-black uppercase tracking-wider px-2 py-1 border border-stone-200 bg-white hover:bg-stone-50 text-stone-500 transition-colors">
                                        {subiendoMaterial ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} /> : <Upload size={10} />}
                                        Subir
                                        <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*" onChange={e => subirMaterialClase(e, realIdx)} className="hidden" />
                                      </label>
                                    </div>
                                    {(clase.materiales || []).map((mat, mi) => (
                                      <div key={mi} className="flex items-center gap-2 py-1.5 pl-1">
                                        <Paperclip size={12} className="text-stone-400" />
                                        <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{mat.nombre}</span>
                                        <button onClick={() => quitarMaterialClase(realIdx, mi)} className="p-1 hover:text-red-500 text-stone-300"><X size={11} /></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── Matrículas ── */}
                  {tab === "matriculas" && (
                    <div className="space-y-3">
                      {!editing && (
                        <div className="p-3 bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-medium">
                          Guarda el curso primero para poder matricular estudiantes.
                        </div>
                      )}
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input type="text" placeholder="Buscar estudiante..." value={busqMatModal}
                          onChange={e => setBusqMatModal(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-[11px] font-medium bg-white border border-stone-200 outline-none focus:border-red-400 transition-all" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                        {(form.matriculados || []).length} matriculado{(form.matriculados || []).length !== 1 ? "s" : ""}
                      </p>
                      {estFiltradosModal.length === 0
                        ? <p className="text-center text-[11px] text-stone-300 font-bold py-8">No hay estudiantes</p>
                        : pagModal.slice.map(est => {
                          const mat        = (form.matriculados || []).includes(est.id);
                          const prog       = progresoMap[est.id] || {};
                          const completado = editing && prog[`completado_${editing.id}`];
                          const codigo     = editing && prog[`codigo_${editing.id}`];
                          const certUrl    = editing && prog[`certificado_${editing.id}`];
                          return (
                            <div key={est.id} className="border border-stone-100 bg-white overflow-hidden">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                                    style={{ backgroundColor: completado ? "#22c55e" : mat ? COLOR.rojo : "#d1d5db" }}>
                                    {completado ? <CheckCircle size={13} /> : `${est.nombres?.[0]}${est.apellidos?.[0]}`}
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-black text-slate-900">{est.nombres} {est.apellidos}</p>
                                    {codigo
                                      ? <p className="text-[10px] font-black tracking-wider" style={{ color: COLOR.naranja }}><Hash size={9} className="inline" />{codigo}</p>
                                      : <p className="text-[10px] text-stone-400">{est.email}</p>}
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  {mat && editing && !completado && (
                                    <button onClick={() => marcarCompletadoAdmin(editing.id, est.id, `${est.nombres} ${est.apellidos}`)}
                                      className="px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1"
                                      style={{ backgroundColor: "#22c55e" }}>
                                      <CheckCircle size={10} />
                                    </button>
                                  )}
                                  <button onClick={() => toggleMatriculaEnForm(est.id)} disabled={!editing}
                                    className={`px-3 py-2 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${mat ? "text-red-500 border border-red-200 hover:bg-red-50" : "text-white"}`}
                                    style={!mat ? { backgroundColor: COLOR.rojo } : {}}>
                                    {mat ? "Quitar" : "Matricular"}
                                  </button>
                                </div>
                              </div>
                              {mat && completado && (
                                <div className="px-3 pb-2.5 pt-2 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <Award size={12} style={{ color: certUrl ? "#22c55e" : COLOR.naranja }} />
                                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: certUrl ? "#22c55e" : COLOR.naranja }}>
                                      {certUrl ? "Certificado listo" : "Sin certificado aún"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {certUrl && <a href={certUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-wider underline" style={{ color: COLOR.naranja }}>Ver</a>}
                                    <label className="flex items-center gap-1 cursor-pointer px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-white"
                                      style={{ backgroundColor: certUrl ? COLOR.marron : COLOR.rojo }}>
                                      <Upload size={9} />
                                      {certUrl ? "Reemplazar" : "Subir"}
                                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => subirCertificadoEstudiante(e, editing.id, est.id)} />
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      <Pager {...pagModal} />
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

        {/* ═══════════════ MODAL MATRÍCULAS RÁPIDO ═══════════════ */}
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
                    <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                      {matriculados.length} matriculados · {estFiltradosRapido.length} resultado{estFiltradosRapido.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button onClick={() => setShowMatricula(null)} className="text-stone-400 hover:text-slate-900"><X size={18} /></button>
                </div>
                <div className="px-5 pt-4 pb-2 flex-shrink-0">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type="text" placeholder="Buscar estudiante..." value={busqMatRapido}
                      onChange={e => setBusqMatRapido(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-[11px] font-medium bg-stone-50 border border-stone-200 outline-none focus:border-red-400 transition-all" />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-2">
                  {estFiltradosRapido.length === 0
                    ? <p className="text-center text-[11px] text-stone-300 font-bold py-12">No hay estudiantes</p>
                    : pagRapido.slice.map(est => (
                        <FilaEstudiante key={est.id} est={est} cursoId={showMatricula.id} enModal={true} />
                      ))}
                  <Pager {...pagRapido} />
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