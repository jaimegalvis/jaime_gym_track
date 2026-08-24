import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, ChevronRight, Dumbbell } from 'lucide-react';

export function ExerciseSelection() {
  // Extraemos ambos IDs de la URL
  const { workoutId, muscleGroupId } = useParams();
  const navigate = useNavigate();

  // Buscamos el nombre del músculo y filtramos los ejercicios
  const data = useLiveQuery(async () => {
    if (!muscleGroupId) return null;
    
    const muscle = await db.muscleGroups.get(muscleGroupId);
    
    // Aquí ocurre la magia de Dexie: busca dentro de los arreglos automáticamente
    const availableExercises = await db.exercises
      .where('muscleGroupIds')
      .equals(muscleGroupId)
      .toArray();

    return { muscle, availableExercises };
  }, [muscleGroupId]);

  const handleSelectExercise = async (exerciseId: string) => {
    if (!workoutId || !muscleGroupId) return;

    const workoutExerciseId = crypto.randomUUID();
    
    // Registramos que vas a hacer este ejercicio en la sesión de hoy
    await db.workoutExercises.add({
      id: workoutExerciseId,
      workoutId: workoutId,
      exerciseId: exerciseId,
      muscleGroupId: muscleGroupId,
      completed: false
    });

    // Te llevaremos a la pantalla final de registrar series (próximo paso)
    console.log('Próximo paso: Anotar series para el id:', workoutExerciseId);
    // navigate(`/workout/${workoutId}/track/${workoutExerciseId}`);
  };

  if (!data) return <div className="p-6 text-slate-400 text-center mt-10">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Seleccionar Ejercicio</h1>
          <p className="text-sm text-blue-400">{data.muscle?.name}</p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        {data.availableExercises.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-3xl text-center flex flex-col items-center gap-3">
            <Dumbbell size={32} className="text-slate-500" />
            <p className="text-slate-300 font-medium">No hay ejercicios para este músculo.</p>
            <p className="text-sm text-slate-500">Ve a tu Biblioteca para añadir nuevos.</p>
          </div>
        ) : (
          data.availableExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => handleSelectExercise(exercise.id)}
              className="bg-slate-800 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-700 active:bg-slate-700 transition-colors shadow-sm"
            >
              <span className="text-lg font-semibold text-white">{exercise.name}</span>
              <div className="bg-slate-700 p-2 rounded-full">
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}