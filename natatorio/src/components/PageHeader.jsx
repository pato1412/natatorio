import React from "react";
import { Container } from "react-bootstrap";

export default function PageHeader({ title, subtitle }) {
  return (
    <Container fluid="lg" className="pt-4 pb-3">
      <h1 className="fw-bold fs-4 mb-1">{title}</h1>
      {subtitle && <div className="text-swim-muted small mb-3">{subtitle}</div>}
      <div className="swim-lane-divider" />
    </Container>
  );
}
