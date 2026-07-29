import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Se suscribe a la subcolección de inscriptos de un torneo puntual.
// Devuelve [] mientras torneoId sea null/"" (no hay torneo seleccionado).
export function useInscriptos(torneoId) {
  const [inscriptos, setInscriptos] = useState([]);
  const [loading, setLoading] = useState(!!torneoId);

  useEffect(() => {
    if (!torneoId) {
      setInscriptos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(collection(db, "torneos", torneoId, "inscripciones"), (snap) => {
      setInscriptos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [torneoId]);

  return { inscriptos, loading };
}
