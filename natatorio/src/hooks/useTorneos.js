import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Se suscribe en vivo a la colección "torneos", ordenados por fecha
// (el más reciente primero). onlyActive=true filtra solo los que siguen
// abiertos para inscripción (usado al registrar tiempos); la pantalla de
// Torneos usa onlyActive=false para mostrarlos todos, incluidos los ya
// finalizados.
export function useTorneos({ onlyActive = false } = {}) {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "torneos");
    const q = onlyActive
      ? query(base, where("activo", "==", true), orderBy("fecha", "desc"))
      : query(base, orderBy("fecha", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setTorneos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [onlyActive]);

  return { torneos, loading };
}
