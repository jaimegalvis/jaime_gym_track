import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { saveWorkoutSession, clearWorkoutSession } from '../../utils/session';

export function WorkoutHub() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Guardamos la sesión activa para que el usuario pueda recuperarla de inmediato
  useEffect(() => {
    if (id) {
      saveWorkoutSession(id, `/workout/${id}`);
    }
  }, [id]);

  // Obtenemos todos los datos necesarios para esta sesión de entrenamiento
  const data = useLiveQuery(async () => {
    if (!id) return null;

    const workout = await db.workouts.get(id);
    if (!workout) return null;

    const routine = await db.routines.get(workout.routineId || '');
    const routineGroups = await db.routineGroups.where('routineId').equals(workout.routineId || '').toArray();
    const muscleGroups = await db.muscleGroups.toArray();
    const workoutExercises = await db.workoutExercises.where('workoutId').equals(id).toArray();
    const weIds = workoutExercises.map(we => we.id);
    const sets = weIds.length > 0
      ? await db.sets.where('workoutExerciseId').anyOf(weIds).toArray()
      : [];

    return { workout, routine, routineGroups, muscleGroups, workoutExercises, sets };
  }, [id]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando entrenamiento...</div>;

  const { workout, routine, routineGroups, muscleGroups, workoutExercises, sets } = data;

  // Cálculos de progreso total
  const totalExercisesTarget = routineGroups?.reduce((acc, rg) => acc + rg.exerciseCount, 0) || 0;
  const completedExercisesCount = workoutExercises.filter(we => we.completed).length;

  // Función para terminar el entrenamiento y calcular el tiempo
  const handleFinishWorkout = async () => {
    // A. Buscar ejercicios vacíos de esta sesión
    const currentExercises = await db.workoutExercises.where('workoutId').equals(workout.id).toArray();
    
    for (const exercise of currentExercises) {
      const sets = await db.sets.where('workoutExerciseId').equals(exercise.id).toArray();
      if (sets.length === 0) {
        await db.workoutExercises.delete(exercise.id); // ¡Basura eliminada!
      }
    }

    // B. Calcular la duración y actualizar el entrenamiento
    const endTime = Date.now();
    const durationInSeconds = Math.floor((endTime - (workout.startTime || endTime)) / 1000);
    
    await db.workouts.update(workout.id, {
      endTime: endTime,
      duration: durationInSeconds
    });

    // Limpiamos la sesión activa guardada
    clearWorkoutSession();

    // C. Navegar al resumen
    navigate(`/history/${workout.id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      {/* Encabezado */}
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Volver al inicio"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{routine?.name}</h1>
          <p className="text-sm text-blue-400">Progreso: {completedExercisesCount}/{totalExercisesTarget} ejercicios</p>
        </div>
      </header>

      {/* Lista de Grupos Musculares (Libre selección) */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Grupos Musculares</h2>
        
        {routineGroups?.map((rg) => {
          const muscle = muscleGroups.find(m => m.id === rg.muscleGroupId);
          const exercisesForThisMuscle = workoutExercises.filter(we => we.muscleGroupId === rg.muscleGroupId);
          const completedForThisMuscle = exercisesForThisMuscle.filter(we => we.completed).length;
          const isFullyCompleted = completedForThisMuscle >= rg.exerciseCount;
          // Solo se considera en progreso si hay ejercicios con al menos 1 serie registrada
          const hasExerciseWithSets = exercisesForThisMuscle.some(
            we => !we.completed && sets.some(s => s.workoutExerciseId === we.id)
          );
          const isInProgress = !isFullyCompleted && (completedForThisMuscle > 0 || hasExerciseWithSets);

          return (
            <button
              key={rg.id}
              onClick={() => navigate(`/workout/${id}/select-exercise/${rg.muscleGroupId}`)}
              className={`p-5 rounded-3xl flex items-center justify-between transition-all shadow-sm ${
                isFullyCompleted
                  ? 'bg-green-900/20 border border-green-900/50 hover:bg-green-900/30'
                  : isInProgress
                  ? 'bg-slate-800 border-2 border-amber-500/80 shadow-md shadow-amber-950/30 hover:bg-slate-700 active:bg-slate-700'
                  : 'bg-slate-800 border border-transparent hover:bg-slate-700 active:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${isFullyCompleted ? 'text-green-400' : 'text-white'}`}>
                  {muscle?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isInProgress && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-500/40 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    En progreso
                  </span>
                )}
                <span className={`text-sm ${
                  isFullyCompleted
                    ? 'text-green-500 font-bold'
                    : isInProgress
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400'
                }`}>
                  {completedForThisMuscle}/{rg.exerciseCount}
                </span>
                {isFullyCompleted ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <ChevronRight size={18} className={isInProgress ? 'text-amber-400' : 'text-slate-400'} />
                )}
              </div>
            </button>
          );
        })}
      </section>

      {/* Botón Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <button 
          onClick={handleFinishWorkout}
          className="w-full max-w-md mx-auto bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 active:bg-slate-600 transition-colors border border-slate-700 block"
        >
          Finalizar entrenamiento
        </button>
      </div>
    </div>
  );
}