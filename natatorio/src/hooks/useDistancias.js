import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Igual que useEstilos, pero para la colección "distancias".
// Cada documento tiene { value: number (metros), active: boolean }.
// Se ordenan numéricamente de menor a mayor (no hace falta un campo "order" manual).
export function useDistancias({ onlyActive = true } = {}) {
  const [distancias, setDistancias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "distancias");
    const q = onlyActive
      ? query(base, where("active", "==", true), orderBy("value", "asc"))
      : query(base, orderBy("value", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setDistancias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [onlyActive]);

  return { distancias, loading };
}
