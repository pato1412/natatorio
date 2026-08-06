import React, { useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { usePostas } from "../hooks/usePostas";
import PageHeader from "../components/PageHeader";
import PostaCard from "../components/PostaCard";

export default function Postas() {
  const { profile } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const { postas, loading } = usePostas({ onlyActive: false });

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [distanciaTramo, setDistanciaTramo] = useState("");
  const [tipoLargo, setTipoLargo] = useState("distancia");
  const [valorLargo, setValorLargo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !fecha || !distanciaTramo || !valorLargo) {
      setError("Completa nombre, fecha, distancia por tramo y el largo total.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "postas"), {
        nombre: nombre.trim(),
        fecha,
        distanciaTramo: Number(distanciaTramo),
        tipoLargo, // "distancia" | "tiempo"
        valorLargo: Number(valorLargo),
        descripcion: descripcion.trim(),
        activo: true,
        createdAt: serverTimestamp(),
      });
      setNombre("");
      setFecha("");
      setDistanciaTramo("");
      setValorLargo("");
      setDescripcion("");
    } catch (err) {
      setError("No se pudo crear la posta. Revisa las reglas de Firestore.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Postas"
        subtitle={isProfesor ? "Creá postas y armá los equipos" : "Inscribite para participar en un equipo"}
      />
      <Container fluid="lg" className="pb-5">
        {isProfesor && (
          <Card className="swim-card mb-4">
            <Card.Body>
              <div className="fw-bold mb-3">Nueva posta</div>
              <Form onSubmit={handleCreate}>
                <Row className="g-2 mb-2">
                  <Col xs={12} sm={7}>
                    <Form.Control
                      placeholder="Nombre de la posta"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} sm={5}>
                    <Form.Control type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                  </Col>
                </Row>

                <Row className="g-2 mb-2">
                  <Col xs={12} sm={4}>
                    <Form.Label className="small text-swim-muted mb-1">Distancia por tramo (m)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="Ej. 50"
                      value={distanciaTramo}
                      onChange={(e) => setDistanciaTramo(e.target.value)}
                    />
                  </Col>
                  <Col xs={7} sm={4}>
                    <Form.Label className="small text-swim-muted mb-1">Largo total por</Form.Label>
                    <Form.Select value={tipoLargo} onChange={(e) => setTipoLargo(e.target.value)}>
                      <option value="distancia">Distancia</option>
                      <option value="tiempo">Tiempo</option>
                    </Form.Select>
                  </Col>
                  <Col xs={5} sm={4}>
                    <Form.Label className="small text-swim-muted mb-1">
                      {tipoLargo === "distancia" ? "Total (m)" : "Total (min)"}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder={tipoLargo === "distancia" ? "Ej. 500" : "Ej. 20"}
                      value={valorLargo}
                      onChange={(e) => setValorLargo(e.target.value)}
                    />
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
                  {busy ? <Spinner size="sm" animation="border" /> : "Crear posta"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

        {loading && <div className="small text-swim-muted">Cargando postas…</div>}
        {!loading && postas.length === 0 && (
          <div className="small text-swim-muted">Todavía no hay postas creadas.</div>
        )}
        {postas.map((p) => (
          <PostaCard key={p.id} posta={p} />
        ))}
      </Container>
    </div>
  );
}
