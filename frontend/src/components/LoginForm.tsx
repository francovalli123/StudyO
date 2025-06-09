// Indica que este componente se ejecuta en el navegador del usuario (cliente).
"use client"

// Importa 'useState' de React para manejar el estado del componente.
import { useState } from "react"
import { useRouter } from "next/navigation"

// Define y exporta el componente del formulario de inicio de sesión.
export default function LoginForm() {
  // Crea estados para guardar el valor del email y la contraseña.
  const [email, setEmail] = useState("") // Guarda el email del usuario
  const [password, setPassword] = useState("") // Guarda la contraseña
  const router = useRouter() // Hook para manejar la navegación.

  // Esta función se ejecuta cuando el usuario envía el formulario.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault() // No recarga la página
    // TODO: Aquí conectar con backend para validar login
    router.push("/dashboard") // Redirige al dashboard
  }

  // Devuelve el HTML (JSX) que se mostrará en la página.
  return (
    // Cuando se envía este formulario, llama a la función 'handleSubmit'.
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Login</h2>
      
      {/* Campo para el correo electrónico */}
      <div className="form-field">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email} // El valor del input está conectado al estado 'email'.
          onChange={(e) => setEmail(e.target.value)} // Actualiza el estado cuando el usuario escribe.
          className="form-input"
          required // Hace que este campo sea obligatorio.
        />
      </div>

      {/* Campo para la contraseña */}
      <div className="form-field">
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          value={password} // El valor del input está conectado al estado 'password'.
          onChange={(e) => setPassword(e.target.value)} // Actualiza el estado cuando el usuario escribe.
          className="form-input"
          required // Hace que este campo sea obligatorio.
        />
      </div>

      {/* Botón para enviar el formulario */}
      <button
        type="submit"
        className="btn-primary mt-2"
      >
        Login
      </button>
    </form>
  )
} 