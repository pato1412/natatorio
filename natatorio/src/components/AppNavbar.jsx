import React, { useState } from "react";
import { Navbar, Nav, Container, Badge, Button, Offcanvas } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationsBell from "./NotificationsBell";

export default function AppNavbar() {
  const { profile, logout } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Navega y cierra el drawer, para que no quede abierto tapando la pantalla
  const go = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" sticky="top" className="border-bottom border-secondary-subtle swim-navbar">
        <Container fluid="lg" className="d-flex align-items-center gap-2">
          <Button
            variant="link"
            className="p-0 border-0 text-white d-flex align-items-center"
            onClick={handleShow}
            aria-label="Abrir menú"
            style={{ fontSize: "1.5rem", lineHeight: 1, textDecoration: "none", color: "inherit" }}
          >
            ☰
          </Button>
          <Navbar.Brand
            className="fw-bold d-flex align-items-center gap-2 me-auto"
            role="button"
            onClick={() => go("/")}
          >
            <img src="/logo-mark.png" alt="" width="28" height="28" style={{ objectFit: "contain" }} />
            <span>Aqua Metrics</span>
          </Navbar.Brand>
          {!isProfesor && <NotificationsBell />}
        </Container>
      </Navbar>

      <Offcanvas show={show} onHide={handleClose} placement="start" className="swim-offcanvas">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <img src="/logo-mark.png" alt="" width="26" height="26" style={{ objectFit: "contain" }} />
            Aqua Metrics
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <div className="d-flex align-items-center gap-2 mb-3 pb-3 border-bottom" style={{ borderColor: "var(--swim-border)" }}>
            <Badge bg="info" className="text-dark text-truncate" style={{ maxWidth: 200 }}>
              {profile?.fullName}
            </Badge>
            <span className="text-swim-muted small text-uppercase">
              {isProfesor ? "Profesor" : "Atleta"}
            </span>
          </div>

          <Nav className="flex-column gap-1">
            <Nav.Link as={NavLink} to="/" end onClick={handleClose}>
              Inicio
            </Nav.Link>
            {isProfesor && (
              <Nav.Link as={NavLink} to="/registrar" onClick={handleClose}>
                Registrar tiempos
              </Nav.Link>
            )}
            <Nav.Link as={NavLink} to="/marcas" onClick={handleClose}>
              {isProfesor ? "Marcas por atleta" : "Mis mejores marcas"}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/torneos" onClick={handleClose}>
              Torneos
            </Nav.Link>
            {!isProfesor && (
              <Nav.Link as={NavLink} to="/historial" onClick={handleClose}>
                Mi historial
              </Nav.Link>
            )}
            {isProfesor && (
              <Nav.Link as={NavLink} to="/configuracion" onClick={handleClose}>
                Configuración
              </Nav.Link>
            )}
          </Nav>

          <div className="mt-auto pt-3 border-top" style={{ borderColor: "var(--swim-border)" }}>
            <Button className="btn-swim-outline border w-100" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
