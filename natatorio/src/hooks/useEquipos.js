import { useEffect, useState } from "react";
import { collection, orderBy, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Se suscribe a los equipos de una posta puntual.
export function useEquipos(postaId) {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(!!postaId);

  useEffect(() => {
    if (!postaId) {
      setEquipos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "postas", postaId, "equipos"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEquipos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [postaId]);

  return { equipos, loading };
}
