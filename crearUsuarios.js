import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTvwDwkP0DNCvOOpGntIiqLRYSpPfYnAs",
  authDomain: "card-aula.firebaseapp.com",
  projectId: "card-aula",
  storageBucket: "card-aula.firebasestorage.app",
  messagingSenderId: "782532772845",
  appId: "1:782532772845:web:59158d66212dbf5f3edde4"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── Datos de los 2 usuarios a crear ─────────────────────────────────────────
const usuarios = [
  {
    email:    "dweb@emocion.pe",
    password: "emocion2026",
    nombre:   "Administrador Principal",
    rol:      "admin",
  },
  {
    email:    "estudiante@gmail.com",
    password: "emocion2026",
    nombre:   "Estudiante Demo",
    rol:      "estudiante",
  },
];

// ─── Función principal ────────────────────────────────────────────────────────
async function crearUsuarios() {
  console.log("🚀 Iniciando creación de usuarios...\n");

  for (const usuario of usuarios) {
    try {
      // 1. Crear en Firebase Auth
      const credencial = await createUserWithEmailAndPassword(
        auth,
        usuario.email,
        usuario.password
      );

      const uid = credencial.user.uid;

      // 2. Crear documento en Firestore → colección "usuarios"
      await setDoc(doc(db, "usuarios", uid), {
        nombre:    usuario.nombre,
        rol:       usuario.rol,
        email:     usuario.email,
        creadoEn:  new Date().toISOString(),
      });

      console.log(`✅ Usuario creado exitosamente:`);
      console.log(`   📧 Email:    ${usuario.email}`);
      console.log(`   🔑 Password: ${usuario.password}`);
      console.log(`   👤 Rol:      ${usuario.rol}`);
      console.log(`   🆔 UID:      ${uid}`);
      console.log("─".repeat(50));

    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.warn(`⚠️  El email ${usuario.email} ya existe, se omite.`);
      } else {
        console.error(`❌ Error al crear ${usuario.email}:`, error.message);
      }
    }
  }

  console.log("\n✅ Proceso finalizado.");
  process.exit(0);
}

crearUsuarios();