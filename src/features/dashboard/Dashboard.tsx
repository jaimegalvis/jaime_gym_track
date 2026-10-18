import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Play,
  Calendar,
  ChevronRight,
  Activity,
  BookOpen,
  List,
  CalendarDays,
  Dumbbell,
  Loader2,
  Trash2,
} from "lucide-react";
import { db, deleteWorkout } from "../../db/db";
import { useNavigate } from "react-router-dom";
import { WorkoutCalendar } from "./WorkoutCalendar";
import { getWorkoutSession, clearWorkoutSession } from "../../utils/session";
import type { WorkoutWithDetails } from "../../types";

export type { WorkoutWithDetails };

function formatWorkoutDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return dateStr;

  const today = new Date();
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === year &&
    yesterday.getMonth() + 1 === month &&
    yesterday.getDate() === day;

  const dateObj = new Date(year, month - 1, day);

  if (isToday) {
    return `Hoy, ${day} ${dateObj.toLocaleDateString("es-ES", { month: "short" })}`;
  }
  if (isYesterday) {
    return `Ayer, ${day} ${dateObj.toLocaleDateString("es-ES", { month: "short" })}`;
  }

  const weekday = dateObj.toLocaleDateString("es-ES", { weekday: "short" });
  const capitalizedWeekday =
    weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const monthStr = dateObj.toLocaleDateString("es-ES", { month: "short" });

  if (today.getFullYear() === year) {
    return `${capitalizedWeekday}, ${day} ${monthStr}`;
  }
  return `${capitalizedWeekday}, ${day} ${monthStr} ${year}`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const observerRef = useRef<HTMLDivElement>(null);

  const profile = useLiveQuery(() => db.userProfile.get("me"));

  // Obtenemos todos los entrenamientos con su rutina y músculos trabajados
  const workouts = useLiveQuery(async (): Promise<WorkoutWithDetails[]> => {
    const allWorkouts = await db.workouts.toArray();

    // Ordenar de más reciente a más antiguo
    allWorkouts.sort((a, b) => {
      const timeA = a.startTime || new Date(a.date).getTime() || 0;
      const timeB = b.startTime || new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

    const [routines, routineGroups, muscleGroups, workoutExercises] =
      await Promise.all([
        db.routines.toArray(),
        db.routineGroups.toArray(),
        db.muscleGroups.toArray(),
        db.workoutExercises.toArray(),
      ]);

    const routinesMap = new Map(routines.map((r) => [r.id, r]));
    const musclesMap = new Map(muscleGroups.map((m) => [m.id, m.name]));

    // Mapeo: workoutId -> Set de nombres de músculos entrenados en la sesión
    const workoutMusclesMap = new Map<string, Set<string>>();
    for (const we of workoutExercises) {
      if (we.muscleGroupId && musclesMap.has(we.muscleGroupId)) {
        if (!workoutMusclesMap.has(we.workoutId)) {
          workoutMusclesMap.set(we.workoutId, new Set());
        }
        workoutMusclesMap
          .get(we.workoutId)!
          .add(musclesMap.get(we.muscleGroupId)!);
      }
    }

    // Mapeo: routineId -> lista de nombres de músculos configurados en la rutina
    const routineMusclesMap = new Map<string, string[]>();
    for (const rg of routineGroups) {
      const muscleName = musclesMap.get(rg.muscleGroupId);
      if (muscleName) {
        if (!routineMusclesMap.has(rg.routineId)) {
          routineMusclesMap.set(rg.routineId, []);
        }
        routineMusclesMap.get(rg.routineId)!.push(muscleName);
      }
    }

    return allWorkouts.map((w) => {
      const routine = w.routineId ? routinesMap.get(w.routineId) : undefined;
      const routineName = w.name || routine?.name || "Entrenamiento";

      // Obtener músculos: primero los registrados en los ejercicios de la sesión,
      // y si no hay ejercicios aún, los de la rutina configurada.
      const recordedMuscles = workoutMusclesMap.get(w.id);
      let muscles: string[] = [];
      if (recordedMuscles && recordedMuscles.size > 0) {
        muscles = Array.from(recordedMuscles);
      } else if (w.routineId && routineMusclesMap.has(w.routineId)) {
        muscles = routineMusclesMap.get(w.routineId)!;
      }

      return {
        ...w,
        routineName,
        muscles,
      };
    });
  });

  // Infinite scroll: Cargar más al deslizar hacia abajo en la vista de lista
  useEffect(() => {
    if (viewMode !== "list") return;
    if (!workouts || visibleCount >= workouts.length) return;

    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [viewMode, workouts, visibleCount]);

  const visibleWorkouts = workouts ? workouts.slice(0, visibleCount) : [];
  const hasMore = workouts ? visibleCount < workouts.length : false;
  const inProgressWorkout = workouts?.find((w) => !w.duration);

  const handleDeleteWorkout = async (e: React.MouseEvent, workout: WorkoutWithDetails) => {
    e.stopPropagation();
    const formattedDate = formatWorkoutDate(workout.date);
    const confirmed = window.confirm(
      `¿Deseas eliminar el entrenamiento "${workout.routineName || "Entrenamiento"}" del ${formattedDate}?\n\nEsta acción eliminará permanentemente la sesión y todas sus series.`
    );
    if (!confirmed) return;

    try {
      await deleteWorkout(workout.id);
      const session = getWorkoutSession();
      if (session && session.workoutId === workout.id) {
        clearWorkoutSession();
      }
    } catch (err) {
      console.error("Error al eliminar entrenamiento:", err);
      alert("Hubo un error al intentar eliminar el entrenamiento.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-10 pt-4">
      <header className="flex justify-between items-center">
        <div>
          {/* Leemos el nombre del perfil, o mostramos "Atleta" si aún está cargando */}
          <h1 className="text-2xl font-bold text-white">
            Hola, {profile?.name || "Atleta"}
          </h1>
          <p className="text-slate-400">¿Qué entrenamos hoy?</p>
        </div>
        {/* Conectamos el botón para que vaya a tu perfil */}
        <button
          onClick={() => navigate("/profile")}
          className="p-3 bg-slate-800 rounded-2xl text-yellow-400 hover:bg-slate-700 transition-colors"
          title="Ver perfil"
        >
          <Activity size={24} />
        </button>
      </header>

      {/* Botón Principal o Tarjeta de Sesión en Curso */}
      {inProgressWorkout ? (
        <section className="bg-gradient-to-br from-blue-950 via-slate-800 to-slate-900 border-2 border-blue-500 rounded-3xl p-6 shadow-xl shadow-blue-950/50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              ENTRENAMIENTO EN CURSO
            </span>
            <span className="text-xs text-slate-400">
              {formatWorkoutDate(inProgressWorkout.date)}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              {inProgressWorkout.routineName || "Sesión activa"}
            </h2>
            {inProgressWorkout.muscles && inProgressWorkout.muscles.length > 0 && (
              <p className="text-sm text-blue-300 mt-1">
                {inProgressWorkout.muscles.join(" • ")}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              const session = getWorkoutSession();
              if (session && session.workoutId === inProgressWorkout.id && session.path) {
                navigate(session.path);
              } else {
                navigate(`/workout/${inProgressWorkout.id}`);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 transition-all text-base"
          >
            <Play fill="currentColor" size={20} />
            <span>Continuar donde lo dejaste</span>
          </button>

          <div className="flex justify-center">
            <button
              onClick={() => navigate("/routines")}
              className="text-xs text-slate-400 hover:text-slate-300 underline py-0.5"
            >
              ¿Deseas iniciar una rutina diferente?
            </button>
          </div>
        </section>
      ) : (
        <section>
          <button
            onClick={() => navigate("/routines")}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all shadow-lg shadow-blue-900/30"
          >
            <div className="bg-white/20 p-5 rounded-full">
              <Play fill="currentColor" size={40} className="ml-2" />
            </div>
            <span className="text-2xl font-bold tracking-wide">
              Iniciar Entrenamiento
            </span>
          </button>
        </section>
      )}

      <section>
        <button
          onClick={() => navigate("/library")}
          className="w-full bg-slate-800 text-slate-300 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <BookOpen size={20} className="text-slate-400" />
          <span className="font-semibold">Mi Biblioteca</span>
        </button>
      </section>

      {/* Historial / Entrenamientos con selector de vista */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" />
            Entrenamientos
          </h2>

          {/* Selector de Vista: Lista vs Calendario */}
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List size={16} />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CalendarDays size={16} />
              <span>Calendario</span>
            </button>
          </div>
        </div>

        {/* Vista Calendario */}
        {viewMode === "calendar" && (
          <WorkoutCalendar workouts={workouts || []} />
        )}

        {/* Vista Lista */}
        {viewMode === "list" && (
          <div className="bg-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm border border-slate-700/50">
            {!workouts ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-blue-400" />
                <span>Cargando entrenamientos...</span>
              </div>
            ) : workouts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Dumbbell size={32} className="text-slate-600 mb-1" />
                <p>Aún no tienes entrenamientos registrados.</p>
                <p className="text-sm text-slate-500">¡Tu progreso aparecerá aquí!</p>
              </div>
            ) : (
              <>
                {visibleWorkouts.map((workout, index) => (
                  <div
                    key={workout.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (workout.duration) {
                        navigate(`/history/${workout.id}`);
                      } else {
                        navigate(`/workout/${workout.id}`);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (workout.duration) {
                          navigate(`/history/${workout.id}`);
                        } else {
                          navigate(`/workout/${workout.id}`);
                        }
                      }
                    }}
                    className={`flex items-center justify-between p-5 text-left hover:bg-slate-700/60 active:bg-slate-700 transition-colors group cursor-pointer ${
                      index !== visibleWorkouts.length - 1
                        ? "border-b border-slate-700/50"
                        : ""
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <p className="font-semibold text-white text-base group-hover:text-blue-300 transition-colors">
                        {formatWorkoutDate(workout.date)}
                      </p>

                      {/* Al lado de si está en progreso o lo que duró, incluimos qué se entrenó */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 flex-wrap">
                        <span
                          className={
                            workout.duration
                              ? "text-slate-400 flex items-center gap-1.5"
                              : "text-amber-400 font-semibold flex items-center gap-1.5"
                          }
                        >
                          {!workout.duration && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                          )}
                          {workout.duration
                            ? `${Math.floor(workout.duration / 60)} min`
                            : "En progreso"}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-blue-400 font-medium">
                          {workout.routineName ||
                            (workout.muscles.length > 0
                              ? workout.muscles.join(", ")
                              : "Entrenamiento")}
                        </span>
                      </div>

                      {/* Músculos trabajados */}
                      {workout.muscles && workout.muscles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {workout.muscles.map((muscle) => (
                            <span
                              key={muscle}
                              className="text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-md font-normal border border-slate-700/40"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteWorkout(e, workout)}
                        className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-all"
                        title="Eliminar este entrenamiento"
                        aria-label="Eliminar entrenamiento"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="bg-slate-700 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Elemento observador para scroll infinito */}
                {hasMore && (
                  <div
                    ref={observerRef}
                    className="p-4 text-center text-slate-400 flex flex-col items-center justify-center gap-2 border-t border-slate-700/40"
                  >
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                    <span className="text-xs">Cargando más entrenamientos...</span>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="text-xs text-blue-400 underline mt-1 hover:text-blue-300"
                    >
                      Cargar más manualmente
                    </button>
                  </div>
                )}

                {/* Pie de lista cuando se mostraron todos */}
                {!hasMore && workouts.length > 5 && (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-800/40 border-t border-slate-700/30">
                    Mostrando todos los entrenamientos ({workouts.length})
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
