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
  // fase: "elegir" (entre tramos, hay que elegir quién nada) | "nadando" | "guardado"
  const [fase, setFase] = useState("elegir");
  const [pendingAthleteId, setPendingAthleteId] = useState("");
  const [legElapsed, setLegElapsed] = useState(0);
  const [tramos, setTramos] = useState([]);
  const [error, setError] = useState("");

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
  const integrantes = equipo ? [...(equipo.integrantes || [])].sort((a, b) => a.orden - b.orden) : [];
  const targetTramos =
    posta && posta.tipoLargo === "distancia" && posta.distanciaTramo
      ? Math.round(posta.valorLargo / posta.distanciaTramo)
      : null;

  // El total se calcula sumando cada tramo ya nadado (no el reloj de pared),
  // así una pausa entre tramos para elegir al próximo nadador no suma tiempo.
  const totalMsAcumulado = tramos.reduce((sum, t) => sum + t.tiempoMs, 0);
  const totalMostrado = totalMsAcumulado + (fase === "nadando" ? legElapsed : 0);
  const distanciaAcumulada = tramos.length * (posta?.distanciaTramo || 0);

  const tick = () => {
    setLegElapsed(Date.now() - legStartRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const resetTodo = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFase("elegir");
    setPendingAthleteId("");
    setTramos([]);
    setLegElapsed(0);
    setError("");
  };

  // Cambiar de equipo arranca de cero.
  useEffect(() => {
    resetTodo();
  }, [equipoId]); // eslint-disable-line

  const handleIniciarTramo = () => {
    if (!pendingAthleteId) return;
    setError("");
    const now = Date.now();
    legStartRef.current = now;
    setLegElapsed(0);
    setFase("nadando");
    rafRef.current = requestAnimationFrame(tick);
  };

  const guardarResultado = async (tramosFinales, totalMsFinal) => {
    try {
      await addDoc(collection(db, "postas", postaId, "resultados"), {
        equipoId,
        equipoNombre: equipo?.nombre || "",
        tramos: tramosFinales,
        totalTimeMs: totalMsFinal,
        totalDistancia: tramosFinales.length * (posta?.distanciaTramo || 0),
        distanciaTramo: posta.distanciaTramo,
        tipoLargo: posta.tipoLargo,
        valorLargo: posta.valorLargo,
        recordedBy: user.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setFase("guardado");
    } catch (err) {
      setError("No se pudo guardar el resultado. Los tiempos siguen en pantalla, podés reintentar con \"Finalizar posta\".");
    }
  };

  const handleMarcarLlegada = () => {
    const now = Date.now();
    const tiempoMs = now - legStartRef.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const atletaActual = integrantes.find((i) => i.athleteId === pendingAthleteId);
    const nuevoTramo = {
      orden: tramos.length + 1,
      athleteId: pendingAthleteId,
      athleteName: atletaActual?.athleteName || "",
      tiempoMs,
      acumuladoMs: totalMsAcumulado + tiempoMs,
    };
    const nuevosTramos = [...tramos, nuevoTramo];
    setTramos(nuevosTramos);
    setLegElapsed(0);

    const llegoAlObjetivo = targetTramos && nuevosTramos.length >= targetTramos;
    if (llegoAlObjetivo) {
      guardarResultado(nuevosTramos, nuevoTramo.acumuladoMs);
      return;
    }
    // Vuelve a preguntar quién nada el próximo tramo (se puede repetir atleta)
    setFase("elegir");
  };

  const handleFinalizar = () => {
    if (tramos.length === 0) {
      resetTodo();
      return;
    }
    guardarResultado(tramos, tramos[tramos.length - 1].acumuladoMs);
  };

  const handleCancelar = () => resetTodo();
  const handleNuevaCorrida = () => resetTodo();

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

  const nadadorActual = integrantes.find((i) => i.athleteId === pendingAthleteId);

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
            <Form.Select value={equipoId} onChange={(e) => setEquipoId(e.target.value)} disabled={fase === "nadando"}>
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
          </Card.Body>
        </Card>

        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {fase === "guardado" ? (
          <Card className="swim-card mb-3">
            <Card.Body className="text-center">
              <div className="fs-4 mb-2">✓</div>
              <div className="fw-bold mb-1">Resultado guardado</div>
              {posta.tipoLargo === "distancia" ? (
                <div className="font-mono text-swim-cyan fs-3 mb-1">{formatTime(totalMsAcumulado)}</div>
              ) : (
                <div className="font-mono text-swim-cyan fs-3 mb-1">{distanciaAcumulada} m</div>
              )}
              <div className="text-swim-muted small mb-3">
                {tramos.length} tramo{tramos.length === 1 ? "" : "s"} · {formatTime(totalMsAcumulado)}
              </div>
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
            <div className={`swim-timer p-4 text-center mb-3 ${fase === "nadando" ? "running" : ""}`}>
              <div className="font-mono text-swim-muted small mb-1">
                {fase === "nadando"
                  ? `${nadadorActual?.athleteName?.toUpperCase() || ""} · TRAMO ${tramos.length + 1}${
                      targetTramos ? ` DE ${targetTramos}` : ""
                    }`
                  : equipo
                  ? `EQUIPO: ${equipo.nombre.toUpperCase()}`
                  : "SELECCIONA UN EQUIPO"}
              </div>
              <div className={`swim-timer-value ${fase === "nadando" ? "text-swim-cyan" : "text-white"}`}>
                {fase === "nadando" ? formatTime(legElapsed) : formatTime(totalMostrado)}
              </div>
              {fase === "nadando" && (
                <div className="font-mono text-swim-gold mt-2" style={{ fontSize: "1.1rem" }}>
                  Total: {formatTime(totalMostrado)}
                </div>
              )}
              <Badge bg={fase === "nadando" ? "info" : null} className={`mt-2 ${fase === "nadando" ? "text-dark" : "badge-swim-neutral"}`}>
                {fase === "nadando" ? "● EN CURSO" : "○ LISTO"}
              </Badge>
              <div className="text-swim-muted small mt-2">
                {posta.tipoLargo === "distancia"
                  ? `${distanciaAcumulada} / ${posta.valorLargo} m`
                  : `${formatTime(totalMostrado)} / ${posta.valorLargo} min objetivo`}
              </div>
            </div>

            {fase === "elegir" && (
              <Card className="swim-card mb-3">
                <Card.Body>
                  <Form.Label className="small text-swim-muted text-uppercase fw-bold">
                    ¿Quién nada el tramo {tramos.length + 1}?
                  </Form.Label>
                  <Form.Select
                    value={pendingAthleteId}
                    onChange={(e) => setPendingAthleteId(e.target.value)}
                    disabled={!equipo || integrantes.length === 0}
                  >
                    <option value="">Elegí un integrante…</option>
                    {integrantes.map((i) => (
                      <option key={i.athleteId} value={i.athleteId}>
                        {i.athleteName}
                      </option>
                    ))}
                  </Form.Select>
                </Card.Body>
              </Card>
            )}

            {fase === "elegir" ? (
              <div className="d-flex flex-column gap-2">
                <div className="d-grid">
                  <Button className="btn-swim-cyan" size="lg" disabled={!pendingAthleteId} onClick={handleIniciarTramo}>
                    Iniciar tramo {tramos.length + 1}
                  </Button>
                </div>
                {tramos.length > 0 && (
                  <div className="d-flex gap-2">
                    <Button className="btn-swim-outline border flex-fill" onClick={handleFinalizar}>
                      Finalizar posta
                    </Button>
                    <Button variant="outline-danger" className="flex-fill" onClick={handleCancelar}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                <Button className="btn-swim-gold" size="lg" onClick={handleMarcarLlegada}>
                  Marcar llegada
                </Button>
                <Button variant="outline-danger" onClick={handleCancelar}>
                  Cancelar posta
                </Button>
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
