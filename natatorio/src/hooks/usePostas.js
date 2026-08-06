import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Igual que useTorneos: onlyActive=true filtra solo las postas abiertas
// (usado al registrar tiempos); la pantalla de Postas usa onlyActive=false
// para mostrarlas todas, incluidas las finalizadas.
export function usePostas({ onlyActive = false } = {}) {
  const [postas, setPostas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "postas");
    const q = onlyActive
      ? query(base, where("activo", "==", true), orderBy("fecha", "desc"))
      : query(base, orderBy("fecha", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setPostas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [onlyActive]);

  return { postas, loading };
}
