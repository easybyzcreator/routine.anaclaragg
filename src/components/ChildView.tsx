import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Settings, Smile, Clock, Sparkles, Compass, AlertCircle, Heart, Star, CheckCircle, Flame, Calendar, Camera,
  Coffee, Shirt, BookOpen, Utensils, Gamepad2, Droplets, Moon, ShowerHead, Activity, Sun, Car
} from "lucide-react";
import { Task, ChoicePair, Alarm, RoutineLog } from "../types";
import ActiveTaskFocus from "./ActiveTaskFocus";
import AudioReaderButton from "./AudioReaderButton";

interface ChildViewProps {
  tasks: Task[];
  choicePairs: ChoicePair[];
  alarms: Alarm[];
  logs: RoutineLog[];
  childName: string;
  childPhoto?: string;
  letraBastao?: boolean;
  onToggleLetraBastao?: () => void;
  onUpdateChildPhoto?: (photo: string) => void;
  onOpenParentGate: () => void;
  onFinishTask: (taskId: string, durationSeconds: number, completedStepsCount: number, status: "completed" | "paused") => void;
  onTriggerDecompression: () => void;
}

export default function ChildView({
  tasks,
  choicePairs,
  alarms,
  logs,
  childName,
  childPhoto,
  letraBastao,
  onToggleLetraBastao,
  onUpdateChildPhoto,
  onOpenParentGate,
  onFinishTask,
  onTriggerDecompression,
}: ChildViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState("");

  // Live Mobile-Synced Clock effect: Updates every second
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setTimeStr(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Get titles of completed tasks today to filter out
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const completedTaskTitlesToday = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach(log => {
      if (log.status === "completed" && log.timestamp.startsWith(todayStr)) {
        set.add(log.taskTitle);
      }
    });
    return set;
  }, [logs, todayStr]);

  // 2. Filter tasks that are NOT completed today, and map each task to its scheduled alarm time
  const sortedUncompletedTasks = useMemo(() => {
    const activeAlarms = (alarms || []).filter(a => a.active);
    const currentDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Map tasks to their earliest active alarm time, or default to "23:59" if no alarm is set
    const tasksWithTimes = tasks.map(task => {
      const taskAlarm = activeAlarms.find(a => a.taskId === task.id || a.taskTitle === task.title);
      const time = taskAlarm ? taskAlarm.time : "23:59";
      return { task, time };
    });

    // Filter out tasks that are completed today or not scheduled for today
    const uncompleted = tasksWithTimes.filter(item => {
      const task = item.task;
      // If task has specific days configured, verify if today is included
      if (task.scheduleType === "custom" && task.daysOfWeek) {
        if (!task.daysOfWeek.includes(currentDayOfWeek)) {
          return false;
        }
      }
      return !completedTaskTitlesToday.has(task.title);
    });

    // Sort chronologically by time string
    uncompleted.sort((a, b) => a.time.localeCompare(b.time));

    return uncompleted.map(item => item.task);
  }, [tasks, alarms, completedTaskTitlesToday]);

  // Define dynamic Option 1 and Option 2 based on sequence rotation
  const taskA = sortedUncompletedTasks[0] || null;
  const taskB = sortedUncompletedTasks[1] || null;

  // Handle task selection
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBackToChoices = () => {
    setSelectedTaskId(null);
  };

  // When a child completes or leaves a task
  const handleFinishTaskInChild = (durationSeconds: number, completedStepsCount: number, status: "completed" | "paused") => {
    if (selectedTaskId) {
      onFinishTask(selectedTaskId, durationSeconds, completedStepsCount, status);
      setSelectedTaskId(null);
    }
  };

  // Date Formatter helper
  const getFormattedDate = () => {
    const daysOfWeek = [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
      "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const today = new Date();
    const dayName = daysOfWeek[today.getDay()];
    const dayNum = today.getDate();
    const monthName = months[today.getMonth()];
    
    return `Hoje é ${dayName}, ${dayNum} de ${monthName}`;
  };

  // Calculate dynamic transition message from nearest active alarm
  const getTransitionMessage = () => {
    const activeAlarms = (alarms || []).filter(a => a.active);
    if (activeAlarms.length === 0) {
      return "Pausa livre em 10 minutos";
    }

    // Sort by hours and minutes
    const now = new Date();
    const curMins = now.getHours() * 60 + now.getMinutes();

    const sorted = [...activeAlarms].sort((a, b) => {
      const [ah, am] = a.time.split(":").map(Number);
      const aMins = ah * 60 + am;
      const diffA = aMins - curMins;

      const [bh, bm] = b.time.split(":").map(Number);
      const bMins = bh * 60 + bm;
      const diffB = bMins - curMins;

      if (diffA >= 0 && diffB < 0) return -1;
      if (diffB >= 0 && diffA < 0) return 1;
      return Math.abs(diffA) - Math.abs(diffB);
    });

    const nearest = sorted[0];
    const [nh, nm] = nearest.time.split(":").map(Number);
    const nTotal = nh * 60 + nm;
    const diff = nTotal - curMins;

    if (diff > 0 && diff <= 60) {
      return `${nearest.taskTitle} em ${diff} minutos`;
    } else {
      return `${nearest.taskTitle} às ${nearest.time}`;
    }
  };

  const renderIconForTask = (iconName: string | undefined, index: number) => {
    const colorClass = index === 0 ? "text-[#3B82F6]" : "text-[#FF7A00]";
    switch (iconName) {
      case "Smile":
        return <Smile className={`w-16 h-16 ${colorClass}`} />;
      case "Sparkles":
        return <Sparkles className={`w-16 h-16 ${colorClass}`} />;
      case "Calendar":
        return <Calendar className={`w-16 h-16 ${colorClass}`} />;
      case "Coffee":
        return <Coffee className={`w-16 h-16 ${colorClass}`} />;
      case "Shirt":
        return <Shirt className={`w-16 h-16 ${colorClass}`} />;
      case "BookOpen":
        return <BookOpen className={`w-16 h-16 ${colorClass}`} />;
      case "Utensils":
        return <Utensils className={`w-16 h-16 ${colorClass}`} />;
      case "Heart":
        return <Heart className={`w-16 h-16 ${colorClass}`} />;
      case "Gamepad2":
        return <Gamepad2 className={`w-16 h-16 ${colorClass}`} />;
      case "Droplets":
        return <Droplets className={`w-16 h-16 ${colorClass}`} />;
      case "Moon":
        return <Moon className={`w-16 h-16 ${colorClass}`} />;
      case "ShowerHead":
        return <ShowerHead className={`w-16 h-16 ${colorClass}`} />;
      case "Activity":
        return <Activity className={`w-16 h-16 ${colorClass}`} />;
      case "Sun":
        return <Sun className={`w-16 h-16 ${colorClass}`} />;
      case "Car":
        return <Car className={`w-16 h-16 ${colorClass}`} />;
      default:
        return <Clock className={`w-16 h-16 ${colorClass}`} />;
    }
  };

  // If the child is inside an active task, display the dedicated Active Task Focus Component
  if (selectedTaskId) {
    const activeTask = tasks.find(t => t.id === selectedTaskId);
    if (activeTask) {
      return (
        <ActiveTaskFocus
          task={activeTask}
          onBack={handleBackToChoices}
          onFinishTask={handleFinishTaskInChild}
          onTriggerDecompression={onTriggerDecompression}
        />
      );
    }
  }

  return (
    <div id="child-view-container" className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between px-4 sm:px-6 py-8 md:px-12 select-none font-sans-custom">
      


      {/* 1. Header Row (Grounded on the screenshot visual balance) */}
      <header className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        
        {/* Mobile-only Top Row for Area da Família & Letra Bastão */}
        <div className="flex md:hidden justify-between items-center w-full gap-2">
          {onToggleLetraBastao && (
            <button
              onClick={onToggleLetraBastao}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[10px] transition shadow-xs cursor-pointer h-10 border ${
                letraBastao
                  ? "bg-orange-50 border-orange-200 text-[#FF7A00]"
                  : "bg-white border-gray-100 text-gray-600"
              }`}
              title="Alternar Letra Bastão (Caixa Alta)"
            >
              <span className="font-mono text-xs font-black">Aa</span>
              <span>{letraBastao ? "BASTÃO ATIVA" : "LETRA PADRÃO"}</span>
            </button>
          )}

          <button
            id="btn-enter-parental-area-mobile"
            onClick={onOpenParentGate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-xl font-extrabold text-[10px] transition shadow-xs cursor-pointer h-10 ml-auto"
            title="Área dos Responsáveis"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            <span>Área da Família</span>
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div className="relative group w-16 h-16 shrink-0">
            {childPhoto ? (
              <img
                src={childPhoto}
                alt="Foto da Criança"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Smile className="w-8 h-8" />
              </div>
            )}
            
            {onUpdateChildPhoto && (
              <label className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target?.result as string;
                        img.onload = () => {
                          const canvas = document.createElement("canvas");
                          const maxDim = 150;
                          let w = img.width;
                          let h = img.height;
                          if (w > h) {
                            if (w > maxDim) {
                              h = Math.round((h * maxDim) / w);
                              w = maxDim;
                            }
                          } else {
                            if (h > maxDim) {
                              w = Math.round((w * maxDim) / h);
                              h = maxDim;
                            }
                          }
                          canvas.width = w;
                          canvas.height = h;
                          const ctx = canvas.getContext("2d");
                          ctx?.drawImage(img, 0, 0, w, h);
                          const compressed = canvas.toDataURL("image/jpeg", 0.7);
                          onUpdateChildPhoto(compressed);
                        };
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[#1A2530] text-3xl sm:text-4xl font-black tracking-tight mb-1">
                Olá, {childName}!
              </h1>
              <AudioReaderButton
                text={`Olá, ${childName}! Hoje é sua sequência de atividades.`}
                title="Ouvir saudação em voz alta (gratuito)"
                size="sm"
              />
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-widest">
              Sua Sequência de Atividades
            </p>
            {/* Child Calendar, Date & Live Clock Badge */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-2 bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] px-3 py-1.5 rounded-xl text-xs font-black shadow-3xs w-fit">
                <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{getFormattedDate()}</span>
              </div>
              {timeStr && (
                <div className="flex items-center gap-2 bg-[#FFF1F2] text-[#E11D48] border border-[#FFE4E6] px-3 py-1.5 rounded-xl text-xs font-black shadow-3xs w-fit animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>{timeStr}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transition Warning, Letra Bastão toggle, and Family Button side-by-side */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Warning Banner Exactly Matching the Screenshot */}
          <div className="bg-[#FFF5ED] border border-[#FF7A00]/15 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 max-w-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-100 text-[#FF7A00] flex items-center justify-center rounded-full shrink-0">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-[#FF7A00] tracking-widest block uppercase">
                  AVISO DE TRANSIÇÃO
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#1A2530]">
                  {getTransitionMessage()}
                </span>
              </div>
            </div>
            <AudioReaderButton
              text={`Aviso de transição: ${getTransitionMessage()}`}
              title="Ouvir aviso de transição (gratuito)"
              size="sm"
            />
          </div>

          {/* Desktop Letra Bastão Toggle */}
          {onToggleLetraBastao && (
            <button
              onClick={onToggleLetraBastao}
              className={`hidden md:flex items-center gap-2 px-4 py-3 h-12 rounded-2xl font-black text-xs transition shadow-xs cursor-pointer border ${
                letraBastao
                  ? "bg-orange-50 border-orange-200 text-[#FF7A00]"
                  : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
              }`}
              title="Alternar Letra Bastão (Caixa Alta)"
            >
              <span className="font-mono text-sm font-black">Aa</span>
              <span>{letraBastao ? "BASTÃO ATIVA" : "LETRA PADRÃO"}</span>
            </button>
          )}

          {/* Parental Area Toggle (Desktop only) */}
          <button
            id="btn-enter-parental-area"
            onClick={onOpenParentGate}
            className="hidden md:flex items-center gap-2 px-4 py-3 h-12 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 rounded-2xl font-extrabold text-xs transition shadow-xs cursor-pointer"
            title="Área dos Responsáveis"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            <span>Área da Família</span>
          </button>
        </div>
      </header>

      {/* 2. Main Choice Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 w-full max-w-5xl mx-auto">
        
        {/* Centered Prompt */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2.5">
            <h2 className="font-display text-[#1A2530] text-3xl sm:text-4xl font-extrabold tracking-tight">
              {sortedUncompletedTasks.length === 0 
                ? "Tudo pronto por hoje!" 
                : "Qual você quer fazer primeiro?"}
            </h2>
            <AudioReaderButton
              text={sortedUncompletedTasks.length === 0 
                ? `Tudo pronto por hoje! Parabéns, ${childName}! Você completou toda a sua rotina com atenção e alegria!` 
                : "Qual você quer fazer primeiro? Dê um toque no seu card favorito para começar!"}
              title="Ouvir pergunta (gratuito)"
              size="md"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-bold mt-2 uppercase tracking-wide">
            {sortedUncompletedTasks.length === 0 
              ? "Você fez um trabalho brilhante! Parabéns!" 
              : "Dê um toque no seu card favorito para começar!"}
          </p>
        </div>

        {/* Dynamic sequencing rotation & finished routine check */}
        <div className="relative w-full max-w-3xl">
          {sortedUncompletedTasks.length === 0 ? (
            /* Completed All Tasks State / Celebration */
            <div className="bg-white border border-emerald-100 rounded-[32px] p-8 md:p-12 text-center space-y-6 shadow-md max-w-xl mx-auto w-full">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                <Star className="w-10 h-10 fill-emerald-400 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-[#1A2530] text-2xl sm:text-3xl font-black">Você completou tudo hoje! 🌟</h3>
                <p className="text-sm sm:text-base text-gray-500 font-bold leading-relaxed">
                  Parabéns, {childName}! Você cumpriu toda a sua rotina com muita atenção e dedicação. Você é incrível! 🏆
                </p>
              </div>
              <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 text-[#15803D] font-bold text-xs max-w-sm mx-auto">
                Peça aos seus pais para verificar o seu progresso brilhante no Painel da Família!
              </div>
              <button
                id="btn-finished-routine-goto-gate"
                onClick={onOpenParentGate}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition duration-200 cursor-pointer"
              >
                Acessar Painel da Família
              </button>
            </div>
          ) : sortedUncompletedTasks.length === 1 && taskA ? (
            /* Single Remaining Task - Full width centered */
            <div className="flex justify-center w-full max-w-md mx-auto">
              <div
                id={`btn-select-task-a-${taskA.id}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectTask(taskA.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelectTask(taskA.id);
                }}
                className="w-full bg-white border border-gray-100 hover:border-[#3B82F6]/30 rounded-[20px] xs:rounded-[32px] p-4 sm:p-6 flex flex-col justify-between h-[300px] sm:h-[370px] md:h-[430px] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.08)] cursor-pointer group relative overflow-hidden text-left"
              >
                {/* Free Audio Reader Button */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20" onClick={(e) => e.stopPropagation()}>
                  <AudioReaderButton
                    text={`Última tarefa do dia: ${taskA.title}. Duração estimada de ${taskA.durationMinutes} minutos. Tem ${taskA.steps.length} passos.`}
                    title="Ouvir esta tarefa em voz alta (gratuito)"
                    size="sm"
                    variant="pill"
                  />
                </div>

                {/* Visual block */}
                <div className="w-full h-38 sm:h-52 md:h-64 rounded-[14px] xs:rounded-[24px] bg-[#F0F4F8] overflow-hidden relative flex items-center justify-center">
                  {taskA.imageUrl ? (
                    <img 
                      src={taskA.imageUrl} 
                      alt={taskA.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-3 xs:p-5 sm:p-6 bg-blue-50/50 rounded-full group-hover:scale-110 transition duration-300">
                      {renderIconForTask(taskA.iconName, 0)}
                    </div>
                  )}

                  {/* Absolute Corner Tags */}
                  <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[11px] font-black px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full tracking-wider">
                    ⏱️ {taskA.durationMinutes} min
                  </span>

                  {!taskA.imageUrl && (
                    <span className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/95 text-[#1A2530] text-[8px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xs">
                      🎨 Ilustração
                    </span>
                  )}
                </div>

                {/* Text Block */}
                <div className="mt-2 sm:mt-4 text-center w-full">
                  <span className="text-[8px] sm:text-[10px] font-black text-[#3B82F6] uppercase tracking-widest block mb-0.5 sm:mb-1">
                    ÚLTIMA TAREFA DO DIA!
                  </span>
                  <h3 className="font-display text-xs xs:text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-[#1A2530] leading-tight px-1 sm:px-2 line-clamp-2 h-10 xs:h-12 sm:h-16 flex items-center justify-center group-hover:text-[#3B82F6] transition">
                    {taskA.title}
                  </h3>
                  <div className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase mt-0.5 sm:mt-1">
                    {taskA.steps.length} {taskA.steps.length === 1 ? "passo rápido" : "passos fáceis"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Choice Cards displaying standard/customized uploaded items */
            <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full relative">
              
              {/* Task A Card */}
              {taskA && (
                <div
                  id={`btn-select-task-a-${taskA.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTask(taskA.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelectTask(taskA.id);
                  }}
                  className="bg-white border border-gray-100 hover:border-[#3B82F6]/30 rounded-[20px] xs:rounded-[32px] p-2.5 xs:p-4 sm:p-6 flex flex-col justify-between h-[235px] xs:h-[300px] sm:h-[370px] md:h-[430px] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.08)] cursor-pointer group relative overflow-hidden text-left"
                >
                  {/* Audio Reader for Option 1 */}
                  <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20" onClick={(e) => e.stopPropagation()}>
                    <AudioReaderButton
                      text={`Opção 1: ${taskA.title}. Duração: ${taskA.durationMinutes} minutos. Tem ${taskA.steps.length} passos.`}
                      title="Ouvir opção 1 em voz alta (gratuito)"
                      size="sm"
                      variant="pill"
                    />
                  </div>

                  {/* Visual block */}
                  <div className="w-full h-24 xs:h-38 sm:h-52 md:h-64 rounded-[14px] xs:rounded-[24px] bg-[#F0F4F8] overflow-hidden relative flex items-center justify-center">
                    {taskA.imageUrl ? (
                      <img 
                        src={taskA.imageUrl} 
                        alt={taskA.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="p-3 xs:p-5 sm:p-6 bg-blue-50/50 rounded-full group-hover:scale-110 transition duration-300">
                        {renderIconForTask(taskA.iconName, 0)}
                      </div>
                    )}

                    {/* Absolute Corner Tags */}
                    <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[11px] font-black px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full tracking-wider">
                      ⏱️ {taskA.durationMinutes} min
                    </span>

                    {!taskA.imageUrl && (
                      <span className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/95 text-[#1A2530] text-[8px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xs">
                        🎨 Ilustração
                      </span>
                    )}
                  </div>

                  {/* Text Block */}
                  <div className="mt-2 sm:mt-4 text-center w-full">
                    <span className="text-[8px] sm:text-[10px] font-black text-[#3B82F6] uppercase tracking-widest block mb-0.5 sm:mb-1">
                      OPÇÃO 1
                    </span>
                    <h3 className="font-display text-xs xs:text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-[#1A2530] leading-tight px-1 sm:px-2 line-clamp-2 h-10 xs:h-12 sm:h-16 flex items-center justify-center group-hover:text-[#3B82F6] transition">
                      {taskA.title}
                    </h3>
                    <div className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase mt-0.5 sm:mt-1">
                      {taskA.steps.length} {taskA.steps.length === 1 ? "passo rápido" : "passos fáceis"}
                    </div>
                  </div>
                </div>
              )}

              {/* Task B Card */}
              {taskB && (
                <div
                  id={`btn-select-task-b-${taskB.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTask(taskB.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelectTask(taskB.id);
                  }}
                  className="bg-white border border-gray-100 hover:border-[#FF7A00]/30 rounded-[20px] xs:rounded-[32px] p-2.5 xs:p-4 sm:p-6 flex flex-col justify-between h-[235px] xs:h-[300px] sm:h-[370px] md:h-[430px] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(255,122,0,0.08)] cursor-pointer group relative overflow-hidden text-left"
                >
                  {/* Audio Reader for Option 2 */}
                  <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20" onClick={(e) => e.stopPropagation()}>
                    <AudioReaderButton
                      text={`Opção 2: ${taskB.title}. Duração: ${taskB.durationMinutes} minutos. Tem ${taskB.steps.length} passos.`}
                      title="Ouvir opção 2 em voz alta (gratuito)"
                      size="sm"
                      variant="pill"
                    />
                  </div>

                  {/* Visual block */}
                  <div className="w-full h-24 xs:h-38 sm:h-52 md:h-64 rounded-[14px] xs:rounded-[24px] bg-[#F5F0EC] overflow-hidden relative flex items-center justify-center">
                    {taskB.imageUrl ? (
                      <img 
                        src={taskB.imageUrl} 
                        alt={taskB.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="p-3 xs:p-5 sm:p-6 bg-orange-50/50 rounded-full group-hover:scale-110 transition duration-300">
                        {renderIconForTask(taskB.iconName, 1)}
                      </div>
                    )}

                    {/* Absolute Corner Tags */}
                    <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[11px] font-black px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full tracking-wider">
                      ⏱️ {taskB.durationMinutes} min
                    </span>

                    {!taskB.imageUrl && (
                      <span className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/95 text-[#1A2530] text-[8px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xs">
                        🎨 Ilustração
                      </span>
                    )}
                  </div>

                  {/* Text Block */}
                  <div className="mt-2 sm:mt-4 text-center w-full">
                    <span className="text-[8px] sm:text-[10px] font-black text-[#FF7A00] uppercase tracking-widest block mb-0.5 sm:mb-1">
                      OPÇÃO 2
                    </span>
                    <h3 className="font-display text-xs xs:text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-[#1A2530] leading-tight px-1 sm:px-2 line-clamp-2 h-10 xs:h-12 sm:h-16 flex items-center justify-center group-hover:text-[#FF7A00] transition">
                      {taskB.title}
                    </h3>
                    <div className="text-[9px] sm:text-xs text-gray-400 font-bold uppercase mt-0.5 sm:mt-1">
                      {taskB.steps.length} {taskB.steps.length === 1 ? "passo rápido" : "passos fáceis"}
                    </div>
                  </div>
                </div>
              )}

              {/* The "ou" Circle Overlapping beautifully in the center */}
              {taskA && taskB && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex w-9 h-9 sm:w-14 sm:h-14 bg-[#1A2530] text-white rounded-full items-center justify-center font-display text-[11px] sm:text-lg font-extrabold border-2.5 sm:border-[5px] border-[#FAF9F6] shadow-md pointer-events-none select-none">
                  ou
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer Decompression Button (Highly accessible, sensory-friendly) */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col items-center pt-8 border-t border-gray-100">
        <button
          id="btn-active-decompression-child"
          onClick={onTriggerDecompression}
          className="px-8 py-5 bg-orange-50 hover:bg-orange-100/80 text-[#FF7A00] font-black rounded-2xl text-sm transition duration-200 shadow-xs flex items-center gap-2.5 cursor-pointer animate-pulse"
        >
          <Smile className="w-5.5 h-5.5" />
          <span>Preciso de uma Pausa / Descompressão</span>
        </button>

        {/* Fabrine Methodology Tag in Footer */}
        <div className="mt-36 flex justify-center">
          <a 
            href="https://fabrinefernandes.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-3 bg-white border border-gray-150 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs w-full max-w-[280px] sm:max-w-sm hover:scale-105 active:scale-98 transition duration-200 cursor-pointer block text-left"
            id="link-fabrine-methodology-child"
          >
            <img 
              src="https://i.ibb.co/35xmCgjs/fabrine-logo.png" 
              alt="Logo Fabrine" 
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full bg-white shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col select-none text-left min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1 shrink-0">
                METODOLOGIA
              </span>
              <span className="text-xs sm:text-sm font-black text-[#1E293B] leading-tight whitespace-nowrap mb-0.5">
                Fabrine Fernandes
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none shrink-0">
                Neuropsicopedagoga
              </span>
            </div>
          </a>
        </div>

        {/* Patitour Developed By Footer with generous spacing */}
        <div className="flex flex-col items-center justify-center text-center gap-2.5 mt-8 mb-6 select-none">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            Desenvolvido por
          </span>
          <a 
            href="https://www.easybyzcreator.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:scale-105 active:scale-98 transition duration-200 cursor-pointer block"
            id="link-easybyz-child"
          >
            <img 
              src="https://i.ibb.co/6RMHG2Bm/patitour-2026-07-22-T152839-769.png" 
              alt="Logo Patitour / Easy Byz Creator" 
              className="object-contain"
              style={{ height: "3cm" }}
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}
