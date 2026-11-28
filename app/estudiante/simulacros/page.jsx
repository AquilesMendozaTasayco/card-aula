"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Clock, FileText, ArrowRight, Trophy } from "lucide-react";
import Swal from "sweetalert2";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { listarSimulacros, listarMisIntentos, listarPreguntas } from "@/lib/simulacros";

const COLOR = { rojo: "#EF3340", naranja: "#D65B2B", marron: "#8B4513" };
const POR_PAG = 9;

function Panel() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [nombre, setNombre] = useState("");
  const [sims, setSims] = useState([]);
  const [intentos, setIntentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [fArea, setFArea] = useState("");
  const [pagina, setPagina] = useState(1);
  const [verIntento, setVerIntento] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        setNombre(snap.exists() ? (snap.data().nombre || user.email) : (user.email || ""));
      } catch { setNombre(user.email || ""); }
      try {
        const [all, ins, banco] = await Promise.all([
          listarSimulacros(), listarMisIntentos(user.uid), listarPreguntas(),
        ]);
        const conN = all.map((s) => {
          let n = (s.preguntasIds || []).length;
          if (s.modo !== "manual") {
            n = banco.filter((p) =>
              (!s.curso || p.curso === s.curso) &&
              (!s.tema || (p.tema || "").toLowerCase().includes((s.tema || "").toLowerCase())) &&
              (!s.dificultad || p.dificultad === s.dificultad)
            ).length;
            n = Math.min(s.cantidad || n, n);
          }
          return { ...s, n };
        });
        setSims(conN);
        setIntentos(ins);
      } catch {
        Swal.fire({ icon: "error", title: "Sin conexión", text: "No se pudieron cargar los simulacros." });
      } finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const areas = useMemo(() => [...new Set(sims.map((s) => s.curso).filter(Boolean))], [sims]);
  const filtrados = useMemo(() => sims.filter((s) => {
    if (busca && !`${s.titulo} ${s.descripcion} ${s.curso}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fArea && s.curso !== fArea) return false;
    return true;
  }), [sims, busca, fArea]);
  const totalPags = Math.max(1, Math.ceil(filtrados.length / POR_PAG));
  const pag = Math.min(pagina, totalPags);
  const visibles = filtrados.slice((pag - 1) * POR_PAG, pag * POR_PAG);

  const usadosPorSim = useMemo(() => {
    const m = {};
    intentos.forEach((it) => { m[it.simulacroId] = (m[it.simulacroId] || 0) + 1; });
    return m;
  }, [intentos]);

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-b border-stone-200 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: COLOR.rojo }} />
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
              Mis <span style={{ color: COLOR.rojo }}>Simulacros</span>
            </h1>
          </div>
          <p className="text-sm text-stone-400 ml-4">
            {loading ? "Cargando…" : `${filtrados.length} disponibles · ${intentos.length} intentos registrados`}
            {nombre ? ` · ${nombre}` : ""}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar simulacro..."
              className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-400" />
          </div>
          <select value={fArea} onChange={(e) => { setFArea(e.target.value); setPagina(1); }}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none">
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
              <div className="h-4 w-24 rounded bg-stone-200" />
              <div className="mt-3 h-5 rounded bg-stone-200 w-4/5" />
              <div className="mt-5 h-11 rounded-lg bg-stone-100" />
            </div>
          ))}
          {!loading && visibles.map((s, idx) => {
            const usados = usadosPorSim[s.id] || 0;
            const sinIntentos = s.intentosMax > 0 && usados >= s.intentosMax;
            return (
              <motion.article key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col hover:border-stone-300 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide">
                  <span style={{ color: COLOR.rojo }}>{s.modo === "manual" ? "Selección dirigida" : [s.curso, s.dificultad].filter(Boolean).join(" · ") || "Banco general"}</span>
                  <span className="text-stone-400 font-bold normal-case">{s.tiempoMin} min</span>
                </div>
                <h2 className="mt-2 text-[17px] font-black text-slate-900 leading-snug">{s.titulo}</h2>
                {s.descripcion
                  ? <p className="mt-1 text-[13px] text-stone-500 leading-relaxed line-clamp-2">{s.descripcion}</p>
                  : <p className="mt-1 text-[13px] text-stone-400">Preguntas tomadas del banco según etiquetas.</p>}
                <div className="mt-3 flex items-center gap-4 text-xs font-bold text-stone-500">
                  <span className="inline-flex items-center gap-1.5"><FileText size={13} /> {s.n} preguntas</span>
                  <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {s.tiempoMin} min</span>
                  {s.intentosMax > 0 && <span className="ml-auto tabular-nums">{usados}/{s.intentosMax}</span>}
                </div>
                {sinIntentos ? (
                  <p className="mt-5 flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-stone-400">
                    Sin intentos disponibles
                  </p>
                ) : (
                  <button onClick={() => router.push(`/estudiante/simulacros/${s.id}`)}
                    className="cursor-pointer mt-5 w-full rounded-lg py-3 text-[13px] font-black uppercase text-white flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-[0.99]"
                    style={{ backgroundColor: COLOR.rojo }}>
                    Iniciar ahora <ArrowRight size={15} />
                  </button>
                )}
              </motion.article>
            );
          })}
        </div>
        {!loading && visibles.length === 0 && (
          <div className="mt-4 bg-white border border-stone-200 rounded-xl p-8 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">Sin simulacros para mostrar</p>
          </div>
        )}
        {!loading && totalPags > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-stone-500">
            <span>Mostrando {(pag - 1) * POR_PAG + 1}–{(pag - 1) * POR_PAG + visibles.length} de {filtrados.length}</span>
            <div className="flex items-center gap-1.5">
              <button disabled={pag === 1} onClick={() => setPagina(pag - 1)} className="cursor-pointer w-9 h-9 rounded-lg border border-stone-200 bg-white font-bold disabled:opacity-30 hover:bg-stone-100">‹</button>
              {Array.from({ length: totalPags }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPagina(n)} className={`cursor-pointer w-9 h-9 rounded-lg border text-[13px] font-bold ${n === pag ? "bg-slate-900 text-white border-slate-900" : "border-stone-200 bg-white hover:bg-stone-100"}`}>{n}</button>
              ))}
              <button disabled={pag === totalPags} onClick={() => setPagina(pag + 1)} className="cursor-pointer w-9 h-9 rounded-lg border border-stone-200 bg-white font-bold disabled:opacity-30 hover:bg-stone-100">›</button>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
            <Trophy size={15} style={{ color: COLOR.naranja }} />
            <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-700">Mis resultados</h2>
            <span className="ml-auto text-xs text-stone-400">{intentos.length}</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse"><div className="h-4 rounded bg-stone-100" /><div className="h-4 rounded bg-stone-100 w-2/3" /></div>
          ) : intentos.length === 0 ? (
            <p className="px-5 py-5 text-sm text-stone-400">Todavía no rindes ningún simulacro. Tu puntaje aparecerá aquí.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {intentos.map((it) => {
                const pc = it.total ? Math.round((it.puntaje / it.total) * 100) : 0;
                return (
                  <li key={it.id} className="px-5 py-3.5 flex items-center gap-4">
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${pc >= 70 ? "bg-green-50 text-green-700 border border-green-200" : pc >= 40 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      {it.puntaje}/{it.total}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{it.simulacro}</p>
                      <p className="text-xs text-stone-400">{it.createdAt?.toMillis ? new Date(it.createdAt.toMillis()).toLocaleString() : ""} · {pc}%</p>
                    </div>
                    <button onClick={() => setVerIntento(it)} className="cursor-pointer shrink-0 rounded-lg border border-stone-200 px-4 py-2 text-xs font-black text-stone-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition">Ver detalle</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {verIntento && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70" onClick={() => setVerIntento(null)}>
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-stone-100 sticky top-0 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Detalle del intento</p>
              <h3 className="font-black text-slate-900">{verIntento.simulacro} · {verIntento.puntaje}/{verIntento.total}</h3>
              <p className="text-xs text-stone-400">{verIntento.createdAt?.toMillis ? new Date(verIntento.createdAt.toMillis()).toLocaleString() : ""}</p>
            </div>
            <div className="p-6 space-y-3">
              {(verIntento.detalle || []).length === 0 && (
                <p className="text-sm text-stone-400 bg-stone-50 border rounded-xl p-4">Intento antiguo sin detalle por pregunta.</p>
              )}
              {(verIntento.detalle || []).map((d, i) => (
                <div key={i} className={`border rounded-2xl p-4 ${d.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <p className="text-sm font-bold">{i + 1}. {d.enunciado} {d.ok ? "✅" : "❌"}</p>
                  <div className="mt-2 text-xs space-y-1">
                    {(d.opciones || []).map((op, oi) => {
                      const esC = (d.correctas || []).includes(oi);
                      const laE = (d.elegidas || []).includes(oi);
                      return (
                        <p key={oi} className={esC ? "font-bold text-green-700" : laE ? "text-red-600 line-through" : "text-stone-500"}>
                          {String.fromCharCode(65 + oi)}. {op} {esC ? "✓" : ""}
                        </p>
                      );
                    })}
                  </div>
                  {d.explicacion && <p className="mt-2 text-xs text-stone-500 italic">{d.explicacion}</p>}
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setVerIntento(null)} className="cursor-pointer w-full py-3.5 text-xs font-black uppercase text-white" style={{ backgroundColor: COLOR.rojo }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() { return <Suspense><Panel /></Suspense>; }
