import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import ProtectedLayout from "./layouts/ProtectedLayout";
import RankingsGlobal from "./pages/RankingsGlobal";
import TopMarks from "./pages/TopMarks";
import ProfesorDashboard from "./pages/ProfesorDashboard";
import AtletaDashboard from "./pages/AtletaDashboard";
import ConfiguracionAdmin from "./pages/ConfiguracionAdmin";
import Torneos from "./pages/Torneos";
import ResultadosTorneo from "./pages/ResultadosTorneo";
import Postas from "./pages/Postas";
import EquiposPosta from "./pages/EquiposPosta";
import CronometroPosta from "./pages/CronometroPosta";
import ResultadosPosta from "./pages/ResultadosPosta";

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
  const { user, profile, loading, needsProfile, redirectPending } = useAuth();

  if (loading || redirectPending) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsProfile) return <Navigate to="/complete-profile" replace />;
  if (!profile) return <LoadingScreen />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading, redirectPending } = useAuth();
  if (loading || redirectPending) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function ProfesorOnly({ children }) {
  const { profile } = useAuth();
  if (profile?.role !== "profesor") return <Navigate to="/" replace />;
  return children;
}

function AtletaOnly({ children }) {
  const { profile } = useAuth();
  if (profile?.role !== "atleta") return <Navigate to="/" replace />;
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

          <Route
            element={
              <Gate>
                <ProtectedLayout />
              </Gate>
            }
          >
            <Route path="/" element={<RankingsGlobal />} />
            <Route path="/marcas" element={<TopMarks />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/torneos/:torneoId/resultados" element={<ResultadosTorneo />} />
            <Route path="/postas" element={<Postas />} />
            <Route path="/postas/:postaId/resultados" element={<ResultadosPosta />} />
            <Route path="/postas/:postaId/equipos" element={<EquiposPosta />} />
            <Route
              path="/postas/:postaId/cronometro"
              element={
                <ProfesorOnly>
                  <CronometroPosta />
                </ProfesorOnly>
              }
            />
            <Route
              path="/historial"
              element={
                <AtletaOnly>
                  <AtletaDashboard />
                </AtletaOnly>
              }
            />
            <Route
              path="/registrar"
              element={
                <ProfesorOnly>
                  <ProfesorDashboard />
                </ProfesorOnly>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProfesorOnly>
                  <ConfiguracionAdmin />
                </ProfesorOnly>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
