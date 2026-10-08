import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Pause, ArrowLeft, RefreshCw, Star, Smile, Sparkles, Volume2 } from "lucide-react";
import { Task, SubStep } from "../types";
import synth from "../utils/audio";
import AudioReaderButton from "./AudioReaderButton";

interface ActiveTaskFocusProps {
  task: Task;
  onBack: () => void;
  onFinishTask: (durationSeconds: number, completedStepsCount: number, status: "completed" | "paused") => void;
  onTriggerDecompression: () => void;
}

export default function ActiveTaskFocus({
  task,
  onBack,
  onFinishTask,
  onTriggerDecompression,
}: ActiveTaskFocusProps) {
  // Timer state
  const totalDurationSeconds = task.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState<number>(totalDurationSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);

  // Stepper state
  const [steps, setSteps] = useState<SubStep[]>(
    task.steps.map(s => ({ ...s, completed: false }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Success celebration overlay state
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [timeOutFriendly, setTimeOutFriendly] = useState<boolean>(false);

  // Sound feedback flag
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Timer Tick Hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
        setSessionElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      // Natural transition timer finished!
      setIsActive(false);
      setTimeOutFriendly(true);
      if (soundEnabled) {
        synth.playTransitionChime();
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  // Handle step completion
  const handleToggleStep = (index: number) => {
    const updated = [...steps];
    updated[index].completed = !updated[index].completed;
    setSteps(updated);

    if (updated[index].completed) {
      // Trigger a light completion chime
      if (soundEnabled) {
        synth.playSuccessChime();
      }
      
      // Auto-advance to next step if there is one
      if (index === currentStepIndex && index < steps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(index + 1);
        }, 500);
      }
    }
  };

  // Quick helper to check if all steps are completed
  const allStepsCompleted = steps.length > 0 && steps.every(s => s.completed);

  // Action: Completed Entire Task!
  const handleCompleteTask = () => {
    if (soundEnabled) {
      synth.playSuccessChime();
    }
    setShowCelebration(true);
  };

  const handleConfirmFinish = () => {
    const completedCount = steps.filter(s => s.completed).length;
    onFinishTask(sessionElapsedSeconds, completedCount, "completed");
  };

  // Visual Timer calculations
  const progressPercent = (secondsLeft / totalDurationSeconds) * 100;
  
  // Format MM:SS strictly for screen helpers but visual is primary
  const formatTimeMinutes = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Choose the visual timer color to keep it soothing
  const getTimerStrokeColor = () => {
    if (progressPercent > 50) return "#3B82F6"; // High contrast calm blue
    if (progressPercent > 20) return "#FF7A00"; // TDAH warm orange
    return "#10B981"; // Gentle success/relaxed green (no stressful red warnings!)
  };

  return (
    <div id="active-task-container" className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto border-b border-gray-100 pb-4 mb-4">
        <button
          id="btn-back-to-choices"
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-150 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2 max-w-[220px] sm:max-w-xs">
          <h2 className="text-base font-extrabold text-[#1E293B] tracking-tight truncate">
            {task.title}
          </h2>
          <AudioReaderButton
            text={`${task.title}. ${task.description || ""}. Tempo estimado: ${task.durationMinutes} minutos.`}
            title="Ouvir título da tarefa e instruções (gratuito)"
            size="sm"
          />
        </div>

        {/* Sound Toggle */}
        <button
          id="toggle-task-audio"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl border transition ${
            soundEnabled 
              ? "bg-blue-50 border-blue-200 text-blue-600" 
              : "bg-gray-100 border-gray-200 text-gray-400"
          }`}
          title="Sons de Progresso"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Focus Area (Grid/Flex) */}
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 py-4">
        
        {/* Left Side: Visual ADHD Timer (Color block & Sweep) */}
        <div className="flex flex-col items-center justify-center space-y-4 shrink-0">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            
            {/* SVG Soothing Timer Loop */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Diminishing sweep block */}
              <motion.circle
                id="timer-progress-ring"
                cx="50%"
                cy="50%"
                r="42%"
                stroke={getTimerStrokeColor()}
                strokeWidth="12"
                strokeDasharray="264%" // Approx 2 * pi * r
                animate={{
                  strokeDashoffset: `${264 - (264 * progressPercent) / 100}%`,
                }}
                transition={{ duration: 0.5, ease: "linear" }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* In-circle Visual Cue */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              {isActive ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-1"
                  >
                    <Star className="w-6 h-6 text-[#3B82F6]" />
                  </motion.div>
                  <span className="text-xs font-bold text-gray-400 tracking-wider">TEMPO RESTANTE</span>
                  <span className="text-3xl font-extrabold text-gray-700 tracking-tight font-mono">
                    {formatTimeMinutes()}
                  </span>
                </>
              ) : (
                <div className="text-center space-y-1">
                  <Smile className="w-12 h-12 text-[#10B981] mx-auto animate-bounce" />
                  <span className="text-sm font-bold text-[#10B981]">Concluído!</span>
                </div>
              )}
            </div>
          </div>

          {/* Local Timer Controls */}
          <div className="flex gap-2">
            <button
              id="btn-pause-task-timer"
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  : "bg-blue-100 border-blue-200 text-blue-700 font-extrabold animate-pulse"
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{isActive ? "Pausar" : "Retomar"}</span>
            </button>
            
            <button
              id="btn-reset-task-timer"
              onClick={() => {
                if (confirm("Quer reiniciar o tempo desta tarefa?")) {
                  setSecondsLeft(totalDurationSeconds);
                  setIsActive(true);
                }
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition cursor-pointer"
              title="Reiniciar tempo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Step-by-Step Chunking (Micro-passos) */}
        <div className="flex-1 w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-50 pb-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-[#FF7A00] uppercase tracking-wider">
                Passo a Passo (Fracionado)
              </span>
              <h3 className="font-bold text-gray-800 text-base mt-0.5">Faça um passo de cada vez</h3>
            </div>
            <AudioReaderButton
              text="Passo a passo fracionado: Faça um passo de cada vez."
              title="Ouvir instrução (gratuito)"
              size="sm"
            />
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {steps.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 italic">
                Nenhum micro-passo configurado. Siga para concluir diretamente!
              </div>
            ) : (
              steps.map((step, idx) => {
                let stepText = step.title;
                if (stepText.includes("Escolher a camiseta") && !stepText.includes("vestido")) {
                  stepText = "Escolher a camiseta, calça, saia, bermuda ou vestido que mais gosta";
                }

                return (
                  <div
                    id={`step-row-child-${step.id}`}
                    key={step.id}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      step.completed
                        ? "bg-emerald-50/50 border-emerald-200 text-[#10B981]"
                        : idx === currentStepIndex
                        ? "border-[#3B82F6] bg-blue-50/30 ring-2 ring-[#3B82F6]/10"
                        : "border-gray-100 hover:border-gray-200 text-gray-600 bg-white"
                    }`}
                  >
                    {/* Checkbox and step text trigger */}
                    <button
                      type="button"
                      id={`btn-toggle-step-child-${step.id}`}
                      onClick={() => handleToggleStep(idx)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                    >
                      {/* Step status checkbox */}
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                        step.completed
                          ? "bg-[#10B981] border-[#10B981] text-white"
                          : idx === currentStepIndex
                          ? "border-[#3B82F6]"
                          : "border-gray-200"
                      }`}>
                        {step.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-sm font-semibold leading-snug ${step.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {stepText}
                        </p>
                      </div>

                      {/* Step image preview */}
                      {step.imageUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                          <img src={step.imageUrl} alt={stepText} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </button>

                    {/* Audio Reader for the specific step sentence */}
                    <AudioReaderButton
                      text={stepText}
                      title="Ouvir leitura deste passo em voz alta (gratuito)"
                      size="sm"
                      variant="ghost"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Helper Tip with Audio Read */}
          <div className="bg-gray-50 rounded-2xl p-3 flex gap-2.5 items-center justify-between">
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-[#FF7A00]/10 rounded-lg text-[#FF7A00] shrink-0 mt-0.5">
                <Smile className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Marque o quadradinho quando terminar cada etapa. O importante é fazer no seu ritmo, sem pressa!
              </p>
            </div>
            <AudioReaderButton
              text="Marque o quadradinho quando terminar cada etapa. O importante é fazer no seu ritmo, sem pressa!"
              title="Ouvir dica (gratuito)"
              size="sm"
            />
          </div>
        </div>

      </main>

      {/* Floating Decompression and Completion Bar */}
      <footer className="w-full max-w-2xl mx-auto flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
        {/* Fixed Active Decompression Button */}
        <button
          id="btn-active-decompression-active-task"
          onClick={onTriggerDecompression}
          className="px-4 py-3 bg-orange-100 hover:bg-orange-200 text-[#FF7A00] font-bold rounded-2xl text-xs transition duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
        >
          <Smile className="w-4 h-4 text-[#FF7A00]" />
          <span>Preciso de uma Pausa</span>
        </button>

        {/* Task Completion CTA */}
        <button
          id="btn-finish-active-task"
          onClick={handleCompleteTask}
          disabled={steps.length > 0 && !allStepsCompleted}
          className={`px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
            allStepsCompleted || steps.length === 0
              ? "bg-[#10B981] hover:bg-[#0E9F6E] text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Terminei tudo!</span>
        </button>
      </footer>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            id="celebration-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-12 h-12 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  Parabéns! 🎉
                </h3>
                <p className="text-base text-gray-600 px-4">
                  Você concluiu a tarefa <strong>{task.title}</strong> com muito capricho! Seu esforço vale ouro.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                  Status atualizado para: <span className="underline">Feito!</span> e registrado com sucesso para a família.
                </p>
              </div>

              <button
                id="btn-confirm-celebration"
                onClick={handleConfirmFinish}
                className="w-full py-4 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-extrabold rounded-2xl text-base shadow-lg transition-all cursor-pointer"
              >
                Continuar Rotina
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friendly Timeout Modal (Natural consequences, no shame!) */}
      <AnimatePresence>
        {timeOutFriendly && (
          <motion.div
            id="timeout-friendly-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-sm space-y-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto">
                <Smile className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                  Tempo Concluído! ⏱️
                </h3>
                <p className="text-sm text-gray-600">
                  Está tudo bem se você não terminou todos os passos. Você deu o seu melhor e se esforçou!
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs font-medium text-blue-800">
                Lembrete: o foco do app é o seu bem-estar, nunca punições. Vamos registrar as etapas concluídas e seguir em frente de cabeça erguida!
              </div>

              <button
                id="btn-confirm-timeout"
                onClick={handleConfirmFinish}
                className="w-full py-4 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-md transition cursor-pointer"
              >
                Registrar e Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
