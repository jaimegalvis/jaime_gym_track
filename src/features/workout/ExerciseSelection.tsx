import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { saveWorkoutSession } from '../../utils/session';

export function ExerciseSelection() {
  const { workoutId, muscleGroupId } = useParams();
  const navigate = useNavigate();

  // Guardamos la sesión activa en este punto
  useEffect(() => {
    if (workoutId && muscleGroupId) {
      saveWorkoutSession(workoutId, `/workout/${workoutId}/select-exercise/${muscleGroupId}`);
    }
  }, [workoutId, muscleGroupId]);

  // 1. OBTENER DATOS 
  const data = useLiveQuery(async () => {
    if (!muscleGroupId || !workoutId) return null;
    
    const muscle = await db.muscleGroups.get(muscleGroupId);
    
    const availableExercises = await db.exercises
      .where('muscleGroupIds')
      .equals(muscleGroupId)
      .toArray();

    // Buscamos qué ejercicios ya se agregaron a este entrenamiento
    const currentWorkoutExercises = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .toArray();

    // Obtenemos las series de los ejercicios de esta sesión
    const weIds = currentWorkoutExercises.map(we => we.id);
    const sets = weIds.length > 0 
      ? await db.sets.where('workoutExerciseId').anyOf(weIds).toArray()
      : [];

    return { muscle, availableExercises, currentWorkoutExercises, sets };
  }, [muscleGroupId, workoutId]);

  // Limpieza automática: Si hay ejercicios abiertos por error sin ninguna serie registrada, los eliminamos de la BD
  useEffect(() => {
    if (data?.currentWorkoutExercises && data.sets) {
      for (const we of data.currentWorkoutExercises) {
        if (!we.completed) {
          const count = data.sets.filter((s) => s.workoutExerciseId === we.id).length;
          if (count === 0) {
            db.workoutExercises.delete(we.id);
          }
        }
      }
    }
  }, [data?.currentWorkoutExercises, data?.sets]);

  // 2. FUNCIÓN INTELIGENTE DE SELECCIÓN
  const handleSelectExercise = async (exerciseId: string) => {
    if (!workoutId || !muscleGroupId || !data) return;

    // Verificamos si este ejercicio ya existe en la sesión actual
    const existingExercise = data.currentWorkoutExercises.find(we => we.exerciseId === exerciseId);

    let targetWorkoutExerciseId: string;

    if (existingExercise) {
      // Si ya existe, NO creamos basura nueva, reutilizamos el ID para poder editarlo
      targetWorkoutExerciseId = existingExercise.id;
    } else {
      // Si es la primera vez que lo tocamos hoy, creamos el registro
      targetWorkoutExerciseId = crypto.randomUUID();
      await db.workoutExercises.add({
        id: targetWorkoutExerciseId,
        workoutId: workoutId,
        exerciseId: exerciseId,
        muscleGroupId: muscleGroupId,
        completed: false
      });
    }

    // Navegamos a la pantalla de series usando el ID correcto
    navigate(`/workout/${workoutId}/track/${targetWorkoutExerciseId}`);
  };

  if (!data) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (workoutId) {
              navigate(`/workout/${workoutId}`);
            } else {
              navigate('/');
            }
          }} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
          title="Volver a grupos musculares"
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
          data.availableExercises.map((exercise) => {
            // 3. VALIDACIÓN VISUAL: solo está en progreso si tiene al menos 1 serie registrada
            const currentWE = data.currentWorkoutExercises.find(we => we.exerciseId === exercise.id);
            const isCompleted = currentWE?.completed;
            const setsCount = currentWE 
              ? data.sets.filter(s => s.workoutExerciseId === currentWE.id).length 
              : 0;
            const isInProgress = !isCompleted && setsCount > 0;

            return (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise.id)}
                className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all shadow-sm ${
                  isCompleted 
                    ? 'bg-slate-800 border border-green-500/50 hover:bg-slate-700' 
                    : isInProgress
                    ? 'bg-slate-800 border-2 border-amber-500/80 shadow-md shadow-amber-950/30 hover:bg-slate-700'
                    : 'bg-slate-800 border border-transparent hover:bg-slate-700 active:bg-slate-700'
                }`}
              >
                <div className="flex flex-col text-left pr-2">
                  <span className="text-lg font-semibold text-white">{exercise.name}</span>
                  {isInProgress && (
                    <span className="text-xs text-amber-400 font-medium mt-0.5">
                      {setsCount} {setsCount === 1 ? 'serie registrada' : 'series registradas'}
                    </span>
                  )}
                </div>
                
                {isCompleted ? (
                  <span className="text-xs text-green-400 font-bold bg-green-400/10 border border-green-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                    Completado ✓
                  </span>
                ) : isInProgress ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-amber-400 font-bold bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      En progreso
                    </span>
                    <div className="bg-amber-500/20 p-2 rounded-full text-amber-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700 p-2 rounded-full shrink-0">
                    <ChevronRight size={20} className="text-slate-300" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}