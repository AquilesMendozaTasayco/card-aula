"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { GraduationCap, Mail, Lock, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const COLOR_ROJO    = "#8B0000";
const COLOR_NARANJA = "#D65B2B";

export default function HeroCentroDocente() {
  const router = useRouter();
  const [slides, setSlides]         = useState([]);
  const [index, setIndex]           = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(true);

  // Login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [logging, setLogging]   = useState(false);

  // ── Cargar banners activos desde Firestore ────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const q = query(collection(db, "banners"), orderBy("orden", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(b => b.activo !== false); // solo activos
        setSlides(data);
      } catch (e) {
        console.error("Error cargando banners:", e);
      } finally {
        setLoadingSlides(false);
      }
    };
    cargar();
  }, []);

  // ── Auto-slide ────────────────────────────────────────────────────────────
  const nextSlide = useCallback(() => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setIndex(prev => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 1000);
  }, [isAnimating, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [nextSlide, slides.length]);

  // ── Login funcional ───────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({ icon: "warning", title: "Completa los campos", confirmButtonColor: COLOR_ROJO,
        background: "#fff", customClass: { popup: "rounded-2xl" } });
      return;
    }
    setLogging(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));

      if (!snap.exists()) {
        await auth.signOut();
        Swal.fire({ icon: "error", title: "Acceso denegado", text: "No se encontró un perfil asociado.",
          confirmButtonColor: COLOR_ROJO, background: "#fff", customClass: { popup: "rounded-2xl" } });
        return;
      }

      const { rol, nombre } = snap.data();
      // Guardar cookie de rol para el middleware
      document.cookie = `rol=${rol}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      if (rol === "admin") {
        await Swal.fire({ icon: "success", title: `¡Bienvenido, ${nombre || "Admin"}!`,
          text: "Accediendo al panel...", timer: 1400, showConfirmButton: false,
          timerProgressBar: true, background: "#fff", customClass: { popup: "rounded-2xl" } });
        router.push("/admin/dashboard");
      } else if (rol === "estudiante") {
        await Swal.fire({ icon: "success", title: `¡Hola, ${nombre || "Estudiante"}!`,
          text: "Accediendo a tu aula...", timer: 1400, showConfirmButton: false,
          timerProgressBar: true, background: "#fff", customClass: { popup: "rounded-2xl" } });
        router.push("/estudiante/dashboard");
      } else {
        Swal.fire({ icon: "warning", title: "Rol no reconocido",
          text: `El rol "${rol}" no tiene ruta asignada.`,
          confirmButtonColor: COLOR_ROJO, background: "#fff", customClass: { popup: "rounded-2xl" } });
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found":     "No existe una cuenta con este correo.",
        "auth/wrong-password":     "Contraseña incorrecta.",
        "auth/too-many-requests":  "Demasiados intentos. Espera un momento.",
        "auth/invalid-email":      "El formato del correo no es válido.",
        "auth/invalid-credential": "Credenciales incorrectas.",
      };
      Swal.fire({ icon: "error", title: "Error de acceso",
        text: msgs[err.code] || "Ocurrió un error inesperado.",
        confirmButtonColor: COLOR_ROJO, background: "#fff", customClass: { popup: "rounded-2xl" } });
    } finally {
      setLogging(false);
    }
  };

  const slide = slides[index];

  return (
    <section className="relative w-full h-screen bg-[#2A1810] overflow-hidden flex items-center">

      {/* ── Fondos dinámicos ── */}
      {slides.map((s, i) => (
        <div key={s.id || i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: `linear-gradient(to right, rgba(42,24,16,0.9), rgba(42,24,16,0.4)), url(${s.imagen})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      {/* Fallback si no hay banners */}
      {!loadingSlides && slides.length === 0 && (
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #2A1810 0%, #4a2010 100%)" }} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── LADO IZQUIERDO ── */}
        <div className="text-white space-y-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-red-500 font-black tracking-[0.4em] text-xs md:text-sm uppercase">
            Centro de Alto Rendimiento Docente
          </motion.p>

          <h1 className="text-4xl md:text-7xl font-light leading-tight min-h-[1em]">
            {slide ? slide.lema.split(" ").map((word, i) => (
              <span key={i} className={i === 1 || i === 2 ? "font-black" : ""}>{word} </span>
            )) : <span className="opacity-30">AULA VIRTUAL</span>}
          </h1>

          <p className="text-lg text-white/60 max-w-lg leading-relaxed font-medium min-h-[3.5rem]">
            {slide?.subtitulo || ""}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {slide?.boton && slide?.href && (
              <Link href={slide.href}
                className="flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest border border-white/20 text-white hover:bg-white/10 transition-all">
                {slide.boton} <ChevronRight size={14} />
              </Link>
            )}
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white/40 border border-white/10 px-5 py-2.5 rounded-full uppercase">
              <CheckCircle size={14} className="text-red-600" /> Innovación Pedagógica
            </div>
          </div>
        </div>

        {/* ── LADO DERECHO: LOGIN ── */}
        <div className="hidden lg:block relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] bg-white ml-auto shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-sm">

            <div className="h-1.5 w-full flex">
              <div className="h-full w-1/2" style={{ backgroundColor: COLOR_ROJO }} />
              <div className="h-full w-1/4" style={{ backgroundColor: COLOR_NARANJA }} />
              <div className="h-full w-1/4" style={{ backgroundColor: "#502814" }} />
            </div>

            <div className="p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-2xl mb-4 border border-stone-100">
                  <GraduationCap className="h-8 w-8" style={{ color: COLOR_ROJO }} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
                  AULA <span style={{ color: COLOR_ROJO }}>VIRTUAL</span>
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mt-2">
                  Panel de Acceso CARD
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 block transition-colors group-focus-within:text-red-700">
                    Correo Institucional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="email" placeholder="usuario@card.pe" value={email}
                      onChange={e => setEmail(e.target.value)} required
                      className="w-full border-b-2 border-stone-100 bg-transparent pl-7 py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-700" />
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1 block transition-colors group-focus-within:text-red-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="password" placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      className="w-full border-b-2 border-stone-100 bg-transparent pl-7 py-2 text-sm font-medium text-slate-900 outline-none transition-all focus:border-red-700" />
                  </div>
                </div>

                <button type="submit" disabled={logging}
                  style={{ backgroundColor: COLOR_ROJO }}
                  className="w-full group relative flex items-center justify-center py-4 px-6 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg disabled:opacity-60">
                  {logging
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <>Iniciar Sesión <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                  }
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Indicadores laterales ── */}
      {slides.length > 1 && (
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 flex flex-col gap-10 z-20">
          {slides.map((_, i) => (
            <button key={i} onClick={() => !isAnimating && setIndex(i)}
              className="group flex flex-col items-center gap-3">
              <div className={`w-[1px] transition-all duration-700 ${i === index ? "h-14 bg-red-600" : "h-6 bg-white/10 group-hover:bg-white/40"}`} />
              <span className={`text-[10px] font-black transition-colors ${i === index ? "text-red-600" : "text-white/20"}`}>0{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}