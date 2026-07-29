import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Card, ListGroup, Badge } from "react-bootstrap";
import { db } from "../firebase";
import { formatTime, formatDate, MEDALLAS } from "../theme";

// Si se pasa athleteId, filtra el top 10 solo de ese atleta.
// Si no, muestra el top 10 entre TODOS los participantes (y el nombre de cada uno).
// torneoFilter: undefined = todos los contextos (general); null = solo práctica;
// string = solo ese torneo puntual.
export default function TopList({ estiloId, estiloLabel, distancia, athleteId, showAthleteName, torneoFilter }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const clauses = [where("estilo", "==", estiloId), where("distancia", "==", distancia)];
    if (athleteId) clauses.push(where("athleteId", "==", athleteId));
    if (torneoFilter !== undefined) clauses.push(where("torneoId", "==", torneoFilter));
    const q = query(collection(db, "times"), ...clauses, orderBy("timeMs", "asc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [estiloId, distancia, athleteId, torneoFilter]);

  return (
    <Card className="swim-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-bold">{estiloLabel}</div>
          <Badge bg={null} className="font-mono badge-swim-neutral">
            {distancia} m
          </Badge>
        </div>
        {loading ? (
          <div className="small text-swim-muted">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="small text-swim-muted">Todavía no hay tiempos registrados.</div>
        ) : (
          <ListGroup variant="flush">
            {rows.map((t, i) => (
              <ListGroup.Item
                key={t.id}
                className="d-flex justify-content-between align-items-center px-0"
                style={{ background: "transparent", borderColor: "var(--swim-border)" }}
              >
                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                  <span className="font-mono text-swim-muted" style={{ width: 24, flexShrink: 0 }}>
                    {MEDALLAS[i] || `${i + 1}.`}
                  </span>
                  {showAthleteName ? (
                    <span className="small text-truncate">{t.athleteName || "—"}</span>
                  ) : (
                    <span className="small text-swim-muted">{formatDate(t.date)}</span>
                  )}
                  {torneoFilter === undefined && (
                    <span className="text-swim-muted text-truncate" style={{ fontSize: "0.7rem" }}>
                      · {t.torneoNombre || "Práctica"}
                    </span>
                  )}
                </div>
                <span className="font-mono text-swim-cyan flex-shrink-0 ms-2">{formatTime(t.timeMs)}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
