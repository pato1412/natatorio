import React, { useState } from "react";
import { Card, Form, Button, ListGroup, Badge, Alert, Spinner } from "react-bootstrap";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useDistancias } from "../../hooks/useDistancias";

const DISTANCIAS_POR_DEFECTO = [50, 100, 200, 400];

export default function DistanciasManager() {
  const { distancias, loading } = useDistancias({ onlyActive: false });
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    const value = Number(newValue);
    if (!value || value <= 0) {
      setError("Ingresa un número de metros válido.");
      return;
    }
    if (distancias.some((d) => d.value === value)) {
      setError("Esa distancia ya existe.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "distancias"), { value, active: true });
      setNewValue("");
    } catch (err) {
      setError("No se pudo guardar la distancia. Revisa las reglas de Firestore.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (distancia) => {
    try {
      await updateDoc(doc(db, "distancias", distancia.id), { active: !distancia.active });
    } catch (err) {
      setError("No se pudo actualizar la distancia.");
    }
  };

  const handleDelete = async (distancia) => {
    if (
      !window.confirm(
        `¿Eliminar "${distancia.value} m"? Los tiempos ya guardados con esta distancia no se ven afectados.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "distancias", distancia.id));
    } catch (err) {
      setError("No se pudo eliminar la distancia.");
    }
  };

  const handleSeed = async () => {
    setBusy(true);
    setError("");
    try {
      for (const value of DISTANCIAS_POR_DEFECTO) {
        await addDoc(collection(db, "distancias"), { value, active: true });
      }
    } catch (err) {
      setError("No se pudieron cargar las distancias por defecto.");
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
              type="number"
              min="1"
              placeholder="Metros (ej. 800)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
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
          ) : distancias.length === 0 ? (
            <div>
              <div className="small text-swim-muted mb-3">Todavía no hay distancias cargadas.</div>
              <Button className="btn-swim-outline border" onClick={handleSeed} disabled={busy}>
                Cargar distancias por defecto (50, 100, 200, 400 m)
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush">
              {distancias.map((d) => (
                <ListGroup.Item
                  key={d.id}
                  className="d-flex justify-content-between align-items-center px-0 flex-wrap gap-2"
                  style={{ background: "transparent", borderColor: "var(--swim-border)" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold font-mono" style={{ color: "#fff" }}>{d.value} m</span>
                    {!d.active && <Badge bg="secondary">Inactivo</Badge>}
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" className="btn-swim-outline border" onClick={() => handleToggleActive(d)}>
                      {d.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(d)}>
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
        Las distancias "Inactivas" dejan de aparecer como opción al registrar un tiempo nuevo,
        pero los tiempos ya guardados con esa distancia se conservan sin cambios.
      </div>
    </div>
  );
}
