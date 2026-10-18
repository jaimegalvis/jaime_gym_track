export interface MuscleGroup {
  id: string;
  name: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroupIds: string[];
  equipment?: string;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
}

export interface RoutineGroup {
  id: string;
  routineId: string;
  muscleGroupId: string;
  exerciseCount: number;
}

export interface Workout {
  id: string;
  routineId?: string;
  name?: string;
  date: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface WorkoutWithDetails extends Workout {
  routineName: string;
  muscles: string[];
}


export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  muscleGroupId: string;
  completed: boolean;
}

export interface Set {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  unit: 'kg' | 'lb';
  reps: number;
  completed: boolean;
}