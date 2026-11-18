// lib/certificados.js — Fuente única de verdad para certificados.
// Un documento por certificado en la colección "certificados" (ID = código).
// Sobrevive al borrado/reinicio de cursos porque guarda snapshots.
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const COLLECTION = "certificados";
export const CODIGO_MAX = 40;

/** Normaliza el código manual: mayúsculas, sin espacios externos. */
export function normalizarCodigo(raw = "") {
  return String(raw).trim().toUpperCase().replace(/\s+/g, "-");
}

/** Prefijo sugerido desde el título del curso: iniciales + año. Ej: "Matemáticas" → "MAT-2026-" */
export function prefijoCurso(titulo = "") {
  const year = new Date().getFullYear();
  const palabras = String(titulo || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length > 2);
  const base = palabras.length === 0 ? "CURSO"
    : palabras.length === 1 ? palabras[0].slice(0, 3)
    : palabras.slice(0, 3).map(w => w[0]).join("");
  return `${base}-${year}-`;
}

/** Reglas del código: 3-40 caracteres, solo letras, números, guion y guion bajo. */
export function validarCodigo(codigo) {
  const c = normalizarCodigo(codigo);
  if (c.length < 3) return { ok: false, error: "El código debe tener al menos 3 caracteres." };
  if (c.length > CODIGO_MAX) return { ok: false, error: `Máximo ${CODIGO_MAX} caracteres.` };
  if (!/^[A-Z0-9][A-Z0-9\-_]*[A-Z0-9]$/.test(c))
    return { ok: false, error: "Solo letras, números, guion (-) y guion bajo (_)." };
  return { ok: true, codigo: c };
}

/** Siguiente correlativo disponible para un prefijo. Ej: "MAT-2026-" → "MAT-2026-004" */
export async function sugerirSiguiente(prefijo) {
  const p = normalizarCodigo(prefijo);
  try {
    const snap = await getDocs(query(
      collection(db, COLLECTION),
      where("codigo", ">=", p),
      where("codigo", "<", p + "\uf8ff"),
    ));
    let max = 0;
    snap.forEach(d => {
      const resto = String(d.id).slice(p.length);
      const n = parseInt(resto.replace(/\D/g, "").slice(-4) || "0", 10);
      if (Number.isFinite(n) && n > max) max = n;
    });
    return `${p}${String(max + 1).padStart(3, "0")}`;
  } catch {
    return `${p}001`;
  }
}

/** ¿El código ya está en uso por OTRO certificado? */
export async function codigoEnUso(codigo, ignorarCodigoActual = null) {
  const c = normalizarCodigo(codigo);
  if (ignorarCodigoActual && c === normalizarCodigo(ignorarCodigoActual)) return false;
  const snap = await getDoc(doc(db, COLLECTION, c));
  return snap.exists();
}

/** Lectura directa por código (lo que usa la validación pública). */
export async function obtenerCertificado(codigo) {
  const snap = await getDoc(doc(db, COLLECTION, normalizarCodigo(codigo)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listarPorCurso(cursoId) {
  const snap = await getDocs(query(collection(db, COLLECTION), where("cursoId", "==", cursoId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function contarPorCurso(cursoId) {
  try {
    const snap = await getCountFromServer(
      query(collection(db, COLLECTION), where("cursoId", "==", cursoId))
    );
    return snap.data().count;
  } catch {
    const lista = await listarPorCurso(cursoId);
    return lista.length;
  }
}

/**
 * Emite (o reasigna) el certificado de un alumno en un curso.
 * - codigo: texto manual del míster (se normaliza y se exige único).
 * - Crea el doc en "certificados" y deja espejo en estudiantes_progreso
 *   para no romper la vista del estudiante.
 */
export async function emitirCertificado({
  codigo, estudianteUid, cursoId,
  estudianteNombre = "", estudianteDni = "", cursoTitulo = "",
  emitidoPor = "admin", codigoAnterior = null,
}) {
  const v = validarCodigo(codigo);
  if (!v.ok) { const e = new Error(v.error); e.code = "CODIGO_INVALIDO"; throw e; }
  const c = v.codigo;

  if (await codigoEnUso(c, codigoAnterior)) {
    const e = new Error(`El código ${c} ya está asignado a otro certificado.`);
    e.code = "CODIGO_DUPLICADO"; throw e;
  }

  const ahora = serverTimestamp();
  await setDoc(doc(db, COLLECTION, c), {
    codigo: c,
    estudianteUid, cursoId,
    estudianteNombre, estudianteDni, cursoTitulo,
    url: null, estado: "activo",
    emitidoEn: ahora, emitidoPor, updatedAt: ahora,
  }, { merge: true });

  // Si se reasignó (cambió el código), retirar el documento anterior.
  if (codigoAnterior && normalizarCodigo(codigoAnterior) !== c) {
    try { await deleteDoc(doc(db, COLLECTION, normalizarCodigo(codigoAnterior))); } catch {}
  }

  // Espejo en progreso (lo que lee el panel del estudiante).
  await setDoc(doc(db, "estudiantes_progreso", estudianteUid), {
    [`completado_${cursoId}`]: true,
    [`codigo_${cursoId}`]: c,
    updatedAt: ahora,
  }, { merge: true });

  return c;
}

/** Guarda/actualiza la URL del PDF personal en el certificado (si existe). */
export async function vincularPdf(codigo, url) {
  await updateDoc(doc(db, COLLECTION, normalizarCodigo(codigo)), {
    url, updatedAt: serverTimestamp(),
  });
}

/** Busca el certificado de un alumno en un curso (para vincular PDFs). */
export async function certificadoDe(cursoId, estudianteUid) {
  const snap = await getDocs(query(
    collection(db, COLLECTION),
    where("cursoId", "==", cursoId),
    where("estudianteUid", "==", estudianteUid),
  ));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** Revoca sin borrar (el historial se conserva). */
export async function revocarCertificado(codigo) {
  await updateDoc(doc(db, COLLECTION, normalizarCodigo(codigo)), {
    estado: "revocado", updatedAt: serverTimestamp(),
  });
}
