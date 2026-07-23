export const ESTILOS = [
  { id: "libre", label: "Libre" },
  { id: "espalda", label: "Espalda" },
  { id: "pecho", label: "Pecho" },
  { id: "mariposa", label: "Mariposa" },
  { id: "combinado", label: "Combinado" },
];

export const DISTANCIAS = [50, 100, 200, 400];

export function estiloLabel(id) {
  return ESTILOS.find((e) => e.id === id)?.label || id;
}

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
