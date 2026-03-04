"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, setDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, deleteUser,
  signInWithEmailAndPassword, getAuth
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  Plus, Pencil, Trash2, X, Save, Users, Search,
  Mail, Phone, MapPin, Calendar, User,
  GraduationCap, Hash, Eye, ChevronDown, KeyRound,
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

const ESTADO_OPTS = ["Activo", "Inactivo", "Suspendido"];
const GENERO_OPTS = ["Masculino", "Femenino", "Otro", "Prefiero no decir"];

const CAMPO_VACIO = {
  nombres: "", apellidos: "", email: "", password: "",
  telefono: "", dni: "", fechaNacimiento: "", genero: "",
  direccion: "", ciudad: "", estado: "Activo", observaciones: "",
};

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(CAMPO_VACIO);
  const [busqueda, setBusqueda]       = useState("");
  const [vistaDetalle, setVistaDetalle] = useState(null);
  const [guardando, setGuardando]     = useState(false);

  useEffect(() => { fetchEstudiantes(); }, []);

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "estudiantes"), orderBy("apellidos", "asc"));
      const snap = await getDocs(q);
      setEstudiantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar", confirmButtonColor: COLOR.rojo });
    } finally { setLoading(false); }
  };

  const abrirCrear = () => { setEditing(null); setForm(CAMPO_VACIO); setShowModal(true); };
  const abrirEditar = (est) => { setEditing(est); setForm({ ...CAMPO_VACIO, ...est, password: "" }); setShowModal(true); };

  const guardar = async () => {
    if (!form.nombres || !form.apellidos || !form.email) {
      Swal.fire({ icon: "warning", title: "Campos obligatorios", text: "Nombres, apellidos y email son requeridos.", confirmButtonColor: COLOR.rojo }); return;
    }
    if (!editing && !form.password) {
      Swal.fire({ icon: "warning", title: "Contraseña requerida", text: "Debes asignar una contraseña al estudiante.", confirmButtonColor: COLOR.rojo }); return;
    }
    if (!editing && form.password.length < 6) {
      Swal.fire({ icon: "warning", title: "Contraseña muy corta", text: "Mínimo 6 caracteres.", confirmButtonColor: COLOR.rojo }); return;
    }

    setGuardando(true);
    try {
      if (editing) {
        // ── EDITAR: solo actualiza datos, no toca Auth ──────────────────────
        const { password, ...datos } = form;
        await updateDoc(doc(db, "estudiantes", editing.id), { ...datos, updatedAt: serverTimestamp() });
        // También actualiza la colección usuarios para mantener nombre sincronizado
        await updateDoc(doc(db, "usuarios", editing.id), {
          nombre: `${form.nombres} ${form.apellidos}`,
          updatedAt: serverTimestamp(),
        }).catch(() => {}); // silencioso si no existe

        Swal.fire({ icon: "success", title: "Estudiante actualizado", timer: 1500, showConfirmButton: false });
      } else {
        // ── CREAR: Firebase Auth + Firestore con mismo UID ──────────────────
        // Guardamos el usuario admin actual para no perder la sesión
        const adminActual = auth.currentUser;

        // Crear cuenta en Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const uid  = cred.user.uid;

        // Cerrar la sesión recién creada (del estudiante) inmediatamente
        // para no afectar la sesión del admin
        await auth.updateCurrentUser(adminActual);

        const { password, ...datos } = form;

        // Documento en "estudiantes" con UID como ID
        await setDoc(doc(db, "estudiantes", uid), {
          ...datos,
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Documento en "usuarios" con rol estudiante (para el Sidebar y login)
        await setDoc(doc(db, "usuarios", uid), {
          nombre: `${form.nombres} ${form.apellidos}`,
          email:  form.email,
          rol:    "estudiante",
          createdAt: serverTimestamp(),
        });

        Swal.fire({
          icon: "success",
          title: "Estudiante creado",
          html: `
            <p style="font-size:13px;color:#6b7280;margin-bottom:12px">
              La cuenta fue creada exitosamente.
            </p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px;text-align:left;font-family:monospace;font-size:12px">
              <b>Email:</b> ${form.email}<br/>
              <b>Contraseña:</b> ${form.password}
            </div>
            <p style="font-size:11px;color:#9ca3af;margin-top:10px">Guarda estas credenciales para entregárselas al estudiante.</p>
          `,
          confirmButtonColor: COLOR.rojo,
          confirmButtonText: "Entendido",
        });
      }

      setShowModal(false);
      fetchEstudiantes();
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "Este correo ya tiene una cuenta registrada.",
        "auth/invalid-email":        "El formato del correo no es válido.",
        "auth/weak-password":        "La contraseña es muy débil.",
      };
      Swal.fire({ icon: "error", title: "Error", text: msgs[err.code] || err.message, confirmButtonColor: COLOR.rojo });
    } finally { setGuardando(false); }
  };

  const eliminar = async (est) => {
    const res = await Swal.fire({
      title: `¿Eliminar a ${est.nombres} ${est.apellidos}?`,
      html: `<p style="font-size:13px;color:#6b7280">Se eliminará el registro de Firestore.<br/>La cuenta de acceso deberá eliminarse manualmente desde Firebase Console.</p>`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLOR.rojo, cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar registro", cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-2xl" },
    });
    if (!res.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "estudiantes", est.id));
      await deleteDoc(doc(db, "usuarios", est.id)).catch(() => {});
      fetchEstudiantes();
      Swal.fire({ icon: "success", title: "Registro eliminado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error al eliminar", confirmButtonColor: COLOR.rojo });
    }
  };

  const filtrados = estudiantes.filter(e =>
    `${e.nombres} ${e.apellidos} ${e.email} ${e.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const Field = ({ label, icon: Icon, children, required }) => (
    <div className="group">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
        {Icon && <Icon size={11} />} {label} {required && <span style={{ color: COLOR.rojo }}>*</span>}
      </label>
      {children}
    </div>
  );

  const Input = ({ field, type = "text", placeholder, disabled }) => (
    <input type={type} placeholder={placeholder} disabled={disabled}
      value={form[field] || ""}
      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
      className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-400 placeholder:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed" />
  );

  const Select = ({ field, opts }) => (
    <div className="relative">
      <select value={form[field] || ""}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
        className="w-full appearance-none border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-400">
        <option value="">Seleccionar...</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Gestión de <span style={{ color: COLOR.rojo }}>Estudiantes</span>
              </h1>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] ml-4">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} registrado{estudiantes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Buscar estudiante..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-9 pr-4 py-3 text-[11px] font-medium bg-white border border-stone-200 outline-none focus:border-red-400 transition-all w-64" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={abrirCrear}
              className="flex items-center gap-2 px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-lg"
              style={{ backgroundColor: COLOR.rojo }}>
              <Plus size={15} /> Nuevo Estudiante
            </motion.button>
          </div>
        </div>

        {/* TABLA */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 p-24 text-center">
            <Users size={48} className="mx-auto mb-4 text-stone-200" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">
              {busqueda ? "No se encontraron resultados" : "No hay estudiantes registrados"}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-100 bg-stone-50">
              {["#", "Estudiante", "DNI", "Teléfono", "Ciudad", "Estado", "Acciones"].map((h, i) => (
                <div key={h} className={`text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 ${i === 1 ? "col-span-3" : i === 6 ? "col-span-2 text-right" : "col-span-1"}`}>
                  {h}
                </div>
              ))}
            </div>
            {filtrados.map((est, idx) => (
              <motion.div key={est.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-50 hover:bg-stone-50 transition-colors items-center group">
                <div className="col-span-1 text-[11px] font-black text-stone-300">{String(idx + 1).padStart(2, "0")}</div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                      style={{ backgroundColor: COLOR.rojo }}>
                      {est.nombres?.[0]}{est.apellidos?.[0]}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900">{est.nombres} {est.apellidos}</p>
                      <p className="text-[10px] text-stone-400 font-medium">{est.email}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 text-[11px] font-mono font-bold text-stone-500">{est.dni || "—"}</div>
                <div className="col-span-2 text-[11px] text-stone-500 font-medium">{est.telefono || "—"}</div>
                <div className="col-span-2 text-[11px] text-stone-500 font-medium">{est.ciudad || "—"}</div>
                <div className="col-span-1">
                  <span className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-full ${
                    est.estado === "Activo" ? "bg-green-50 text-green-600" :
                    est.estado === "Suspendido" ? "bg-orange-50 text-orange-600" : "bg-stone-100 text-stone-400"
                  }`}>{est.estado || "Activo"}</span>
                </div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setVistaDetalle(est)} className="p-2 hover:bg-stone-100 text-stone-400 hover:text-slate-700 transition-colors rounded"><Eye size={14} /></button>
                  <button onClick={() => abrirEditar(est)} className="p-2 hover:bg-stone-100 text-stone-400 hover:text-slate-700 transition-colors rounded"><Pencil size={14} /></button>
                  <button onClick={() => eliminar(est)} className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors rounded"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* MODAL CREAR / EDITAR */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">

                <div className="h-1.5 w-full flex sticky top-0 z-10">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>

                <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <Users size={18} style={{ color: COLOR.rojo }} />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                      {editing ? "Editar" : "Nuevo"} <span style={{ color: COLOR.rojo }}>Estudiante</span>
                    </h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-slate-900"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-8">

                  {/* Aviso al crear */}
                  {!editing && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100">
                      <KeyRound size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                        Al crear el estudiante se generará automáticamente una cuenta de acceso al sistema con el email y contraseña que ingreses aquí.
                      </p>
                    </div>
                  )}

                  {/* Datos personales */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-5 flex items-center gap-2">
                      <span className="h-px flex-1 bg-stone-100" /> Datos Personales <span className="h-px flex-1 bg-stone-100" />
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <Field label="Nombres" icon={User} required><Input field="nombres" placeholder="Ej: María Elena" /></Field>
                      <Field label="Apellidos" icon={User} required><Input field="apellidos" placeholder="Ej: García López" /></Field>
                      <Field label="DNI / Identificación" icon={Hash}><Input field="dni" placeholder="Ej: 12345678" /></Field>
                      <Field label="Fecha de Nacimiento" icon={Calendar}><Input field="fechaNacimiento" type="date" /></Field>
                      <Field label="Género" icon={User}><Select field="genero" opts={GENERO_OPTS} /></Field>
                      <Field label="Estado" icon={GraduationCap}><Select field="estado" opts={ESTADO_OPTS} /></Field>
                    </div>
                  </div>

                  {/* Acceso al sistema */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-5 flex items-center gap-2">
                      <span className="h-px flex-1 bg-stone-100" /> Acceso al Sistema <span className="h-px flex-1 bg-stone-100" />
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <Field label="Correo Electrónico" icon={Mail} required>
                        <Input field="email" type="email" placeholder="estudiante@correo.com"
                          disabled={!!editing} />
                        {editing && <p className="text-[9px] text-stone-300 font-bold mt-1">El correo no se puede cambiar</p>}
                      </Field>
                      {!editing && (
                        <Field label="Contraseña inicial" icon={KeyRound} required>
                          <Input field="password" type="text" placeholder="Mínimo 6 caracteres" />
                          <p className="text-[9px] text-stone-300 font-bold mt-1">El estudiante podrá cambiarla después</p>
                        </Field>
                      )}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-5 flex items-center gap-2">
                      <span className="h-px flex-1 bg-stone-100" /> Contacto <span className="h-px flex-1 bg-stone-100" />
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <Field label="Teléfono" icon={Phone}><Input field="telefono" placeholder="+51 999 888 777" /></Field>
                      <Field label="Ciudad" icon={MapPin}><Input field="ciudad" placeholder="Ej: Lima" /></Field>
                      <Field label="Dirección" icon={MapPin}><Input field="direccion" placeholder="Av. Principal 123" /></Field>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-5 flex items-center gap-2">
                      <span className="h-px flex-1 bg-stone-100" /> Observaciones (opcional) <span className="h-px flex-1 bg-stone-100" />
                    </p>
                    <textarea rows={3} placeholder="Notas adicionales..."
                      value={form.observaciones || ""}
                      onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                      className="w-full border-2 border-stone-200 bg-transparent p-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-400 resize-none" />
                  </div>
                </div>

                <div className="flex border-t border-stone-100">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando}
                    className="flex-[2] px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: COLOR.rojo }}>
                    {guardando
                      ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creando cuenta...</>
                      : <><Save size={15} /> {editing ? "Guardar Cambios" : "Crear Estudiante"}</>
                    }
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL DETALLE */}
        <AnimatePresence>
          {vistaDetalle && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setVistaDetalle(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full flex">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black"
                        style={{ backgroundColor: COLOR.rojo }}>
                        {vistaDetalle.nombres?.[0]}{vistaDetalle.apellidos?.[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{vistaDetalle.nombres} {vistaDetalle.apellidos}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                          vistaDetalle.estado === "Activo" ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                        }`}>{vistaDetalle.estado || "Activo"}</span>
                      </div>
                    </div>
                    <button onClick={() => setVistaDetalle(null)} className="text-stone-400 hover:text-slate-900"><X size={18} /></button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: Mail,     label: "Email",      value: vistaDetalle.email },
                      { icon: Phone,    label: "Teléfono",   value: vistaDetalle.telefono },
                      { icon: Hash,     label: "DNI",        value: vistaDetalle.dni },
                      { icon: MapPin,   label: "Ciudad",     value: vistaDetalle.ciudad },
                      { icon: Calendar, label: "Nacimiento", value: vistaDetalle.fechaNacimiento },
                    ].map(({ icon: Icon, label, value }) => value ? (
                      <div key={label} className="flex items-center gap-3 py-2 border-b border-stone-50">
                        <Icon size={14} style={{ color: COLOR.naranja }} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 w-24">{label}</span>
                        <span className="text-[12px] font-medium text-slate-700">{value}</span>
                      </div>
                    ) : null)}
                    {vistaDetalle.observaciones && (
                      <div className="mt-3 p-3 bg-stone-50">
                        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-1">Observaciones</p>
                        <p className="text-[12px] text-stone-600">{vistaDetalle.observaciones}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button onClick={() => { setVistaDetalle(null); abrirEditar(vistaDetalle); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: COLOR.rojo }}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button onClick={() => { setVistaDetalle(null); eliminar(vistaDetalle); }}
                      className="py-3 px-4 text-[10px] font-black border border-red-200 hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}