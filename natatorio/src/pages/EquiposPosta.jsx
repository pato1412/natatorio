import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Spinner, Badge } from "react-bootstrap";
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useInscriptos } from "../hooks/useInscriptos";
import { useEquipos } from "../hooks/useEquipos";
import PageHeader from "../components/PageHeader";

function EquipoBlock({ postaId, equipo, atletasDisponibles }) {
  const [nuevoAtletaId, setNuevoAtletaId] = useState("");
  const [busy, setBusy] = useState(false);

  const integrantes = [...(equipo.integrantes || [])].sort((a, b) => a.orden - b.orden);

  const guardarIntegrantes = async (nuevos) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, "postas", postaId, "equipos", equipo.id), {
        integrantes: nuevos.map((i, idx) => ({ ...i, orden: idx + 1 })),
      });
    } catch (err) {
      window.alert("No se pudo actualizar el equipo.");
    } finally {
      setBusy(false);
    }
  };

  const handleAgregar = () => {
    if (!nuevoAtletaId) return;
    const atleta = atletasDisponibles.find((a) => a.id === nuevoAtletaId);
    if (!atleta) return;
    guardarIntegrantes([...integrantes, { athleteId: atleta.id, athleteName: atleta.athleteName }]);
    setNuevoAtletaId("");
  };

  const handleQuitar = (athleteId) => {
    guardarIntegrantes(integrantes.filter((i) => i.athleteId !== athleteId));
  };

  const handleMover = (index, dir) => {
    const nuevos = [...integrantes];
    const target = index + dir;
    if (target < 0 || target >= nuevos.length) return;
    [nuevos[index], nuevos[target]] = [nuevos[target], nuevos[index]];
    guardarIntegrantes(nuevos);
  };

  const handleEliminarEquipo = async () => {
    if (!window.confirm(`¿Eliminar el equipo "${equipo.nombre}"?`)) return;
    try {
      await deleteDoc(doc(db, "postas", postaId, "equipos", equipo.id));
    } catch (err) {
      window.alert("No se pudo eliminar el equipo.");
    }
  };

  return (
    <Card className="swim-card mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-bold">{equipo.nombre}</div>
          <Button size="sm" variant="outline-danger" onClick={handleEliminarEquipo}>
            Eliminar equipo
          </Button>
        </div>

        {integrantes.length === 0 ? (
          <div className="small text-swim-muted mb-2">Todavía no tiene integrantes.</div>
        ) : (
          <div className="d-flex flex-column gap-2 mb-3">
            {integrantes.map((i, idx) => (
              <div
                key={i.athleteId}
                className="d-flex align-items-center justify-content-between gap-2 p-2 rounded"
                style={{ background: "var(--swim-panel-alt)" }}
              >
                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                  <Badge bg={null} className="badge-swim-neutral font-mono">
                    {idx + 1}
                  </Badge>
                  <span className="small text-truncate">{i.athleteName}</span>
                </div>
                <div className="d-flex gap-1 flex-shrink-0">
                  <Button size="sm" className="btn-swim-outline border" disabled={busy || idx === 0} onClick={() => handleMover(idx, -1)}>
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    className="btn-swim-outline border"
                    disabled={busy || idx === integrantes.length - 1}
                    onClick={() => handleMover(idx, 1)}
                  >
                    ↓
                  </Button>
                  <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => handleQuitar(i.athleteId)}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {atletasDisponibles.length > 0 && (
          <div className="d-flex gap-2">
            <Form.Select value={nuevoAtletaId} onChange={(e) => setNuevoAtletaId(e.target.value)}>
              <option value="">Agregar atleta…</option>
              {atletasDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.athleteName}
                </option>
              ))}
            </Form.Select>
            <Button className="btn-swim-cyan flex-shrink-0" disabled={!nuevoAtletaId || busy} onClick={handleAgregar}>
              + Añadir
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function EquiposPosta() {
  const { postaId } = useParams();
  const [posta, setPosta] = useState(null);
  const [loadingPosta, setLoadingPosta] = useState(true);
  const { inscriptos } = useInscriptos("postas", postaId);
  const { equipos, loading: loadingEquipos } = useEquipos(postaId);

  const [nombreEquipo, setNombreEquipo] = useState("");
  const [busyCrear, setBusyCrear] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "postas", postaId));
      setPosta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingPosta(false);
    })();
  }, [postaId]);

  const idsAsignados = new Set(equipos.flatMap((eq) => (eq.integrantes || []).map((i) => i.athleteId)));
  const atletasDisponibles = inscriptos.filter((i) => !idsAsignados.has(i.id)).map((i) => ({ id: i.id, athleteName: i.athleteName }));

  const handleCrearEquipo = async (e) => {
    e.preventDefault();
    if (!nombreEquipo.trim()) return;
    setBusyCrear(true);
    try {
      await addDoc(collection(db, "postas", postaId, "equipos"), {
        nombre: nombreEquipo.trim(),
        integrantes: [],
        createdAt: serverTimestamp(),
      });
      setNombreEquipo("");
    } catch (err) {
      window.alert("No se pudo crear el equipo.");
    } finally {
      setBusyCrear(false);
    }
  };

  if (loadingPosta) {
    return (
      <Container fluid="lg" className="py-5 text-center">
        <Spinner animation="border" variant="info" />
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
      <PageHeader title={posta.nombre} subtitle="Gestionar equipos" />
      <Container fluid="lg" className="pb-5">
        <div className="mb-3">
          <Link to="/postas" className="text-swim-cyan small">← Volver a Postas</Link>
        </div>

        <Card className="swim-card mb-4">
          <Card.Body>
            <div className="fw-bold mb-2">Nuevo equipo</div>
            <Form onSubmit={handleCrearEquipo} className="d-flex gap-2">
              <Form.Control
                placeholder="Nombre del equipo"
                value={nombreEquipo}
                onChange={(e) => setNombreEquipo(e.target.value)}
              />
              <Button type="submit" className="btn-swim-cyan flex-shrink-0" disabled={busyCrear}>
                {busyCrear ? <Spinner size="sm" animation="border" /> : "+ Crear"}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {atletasDisponibles.length > 0 && (
          <div className="small text-swim-muted mb-3">
            Sin equipo todavía: {atletasDisponibles.map((a) => a.athleteName).join(", ")}
          </div>
        )}

        {loadingEquipos && <div className="small text-swim-muted">Cargando equipos…</div>}
        {!loadingEquipos && equipos.length === 0 && (
          <div className="small text-swim-muted">Todavía no hay equipos creados.</div>
        )}
        {equipos.map((eq) => (
          <EquipoBlock key={eq.id} postaId={postaId} equipo={eq} atletasDisponibles={atletasDisponibles} />
        ))}
      </Container>
    </div>
  );
}
