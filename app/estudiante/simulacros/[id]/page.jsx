"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { obtenerSimulacro, resolverPreguntas, guardarIntento, contarIntentos } from "@/lib/simulacros";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B" };

function Player() {
  const { id } = useParams();
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [nombre, setNombre] = useState("");
  const [sim, setSim] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [resp, setResp] = useState({});
  const [seg, setSeg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fin, setFin] = useState(null);
  const [entregando, setEntregando] = useState(false);
  const [hechos, setHechos] = useState(0);
  const [pasoHero, setPasoHero] = useState(false);
  const entregandoRef = useRef(false);

  useEffect(() => {
    const alScroll = () => setPasoHero(window.scrollY > 320);
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        setNombre(snap.exists() ? (snap.data().nombre || user.email) : (user.email || ""));
      } catch { setNombre(user.email || ""); }
      try {
        const s = await obtenerSimulacro(id);
        if (!s || s.activo === false) {
          await Swal.fire({ icon: "error", title: "No disponible" });
          router.push("/estudiante/simulacros");
          return;
        }
        if (s.intentosMax > 0) {
          const n = await contarIntentos(id, user.uid);
          setHechos(n);
          if (n >= s.intentosMax) {
            await Swal.fire({ icon: "warning", title: "Límite alcanzado", text: `Ya usaste tus ${s.intentosMax} intentos en este simulacro.` });
            router.push("/estudiante/simulacros");
            return;
          }
        }
        const ps = await resolverPreguntas(s);
        setSim(s); setPreguntas(ps); setSeg((s.tiempoMin || 30) * 60);
      } catch {
        Swal.fire({ icon: "error", title: "Sin conexión" });
      } finally { setLoading(false); }
    });
    return () => unsub();
  }, [id, router]);

  useEffect(() => {
    if (!seg || fin) return;
    const t = setInterval(() => setSeg((s) => {
      if (s <= 1) { clearInterval(t); entregar(true); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, fin]);

  const mmss = useMemo(() => {
    const m = Math.floor(seg / 60), s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [seg]);

  const marcar = (pi, oi) => {
    const p = preguntas[pi];
    if (p.tipo === "multiple") {
      const cur = resp[pi] || [];
      setResp({ ...resp, [pi]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] });
    } else {
      setResp({ ...resp, [pi]: [oi] });
    }
  };

  const volver = async () => {
    const r = await Swal.fire({
      icon: "question", title: "¿Volver a simulacros?",
      text: "Se perderá tu avance de este intento.",
      showCancelButton: true, confirmButtonText: "Sí, salir", cancelButtonText: "Seguir aquí",
      confirmButtonColor: COLOR.rojo,
    });
    if (r.isConfirmed) router.push("/estudiante/simulacros");
  };

  const entregar = async (auto = false) => {
    if (fin || entregandoRef.current) return;
    entregandoRef.current = true;
    setEntregando(true);
    let pts = 0, tot = 0;
    const det = preguntas.map((p, i) => {
      const ok = JSON.stringify([...(resp[i] || [])].sort()) === JSON.stringify([...(p.correctas || [])].sort());
      pts += ok ? (p.puntaje || 1) : 0;
      tot += (p.puntaje || 1);
      return ok;
    });
    try {
      await guardarIntento({
        registroId: uid, nombres: nombre,
        simulacroId: id, simulacroTitulo: sim.titulo,
        respuestas: resp, puntaje: pts, total: tot,
        detalle: preguntas.map((p, i) => ({
          enunciado: p.enunciado, opciones: p.opciones || [],
          correctas: p.correctas || [], elegidas: resp[i] || [],
          ok: det[i], explicacion: p.explicacion || "",
        })),
      });
    } catch {}
    setFin({ pts, tot, det, resp });
    if (auto) Swal.fire({ icon: "info", title: "Tiempo agotado", text: "Se entregó automáticamente." });
  };

  const respondidas = Object.keys(resp).length;
  const pctResp = Math.round((respondidas / Math.max(1, preguntas.length)) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
          <div className="h-10 rounded-2xl bg-white border" />
          <div className="h-44 rounded-3xl bg-gradient-to-r from-stone-200 to-stone-100 border" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border rounded-3xl p-6 space-y-3">
              <div className="h-4 rounded bg-stone-200 w-3/4" />
              <div className="h-10 rounded-2xl bg-stone-100" />
              <div className="h-10 rounded-2xl bg-stone-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fin) {
    const pct = fin.tot ? Math.round((fin.pts / fin.tot) * 100) : 0;
    const mensaje = pct >= 70 ? "¡Buen trabajo!" : pct >= 40 ? "Vas bien, sigue practicando." : "Sigue intentando, tú puedes.";
    return (
      <div className="min-h-screen bg-stone-50 py-8 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white border-t-8 border-t-red-500 border border-stone-200 rounded-2xl p-6 md:p-8" style={{ borderTopColor: COLOR.rojo }}>
            <p className="text-[11px] font-bold tracking-[0.25em] text-stone-400 uppercase">{sim?.titulo}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Tu puntuación</h1>
            <p className="mt-3 text-4xl font-black tabular-nums">{fin.pts} <span className="text-lg text-stone-400 font-bold">de {fin.tot} puntos</span></p>
            <p className="mt-1 text-sm text-stone-500">{pct}% de acierto · {mensaje}</p>
            <div className="mt-4 h-2.5 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLOR.rojo }} />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => router.push("/estudiante/simulacros")} className="cursor-pointer flex-1 rounded-xl py-3 text-xs font-black uppercase text-white" style={{ backgroundColor: COLOR.rojo }}>
                Volver a simulacros
              </button>
              {!(sim?.intentosMax > 0 && hechos + 1 >= sim.intentosMax) && (
                <button onClick={() => window.location.reload()} className="cursor-pointer px-5 rounded-xl border border-stone-300 text-xs font-black uppercase text-stone-600 hover:bg-stone-100">Reintentar</button>
              )}
            </div>
            {sim?.intentosMax > 0 && hechos + 1 >= sim.intentosMax && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-black">!</span>
                <div>
                  <p className="text-[13px] font-black text-amber-900">Ya no tienes intentos disponibles</p>
                  <p className="text-xs text-amber-700/80">Usaste {sim.intentosMax} de {sim.intentosMax}.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {preguntas.map((p, i) => {
              const elegidas = fin.resp?.[i] || [];
              const ok = fin.det[i];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-[15px] text-slate-900">{p.enunciado}</p>
                    <span className={`shrink-0 text-xs font-black tabular-nums px-2 py-1 rounded-lg ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {ok ? (p.puntaje || 1) : 0}/{p.puntaje || 1}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {(p.opciones || []).map((op, oi) => {
                      const esC = (p.correctas || []).includes(oi);
                      const laE = elegidas.includes(oi);
                      return (
                        <div key={oi} className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${esC ? "border-green-300 bg-green-50" : laE ? "border-red-300 bg-red-50" : "border-stone-100"}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${esC ? "bg-green-600 text-white" : laE ? "bg-red-500 text-white" : "bg-stone-100 text-stone-400"}`}>
                            {esC ? "✓" : laE ? "✕" : String.fromCharCode(65 + oi)}
                          </span>
                          <span className={esC ? "font-bold text-green-900" : laE ? "text-red-700" : "text-stone-500"}>{op}</span>
                          {esC && <span className="ml-auto text-[11px] font-black text-green-600 uppercase">Correcta</span>}
                        </div>
                      );
                    })}
                  </div>
                  {!ok && <p className="mt-2.5 text-xs text-stone-500">Correcta: <b className="text-green-700">{(p.correctas || []).map((c) => p.opciones[c]).join(" · ")}</b></p>}
                  {p.explicacion && <p className="mt-1.5 text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2">{p.explicacion}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className={`fixed top-0 inset-x-0 z-30 transition-transform duration-300 ${pasoHero && !fin ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="bg-white border-b-2" style={{ borderColor: COLOR.rojo }}>
          <div className="mx-auto max-w-3xl px-6 py-2.5">
            <div className="flex items-center gap-2">
              <p className="font-black text-[13px] text-slate-800 truncate">{sim?.titulo}</p>
              <span className="ml-auto text-xs text-stone-400 tabular-nums shrink-0">{respondidas}/{preguntas.length}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-black tabular-nums text-white shrink-0 ${seg < 300 ? "bg-red-600 animate-pulse" : ""}`} style={seg < 300 ? {} : { backgroundColor: COLOR.rojo }}>
                ⏱ {mmss}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pctResp}%`, backgroundColor: COLOR.rojo }} />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white border-b" style={{ borderColor: "#e7e5e4" }}>
        <div className="mx-auto max-w-3xl px-6 pt-5 pb-5">
          <button onClick={volver} className="cursor-pointer text-xs font-bold text-stone-400 hover:text-stone-700 transition">← Volver a simulacros</button>
          <div className="mt-2">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: COLOR.rojo }}>
              {sim?.modo === "manual" ? "Selección dirigida" : [sim?.curso, sim?.dificultad].filter(Boolean).join(" · ") || "Banco general"}
            </p>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{sim?.titulo}</h1>
            {sim?.descripcion && <p className="mt-0.5 text-[13px] text-stone-500 line-clamp-2">{sim.descripcion}</p>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-lg bg-stone-100 px-2.5 py-1.5 font-bold text-stone-600">{preguntas.length} preguntas</span>
            <span className="inline-flex items-center rounded-lg bg-stone-100 px-2.5 py-1.5 font-bold text-stone-600">{sim?.tiempoMin} minutos</span>
            <span className="inline-flex items-center rounded-lg bg-stone-100 px-2.5 py-1.5 font-bold text-stone-600">{respondidas}/{preguntas.length} respondidas</span>
            <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-black tabular-nums text-white ${seg < 300 ? "bg-red-600 animate-pulse" : ""}`} style={seg < 300 ? {} : { backgroundColor: COLOR.rojo }}>
              ⏱ {mmss}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pctResp}%`, backgroundColor: COLOR.rojo }} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 py-6 space-y-4">
        {preguntas.map((p, i) => {
          const contestada = (resp[i] || []).length > 0;
          return (
            <article key={p.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition ${contestada ? "border-red-200" : "border-stone-200"}`}>
              <div className="px-5 pt-4 flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${contestada ? "text-white" : "bg-stone-100 text-stone-500"}`} style={contestada ? { backgroundColor: COLOR.rojo } : {}}>
                  {i + 1}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{p.tipo === "multiple" ? "Varias respuestas" : p.tipo === "vf" ? "Verdadero / Falso" : "Una respuesta"}</span>
                <span className="ml-auto text-[11px] font-black text-stone-400 tabular-nums">{p.puntaje || 1} pts</span>
              </div>
              <p className="px-5 mt-1.5 text-[15px] font-bold text-slate-900 leading-snug">{p.enunciado}</p>
              <div className="px-5 pb-5 pt-3 space-y-2">
                {(p.opciones || []).map((op, oi) => {
                  const sel = (resp[i] || []).includes(oi);
                  return (
                    <button key={oi} type="button" onClick={() => marcar(i, oi)}
                      className={`cursor-pointer w-full text-left rounded-xl border px-3.5 py-3 text-sm transition flex items-center gap-3 ${sel ? "bg-red-50 shadow-sm" : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"}`}
                      style={sel ? { borderColor: COLOR.rojo } : {}}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition ${sel ? "text-white" : "bg-stone-100 text-stone-500"}`} style={sel ? { backgroundColor: COLOR.rojo } : {}}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className={sel ? "font-bold text-slate-900" : "text-stone-600"}>{op}</span>
                      {p.tipo === "multiple" && (
                        <span className={`ml-auto w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 text-xs ${sel ? "text-white" : "border-stone-300"}`} style={sel ? { borderColor: COLOR.rojo, backgroundColor: COLOR.rojo } : {}}>{sel ? "✓" : ""}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}

        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-stone-500">Respondidas <b className="text-slate-900 tabular-nums">{respondidas}/{preguntas.length}</b>{respondidas < preguntas.length && <span> · te faltan {preguntas.length - respondidas}</span>}</p>
          <button onClick={() => entregar(false)} disabled={entregando} className="cursor-pointer mt-3 w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ backgroundColor: COLOR.rojo }}>
            {entregando && (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} className="opacity-25" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
              </svg>
            )}
            {entregando ? "Entregando..." : "Entregar examen"}
          </button>
          <p className="mt-2 text-xs text-stone-400">Al entregar no podrás cambiar tus respuestas.</p>
        </div>
      </main>
    </div>
  );
}

export default function Page() { return <Suspense><Player /></Suspense>; }
