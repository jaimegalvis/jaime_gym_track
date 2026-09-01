import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export function RoutineForm() {
  const { id } = useParams(); // Si hay ID en la URL, estamos en "Modo Edición"
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [groups, setGroups] = useState<{ muscleGroupId: string; exerciseCount: number }[]>([]);

  // Traemos todos los músculos disponibles para el menú desplegable
  const allMuscles = useLiveQuery(() => db.muscleGroups.toArray());

  // Si estamos editando, cargamos los datos de la rutina
  useLiveQuery(async () => {
    if (!id) return;
    const routine = await db.routines.get(id);
    const routineGroups = await db.routineGroups.where('routineId').equals(id).toArray();
    
    if (routine) setName(routine.name);
    if (routineGroups && groups.length === 0) { // Solo cargamos la primera vez
      setGroups(routineGroups.map(rg => ({ 
        muscleGroupId: rg.muscleGroupId, 
        exerciseCount: rg.exerciseCount 
      })));
    }
  }, [id]);

  const handleAddGroup = () => {
    setGroups([...groups, { muscleGroupId: '', exerciseCount: 1 }]);
  };

  const handleGroupChange = (index: number, field: string, value: string | number) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], [field]: value } as any;
    setGroups(newGroups);
  };

  const handleRemoveGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Por favor, ponle un nombre a la rutina');
    if (groups.length === 0) return alert('Añade al menos un grupo muscular');
    if (groups.some(g => !g.muscleGroupId)) return alert('Selecciona un músculo en todos los campos');

    const routineId = id || crypto.randomUUID();

    // 1. Guardar o actualizar el nombre de la rutina
    if (id) {
      await db.routines.update(id, { name });
      // Borramos las configuraciones viejas para insertar las nuevas limpiamente
      await db.routineGroups.where('routineId').equals(id).delete();
    } else {
      await db.routines.add({ id: routineId, name });
    }

    // 2. Guardar la nueva configuración de músculos y cantidad de ejercicios
    const newRoutineGroups = groups.map(g => ({
      id: crypto.randomUUID(),
      routineId: routineId,
      muscleGroupId: g.muscleGroupId,
      exerciseCount: g.exerciseCount
    }));

    await db.routineGroups.bulkAdd(newRoutineGroups);
    navigate('/library/routines');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">
          {id ? 'Editar Rutina' : 'Nueva Rutina'}
        </h1>
      </header>

      <section className="bg-slate-800 p-5 rounded-3xl border border-slate-700 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400">Nombre de la Rutina</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Pierna Pesada"
            className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-400">Grupos Musculares</label>
            <button onClick={handleAddGroup} className="text-sm text-blue-400 flex items-center gap-1 hover:text-blue-300">
              <Plus size={16} /> Añadir
            </button>
          </div>

          {groups.length === 0 && (
            <p className="text-slate-500 text-sm italic text-center py-4 bg-slate-900/50 rounded-xl">
              No has añadido ningún músculo a esta rutina.
            </p>
          )}

          {groups.map((group, index) => (
            <div key={index} className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700/50">
              <select 
                value={group.muscleGroupId}
                onChange={e => handleGroupChange(index, 'muscleGroupId', e.target.value)}
                className="flex-1 bg-transparent text-white outline-none text-sm appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-slate-800 text-slate-400">Seleccionar...</option>
                {allMuscles?.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-800">{m.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                <span className="text-xs text-slate-400">Ejercicios:</span>
                <input 
                  type="number" 
                  min="1"
                  value={group.exerciseCount}
                  onChange={e => handleGroupChange(index, 'exerciseCount', Number(e.target.value))}
                  className="w-12 bg-slate-800 text-white text-center p-1 rounded-lg outline-none"
                />
              </div>

              <button 
                onClick={() => handleRemoveGroup(index)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors ml-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <button 
          onClick={handleSave}
          className="w-full max-w-md mx-auto bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={24} /> {id ? 'Guardar Cambios' : 'Crear Rutina'}
        </button>
      </div>
    </div>
  );
}