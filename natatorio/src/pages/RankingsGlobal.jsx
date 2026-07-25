import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useEstilos } from "../hooks/useEstilos";
import { useDistancias } from "../hooks/useDistancias";
import PageHeader from "../components/PageHeader";
import TopList from "../components/TopList";

export default function RankingsGlobal() {
  const { estilos, loading: loadingEstilos } = useEstilos();
  const { distancias, loading: loadingDistancias } = useDistancias();
  const [distancia, setDistancia] = useState(null);

  useEffect(() => {
    if (distancia === null && distancias.length) setDistancia(distancias[0].value);
  }, [distancias]); // eslint-disable-line

  return (
    <div>
      <PageHeader
        title="Rankings"
        subtitle="Los 10 mejores tiempos de cada estilo, entre todos los participantes"
      />
      <Container fluid="lg" className="pb-5">
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

        {loadingEstilos && <div className="small text-swim-muted">Cargando estilos…</div>}
        {!loadingEstilos && estilos.length === 0 && (
          <div className="small text-swim-muted">
            Todavía no hay estilos configurados. Un profesor puede cargarlos desde "Configuración".
          </div>
        )}
        {!loadingDistancias && distancias.length === 0 && (
          <div className="small text-swim-muted">
            Todavía no hay distancias configuradas. Un profesor puede cargarlas desde "Configuración".
          </div>
        )}

        {distancia && (
          <Row className="g-3">
            {estilos.map((e) => (
              <Col xs={12} md={6} key={e.id}>
                <TopList estiloId={e.id} estiloLabel={e.label} distancia={distancia} showAthleteName />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
