"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, Mail, ChevronRight, Loader2, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

export default function AulaVirtualLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const colorRojo = "#EF3340";
  const colorNaranja = "#D65B2B";
  const colorMarron = "#8B4513";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Obtener el rol desde Firestore → colección "usuarios"
      //    Documento estructura: { rol: "admin" | "estudiante", nombre: "...", ... }
      const userDoc = await getDoc(doc(db, "usuarios", uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        await Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: "No se encontró un perfil asociado a esta cuenta.",
          confirmButtonColor: colorRojo,
          background: "#fff",
          customClass: { popup: "rounded-2xl" },
        });
        setLoading(false);
        return;
      }

      const { rol, nombre } = userDoc.data();

      // 3. Guardar rol en cookie para que el middleware proteja las rutas
      document.cookie = `rol=${rol}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      // 4. Redirigir según el rol
      if (rol === "admin") {
        await Swal.fire({
          icon: "success",
          title: `¡Bienvenido, ${nombre || "Administrador"}!`,
          text: "Accediendo al panel administrativo...",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
          confirmButtonColor: colorRojo,
          background: "#fff",
          customClass: { popup: "rounded-2xl" },
        });
        router.push("/admin/dashboard");
      } else if (rol === "estudiante") {
        await Swal.fire({
          icon: "success",
          title: `¡Hola, ${nombre || "Estudiante"}!`,
          text: "Accediendo a tu aula virtual...",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
          confirmButtonColor: colorRojo,
          background: "#fff",
          customClass: { popup: "rounded-2xl" },
        });
        router.push("/estudiante/dashboard");
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Rol no reconocido",
          text: `El rol "${rol}" no tiene una ruta asignada.`,
          confirmButtonColor: colorRojo,
          background: "#fff",
          customClass: { popup: "rounded-2xl" },
        });
      }
    } catch (err) {
      const errorMessages = {
        "auth/user-not-found": "No existe una cuenta con este correo.",
        "auth/wrong-password": "Contraseña incorrecta. Intente de nuevo.",
        "auth/too-many-requests": "Demasiados intentos. Cuenta bloqueada temporalmente.",
        "auth/invalid-email": "El formato del correo no es válido.",
        "auth/invalid-credential": "Credenciales incorrectas. Verifique sus datos.",
      };

      await Swal.fire({
        icon: "error",
        title: "Error de acceso",
        text: errorMessages[err.code] || "Ocurrió un error inesperado. Intente de nuevo.",
        confirmButtonColor: colorRojo,
        background: "#fff",
        customClass: { popup: "rounded-2xl" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 relative overflow-hidden">

      {/* Elementos decorativos de fondo */}
      <div
        className="absolute top-[-10%] left-[-5%] w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colorRojo }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: colorNaranja }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10"
      >
        {/* Barra de acento triple */}
        <div className="h-2 w-full flex">
          <div className="h-full w-1/2" style={{ backgroundColor: colorRojo }} />
          <div className="h-full w-1/4" style={{ backgroundColor: colorNaranja }} />
          <div className="h-full w-1/4" style={{ backgroundColor: colorMarron }} />
        </div>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-stone-50 rounded-2xl mb-6 shadow-inner border border-stone-100"
            >
              <GraduationCap className="h-10 w-10" style={{ color: colorRojo }} />
            </motion.div>

            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
              AULA <span style={{ color: colorRojo }}>VIRTUAL</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-[1px] w-8 bg-stone-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
                Centro de Rendimiento
              </p>
              <div className="h-[1px] w-8 bg-stone-300" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email */}
            <div className="group">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 block transition-colors group-focus-within:text-red-600">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  placeholder="usuario@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-b-2 border-stone-200 bg-transparent pl-7 py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-500"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="group">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 block transition-colors group-focus-within:text-red-600">
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-b-2 border-stone-200 bg-transparent pl-7 py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center py-4 px-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 overflow-hidden"
              style={{ backgroundColor: colorRojo }}
            >
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Ingresar al Aula
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex gap-1">
              {[colorRojo, colorNaranja, colorMarron].map((c, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[10px] font-medium text-stone-400">
              © 2026 Centro de Rendimiento Académico
            </span>
          </div>
        </div>
      </motion.div>

      {/* Patrón de fondo */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${colorMarron} 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />
    </div>
  );
}