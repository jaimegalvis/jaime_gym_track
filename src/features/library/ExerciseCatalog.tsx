import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Plus, Save, Dumbbell } from 'lucide-react';

export function ExerciseCatalog() {
  const navigate = useNavigate();
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());

  // Estado para alternar entre "Ver lista" y "Añadir nuevo"
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!newName.trim()) return alert('Escribe el nombre del ejercicio');
    if (selectedMuscles.length === 0) return alert('Selecciona al menos un músculo');

    await db.exercises.add({
      id: crypto.randomUUID(),
      name: newName,
      muscleGroupIds: selectedMuscles
    });

    setNewName('');
    setSelectedMuscles([]);
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Catálogo</h1>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-blue-600 p-2 rounded-full text-white">
            <Plus size={24} />
          </button>
        )}
      </header>

      {isAdding ? (
        <section className="bg-slate-800 p-5 rounded-3xl border border-slate-700 flex flex-col gap-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Dumbbell size={20} className="text-green-400" /> Nuevo Ejercicio
          </h2>
          <input 
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Ej: Press de Banca"
            className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-sm text-slate-400 mt-2">¿Qué músculos trabaja? (Múltiple selección)</p>
          <div className="grid grid-cols-2 gap-2">
            {muscleGroups?.map(m => (
              <button
                key={m.id}
                onClick={() => toggleMuscle(m.id)}
                className={`p-3 rounded-xl text-sm font-medium transition-colors border ${
                  selectedMuscles.includes(m.id) 
                    ? 'bg-green-900/40 border-green-500 text-green-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="flex-1 p-3 bg-slate-700 text-white rounded-xl">Cancelar</button>
            <button onClick={handleSave} className="flex-1 p-3 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2">
              <Save size={20} /> Guardar
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {exercises?.map(ex => (
            <div key={ex.id} className="bg-slate-800 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-white font-semibold text-lg">{ex.name}</span>
              <div className="flex flex-wrap gap-2">
                {ex.muscleGroupIds.map(mId => {
                  const mName = muscleGroups?.find(m => m.id === mId)?.name;
                  return <span key={mId} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md">{mName}</span>;
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}