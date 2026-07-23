import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Container, Row, Col, Card, Table } from "react-bootstrap";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { estiloLabel, formatTime, formatDate } from "../theme";
import TopBar from "../components/TopBar";

export default function AtletaDashboard() {
  const { user, profile } = useAuth();
  const [times, setTimes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "times"),
      where("athleteId", "==", user.uid),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTimes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  const bestByKey = {};
  times.forEach((t) => {
    const key = `${t.estilo}-${t.distancia}`;
    if (!bestByKey[key] || t.timeMs < bestByKey[key].timeMs) bestByKey[key] = t;
  });
  const bests = Object.values(bestByKey).sort((a, b) => {
    if (a.estilo !== b.estilo) return a.estilo.localeCompare(b.estilo);
    return a.distancia - b.distancia;
  });

  return (
    <div className="min-vh-100 swim-safe-bottom">
      <TopBar title="Mi rendimiento" subtitle={`Hola, ${profile?.fullName || ""}`} />
      <Container fluid="lg">
        <div className="small text-swim-muted text-uppercase fw-bold mb-2">Mejores tiempos</div>

        {bests.length === 0 ? (
          <Card className="swim-card mb-4">
            <Card.Body className="small text-swim-muted">
              Todavía no tienes marcas registradas. Tu profesor puede cargarlas desde su panel.
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-2 g-sm-3 mb-4">
            {bests.map((t) => (
              <Col key={`${t.estilo}-${t.distancia}`} xs={6} md={4} lg={3}>
                <Card className="swim-record-card h-100">
                  <Card.Body className="p-3">
                    <div className="font-mono text-swim-gold" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                      RÉCORD
                    </div>
                    <div className="fw-bold mt-1" style={{ fontSize: "0.8rem" }}>
                      {estiloLabel(t.estilo)} · {t.distancia} m
                    </div>
                    <div
                      className="font-mono fw-bold text-swim-gold mt-1"
                      style={{ fontSize: "clamp(1.3rem, 6vw, 1.9rem)" }}
                    >
                      {formatTime(t.timeMs)}
                    </div>
                    <div className="text-swim-muted" style={{ fontSize: "0.7rem" }}>
                      {formatDate(t.date)}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <div className="small text-swim-muted text-uppercase fw-bold mb-2">Historial de tiempos</div>
        <Card className="swim-card">
          <Card.Body>
            {times.length === 0 ? (
              <div className="small text-swim-muted">No hay tiempos en el historial todavía.</div>
            ) : (
              <div className="table-responsive">
                <Table className="swim-table align-middle mb-0" borderless>
                  <thead>
                    <tr className="text-swim-muted" style={{ fontSize: "0.75rem" }}>
                      <th>ESTILO</th>
                      <th>DISTANCIA</th>
                      <th>TIEMPO</th>
                      <th>FECHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {times.map((t) => (
                      <tr key={t.id}>
                        <td>{estiloLabel(t.estilo)}</td>
                        <td className="text-swim-muted">{t.distancia} m</td>
                        <td className="font-mono text-swim-cyan">{formatTime(t.timeMs)}</td>
                        <td className="text-swim-muted">{formatDate(t.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
