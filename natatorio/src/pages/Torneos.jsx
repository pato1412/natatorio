import React, { useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useTorneos } from "../hooks/useTorneos";
import PageHeader from "../components/PageHeader";
import TorneoCard from "../components/TorneoCard";

export default function Torneos() {
  const { profile } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const { torneos, loading } = useTorneos({ onlyActive: false });

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !fecha) {
      setError("Completa al menos el nombre y la fecha.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "torneos"), {
        nombre: nombre.trim(),
        fecha,
        descripcion: descripcion.trim(),
        activo: true,
        createdAt: serverTimestamp(),
      });
      setNombre("");
      setFecha("");
      setDescripcion("");
    } catch (err) {
      setError("No se pudo crear el torneo. Revisa las reglas de Firestore.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Torneos"
        subtitle={isProfesor ? "Creá torneos y consultá quién está inscripto" : "Inscribite en los torneos activos"}
      />
      <Container fluid="lg" className="pb-5">
        {isProfesor && (
          <Card className="swim-card mb-4">
            <Card.Body>
              <div className="fw-bold mb-3">Nuevo torneo</div>
              <Form onSubmit={handleCreate}>
                <Row className="g-2 mb-2">
                  <Col xs={12} sm={7}>
                    <Form.Control
                      placeholder="Nombre del torneo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} sm={5}>
                    <Form.Control type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                  </Col>
                </Row>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="mb-2"
                  placeholder="Descripción (opcional)"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                <Button type="submit" className="btn-swim-cyan" disabled={busy}>
                  {busy ? <Spinner size="sm" animation="border" /> : "Crear torneo"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

        {loading && <div className="small text-swim-muted">Cargando torneos…</div>}
        {!loading && torneos.length === 0 && (
          <div className="small text-swim-muted">Todavía no hay torneos creados.</div>
        )}
        {torneos.map((t) => (
          <TorneoCard key={t.id} torneo={t} />
        ))}
      </Container>
    </div>
  );
}
