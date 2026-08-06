import React, { useState } from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useInscriptos } from "../hooks/useInscriptos";
import { useEquipos } from "../hooks/useEquipos";
import { formatDate } from "../theme";

function describirLargo(posta) {
  if (posta.tipoLargo === "distancia") {
    const tramos = posta.distanciaTramo ? Math.round(posta.valorLargo / posta.distanciaTramo) : "?";
    return `${posta.valorLargo} m totales · ${tramos} tramos de ${posta.distanciaTramo} m`;
  }
  return `${posta.valorLargo} min · tramos de ${posta.distanciaTramo} m`;
}

export default function PostaCard({ posta }) {
  const { user, profile } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const { inscriptos, loading } = useInscriptos("postas", posta.id);
  const { equipos } = useEquipos(posta.id);
  const [busy, setBusy] = useState(false);

  const estoyInscripto = !isProfesor && inscriptos.some((i) => i.id === user.uid);
  const miEquipo = !isProfesor
    ? equipos.find((eq) => (eq.integrantes || []).some((i) => i.athleteId === user.uid))
    : null;

  const handleInscribirme = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, "postas", posta.id, "inscripciones", user.uid), {
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
    if (!window.confirm("¿Darte de baja de esta posta?")) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "postas", posta.id, "inscripciones", user.uid));
    } catch (err) {
      window.alert("No se pudo dar de baja la inscripción.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActivo = async () => {
    try {
      await updateDoc(doc(db, "postas", posta.id), { activo: !posta.activo });
    } catch (err) {
      window.alert("No se pudo actualizar la posta.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Eliminar la posta "${posta.nombre}"? Los equipos y resultados ya cargados no se ven afectados.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "postas", posta.id));
    } catch (err) {
      window.alert("No se pudo eliminar la posta.");
    }
  };

  return (
    <Card className="swim-card mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="fw-bold fs-5">{posta.nombre}</div>
            <div className="text-swim-muted small">{formatDate(posta.fecha)}</div>
            <div className="text-swim-muted small mt-1">{describirLargo(posta)}</div>
            {posta.descripcion && <div className="small mt-2">{posta.descripcion}</div>}
          </div>
          <Badge bg={null} className="badge-swim-neutral flex-shrink-0" style={{ opacity: posta.activo ? 1 : 0.6 }}>
            {posta.activo ? "Activa" : "Finalizada"}
          </Badge>
        </div>

        <div className="mt-3 small text-swim-muted">
          {loading ? "Cargando inscriptos…" : `${inscriptos.length} inscripto${inscriptos.length === 1 ? "" : "s"}`}
        </div>

        <div className="mt-2 d-flex flex-wrap gap-3">
          {isProfesor && (
            <Link to={`/postas/${posta.id}/equipos`} className="text-swim-cyan small">
              Gestionar equipos →
            </Link>
          )}
          {!isProfesor && miEquipo && (
            <Link to={`/postas/${posta.id}/equipos`} className="text-swim-cyan small">
              Ordenar mi equipo →
            </Link>
          )}
          {isProfesor && (
            <Link to={`/postas/${posta.id}/cronometro`} className="text-swim-cyan small">
              Cronómetro →
            </Link>
          )}
          <Link to={`/postas/${posta.id}/resultados`} className="text-swim-cyan small">
            Ver resultados →
          </Link>
        </div>

        {isProfesor ? (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button size="sm" className="btn-swim-outline border" onClick={handleToggleActivo}>
              {posta.activo ? "Marcar como finalizada" : "Reactivar"}
            </Button>
            <Button size="sm" variant="outline-danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            {estoyInscripto ? (
              <>
                <div className="small mb-2">
                  {miEquipo ? (
                    <>
                      Tu equipo: <span className="fw-semibold text-swim-cyan">{miEquipo.nombre}</span>
                    </>
                  ) : (
                    <span className="text-swim-muted">
                      Todavía no te asignaron a un equipo — el profesor lo hace antes de la posta.
                    </span>
                  )}
                </div>
                <Button size="sm" className="btn-swim-outline border" disabled={busy} onClick={handleDarseDeBaja}>
                  ✓ Inscripto — darse de baja
                </Button>
              </>
            ) : (
              <Button size="sm" className="btn-swim-cyan" disabled={busy || !posta.activo} onClick={handleInscribirme}>
                {posta.activo ? "Inscribirme" : "Posta finalizada"}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
