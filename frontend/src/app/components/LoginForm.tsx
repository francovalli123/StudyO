export default function LoginForm() {
    return (
    <form className="flex flex-col gap-4 max-w-sm mx-auto">
      <input type="email" placeholder="Email" className="p-2 rounded bg-zinc-800 text-white" />
      <input type="password" placeholder="Contraseña" className="p-2 rounded bg-zinc-800 text-white" />
      <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">Iniciar sesión</button>
    </form>
    )
}