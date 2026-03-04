"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Save,
  Building2, MapPin, Image as ImageIcon, List, GripVertical,
  ChevronDown, ChevronUp, Tag, CheckSquare, FolderOpen,
  HardHat, Facebook, Link, ToggleLeft, ToggleRight
} from "lucide-react";

const colorAzul = "#005B8C";
const colorVerde = "#8DBA4D";

const ESTADO_OPTIONS = [
  { value: "en-venta", label: "En Venta", color: "bg-green-100 text-green-700" },
  { value: "realizado", label: "Realizado", color: "bg-slate-100 text-slate-600" },
];

const EMPTY_FORM = {
  slug: "",
  titulo: "",
  ciudad: "",
  estado: "en-venta",
  descripcion: "",
  imagenPrincipal: "",
  banner: "",
  caracteristicas: [""],
  categoriasGaleria: [
    { key: "todos", label: "TODOS" },
    { key: "sala-comedor", label: "SALA COMEDOR" },
    { key: "planos", label: "PLANOS" },
    { key: "flyers", label: "FLYERS" },
    { key: "habitacion-principal", label: "HABITACIÓN PRINCIPAL" },
  ],
  galeria: [],
  active: true,
  // ── Avance de Obra ──
  avanceObra: {
    activo: false,
    descripcion: "",
    enlaceFacebook: "",
  },
};

