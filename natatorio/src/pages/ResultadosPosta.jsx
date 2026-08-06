import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { Container, Button, Table, Spinner, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { formatTime, formatDate, slugify, MEDALLAS } from "../theme";
import { loadLogoDataUrl } from "../lib/pdfResultados";
import { buildResultadosPostaPdf } from "../lib/pdfResultadosPosta";
import PageHeader from "../components/PageHeader";

export default function ResultadosPosta() {
  const { postaId } = useParams();
  const [posta, setPosta] = useState(null);
  const [loadingPosta, setLoadingPosta] = useState(true);
  const [resultados, setResultados] = useState([]);
  const [loadingResultados, setLoadingResultados] = useState(true);
  const [shareMsg, setShareMsg] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    loadLogoDataUrl().then(setLogoDataUrl);
  }, []);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "postas", postaId));
      setPosta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingPosta(false);
    })();
  }, [postaId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "postas", postaId, "resultados"), (snap) => {
      setResultados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingResultados(false);
    });
    return unsub;
  }, [postaId]);

  // Si un equipo corrió más de una vez, nos quedamos con su mejor resultado
  // para el ranking general. El criterio depende del tipo de posta: si es
  // por distancia fija, gana el menor tiempo; si es por tiempo fijo, gana
  // la mayor distancia recorrida.
  const porDistancia = posta?.tipoLargo === "distancia";
  const esMejor = (a, b) => (porDistancia ? a.totalTimeMs < b.totalTimeMs : (a.totalDistancia || 0) > (b.totalDistancia || 0));

  const mejorPorEquipo = {};
  resultados.forEach((r) => {
    if (!mejorPorEquipo[r.equipoId] || esMejor(r, mejorPorEquipo[r.equipoId])) {
      mejorPorEquipo[r.equipoId] = r;
    }
  });
  const ranking = Object.values(mejorPorEquipo).sort((a, b) =>
    porDistancia ? a.totalTimeMs - b.totalTimeMs : (b.totalDistancia || 0) - (a.totalDistancia || 0)
  );

  const handleDownload = () => {
    const pdf = buildResultadosPostaPdf(posta, ranking, logoDataUrl);
    pdf.save(`resultados-posta-${slugify(posta?.nombre)}.pdf`);
  };

  const handleShare = async () => {
    setShareMsg("");
    const pdf = buildResultadosPostaPdf(posta, ranking, logoDataUrl);
    const blob = pdf.output("blob");
    const fileName = `resultados-posta-${slugify(posta?.nombre)}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Resultados — ${posta?.nombre}`,
          text: `Resultados de la posta ${posta?.nombre}`,
        });
      } catch (err) {
        // el usuario cerró el selector de compartir sin elegir nada
      }
    } else {
      pdf.save(fileName);
      setShareMsg("Tu navegador no soporta compartir archivos directamente, así que descargamos el PDF.");
    }
  };

  if (loadingPosta) {
    return (
      <Container fluid="lg" className="py-5 text-center">
        <Spinner animation="border" variant="info" />
      </Container>
    );
  }

  if (!posta) {
    return (
      <Container fluid="lg" className="py-5">
        <div className="small text-swim-muted mb-2">No se encontró la posta.</div>
        <Link to="/postas" className="text-swim-cyan small">← Volver a Postas</Link>
      </Container>
    );
  }

  return (
    <div>
      <PageHeader title={posta.nombre} subtitle={`Hoja de resultados · ${formatDate(posta.fecha)}`} icon="/logo-mark.png" />
      <Container fluid="lg" className="pb-5">
        <div className="mb-3 swim-no-print">
          <Link to="/postas" className="text-swim-cyan small">← Volver a Postas</Link>
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

        {loadingResultados ? (
          <div className="small text-swim-muted">Cargando resultados…</div>
        ) : ranking.length === 0 ? (
          <div className="small text-swim-muted">Todavía no hay resultados cargados para esta posta.</div>
        ) : (
          <>
            <div className="swim-card swim-results-block mb-4 p-3">
              <div className="fw-bold mb-2">Clasificación general</div>
              <div className="table-responsive">
                <Table className="swim-table align-middle mb-0" borderless>
                  <thead>
                    <tr className="text-swim-muted" style={{ fontSize: "0.75rem" }}>
                      <th style={{ width: 40 }}>#</th>
                      <th>EQUIPO</th>
                      <th>{porDistancia ? "TIEMPO TOTAL" : "DISTANCIA TOTAL"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((eq, i) => (
                      <tr key={eq.equipoId} className={i < 3 ? "swim-podium-row" : ""}>
                        <td className="text-swim-muted">{MEDALLAS[i] || i + 1}</td>
                        <td>{eq.equipoNombre || "—"}</td>
                        <td className="font-mono text-swim-cyan">
                          {porDistancia ? formatTime(eq.totalTimeMs) : `${eq.totalDistancia || 0} m`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {ranking.map((eq) => (
              <div key={eq.equipoId} className="swim-card swim-results-block mb-3 p-3">
                <div className="fw-bold mb-2">{eq.equipoNombre} — detalle de tramos</div>
                <div className="table-responsive">
                  <Table className="swim-table align-middle mb-0" borderless>
                    <thead>
                      <tr className="text-swim-muted" style={{ fontSize: "0.75rem" }}>
                        <th style={{ width: 60 }}>TRAMO</th>
                        <th>ATLETA</th>
                        <th>TIEMPO</th>
                        <th>ACUMULADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(eq.tramos || [])]
                        .sort((a, b) => a.orden - b.orden)
                        .map((t) => (
                          <tr key={t.orden}>
                            <td className="text-swim-muted">{t.orden}</td>
                            <td>{t.athleteName || "—"}</td>
                            <td className="font-mono text-swim-cyan">{formatTime(t.tiempoMs)}</td>
                            <td className="font-mono text-swim-muted">{formatTime(t.acumuladoMs)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ))}
          </>
        )}
      </Container>
    </div>
  );
}
