import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useEstilos } from "../hooks/useEstilos";
import { useDistancias } from "../hooks/useDistancias";
import { useTorneos } from "../hooks/useTorneos";
import PageHeader from "../components/PageHeader";
import TopList from "../components/TopList";

// "" = general (todos los contextos), "practica" = solo práctica, o el id de un torneo puntual
function resolveTorneoFilter(value) {
  if (value === "") return undefined;
  if (value === "practica") return null;
  return value;
}

export default function TopMarks() {
  const { user, profile } = useAuth();
  const isProfesor = profile?.role === "profesor";
  const { estilos, loading: loadingEstilos } = useEstilos();
  const { distancias, loading: loadingDistancias } = useDistancias();
  const { torneos } = useTorneos({ onlyActive: false });
  const [distancia, setDistancia] = useState(null);
  const [contexto, setContexto] = useState("");
  const [athletes, setAthletes] = useState([]);
  const [athleteId, setAthleteId] = useState("");

  useEffect(() => {
    if (distancia === null && distancias.length) setDistancia(distancias[0].value);
  }, [distancias]); // eslint-disable-line

  useEffect(() => {
    if (!isProfesor) return;
    const q = query(collection(db, "users"), where("role", "==", "atleta"));
    const unsub = onSnapshot(q, (snap) => {
      setAthletes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [isProfesor]);

  useEffect(() => {
    if (isProfesor && !athleteId && athletes.length) setAthleteId(athletes[0].id);
  }, [athletes, isProfesor]); // eslint-disable-line

  const targetAthleteId = isProfesor ? athleteId : user.uid;
  const torneoFilter = resolveTorneoFilter(contexto);

  return (
    <div>
      <PageHeader
        title={isProfesor ? "Marcas por atleta" : "Mis mejores marcas"}
        subtitle="Los 10 mejores tiempos de cada estilo"
      />
      <Container fluid="lg" className="pb-5">
        {isProfesor && (
          <Form.Select
            className="mb-3 swim-input"
            style={{ maxWidth: 320 }}
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
          >
            {athletes.length === 0 && <option value="">Todavía no hay atletas registrados</option>}
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName}
              </option>
            ))}
          </Form.Select>
        )}

        <Form.Select
          className="mb-3 swim-input"
          style={{ maxWidth: 320 }}
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
        >
          <option value="">General (prácticas y torneos)</option>
          <option value="practica">Solo prácticas</option>
          {torneos.map((t) => (
            <option key={t.id} value={t.id}>
              Torneo: {t.nombre}
            </option>
          ))}
        </Form.Select>

        <div className="d-flex flex-wrap gap-2 mb-4">
          {loadingDistancias && <span className="small text-swim-muted">Cargando distancias…</span>}
          {distancias.map((d) => (
            <Button
              key={d.id}
              className="rounded-pill swim-tap-chip"
              variant={distancia === d.value ? "warning" : "outline-secondary"}
              onClick={() => setDistancia(d.value)}
            >
              {d.value} m
            </Button>
          ))}
        </div>

        {!targetAthleteId ? (
          <div className="small text-swim-muted">Selecciona un atleta para ver sus marcas.</div>
        ) : (
          <>
            {loadingEstilos && <div className="small text-swim-muted">Cargando estilos…</div>}
            {distancia && (
              <Row className="g-3">
                {estilos.map((e) => (
                  <Col xs={12} md={6} key={e.id}>
                    <TopList
                      estiloId={e.id}
                      estiloLabel={e.label}
                      distancia={distancia}
                      athleteId={targetAthleteId}
                      torneoFilter={torneoFilter}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
