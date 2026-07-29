import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTime, formatDate } from "../theme";

// Colores de podio para la celda del puesto (oro, plata, bronce)
const MEDAL_FILL = [
  [242, 183, 5], // oro
  [201, 201, 206], // plata
  [205, 127, 50], // bronce
];
const MEDAL_TEXT = [
  [30, 20, 0], // texto oscuro sobre oro
  [30, 30, 30], // texto oscuro sobre plata
  [255, 255, 255], // texto blanco sobre bronce
];

// Descarga la imagen del logo y la devuelve como data URL en base64, lista
// para pasarle a jsPDF. Si falla (sin conexión, etc.), devuelve null y el
// PDF se genera igual, sin el logo.
export async function loadLogoDataUrl(url = "/logo-mark.png") {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

// Arma el PDF de la hoja de resultados a partir del torneo y los grupos ya
// ordenados (uno por estilo/distancia, cada uno con sus filas de tiempos
// ordenadas de más rápido a más lento). logoDataUrl es opcional.
export function buildResultadosPdf(torneo, groups, logoDataUrl) {
  const docPdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 40;
  const pageBottom = 780;

  // Logo + encabezado
  let textX = marginLeft;
  if (logoDataUrl) {
    try {
      docPdf.addImage(logoDataUrl, "PNG", marginLeft, 20, 34, 41);
      textX = marginLeft + 46;
    } catch (err) {
      // si la imagen no es válida, seguimos sin logo
    }
  }

  docPdf.setFontSize(10);
  docPdf.setTextColor(13, 110, 115);
  docPdf.text("AQUA METRICS", textX, 30);

  docPdf.setFontSize(16);
  docPdf.setTextColor(20, 20, 20);
  docPdf.text(torneo?.nombre || "Torneo", textX, 48);

  docPdf.setFontSize(10);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text(torneo?.fecha ? formatDate(torneo.fecha) : "", textX, 62);

  let y = 80;
  if (torneo?.descripcion) {
    docPdf.text(torneo.descripcion, textX, 76);
    y = 92;
  }
  docPdf.setTextColor(20, 20, 20);

  if (groups.length === 0) {
    docPdf.setFontSize(11);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Todavía no hay tiempos registrados en este torneo.", marginLeft, y);
  }

  groups.forEach((g) => {
    if (y > pageBottom - 60) {
      docPdf.addPage();
      y = 40;
    }
    docPdf.setFontSize(12);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text(`${g.estiloLabel} · ${g.distancia} m`, marginLeft, y);

    autoTable(docPdf, {
      startY: y + 8,
      head: [["#", "Atleta", "Tiempo"]],
      body: g.rows.map((r, i) => [String(i + 1), r.athleteName || "—", formatTime(r.timeMs)]),
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

    y = docPdf.lastAutoTable.finalY + 26;
  });

  return docPdf;
}
