import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { db } from '../../db/db';

export function WorkoutSummary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    if (!id) return null;
    const workout = await db.workouts.get(id);
    if (!workout) return null;
    
      const routine = useLiveQuery(() => db.routines.get(workout?.routineId || ''));
    
    // Obtenemos todos los ejercicios realizados en este entrenamiento
    const workoutExercises = await db.workoutExercises.where('workoutId').equals(id).toArray();
    
    // Por cada ejercicio, buscamos su nombre y las series que completaste
    const details = await Promise.all(workoutExercises.map(async (we) => {
      const exercise = await db.exercises.get(we.exerciseId);
      const sets = await db.sets.where('workoutExerciseId').equals(we.id).toArray();
      sets.sort((a, b) => a.setNumber - b.setNumber);
      return { we, exercise, sets };
    }));

    return { workout, routine, details };
  }, [id]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando resumen...</div>;

  const { workout, routine, details } = data;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Resumen de sesión</h1>
          <p className="text-sm text-blue-400">{routine?.name}</p>
        </div>
      </header>

      {/* Tarjeta de métricas generales */}
      <div className="flex gap-6 bg-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar size={18} className="text-blue-400" />
          <span className="font-medium">{workout.date}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={18} className="text-blue-400" />
          <span className="font-medium">{workout.duration ? Math.floor(workout.duration / 60) : 0} min</span>
        </div>
      </div>

      {/* Lista de ejercicios realizados */}
      <section className="flex flex-col gap-4">
        {details.map(({ we, exercise, sets }) => (
          <div key={we.id} className="bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-700/50">
            <h3 className="font-bold text-white mb-3 flex items-center justify-between">
              {exercise?.name}
              {we.completed && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full border border-green-900">Completado</span>}
            </h3>
            
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 text-center pb-2 border-b border-slate-700">
                <span>Serie</span>
                <span>kg/lb</span>
                <span>Reps</span>
                <span>Estado</span>
              </div>
              
              {sets.map((set, index) => (
                <div key={set.id} className="grid grid-cols-4 text-sm text-center items-center py-1.5">
                  <span className="text-slate-400 font-bold">{index + 1}</span>
                  <span className="text-slate-200 bg-slate-900/50 py-1 rounded">{set.weight}</span>
                  <span className="text-slate-200 bg-slate-900/50 py-1 rounded">{set.reps}</span>
                  <span className="flex justify-center">
                    {set.completed ? (
                      <span className="text-green-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </span>
                </div>
              ))}
              {sets.length === 0 && <p className="text-sm text-slate-500 text-center mt-2">No se registraron series.</p>}
            </div>
          </div>
        ))}
        {details.length === 0 && <p className="text-slate-400 text-center">No registraste ejercicios en esta sesión.</p>}
      </section>
    </div>
  );
}