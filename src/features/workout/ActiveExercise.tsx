import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Check, Trash2, Scale, ArrowRightLeft } from 'lucide-react';
import { db } from '../../db/db';
import { saveWorkoutSession } from '../../utils/session';

// Funciones de conversión con redondeo a 1 decimal
function lbToKg(lb: number): number {
  if (!lb || isNaN(lb)) return 0;
  const kg = lb * 0.45359237;
  return Math.round(kg * 10) / 10;
}

function kgToLb(kg: number): number {
  if (!kg || isNaN(kg)) return 0;
  const lb = kg / 0.45359237;
  return Math.round(lb * 10) / 10;
}

export function ActiveExercise() {
  const { id, workoutExerciseId } = useParams();
  const navigate = useNavigate();

  // Guardamos la sesión activa en este ejercicio específico
  useEffect(() => {
    if (id && workoutExerciseId) {
      saveWorkoutSession(id, `/workout/${id}/track/${workoutExerciseId}`);
    }
  }, [id, workoutExerciseId]);

  // Unidad en la que el usuario está ingresando el peso ('kg' o 'lb')
  const [inputUnit, setInputUnit] = useState<'kg' | 'lb'>('kg');

  // Memoria temporal para la "Fila Borrador"
  const [draftWeight, setDraftWeight] = useState<number | string>('');
  const [draftReps, setDraftReps] = useState<number | string>('');

  const data = useLiveQuery(async () => {
    if (!workoutExerciseId) return null;
    const workoutExercise = await db.workoutExercises.get(workoutExerciseId);
    if (!workoutExercise) return null;
    
    const exercise = await db.exercises.get(workoutExercise.exerciseId);
    const sets = await db.sets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    
    sets.sort((a, b) => a.setNumber - b.setNumber);
    return { workoutExercise, exercise, sets };
  }, [workoutExerciseId]);

  // Si hay series reales, copiamos los datos de la última a la fila borrador
  useEffect(() => {
    if (data?.sets && data.sets.length > 0) {
      const lastSet = data.sets[data.sets.length - 1];
      if (inputUnit === 'lb') {
        setDraftWeight(kgToLb(lastSet.weight || 0) || '');
      } else {
        setDraftWeight(lastSet.weight || '');
      }
      setDraftReps(lastSet.reps || '');
    } else {
      setDraftWeight('');
      setDraftReps('');
    }
  }, [data?.sets?.length, inputUnit]);

  if (!data) return <div className="text-slate-400 p-6 text-center mt-10 animate-pulse">Cargando...</div>;
  const { exercise, sets, workoutExercise } = data;

  const deleteSet = async (setId: string) => {
    await db.sets.delete(setId);
  };

  // Alternar unidad y convertir el valor actual en el input si existe
  const handleToggleUnit = (newUnit: 'kg' | 'lb') => {
    if (newUnit === inputUnit) return;
    if (draftWeight !== '' && !isNaN(Number(draftWeight)) && Number(draftWeight) > 0) {
      if (newUnit === 'kg') {
        setDraftWeight(lbToKg(Number(draftWeight)));
      } else {
        setDraftWeight(kgToLb(Number(draftWeight)));
      }
    }
    setInputUnit(newUnit);
  };

  // Función para guardar la serie borrador
  // Si está en libras, convierte automáticamente a kg al confirmar la serie
  const saveDraftSet = async () => {
    const rawWeight = Number(draftWeight) || 0;
    const finalWeightKg = inputUnit === 'lb' ? lbToKg(rawWeight) : rawWeight;

    await db.sets.add({
      id: crypto.randomUUID(),
      workoutExerciseId: workoutExerciseId!,
      setNumber: sets.length + 1,
      weight: finalWeightKg,
      reps: Number(draftReps) || 0,
      unit: 'kg',
      completed: true, // Al tocar el Check, la marcamos como lista
    });

    // Mantenemos los valores en el borrador para la siguiente serie en la misma máquina
    if (inputUnit === 'lb') {
      setDraftWeight(rawWeight || '');
    } else {
      setDraftWeight(finalWeightKg || '');
    }
  };

  const handleBack = async () => {
    // Si no se registró ninguna serie, eliminamos este ejercicio para no dejar registros vacíos
    if (workoutExerciseId && sets.length === 0) {
      await db.workoutExercises.delete(workoutExerciseId);
    }
    if (id && workoutExercise?.muscleGroupId) {
      navigate(`/workout/${id}/select-exercise/${workoutExercise.muscleGroupId}`);
    } else if (id) {
      navigate(`/workout/${id}`);
    } else {
      navigate('/');
    }
  };

  const completeExercise = async () => {
    // Si el usuario ingresó datos en el borrador pero no presionó el check, lo guardamos convertido a kg
    if (draftWeight !== '' && draftReps !== '' && (Number(draftWeight) > 0 || Number(draftReps) > 0)) {
      const rawWeight = Number(draftWeight) || 0;
      const finalWeightKg = inputUnit === 'lb' ? lbToKg(rawWeight) : rawWeight;
      await db.sets.add({
        id: crypto.randomUUID(),
        workoutExerciseId: workoutExerciseId!,
        setNumber: sets.length + 1,
        weight: finalWeightKg,
        reps: Number(draftReps) || 0,
        unit: 'kg',
        completed: true,
      });
    }

    await db.workoutExercises.update(workoutExerciseId!, { completed: true });

    if (id && workoutExercise?.muscleGroupId) {
      saveWorkoutSession(id, `/workout/${id}/select-exercise/${workoutExercise.muscleGroupId}`);
      navigate(`/workout/${id}/select-exercise/${workoutExercise.muscleGroupId}`);
    } else if (id) {
      saveWorkoutSession(id, `/workout/${id}`);
      navigate(`/workout/${id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto pb-24 pt-4">
      {/* Encabezado */}
      <header className="flex items-center gap-4">
        <button 
          onClick={handleBack} 
          className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Volver"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{exercise?.name}</h1>
          <p className="text-xs text-slate-400">Todos los pesos se guardan en kilogramos (kg)</p>
        </div>
      </header>

      {/* Selector de Unidad de Entrada: kg vs lb */}
      <div className="bg-slate-800/90 border border-slate-700/70 p-3 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-300">
              Unidad de la máquina / peso
            </span>
            <span className="text-[11px] text-slate-400">
              {inputUnit === 'lb' ? 'Se convertirá automáticamente a kg al confirmar' : 'Ingreso directo en kg'}
            </span>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => handleToggleUnit('kg')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              inputUnit === 'kg'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => handleToggleUnit('lb')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              inputUnit === 'lb'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            lb
          </button>
        </div>
      </div>

      {/* Cabecera de la tabla de series */}
      <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
        <span className="w-8">Serie</span>
        <span className="flex-1">
          {inputUnit === 'lb' ? 'Peso (lb)' : 'Peso (kg)'}
        </span>
        <span className="flex-1">Reps</span>
        <span className="w-10">Estado</span>
        <span className="w-8"></span> 
      </div>

      <section className="flex flex-col gap-3">
        {/* 1. SERIES REALES GUARDADAS EN BD (Siempre en kg) */}
        {sets.map((set, index) => (
          <div
            key={set.id}
            className={`flex items-center gap-2 p-2 rounded-2xl transition-colors ${
              set.completed
                ? 'bg-green-900/20 border border-green-900/50'
                : 'bg-slate-800'
            }`}
          >
            <span className="w-8 text-center font-bold text-slate-300">
              {index + 1}
            </span>

            {/* Input de peso (en kg) */}
            <div className="flex-1 relative flex items-center">
              <input
                type="number"
                step="0.1"
                defaultValue={set.weight || ''}
                onBlur={(e) =>
                  db.sets.update(set.id, { weight: Number(e.target.value) })
                }
                disabled={set.completed}
                className="w-full bg-slate-900 text-white text-center p-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none pr-7 font-medium"
                placeholder="0"
              />
              <span className="absolute right-2 text-[10px] text-slate-500 font-bold pointer-events-none">
                kg
              </span>
            </div>

            {/* Input de repeticiones */}
            <input
              type="number"
              defaultValue={set.reps || ''}
              onBlur={(e) =>
                db.sets.update(set.id, { reps: Number(e.target.value) })
              }
              disabled={set.completed}
              className="flex-1 w-full bg-slate-900 text-white text-center p-2 rounded-xl border border-slate-700 focus:border-blue-500 outline-none font-medium"
              placeholder="0"
            />

            {/* Botón de Check de la serie completada */}
            <button
              type="button"
              onClick={() => db.sets.update(set.id, { completed: !set.completed })}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                set.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
              title={set.completed ? 'Serie completada' : 'Marcar serie'}
            >
              <Check size={20} />
            </button>

            {/* Eliminar serie */}
            <button
              type="button"
              onClick={() => deleteSet(set.id)}
              className="w-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
              title="Eliminar serie"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {/* 2. FILA BORRADOR (NUEVA SERIE) */}
        <div className={`flex flex-col gap-1.5 p-2.5 rounded-2xl transition-all border border-dashed ${
          inputUnit === 'lb'
            ? 'bg-slate-800/60 border-amber-500/60 shadow-sm'
            : 'bg-slate-800/40 border-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-8 text-center font-bold text-slate-400">
              {sets.length + 1}
            </span>

            {/* Input de peso del borrador */}
            <div className="flex-1 relative flex items-center">
              <input
                type="number"
                step="0.1"
                value={draftWeight}
                onChange={(e) =>
                  setDraftWeight(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={`w-full bg-slate-900 text-white text-center p-2 rounded-xl border outline-none pr-7 font-medium transition-colors ${
                  inputUnit === 'lb'
                    ? 'border-amber-500/70 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    : 'border-slate-800 focus:border-blue-500'
                }`}
                placeholder={inputUnit === 'lb' ? '0 lb' : '0 kg'}
              />
              <span
                className={`absolute right-2 text-[10px] font-bold pointer-events-none ${
                  inputUnit === 'lb' ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {inputUnit}
              </span>
            </div>

            {/* Input de repeticiones del borrador */}
            <input
              type="number"
              value={draftReps}
              onChange={(e) =>
                setDraftReps(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="flex-1 w-full bg-slate-900 text-white text-center p-2 rounded-xl border border-slate-800 focus:border-blue-500 outline-none font-medium"
              placeholder="Reps"
            />

            {/* Botón Check para guardar la serie */}
            <button
              type="button"
              onClick={saveDraftSet}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                inputUnit === 'lb'
                  ? 'bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-950/40'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95'
              }`}
              title={
                inputUnit === 'lb'
                  ? 'Confirmar serie (convierte automáticamente de lb a kg)'
                  : 'Confirmar serie'
              }
            >
              <Check size={20} />
            </button>

            <div className="w-8" />
          </div>

          {/* Vista previa en tiempo real de la conversión si está en libras */}
          {inputUnit === 'lb' && draftWeight !== '' && Number(draftWeight) > 0 && (
            <div className="flex items-center justify-between px-10 text-[11px] text-amber-300/90 font-medium">
              <span className="flex items-center gap-1">
                <ArrowRightLeft size={12} />
                {draftWeight} lb = <strong className="text-white font-bold">{lbToKg(Number(draftWeight))} kg</strong>
              </span>
              <span className="text-[10px] text-slate-400">
                (Se guardará como {lbToKg(Number(draftWeight))} kg)
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Botón Final / Completar Ejercicio */}
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