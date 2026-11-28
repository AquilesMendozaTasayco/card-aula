// Simulacros compartidos con el proyecto card-simulacro (mismo Firebase).
// Colecciones independientes: sim_simulacros / sim_preguntas / sim_intentos.
import {
  collection, doc, getDoc, getDocs, setDoc,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const C_SIM = "sim_simulacros";
export const C_PRE = "sim_preguntas";
export const C_INT = "sim_intentos";

export async function listarSimulacros() {
  try {
    const snap = await getDocs(query(collection(db, C_SIM)));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
    return all.filter((s) => s.activo !== false);
  } catch {
    return [];
  }
}

export async function obtenerSimulacro(id) {
  const snap = await getDoc(doc(db, C_SIM, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listarPreguntas() {
  try {
    const snap = await getDocs(collection(db, C_PRE));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.activo !== false);
  } catch {
    return [];
  }
}

export async function resolverPreguntas(s) {
  const vivas = await listarPreguntas();
  if (s.modo === "manual") {
    const ids = s.preguntasIds || [];
    return ids.map((pid) => vivas.find((p) => p.id === pid)).filter(Boolean);
  }
  const fil = vivas.filter((p) =>
    (!s.curso || p.curso === s.curso) &&
    (!s.tema || (p.tema || "").toLowerCase().includes((s.tema || "").toLowerCase())) &&
    (!s.dificultad || p.dificultad === s.dificultad)
  );
  const n = Math.min(s.cantidad || fil.length, fil.length);
  return [...fil].sort(() => Math.random() - 0.5).slice(0, n);
}

export async function contarIntentos(simulacroId, registroId) {
  const snap = await getDocs(query(collection(db, C_INT), where("simulacroId", "==", simulacroId)));
  return snap.docs.filter((d) => (d.data().registroId || "") === (registroId || "")).length;
}

export async function guardarIntento({ registroId, nombres, simulacroId, simulacroTitulo, respuestas, puntaje, total, detalle }) {
  const ref = doc(collection(db, C_INT));
  await setDoc(ref, {
    codigo: "CLIENTE", registroId: registroId || "", nombres: nombres || "",
    simulacroId, simulacro: simulacroTitulo,
    respuestas, puntaje, total, detalle: detalle || [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listarMisIntentos(registroId) {
  const snap = await getDocs(query(collection(db, C_INT), where("registroId", "==", registroId)));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  all.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });
  return all;
}
