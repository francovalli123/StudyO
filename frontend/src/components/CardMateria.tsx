// Tipo de datos para una materia
type Materia = {
  nombre: string;
  profesor: string;
  creditos: number;
  progreso: number;
};

export default function CardMateria({ materia }: { materia: Materia }) {
  return (
    <div className="materia-card">
      <h2 className="materia-card-title">{materia.nombre}</h2>
      <p className="materia-card-profesor">{materia.profesor}</p>
      <p className="materia-card-creditos">Créditos: {materia.creditos}</p>

      {/* Barra de progreso */}
      <div className="materia-card-progress-container">
        <div
          className="materia-card-progress-bar"
          style={{ width: `${materia.progreso}%` }} // Ancho según progreso
        />
      </div>
      <p className="materia-card-progress-text">{materia.progreso}%</p>
    </div>
  );
}
