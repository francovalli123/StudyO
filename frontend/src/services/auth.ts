// Archivo para las funciones que se encargan de hacer fetch al backend
// Este archivo NO renderiza nada, solo expone funciones como login, register o logout

export async function register(username: string, email: string, password: string) {
  const res = await fetch("http://127.0.0.1:8000/api/signup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  console.log("📥 Status response:", res.status);

   if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Error:", errorText);
    throw new Error(`Error en el registro: ${errorText}`);
  }
    
    const data = await res.json();

    console.log("✅ Respuesta exitosa:", data);

    return data; 
}

export async function login(username: string, password: string) {
  const res = await fetch("http://localhost:8000/api/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Error en el login");

  const data = await res.json();
  localStorage.setItem("token", data.token);
  return data;
}

export async function logout() {
  localStorage.removeItem("token");
}
