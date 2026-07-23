import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { registerWithEmail, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("atleta");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("femenino");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !age || !email || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail({ email, password, fullName: fullName.trim(), age, sex, role });
      navigate("/");
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setBusy(false);
    }
  };

  // Con Google/Facebook, el perfil (rol, edad, sexo) se completa después del login,
  // porque estos proveedores no entregan esos datos.
  const handleSocial = async (fn) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      navigate("/complete-profile");
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <div className="text-center mb-4">
            <div className="font-mono text-swim-cyan small swim-eyebrow">CARRIL DE TIEMPOS</div>
            <h1 className="fw-bold fs-3 mt-1">Crear cuenta</h1>
          </div>

          <Card className="swim-card p-3 p-sm-4">
            <Card.Body>
              <div className="d-grid gap-2 mb-3">
                <Button className="btn-swim-outline border" disabled={busy} onClick={() => handleSocial(loginWithGoogle)}>
                  Registrarme con Google
                </Button>
                <Button className="btn-swim-outline border" disabled={busy} onClick={() => handleSocial(loginWithFacebook)}>
                  Registrarme con Facebook
                </Button>
              </div>

              <div className="swim-lane-divider my-4" />

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-swim-muted">Quiero registrarme como</Form.Label>
                  <div>
                    <ToggleButtonGroup type="radio" name="role" value={role} onChange={setRole} className="swim-chip-group d-flex gap-2">
                      <ToggleButton
                        id="role-atleta"
                        value="atleta"
                        variant={role === "atleta" ? "info" : "outline-secondary"}
                        className={role === "atleta" ? "text-dark fw-bold" : ""}
                      >
                        Atleta
                      </ToggleButton>
                      <ToggleButton
                        id="role-profesor"
                        value="profesor"
                        variant={role === "profesor" ? "info" : "outline-secondary"}
                        className={role === "profesor" ? "text-dark fw-bold" : ""}
                      >
                        Profesor
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Control
                    placeholder="Nombre completo"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Form.Group>

                <Row className="mb-3 g-2">
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Edad"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Select value={sex} onChange={(e) => setSex(e.target.value)}>
                      <option value="femenino">Femenino</option>
                      <option value="masculino">Masculino</option>
                      <option value="otro">Otro</option>
                    </Form.Select>
                  </Col>
                </Row>

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
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <div className="d-grid">
                  <Button type="submit" className="btn-swim-cyan" disabled={busy}>
                    {busy ? <Spinner size="sm" animation="border" /> : "Crear cuenta"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-3 small text-swim-muted">
            ¿Ya tienes cuenta? <Link to="/login" className="text-swim-cyan">Inicia sesión</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

function traducirError(code) {
  const map = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/popup-closed-by-user": "Se cerró la ventana antes de completar el registro.",
  };
  return map[code] || "Ocurrió un error. Intenta de nuevo.";
}
