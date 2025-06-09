// Importa el componente que usaremos para mostrar cada materia.
import CardMateria from "@/components/CardMateria"

// Lista de materias (en el futuro vendrá de la base de datos)
const materias = [
  { nombre: "Álgebra", profesor: "Lic. Lucio", creditos: 5, progreso: 60 },
  { nombre: "Psicología", profesor: "Dra. Torres", creditos: 3, progreso: 90 },
  { nombre: "Historia Moderna", profesor: "Lic. Ana Gómez", creditos: 4, progreso: 75 }
]

// Esta es la página principal del Dashboard.
export default function DashboardPage() {
  return (
    <main className="dashboard-grid">
      {materias.map((materia, i) => ( // Crea una tarjeta por cada materia
        <CardMateria key={i} materia={materia} />
      ))}
    </main>
  )
}
