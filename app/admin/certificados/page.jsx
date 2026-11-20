"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection, getDocs, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  validarCodigo, prefijoCurso, sugerirSiguiente, codigoEnUso,
  emitirCertificado, vincularPdf, revocarCertificado, listarTodos,
} from "@/lib/certificados";
import Swal from "sweetalert2";
import {
  Search, Plus, Award, Copy, Pencil, Ban,
  X, FileText, CheckCircle, Upload, Hash,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

const FORM_VACIO = { cursoId: "", estId: "", codigo: "", file: null, codigoAnterior: "" };

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
  const [busqAlumno, setBusqAlumno] = useState("");
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
    setForm(FORM_VACIO); setBusqAlumno(""); setShowModal(true);
  };

  const abrirEditar = (cert) => {
    setForm({
      cursoId: cert.cursoId, estId: cert.estudianteUid,
      codigo: cert.codigo, file: null, codigoAnterior: cert.codigo,
    });
    setBusqAlumno(""); setShowModal(true);
  };

  const cursoSel = cursoPorId(form.cursoId);
  const matriculadosDelCurso = useMemo(() => {
    if (!cursoSel) return [];
    const ids = cursoSel.matriculados || [];
    return estudiantes.filter(e => ids.includes(e.id));
  }, [cursoSel, estudiantes]);

  const alumnosFiltrados = matriculadosDelCurso.filter(e =>
    `${e.nombres} ${e.apellidos} ${e.email} ${e.dni || ""}`.toLowerCase().includes(busqAlumno.toLowerCase())
  );

  const elegirAlumno = async (est) => {
    const previo = certs.find(c => c.estudianteUid === est.id && c.cursoId === form.cursoId);
    let sug = previo ? previo.codigo : "";
    if (!sug && cursoSel) {
      try { sug = await sugerirSiguiente(prefijoCurso(cursoSel.titulo)); }
      catch { sug = `${prefijoCurso(cursoSel?.titulo)}001`; }
    }
    setForm(f => ({
      ...f, estId: est.id,
      codigo: sug, codigoAnterior: previo ? previo.codigo : "",
    }));
  };

  const alCambiarCurso = async (cursoId) => {
    setForm(f => ({ ...f, cursoId, estId: "", codigo: "", codigoAnterior: "", file: null }));
    setBusqAlumno("");
    const c = cursoPorId(cursoId);
    if (c) {
      try { setForm(f => ({ ...f, codigo: f.codigo || "" })); } catch {}
    }
  };

  const guardar = async () => {
    if (!form.cursoId) {
      Swal.fire({ icon: "warning", title: "Elige un curso", confirmButtonColor: COLOR.rojo }); return;
    }
    if (!form.estId) {
      Swal.fire({ icon: "warning", title: "Elige un estudiante", confirmButtonColor: COLOR.rojo }); return;
    }
    const v = validarCodigo(form.codigo);
    if (!v.ok) {
      Swal.fire({ icon: "warning", title: "Código inválido", text: v.error, confirmButtonColor: COLOR.rojo }); return;
    }
    setGuardando(true);
    try {
      if (await codigoEnUso(v.codigo, form.codigoAnterior || null)) {
        Swal.fire({ icon: "error", title: "Código en uso", text: `El código ${v.codigo} ya está asignado a otro certificado.`, confirmButtonColor: COLOR.rojo });
        setGuardando(false); return;
      }
      const est = estPorId(form.estId);
      const final = await emitirCertificado({
        codigo: v.codigo,
        estudianteUid: form.estId,
        cursoId: form.cursoId,
        estudianteNombre: est ? `${est.nombres} ${est.apellidos}` : "",
        estudianteDni: est?.dni || "",
        cursoTitulo: cursoSel?.titulo || "",
        codigoAnterior: form.codigoAnterior || null,
      });
      if (form.file) {
        const r = ref(storage, `certificados/${form.cursoId}/${form.estId}_${Date.now()}_${form.file.name}`);
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
      html: `El código <b>${cert.codigo}</b> dejará de validar.<br/>El historial se conserva.`,
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
                      <p className="text-[11px] font-bold text-stone-500 truncate">{nombreEst(c)}</p>
                      <p className="text-[10px] text-stone-400 truncate">{tituloCurso(c)}</p>
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
                    {!revocado && (
                      <>
                        <button onClick={() => abrirEditar(c)} title="Reasignar código"
                          className="p-2 text-white transition-all hover:brightness-110" style={{ backgroundColor: COLOR.naranja }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => revocar(c)} title="Revocar"
                          className="p-2 border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                          <Ban size={13} />
                        </button>
                      </>
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

                {/* 1. Curso */}
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">1. Curso</p>
                <select value={form.cursoId} onChange={e => alCambiarCurso(e.target.value)}
                  className="w-full border border-stone-200 bg-stone-50 px-3 py-3 text-[12px] font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white mb-5">
                  <option value="">— Selecciona un curso —</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>

                {/* 2. Estudiante */}
                {form.cursoId && (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">2. Estudiante</p>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="text" placeholder="Buscar matriculado..."
                        value={busqAlumno} onChange={e => setBusqAlumno(e.target.value)}
                        className="w-full border border-stone-200 bg-stone-50 pl-9 pr-3 py-2.5 text-[12px] font-bold text-slate-800 placeholder:text-stone-400 outline-none focus:border-red-400 focus:bg-white" />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-stone-100 divide-y divide-stone-100 mb-5">
                      {alumnosFiltrados.length === 0 && (
                        <p className="p-3 text-[11px] text-stone-400 font-bold">Sin resultados.</p>
                      )}
                      {alumnosFiltrados.map(e => {
                        const ya = certs.find(x => x.estudianteUid === e.id && x.cursoId === form.cursoId);
                        const sel = form.estId === e.id;
                        return (
                          <button key={e.id} onClick={() => elegirAlumno(e)}
                            className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${sel ? "bg-red-50" : "hover:bg-stone-50"}`}>
                            <span>
                              <span className="block text-[12px] font-black text-slate-900">{e.nombres} {e.apellidos}</span>
                              <span className="block text-[10px] text-stone-400">{e.email}{e.dni ? ` · ${e.dni}` : ""}</span>
                            </span>
                            {ya
                              ? <span className="text-[9px] font-black uppercase tracking-wider text-green-600 flex items-center gap-1 flex-shrink-0"><CheckCircle size={11} /> {ya.codigo}</span>
                              : <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 flex-shrink-0">Sin código</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 3. Código */}
                {form.estId && (
                  <>
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
                  </>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando || !form.estId}
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
