import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Card, Form, Button, Badge, Alert } from "react-bootstrap";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useEquipos } from "../hooks/useEquipos";
import { formatTime } from "../theme";
import PageHeader from "../components/PageHeader";

export default function CronometroPosta() {
  const { postaId } = useParams();
  const { user } = useAuth();
  const [posta, setPosta] = useState(null);
  const [loadingPosta, setLoadingPosta] = useState(true);
  const { equipos, loading: loadingEquipos } = useEquipos(postaId);

  const [equipoId, setEquipoId] = useState("");
  const [running, setRunning] = useState(false);
  const [overallElapsed, setOverallElapsed] = useState(0);
  const [legElapsed, setLegElapsed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tramos, setTramos] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const startRef = useRef(null);
  const legStartRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "postas", postaId));
      setPosta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingPosta(false);
    })();
  }, [postaId]);

  useEffect(() => {
    if (!equipoId && equipos.length) setEquipoId(equipos[0].id);
  }, [equipos]); // eslint-disable-line

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  const equipo = equipos.find((e) => e.id === equipoId);
  // El orden queda fijo al arrancar: es el orden ya guardado del equipo
  // (definido antes, por el profesor o por los propios atletas).
  const integrantes = equipo ? [...(equipo.integrantes || [])].sort((a, b) => a.orden - b.orden) : [];
  const targetTramos =
    posta && posta.tipoLargo === "distancia" && posta.distanciaTramo
      ? Math.round(posta.valorLargo / posta.distanciaTramo)
      : null;

  const tick = () => {
    const now = Date.now();
    setOverallElapsed(now - startRef.current);
    setLegElapsed(now - legStartRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleIniciar = () => {
    if (!integrantes.length) return;
    setError("");
    setSaved(false);
    setTramos([]);
    setCurrentIndex(0);
    const now = Date.now();
    startRef.current = now;
    legStartRef.current = now;
    setOverallElapsed(0);
    setLegElapsed(0);
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleCancelar = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTramos([]);
    setOverallElapsed(0);
    setLegElapsed(0);
  };

  const guardarResultado = async (tramosFinales, totalMs) => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    try {
      await addDoc(collection(db, "postas", postaId, "resultados"), {
        equipoId,
        equipoNombre: equipo?.nombre || "",
        tramos: tramosFinales,
        totalTimeMs: totalMs,
        totalDistancia: tramosFinales.length * (posta?.distanciaTramo || 0),
        distanciaTramo: posta.distanciaTramo,
        tipoLargo: posta.tipoLargo,
        valorLargo: posta.valorLargo,
        recordedBy: user.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      setError("No se pudo guardar el resultado. Los tiempos siguen en pantalla, podés reintentar.");
    }
  };

  const handleMarcarLlegada = () => {
    const now = Date.now();
    const atletaActual = integrantes[currentIndex];
    const nuevoTramo = {
      orden: tramos.length + 1,
      athleteId: atletaActual.athleteId,
      athleteName: atletaActual.athleteName,
      tiempoMs: now - legStartRef.current,
      acumuladoMs: now - startRef.current,
    };
    const nuevosTramos = [...tramos, nuevoTramo];
    setTramos(nuevosTramos);

    const llegoAlObjetivo = targetTramos && nuevosTramos.length >= targetTramos;
    if (llegoAlObjetivo) {
      guardarResultado(nuevosTramos, nuevoTramo.acumuladoMs);
      return;
    }

    legStartRef.current = now;
    setLegElapsed(0);
    // Sigue el orden fijo del equipo, dando otra vuelta si hace falta.
    setCurrentIndex((i) => (i + 1) % integrantes.length);
  };

  const handleFinalizar = () => {
    if (tramos.length === 0) {
      handleCancelar();
      return;
    }
    guardarResultado(tramos, tramos[tramos.length - 1].acumuladoMs);
  };

  const handleNuevaCorrida = () => {
    setSaved(false);
    setTramos([]);
    setOverallElapsed(0);
    setLegElapsed(0);
  };

  if (loadingPosta) {
    return (
      <Container fluid="lg" className="py-5 text-center">
        <span className="small text-swim-muted">Cargando…</span>
      </Container>
    );
  }

  if (!posta) {
    return (
      <Container fluid="lg" className="py-5">
        <div className="small text-swim-muted mb-2">No se encontró la posta.</div>
        <Link to="/postas" className="text-swim-cyan small">← Volver a Postas</Link>
      </Container>
    );
  }

  return (
    <div>
      <PageHeader title={posta.nombre} subtitle="Cronómetro de posta" />
      <Container fluid="lg" style={{ paddingBottom: "3rem" }}>
        <div className="mb-3">
          <Link to="/postas" className="text-swim-cyan small">← Volver a Postas</Link>
        </div>

        <Card className="swim-card mb-3">
          <Card.Body>
            <Form.Label className="small text-swim-muted text-uppercase fw-bold">Equipo</Form.Label>
            <Form.Select value={equipoId} onChange={(e) => setEquipoId(e.target.value)} disabled={running}>
              {equipos.length === 0 && <option value="">Todavía no hay equipos armados</option>}
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre} ({(eq.integrantes || []).length} integrantes)
                </option>
              ))}
            </Form.Select>
            {equipo && integrantes.length < 2 && (
              <div className="small text-swim-muted mt-2">
                Este equipo tiene menos de 2 integrantes cargados — podés seguir igual, o completarlo desde
                "Gestionar equipos".
              </div>
            )}
            {equipo && integrantes.length >= 2 && !running && (
              <div className="small text-swim-muted mt-2">
                Orden de nado: {integrantes.map((i) => i.athleteName).join(" → ")}
              </div>
            )}
          </Card.Body>
        </Card>

        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {saved ? (
          <Card className="swim-card mb-3">
            <Card.Body className="text-center">
              <div className="fs-4 mb-2">✓</div>
              <div className="fw-bold mb-1">Resultado guardado</div>
              <div className="font-mono text-swim-cyan fs-3 mb-3">{formatTime(overallElapsed)}</div>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Button className="btn-swim-cyan" onClick={handleNuevaCorrida}>
                  Cronometrar otro equipo
                </Button>
                <Link to={`/postas/${postaId}/resultados`} className="btn btn-swim-outline border">
                  Ver resultados
                </Link>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className={`swim-timer p-4 text-center mb-3 ${running ? "running" : ""}`}>
              <div className="font-mono text-swim-muted small mb-1">
                {running
                  ? `${integrantes[currentIndex]?.athleteName?.toUpperCase() || ""} · TRAMO ${tramos.length + 1}${
                      targetTramos ? ` DE ${targetTramos}` : ""
                    }`
                  : equipo
                  ? `EQUIPO: ${equipo.nombre.toUpperCase()}`
                  : "SELECCIONA UN EQUIPO"}
              </div>
              <div className={`swim-timer-value ${running ? "text-swim-cyan" : "text-white"}`}>
                {formatTime(overallElapsed)}
              </div>
              {running && (
                <div className="font-mono text-swim-gold mt-2" style={{ fontSize: "1.1rem" }}>
                  Tramo: {formatTime(legElapsed)}
                </div>
              )}
              <Badge bg={running ? "info" : null} className={`mt-2 ${running ? "text-dark" : "badge-swim-neutral"}`}>
                {running ? "● EN CURSO" : "○ LISTO"}
              </Badge>
            </div>

            {!running ? (
              <div className="d-grid">
                <Button
                  className="btn-swim-cyan"
                  size="lg"
                  disabled={!equipo || integrantes.length === 0}
                  onClick={handleIniciar}
                >
                  Iniciar posta
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                <Button className="btn-swim-gold" size="lg" onClick={handleMarcarLlegada}>
                  Siguiente atleta
                </Button>
                <div className="d-flex gap-2">
                  <Button className="btn-swim-outline border flex-fill" onClick={handleFinalizar}>
                    Finalizar posta
                  </Button>
                  <Button variant="outline-danger" className="flex-fill" onClick={handleCancelar}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {tramos.length > 0 && (
              <Card className="swim-card mt-3">
                <Card.Body>
                  <div className="small text-swim-muted text-uppercase fw-bold mb-2">Tramos completados</div>
                  <div className="d-flex flex-column gap-1">
                    {tramos.map((t) => (
                      <div key={t.orden} className="d-flex justify-content-between small">
                        <span>
                          {t.orden}. {t.athleteName}
                        </span>
                        <span className="font-mono text-swim-cyan">{formatTime(t.tiempoMs)}</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
