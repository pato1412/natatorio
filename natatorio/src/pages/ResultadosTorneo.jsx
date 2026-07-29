import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Container, Button, Table, Spinner, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { formatTime, formatDate, slugify, MEDALLAS } from "../theme";
import { buildResultadosPdf, loadLogoDataUrl } from "../lib/pdfResultados";
import PageHeader from "../components/PageHeader";

export default function ResultadosTorneo() {
  const { torneoId } = useParams();
  const [torneo, setTorneo] = useState(null);
  const [loadingTorneo, setLoadingTorneo] = useState(true);
  const [times, setTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [shareMsg, setShareMsg] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    loadLogoDataUrl().then(setLogoDataUrl);
  }, []);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "torneos", torneoId));
      setTorneo(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingTorneo(false);
    })();
  }, [torneoId]);

  useEffect(() => {
    const q = query(collection(db, "times"), where("torneoId", "==", torneoId));
    const unsub = onSnapshot(q, (snap) => {
      setTimes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingTimes(false);
    });
    return unsub;
  }, [torneoId]);

  // Agrupa los tiempos por estilo + distancia, y ordena cada grupo de más
  // rápido a más lento (y los grupos por estilo y después por distancia).
  const groupsMap = {};
  times.forEach((t) => {
    const key = `${t.estiloLabel || t.estilo}__${t.distancia}`;
    if (!groupsMap[key]) {
      groupsMap[key] = { estiloLabel: t.estiloLabel || t.estilo, distancia: t.distancia, rows: [] };
    }
    groupsMap[key].rows.push(t);
  });
  const groups = Object.values(groupsMap)
    .map((g) => ({ ...g, rows: [...g.rows].sort((a, b) => a.timeMs - b.timeMs) }))
    .sort((a, b) => a.estiloLabel.localeCompare(b.estiloLabel) || a.distancia - b.distancia);

  const handleDownload = () => {
    const pdf = buildResultadosPdf(torneo, groups, logoDataUrl);
    pdf.save(`resultados-${slugify(torneo?.nombre)}.pdf`);
  };

  const handleShare = async () => {
    setShareMsg("");
    const pdf = buildResultadosPdf(torneo, groups, logoDataUrl);
    const blob = pdf.output("blob");
    const fileName = `resultados-${slugify(torneo?.nombre)}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Resultados — ${torneo?.nombre}`,
          text: `Resultados de ${torneo?.nombre}`,
        });
      } catch (err) {
        // el usuario cerró el selector de compartir sin elegir nada: no hacer nada
      }
    } else {
      // el navegador no soporta compartir archivos (típico en desktop): se descarga directo
      pdf.save(fileName);
      setShareMsg("Tu navegador no soporta compartir archivos directamente, así que descargamos el PDF.");
    }
  };

  if (loadingTorneo) {
    return (
      <Container fluid="lg" className="py-5 text-center">
        <Spinner animation="border" variant="info" />
      </Container>
    );
  }

  if (!torneo) {
    return (
      <Container fluid="lg" className="py-5">
        <div className="small text-swim-muted mb-2">No se encontró el torneo.</div>
        <Link to="/torneos" className="text-swim-cyan small">← Volver a Torneos</Link>
      </Container>
    );
  }

  return (
    <div>
      <PageHeader title={torneo.nombre} subtitle={`Hoja de resultados · ${formatDate(torneo.fecha)}`} icon="/logo-mark.png" />
      <Container fluid="lg" className="pb-5">
        <div className="mb-3 swim-no-print">
          <Link to="/torneos" className="text-swim-cyan small">← Volver a Torneos</Link>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-4 swim-no-print">
          <Button className="btn-swim-cyan" onClick={handleDownload}>
            Descargar PDF
          </Button>
          <Button className="btn-swim-outline border" onClick={handleShare}>
            Compartir
          </Button>
          <Button className="btn-swim-outline border" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>

        {shareMsg && (
          <Alert variant="warning" className="py-2 small swim-no-print" onClose={() => setShareMsg("")} dismissible>
            {shareMsg}
          </Alert>
        )}

        {loadingTimes ? (
          <div className="small text-swim-muted">Cargando resultados…</div>
        ) : groups.length === 0 ? (
          <div className="small text-swim-muted">Todavía no hay tiempos registrados en este torneo.</div>
        ) : (
          groups.map((g) => (
            <div key={`${g.estiloLabel}-${g.distancia}`} className="swim-card swim-results-block mb-3 p-3">
              <div className="fw-bold mb-2">
                {g.estiloLabel} · {g.distancia} m
              </div>
              <div className="table-responsive">
                <Table className="swim-table align-middle mb-0" borderless>
                  <thead>
                    <tr className="text-swim-muted" style={{ fontSize: "0.75rem" }}>
                      <th style={{ width: 40 }}>#</th>
                      <th>ATLETA</th>
                      <th>TIEMPO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={r.id} className={i < 3 ? "swim-podium-row" : ""}>
                        <td className="text-swim-muted">{MEDALLAS[i] || i + 1}</td>
                        <td>{r.athleteName || "—"}</td>
                        <td className="font-mono text-swim-cyan">{formatTime(r.timeMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ))
        )}
      </Container>
    </div>
  );
}
