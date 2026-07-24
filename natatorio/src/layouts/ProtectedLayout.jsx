import React from "react";
import { Outlet } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";

export default function ProtectedLayout() {
  return (
    <div className="min-vh-100 swim-safe-bottom">
      <AppNavbar />
      <Outlet />
    </div>
  );
}
