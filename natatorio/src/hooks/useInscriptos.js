import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Se suscribe a la subcolección de inscriptos de un torneo o una posta
// puntual (comparten exactamente el mismo patrón: "inscripciones" con id =
// uid del atleta). Devuelve [] mientras docId sea null/"" (nada seleccionado).
export function useInscriptos(coleccion, docId) {
  const [inscriptos, setInscriptos] = useState([]);
  const [loading, setLoading] = useState(!!docId);

  useEffect(() => {
    if (!docId) {
      setInscriptos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(collection(db, coleccion, docId, "inscripciones"), (snap) => {
      setInscriptos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [coleccion, docId]);

  return { inscriptos, loading };
}
