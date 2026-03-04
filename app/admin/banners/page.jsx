"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  Plus, Pencil, Trash2, X, Save, Upload,
  Eye, EyeOff, MonitorPlay, GripVertical, Image as ImageIcon
} from "lucide-react";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };

const BANNER_VACIO = {
  lema: "",
  subtitulo: "",
  boton: "",
  href: "/cursos",
  imagen: "",
  orden: 0,
  activo: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(BANNER_VACIO);
  const [subiendoImg, setSubiendoImg] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "banners"), orderBy("orden", "asc"));
      const snap = await getDocs(q);
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      Swal.fire({ icon: "error", title: "Error al cargar banners", confirmButtonColor: COLOR.rojo });
    } finally { setLoading(false); }
  };

  const subirImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "warning", title: "Solo imágenes", confirmButtonColor: COLOR.rojo }); return;
    }
    try {
      setSubiendoImg(true);
      const r = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setForm(p => ({ ...p, imagen: url }));
      Swal.fire({ icon: "success", title: "Imagen cargada", timer: 1000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error al subir imagen", confirmButtonColor: COLOR.rojo });
    } finally { setSubiendoImg(false); }
  };

  const abrirCrear = () => {
    setEditing(null);
    setForm({ ...BANNER_VACIO, orden: banners.length });
    setShowModal(true);
  };

  const abrirEditar = (b) => {
    setEditing(b);
    setForm({ ...BANNER_VACIO, ...b });
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.lema || !form.imagen) {
      Swal.fire({ icon: "warning", title: "El lema y la imagen son requeridos", confirmButtonColor: COLOR.rojo }); return;
    }
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, "banners", editing.id), data);
      } else {
        await addDoc(collection(db, "banners"), { ...data, createdAt: serverTimestamp() });
      }
      setShowModal(false); fetchBanners();
      Swal.fire({ icon: "success", title: editing ? "Banner actualizado" : "Banner creado", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error al guardar", confirmButtonColor: COLOR.rojo });
    }
  };

  const toggleActivo = async (banner) => {
    try {
      await updateDoc(doc(db, "banners", banner.id), { activo: !banner.activo, updatedAt: serverTimestamp() });
      fetchBanners();
    } catch {
      Swal.fire({ icon: "error", title: "Error al actualizar", confirmButtonColor: COLOR.rojo });
    }
  };

  const eliminar = async (banner) => {
    const res = await Swal.fire({
      title: "¿Eliminar este banner?", text: "Esta acción no se puede deshacer.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLOR.rojo, cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-2xl" },
    });
    if (!res.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "banners", banner.id)); fetchBanners();
      Swal.fire({ icon: "success", title: "Eliminado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error al eliminar", confirmButtonColor: COLOR.rojo });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Gestión de <span style={{ color: COLOR.rojo }}>Banners</span>
              </h1>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] ml-4">
              {banners.filter(b => b.activo).length} activo{banners.filter(b => b.activo).length !== 1 ? "s" : ""} de {banners.length} total
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={abrirCrear}
            className="flex items-center gap-2 px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-lg"
            style={{ backgroundColor: COLOR.rojo }}>
            <Plus size={15} /> Nuevo Banner
          </motion.button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 p-24 text-center">
            <MonitorPlay size={48} className="mx-auto mb-4 text-stone-200" />
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">No hay banners registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <motion.div key={banner.id} layout
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                className={`group bg-white border shadow-sm overflow-hidden flex items-stretch transition-all ${
                  banner.activo ? "border-stone-200 hover:border-stone-300" : "border-stone-100 opacity-60"
                }`}>

                {/* Número orden */}
                <div className="w-12 flex-shrink-0 flex items-center justify-center border-r border-stone-100 bg-stone-50">
                  <span className="text-[11px] font-black text-stone-300">#{banner.orden + 1}</span>
                </div>

                {/* Preview imagen */}
                <div className="w-32 h-20 flex-shrink-0 overflow-hidden bg-stone-100 relative">
                  {banner.imagen ? (
                    <img src={banner.imagen} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-stone-300" />
                    </div>
                  )}
                  {/* Overlay degradado para simular el hero */}
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 to-transparent" />
                </div>

                {/* Info */}
                <div className="flex-1 p-5 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 truncate leading-none mb-1">{banner.lema}</p>
                      <p className="text-[11px] text-stone-400 line-clamp-1 font-medium">{banner.subtitulo}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {banner.boton && (
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-1 border border-stone-200 text-stone-400">
                          {banner.boton}
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-full ${
                        banner.activo ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                      }`}>
                        {banner.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 px-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => toggleActivo(banner)}
                    className={`p-2 rounded transition-colors ${banner.activo ? "hover:bg-stone-100 text-stone-400" : "hover:bg-green-50 text-green-500"}`}
                    title={banner.activo ? "Desactivar" : "Activar"}>
                    {banner.activo ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => abrirEditar(banner)} className="p-2 rounded hover:bg-stone-100 text-stone-400 hover:text-slate-700 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => eliminar(banner)} className="p-2 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* MODAL */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">

                <div className="h-1.5 w-full flex sticky top-0 z-10">
                  <div className="h-full w-1/2" style={{ backgroundColor: COLOR.rojo }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.naranja }} />
                  <div className="h-full w-1/4" style={{ backgroundColor: COLOR.marron }} />
                </div>

                <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <MonitorPlay size={18} style={{ color: COLOR.rojo }} />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                      {editing ? "Editar" : "Nuevo"} <span style={{ color: COLOR.rojo }}>Banner</span>
                    </h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-slate-900"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-6">

                  {/* Imagen */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 block">
                      Imagen de Fondo <span style={{ color: COLOR.rojo }}>*</span>
                    </label>
                    {form.imagen ? (
                      <div className="group relative h-44 overflow-hidden border border-stone-200">
                        {/* Preview con overlay igual al hero */}
                        <img src={form.imagen} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(42,24,16,0.85), rgba(42,24,16,0.35))" }} />
                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <p className="text-white text-[11px] font-black uppercase tracking-widest opacity-80">Vista previa del hero</p>
                          {form.lema && <p className="text-white text-lg font-black leading-tight mt-1 line-clamp-1">{form.lema}</p>}
                        </div>
                        <button onClick={() => setForm(p => ({ ...p, imagen: "" }))}
                          className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors rounded-full">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-44 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-stone-200 bg-stone-50 hover:bg-stone-100 transition-all gap-3">
                        {subiendoImg
                          ? <div className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${COLOR.rojo} transparent ${COLOR.rojo} ${COLOR.rojo}` }} />
                          : <>
                            <Upload size={28} className="text-stone-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subir imagen (recomendado 2070×1380)</span>
                            <span className="text-[9px] text-stone-300 font-bold">JPG, PNG, WEBP</span>
                          </>
                        }
                        <input type="file" accept="image/*" onChange={subirImagen} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Lema */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">
                      Lema / Título principal <span style={{ color: COLOR.rojo }}>*</span>
                    </label>
                    <input value={form.lema} onChange={e => setForm(p => ({ ...p, lema: e.target.value }))}
                      placeholder="Ej: LIDERAZGO EN FORMACIÓN DOCENTE"
                      className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all uppercase" />
                    <p className="text-[9px] text-stone-300 font-bold mt-1">Se mostrará en MAYÚSCULAS en el hero</p>
                  </div>

                  {/* Subtítulo */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Subtítulo</label>
                    <textarea rows={2} value={form.subtitulo} onChange={e => setForm(p => ({ ...p, subtitulo: e.target.value }))}
                      placeholder="Descripción breve del slide..."
                      className="w-full border-2 border-stone-200 bg-transparent p-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Texto del botón */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Texto del botón</label>
                      <input value={form.boton} onChange={e => setForm(p => ({ ...p, boton: e.target.value }))}
                        placeholder="Ej: NUESTROS CURSOS"
                        className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all uppercase" />
                    </div>

                    {/* Enlace */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Enlace (href)</label>
                      <input value={form.href} onChange={e => setForm(p => ({ ...p, href: e.target.value }))}
                        placeholder="/cursos"
                        className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-medium text-slate-900 outline-none focus:border-red-400 transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 items-center">
                    {/* Orden */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Posición / Orden</label>
                      <input type="number" min={0} value={form.orden}
                        onChange={e => setForm(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                        className="w-full border-b-2 border-stone-200 bg-transparent py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-400 transition-all" />
                    </div>

                    {/* Activo */}
                    <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-100">
                      <input type="checkbox" checked={form.activo}
                        onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="h-4 w-4" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-600">Visible en el hero</label>
                    </div>
                  </div>
                </div>

                <div className="flex border-t border-stone-100">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar}
                    className="flex-[2] px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: COLOR.rojo }}>
                    <Save size={15} /> {editing ? "Guardar Cambios" : "Crear Banner"}
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