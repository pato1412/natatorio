// Los estilos de nado y las distancias ya NO viven acá: son administrables
// desde Firestore (colecciones "estilos" y "distancias"), ver
// src/hooks/useEstilos.js, src/hooks/useDistancias.js y
// src/pages/ConfiguracionAdmin.jsx.

export const MEDALLAS = ["🥇", "🥈", "🥉"];

export function formatTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);
  const pad = (n) => String(n).padStart(2, "0");
  if (m > 0) return `${m}:${pad(s)}.${pad(cs)}`;
  return `${s}.${pad(cs)}`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// Convierte un texto en un nombre de archivo seguro (sin tildes, espacios ni símbolos)
export function slugify(text) {
  return (text || "torneo")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "torneo";
}
