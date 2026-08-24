import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export function RoutineForm() {
  const navigate = useNavigate();
  // Traemos el catálogo de músculos para poder seleccionarlos
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray());

  // Estados (Memoria temporal del formulario antes de guardar)
  const [routineName, setRoutineName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<{ muscleGroupId: string; count: number }[]>([]);
  
  // Controles temporales para el selector inferior
  const [currentMuscle, setCurrentMuscle] = useState('');
  const [currentCount, setCurrentCount] = useState(1);

  // Función para añadir un grupo muscular a la lista temporal
  const handleAddGroup = () => {
    if (!currentMuscle) return;
    
    // Evitamos duplicados del mismo músculo
    if (selectedGroups.some(g => g.muscleGroupId === currentMuscle)) {
      alert('Ya agregaste este grupo muscular a la rutina.');
      return;
    }

    setSelectedGroups([...selectedGroups, { muscleGroupId: currentMuscle, count: currentCount }]);
    setCurrentMuscle(''); // Reiniciamos el selector
    setCurrentCount(1);
  };

  // Función para eliminar un grupo de la lista temporal
  const handleRemoveGroup = (muscleId: string) => {
    setSelectedGroups(selectedGroups.filter(g => g.muscleGroupId !== muscleId));
  };

  // Función final para guardar en la base de datos
  const handleSaveRoutine = async () => {
    if (!routineName.trim()) return alert('Dale un nombre a la rutina');
    if (selectedGroups.length === 0) return alert('Agrega al menos un grupo muscular');

    try {
      const routineId = crypto.randomUUID();
      
      // 1. Guardamos la rutina principal
      await db.routines.add({ id: routineId, name: routineName });

      // 2. Guardamos las relaciones (cuántos ejercicios por músculo)
      const routineGroupRecords = selectedGroups.map(g => ({
        id: crypto.randomUUID(),
        routineId: routineId,
        muscleGroupId: g.muscleGroupId,
        exerciseCount: g.count
      }));
      
      await db.routineGroups.bulkAdd(routineGroupRecords);
      
      // Volvemos a la pantalla anterior
      navigate('/routines');
    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Hubo un error al guardar la rutina');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Nueva Rutina</h1>
      </header>

      {/* Nombre de la rutina */}
      <section>
        <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre de la Rutina</label>
        <input 
          type="text" 
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          placeholder="Ej: Push Day, Piernas..."
          className="w-full bg-slate-800 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
        />
      </section>

      {/* Agregar Grupos Musculares */}
      <section className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-300">Configurar Ejercicios</h2>
        
        <div className="flex gap-2">
          <select 
            value={currentMuscle}
            onChange={(e) => setCurrentMuscle(e.target.value)}
            className="flex-1 bg-slate-700 text-white p-3 rounded-xl outline-none"
          >
            <option value="">Músculo...</option>
            {muscleGroups?.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          
          <input 
            type="number" 
            min="1"
            max="10"
            value={currentCount}
            onChange={(e) => setCurrentCount(parseInt(e.target.value) || 1)}
            className="w-20 bg-slate-700 text-white p-3 rounded-xl outline-none text-center"
          />
          
          <button 
            onClick={handleAddGroup}
            className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-colors flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Lista de grupos añadidos */}
        <div className="flex flex-col gap-2 mt-2">
          {selectedGroups.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No has añadido grupos musculares.</p>
          ) : (
            selectedGroups.map((group) => {
              const muscleName = muscleGroups?.find(m => m.id === group.muscleGroupId)?.name;
              return (
                <div key={group.muscleGroupId} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <span className="text-white font-medium">{muscleName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm">{group.count} ej.</span>
                    <button 
                      onClick={() => handleRemoveGroup(group.muscleGroupId)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Botón Guardar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <button 
          onClick={handleSaveRoutine}
          className="w-full max-w-md mx-auto bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 active:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          <Save size={20} />
          Guardar Rutina
        </button>
      </div>
    </div>
  );
}