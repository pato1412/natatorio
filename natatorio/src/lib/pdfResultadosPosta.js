import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTime, formatDate } from "../theme";

const MEDAL_FILL = [
  [242, 183, 5], // oro
  [201, 201, 206], // plata
  [205, 127, 50], // bronce
];
const MEDAL_TEXT = [
  [30, 20, 0],
  [30, 30, 30],
  [255, 255, 255],
];

// equiposRanking: array de { equipoId, equipoNombre, totalTimeMs, totalDistancia, tramos }
// ya ordenado de mejor a peor según el tipo de posta. logoDataUrl es
// opcional (ver loadLogoDataUrl en pdfResultados.js).
export function buildResultadosPostaPdf(posta, equiposRanking, logoDataUrl) {
  const docPdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 40;
  const pageBottom = 780;
  const porDistancia = posta?.tipoLargo === "distancia";

  let textX = marginLeft;
  if (logoDataUrl) {
    try {
      docPdf.addImage(logoDataUrl, "PNG", marginLeft, 20, 34, 41);
      textX = marginLeft + 46;
    } catch (err) {
      // sin logo si la imagen no es válida
    }
  }

  docPdf.setFontSize(10);
  docPdf.setTextColor(13, 110, 115);
  docPdf.text("AQUA METRICS", textX, 30);

  docPdf.setFontSize(16);
  docPdf.setTextColor(20, 20, 20);
  docPdf.text(posta?.nombre || "Posta", textX, 48);

  docPdf.setFontSize(10);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text(posta?.fecha ? formatDate(posta.fecha) : "", textX, 62);

  const largoTexto =
    posta?.tipoLargo === "distancia"
      ? `${posta.valorLargo} m totales · tramos de ${posta.distanciaTramo} m`
      : `${posta?.valorLargo} min · tramos de ${posta?.distanciaTramo} m`;
  docPdf.text(largoTexto, textX, 76);

  let y = 100;
  docPdf.setTextColor(20, 20, 20);

  if (equiposRanking.length === 0) {
    docPdf.setFontSize(11);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Todavía no hay resultados cargados para esta posta.", marginLeft, y);
    return docPdf;
  }

  // Tabla principal: ranking de equipos
  docPdf.setFontSize(12);
  docPdf.setTextColor(20, 20, 20);
  docPdf.text("Clasificación general", marginLeft, y);

  autoTable(docPdf, {
    startY: y + 8,
    head: [["#", "Equipo", porDistancia ? "Tiempo total" : "Distancia total"]],
    body: equiposRanking.map((eq, i) => [
      String(i + 1),
      eq.equipoNombre || "—",
      porDistancia ? formatTime(eq.totalTimeMs) : `${eq.totalDistancia || 0} m`,
    ]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [7, 28, 44], textColor: [255, 255, 255] },
    margin: { left: marginLeft, right: marginLeft },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const idx = data.row.index;
      if (idx > 2) return;
      if (data.column.index === 0) {
        data.cell.styles.fillColor = MEDAL_FILL[idx];
        data.cell.styles.textColor = MEDAL_TEXT[idx];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.halign = "center";
      } else {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = docPdf.lastAutoTable.finalY + 30;

  // Detalle de tramos por equipo, en el mismo orden del ranking
  equiposRanking.forEach((eq) => {
    if (y > pageBottom - 60) {
      docPdf.addPage();
      y = 40;
    }
    docPdf.setFontSize(11);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text(`${eq.equipoNombre} — detalle de tramos`, marginLeft, y);

    const tramosOrdenados = [...(eq.tramos || [])].sort((a, b) => a.orden - b.orden);
    autoTable(docPdf, {
      startY: y + 8,
      head: [["Tramo", "Atleta", "Tiempo", "Acumulado"]],
      body: tramosOrdenados.map((t) => [
        String(t.orden),
        t.athleteName || "—",
        formatTime(t.tiempoMs),
        formatTime(t.acumuladoMs),
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [18, 52, 73], textColor: [255, 255, 255] },
      margin: { left: marginLeft, right: marginLeft },
    });
    y = docPdf.lastAutoTable.finalY + 24;
  });

  return docPdf;
}
