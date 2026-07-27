import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useEstilos } from "../hooks/useEstilos";
import { useDistancias } from "../hooks/useDistancias";
import { formatTime } from "../theme";
import PageHeader from "../components/PageHeader";
import QuickActionBar from "../components/QuickActionBar";

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
  const { estilos, loading: loadingEstilos } = useEstilos();
  const { distancias, loading: loadingDistancias } = useDistancias();
  const [athletes, setAthletes] = useState([]);
  const [athleteId, setAthleteId] = useState("");
  const [estiloId, setEstiloId] = useState("");
  const [distancia, setDistancia] = useState(null);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState(false);
  const [recordBanner, setRecordBanner] = useState(null);
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
    if (!estiloId && estilos.length) setEstiloId(estilos[0].id);
  }, [estilos]); // eslint-disable-line

  useEffect(() => {
    if (distancia === null && distancias.length) setDistancia(distancias[0].value);
  }, [distancias]); // eslint-disable-line

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
  const estilo = estilos.find((e) => e.id === estiloId);

  const handleSave = async () => {
    if (!athleteId || !estiloId || !distancia || sw.elapsed === 0) return;
    const timeMs = Math.round(sw.elapsed);

    // Busca la mejor marca previa del atleta para este estilo/distancia,
    // para saber si el tiempo que se está por guardar es un nuevo récord.
    let previousBestMs = null;
    try {
      const bestQ = query(
        collection(db, "times"),
        where("athleteId", "==", athleteId),
        where("estilo", "==", estiloId),
        where("distancia", "==", distancia),
        orderBy("timeMs", "asc"),
        limit(1)
      );
      const bestSnap = await getDocs(bestQ);
      if (!bestSnap.empty) previousBestMs = bestSnap.docs[0].data().timeMs;
    } catch (err) {
      previousBestMs = null; // si falla la consulta (p. ej. falta el índice), simplemente no se marca como récord
    }

    const isNewRecord = previousBestMs !== null && timeMs < previousBestMs;

    await addDoc(collection(db, "times"), {
      athleteId,
      athleteName: athlete?.fullName || "",
      estilo: estiloId,
      estiloLabel: estilo?.label || "",
      distancia,
      timeMs,
      date: new Date().toISOString(),
      recordedBy: user.uid,
      isRecord: isNewRecord,
      createdAt: serverTimestamp(),
    });

    if (isNewRecord) {
      const message = `¡Nuevo récord personal en ${estilo?.label} ${distancia} m: ${formatTime(timeMs)}!`;
      setRecordBanner(`🏆 ${athlete?.fullName}: ${message}`);
      try {
        await addDoc(collection(db, "notifications"), {
          userId: athleteId,
          type: "record",
          message,
          estilo: estiloId,
          estiloLabel: estilo?.label || "",
          distancia,
          timeMs,
          read: false,
          createdAtIso: new Date().toISOString(),
        });
      } catch (err) {
        // si falla la notificación, el tiempo ya quedó guardado igual
      }
      setTimeout(() => setRecordBanner(null), 6000);
    }

    setSaved(true);
    sw.reset();
    setTimeout(() => setSaved(false), 1800);
  };

  const handleDelete = async (timeId) => {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDoc(doc(db, "times", timeId));
    } catch (err) {
      window.alert("No se pudo eliminar el registro.");
    }
  };

  const canSave = !!athleteId && !!estiloId && !!distancia && sw.elapsed > 0 && !sw.running;

  return (
    <div className="min-vh-100">
      <PageHeader title="Registro de tiempos" subtitle={`Hola, ${profile?.fullName || ""}`} />
      {/* padding-bottom para que el contenido no quede tapado por la barra fija de abajo */}
      <Container fluid="lg" style={{ paddingBottom: "6.5rem" }}>
        {recordBanner && (
          <Alert variant="warning" className="fw-bold" onClose={() => setRecordBanner(null)} dismissible>
            {recordBanner}
          </Alert>
        )}
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="small text-swim-muted text-uppercase fw-bold m-0">Estilo</Form.Label>
                  <Link to="/configuracion" className="text-swim-cyan" style={{ fontSize: "0.75rem" }}>
                    Configuración
                  </Link>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {loadingEstilos && <span className="small text-swim-muted">Cargando estilos…</span>}
                  {!loadingEstilos && estilos.length === 0 && (
                    <span className="small text-swim-muted">
                      No hay estilos activos. <Link to="/configuracion" className="text-swim-cyan">Cárgalos acá</Link>.
                    </span>
                  )}
                  {estilos.map((e) => (
                    <Button
                      key={e.id}
                      className="rounded-pill swim-tap-chip"
                      variant={estiloId === e.id ? "info" : "outline-secondary"}
                      onClick={() => setEstiloId(e.id)}
                    >
                      {e.label}
                    </Button>
                  ))}
                </div>
                <Form.Label className="small text-swim-muted text-uppercase fw-bold d-block mb-2">Distancia</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {loadingDistancias && <span className="small text-swim-muted">Cargando distancias…</span>}
                  {!loadingDistancias && distancias.length === 0 && (
                    <span className="small text-swim-muted">
                      No hay distancias activas. <Link to="/configuracion" className="text-swim-cyan">Cárgalas acá</Link>.
                    </span>
                  )}
                  {distancias.map((d) => (
                    <Button
                      key={d.id}
                      className="rounded-pill swim-tap-chip"
                      variant={distancia === d.value ? "warning" : "outline-secondary"}
                      onClick={() => setDistancia(d.value)}
                    >
                      {d.value} m
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={5} className="mt-3 mt-lg-0">
            <div className={`swim-timer p-4 text-center mb-3 ${sw.running ? "running" : ""}`}>
              <div className="font-mono text-swim-muted small mb-1">
                {athlete ? athlete.fullName.toUpperCase() : "SELECCIONA UN ATLETA"}
                {estilo ? ` · ${estilo.label.toUpperCase()}` : ""}{distancia ? ` · ${distancia} M` : ""}
              </div>
              <div className={`swim-timer-value ${sw.running ? "text-swim-cyan" : "text-white"}`}>
                {formatTime(sw.elapsed)}
              </div>
              <Badge
                bg={sw.running ? "info" : null}
                className={`mt-2 ${sw.running ? "text-dark" : "badge-swim-neutral"}`}
              >
                {sw.running ? "● EN CURSO" : sw.elapsed > 0 ? "■ DETENIDO" : "○ LISTO"}
              </Badge>
            </div>
            <div className="small text-swim-muted text-center d-lg-none">
              Tip: usa la barra de abajo para cronometrar sin perder de vista la pantalla.
            </div>
          </Col>
        </Row>

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
                          className="d-flex justify-content-between align-items-center px-0 gap-2"
                          style={{ background: "transparent", borderColor: "var(--swim-border)" }}
                        >
                          <div className="small" style={{ minWidth: 0 }}>
                            <span className="fw-semibold">{a?.fullName || t.athleteName || "—"}</span>{" "}
                            <span className="text-swim-muted">
                              · {t.estiloLabel || "—"} · {t.distancia} m
                            </span>
                            {t.isRecord && <span className="ms-1">🏆</span>}
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-swim-cyan">{formatTime(t.timeMs)}</span>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(t.id)}
                              aria-label="Eliminar registro"
                              title="Eliminar"
                            >
                              🗑
                            </Button>
                          </div>
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

      <QuickActionBar
        elapsed={sw.elapsed}
        running={sw.running}
        onStart={sw.start}
        onStop={sw.stop}
        onReset={sw.reset}
        onSave={handleSave}
        canSave={canSave}
        saved={saved}
        athleteName={athlete?.fullName}
      />
    </div>
  );
}
