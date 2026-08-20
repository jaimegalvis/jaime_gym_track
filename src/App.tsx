import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { seedDatabase } from './db/db';
import { Dashboard } from './features/dashboard/Dashboard';
import { RoutineSelection } from './features/routines/RoutineSelection';
import { WorkoutHub } from './features/workout/WorkoutHub';
import { ExerciseSelection } from './features/workout/ExerciseSelection';
import { ActiveExercise } from './features/workout/ActiveExercise';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedDatabase()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Error al inicializar BD:", err);
        setError(err.message || "Error desconocido en IndexedDB");
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-2">Error de Base de Datos</h1>
        <p className="text-sm bg-slate-900 p-4 rounded text-slate-300 border border-red-900/50">{error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 p-4 flex items-center justify-center">
        <p className="animate-pulse font-medium">Cargando tu gimnasio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 font-sans">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routines" element={<RoutineSelection />} />
        <Route path="/workout/:id" element={<WorkoutHub />} />
        <Route path="/workout/:id/muscle/:muscleId" element={<ExerciseSelection />} />
        <Route path="/workout/:id/exercise/:workoutExerciseId" element={<ActiveExercise />} />
      </Routes>
    </div>
  );
}

export default App;