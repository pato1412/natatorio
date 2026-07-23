import React from "react";
import { Container, Badge, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ title, subtitle }) {
  const { logout, profile } = useAuth();

  return (
    <>
      <div className="bg-dark border-bottom border-secondary-subtle mb-4 py-3">
        <Container fluid="lg">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <div>
              <Badge bg="info" className="text-dark font-mono mb-1">
                {profile?.role === "profesor" ? "PANEL DEL PROFESOR" : "PERFIL DEL ATLETA"}
              </Badge>
              <h1 className="fw-bold fs-4 text-white m-0">{title}</h1>
              {subtitle && <div className="text-swim-muted small">{subtitle}</div>}
            </div>
            <Button size="sm" className="btn-swim-outline border align-self-start align-self-sm-center" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </Container>
      </div>
      <Container fluid="lg" className="mb-4">
        <div className="swim-lane-divider" />
      </Container>
    </>
  );
}
