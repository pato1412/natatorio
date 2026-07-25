import React from "react";
import { Container, Tabs, Tab } from "react-bootstrap";
import PageHeader from "../components/PageHeader";
import EstilosManager from "../components/admin/EstilosManager";
import DistanciasManager from "../components/admin/DistanciasManager";

export default function ConfiguracionAdmin() {
  return (
    <div className="min-vh-100 swim-safe-bottom">
      <PageHeader
        title="Configuración"
        subtitle="Estilos y distancias disponibles en el formulario de registro de tiempos"
      />
      <Container fluid="lg">
        <Tabs defaultActiveKey="estilos" className="swim-tabs mb-3">
          <Tab eventKey="estilos" title="Estilos">
            <EstilosManager />
          </Tab>
          <Tab eventKey="distancias" title="Distancias">
            <DistanciasManager />
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}
