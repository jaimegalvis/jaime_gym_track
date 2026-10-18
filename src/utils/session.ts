const SESSION_KEY = 'jgym_active_workout_session';

export interface ActiveSession {
  workoutId: string;
  path: string;
  timestamp: number;
}

export function saveWorkoutSession(workoutId: string, path: string): void {
  try {
    const session: ActiveSession = {
      workoutId,
      path,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error al guardar sesión activa:', err);
  }
}

export function getWorkoutSession(): ActiveSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as ActiveSession;
  } catch {
    return null;
  }
}

export function clearWorkoutSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Error al limpiar sesión activa:', err);
  }
}
