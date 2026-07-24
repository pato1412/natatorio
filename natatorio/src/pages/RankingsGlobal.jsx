import React, { useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useEstilos } from "../hooks/useEstilos";
import { DISTANCIAS } from "../theme";
import PageHeader from "../components/PageHeader";
import TopList from "../components/TopList";

export default function RankingsGlobal() {
  const { estilos, loading } = useEstilos();
  const [distancia, setDistancia] = useState(50);

  return (
    <div>
      <PageHeader
        title="Rankings"
        subtitle="Los 10 mejores tiempos de cada estilo, entre todos los participantes"
      />
      <Container fluid="lg" className="pb-5">
        <div className="d-flex flex-wrap gap-2 mb-4">
          {DISTANCIAS.map((d) => (
            <Button
              key={d}
              className="rounded-pill swim-tap-chip"
              variant={distancia === d ? "warning" : "outline-secondary"}
              onClick={() => setDistancia(d)}
            >
              {d} m
            </Button>
          ))}
        </div>

        {loading && <div className="small text-swim-muted">Cargando estilos…</div>}
        {!loading && estilos.length === 0 && (
          <div className="small text-swim-muted">
            Todavía no hay estilos configurados. Un profesor puede cargarlos desde "Administrar estilos".
          </div>
        )}

        <Row className="g-3">
          {estilos.map((e) => (
            <Col xs={12} md={6} key={e.id}>
              <TopList estiloId={e.id} estiloLabel={e.label} distancia={distancia} showAthleteName />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}
