import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/db';

export function RoutineSelection() {
  const navigate = useNavigate();
  // Traemos todas las rutinas de la base de datos
  const routines = useLiveQuery(() => db.routines.toArray());

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Selecciona tu rutina</h1>
      </header>

      <section className="flex flex-col gap-4">
        {!routines ? (
          <p className="text-slate-400 text-center mt-10">Cargando rutinas...</p>
        ) : routines.length === 0 ? (
          <p className="text-slate-400 text-center mt-10">No hay rutinas creadas.</p>
        ) : (
          routines.map((routine) => (
            <button
              key={routine.id}
              onClick={() => console.log('Próximo paso: Iniciar rutina', routine.id)}
              className="bg-slate-800 p-6 rounded-3xl flex items-center justify-between hover:bg-slate-700 active:bg-slate-700 transition-colors shadow-sm"
            >
              <span className="text-lg font-semibold text-white">{routine.name}</span>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Play fill="currentColor" size={20} className="text-blue-500" />
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}