"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Componente para el formulario de registro.
export default function RegisterForm() {
  const [name, setName] = useState(""); // Nombre del usuario
  const [email, setEmail] = useState(""); // Email del usuario
  const [password, setPassword] = useState(""); // Contraseña del usuario
  const router = useRouter();

  // Se ejecuta al enviar el formulario.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // No recarga la página
    // TODO: Aquí conectar con backend para registrar usuario
    console.log("Datos:", { name, email, password }); // Muestra los datos en consola
    router.push("/login"); // Después del registro va al login
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Registro</h2>
      <div className="form-field">
        <label htmlFor="name" className="form-label">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)} // Actualiza el estado
          className="form-input"
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Actualiza el estado
          className="form-input"
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Actualiza el estado
          className="form-input"
          required
        />
      </div>
      <button type="submit" className="btn-primary mt-2">
        Registrarse
      </button>
    </form>
  );
} 