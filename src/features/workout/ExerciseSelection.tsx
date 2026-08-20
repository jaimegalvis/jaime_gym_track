import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus } from 'lucide-react';
import { db } from '../../db/db';

export function ExerciseSelection() {
  // Extraemos el ID del entrenamiento y el ID del músculo desde la URL
  const { id, muscleId } = useParams();
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    if (!muscleId) return null;
    
    const muscle = await db.muscleGroups.get(muscleId);
    // Filtramos el catálogo para traer solo los ejercicios de este músculo
    const exercises = await db.exercises
      .where('muscleGroupId')
      .equals(muscleId)
      .toArray();

    return { muscle, exercises };
  }, [muscleId]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando ejercicios...</div>;

  const { muscle, exercises } = data;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} // Vuelve a la pantalla anterior
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Ejercicios</h1>
          <p className="text-sm text-blue-400">{muscle?.name}</p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        {exercises.length === 0 ? (
          <p className="text-slate-400 text-center mt-10">No hay ejercicios para este grupo.</p>
        ) : (
          exercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={async () => {
                // 1. Verificamos si ya habías empezado este ejercicio hoy
                let currentWorkoutExercise = await db.workoutExercises
                  .where('workoutId').equals(id!)
                  .and(we => we.exerciseId === exercise.id)
                  .first();

                // 2. Si es la primera vez que lo tocas hoy, lo creamos
                if (!currentWorkoutExercise) {
                  const newId = crypto.randomUUID();
                  await db.workoutExercises.add({
                    id: newId,
                    workoutId: id!,
                    exerciseId: exercise.id,
                    muscleGroupId: muscleId!,
                    completed: false
                  });
                  currentWorkoutExercise = { id: newId } as any;
                }

                // 3. Navegamos a la pantalla de registro de series
                navigate(`/workout/${id}/exercise/${currentWorkoutExercise.id}`);
              }}
              className="bg-slate-800 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-700 active:bg-slate-700 transition-colors shadow-sm"
            >
              <span className="text-lg font-medium text-white">{exercise.name}</span>
              <div className="bg-slate-700 p-2 rounded-full">
                <Plus size={20} className="text-slate-300" />
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}