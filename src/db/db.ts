import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { MuscleGroup, Exercise, Routine, RoutineGroup, Workout, WorkoutExercise, Set } from '../types';

export class GymDatabase extends Dexie {
  muscleGroups!: Table<MuscleGroup>;
  exercises!: Table<Exercise>;
  routines!: Table<Routine>;
  routineGroups!: Table<RoutineGroup>;
  workouts!: Table<Workout>;
  workoutExercises!: Table<WorkoutExercise>;
  sets!: Table<Set>;

  constructor() {
    super('GymTrackerDB');
    
    // El asterisco (*) en *muscleGroupIds le dice a Dexie que es un arreglo 
    // y que debe permitir buscar por cualquiera de los elementos que contenga.
    this.version(1).stores({
      muscleGroups: 'id, name',
      exercises: 'id, name, *muscleGroupIds', 
      routines: 'id, name',
      routineGroups: 'id, routineId, muscleGroupId',
      workouts: 'id, routineId, date',
      workoutExercises: 'id, workoutId, exerciseId, muscleGroupId',
      sets: 'id, workoutExerciseId'
    });
  }
}

export const db = new GymDatabase();

export async function seedDatabase() {
  const count = await db.muscleGroups.count();
  if (count > 0) return;

  const muscles: MuscleGroup[] = [
    { id: 'm1', name: 'Pecho' },
    { id: 'm2', name: 'Espalda' },
    { id: 'm3', name: 'Hombros' },
    { id: 'm4', name: 'Bíceps' },
    { id: 'm5', name: 'Tríceps' },
    { id: 'm7', name: 'Antebrazo' },
    // Pierna
    { id: 'm6', name: 'Cuádriceps' },
    { id: 'm8', name: 'Isquiotibiales' },
    { id: 'm9', name: 'Glúteos' },
    { id: 'm10', name: 'Pantorrillas' },
    { id: 'm11', name: 'Aductores' }
  ];

  const exercises: Exercise[] = [
    { id: 'e1', name: 'Press militar', muscleGroupIds: ['m3', 'm5'] }, 
    { id: 'e2', name: 'Elevaciones laterales', muscleGroupIds: ['m3'] },
    { id: 'e3', name: 'Curl predicador', muscleGroupIds: ['m4'] },
    { id: 'e4', name: 'Curl martillo', muscleGroupIds: ['m4', 'm7'] }, 
    { id: 'e5', name: 'Fondos', muscleGroupIds: ['m1', 'm5'] }, 
    { id: 'e6', name: 'Extensión de tríceps en polea', muscleGroupIds: ['m5'] },
    { id: 'e7', name: 'Curl de muñeca', muscleGroupIds: ['m7'] },
    // Sentadilla ahora es un ejercicio compuesto de pierna
    { id: 'e8', name: 'Sentadilla', muscleGroupIds: ['m6', 'm9'] } 
  ];

  const routines: Routine[] = [
    { id: 'r1', name: 'Hombros + brazos' }
  ];

  const routineGroups: RoutineGroup[] = [
    { id: 'rg1', routineId: 'r1', muscleGroupId: 'm3', exerciseCount: 2 },
    { id: 'rg2', routineId: 'r1', muscleGroupId: 'm4', exerciseCount: 2 },
    { id: 'rg3', routineId: 'r1', muscleGroupId: 'm5', exerciseCount: 2 },
    { id: 'rg4', routineId: 'r1', muscleGroupId: 'm7', exerciseCount: 2 }
  ];

  await db.muscleGroups.bulkAdd(muscles);
  await db.exercises.bulkAdd(exercises);
  await db.routines.bulkAdd(routines);
  await db.routineGroups.bulkAdd(routineGroups);
}