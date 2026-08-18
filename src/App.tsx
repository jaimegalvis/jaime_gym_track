import { useEffect } from 'react';
import { seedDatabase } from './db/db';

function App() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-blue-500 mb-2">Gym Tracker PWA</h1>
      <p className="text-slate-400 text-center">Base de datos local inicializada con éxito.</p>
    </div>
  );
}

export default App;