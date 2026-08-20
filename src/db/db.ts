import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { MuscleGroup, Exercise, Routine, RoutineGroup, Workout, WorkoutExercise, Set } from '../types';

export class GymDatabase extends Dexie {
  muscleGroups!: Table;
  exercises!: Table;
  routines!: Table;
  routineGroups!: Table;
  workouts!: Table;
  workoutExercises!: Table;
  sets!: Table;

  constructor() {
    super('GymTrackerDB');
    
    this.version(1).stores({
      muscleGroups: 'id, name',
      exercises: 'id, name, muscleGroupId',
      routines: 'id, name',
      routineGroups: 'id, routineId, muscleGroupId',
      workouts: 'id, routineId, date',
      workoutExercises: 'id, workoutId, exerciseId, muscleGroupId',
      sets: 'id, workoutExerciseId'
    });
  }
}

export const db = new GymDatabase();

// Función para poblar la BD con datos iniciales si está vacía
export async function seedDatabase() {
  const count = await db.muscleGroups.count();
  if (count > 0) return;

  // Grupos Musculares
  const muscles: MuscleGroup[] = [
    { id: 'm1', name: 'Pecho' },
    { id: 'm2', name: 'Espalda' },
    { id: 'm3', name: 'Hombros' },
    { id: 'm4', name: 'Bíceps' },
    { id: 'm5', name: 'Tríceps' },
    { id: 'm6', name: 'Piernas' },
    { id: 'm7', name: 'Antebrazo' }
  ];

  // Ejercicios Iniciales
  const exercises: Exercise[] = [
    { id: 'e1', name: 'Press militar', muscleGroupId: 'm3' },
    { id: 'e2', name: 'Elevaciones laterales', muscleGroupId: 'm3' },
    { id: 'e3', name: 'Curl predicador', muscleGroupId: 'm4' },
    { id: 'e4', name: 'Curl martillo', muscleGroupId: 'm4' },
    { id: 'e5', name: 'Fondos', muscleGroupId: 'm5' },
    { id: 'e6', name: 'Extensión de tríceps en polea', muscleGroupId: 'm5' },
    { id: 'e7', name: 'Curl de muñeca', muscleGroupId: 'm7' },
    { id: 'e8', name: 'Curl inverso', muscleGroupId: 'm7' }
  ];

  // Rutina de ejemplo: Hombros + Brazos
  const routines: Routine[] = [
    { id: 'r1', name: 'Hombros + brazos' }
  ];

  const routineGroups: RoutineGroup[] = [
    { id: 'rg1', routineId: 'r1', muscleGroupId: 'm3', exerciseCount: 2 },
    { id: 'rg2', routineId: 'r1', muscleGroupId: 'm4', exerciseCount: 2 },
    { id: 'rg3', routineId: 'r1', muscleGroupId: 'm5', exerciseCount: 2 },
    { id: 'rg4', routineId: 'r1', muscleGroupId: 'm7', exerciseCount: 2 }
  ];

  await db.muscleGroups.bulkPut(muscles);
  await db.exercises.bulkPut(exercises);
  await db.routines.bulkPut(routines);
  await db.routineGroups.bulkPut(routineGroups);
}