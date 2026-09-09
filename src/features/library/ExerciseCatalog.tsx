import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Plus, Save, Dumbbell, Pencil, X } from 'lucide-react';

export function ExerciseCatalog() {
  const navigate = useNavigate();
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());

  // 1. ESTADOS MEJORADOS: Controlamos si el formulario está abierto y si estamos editando
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  // Función para seleccionar/deseleccionar músculos
  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // 2. ABRIR FORMULARIO PARA CREAR
  const handleOpenCreate = () => {
    setEditingId(null);
    setNewName('');
    setSelectedMuscles([]);
    setShowForm(true);
  };

  // 3. ABRIR FORMULARIO PARA EDITAR
  const handleOpenEdit = (exercise: { id: string, name: string, muscleGroupIds: string[] }) => {
    setEditingId(exercise.id);
    setNewName(exercise.name);
    setSelectedMuscles(exercise.muscleGroupIds);
    setShowForm(true);
  };

  // 4. GUARDAR CAMBIOS (Sirve tanto para crear como para editar)
  const handleSave = async () => {
    if (!newName.trim()) return alert('Escribe el nombre del ejercicio');
    if (selectedMuscles.length === 0) return alert('Selecciona al menos un músculo');

    if (editingId) {
      // Si hay un ID, estamos actualizando
      await db.exercises.update(editingId, {
        name: newName,
        muscleGroupIds: selectedMuscles
      });
    } else {
      // Si no hay ID, estamos creando uno nuevo
      await db.exercises.add({
        id: crypto.randomUUID(),
        name: newName,
        muscleGroupIds: selectedMuscles
      });
    }

    // Limpiamos y cerramos el formulario
    setShowForm(false);
    setEditingId(null);
    setNewName('');
    setSelectedMuscles([]);
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
        {!showForm && (
          <button onClick={handleOpenCreate} className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500 transition-colors">
            <Plus size={24} />
          </button>
        )}
      </header>

      {showForm ? (
        <section className="bg-slate-800 p-5 rounded-3xl border border-slate-700 flex flex-col gap-4">
          <header className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Dumbbell size={20} className="text-blue-400" /> 
              {/* Cambiamos el título dinámicamente */}
              {editingId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </header>

          <input 
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Ej: Press de Banca"
            className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <p className="text-sm text-slate-400 mt-2">¿Qué músculos trabaja? (Múltiple selección)</p>
          
          <div className="grid grid-cols-2 gap-2">
            {muscleGroups?.map(m => (
              <button
                key={m.id}
                onClick={() => toggleMuscle(m.id)}
                className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                  selectedMuscles.includes(m.id) 
                    ? 'bg-blue-900/40 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleSave} 
              className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Save size={20} /> Guardar Cambios
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {exercises?.map(ex => (
            <div key={ex.id} className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-2">
                <span className="text-white font-semibold text-lg">{ex.name}</span>
                <div className="flex flex-wrap gap-2">
                  {ex.muscleGroupIds.map(mId => {
                    const mName = muscleGroups?.find(m => m.id === mId)?.name;
                    return <span key={mId} className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded-md">{mName}</span>;
                  })}
                </div>
              </div>

              {/* Botón de editar que ahora abre el formulario inteligente */}
              <button 
                onClick={() => handleOpenEdit(ex)}
                className="p-3 bg-slate-700/50 text-slate-300 hover:text-blue-400 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-all"
                title="Editar ejercicio"
              >
                <Pencil size={20} />
              </button>
            </div>
          ))}
          
          {exercises?.length === 0 && (
             <div className="text-center text-slate-500 mt-10">
               No hay ejercicios. Toca el botón "+" para crear uno.
             </div>
          )}
        </section>
      )}
    </div>
  );
}