import React from "react";
import { Container, Button, Badge } from "react-bootstrap";
import { formatTime } from "../theme";

// Barra fija al fondo de la pantalla: siempre visible aunque se haga scroll.
// Pensada para el profesor que está parado al borde de la pileta,
// cronometrando a varios nadadores seguidos sin tener que volver arriba.
export default function QuickActionBar({
  elapsed,
  running,
  onStart,
  onStop,
  onReset,
  onSave,
  canSave,
  saved,
  athleteName,
}) {
  return (
    <div
      className="swim-quickbar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1030,
        background: "rgba(14, 42, 63, 0.96)",
        borderTop: "1px solid var(--swim-border)",
        backdropFilter: "blur(6px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Container fluid="lg" className="py-2 px-3">
        <div className="d-flex align-items-center gap-2 gap-sm-3">
          <div className="flex-shrink-0" style={{ minWidth: 0 }}>
            <div
              className="text-swim-muted text-truncate"
              style={{ fontSize: "0.65rem", maxWidth: 110 }}
            >
              {athleteName ? athleteName.toUpperCase() : "SIN ATLETA"}
            </div>
            <div
              className={`font-mono fw-bold ${running ? "text-swim-cyan" : "text-white"}`}
              style={{ fontSize: "1.4rem", lineHeight: 1 }}
            >
              {formatTime(elapsed)}
            </div>
          </div>

          <div className="d-flex flex-grow-1 gap-2">
            <Button
              className={`flex-grow-1 fw-bold ${running ? "" : "btn-swim-cyan"}`}
              variant={running ? "danger" : undefined}
              style={{ minHeight: 48 }}
              onClick={running ? onStop : onStart}
            >
              {running ? "Detener" : "Iniciar"}
            </Button>
            <Button
              className="btn-swim-gold fw-bold flex-grow-1"
              style={{ minHeight: 48 }}
              disabled={!canSave}
              onClick={onSave}
            >
              {saved ? "✓ Guardado" : "Guardar"}
            </Button>
            <Button
              className="btn-swim-outline border"
              style={{ minHeight: 48, minWidth: 48 }}
              disabled={running}
              onClick={onReset}
              aria-label="Reiniciar cronómetro"
              title="Reiniciar"
            >
              ↺
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
