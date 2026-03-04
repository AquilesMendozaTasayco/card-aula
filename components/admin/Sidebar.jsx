"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  LogOut, ChevronRight, LayoutDashboard, GraduationCap,
  BookOpen, CircleUser, PlayCircle, ClipboardCheck,
  Award, MessageSquare, Bell, Users, ImagePlay,
  BarChart3, Settings, ClipboardList, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

// ─── Módulos por rol ──────────────────────────────────────────────────────────
const MENU_ADMIN = [
  { label: "Dashboard",      href: "/admin/dashboard",       icon: LayoutDashboard },
  // { label: "Banners",        href: "/admin/banners",          icon: ImagePlay },
  { label: "Cursos",         href: "/admin/cursos",           icon: BookOpen },
  { label: "Estudiantes",    href: "/admin/estudiantes",      icon: Users },
  // { label: "Evaluaciones",   href: "/admin/evaluaciones",     icon: ClipboardList },
  // { label: "Certificados",   href: "/admin/certificados",     icon: GraduationCap },
  // { label: "Reportes",       href: "/admin/reportes",         icon: BarChart3 },
  // { label: "Notificaciones", href: "/admin/notificaciones",   icon: Bell },
  // { label: "Configuración",  href: "/admin/configuracion",    icon: Settings },
];

const MENU_ESTUDIANTE = [
  { label: "Inicio",         href: "/estudiante/dashboard",      icon: LayoutDashboard },
  { label: "Mis Cursos",     href: "/estudiante/cursos",         icon: BookOpen },
  // { label: "Mis Clases",     href: "/estudiante/clases",         icon: PlayCircle },
  // { label: "Evaluaciones",   href: "/estudiante/evaluaciones",   icon: ClipboardCheck },
  // { label: "Certificados",   href: "/estudiante/certificados",   icon: Award },
  // { label: "Notificaciones", href: "/estudiante/notificaciones", icon: Bell },
  // { label: "Soporte",        href: "/estudiante/soporte",        icon: MessageSquare },
];

// ─── Colores ──────────────────────────────────────────────────────────────────
const COLOR = {
  rojo:    "#EF3340",
  naranja: "#D65B2B",
  marron:  "#8B4513",
  fondo:   "#2A1810",
};

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [usuario, setUsuario]       = useState(null);   // { nombre, rol, email }
  const [cargando, setCargando]     = useState(true);
  const [cerrando, setCerrando]     = useState(false);

  // ─── Detectar usuario autenticado y leer rol desde Firestore ────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuario(null);
        setCargando(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "usuarios", firebaseUser.uid));
        if (snap.exists()) {
          setUsuario({ email: firebaseUser.email, ...snap.data() });
        } else {
          setUsuario({ email: firebaseUser.email, rol: null, nombre: "Usuario" });
        }
      } catch {
        setUsuario({ email: firebaseUser.email, rol: null, nombre: "Usuario" });
      } finally {
        setCargando(false);
      }
    });
    return () => unsub();
  }, []);

  // ─── Menú e identidad visual según rol ───────────────────────────────────────
  const esAdmin      = usuario?.rol === "admin";
  const items        = esAdmin ? MENU_ADMIN : MENU_ESTUDIANTE;
  const accentColor  = esAdmin ? COLOR.rojo : COLOR.naranja;
  const rolLabel     = esAdmin ? "Administrador" : "Estudiante";
  const menuLabel    = esAdmin ? "Módulos Administrativos" : "Mi Espacio Académico";
  const subtitulo    = esAdmin ? "Panel Admin" : "Aula Estudiante";
  const logoutRuta   = "/login";

  // ─── Cerrar sesión ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (cerrando) return;

    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: `Saldrás de tu sesión como ${rolLabel}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: accentColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Quedarme",
      background: "#fff",
      customClass: { popup: "rounded-2xl" },
    });

    if (!result.isConfirmed) return;

    try {
      setCerrando(true);
      await signOut(auth);
      // Borrar cookie de rol para que el middleware bloquee el acceso
      document.cookie = "rol=; path=/; max-age=0";
      await Swal.fire({
        icon: "success",
        title: "¡Hasta pronto!",
        text: "Sesión cerrada correctamente.",
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
        background: "#fff",
        customClass: { popup: "rounded-2xl" },
      });
      router.push(logoutRuta);
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cerrar la sesión. Intente de nuevo.",
        confirmButtonColor: accentColor,
        background: "#fff",
        customClass: { popup: "rounded-2xl" },
      });
    } finally {
      setCerrando(false);
    }
  };

  // ─── Estado de carga ──────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <aside
        className="sticky top-0 h-screen w-[280px] flex-shrink-0 flex items-center justify-center shadow-2xl"
        style={{ backgroundColor: COLOR.fondo }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </aside>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <aside
      className="sticky top-0 h-screen w-[280px] flex-shrink-0 flex flex-col z-50 shadow-2xl border-r border-white/5"
      style={{ backgroundColor: COLOR.fondo }}
    >
      {/* HEADER */}
      <div className="p-8 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none translate-x-10 -translate-y-10 rotate-45"
          style={{ backgroundColor: accentColor }}
        />
        <div className="relative w-full h-[50px] mb-4 brightness-0 invert">
          <Image src="/logo.png" alt="Logo" fill sizes="240px" className="object-contain object-left" priority />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-[3px] w-12" style={{ backgroundColor: accentColor }} />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
            Aula <span style={{ color: accentColor }}>{subtitulo.split(" ")[1]}</span>
          </p>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
        <p className="px-4 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
          {menuLabel}
        </p>

        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon   = it.icon;

          return (
            <Link key={it.href} href={it.href} className="block group">
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center justify-between px-4 py-3 transition-all duration-300 rounded-xl ${
                  active ? "bg-white/10 shadow-lg" : "hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-4 z-10">
                  <Icon
                    size={18}
                    style={{ color: active ? accentColor : "white" }}
                    className={`transition-all duration-300 ${
                      active ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-100"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      active ? "text-white" : "text-white/40 group-hover:text-white"
                    }`}
                  >
                    {it.label}
                  </span>
                </div>

                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute right-0 w-1.5 h-6 rounded-l-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
                {!active && (
                  <ChevronRight
                    size={14}
                    className="text-white/0 group-hover:text-white/20 transition-all transform group-hover:translate-x-1"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* PIE — PERFIL + LOGOUT */}
      <div className="mt-auto p-6 bg-black/30 border-t border-white/5">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
            <CircleUser size={22} className="text-stone-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-white leading-none tracking-tight truncate">
              {usuario?.nombre || usuario?.email || "Usuario"}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">
                Rol: {rolLabel}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={cerrando}
          className="flex w-full items-center justify-center gap-3 px-4 py-4 text-white font-black rounded-xl transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50 group/btn border border-white/10 hover:border-transparent"
          style={{ backgroundColor: cerrando ? "transparent" : accentColor }}
        >
          <LogOut
            size={16}
            className={cerrando ? "animate-spin" : "group-hover/btn:-translate-x-1 transition-transform"}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {cerrando ? "Cerrando..." : "Cerrar Sesión"}
          </span>
        </button>
      </div>
    </aside>
  );
}