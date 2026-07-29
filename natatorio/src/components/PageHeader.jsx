import React from "react";
import { Container } from "react-bootstrap";

export default function PageHeader({ title, subtitle, icon }) {
  return (
    <Container fluid="lg" className="pt-4 pb-3">
      <div className="d-flex align-items-center gap-2 mb-1">
        {icon && <img src={icon} alt="" width="28" height="28" style={{ objectFit: "contain" }} />}
        <h1 className="fw-bold fs-4 m-0">{title}</h1>
      </div>
      {subtitle && <div className="text-swim-muted small mb-3">{subtitle}</div>}
      <div className="swim-lane-divider" />
    </Container>
  );
}
