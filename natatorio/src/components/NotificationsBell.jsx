import React from "react";
import { Dropdown, Badge } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user.uid);

  return (
    <Dropdown align="end" onToggle={(open) => open && markAllAsRead()}>
      <Dropdown.Toggle
        as="button"
        className="btn btn-swim-outline border position-relative"
        style={{ minWidth: 44 }}
        id="notifications-bell"
      >
        🔔
        {unreadCount > 0 && (
          <Badge
            bg="warning"
            className="text-dark position-absolute top-0 start-100 translate-middle rounded-pill"
            style={{ fontSize: "0.65rem" }}
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="p-0"
        style={{ minWidth: 300, maxWidth: "90vw", background: "var(--swim-panel)", border: "1px solid var(--swim-border)" }}
      >
        <div className="px-3 py-2 border-bottom border-secondary-subtle small fw-bold text-swim-muted text-uppercase">
          Notificaciones
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div className="px-3 py-3 small text-swim-muted">No tienes notificaciones todavía.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="px-3 py-2 border-bottom"
                style={{ borderColor: "var(--swim-border)", cursor: "pointer" }}
                onClick={() => markAsRead(n.id)}
              >
                <div className="d-flex align-items-start gap-2">
                  <span>🏆</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="small text-white">{n.message}</div>
                    <div className="text-swim-muted" style={{ fontSize: "0.7rem" }}>
                      {timeAgo(n.createdAtIso)}
                    </div>
                  </div>
                  {!n.read && (
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{ width: 8, height: 8, background: "var(--swim-cyan)", marginTop: 4 }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}
