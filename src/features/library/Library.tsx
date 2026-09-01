import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, ClipboardList, Plus } from 'lucide-react';

export function Library() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Mi Biblioteca</h1>
      </header>

      <section className="flex flex-col gap-4">
        {/* Tarjeta de Rutinas */}
        <div className="bg-slate-800 p-5 rounded-3xl flex flex-col gap-4 border border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-400" size={24} />
            <h2 className="text-lg font-semibold text-white">Gestión de Rutinas</h2>
          </div>
          <p className="text-sm text-slate-400">
            Diseña nuevas rutinas de entrenamiento o modifica las que ya tienes.
          </p>
          <button 
            onClick={() => navigate('/library/routines')}
            className="bg-blue-500/10 text-blue-400 py-3 rounded-xl font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
            >
            Gestionar rutinas
            </button>
        </div>

        {/* Tarjeta de Ejercicios */}
        <div className="bg-slate-800 p-5 rounded-3xl flex flex-col gap-4 border border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <Dumbbell className="text-green-400" size={24} />
            <h2 className="text-lg font-semibold text-white">Base de Ejercicios</h2>
          </div>
          <p className="text-sm text-slate-400">
            Añade ejercicios personalizados y asígnalos a múltiples grupos musculares.
          </p>
          <button 
            onClick={() => navigate('/library/exercises')}
            className="bg-green-500/10 text-green-400 py-3 rounded-xl font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
            >
            Explorar catálogo
          </button>
        </div>
      </section>
    </div>
  );
}