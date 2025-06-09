import Link from "next/link"

export default function Home() {
  return (
    <main className="home-container">
      <div>
        <h1 className="home-title">Bienvenido a Studyo</h1>
        <p className="home-subtitle">Organizá tu estudio. Dominá tu rutina.</p>
        <div className="btn-container">
          <Link href="/login"> {/* Va a la página de login */}
            <button className="btn bg-purple-600 text-white hover:bg-purple-700">
              Iniciar sesión
            </button>
          </Link>
          <Link href="/register"> {/* Va a la página de registro */}
            <button className="btn-secondary">Registrarse</button>
          </Link>
        </div>
      </div>
    </main>
  )
}
