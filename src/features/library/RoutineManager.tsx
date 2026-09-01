import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Plus, Edit2, Trash2, ClipboardList } from 'lucide-react';

export function RoutineManager() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => db.routines.toArray());

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la rutina "${name}"?`)) {
      // Borramos la rutina
      await db.routines.delete(id);
      // Borramos las relaciones de ejercicios de esa rutina para no dejar basura en la BD
      await db.routineGroups.where('routineId').equals(id).delete();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/library')} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Mis Rutinas</h1>
        </div>
        <button onClick={() => navigate('/routines/new')} className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500">
          <Plus size={24} />
        </button>
      </header>

      <section className="flex flex-col gap-3">
        {routines?.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-3xl text-center flex flex-col items-center gap-3">
            <ClipboardList size={32} className="text-slate-500" />
            <p className="text-slate-300 font-medium">No tienes rutinas creadas.</p>
          </div>
        ) : (
          routines?.map((routine) => (
            <div key={routine.id} className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <span className="text-white font-semibold text-lg">{routine.name}</span>
              <div className="flex items-center gap-2">
                <button 
                onClick={() => navigate(`/routines/${routine.id}/edit`)}
                className="p-2 text-slate-400 hover:text-blue-400 bg-slate-700/50 rounded-xl transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(routine.id, routine.name)}
                  className="p-2 text-slate-400 hover:text-red-400 bg-slate-700/50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}