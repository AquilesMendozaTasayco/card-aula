import { NextResponse } from "next/server";

const RUTA_LOGIN = "/admin/login";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const rol = request.cookies.get("rol")?.value;

  if (pathname === RUTA_LOGIN) {
    if (rol === "admin")      return NextResponse.redirect(new URL("/admin/dashboard",      request.url));
    if (rol === "estudiante") return NextResponse.redirect(new URL("/estudiante/dashboard", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!rol)            return NextResponse.redirect(new URL(RUTA_LOGIN,              request.url));
    if (rol !== "admin") return NextResponse.redirect(new URL("/estudiante/dashboard", request.url));
  }

  if (pathname.startsWith("/estudiante")) {
    if (!rol)                 return NextResponse.redirect(new URL(RUTA_LOGIN,         request.url));
    if (rol !== "estudiante") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/estudiante/:path*"],
};