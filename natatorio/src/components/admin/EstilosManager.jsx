import React, { useState } from "react";
import { Card, Form, Button, ListGroup, Badge, Alert, Spinner } from "react-bootstrap";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useEstilos } from "../../hooks/useEstilos";

const ESTILOS_POR_DEFECTO = [
  { label: "Libre", order: 1 },
  { label: "Espalda", order: 2 },
  { label: "Pecho", order: 3 },
  { label: "Mariposa", order: 4 },
  { label: "Combinado", order: 5 },
];

export default function EstilosManager() {
  const { estilos, loading } = useEstilos({ onlyActive: false });
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    setError("");
    try {
      const maxOrder = estilos.reduce((m, e) => Math.max(m, e.order || 0), 0);
      await addDoc(collection(db, "estilos"), { label, order: maxOrder + 1, active: true });
      setNewLabel("");
    } catch (err) {
      setError("No se pudo guardar el estilo. Revisa las reglas de Firestore.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (estilo) => {
    try {
      await updateDoc(doc(db, "estilos", estilo.id), { active: !estilo.active });
    } catch (err) {
      setError("No se pudo actualizar el estilo.");
    }
  };

  const handleDelete = async (estilo) => {
    if (!window.confirm(`¿Eliminar "${estilo.label}"? Los tiempos ya guardados con este estilo no se ven afectados.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "estilos", estilo.id));
    } catch (err) {
      setError("No se pudo eliminar el estilo.");
    }
  };

  const handleSeed = async () => {
    setBusy(true);
    setError("");
    try {
      for (const e of ESTILOS_POR_DEFECTO) {
        await addDoc(collection(db, "estilos"), { ...e, active: true });
      }
    } catch (err) {
      setError("No se pudieron cargar los estilos por defecto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Card className="swim-card mb-3">
        <Card.Body>
          <Form onSubmit={handleAdd} className="d-flex gap-2">
            <Form.Control
              placeholder="Nombre del nuevo estilo (ej. Libre por relevos)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button type="submit" className="btn-swim-cyan flex-shrink-0" disabled={busy}>
              {busy ? <Spinner size="sm" animation="border" /> : "+ Añadir"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      <Card className="swim-card">
        <Card.Body>
          {loading ? (
            <div className="small text-swim-muted">Cargando…</div>
          ) : estilos.length === 0 ? (
            <div>
              <div className="small text-swim-muted mb-3">Todavía no hay estilos cargados.</div>
              <Button className="btn-swim-outline border" onClick={handleSeed} disabled={busy}>
                Cargar estilos por defecto (Libre, Espalda, Pecho, Mariposa, Combinado)
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush">
              {estilos.map((e) => (
                <ListGroup.Item
                  key={e.id}
                  className="d-flex justify-content-between align-items-center px-0 flex-wrap gap-2"
                  style={{ background: "transparent", borderColor: "var(--swim-border)" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold" style={{ color: "#fff" }} >{e.label}</span>
                    {!e.active && <Badge bg="secondary">Inactivo</Badge>}
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" className="btn-swim-outline border" onClick={() => handleToggleActive(e)}>
                      {e.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(e)}>
                      Eliminar
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <div className="small text-swim-muted mt-3">
        Los estilos "Inactivos" dejan de aparecer como opción al registrar un tiempo nuevo,
        pero los tiempos ya guardados con ese estilo se conservan sin cambios.
      </div>
    </div>
  );
}
