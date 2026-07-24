import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Se suscribe en vivo a la colección "estilos" (solo los activos), ordenados
// por el campo "order". Cualquier cambio hecho desde la pantalla de
// administración se refleja al instante en el formulario del profesor.
export function useEstilos({ onlyActive = true } = {}) {
  const [estilos, setEstilos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "estilos");
    const q = onlyActive
      ? query(base, where("active", "==", true), orderBy("order", "asc"))
      : query(base, orderBy("order", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setEstilos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [onlyActive]);

  return { estilos, loading };
}
