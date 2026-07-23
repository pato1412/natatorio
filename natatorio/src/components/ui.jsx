import React from "react";
import { COLORS, FONT_BODY } from "../theme";

export function Panel({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bgPanel,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Label({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: COLORS.textMuted,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function Chip({ active, onClick, children, color = COLORS.cyan }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 13,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? color : COLORS.line}`,
        background: active ? color : "transparent",
        color: active ? COLORS.bgDeep : COLORS.textMuted,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        fontFamily: FONT_BODY,
        fontSize: 14,
        color: COLORS.textPrimary,
        background: COLORS.bgPanelAlt,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 10,
        padding: "10px 12px",
        ...(props.style || {}),
      }}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 14,
        color: COLORS.textPrimary,
        background: COLORS.bgPanelAlt,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 10,
        padding: "10px 12px",
        ...(props.style || {}),
      }}
    >
      {props.children}
    </select>
  );
}

export function PrimaryButton({ children, style, ...rest }) {
  return (
    <button
      {...rest}
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 800,
        fontSize: 14,
        padding: "12px 16px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        color: COLORS.bgDeep,
        background: COLORS.cyan,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, style, ...rest }) {
  return (
    <button
      {...rest}
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 13,
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${COLORS.line}`,
        cursor: "pointer",
        color: COLORS.textPrimary,
        background: "transparent",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function LaneDivider() {
  const segs = new Array(24).fill(0);
  return (
    <div style={{ display: "flex", height: 6, width: "100%", borderRadius: 3, overflow: "hidden" }}>
      {segs.map((_, i) => (
        <div
          key={i}
          style={{ flex: 1, background: i % 2 === 0 ? COLORS.cyan : COLORS.coral, opacity: 0.55 }}
        />
      ))}
    </div>
  );
}
