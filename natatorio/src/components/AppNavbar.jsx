import React from "react";
import { Navbar, Nav, Container, Badge, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationsBell from "./NotificationsBell";

export default function AppNavbar() {
  const { profile, logout } = useAuth();
  const isProfesor = profile?.role === "profesor";

  return (
    <Navbar bg="dark" variant="dark" expand="md" sticky="top" className="border-bottom border-secondary-subtle swim-navbar">
      <Container fluid="lg">
        <Navbar.Brand className="fw-bold d-flex align-items-center gap-2">
          <span className="text-swim-cyan">🏊</span>
          <span>Carril de Tiempos</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Inicio
            </Nav.Link>
            {isProfesor && (
              <Nav.Link as={NavLink} to="/registrar">
                Registrar tiempos
              </Nav.Link>
            )}
            <Nav.Link as={NavLink} to="/marcas">
              {isProfesor ? "Marcas por atleta" : "Mis mejores marcas"}
            </Nav.Link>
            {!isProfesor && (
              <Nav.Link as={NavLink} to="/historial">
                Mi historial
              </Nav.Link>
            )}
            {isProfesor && (
              <Nav.Link as={NavLink} to="/estilos">
                Administrar estilos
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 pb-2 pb-md-0">
            {!isProfesor && <NotificationsBell />}
            <Badge bg="info" className="text-dark text-truncate" style={{ maxWidth: 160 }}>
              {profile?.fullName}
            </Badge>
            <Button size="sm" className="btn-swim-outline border" onClick={logout}>
              Salir
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
