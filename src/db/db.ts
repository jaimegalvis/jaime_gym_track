import Dexie, { type Table } from 'dexie';

// 1. Interfaces
export interface MuscleGroup { id: string; name: string; }
export interface Exercise { id: string; name: string; muscleGroupIds: string[]; }
export interface Routine { id: string; name: string; }
export interface RoutineGroup { id: string; routineId: string; muscleGroupId: string; exerciseCount: number; }
export interface Set { id: string; workoutExerciseId: string; setNumber: number; weight: number; reps: number; unit: string; completed: boolean; }

export interface UserProfile {
  id: string;
  name: string;
  weight: number | '';
  height: number | '';
  weightUnit: 'kg' | 'lb';
  goal: string;
}

export interface Workout { 
  id: string; 
  date: string; 
  name: string; 
  duration?: number;
  routineId?: string;
  startTime?: number;
  endTime?: number;
}

export interface WorkoutExercise { 
  id: string; 
  workoutId: string; 
  exerciseId: string; 
  completed: boolean; 
  muscleGroupId?: string;
}

// 2. Configuración de la Base de Datos
export class JGymDatabase extends Dexie {
  muscleGroups!: Table<MuscleGroup, string>;
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  routineGroups!: Table<RoutineGroup, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<Set, string>;
  userProfile!: Table<UserProfile, string>; 

  constructor() {
    super('JGymDB');
    this.version(1).stores({
      muscleGroups: 'id',
      exercises: 'id, *muscleGroupIds',
      routines: 'id',
      routineGroups: 'id, routineId',
      workouts: 'id, date',
      workoutExercises: 'id, workoutId',
      sets: 'id, workoutExerciseId',
      userProfile: 'id' // <-- Solo necesitamos el ID ('me')
    });
  }
}

export const db = new JGymDatabase();

// 3. Función Semilla (Datos Iniciales)
export async function seedDatabase() {
  const count = await db.muscleGroups.count();
  if (count > 0) return; // Si ya hay datos, no hacemos nada

  const muscles: MuscleGroup[] = [
    { id: 'm1', name: 'Pecho' }, { id: 'm2', name: 'Espalda' },
    { id: 'm3', name: 'Hombros' }, { id: 'm4', name: 'Bíceps' },
    { id: 'm5', name: 'Tríceps' }, { id: 'm6', name: 'Cuádriceps' },
    { id: 'm7', name: 'Antebrazo' }, { id: 'm8', name: 'Isquiotibiales' },
    { id: 'm9', name: 'Glúteos' }, { id: 'm10', name: 'Pantorrillas' },
    { id: 'm11', name: 'Aductores' }
  ];

  const exercises: Exercise[] = [
    { id: 'e1', name: 'Press militar', muscleGroupIds: ['m3', 'm5'] }, 
    { id: 'e2', name: 'Elevaciones laterales', muscleGroupIds: ['m3'] },
    { id: 'e3', name: 'Curl predicador', muscleGroupIds: ['m4'] },
    { id: 'e4', name: 'Curl martillo', muscleGroupIds: ['m4', 'm7'] }, 
    { id: 'e5', name: 'Fondos', muscleGroupIds: ['m1', 'm5'] }, 
    { id: 'e6', name: 'Extensión de tríceps', muscleGroupIds: ['m5'] },
    { id: 'e7', name: 'Sentadilla', muscleGroupIds: ['m6', 'm9'] },
    { id: 'e8', name: 'Press de Banca', muscleGroupIds: ['m1', 'm5'] },
    { id: 'e9', name: 'Dominadas', muscleGroupIds: ['m2', 'm4'] }
  ];

  // NUEVO: Perfil por defecto
  await db.userProfile.put({
    id: 'me',
    name: 'Atleta',
    weight: '',
    height: '',
    weightUnit: 'kg',
    goal: 'Hipertrofia'
  });

  // NUEVO: Rutinas Clásicas Pre-cargadas
  const r1 = crypto.randomUUID();
  const r2 = crypto.randomUUID();
  const r3 = crypto.randomUUID();
  const r4 = crypto.randomUUID();
  const r5 = crypto.randomUUID();

  const routines: Routine[] = [
    { id: r1, name: 'Push (Empuje)' },
    { id: r2, name: 'Pull (Jale)' },
    { id: r3, name: 'Día de Piernas' },
    { id: r4, name: 'Pecho + Espalda (Arnold A)' },
    { id: r5, name: 'Hombros + Brazos (Arnold B)' }
  ];

  const routineGroups: RoutineGroup[] = [
    // Push
    { id: crypto.randomUUID(), routineId: r1, muscleGroupId: 'm1', exerciseCount: 3 },
    { id: crypto.randomUUID(), routineId: r1, muscleGroupId: 'm3', exerciseCount: 2 },
    { id: crypto.randomUUID(), routineId: r1, muscleGroupId: 'm5', exerciseCount: 2 },
    // Pull
    { id: crypto.randomUUID(), routineId: r2, muscleGroupId: 'm2', exerciseCount: 3 },
    { id: crypto.randomUUID(), routineId: r2, muscleGroupId: 'm4', exerciseCount: 2 },
    // Piernas
    { id: crypto.randomUUID(), routineId: r3, muscleGroupId: 'm6', exerciseCount: 2 },
    { id: crypto.randomUUID(), routineId: r3, muscleGroupId: 'm8', exerciseCount: 2 },
    { id: crypto.randomUUID(), routineId: r3, muscleGroupId: 'm9', exerciseCount: 1 },
    { id: crypto.randomUUID(), routineId: r3, muscleGroupId: 'm10', exerciseCount: 1 },
    // Arnold A (Pecho + Espalda)
    { id: crypto.randomUUID(), routineId: r4, muscleGroupId: 'm1', exerciseCount: 3 },
    { id: crypto.randomUUID(), routineId: r4, muscleGroupId: 'm2', exerciseCount: 3 },
    // Arnold B (Hombros + Brazos)
    { id: crypto.randomUUID(), routineId: r5, muscleGroupId: 'm3', exerciseCount: 3 },
    { id: crypto.randomUUID(), routineId: r5, muscleGroupId: 'm4', exerciseCount: 2 },
    { id: crypto.randomUUID(), routineId: r5, muscleGroupId: 'm5', exerciseCount: 2 }
  ];

  await db.muscleGroups.bulkPut(muscles);
  await db.exercises.bulkPut(exercises);
  await db.routines.bulkPut(routines);
  await db.routineGroups.bulkPut(routineGroups);
}