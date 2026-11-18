// Migrar códigos/certificados existentes a la colección "certificados".
// Uso (una sola vez):
//   $env:NEXT_PUBLIC_FIREBASE_API_KEY="..."; ... (las 6 vars) ; node migrarCertificados.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!cfg.apiKey || !cfg.projectId) {
  console.error("Faltan las variables NEXT_PUBLIC_FIREBASE_* en el entorno.");
  process.exit(1);
}

const normalizar = (s) => String(s || "").trim().toUpperCase().replace(/\s+/g, "-");

const app = initializeApp(cfg);
const db = getFirestore(app);

async function main() {
  const progSnap = await getDocs(collection(db, "estudiantes_progreso"));
  let creados = 0, existentes = 0, sinCodigo = 0;

  for (const p of progSnap.docs) {
    const uid = p.id;
    const data = p.data();
    let est = null;
    try { const s = await getDoc(doc(db, "estudiantes", uid)); if (s.exists()) est = s.data(); } catch {}

    for (const key of Object.keys(data)) {
      if (!key.startsWith("codigo_")) continue;
      const cursoId = key.replace("codigo_", "");
      const codigo = normalizar(data[key]);
      if (!codigo) { sinCodigo++; continue; }

      const ref = doc(db, "certificados", codigo);
      try {
        const ya = await getDoc(ref);
        if (ya.exists()) { existentes++; continue; }
      } catch {}

      let cursoTitulo = "";
      try {
        const c = await getDoc(doc(db, "cursos", cursoId));
        if (c.exists()) cursoTitulo = c.data().titulo || "";
      } catch {}

      await setDoc(ref, {
        codigo,
        estudianteUid: uid,
        cursoId,
        estudianteNombre: est ? `${est.nombres || ""} ${est.apellidos || ""}`.trim() : "",
        estudianteDni: est?.dni || data.dni || "",
        cursoTitulo,
        url: data[`certificado_${cursoId}`] || null,
        estado: "activo",
        emitidoEn: serverTimestamp(),
        emitidoPor: "migracion",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      creados++;
      console.log(`+ ${codigo} (${cursoTitulo || cursoId})`);
    }
  }
  console.log(`\nListo: ${creados} creados, ${existentes} ya existían, ${sinCodigo} vacíos.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
