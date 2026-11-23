"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection, getDocs, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  validarCodigo, prefijoCurso, sugerirSiguiente, codigoEnUso,
  emitirCertificado, vincularPdf, revocarCertificado, reactivarCertificado, listarTodos,
} from "@/lib/certificados";
import Swal from "sweetalert2";
import {
  Search, Plus, Award, Copy, Pencil, Ban,
  X, FileText, CheckCircle, Upload, Hash,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

const FORM_VACIO = { cursoId: "", cursoTitulo: "", estId: "", titular: "", codigo: "", file: null, codigoAnterior: "" };

export default function AdminCertificadosPage() {
  const [certs, setCerts]           = useState([]);
  const [cursos, setCursos]         = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroCurso, setFiltroCurso] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(FORM_VACIO);
  const [guardando, setGuardando]   = useState(false);

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [cSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, "cursos"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "estudiantes"), orderBy("apellidos", "asc"))),
      ]);
      setCursos(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEstudiantes(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCerts(await listarTodos());
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar", confirmButtonColor: COLOR.rojo });
    } finally { setLoading(false); }
  };

  const cursoPorId = (id) => cursos.find(c => c.id === id);
  const estPorId   = (id) => estudiantes.find(e => e.id === id);
  const nombreEst  = (c) => c.estudianteNombre
    || (() => { const e = estPorId(c.estudianteUid); return e ? `${e.nombres} ${e.apellidos}` : "—"; })();
  const tituloCurso = (c) => c.cursoTitulo || cursoPorId(c.cursoId)?.titulo || "—";

  // ── Filtros ──────────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toUpperCase();
    return certs.filter(c => {
      if (filtroCurso !== "todos" && c.cursoId !== filtroCurso) return false;
      if (filtroEstado !== "todos" && (c.estado || "activo") !== filtroEstado) return false;
      if (!q) return true;
      return (c.codigo || "").toUpperCase().includes(q)
        || nombreEst(c).toUpperCase().includes(q)
        || (c.estudianteDni || "").includes(busqueda.trim());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certs, busqueda, filtroCurso, filtroEstado, cursos, estudiantes]);

  const stats = useMemo(() => ({
    total: certs.length,
    activos: certs.filter(c => (c.estado || "activo") === "activo").length,
    revocados: certs.filter(c => c.estado === "revocado").length,
  }), [certs]);

  // ── Nuevo / editar ───────────────────────────────────────────────────
  const abrirNuevo = () => {
    setForm(FORM_VACIO); setShowModal(true);
  };

  const abrirEditar = (cert) => {
    setForm({
      cursoId: cert.cursoId || "",
      cursoTitulo: cert.cursoTitulo || cursoPorId(cert.cursoId)?.titulo || "",
      estId: cert.estudianteUid || "",
      titular: cert.estudianteNombre || "",
      codigo: cert.codigo, file: null, codigoAnterior: cert.codigo,
    });
    setShowModal(true);
  };

  const cursoSel = cursoPorId(form.cursoId);

  // Candidatos del select: matriculados del curso, o todos si es libre.
  const candidatos = form.cursoId
    ? estudiantes.filter(e => (cursoSel?.matriculados || []).includes(e.id))
    : estudiantes;

  const onElegirEstudiante = async (id) => {
    if (!id) {
      // Titular manual: sin vincular a ningún alumno
      setForm(f => ({ ...f, estId: "", codigoAnterior: "" }));
      if (!form.codigo) {
        const pref = cursoSel ? prefijoCurso(cursoSel.titulo) : `CERT-${new Date().getFullYear()}-`;
        try { const s = await sugerirSiguiente(pref); setForm(f => ({ ...f, codigo: f.codigo || s })); }
        catch {}
      }
      return;
    }
    const e = candidatos.find(x => x.id === id);
    if (!e) return;
    const previo = form.cursoId ? certs.find(x => x.estudianteUid === e.id && x.cursoId === form.cursoId) : null;
    let sug = previo ? previo.codigo : "";
    if (!sug) {
      const pref = cursoSel ? prefijoCurso(cursoSel.titulo) : `CERT-${new Date().getFullYear()}-`;
      try { sug = await sugerirSiguiente(pref); }
      catch { sug = `${pref}001`; }
    }
    setForm(f => ({
      ...f, estId: e.id,
      titular: `${e.nombres} ${e.apellidos}`,
      codigo: sug, codigoAnterior: previo ? previo.codigo : "",
    }));
  };

  const alCambiarCurso = async (cursoId) => {
    const sel = cursoPorId(cursoId);
    setForm(f => ({ ...f, cursoId, estId: "", titular: "", codigo: "", codigoAnterior: "", file: null, cursoTitulo: sel?.titulo || "" }));
    if (!cursoId) {
      try {
        const s = await sugerirSiguiente(`CERT-${new Date().getFullYear()}-`);
        setForm(f => ({ ...f, codigo: f.codigo || s }));
      } catch {}
    }
  };

  const guardar = async () => {
    if (!form.titular.trim()) {
      Swal.fire({ icon: "warning", title: "Escribe o elige el titular", confirmButtonColor: COLOR.rojo }); return;
    }
    const tituloFinal = (form.cursoTitulo || "").trim() || (cursoSel?.titulo || "");
    if (!form.cursoId && !tituloFinal) {
      Swal.fire({ icon: "warning", title: "Escribe la mención del curso", text: "Para un certificado libre debes colocar el nombre / mención del curso.", confirmButtonColor: COLOR.rojo }); return;
    }
    const v = validarCodigo(form.codigo);
    if (!v.ok) {
      Swal.fire({ icon: "warning", title: "Código inválido", text: v.error, confirmButtonColor: COLOR.rojo }); return;
    }
    setGuardando(true);
    try {
      if (await codigoEnUso(v.codigo, form.codigoAnterior || null)) {
        Swal.fire({ icon: "error", title: "Código en uso", text: `El código ${v.codigo} ya está asignado a otro certificado. Si quieres reemplazar el PDF manteniendo el mismo código, usa el botón Editar (lápiz) del certificado existente en lugar de crear uno nuevo.`, confirmButtonColor: COLOR.rojo });
        setGuardando(false); return;
      }
      const vinculado = !!form.cursoId && !!form.estId;
      const est = vinculado ? estPorId(form.estId) : null;
      const final = await emitirCertificado({
        codigo: v.codigo,
        estudianteUid: vinculado ? form.estId : "",
        cursoId: form.cursoId || "",
        estudianteNombre: form.titular.trim(),
        estudianteDni: vinculado ? (est?.dni || "") : "",
        cursoTitulo: tituloFinal,
        codigoAnterior: form.codigoAnterior || null,
      });
      if (form.file) {
        const tag = vinculado ? form.estId : "libre";
        const cc = form.cursoId || "libre";
        const r = ref(storage, `certificados/${cc}/${tag}_${Date.now()}_${form.file.name}`);
        await uploadBytes(r, form.file);
        const url = await getDownloadURL(r);
        await vincularPdf(final, url);
      }
      setShowModal(false); setForm(FORM_VACIO);
      await cargarTodo();
      Swal.fire({
        icon: "success", title: form.codigoAnterior ? "Código reasignado" : "Certificado creado",
        html: `<p style="font-size:18px;font-weight:900;letter-spacing:0.2em;color:#EF3340">${final}</p>`,
        confirmButtonColor: COLOR.rojo,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error al guardar", text: e.message, confirmButtonColor: COLOR.rojo });
    } finally { setGuardando(false); }
  };

  const revocar = async (cert) => {
    const res = await Swal.fire({
      title: "¿Revocar certificado?",
      html: `El código <b>${cert.codigo}</b> dejará de validar.<br/>El historial se conserva y podrás reactivarlo después.`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLOR.rojo, cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, revocar", cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-2xl" },
    });
    if (!res.isConfirmed) return;
    try {
      await revocarCertificado(cert.codigo);
      await cargarTodo();
      Swal.fire({ icon: "success", title: "Revocado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "No se pudo revocar", confirmButtonColor: COLOR.rojo });
    }
  };

  const reactivar = async (cert) => {
    const res = await Swal.fire({
      title: "¿Reactivar certificado?",
      html: `El código <b>${cert.codigo}</b> volverá a validar como activo.`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#16a34a", cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, reactivar", cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-2xl" },
    });
    if (!res.isConfirmed) return;
    try {
      await reactivarCertificado(cert.codigo);
      await cargarTodo();
      Swal.fire({ icon: "success", title: "Reactivado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "No se pudo reactivar", confirmButtonColor: COLOR.rojo });
    }
  };

  const copiar = async (codigo) => {
    try { await navigator.clipboard.writeText(codigo); } catch {}
    Swal.fire({ icon: "success", title: "Código copiado", text: codigo, timer: 1000, showConfirmButton: false });
  };

  const fmtFecha = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : null;
      return d ? d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    } catch { return "—"; }
  };

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
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Certi<span style={{ color: COLOR.rojo }}>ficados</span>
              </h1>
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">
              Crea cada certificado y asígnale su código manual
            </p>
          </div>
          <button onClick={abrirNuevo}
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-white text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-lg"
            style={{ backgroundColor: COLOR.rojo }}>
            <Plus size={15} /> Nuevo certificado
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Emitidos", value: stats.total, icon: Award },
            { label: "Activos", value: stats.activos, icon: CheckCircle },
            { label: "Revocados", value: stats.revocados, icon: Ban },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-stone-100 p-4 text-center">
              <Icon size={16} className="mx-auto mb-1 text-stone-400" />
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</p>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-stone-100 p-4 mb-5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" placeholder="Buscar por código, alumno o DNI..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-stone-200 bg-stone-50 pl-9 pr-8 py-2.5 text-[12px] font-bold text-slate-800 placeholder:text-stone-400 placeholder:font-medium outline-none focus:border-red-400 focus:bg-white transition-colors" />
            {busqueda && (
              <button onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-700" title="Limpiar">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
            className="border border-stone-200 bg-stone-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-red-400">
            <option value="todos">Todos los cursos</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-stone-200 bg-stone-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-red-400">
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="revocado">Revocados</option>
          </select>
        </div>

        {/* LISTA */}
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </p>
        {filtrados.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 p-10 text-center">
            <Award size={28} className="mx-auto mb-3 text-stone-300" />
            <p className="text-[12px] font-bold text-stone-400">Sin certificados. Crea el primero con “Nuevo certificado”.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(c => {
              const revocado = (c.estado || "activo") === "revocado";
              return (
                <div key={c.id} className="bg-white border border-stone-100 p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: revocado ? "#a8a29e" : COLOR.rojo }}>
                      <Hash size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black tracking-widest text-slate-900 truncate">{c.codigo}</p>
                      <p className="text-[11px] font-bold text-stone-500 truncate">{nombreEst(c) || "—"}</p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {(!c.cursoId && !c.estudianteUid) ? <span className="font-black uppercase tracking-wider" style={{ color: COLOR.naranja }}>Libre · </span> : null}{tituloCurso(c)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${revocado ? "text-stone-400 border-stone-200 bg-stone-50" : "text-green-600 border-green-200 bg-green-50"}`}>
                      {revocado ? "Revocado" : "Activo"}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">{fmtFecha(c.emitidoEn)}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" title="Ver PDF"
                        className="p-2 border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                        <FileText size={13} />
                      </a>
                    )}
                    <button onClick={() => copiar(c.codigo)} title="Copiar código"
                      className="p-2 border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => abrirEditar(c)} title="Editar / reemplazar PDF manteniendo el código"
                      className="p-2 text-white transition-all hover:brightness-110" style={{ backgroundColor: COLOR.naranja }}>
                      <Pencil size={13} />
                    </button>
                    {!revocado ? (
                      <button onClick={() => revocar(c)} title="Revocar"
                        className="p-2 border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        <Ban size={13} />
                      </button>
                    ) : (
                      <button onClick={() => reactivar(c)} title="Reactivar"
                        className="p-2 border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                        <CheckCircle size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL NUEVO / EDITAR */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
              <div className="h-1.5 w-full flex flex-shrink-0">
                <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                    {form.codigoAnterior ? "Reasignar código" : "Nuevo certificado"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                {/* 1. Curso (opcional) */}
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">1. Curso (opcional)</p>
                <select value={form.cursoId} onChange={e => alCambiarCurso(e.target.value)}
                  className="w-full border border-stone-200 bg-stone-50 px-3 py-3 text-[12px] font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white mb-2">
                  <option value="">Sin curso (certificado libre)</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Mención / Nombre del curso</p>
                <input type="text" placeholder="Ej: Mención en Didáctica de la Matemática"
                  value={form.cursoTitulo} onChange={e => setForm(f => ({ ...f, cursoTitulo: e.target.value }))}
                  className="w-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-[12px] font-bold text-slate-800 placeholder:text-stone-400 outline-none focus:border-red-400 focus:bg-white mb-1" />
                <p className="text-[10px] text-stone-400 mb-5">Si eliges un curso se autocompleta pero puedes editarlo. Si es libre, escríbelo aquí.</p>

                {/* 2. Estudiante (select: elegir, vacío o manual) + titular */}
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                  2. Estudiante {form.cursoId ? "(matriculados)" : "(todos)"} — opcional
                </p>
                <select value={form.estId} onChange={e => onElegirEstudiante(e.target.value)}
                  className="w-full border border-stone-200 bg-stone-50 px-3 py-3 text-[12px] font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white mb-2">
                  <option value="">✎ Titular manual (escribir abajo, sin vincular)</option>
                  {candidatos.map(e => {
                    const ya = form.cursoId ? certs.find(x => x.estudianteUid === e.id && x.cursoId === form.cursoId) : null;
                    return (
                      <option key={e.id} value={e.id}>
                        {e.nombres} {e.apellidos} — {e.email}{ya ? ` · ${ya.codigo}` : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Titular del certificado</p>
                <input type="text" placeholder="Ej: Juan Pérez Quispe"
                  value={form.titular} onChange={e => setForm(f => ({ ...f, titular: e.target.value }))}
                  className="w-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-[12px] font-bold text-slate-800 placeholder:text-stone-400 outline-none focus:border-red-400 focus:bg-white mb-5" />

                {/* 3. Código */}
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">3. Código manual</p>
                    <input type="text" value={form.codigo}
                      onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                      placeholder="Ej: MAT-2026-001" maxLength={40}
                      className="w-full border-2 border-stone-200 px-3 py-3 text-[14px] font-black tracking-[0.15em] text-slate-900 uppercase outline-none focus:border-red-400 font-mono mb-2" />
                    <p className="text-[10px] text-stone-400 mb-5">Letras, números, guion (-) y guion bajo (_). Se verifica que no esté en uso.</p>

                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">4. PDF del certificado (opcional)</p>
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border border-dashed border-stone-300 text-[11px] font-black uppercase tracking-wider text-stone-500 hover:bg-stone-50 transition-colors mb-6">
                      <Upload size={14} />
                      {form.file ? form.file.name : "Subir PDF personalizado"}
                      <input type="file" accept=".pdf,image/*" className="hidden"
                        onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} />
                    </label>

                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando}
                    className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: COLOR.rojo }}>
                    {guardando ? "Guardando..." : "Guardar certificado"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
