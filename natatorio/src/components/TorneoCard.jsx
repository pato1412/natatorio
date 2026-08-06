import React, { useState } from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useInscriptos } from "../hooks/useInscriptos";
import { formatDate } from "../theme";

export default function TorneoCard({ torneo }) {
  const { user, profile } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const { inscriptos, loading } = useInscriptos("torneos", torneo.id);
  const [busy, setBusy] = useState(false);

  const estoyInscripto = !isProfesor && inscriptos.some((i) => i.id === user.uid);

  const handleInscribirme = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, "torneos", torneo.id, "inscripciones", user.uid), {
        athleteName: profile?.fullName || "",
        inscribedAt: new Date().toISOString(),
      });
    } catch (err) {
      window.alert("No se pudo completar la inscripción.");
    } finally {
      setBusy(false);
    }
  };

  const handleDarseDeBaja = async () => {
    if (!window.confirm("¿Darte de baja de este torneo?")) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "torneos", torneo.id, "inscripciones", user.uid));
    } catch (err) {
      window.alert("No se pudo dar de baja la inscripción.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActivo = async () => {
    try {
      await updateDoc(doc(db, "torneos", torneo.id), { activo: !torneo.activo });
    } catch (err) {
      window.alert("No se pudo actualizar el torneo.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Eliminar el torneo "${torneo.nombre}"? Los tiempos ya registrados con este torneo no se ven afectados.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "torneos", torneo.id));
    } catch (err) {
      window.alert("No se pudo eliminar el torneo.");
    }
  };

  return (
    <Card className="swim-card mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="fw-bold fs-5">{torneo.nombre}</div>
            <div className="text-swim-muted small">{formatDate(torneo.fecha)}</div>
            {torneo.descripcion && <div className="small mt-2">{torneo.descripcion}</div>}
          </div>
          <Badge bg={null} className="badge-swim-neutral flex-shrink-0" style={{ opacity: torneo.activo ? 1 : 0.6 }}>
            {torneo.activo ? "Activo" : "Finalizado"}
          </Badge>
        </div>

        <div className="mt-3 small text-swim-muted">
          {loading ? "Cargando inscriptos…" : `${inscriptos.length} inscripto${inscriptos.length === 1 ? "" : "s"}`}
        </div>

        <div className="mt-2">
          <Link to={`/torneos/${torneo.id}/resultados`} className="text-swim-cyan small">
            Ver hoja de resultados →
          </Link>
        </div>

        {isProfesor ? (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button size="sm" className="btn-swim-outline border" onClick={handleToggleActivo}>
              {torneo.activo ? "Marcar como finalizado" : "Reactivar"}
            </Button>
            <Button size="sm" variant="outline-danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            {estoyInscripto ? (
              <Button size="sm" className="btn-swim-outline border" disabled={busy} onClick={handleDarseDeBaja}>
                ✓ Inscripto — darse de baja
              </Button>
            ) : (
              <Button size="sm" className="btn-swim-cyan" disabled={busy || !torneo.activo} onClick={handleInscribirme}>
                {torneo.activo ? "Inscribirme" : "Torneo finalizado"}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
