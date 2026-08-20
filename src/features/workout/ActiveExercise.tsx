import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'; // <-- Agregamos Trash2
import { db } from '../../db/db';

export function ActiveExercise() {
  const { id, workoutExerciseId } = useParams();
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    if (!workoutExerciseId) return null;
    const workoutExercise = await db.workoutExercises.get(workoutExerciseId);
    if (!workoutExercise) return null;
    
    const exercise = await db.exercises.get(workoutExercise.exerciseId);
    const sets = await db.sets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    
    sets.sort((a, b) => a.setNumber - b.setNumber);

    return { workoutExercise, exercise, sets };
  }, [workoutExerciseId]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando...</div>;

  const { workoutExercise, exercise, sets } = data;

  const addSet = async () => {
    await db.sets.add({
      id: crypto.randomUUID(),
      workoutExerciseId: workoutExerciseId!,
      setNumber: sets.length + 1,
      weight: 0,
      unit: 'kg',
      reps: 0,
      completed: false
    });
  };

  // NUEVA FUNCIÓN: Eliminar una serie
  const deleteSet = async (setId: string) => {
    await db.sets.delete(setId);
  };

  const completeExercise = async () => {
    await db.workoutExercises.update(workoutExerciseId!, { completed: true });
    navigate(`/workout/${id}`); 
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">{exercise?.name}</h1>
      </header>

      {/* Cabecera de la tabla actualizada */}
      <div className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-400 text-center">
        <span className="w-8">#</span>
        <span className="flex-1">kg/lb</span>
        <span className="flex-1">Reps</span>
        <span className="w-10">✓</span>
        <span className="w-8"></span> {/* Espacio en blanco para la columna de la papelera */}
      </div>

      <section className="flex flex-col gap-3">
        {sets.map((set, index) => (
          <div key={set.id} className={`flex items-center gap-2 p-2 rounded-2xl transition-colors ${set.completed ? 'bg-green-900/20 border border-green-900/50' : 'bg-slate-800'}`}>
            
            {/* Usamos (index + 1) en lugar de setNumber para que la lista siempre se vea 1,2,3... incluso si borras una del medio */}
            <span className="w-8 text-center font-bold text-slate-300">{index + 1}</span>
            
            <input 
              type="number" 
              defaultValue={set.weight || ''}
              onBlur={(e) => db.sets.update(set.id, { weight: Number(e.target.value) })}
              disabled={set.completed}
              className="flex-1 w-full bg-slate-900 text-white text-center p-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none"
              placeholder="0"
            />
            
            <input 
              type="number" 
              defaultValue={set.reps || ''}
              onBlur={(e) => db.sets.update(set.id, { reps: Number(e.target.value) })}
              disabled={set.completed}
              className="flex-1 w-full bg-slate-900 text-white text-center p-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none"
              placeholder="0"
            />

            <button 
              onClick={() => db.sets.update(set.id, { completed: !set.completed })}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${set.completed ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              <Check size={20} />
            </button>

            {/* NUEVO BOTÓN: Eliminar Serie */}
            <button 
              onClick={() => deleteSet(set.id)}
              className="w-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </section>

      <button onClick={addSet} className="flex items-center justify-center gap-2 py-4 bg-slate-800/50 text-blue-400 font-semibold rounded-2xl border border-dashed border-slate-700 hover:bg-slate-800 transition-colors">
        <Plus size={20} /> Añadir serie
      </button>

      {/* FOOTER CORREGIDO: Agregamos flex y justify-center para alinear el botón al centro de la pantalla */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent flex justify-center">
        <button 
          onClick={completeExercise}
          className="w-full max-w-md bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 active:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
        >
          Completar Ejercicio
        </button>
      </div>
    </div>
  );
}