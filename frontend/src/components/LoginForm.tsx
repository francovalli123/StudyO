"use client"; // Esto indica que es Client Component

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.non_field_errors?.[0] || "Usuario o contraseña incorrectos");
      } else {
        // ⚠ Solo usar localStorage en funciones que se ejecutan en el cliente
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
        }
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Login</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="form-field">
        <label htmlFor="username" className="form-label">Usuario</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="password" className="form-label">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <button type="submit" className="btn-primary mt-2" disabled={loading}>
        {loading ? "Iniciando..." : "Login"}
      </button>
    </form>
  );
}
