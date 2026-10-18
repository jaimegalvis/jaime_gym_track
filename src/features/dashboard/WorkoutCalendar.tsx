import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowIcon,
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  Play,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutWithDetails } from './Dashboard';

interface WorkoutCalendarProps {
  workouts: WorkoutWithDetails[];
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  const navigate = useNavigate();
  const today = new Date();

  // Fecha actual que se está visualizando en el calendario
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Helper para crear claves 'YYYY-MM-DD'
  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Día seleccionado (por defecto hoy)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Mapear entrenamientos por fecha 'YYYY-MM-DD'
  const workoutsByDate = workouts.reduce<Record<string, WorkoutWithDetails[]>>(
    (acc, workout) => {
      if (!acc[workout.date]) {
        acc[workout.date] = [];
      }
      acc[workout.date].push(workout);
      return acc;
    },
    {}
  );

  // Navegación de meses
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDateKey(todayKey);
  };

  // Nombre del mes en español
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(
    viewDate
  );
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Días en el mes actual
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Primer día de la semana (Lunes = 0, Domingo = 6)
  const firstDayOfWeek =
    (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  // Días del mes
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Contar entrenamientos de este mes
  const workoutsThisMonth = workouts.filter((w) => {
    const [y, m] = w.date.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1;
  });

  // Entrenamientos del día seleccionado
  const selectedDayWorkouts = selectedDateKey
    ? workoutsByDate[selectedDateKey] || []
    : [];

  // Formatear fecha seleccionada para encabezado
  const formatSelectedDateTitle = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    const formatted = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const isCurrentMonthView =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="flex flex-col gap-4">
      {/* Contenedor del Calendario */}
      <div className="bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-700/60 flex flex-col gap-4">
        {/* Cabecera del mes con controles */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {capitalizedMonth} {viewYear}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {workoutsThisMonth.length}{' '}
              {workoutsThisMonth.length === 1
                ? 'entrenamiento este mes'
                : 'entrenamientos este mes'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {!isCurrentMonthView && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-400 px-2.5 py-1.5 rounded-xl font-medium transition-colors mr-1"
              >
                Hoy
              </button>
            )}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 bg-slate-700/70 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-700/50">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Espacios vacíos antes del primer día del mes */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {/* Días del mes */}
          {daysArray.map((day) => {
            const dateKey = formatDateKey(viewYear, viewMonth, day);
            const dayWorkouts = workoutsByDate[dateKey] || [];
            const hasWorkout = dayWorkouts.length > 0;
            const hasInProgress = dayWorkouts.some((w) => !w.duration);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDateKey(dateKey)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
                  hasWorkout
                    ? isSelected
                      ? 'bg-blue-600 text-white ring-2 ring-white shadow-lg shadow-blue-900/40 scale-105 z-10'
                      : 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-sm shadow-blue-950/40'
                    : isSelected
                    ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                    : isToday
                    ? 'bg-slate-800/80 border-2 border-blue-500/70 text-blue-400 hover:bg-slate-700'
                    : 'bg-slate-900/40 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span>{day}</span>

                {/* Indicadores visuales de entrenamiento */}
                {hasWorkout && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasInProgress ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                        title="En progreso"
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                    )}
                    {dayWorkouts.length > 1 && (
                      <span className="text-[9px] font-bold text-white/90 leading-none">
                        +{dayWorkouts.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-600 inline-block shadow-sm" />
            <span>Día con entrenamiento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border border-blue-500/80 bg-slate-800 inline-block" />
            <span>Hoy</span>
          </div>
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      <div className="bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-700/60 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-400" />
            <h4 className="font-semibold text-white text-sm sm:text-base">
              {formatSelectedDateTitle(selectedDateKey)}
            </h4>
          </div>
          {selectedDayWorkouts.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium">
              {selectedDayWorkouts.length}{' '}
              {selectedDayWorkouts.length === 1 ? 'sesión' : 'sesiones'}
            </span>
          )}
        </div>

        {selectedDayWorkouts.length === 0 ? (
          <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <Dumbbell size={28} className="text-slate-600" />
            <p className="text-sm">No hubo entrenamientos este día.</p>
            {selectedDateKey === todayKey && (
              <button
                type="button"
                onClick={() => navigate('/routines')}
                className="mt-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-900/30"
              >
                <Play size={14} fill="currentColor" />
                ¡Comenzar a entrenar hoy!
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedDayWorkouts.map((workout) => (
              <button
                key={workout.id}
                type="button"
                onClick={() => {
                  if (workout.duration) {
                    navigate(`/history/${workout.id}`);
                  } else {
                    navigate(`/workout/${workout.id}`);
                  }
                }}
                className="w-full bg-slate-900/70 hover:bg-slate-700/80 p-4 rounded-2xl flex items-center justify-between text-left transition-colors border border-slate-700/50 group"
              >
                <div className="flex flex-col gap-1 pr-2">
                  <span className="font-semibold text-white text-base group-hover:text-blue-300 transition-colors">
                    {workout.routineName || 'Entrenamiento'}
                  </span>

                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span
                      className={
                        workout.duration
                          ? 'text-slate-400 flex items-center gap-1'
                          : 'text-amber-400 font-semibold flex items-center gap-1'
                      }
                    >
                      <Clock size={13} />
                      {workout.duration
                        ? `${Math.floor(workout.duration / 60)} min`
                        : 'En progreso'}
                    </span>

                    {workout.muscles && workout.muscles.length > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-blue-400 font-medium">
                          {workout.muscles.join(', ')}
                        </span>
                      </>
                    )}
                  </div>

                  {workout.muscles && workout.muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {workout.muscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-2 rounded-full shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ArrowIcon size={18} className="text-slate-300 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
