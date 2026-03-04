// lib/hooks/useProyectos.js
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useProyectos(filtroEstado = null) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        let q = query(
          collection(db, "proyectos"),
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (filtroEstado) data = data.filter(p => p.estado === filtroEstado);
        setProyectos(data);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filtroEstado]);

  return { proyectos, loading, error };
}