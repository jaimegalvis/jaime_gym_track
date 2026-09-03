import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Save, User, Scale, Target, Ruler } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  // Traemos el perfil único ("me") de la base de datos
  const profile = useLiveQuery(() => db.userProfile.get('me'));

  // Estados locales para el formulario
  const [name, setName] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [goal, setGoal] = useState('Hipertrofia');

  // Cuando la base de datos carga, llenamos el formulario
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setWeight(profile.weight);
      setHeight(profile.height);
      setWeightUnit(profile.weightUnit);
      setGoal(profile.goal);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) return alert('Tu nombre es obligatorio para poder saludarte.');
    
    // Actualizamos el registro en Dexie
    await db.userProfile.put({
      id: 'me',
      name,
      weight,
      height,
      weightUnit,
      goal
    });
    
    navigate(-1); // Regresamos al Dashboard
  };

  if (!profile) return <div className="text-center mt-10 text-slate-400">Cargando perfil...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-24 pt-4">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
      </header>

      <section className="bg-slate-800 p-5 rounded-3xl border border-slate-700 flex flex-col gap-5">
        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <User size={16} /> ¿Cómo te llamamos?
          </label>
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Objetivo */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Target size={16} /> Objetivo Principal
          </label>
          <select 
            value={goal} onChange={e => setGoal(e.target.value)}
            className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="Hipertrofia">Ganar masa muscular (Hipertrofia)</option>
            <option value="Fuerza">Ganar Fuerza</option>
            <option value="Definición">Pérdida de grasa (Definición)</option>
            <option value="Mantenimiento">Mantenimiento general</option>
          </select>
        </div>

        <div className="flex gap-4">
          {/* Peso */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Scale size={16} /> Peso
            </label>
            <div className="flex bg-slate-900 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 border border-transparent focus-within:border-blue-500">
              <input 
                type="number" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-transparent text-white p-4 outline-none text-center font-semibold"
                placeholder="0"
              />
              <select 
                value={weightUnit} onChange={e => setWeightUnit(e.target.value as 'kg' | 'lb')}
                className="bg-slate-700 text-white px-3 outline-none cursor-pointer font-medium"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          {/* Altura */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Ruler size={16} /> Altura (cm)
            </label>
            <input 
              type="number" value={height} onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-900 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
              placeholder="Ej: 175"
            />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <button 
          onClick={handleSave}
          className="w-full max-w-md mx-auto bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={24} /> Guardar Perfil
        </button>
      </div>
    </div>
  );
}