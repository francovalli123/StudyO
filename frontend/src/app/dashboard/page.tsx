"use client";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null; // Evita renderizar si no está logueado

  return <h1>Bienvenido al Dashboard 🚀</h1>;
}
