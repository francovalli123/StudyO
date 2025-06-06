import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center text-center">
      <div>
        <h1 className="text-4xl font-bold">Bienvenido a Studyo</h1>
        <p className="mt-4">Organizá tu estudio. Dominá tu rutina.</p>
        <Link href="/login">
          <button className="mt-6 px-4 py-2 bg-purple-600 rounded text-white">Iniciar sesión</button>
        </Link>
      </div>
    </main>
  )
}
