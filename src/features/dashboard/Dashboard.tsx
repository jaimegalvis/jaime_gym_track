import { useLiveQuery } from "dexie-react-hooks";
import { Play, Calendar, ChevronRight, Activity } from "lucide-react";
import { db } from "../../db/db";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  // Obtenemos los últimos 5 entrenamientos ordenados por fecha
  const recentWorkouts = useLiveQuery(() =>
    db.workouts.orderBy("date").reverse().limit(5).toArray(),
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-md mx-auto pb-10">
      {/* Encabezado */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hola, Jaime</h1>
          <p className="text-slate-400 text-sm">¿Qué entrenamos hoy?</p>
        </div>
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 shadow-inner">
          <Activity size={24} />
        </div>
      </header>

      {/* Botón Principal (Grande y fácil de tocar) */}
      <section>
        <button onClick={() => navigate('/routines')}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all shadow-lg shadow-blue-900/30">
          <div className="bg-white/20 p-5 rounded-full">
            <Play fill="currentColor" size={40} className="ml-2" />
          </div>
          <span className="text-2xl font-bold tracking-wide">
            Iniciar Entrenamiento
          </span>
        </button>
      </section>

      {/* Historial / Entrenamientos Recientes */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Calendar size={20} className="text-blue-400" />
          Últimos entrenamientos
        </h2>

        <div className="bg-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          {!recentWorkouts || recentWorkouts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p>Aún no tienes entrenamientos registrados.</p>
              <p className="text-sm mt-2">¡Tu progreso aparecerá aquí!</p>
            </div>
          ) : (
            recentWorkouts.map((workout, index) => (
              <button
                key={workout.id}
                className={`flex items-center justify-between p-5 text-left hover:bg-slate-700 active:bg-slate-700 transition-colors ${
                  index !== recentWorkouts.length - 1
                    ? "border-b border-slate-700/50"
                    : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-white text-lg">
                    {workout.date}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {workout.duration
                      ? `${Math.floor(workout.duration / 60)} min`
                      : "En progreso"}
                  </p>
                </div>
                <div className="bg-slate-700 p-2 rounded-full">
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
