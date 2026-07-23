import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge } from "react-bootstrap";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { ESTILOS, DISTANCIAS, estiloLabel, formatTime } from "../theme";
import TopBar from "../components/TopBar";

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = () => {
    if (running) return;
    startRef.current = Date.now() - elapsed;
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  const reset = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setElapsed(0);
  };
  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);
  return { elapsed, running, start, stop, reset };
}

export default function ProfesorDashboard() {
  const { user, profile } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [athleteId, setAthleteId] = useState("");
  const [estilo, setEstilo] = useState("libre");
  const [distancia, setDistancia] = useState(50);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState(false);
  const sw = useStopwatch();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "atleta"));
    const unsub = onSnapshot(q, (snap) => {
      setAthletes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!athleteId && athletes.length) setAthleteId(athletes[0].id);
  }, [athletes]); // eslint-disable-line

  useEffect(() => {
    const q = query(
      collection(db, "times"),
      where("recordedBy", "==", user.uid),
      orderBy("date", "desc"),
      limit(8)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecent(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  const athlete = athletes.find((a) => a.id === athleteId);

  const handleSave = async () => {
    if (!athleteId || sw.elapsed === 0) return;
    await addDoc(collection(db, "times"), {
      athleteId,
      estilo,
      distancia,
      timeMs: Math.round(sw.elapsed),
      date: new Date().toISOString(),
      recordedBy: user.uid,
      createdAt: serverTimestamp(),
    });
    setSaved(true);
    sw.reset();
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-vh-100 swim-safe-bottom">
      <TopBar title="Registro de tiempos" subtitle={`Hola, ${profile?.fullName || ""}`} />
      <Container fluid="lg">
        {/* Fila 1: selección (arriba en mobile, columna izquierda en desktop) + cronómetro (columna derecha en desktop) */}
        <Row className="g-3">
          <Col xs={12} lg={7}>
            <Card className="swim-card mb-3">
              <Card.Body>
                <Form.Label className="small text-swim-muted text-uppercase fw-bold">Participante</Form.Label>
                <Form.Select value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
                  {athletes.length === 0 && <option value="">Todavía no hay atletas registrados</option>}
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName}
                    </option>
                  ))}
                </Form.Select>
              </Card.Body>
            </Card>

            <Card className="swim-card">
              <Card.Body>
                <Form.Label className="small text-swim-muted text-uppercase fw-bold d-block mb-2">Estilo</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {ESTILOS.map((e) => (
                    <Button
                      key={e.id}
                      className="rounded-pill swim-tap-chip"
                      variant={estilo === e.id ? "info" : "outline-secondary"}
                      onClick={() => setEstilo(e.id)}
                    >
                      {e.label}
                    </Button>
                  ))}
                </div>
                <Form.Label className="small text-swim-muted text-uppercase fw-bold d-block mb-2">Distancia</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {DISTANCIAS.map((d) => (
                    <Button
                      key={d}
                      className="rounded-pill swim-tap-chip"
                      variant={distancia === d ? "warning" : "outline-secondary"}
                      onClick={() => setDistancia(d)}
                    >
                      {d} m
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={5} className="mt-3 mt-lg-0">
            <div className={`swim-timer p-4 text-center mb-3 ${sw.running ? "running" : ""}`}>
              <div className="font-mono text-swim-muted small mb-1">
                {athlete ? athlete.fullName.toUpperCase() : "SELECCIONA UN ATLETA"} · {estiloLabel(estilo).toUpperCase()} · {distancia} M
              </div>
              <div className={`swim-timer-value ${sw.running ? "text-swim-cyan" : "text-white"}`}>
                {formatTime(sw.elapsed)}
              </div>
              <Badge bg={sw.running ? "info" : "secondary"} className="text-dark mt-2">
                {sw.running ? "● EN CURSO" : sw.elapsed > 0 ? "■ DETENIDO" : "○ LISTO"}
              </Badge>
            </div>

            <Row className="g-2 mb-2">
              <Col xs={6}>
                <div className="d-grid">
                  <Button
                    className={sw.running ? "" : "btn-swim-cyan"}
                    variant={sw.running ? "danger" : undefined}
                    size="lg"
                    onClick={sw.running ? sw.stop : sw.start}
                  >
                    {sw.running ? "Detener" : "Iniciar"}
                  </Button>
                </div>
              </Col>
              <Col xs={6}>
                <div className="d-grid">
                  <Button
                    className="btn-swim-outline border"
                    size="lg"
                    disabled={sw.running}
                    onClick={sw.reset}
                  >
                    Reiniciar
                  </Button>
                </div>
              </Col>
            </Row>

            <div className="d-grid">
              <Button
                className="btn-swim-gold"
                size="lg"
                disabled={!athleteId || sw.elapsed === 0 || sw.running}
                onClick={handleSave}
              >
                {saved ? "✓ Tiempo guardado" : "Guardar tiempo"}
              </Button>
            </div>
          </Col>
        </Row>

        {/* Fila 2: historial reciente, siempre debajo, en mobile y en desktop */}
        <Row className="g-3 mt-1">
          <Col xs={12}>
            <Card className="swim-card">
              <Card.Body>
                <Form.Label className="small text-swim-muted text-uppercase fw-bold d-block mb-2">
                  Últimos registros
                </Form.Label>
                {recent.length === 0 ? (
                  <div className="small text-swim-muted">Todavía no hay tiempos guardados.</div>
                ) : (
                  <ListGroup variant="flush">
                    {recent.map((t) => {
                      const a = athletes.find((x) => x.id === t.athleteId);
                      return (
                        <ListGroup.Item
                          key={t.id}
                          className="d-flex justify-content-between align-items-center px-0"
                          style={{ background: "transparent", borderColor: "var(--swim-border)" }}
                        >
                          <div className="small">
                            <span className="fw-semibold">{a?.fullName || "—"}</span>{" "}
                            <span className="text-swim-muted">
                              · {estiloLabel(t.estilo)} · {t.distancia} m
                            </span>
                          </div>
                          <span className="font-mono text-swim-cyan">{formatTime(t.timeMs)}</span>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
