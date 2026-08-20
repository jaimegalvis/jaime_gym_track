import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export function WorkoutHub() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Obtenemos todos los datos necesarios para esta sesión de entrenamiento
  const data = useLiveQuery(async () => {
    if (!id) return null;
    
    const workout = await db.workouts.get(id);
    if (!workout) return null;
    
    const routine = await db.routines.get(workout.routineId);
    const routineGroups = await db.routineGroups.where('routineId').equals(workout.routineId).toArray();
    const muscleGroups = await db.muscleGroups.toArray();
    
    // Ejercicios que el usuario vaya completando en esta sesión
    const workoutExercises = await db.workoutExercises.where('workoutId').equals(id).toArray();

    return { workout, routine, routineGroups, muscleGroups, workoutExercises };
  }, [id]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando entrenamiento...</div>;

  const { routine, routineGroups, muscleGroups, workoutExercises } = data;

  // Cálculos de progreso total
  const totalExercisesTarget = routineGroups.reduce((acc, rg) => acc + rg.exerciseCount, 0);
  const completedExercisesCount = workoutExercises.filter(we => we.completed).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      {/* Encabezado */}
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
        
        {routineGroups.map((rg) => {
          const muscle = muscleGroups.find(m => m.id === rg.muscleGroupId);
          const completedForThisMuscle = workoutExercises.filter(we => we.muscleGroupId === rg.muscleGroupId && we.completed).length;
          const isFullyCompleted = completedForThisMuscle >= rg.exerciseCount;

          return (
            <button
              key={rg.id}
              onClick={() => console.log('Próximo paso: Seleccionar ejercicios para', muscle?.name)}
              className={`p-5 rounded-3xl flex items-center justify-between transition-colors shadow-sm ${
                isFullyCompleted ? 'bg-green-900/20 border border-green-900/50' : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${isFullyCompleted ? 'text-green-400' : 'text-white'}`}>
                  {muscle?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isFullyCompleted ? 'text-green-500 font-bold' : 'text-slate-400'}`}>
                  {completedForThisMuscle}/{rg.exerciseCount}
                </span>
                {isFullyCompleted && <CheckCircle2 size={20} className="text-green-500" />}
              </div>
            </button>
          );
        })}
      </section>

      {/* Botón Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <button 
          onClick={() => console.log('Finalizar')}
          className="w-full max-w-md mx-auto bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 active:bg-slate-600 transition-colors border border-slate-700 block"
        >
          Finalizar entrenamiento
        </button>
      </div>
    </div>
  );
}