export default function AdminProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState({ principal: false, banner: false, galeria: false });
  const [activeTab, setActiveTab] = useState("info");

  // ── Helpers para previsualizar embed de Facebook ───────
  const getFacebookEmbedUrl = (url) => {
    if (!url) return null;
    try {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=560`;
    } catch {
      return null;
    }
  };

  // ── Fetch ──────────────────────────────────────────────
  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "proyectos"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setProyectos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los proyectos", confirmButtonColor: colorAzul });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProyectos(); }, []);

  // ── Helpers slug ───────────────────────────────────────
  const toSlug = (str) => str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // ── Upload genérico ────────────────────────────────────
  const uploadImage = async (file, folder) => {
    const fileName = `proyectos/${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleUploadPrincipal = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(p => ({ ...p, principal: true }));
    try {
      const url = await uploadImage(file, "principal");
      setFormData(p => ({ ...p, imagenPrincipal: url }));
      Swal.fire({ icon: "success", title: "Imagen principal cargada", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir", confirmButtonColor: colorAzul }); }
    finally { setUploading(p => ({ ...p, principal: false })); }
  };

  const handleUploadBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(p => ({ ...p, banner: true }));
    try {
      const url = await uploadImage(file, "banners");
      setFormData(p => ({ ...p, banner: url }));
      Swal.fire({ icon: "success", title: "Banner cargado", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir", confirmButtonColor: colorAzul }); }
    finally { setUploading(p => ({ ...p, banner: false })); }
  };

  const handleUploadGaleria = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(p => ({ ...p, galeria: true }));
    try {
      const nuevas = await Promise.all(
        files.map(async (file) => {
          const url = await uploadImage(file, "galeria");
          return {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            src: url,
            alt: file.name,
            categoria: formData.categoriasGaleria[1]?.key || "sala-comedor",
          };
        })
      );
      setFormData(p => ({ ...p, galeria: [...p.galeria, ...nuevas] }));
      Swal.fire({ icon: "success", title: `${nuevas.length} imagen(es) añadida(s)`, timer: 1400, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Error al subir imágenes", confirmButtonColor: colorAzul }); }
    finally { setUploading(p => ({ ...p, galeria: false })); }
  };

  const handleGaleriaCategoria = (imgId, cat) => {
    setFormData(p => ({
      ...p,
      galeria: p.galeria.map(img => img.id === imgId ? { ...img, categoria: cat } : img)
    }));
  };

  const handleRemoveGaleriaImg = (imgId) => {
    setFormData(p => ({ ...p, galeria: p.galeria.filter(img => img.id !== imgId) }));
  };

  const handleCaracteristica = (idx, val) => {
    const arr = [...formData.caracteristicas];
    arr[idx] = val;
    setFormData(p => ({ ...p, caracteristicas: arr }));
  };
  const addCaracteristica = () => setFormData(p => ({ ...p, caracteristicas: [...p.caracteristicas, ""] }));
  const removeCaracteristica = (idx) => setFormData(p => ({ ...p, caracteristicas: p.caracteristicas.filter((_, i) => i !== idx) }));

  const handleCatGaleria = (idx, field, val) => {
    const arr = [...formData.categoriasGaleria];
    arr[idx] = { ...arr[idx], [field]: val };
    if (field === "label") arr[idx].key = toSlug(val);
    setFormData(p => ({ ...p, categoriasGaleria: arr }));
  };
  const addCatGaleria = () => setFormData(p => ({ ...p, categoriasGaleria: [...p.categoriasGaleria, { key: "", label: "" }] }));
  const removeCatGaleria = (idx) => setFormData(p => ({ ...p, categoriasGaleria: p.categoriasGaleria.filter((_, i) => i !== idx) }));

  // ── Helper avance de obra ──────────────────────────────
  const setAvance = (field, value) => {
    setFormData(p => ({ ...p, avanceObra: { ...p.avanceObra, [field]: value } }));
  };

  // ── Modals ─────────────────────────────────────────────
  const handleCreate = () => {
    setEditingProyecto(null);
    setFormData(EMPTY_FORM);
    setActiveTab("info");
    setShowModal(true);
  };

  const handleEdit = (proyecto) => {
    setEditingProyecto(proyecto);
    setFormData({
      slug: proyecto.slug || "",
      titulo: proyecto.titulo || "",
      ciudad: proyecto.ciudad || "",
      estado: proyecto.estado || "en-venta",
      descripcion: proyecto.descripcion || "",
      imagenPrincipal: proyecto.imagenPrincipal || "",
      banner: proyecto.banner || "",
      caracteristicas: proyecto.caracteristicas?.length ? proyecto.caracteristicas : [""],
      categoriasGaleria: proyecto.categoriasGaleria?.length ? proyecto.categoriasGaleria : EMPTY_FORM.categoriasGaleria,
      galeria: proyecto.galeria || [],
      active: proyecto.active !== false,
      avanceObra: {
        activo: proyecto.avanceObra?.activo ?? false,
        descripcion: proyecto.avanceObra?.descripcion ?? "",
        enlaceFacebook: proyecto.avanceObra?.enlaceFacebook ?? "",
      },
    });
    setActiveTab("info");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) return Swal.fire({ icon: "warning", title: "El título es obligatorio", confirmButtonColor: colorAzul });
    if (!formData.imagenPrincipal) return Swal.fire({ icon: "warning", title: "Sube la imagen principal", confirmButtonColor: colorAzul });

    const payload = {
      ...formData,
      slug: formData.slug || toSlug(formData.titulo),
      caracteristicas: formData.caracteristicas.filter(c => c.trim()),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProyecto) {
        await updateDoc(doc(db, "proyectos", editingProyecto.id), payload);
      } else {
        await addDoc(collection(db, "proyectos"), { ...payload, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      fetchProyectos();
      Swal.fire({ icon: "success", title: "¡Proyecto guardado!", timer: 1500, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error al guardar", confirmButtonColor: colorAzul });
    }
  };

  const handleToggle = async (proyecto) => {
    try {
      await updateDoc(doc(db, "proyectos", proyecto.id), { active: !proyecto.active, updatedAt: serverTimestamp() });
      fetchProyectos();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (proyecto) => {
    const result = await Swal.fire({
      title: "¿Eliminar proyecto?", text: "Se borrará permanentemente",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "proyectos", proyecto.id));
        fetchProyectos();
      } catch (e) { console.error(e); }
    }
  };

  const embedUrl = getFacebookEmbedUrl(formData.avanceObra?.enlaceFacebook);

  // ── UI ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-6 w-1.5" style={{ backgroundColor: colorVerde }} />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                Gestión de <span style={{ color: colorAzul }}>Proyectos</span>
              </h1>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Nuevo Pacífico • Panel Administrativo
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            className="flex items-center justify-center gap-3 rounded-sm px-8 py-4 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-lg"
            style={{ backgroundColor: colorAzul }}
          >
            <Plus size={16} /> Agregar Proyecto
          </motion.button>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${colorAzul} transparent ${colorAzul} ${colorAzul}` }} />
          </div>
        ) : proyectos.length === 0 ? (
          <div className="rounded-sm bg-white border border-dashed border-slate-300 p-24 text-center">
            <Building2 size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No hay proyectos registrados</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proyectos.map((proyecto) => {
              const estadoOpt = ESTADO_OPTIONS.find(e => e.value === proyecto.estado);
              const tieneAvance = proyecto.avanceObra?.activo && proyecto.avanceObra?.enlaceFacebook;
              return (
                <motion.div key={proyecto.id} layout className="group relative bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {proyecto.imagenPrincipal
                      ? <img src={proyecto.imagenPrincipal} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt={proyecto.titulo} />
                      : <div className="flex h-full items-center justify-center"><ImageIcon size={40} className="text-slate-200" /></div>
                    }
                    <div className={`absolute top-3 left-3 px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-sm ${estadoOpt?.color || "bg-slate-100 text-slate-600"}`}>
                      {estadoOpt?.label || proyecto.estado}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 text-[9px] font-black rounded-sm">
                      {proyecto.galeria?.length || 0} fotos
                    </div>
                    {/* Badge avance de obra */}
                    {tieneAvance && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[#1877F2] text-white px-2 py-1 text-[9px] font-black rounded-sm">
                        <HardHat size={10} /> Avance activo
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 truncate">{proyecto.titulo}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-medium">{proyecto.ciudad}</span>
                    </div>
                    {proyecto.caracteristicas?.length > 0 && (
                      <p className="text-[9px] text-slate-400 mt-2 truncate">{proyecto.caracteristicas.slice(0, 3).join(" · ")}</p>
                    )}
                  </div>

                  <div className="px-4 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${proyecto.active ? "bg-[#8DBA4D] animate-pulse" : "bg-slate-300"}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {proyecto.active ? "Visible" : "Oculto"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(proyecto)} className="p-2 hover:bg-slate-100 text-slate-600 transition-colors rounded-sm"><Pencil size={14} /></button>
                      <button onClick={() => handleToggle(proyecto)} className="p-2 hover:bg-slate-100 transition-colors rounded-sm" style={{ color: proyecto.active ? "#94a3b8" : colorVerde }}>
                        {proyecto.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleDelete(proyecto)} className="p-2 hover:bg-red-50 text-red-500 transition-colors rounded-sm"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── MODAL ── */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-sm bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-slate-50 px-8 py-5 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-1" style={{ backgroundColor: colorVerde }} />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                      {editingProyecto ? "Editar" : "Nuevo"} <span style={{ color: colorAzul }}>Proyecto</span>
                    </h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-100 flex-shrink-0 overflow-x-auto">
                  {[
                    { key: "info", label: "Información", icon: Building2 },
                    { key: "imagenes", label: "Imágenes", icon: ImageIcon },
                    { key: "galeria", label: "Galería", icon: FolderOpen },
                    { key: "caracteristicas", label: "Características", icon: List },
                    { key: "categorias", label: "Categorías", icon: Tag },
                    { key: "avance", label: "Avance de Obra", icon: HardHat },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-2 px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                        activeTab === key
                          ? key === "avance"
                            ? "border-[#1877F2] text-[#1877F2]"
                            : "border-[#005B8C] text-[#005B8C]"
                          : "border-transparent text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <Icon size={13} />{label}
                      {/* Indicador si avance está activo */}
                      {key === "avance" && formData.avanceObra?.activo && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-[#1877F2] animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">

                  {/* ── TAB: INFO ── */}
                  {activeTab === "info" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Título *</label>
                          <input
                            value={formData.titulo}
                            onChange={e => {
                              const t = e.target.value;
                              setFormData(p => ({ ...p, titulo: t, slug: toSlug(t) }));
                            }}
                            className="w-full border-b-2 border-slate-200 py-2 text-base font-bold text-slate-900 focus:border-[#005B8C] focus:outline-none transition-colors"
                            placeholder="Ej: Residencial El Carmen"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Slug (URL)</label>
                          <input
                            value={formData.slug}
                            onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                            className="w-full border-b-2 border-slate-200 py-2 text-sm font-medium text-slate-500 focus:border-[#005B8C] focus:outline-none transition-colors"
                            placeholder="residencial-el-carmen"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Ciudad</label>
                          <input
                            value={formData.ciudad}
                            onChange={e => setFormData(p => ({ ...p, ciudad: e.target.value }))}
                            className="w-full border-b-2 border-slate-200 py-2 text-base font-bold text-slate-900 focus:border-[#005B8C] focus:outline-none transition-colors"
                            placeholder="Trujillo"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                          <select
                            value={formData.estado}
                            onChange={e => setFormData(p => ({ ...p, estado: e.target.value }))}
                            className="w-full border-b-2 border-slate-200 py-2 text-base font-bold text-slate-900 focus:border-[#005B8C] focus:outline-none transition-colors bg-transparent"
                          >
                            {ESTADO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</label>
                        <textarea
                          value={formData.descripcion}
                          onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                          rows={5}
                          className="w-full border border-slate-200 rounded-sm p-4 text-sm text-slate-700 focus:border-[#005B8C] focus:outline-none transition-colors resize-none"
                          placeholder="Describe el proyecto..."
                        />
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-sm">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={e => setFormData(p => ({ ...p, active: e.target.checked }))}
                          className="h-4 w-4"
                        />
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Visible al público</label>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: IMÁGENES ── */}
                  {activeTab === "imagenes" && (
                    <div className="space-y-8">
                      <div>
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen Principal (Card) *</label>
                        {formData.imagenPrincipal ? (
                          <div className="group relative aspect-video overflow-hidden border border-slate-200 rounded-sm shadow-inner">
                            <img src={formData.imagenPrincipal} className="h-full w-full object-cover" alt="Principal" />
                            <button
                              onClick={() => setFormData(p => ({ ...p, imagenPrincipal: "" }))}
                              className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="bg-red-500 p-4 text-white rounded-full shadow-lg"><Trash2 size={24} /></div>
                            </button>
                          </div>
                        ) : (
                          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all rounded-sm">
                            {uploading.principal
                              ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${colorAzul} transparent ${colorAzul} ${colorAzul}` }} />
                              : <><Upload size={36} className="mb-3 text-slate-300" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subir Imagen Principal</span></>
                            }
                            <input type="file" accept="image/*" onChange={handleUploadPrincipal} className="hidden" />
                          </label>
                        )}
                      </div>

                      <div>
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Banner (Detalle del Proyecto) — Proporción 21:9</label>
                        {formData.banner ? (
                          <div className="group relative aspect-video overflow-hidden border border-slate-200 rounded-sm shadow-inner">
                            <img src={formData.banner} className="h-full w-full object-cover" alt="Banner" />
                            <button
                              onClick={() => setFormData(p => ({ ...p, banner: "" }))}
                              className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="bg-red-500 p-4 text-white rounded-full shadow-lg"><Trash2 size={24} /></div>
                            </button>
                          </div>
                        ) : (
                          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all rounded-sm">
                            {uploading.banner
                              ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${colorAzul} transparent ${colorAzul} ${colorAzul}` }} />
                              : <><Upload size={36} className="mb-3 text-slate-300" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subir Banner</span></>
                            }
                            <input type="file" accept="image/*" onChange={handleUploadBanner} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── TAB: GALERÍA ── */}
                  {activeTab === "galeria" && (
                    <div className="space-y-6">
                      <label className="flex cursor-pointer items-center justify-center gap-3 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all rounded-sm py-8">
                        {uploading.galeria
                          ? <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${colorAzul} transparent ${colorAzul} ${colorAzul}` }} />
                          : <>
                            <Upload size={24} className="text-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subir imágenes a la galería (múltiple)</span>
                          </>
                        }
                        <input type="file" accept="image/*" multiple onChange={handleUploadGaleria} className="hidden" />
                      </label>

                      {formData.galeria.length === 0 ? (
                        <div className="text-center py-12 text-slate-300">
                          <FolderOpen size={40} className="mx-auto mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Sin imágenes aún</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.galeria.map((img) => (
                            <div key={img.id} className="group relative border border-slate-200 rounded-sm overflow-hidden bg-slate-50">
                              <img src={img.src} alt={img.alt} className="w-full aspect-square object-cover" />
                              <button
                                onClick={() => handleRemoveGaleriaImg(img.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                              ><X size={12} /></button>
                              <div className="p-2">
                                <select
                                  value={img.categoria}
                                  onChange={e => handleGaleriaCategoria(img.id, e.target.value)}
                                  className="w-full text-[9px] font-black uppercase tracking-widest border border-slate-200 rounded-sm px-2 py-1 focus:border-[#005B8C] focus:outline-none bg-white text-slate-600"
                                >
                                  {formData.categoriasGaleria.filter(c => c.key !== "todos").map(c => (
                                    <option key={c.key} value={c.key}>{c.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: CARACTERÍSTICAS ── */}
                  {activeTab === "caracteristicas" && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Lista de características del proyecto</p>
                      {formData.caracteristicas.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorVerde }} />
                          <input
                            value={c}
                            onChange={e => handleCaracteristica(idx, e.target.value)}
                            className="flex-1 border-b border-slate-200 py-2 text-sm font-medium text-slate-700 focus:border-[#005B8C] focus:outline-none transition-colors"
                            placeholder={`Característica ${idx + 1}`}
                          />
                          <button onClick={() => removeCaracteristica(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                        </div>
                      ))}
                      <button
                        onClick={addCaracteristica}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors mt-4"
                        style={{ color: colorAzul }}
                      >
                        <Plus size={14} /> Añadir característica
                      </button>
                    </div>
                  )}

                  {/* ── TAB: CATEGORÍAS ── */}
                  {activeTab === "categorias" && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Categorías del filtro de galería</p>
                      {formData.categoriasGaleria.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              value={cat.label}
                              onChange={e => handleCatGaleria(idx, "label", e.target.value)}
                              disabled={idx === 0}
                              className="border-b border-slate-200 py-2 text-sm font-medium text-slate-700 focus:border-[#005B8C] focus:outline-none transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                              placeholder="Nombre (ej: SALA COMEDOR)"
                            />
                            <input
                              value={cat.key}
                              readOnly
                              className="border-b border-slate-100 py-2 text-[11px] font-mono text-slate-400"
                              placeholder="key (auto)"
                            />
                          </div>
                          {idx !== 0 && (
                            <button onClick={() => removeCatGaleria(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addCatGaleria}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors mt-4"
                        style={{ color: colorAzul }}
                      >
                        <Plus size={14} /> Añadir categoría
                      </button>
                    </div>
                  )}

                  {/* ── TAB: AVANCE DE OBRA ── */}
                  {activeTab === "avance" && (
                    <div className="space-y-8">

                      {/* Toggle activar */}
                      <div
                        className={`flex items-center justify-between p-5 rounded-sm border-2 transition-all ${
                          formData.avanceObra?.activo
                            ? "border-[#1877F2] bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-sm ${formData.avanceObra?.activo ? "bg-[#1877F2]" : "bg-slate-200"}`}>
                            <HardHat size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                              Avance de Obra
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formData.avanceObra?.activo ? "Visible en la página del proyecto" : "Oculto al público"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAvance("activo", !formData.avanceObra?.activo)}
                          className="transition-all"
                        >
                          {formData.avanceObra?.activo
                            ? <ToggleRight size={40} className="text-[#1877F2]" />
                            : <ToggleLeft size={40} className="text-slate-300" />
                          }
                        </button>
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Descripción del Avance
                        </label>
                        <textarea
                          value={formData.avanceObra?.descripcion}
                          onChange={e => setAvance("descripcion", e.target.value)}
                          rows={4}
                          className="w-full border border-slate-200 rounded-sm p-4 text-sm text-slate-700 focus:border-[#1877F2] focus:outline-none transition-colors resize-none"
                          placeholder="Ej: Actualmente nos encontramos en la fase de vaciado de columnas del tercer nivel..."
                        />
                      </div>

                      {/* Enlace de Facebook */}
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Enlace de Publicación de Facebook
                        </label>
                        <div className="flex items-center gap-3 border-b-2 border-slate-200 focus-within:border-[#1877F2] transition-colors pb-1">
                          <Facebook size={18} className="text-[#1877F2] flex-shrink-0" />
                          <input
                            value={formData.avanceObra?.enlaceFacebook}
                            onChange={e => setAvance("enlaceFacebook", e.target.value)}
                            className="flex-1 py-2 text-sm font-medium text-slate-700 focus:outline-none bg-transparent"
                            placeholder="https://www.facebook.com/permalink/..."
                          />
                          {formData.avanceObra?.enlaceFacebook && (
                            <a
                              href={formData.avanceObra.enlaceFacebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-black uppercase tracking-widest text-[#1877F2] hover:underline flex-shrink-0"
                            >
                              Abrir ↗
                            </a>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-medium">
                          Pega el enlace directo a la publicación de Facebook. Los usuarios serán redirigidos al hacer click.
                        </p>
                      </div>

                      {/* Vista previa embed */}
                      {embedUrl && (
                        <div>
                          <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Vista Previa del Post
                          </label>
                          <div className="border border-slate-200 rounded-sm overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                            <iframe
                              src={embedUrl}
                              width="560"
                              height="380"
                              style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
                              scrolling="no"
                              frameBorder="0"
                              allowFullScreen
                              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-2 font-medium text-center">
                            Vista previa del embed — el post de Facebook debe ser público para que aparezca.
                          </p>
                        </div>
                      )}

                      {/* Estado resumen */}
                      {!formData.avanceObra?.enlaceFacebook && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-sm">
                          <Link size={16} className="text-amber-400 flex-shrink-0" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                            Ingresa el enlace de Facebook para habilitar la sección
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="flex border-t border-slate-100 flex-shrink-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={uploading.principal || uploading.banner || uploading.galeria}
                    className="flex-[2] px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: colorAzul }}
                  >
                    <Save size={16} />
                    {editingProyecto ? "Guardar Cambios" : "Crear Proyecto"}
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