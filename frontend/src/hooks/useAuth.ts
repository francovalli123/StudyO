// Hook personalizado para leer el token desde LocalStorage y saber si el usuario está logeado

"use client";
import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);
  
  // Función para actualizar manualmente
  const updateAuth = () => {
    setToken(localStorage.getItem("token"));
  };
  
  return { 
    token, 
    isAuthenticated: !!token,
    updateAuth // Exponemos la función
  };
}