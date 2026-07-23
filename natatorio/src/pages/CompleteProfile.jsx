import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

// Los proveedores sociales (Google/Facebook) no entregan edad, sexo ni rol,
// así que se piden aquí una sola vez, justo después del primer login.
export default function CompleteProfile() {
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("atleta");
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("femenino");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !age) {
      setError("Completa nombre completo y edad.");
      return;
    }
    setBusy(true);
    try {
      await saveProfile(user.uid, {
        fullName: fullName.trim(),
        age,
        sex,
        role,
        email: user.email,
      });
      navigate("/");
    } catch (err) {
      setError("No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={7} lg={5}>
          <div className="text-center mb-4">
            <div className="font-mono text-swim-cyan small swim-eyebrow">UN ÚLTIMO PASO</div>
            <h1 className="fw-bold fs-4 mt-1">Completa tu perfil</h1>
            <p className="text-swim-muted small mt-2">
              Necesitamos estos datos para configurar tu cuenta correctamente.
            </p>
          </div>

          <Card className="swim-card p-3 p-sm-4">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-swim-muted">Mi perfil es</Form.Label>
                  <div>
                    <ToggleButtonGroup type="radio" name="role" value={role} onChange={setRole} className="swim-chip-group d-flex gap-2">
                      <ToggleButton
                        id="cp-role-atleta"
                        value="atleta"
                        variant={role === "atleta" ? "info" : "outline-secondary"}
                        className={role === "atleta" ? "text-dark fw-bold" : ""}
                      >
                        Atleta
                      </ToggleButton>
                      <ToggleButton
                        id="cp-role-profesor"
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
                  <Form.Control value={user?.email || ""} disabled />
                </Form.Group>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <div className="d-grid">
                  <Button type="submit" className="btn-swim-cyan" disabled={busy}>
                    {busy ? <Spinner size="sm" animation="border" /> : "Guardar y continuar"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
