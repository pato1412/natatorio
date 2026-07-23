import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import AtletaDashboard from "./pages/AtletaDashboard";

function LoadingScreen() {
  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <Spinner animation="border" variant="info" className="mb-2" />
        <div className="font-mono text-swim-cyan small">CARGANDO…</div>
      </div>
    </Container>
  );
}

function Gate({ children }) {
  const { user, profile, loading, needsProfile } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsProfile) return <Navigate to="/complete-profile" replace />;
  if (!profile) return <LoadingScreen />;
  return children;
}

function Home() {
  const { profile } = useAuth();
  if (profile?.role === "profesor") return <ProfesorDashboard />;
  return <AtletaDashboard />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/" element={<Gate><Home /></Gate>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
