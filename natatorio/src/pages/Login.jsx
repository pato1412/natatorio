import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginWithEmail, loginWithGoogle, loginWithFacebook, redirectError, clearRedirectError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginWithEmail({ email, password });
      navigate("/");
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setBusy(false);
    }
  };

  // Con popup (navegador normal), la función devuelve el usuario ya
  // logueado: navegamos apenas resuelve. Con redirect (app instalada), la
  // página se recarga sola al volver; App.jsx decide a dónde ir.
  const handleSocial = async (fn) => {
    setError("");
    setBusy(true);
    try {
      const loggedInUser = await fn();
      if (loggedInUser) navigate("/");
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={7} lg={5} xl={4}>
          <div className="text-center mb-4">
            <img src="/logo-mark.png" alt="Aqua Metrics" height="72" style={{ objectFit: "contain" }} />
            <div className="fw-bold fs-4 text-white mt-2">Aqua Metrics</div>
            <div className="text-swim-muted small text-uppercase" style={{ letterSpacing: "0.1em" }}>
              Medí tu rendimiento
            </div>
            <h1 className="fw-bold fs-3 mt-3 text-white">Iniciar sesión</h1>
          </div>

          <Card className="swim-card p-3 p-sm-4">
            <Card.Body>
              {redirectError && (
                <Alert variant="danger" className="py-2 small" onClose={clearRedirectError} dismissible>
                  {traducirError(redirectError)}
                </Alert>
              )}
              <div className="d-grid gap-2 mb-3">
                <Button className="btn-swim-outline border" disabled={busy} onClick={() => handleSocial(loginWithGoogle)}>
                  Continuar con Google
                </Button>
                <Button className="btn-swim-outline border" disabled={busy} onClick={() => handleSocial(loginWithFacebook)}>
                  Continuar con Facebook
                </Button>
              </div>

              <div className="swim-lane-divider my-4" />

              <Form onSubmit={handleEmailLogin}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    placeholder="Correo electrónico"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Contraseña"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                <div className="d-grid">
                  <Button type="submit" className="btn-swim-cyan" disabled={busy}>
                    {busy ? <Spinner size="sm" animation="border" /> : "Ingresar"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-3 small text-swim-muted">
            ¿No tienes cuenta? <Link to="/register" className="text-swim-cyan">Regístrate</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

function traducirError(code) {
  const map = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/account-exists-with-different-credential":
      "Ya existe una cuenta con ese correo usando otro método de acceso.",
    "auth/unauthorized-domain": "Este dominio no está autorizado para el login social en Firebase.",
    "auth/network-request-failed": "Fallo de conexión. Intenta de nuevo.",
    "auth/popup-closed-by-user": "Se cerró la ventana antes de completar el inicio de sesión.",
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permití popups para este sitio e intenta de nuevo.",
    "auth/cancelled-popup-request": "Se canceló el intento anterior. Intenta de nuevo.",
  };
  return map[code] || "Ocurrió un error. Intenta de nuevo.";
}
