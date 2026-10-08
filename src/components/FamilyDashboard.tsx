import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Trash, Sparkles, Bell, Clock, LogOut, Check, Edit, Save, 
  Trash2, Upload, Calendar, Layers, CheckSquare, RefreshCw, Star, Info, Camera, Smile,
  Volume2, Printer, X, Coffee, Shirt, BookOpen, Utensils, Gamepad2, Droplets, Moon, ShowerHead, Activity, Sun, Car, Heart
} from "lucide-react";
import { Task, SubStep, ChoicePair, Alarm, RoutineLog } from "../types";
import { AUTISM_DEFAULT_TASKS } from "../data/defaultRoutines";
import ProgressChart from "./ProgressChart";
import synth, { 
  getSavedVoiceName, 
  setSavedVoiceName, 
  getSavedVoiceRate, 
  setSavedVoiceRate, 
  getSavedVoicePitch, 
  setSavedVoicePitch, 
  previewVoice, 
  stopSpeaking 
} from "../utils/audio";

interface FamilyDashboardProps {
  tasks: Task[];
  choicePairs: ChoicePair[];
  alarms: Alarm[];
  logs: RoutineLog[];
  childName: string;
  childPhoto?: string;
  letraBastao?: boolean;
  onToggleLetraBastao?: () => void;
  isAnonymousUser?: boolean;
  onUpdateChildName: (name: string) => void;
  onUpdateChildPhoto?: (photo: string) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateChoicePairs: (pairs: ChoicePair[]) => void;
  onUpdateAlarms: (alarms: Alarm[]) => void;
  onClearLogs: () => void;
  onReturnToChild: () => void;
  onTriggerMockNotification: (title: string, message: string) => void;
  onSignOut?: () => void;
  onChangePassword?: (newPassword: string) => Promise<void>;
  onRestoreAutismRoutines?: () => void;
}

// Helper para comprimir imagem no lado do cliente usando HTML5 Canvas (evitando exceder limites de tamanho de documento do Firestore de 1MB)
const compressImage = (file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo a proporção (aspect ratio)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string); // fallback caso falhe o contexto
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Comprimir como JPEG com qualidade reduzida (gera imagens super leves de 10-30KB)
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export default function FamilyDashboard({
  tasks,
  choicePairs,
  alarms,
  logs,
  childName,
  childPhoto,
  letraBastao,
  onToggleLetraBastao,
  isAnonymousUser,
  onUpdateChildName,
  onUpdateChildPhoto,
  onUpdateTasks,
  onUpdateChoicePairs,
  onUpdateAlarms,
  onClearLogs,
  onReturnToChild,
  onTriggerMockNotification,
  onSignOut,
  onChangePassword,
  onRestoreAutismRoutines,
}: FamilyDashboardProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "pairs" | "alarms" | "history">("tasks");

  // State for TTS Voice Selection
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => getSavedVoiceName());
  const [voiceRate, setVoiceRate] = useState<number>(() => getSavedVoiceRate());
  const [voicePitch, setVoicePitch] = useState<number>(() => getSavedVoicePitch());
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState<boolean>(false);
  const [voiceSavedFeedback, setVoiceSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    const updateVoiceList = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const vList = window.speechSynthesis.getVoices();
        setAvailableVoices(vList);
      }
    };

    updateVoiceList();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }
  }, []);

  const handleSelectVoice = (name: string) => {
    setSelectedVoice(name);
    setSavedVoiceName(name);
    setVoiceSavedFeedback(true);
    setTimeout(() => setVoiceSavedFeedback(false), 2500);
  };

  const handleRateChange = (newRate: number) => {
    setVoiceRate(newRate);
    setSavedVoiceRate(newRate);
  };

  const handlePitchChange = (newPitch: number) => {
    setVoicePitch(newPitch);
    setSavedVoicePitch(newPitch);
  };

  const handleTestVoice = () => {
    if (isPlayingVoicePreview) {
      stopSpeaking();
      setIsPlayingVoicePreview(false);
      return;
    }
    setIsPlayingVoicePreview(true);
    previewVoice(
      selectedVoice,
      voiceRate,
      voicePitch,
      `Olá! Esta é a voz que lerá as tarefas e passos no Easy Routine para a criança.`,
      () => setIsPlayingVoicePreview(false)
    );
  };

  const portugueseVoices = availableVoices.filter(
    (v) => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang.startsWith("pt")
  );
  const otherVoices = availableVoices.filter((v) => !portugueseVoices.includes(v));

  // State for Editing/Adding Task
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [newStepTitle, setNewStepTitle] = useState<string>("");

  // State for Editing/Adding Choice Pair
  const [editingPair, setEditingPair] = useState<Partial<ChoicePair> | null>(null);

  // State for Editing/Adding Alarm
  const [editingAlarm, setEditingAlarm] = useState<Partial<Alarm> | null>(null);

  // References for smooth scrolling to editors
  const taskEditorRef = useRef<HTMLDivElement>(null);
  const pairEditorRef = useRef<HTMLDivElement>(null);
  const alarmEditorRef = useRef<HTMLDivElement>(null);

  // Helper for immediate smooth scroll to top of editor panel
  const scrollToEditor = (elementId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  // Auto scroll up to task editor whenever a task is opened for editing or created
  useEffect(() => {
    if (editingTask) {
      const t1 = setTimeout(() => scrollToEditor("task-editor"), 30);
      const t2 = setTimeout(() => scrollToEditor("task-editor"), 120);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [editingTask ? (editingTask.id || "new-task") : null]);

  // Auto scroll up to pair editor
  useEffect(() => {
    if (editingPair) {
      const t1 = setTimeout(() => scrollToEditor("pair-editor"), 30);
      const t2 = setTimeout(() => scrollToEditor("pair-editor"), 120);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [editingPair ? (editingPair.id || "new-pair") : null]);

  // Auto scroll up to alarm editor
  useEffect(() => {
    if (editingAlarm) {
      const t1 = setTimeout(() => scrollToEditor("alarm-editor"), 30);
      const t2 = setTimeout(() => scrollToEditor("alarm-editor"), 120);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [editingAlarm ? (editingAlarm.id || "new-alarm") : null]);

  // Password alteration state
  const [newPassword, setNewPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sound configuration state
  const [alertSound, setAlertSound] = useState<string>(
    () => localStorage.getItem("easy_routine_alert_sound") || "tibetan_bell"
  );

  // Print iframe warning state
  const [showPrintIframeWarning, setShowPrintIframeWarning] = useState<boolean>(false);

  // Expanded autism routine icon options
  const iconOptions = [
    "Smile", "Clock", "Coffee", "Shirt", "BookOpen", "Sparkles", "Utensils", 
    "Heart", "Gamepad2", "Droplets", "Moon", "ShowerHead", "Activity", "Sun", "Car", "Calendar"
  ];

  const renderTaskCardIcon = (iconName: string | undefined) => {
    switch (iconName) {
      case "Smile":
        return <Smile className="w-8 h-8" />;
      case "Coffee":
        return <Coffee className="w-8 h-8" />;
      case "Shirt":
        return <Shirt className="w-8 h-8" />;
      case "BookOpen":
        return <BookOpen className="w-8 h-8" />;
      case "Sparkles":
        return <Sparkles className="w-8 h-8" />;
      case "Utensils":
        return <Utensils className="w-8 h-8" />;
      case "Heart":
        return <Heart className="w-8 h-8" />;
      case "Gamepad2":
        return <Gamepad2 className="w-8 h-8" />;
      case "Droplets":
        return <Droplets className="w-8 h-8" />;
      case "Moon":
        return <Moon className="w-8 h-8" />;
      case "ShowerHead":
        return <ShowerHead className="w-8 h-8" />;
      case "Activity":
        return <Activity className="w-8 h-8" />;
      case "Sun":
        return <Sun className="w-8 h-8" />;
      case "Car":
        return <Car className="w-8 h-8" />;
      case "Calendar":
        return <Calendar className="w-8 h-8" />;
      default:
        return <Clock className="w-8 h-8" />;
    }
  };

  // Handle Photo upload convert to Base64 com compressão de imagem em tempo real
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isStep: boolean, stepId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64String = await compressImage(file, 400, 400, 0.6);
      if (isStep && stepId && editingTask) {
        const updatedSteps = (editingTask.steps || []).map(step => 
          step.id === stepId ? { ...step, imageUrl: base64String } : step
        );
        setEditingTask({ ...editingTask, steps: updatedSteps });
      } else if (editingTask) {
        setEditingTask({ ...editingTask, imageUrl: base64String });
      }
    } catch (err) {
      console.error("Erro ao comprimir e processar imagem:", err);
      alert("Não foi possível carregar esta foto. Por favor, tente enviar outra imagem.");
    }
  };

  // Task Actions
  const handleSaveTask = () => {
    if (!editingTask?.title) return;
    
    const taskToSave: Task = {
      id: editingTask.id || `task_${Date.now()}`,
      title: editingTask.title,
      description: editingTask.description || "",
      durationMinutes: editingTask.durationMinutes || 10,
      imageUrl: editingTask.imageUrl,
      iconName: editingTask.iconName || "Clock",
      steps: editingTask.steps || [],
      scheduleType: editingTask.scheduleType || "fixed",
      daysOfWeek: editingTask.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    };

    let updatedTasks = [...tasks];
    const index = tasks.findIndex(t => t.id === taskToSave.id);
    if (index >= 0) {
      updatedTasks[index] = taskToSave;
    } else {
      updatedTasks.push(taskToSave);
    }

    onUpdateTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
    // Also cleanup choice pairs referencing this task
    onUpdateChoicePairs(choicePairs.filter(p => p.taskAId !== id && p.taskBId !== id));
  };

  const handleAddStepToTask = () => {
    if (!newStepTitle.trim() || !editingTask) return;
    const newStep: SubStep = {
      id: `step_${Date.now()}`,
      title: newStepTitle.trim(),
      completed: false
    };
    setEditingTask({
      ...editingTask,
      steps: [...(editingTask.steps || []), newStep]
    });
    setNewStepTitle("");
  };

  const handleDeleteStepFromTask = (stepId: string) => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      steps: (editingTask.steps || []).filter(s => s.id !== stepId)
    });
  };

  // Choice Pair Actions
  const handleSaveChoicePair = () => {
    if (!editingPair?.taskAId || !editingPair?.taskBId || !editingPair?.label) {
      alert("Por favor, preencha o título da rotina e selecione as duas tarefas.");
      return;
    }
    if (editingPair.taskAId === editingPair.taskBId) {
      alert("As duas tarefas de escolha devem ser diferentes!");
      return;
    }

    const pairToSave: ChoicePair = {
      id: editingPair.id || `pair_${Date.now()}`,
      label: editingPair.label,
      taskAId: editingPair.taskAId,
      taskBId: editingPair.taskBId,
      active: editingPair.active ?? false,
    };

    let updatedPairs = [...choicePairs];
    const index = choicePairs.findIndex(p => p.id === pairToSave.id);
    if (index >= 0) {
      updatedPairs[index] = pairToSave;
    } else {
      updatedPairs.push(pairToSave);
    }

    onUpdateChoicePairs(updatedPairs);
    setEditingPair(null);
  };

  const handleDeleteChoicePair = (id: string) => {
    onUpdateChoicePairs(choicePairs.filter(p => p.id !== id));
  };

  const togglePairActive = (id: string) => {
    // Set selected pair to active, others to inactive (one active pair at a time)
    const updated = choicePairs.map(p => ({
      ...p,
      active: p.id === id ? !p.active : false
    }));
    onUpdateChoicePairs(updated);
  };

  // Alarm Actions
  const handleSaveAlarm = () => {
    if (!editingAlarm?.time || !editingAlarm?.taskId) {
      alert("Por favor, preencha o horário e selecione a tarefa correspondente.");
      return;
    }

    const taskObj = tasks.find(t => t.id === editingAlarm.taskId);

    const alarmToSave: Alarm = {
      id: editingAlarm.id || `alarm_${Date.now()}`,
      taskId: editingAlarm.taskId,
      taskTitle: taskObj?.title || "Tarefa Desconhecida",
      time: editingAlarm.time,
      earlyWarningMinutes: editingAlarm.earlyWarningMinutes || 15,
      active: editingAlarm.active ?? true,
      repeatDays: editingAlarm.repeatDays || [1, 2, 3, 4, 5], // Mon-Fri default
    };

    let updatedAlarms = [...alarms];
    const index = alarms.findIndex(a => a.id === alarmToSave.id);
    if (index >= 0) {
      updatedAlarms[index] = alarmToSave;
    } else {
      updatedAlarms.push(alarmToSave);
    }

    onUpdateAlarms(updatedAlarms);
    setEditingAlarm(null);

    // Send a positive test warning to confirm
    onTriggerMockNotification(
      "Alarme Configurado!",
      `Aviso de transição programado para ${alarmToSave.earlyWarningMinutes} min antes das ${alarmToSave.time} para: ${alarmToSave.taskTitle}.`
    );
  };

  const handleDeleteAlarm = (id: string) => {
    onUpdateAlarms(alarms.filter(a => a.id !== id));
  };

  const toggleAlarmActive = (id: string) => {
    const updated = alarms.map(a => a.id === id ? { ...a, active: !a.active } : a);
    onUpdateAlarms(updated);
  };

  const toggleAlarmDay = (day: number) => {
    if (!editingAlarm) return;
    const currentDays = editingAlarm.repeatDays || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    setEditingAlarm({ ...editingAlarm, repeatDays: updatedDays });
  };

  return (
    <div id="family-dashboard" className="min-h-screen bg-[#FAF9F6] text-[#1E293B]">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Layers className="w-6 h-6 text-[#FF7A00]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">Painel da Família</h1>
            <p className="text-xs text-[#FF7A00] font-semibold">Configuração & Gestão de Rotinas</p>
          </div>
        </div>

        {/* Fabrine Methodology Tag */}
        <a 
          href="https://fabrinefernandes.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-3 bg-[#FAF9F6] border border-gray-150 rounded-2xl px-4 py-2 shadow-xs shrink-0 hover:scale-105 active:scale-98 transition duration-200 cursor-pointer text-left"
          id="link-fabrine-methodology-family"
        >
          <img 
            src="https://i.ibb.co/35xmCgjs/fabrine-logo.png" 
            alt="Logo Fabrine" 
            className="w-9 h-9 object-contain rounded-full bg-white shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col select-none text-left">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
              METODOLOGIA
            </span>
            <span className="text-xs font-black text-slate-700 leading-tight mb-0.5">
              Fabrine Fernandes
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
              Neuropsicopedagoga
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          {onToggleLetraBastao && (
            <button
              onClick={onToggleLetraBastao}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition border cursor-pointer ${
                letraBastao
                  ? "bg-orange-50 border-orange-200 text-[#FF7A00]"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
              }`}
              title="Alternar Letra Bastão (Caixa Alta)"
            >
              <span className="font-mono text-xs font-black">Aa</span>
              <span>{letraBastao ? "Letra Bastão: ATIVA" : "Letra Padrão"}</span>
            </button>
          )}

          <button
            id="btn-family-logout"
            onClick={onReturnToChild}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition duration-200 cursor-pointer text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4 text-[#FF7A00]" />
            <span>Sair (Modo Criança)</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Info Bar for Parents */}
        <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-2xl p-4 mb-8 flex gap-4 items-start">
          <div className="p-2 bg-blue-100 rounded-xl text-[#3B82F6] shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">Dica de Apoio TDAH</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              O fracionamento de tarefas (chunking) e o Menu de 2 Escolhas são fundamentais para aliviar a exaustão cognitiva da criança. 
              As fotos reais do ambiente ajudam na <strong>memória de trabalho</strong> e na <strong>iniciação imediata</strong> de tarefas, evitando a frustração do abstrato.
            </p>
          </div>
        </div>

        {/* Child Profile & Family Security Settings Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 space-y-6">
          <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Smile className="w-5 h-5 text-[#FF7A00]" />
            <span>Perfil da Criança & Segurança da Família</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Child Profile Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identidade da Criança</h4>
              
              <div className="flex items-center gap-4">
                <div className="relative group w-20 h-20 shrink-0">
                  {childPhoto ? (
                    <img
                      src={childPhoto}
                      alt="Foto da Criança"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#FF7A00]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF7A00]">
                      <Smile className="w-10 h-10" />
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
                            try {
                              const compressedStr = await compressImage(file, 150, 150, 0.7);
                              onUpdateChildPhoto(compressedStr);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1 w-full max-w-xs">
                  <span className="text-xs font-bold text-gray-400">Nome da Criança</span>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => onUpdateChildName(e.target.value)}
                    placeholder="Nome da Criança"
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF7A00] w-full font-bold text-gray-700 bg-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Accessibility Settings: Letra Bastão */}
              {onToggleLetraBastao && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">
                      Modo Letra Bastão (Caixa Alta)
                    </span>
                    <span className="text-[10px] text-gray-400 block leading-tight">
                      Textos em maiúsculas para facilitar a leitura infantil autônoma.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleLetraBastao}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition border cursor-pointer shrink-0 ${
                      letraBastao
                        ? "bg-[#FF7A00] text-white border-[#FF7A00] shadow-xs"
                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {letraBastao ? "ATIVADA" : "DESATIVADA"}
                  </button>
                </div>
              )}
            </div>

            {/* Admin Password & Auth Session Column */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Segurança dos Responsáveis</h4>
                
                <div className="space-y-3.5">
                  <p className="text-xs text-gray-500">Altere a senha secreta de administrador dos responsáveis para impedir que a criança mude as configurações.</p>
                  
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        placeholder="Nova senha secreta"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordFeedback) setPasswordFeedback(null);
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF7A00] w-full font-bold text-gray-700 bg-[#FAF9F6]"
                      />
                      <button
                        type="button"
                        id="btn-save-new-password"
                        disabled={isChangingPassword || !newPassword}
                        onClick={async () => {
                          if (newPassword.length < 6) {
                            setPasswordFeedback({
                              type: "error",
                              message: "A senha precisa ter pelo menos 6 caracteres!"
                            });
                            return;
                          }
                          setIsChangingPassword(true);
                          setPasswordFeedback(null);
                          try {
                            if (onChangePassword) {
                              await onChangePassword(newPassword);
                              setPasswordFeedback({
                                type: "success",
                                message: "Senha de administrador atualizada com sucesso! 🎉"
                              });
                              setNewPassword("");
                            } else {
                              setPasswordFeedback({
                                type: "error",
                                message: "Função de alteração de senha indisponível."
                              });
                            }
                          } catch (err: any) {
                            setPasswordFeedback({
                              type: "error",
                              message: err.message || "Erro ao atualizar senha."
                            });
                          } finally {
                            setIsChangingPassword(false);
                          }
                        }}
                        className="px-4 py-2 bg-[#FF7A00] hover:bg-[#E06B00] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-sm transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isChangingPassword ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Alterar Senha</span>
                          </>
                        )}
                      </button>
                    </div>

                    {passwordFeedback && (
                      <p className={`text-xs font-black animate-fade-in ${
                        passwordFeedback.type === "success" ? "text-emerald-600" : "text-red-500"
                      }`}>
                        {passwordFeedback.type === "success" ? "✓ " : "✗ "}
                        {passwordFeedback.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {onSignOut && (
                <div className="pt-4 flex justify-end">
                  <button
                    id="btn-dashboard-sign-out"
                    type="button"
                    onClick={() => {
                      if (confirm("Deseja realmente sair da sua conta de administrador?")) {
                        onSignOut();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-xl text-xs transition duration-200 cursor-pointer border border-red-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Conta (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice Customization Card for Parents */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 space-y-6 print:hidden" id="voice-settings-panel">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#FF7A00]" />
              <span>Escolha da Voz de Leitura dos Textos</span>
            </h3>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              100% Gratuito • Síntese Nativa
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Personalize a voz do seu celular ou computador que lerá as tarefas, passos e opções para a criança quando os botões de som forem acionados.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice Dropdown */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Voz Selecionada</span>
                {voiceSavedFeedback && (
                  <span className="text-[10px] text-emerald-600 font-extrabold animate-pulse">
                    ✓ Voz Salva com Sucesso!
                  </span>
                )}
              </label>

              <select
                value={selectedVoice}
                onChange={(e) => handleSelectVoice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#FF7A00]"
              >
                <option value="">-- Padrão em Português do Dispositivo (Recomendado) --</option>
                {portugueseVoices.length > 0 && (
                  <optgroup label="🇧🇷 Vozes em Português Disponíveis no Aparelho">
                    {portugueseVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="🌐 Outras Vozes Instaladas no Sistema">
                    {otherVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3 flex items-start gap-2 text-[11px] text-gray-600">
                <Smile className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                <p>
                  As vozes listadas são fornecidas nativamente pelo seu sistema operacional (Google, Apple, Microsoft, Samsung). 
                  Selecione a que soar mais clara e agradável para a criança!
                </p>
              </div>
            </div>

            {/* Voice Speed, Pitch & Test */}
            <div className="space-y-4">
              {/* Speed / Rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Velocidade da Leitura</span>
                  <span className="text-xs font-extrabold text-[#FF7A00]">{voiceRate}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRateChange(0.85)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voiceRate === 0.85
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Calma (0.85x)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRateChange(0.95)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voiceRate === 0.95
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Normal (0.95x)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRateChange(1.1)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voiceRate === 1.1
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Rápida (1.1x)
                  </button>
                </div>
              </div>

              {/* Pitch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Tom da Voz</span>
                  <span className="text-xs font-extrabold text-[#FF7A00]">
                    {voicePitch < 1 ? "Grave" : voicePitch > 1.1 ? "Agudo/Infantil" : "Natural"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePitchChange(0.9)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voicePitch === 0.9
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Sereno (0.9)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePitchChange(1.05)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voicePitch === 1.05
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Natural (1.05)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePitchChange(1.2)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                      voicePitch === 1.2
                        ? "bg-[#FF7A00] text-white border-[#FF7A00]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Animado (1.2)
                  </button>
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  id="btn-test-voice-preview"
                  onClick={handleTestVoice}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    isPlayingVoicePreview
                      ? "bg-orange-600 text-white animate-pulse"
                      : "bg-[#FF7A00] hover:bg-[#E06B00] text-white"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isPlayingVoicePreview ? "Reproduzindo... Toque para Parar" : "Ouvir Teste da Voz Escolhida 🔊"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sensory Resources & Print Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 space-y-6 print:hidden" id="sensory-and-print-panel">
          <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF7A00]" />
            <span>Recursos Sensoriais & Impressão Física</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Soft Transition Alarm Sound Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#FF7A00]" />
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sons de Alerta Suaves (Anti-Sobressalto)</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Alarmes tradicionais de celular podem disparar reações de rejeição ou sobressalto em crianças com TDAH. 
                Escolha um som de transição acolhedor para guiar com tranquilidade:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { key: "tibetan_bell", label: "Sino Tibetano 🧘‍♀️", desc: "Ressonância profunda e terapêutica" },
                  { key: "birds", label: "Canto de Passarinho 🐦", desc: "Piados naturais e alegres" },
                  { key: "rain", label: "Chuva Suave 🌧️", desc: "Sopro reconfortante da natureza" },
                  { key: "guitar", label: "Acorde de Violão 🎸", desc: "Dedilhado acústico acolhedor" },
                  { key: "marimba", label: "Marimba Clássica 🎵", desc: "O tom de marimba original crescente" }
                ].map((item) => (
                  <div 
                    key={item.key}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                      alertSound === item.key 
                        ? "border-[#FF7A00] bg-orange-50/20" 
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black text-gray-800">{item.label}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.desc}</p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("easy_routine_alert_sound", item.key);
                          setAlertSound(item.key);
                          synth.playTransitionChime();
                        }}
                        className={`px-2.5 py-1.5 text-[10px] font-extrabold rounded-lg transition border cursor-pointer ${
                          alertSound === item.key 
                            ? "bg-[#FF7A00] text-white border-[#FF7A00]" 
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        {alertSound === item.key ? "Ativo" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const prev = localStorage.getItem("easy_routine_alert_sound") || "tibetan_bell";
                          localStorage.setItem("easy_routine_alert_sound", item.key);
                          synth.playTransitionChime();
                          setTimeout(() => {
                            localStorage.setItem("easy_routine_alert_sound", prev);
                          }, 500);
                        }}
                        className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer"
                        title="Ouvir prévia"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Print & Glue to Fridge */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#FF7A00]" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suporte Físico (Imprimir Rotina)</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Para o cérebro com TDAH, o que está fora do campo visual deixa de existir (dificuldade de permanência do objeto). 
                  Ter um quadro físico na geladeira ou na porta do quarto ajuda a manter o foco sem depender do celular.
                </p>
                <div className="bg-[#FAF9F6] border border-gray-150 p-4 rounded-2xl flex gap-3 items-start">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Otimizado para folha A4</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                      O arquivo gerado é otimizado para impressão colorida ou preto e branco, com caixas para marcar a lápis e fotos das tarefas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  id="btn-print-routine"
                  onClick={() => {
                    const isIframe = window.self !== window.top;
                    if (isIframe) {
                      // Inside preview iframe, printing is blocked by sandboxing.
                      setShowPrintIframeWarning(true);
                    } else {
                      try {
                        window.print();
                      } catch (err) {
                        setShowPrintIframeWarning(true);
                      }
                    }
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-sm transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Quadro de Rotinas (Geladeira)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 mb-8 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="tab-tasks"
            onClick={() => setActiveTab("tasks")}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "tasks"
                ? "bg-white text-[#FF7A00] border-t-2 border-x border-[#FF7A00] border-t-[#FF7A00] -mb-[1px]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>1. Lista de Tarefas</span>
          </button>
          <button
            id="tab-pairs"
            onClick={() => {
              setActiveTab("pairs");
              setEditingPair(null);
            }}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "pairs"
                ? "bg-white text-[#FF7A00] border-t-2 border-x border-[#FF7A00] border-t-[#FF7A00] -mb-[1px]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Menu de Duas Escolhas</span>
          </button>
          <button
            id="tab-alarms"
            onClick={() => {
              setActiveTab("alarms");
              setEditingAlarm(null);
            }}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "alarms"
                ? "bg-white text-[#FF7A00] border-t-2 border-x border-[#FF7A00] border-t-[#FF7A00] -mb-[1px]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>3. Alarmes & Aviso Prévio</span>
          </button>
          <button
            id="tab-history"
            onClick={() => setActiveTab("history")}
            className={`px-5 py-3 rounded-t-xl font-bold text-sm transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-white text-[#FF7A00] border-t-2 border-x border-[#FF7A00] border-t-[#FF7A00] -mb-[1px]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4. Histórico da Rotina</span>
          </button>
        </div>

        {/* Tab 1: Tasks Management */}
        {activeTab === "tasks" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>Gerenciar Tarefas</span>
                  <span className="text-xs bg-orange-100 text-[#FF7A00] font-black px-2.5 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">Crie e personalize as atividades diárias estruturadas com micro-passos e fotos.</p>
              </div>
              {!editingTask && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    id="btn-restore-autism-routines"
                    onClick={() => {
                      if (confirm("Deseja restaurar/carregar a biblioteca completa com as 21 rotinas estruturadas para Autismo?")) {
                        if (onRestoreAutismRoutines) {
                          onRestoreAutismRoutines();
                        } else {
                          onUpdateTasks(AUTISM_DEFAULT_TASKS);
                        }
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 shadow-xs transition cursor-pointer"
                    title="Carregar / Restaurar todas as 21 rotinas estruturadas de Autismo"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>21 Rotinas TEA</span>
                  </button>

                  <button
                    id="btn-add-task"
                    onClick={() => {
                      setEditingTask({ steps: [], durationMinutes: 10, iconName: "Smile", scheduleType: "fixed", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
                      setTimeout(() => scrollToEditor("task-editor"), 30);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Tarefa</span>
                  </button>
                </div>
              )}
            </div>

            {/* Task Editor Panel (Visible when editing/creating) */}
            {editingTask && (
              <div id="task-editor" ref={taskEditorRef} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md mb-8 animate-fade-in scroll-mt-24">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-[#FF7A00]" />
                    <span>{editingTask.id ? "Editar Tarefa" : "Criar Nova Tarefa"}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-cancel-task-edit-top"
                      onClick={() => setEditingTask(null)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      id="btn-save-task-top"
                      onClick={handleSaveTask}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Tarefa</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Core task details */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Título da Tarefa</label>
                      <input
                        id="task-title-input"
                        type="text"
                        value={editingTask.title || ""}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        placeholder="Ex: Escovar os Dentes, Guardar a Mochila"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Descrição / Instrução Simples</label>
                      <textarea
                        id="task-desc-input"
                        value={editingTask.description || ""}
                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                        placeholder="Instrução curta e clara para a criança"
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Duração (Minutos)</label>
                        <input
                          id="task-duration-input"
                          type="number"
                          value={editingTask.durationMinutes || 10}
                          onChange={(e) => setEditingTask({ ...editingTask, durationMinutes: parseInt(e.target.value, 10) || 1 })}
                          min={1}
                          max={120}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ícone de Apoio</label>
                        <select
                          id="task-icon-select"
                          value={editingTask.iconName || "Clock"}
                          onChange={(e) => setEditingTask({ ...editingTask, iconName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] bg-white"
                        >
                          {iconOptions.map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Routine Schedule Config */}
                    <div className="bg-[#FAF9F6] border border-gray-150 p-4 rounded-2xl space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                          Frequência da Rotina
                        </label>
                        <p className="text-[11px] text-gray-400 mb-2.5">
                          Escolha se esta atividade ocorre todos os dias ou apenas em dias agendados.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            id="btn-schedule-fixed"
                            onClick={() => setEditingTask({ 
                              ...editingTask, 
                              scheduleType: "fixed",
                              daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
                            })}
                            className={`px-3 py-2.5 text-xs font-extrabold rounded-xl border transition cursor-pointer text-center ${
                              (editingTask.scheduleType || "fixed") === "fixed"
                                ? "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            🔄 Rotina Fixa (Todos os dias)
                          </button>
                          
                          <button
                            type="button"
                            id="btn-schedule-custom"
                            onClick={() => setEditingTask({ 
                              ...editingTask, 
                              scheduleType: "custom",
                              daysOfWeek: editingTask.daysOfWeek && editingTask.daysOfWeek.length < 7 ? editingTask.daysOfWeek : [1, 2, 3, 4, 5]
                            })}
                            className={`px-3 py-2.5 text-xs font-extrabold rounded-xl border transition cursor-pointer text-center ${
                              editingTask.scheduleType === "custom"
                                ? "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            📅 Dias Específicos
                          </button>
                        </div>
                      </div>

                      {editingTask.scheduleType === "custom" && (
                        <div className="animate-fade-in space-y-2">
                          <label className="block text-[11px] font-bold uppercase text-gray-500">
                            Selecionar Dias da Semana:
                          </label>
                          <div className="flex flex-wrap gap-1.5 justify-between">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName, dIdx) => {
                              const isSelected = (editingTask.daysOfWeek || []).includes(dIdx);
                              return (
                                <button
                                  key={dIdx}
                                  type="button"
                                  id={`btn-toggle-task-day-${dIdx}`}
                                  onClick={() => {
                                    const currentDays = editingTask.daysOfWeek || [];
                                    const nextDays = currentDays.includes(dIdx)
                                      ? currentDays.filter(d => d !== dIdx)
                                      : [...currentDays, dIdx].sort();
                                    setEditingTask({ ...editingTask, daysOfWeek: nextDays });
                                  }}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-black transition cursor-pointer ${
                                    isSelected
                                      ? "bg-[#FF7A00] text-white shadow-xs"
                                      : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {dayName[0]}
                                </button>
                              );
                            })}
                          </div>
                          {(editingTask.daysOfWeek || []).length === 0 && (
                            <p className="text-[10px] text-red-500 font-extrabold animate-pulse">
                              Atenção: Selecione pelo menos 1 dia para a tarefa aparecer!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                        Foto Real Personalizada (Opcional - Recomendado!)
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl w-32 h-32 flex flex-col items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition">
                          {editingTask.imageUrl ? (
                            <img src={editingTask.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-3 text-gray-400">
                              <Upload className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                              <span className="text-[10px] font-semibold block">Fazer Upload</span>
                            </div>
                          )}
                          <input
                            id="task-image-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="font-bold text-gray-700">Envie uma foto real da criança fazendo a atividade.</p>
                          <p>Isso ancora visualmente a tarefa na mente dela, ajudando na iniciação sem ansiedade.</p>
                          {editingTask.imageUrl && (
                            <button
                              id="btn-remove-task-image"
                              onClick={() => setEditingTask({ ...editingTask, imageUrl: undefined })}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Remover foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Steps (Chunking) editor */}
                  <div className="border-l border-gray-100 pl-0 md:pl-8 space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                        Passos Fracionados (Chunking / Micro-passos)
                      </label>
                      <p className="text-xs text-gray-400 mb-3">Divida a atividade em pequenos passos simples para manter o foco.</p>
                      
                      {/* Step Input */}
                      <div className="flex gap-2 mb-4">
                        <input
                          id="new-step-title"
                          type="text"
                          value={newStepTitle}
                          onChange={(e) => setNewStepTitle(e.target.value)}
                          placeholder="Ex: Passar pasta na escova"
                          className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddStepToTask();
                            }
                          }}
                        />
                        <button
                          id="btn-add-step"
                          type="button"
                          onClick={handleAddStepToTask}
                          className="px-4 py-2 bg-[#FF7A00]/10 hover:bg-[#FF7A00]/20 text-[#FF7A00] font-bold rounded-xl text-sm transition"
                        >
                          Adicionar
                        </button>
                      </div>

                      {/* Steps List */}
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(!editingTask.steps || editingTask.steps.length === 0) ? (
                          <div className="text-center py-6 text-sm text-gray-400 italic border border-dashed border-gray-150 rounded-xl">
                            Nenhum micro-passo cadastrado. Adicione passos acima!
                          </div>
                        ) : (
                          editingTask.steps.map((step, sIdx) => (
                            <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-xs font-extrabold flex items-center justify-center shrink-0">
                                  {sIdx + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{step.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Optional step photo */}
                                <div className="relative cursor-pointer hover:opacity-85">
                                  <input
                                    id={`step-upload-${step.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true, step.id)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7"
                                  />
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden ${step.imageUrl ? "bg-[#3B82F6]" : "bg-gray-200"}`}>
                                    {step.imageUrl ? (
                                      <img src={step.imageUrl} alt="step" className="w-full h-full object-cover" />
                                    ) : (
                                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                  </div>
                                </div>

                                <button
                                  id={`btn-delete-step-${step.id}`}
                                  onClick={() => handleDeleteStepFromTask(step.id)}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 mt-8">
                  <button
                    id="btn-cancel-task-edit"
                    onClick={() => setEditingTask(null)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-task"
                    onClick={handleSaveTask}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Tarefa</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.length === 0 ? (
                <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-bold">Nenhuma tarefa cadastrada ainda.</p>
                  <p className="text-xs mt-1">Clique em "Nova Tarefa" no topo para criar sua primeira atividade!</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow transition-all duration-200 flex flex-col justify-between">
                    <div>
                      {/* Image preview or icon */}
                      <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-100 mb-4 overflow-hidden flex items-center justify-center relative">
                        {task.imageUrl ? (
                          <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-3 bg-orange-50 text-[#FF7A00] rounded-full">
                            {renderTaskCardIcon(task.iconName)}
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {task.durationMinutes} min
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-800 text-base mb-1">{task.title}</h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 h-8">{task.description || "Sem instrução especial"}</p>

                      {/* steps summary & schedule info */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#3B82F6] bg-blue-50 px-2.5 py-1 rounded-lg">
                          {task.steps.length} {task.steps.length === 1 ? "micro-passo" : "micro-passos"}
                        </span>
                        
                        {task.scheduleType === "custom" ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#8B5CF6] bg-purple-50 px-2.5 py-1 rounded-lg" title="Dias específicos">
                            📅 {task.daysOfWeek && task.daysOfWeek.length > 0 
                              ? task.daysOfWeek.map(d => ["D", "S", "T", "Q", "Q", "S", "S"][d]).join(",")
                              : "Nenhum dia"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-lg" title="Todos os dias">
                            🔄 Rotina Fixa
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        id={`btn-edit-task-${task.id}`}
                        onClick={() => {
                          setEditingTask(task);
                          setTimeout(() => scrollToEditor("task-editor"), 30);
                        }}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-task-${task.id}`}
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir "${task.title}"?`)) {
                            handleDeleteTask(task.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Choice Pairs (2-Escolhas Menu) */}
        {activeTab === "pairs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">Duplas de Escolha Simplificada</h2>
                <p className="text-xs text-gray-500">Agrupe tarefas em pares de 2 para o Menu de Escolha da criança.</p>
              </div>
              {!editingPair && (
                <button
                  id="btn-add-pair"
                  onClick={() => {
                    setEditingPair({ label: "", taskAId: "", taskBId: "", active: false });
                    setTimeout(() => scrollToEditor("pair-editor"), 30);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition duration-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Dupla</span>
                </button>
              )}
            </div>

            {/* Pair Editor */}
            {editingPair && (
              <div id="pair-editor" ref={pairEditorRef} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md mb-8 max-w-2xl mx-auto animate-fade-in scroll-mt-24">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Layers className="w-5 h-5 text-[#FF7A00]" />
                  <span>Criar ou Editar Dupla</span>
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Identificador da Rotina</label>
                    <input
                      id="pair-label-input"
                      type="text"
                      value={editingPair.label || ""}
                      onChange={(e) => setEditingPair({ ...editingPair, label: e.target.value })}
                      placeholder="Ex: Rotina da Manhã, Ao voltar da escola, Antes de Dormir"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Primeira Opção (Tarefa A)</label>
                      <select
                        id="pair-taska-select"
                        value={editingPair.taskAId || ""}
                        onChange={(e) => setEditingPair({ ...editingPair, taskAId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] bg-white"
                      >
                        <option value="">-- Selecione uma Tarefa --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Segunda Opção (Tarefa B)</label>
                      <select
                        id="pair-taskb-select"
                        value={editingPair.taskBId || ""}
                        onChange={(e) => setEditingPair({ ...editingPair, taskBId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] bg-white"
                      >
                        <option value="">-- Selecione uma Tarefa --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <input
                      id="pair-active-checkbox"
                      type="checkbox"
                      checked={editingPair.active || false}
                      onChange={(e) => setEditingPair({ ...editingPair, active: e.target.checked })}
                      className="w-5 h-5 rounded text-[#FF7A00] focus:ring-[#FF7A00] border-gray-300"
                    />
                    <div>
                      <label htmlFor="pair-active-checkbox" className="text-sm font-bold text-gray-700 cursor-pointer">
                        Ativar esta dupla imediatamente no app da criança
                      </label>
                      <p className="text-xs text-gray-500">Ao ativar esta, a anterior será desmarcada automaticamente.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 mt-8">
                  <button
                    id="btn-cancel-pair-edit"
                    onClick={() => setEditingPair(null)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-pair"
                    onClick={handleSaveChoicePair}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Dupla</span>
                  </button>
                </div>
              </div>
            )}

            {/* Choice Pairs List */}
            <div className="space-y-4">
              {choicePairs.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-bold">Nenhuma dupla configurada ainda.</p>
                  <p className="text-xs mt-1">Configurar pares de escolhas ajuda a criança a focar de forma estruturada nas prioridades.</p>
                </div>
              ) : (
                choicePairs.map(pair => {
                  const taskA = tasks.find(t => t.id === pair.taskAId);
                  const taskB = tasks.find(t => t.id === pair.taskBId);

                  return (
                    <div
                      key={pair.id}
                      className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                        pair.active
                          ? "bg-[#3B82F6]/5 border-[#3B82F6] shadow-sm"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            pair.active
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {pair.active ? "Ativo na Tela da Criança" : "Rascunho / Inativo"}
                          </span>
                          <span className="font-extrabold text-sm text-gray-700">{pair.label}</span>
                        </div>

                        {/* Connection Visual */}
                        <div className="flex items-center gap-4 py-2">
                          <div className="px-4 py-2 border border-gray-150 rounded-xl bg-gray-50 text-xs font-semibold text-gray-700">
                            {taskA?.title || "Tarefa Excluída ❌"}
                          </div>
                          <span className="text-xs font-bold text-[#FF7A00]">OU</span>
                          <div className="px-4 py-2 border border-gray-150 rounded-xl bg-gray-50 text-xs font-semibold text-gray-700">
                            {taskB?.title || "Tarefa Excluída ❌"}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          id={`btn-toggle-pair-active-${pair.id}`}
                          onClick={() => togglePairActive(pair.id)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer ${
                            pair.active
                              ? "bg-orange-100 text-[#FF7A00] hover:bg-orange-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{pair.active ? "Desativar" : "Ativar no App"}</span>
                        </button>
                        <button
                          id={`btn-edit-pair-${pair.id}`}
                          onClick={() => {
                            setEditingPair(pair);
                            setTimeout(() => scrollToEditor("pair-editor"), 30);
                          }}
                          className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-pair-${pair.id}`}
                          onClick={() => handleDeleteChoicePair(pair.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Alarms & Transitions */}
        {activeTab === "alarms" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">Notificações e Alarmes de Transição</h2>
                <p className="text-xs text-gray-500">Avise pais e filhos 5, 10 ou 15 minutos antes de começar uma rotina.</p>
              </div>
              {!editingAlarm && (
                <button
                  id="btn-add-alarm"
                  onClick={() => {
                    setEditingAlarm({ time: "08:00", taskId: "", earlyWarningMinutes: 15, active: true, repeatDays: [1,2,3,4,5] });
                    setTimeout(() => scrollToEditor("alarm-editor"), 30);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition duration-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Alarme</span>
                </button>
              )}
            </div>

            {/* Alarm Editor */}
            {editingAlarm && (
              <div id="alarm-editor" ref={alarmEditorRef} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md mb-8 max-w-xl mx-auto animate-fade-in scroll-mt-24">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Bell className="w-5 h-5 text-[#FF7A00]" />
                  <span>Configurar Alarme de Transição</span>
                </h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Horário Real da Tarefa</label>
                      <input
                        id="alarm-time-input"
                        type="time"
                        value={editingAlarm.time || ""}
                        onChange={(e) => setEditingAlarm({ ...editingAlarm, time: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tarefa Correspondente</label>
                      <select
                        id="alarm-task-select"
                        value={editingAlarm.taskId || ""}
                        onChange={(e) => setEditingAlarm({ ...editingAlarm, taskId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] bg-white"
                      >
                        <option value="">-- Selecione uma Tarefa --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                      Tempo de Aviso Prévio (Notificação de Preparação)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 5, 10, 15].map((mins) => (
                        <button
                          id={`btn-early-warning-${mins}`}
                          key={mins}
                          type="button"
                          onClick={() => setEditingAlarm({ ...editingAlarm, earlyWarningMinutes: mins })}
                          className={`py-3 rounded-xl text-xs font-bold border transition ${
                            editingAlarm.earlyWarningMinutes === mins
                              ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {mins === 0 ? "No Horário" : `${mins} min antes`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Para crianças com TDAH, avisar com antecedência de 15 minutos é uma <strong>consequência natural excelente</strong> que reduz a ansiedade de transição.
                    </p>
                  </div>

                  {/* Repeat Days Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Dias de Repetição</label>
                    <div className="flex gap-1 overflow-x-auto py-1">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((dayName, idx) => {
                        const isSelected = (editingAlarm.repeatDays || []).includes(idx);
                        return (
                          <button
                            id={`btn-repeat-day-${idx}`}
                            key={idx}
                            type="button"
                            onClick={() => toggleAlarmDay(idx)}
                            className={`w-9 h-9 rounded-full text-xs font-bold border transition flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-[#FF7A00] border-[#FF7A00] text-white"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 mt-8">
                  <button
                    id="btn-cancel-alarm-edit"
                    onClick={() => setEditingAlarm(null)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-alarm"
                    onClick={handleSaveAlarm}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alarme</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alarms List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alarms.length === 0 ? (
                <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-bold">Nenhum alarme programado.</p>
                  <p className="text-xs mt-1">Crie alarmes com aviso prévio para reduzir a sobrecarga e discussões na transição de atividades.</p>
                </div>
              ) : (
                alarms.map(alarm => (
                  <div
                    key={alarm.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 bg-white ${
                      alarm.active ? "border-[#FF7A00]/20" : "opacity-60 border-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-extrabold text-gray-800 tracking-tight">{alarm.time}</span>
                        <div>
                          <p className="text-xs font-bold text-[#FF7A00] bg-orange-50 px-2 py-0.5 rounded-md w-max">
                            {alarm.earlyWarningMinutes === 0 ? "No Horário" : `Aviso: ${alarm.earlyWarningMinutes} min antes`}
                          </p>
                        </div>
                      </div>

                      {/* Active switch */}
                      <button
                        id={`btn-toggle-alarm-active-${alarm.id}`}
                        onClick={() => toggleAlarmActive(alarm.id)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                          alarm.active
                            ? "bg-[#10B981]/10 text-[#10B981]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {alarm.active ? "Ativado" : "Desativado"}
                      </button>
                    </div>

                    <div className="border-t border-b border-gray-50 py-3 mb-4 space-y-1">
                      <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{alarm.taskTitle}</span>
                      </p>
                      
                      {/* Show days */}
                      <div className="flex gap-1 mt-2 text-[10px] font-bold">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayLabel, dIdx) => {
                          const isRepeated = alarm.repeatDays.includes(dIdx);
                          return (
                            <span
                              key={dIdx}
                              className={`px-1.5 py-0.5 rounded ${
                                isRepeated ? "bg-gray-100 text-gray-800 font-bold" : "text-gray-300"
                              }`}
                            >
                              {dayLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        id={`btn-edit-alarm-${alarm.id}`}
                        onClick={() => {
                          setEditingAlarm(alarm);
                          setTimeout(() => scrollToEditor("alarm-editor"), 30);
                        }}
                        className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        id={`btn-delete-alarm-${alarm.id}`}
                        onClick={() => handleDeleteAlarm(alarm.id)}
                        className="px-3 py-1.5 hover:bg-red-50 text-red-500 rounded-lg transition cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: History Logs */}
        {activeTab === "history" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">Histórico de Conclusão de Rotinas</h2>
                <p className="text-xs text-gray-500">Acompanhe de forma gentil e positiva as atividades realizadas.</p>
              </div>
              {logs.length > 0 && (
                <button
                  id="btn-clear-logs"
                  onClick={() => {
                    if (confirm("Deseja apagar todo o histórico de logs? (Isso não afetará as rotinas)")) {
                      onClearLogs();
                    }
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                >
                  Apagar Histórico
                </button>
              )}
            </div>

            {/* Evolution and Autonomy Chart */}
            <ProgressChart logs={logs} tasks={tasks} />

            {/* Analise de Descompressao Ativa */}
            {(() => {
              const decompressionLogs = logs.filter(l => l.taskTitle === "Pausa de Descompressão");
              const totalDecompressions = decompressionLogs.length;

              const hourCounts: { [key: number]: number } = {};
              decompressionLogs.forEach(log => {
                try {
                  const d = new Date(log.timestamp);
                  const h = d.getHours();
                  hourCounts[h] = (hourCounts[h] || 0) + 1;
                } catch(e){}
              });

              let busiestHour = "--";
              let busiestHourCount = 0;
              Object.entries(hourCounts).forEach(([h, count]) => {
                if (count > busiestHourCount) {
                  busiestHour = `${h}h`;
                  busiestHourCount = count;
                }
              });

              const avgDecompressSecs = totalDecompressions > 0
                ? Math.round(decompressionLogs.reduce((acc, log) => acc + log.durationSeconds, 0) / totalDecompressions)
                : 0;

              const getClinicalAdvice = () => {
                if (totalDecompressions === 0) {
                  return "As pausas de descompressão ajudam o cérebro da criança a descansar, reduzindo a fadiga cognitiva. Quando a criança as utilizar, relatórios e análises detalhadas aparecerão aqui para te guiar!";
                }
                const hNum = parseInt(busiestHour);
                if (isNaN(hNum)) {
                  return "Utilização saudável das pausas! Ensine a criança a usar o exercício de respiração ativa sempre que se sentir sobrecarregada ou inquieta.";
                }
                if (hNum >= 11 && hNum <= 14) {
                  return `O pico de uso ocorre por volta de ${busiestHour}. Isso indica que a transição do meio do dia (almoço/mudança de turno) pode estar exigindo muita energia da criança. Tente tornar este período mais silencioso ou simplificado.`;
                }
                if (hNum >= 17 && hNum <= 19) {
                  return `O pico de uso ocorre por volta de ${busiestHour} (fim de tarde, pós-escola). É o período clássico de exaustão cognitiva por acúmulo de atividades. Recomenda-se evitar novos compromissos ou cobranças difíceis neste horário para prevenir crises de sobrecarga.`;
                }
                if (hNum >= 20) {
                  return `O pico de uso ocorre por volta de ${busiestHour} (período da noite). A descompressão está ajudando na desaceleração para o sono. Certifique-se de diminuir a iluminação do ambiente e prefira o som de chuva suave.`;
                }
                return `O uso regular de pausas por volta de ${busiestHour} apoia diretamente o foco e a autorregulação emocional. Excelente acompanhamento!`;
              };

              return (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3">
                    <div className="p-2 bg-orange-50 text-[#FF7A00] rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-800">Relatório de Pausas e Descompressão</h3>
                      <p className="text-xs text-gray-500">Insights clínicos para apoiar o bem-estar e evitar sobrecarga cognitiva.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-orange-50/20 border border-orange-100/30 rounded-2xl p-4 text-center">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total de Pausas</span>
                      <span className="block text-2xl font-black text-[#FF7A00] mt-1">{totalDecompressions}</span>
                      <span className="block text-[9px] text-gray-400 font-bold mt-1">na última semana</span>
                    </div>
                    <div className="bg-blue-50/20 border border-blue-100/30 rounded-2xl p-4 text-center">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Horário Mais Acionado</span>
                      <span className="block text-2xl font-black text-[#3B82F6] mt-1">{busiestHour}</span>
                      <span className="block text-[9px] text-gray-400 font-bold mt-1">
                        {busiestHourCount > 0 ? `${busiestHourCount} acionamentos` : "Sem dados suficientes"}
                      </span>
                    </div>
                    <div className="bg-emerald-50/20 border border-emerald-100/30 rounded-2xl p-4 text-center">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Média de Duração</span>
                      <span className="block text-2xl font-black text-emerald-600 mt-1 font-mono">
                        {avgDecompressSecs > 0 ? `${Math.floor(avgDecompressSecs / 60)}m ${avgDecompressSecs % 60}s` : "--"}
                      </span>
                      <span className="block text-[9px] text-gray-400 font-bold mt-1">exercício de respiração</span>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-gray-150 p-4 rounded-2xl space-y-1 text-left">
                    <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                      💡 Insight & Orientação Clínica para os Pais:
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {getClinicalAdvice()}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Registro Detalhado de Sessões</h3>
              {logs.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-bold">Nenhum registro de atividade ainda.</p>
                  <p className="text-xs mt-1">Conforme a criança realiza as tarefas, o progresso aparecerá neste painel.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 text-xs font-bold uppercase text-gray-500">Data e Hora</th>
                        <th className="p-4 text-xs font-bold uppercase text-gray-500">Tarefa</th>
                        <th className="p-4 text-xs font-bold uppercase text-gray-500">Micro-passos</th>
                        <th className="p-4 text-xs font-bold uppercase text-gray-500">Tempo de Execução</th>
                        <th className="p-4 text-xs font-bold uppercase text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-medium text-gray-600">
                            {new Date(log.timestamp).toLocaleString("pt-BR")}
                          </td>
                          <td className="p-4 font-bold text-gray-800">{log.taskTitle}</td>
                          <td className="p-4 text-gray-500">{log.stepsProgress}</td>
                          <td className="p-4 text-gray-700">
                            {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                              log.status === "completed"
                                ? "bg-emerald-50 text-[#10B981]"
                                : log.status === "paused"
                                ? "bg-orange-50 text-[#FF7A00]"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {log.status === "completed" ? "Concluído!" : log.status === "paused" ? "Pausado" : "Pulado"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </main>

      {/* Developed by Patitour Footer */}
      <footer className="w-full py-12 border-t border-gray-100 bg-white flex flex-col items-center justify-center text-center gap-4 select-none">
        {/* Fabrine Methodology Tag in Footer */}
        <div className="mb-4 flex justify-center">
          <a 
            href="https://fabrinefernandes.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-3 bg-white border border-gray-150 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs w-full max-w-[280px] sm:max-w-sm hover:scale-105 active:scale-98 transition duration-200 cursor-pointer block text-left"
            id="link-fabrine-methodology-family"
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

        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          Desenvolvido por
        </span>
        <a 
          href="https://www.easybyzcreator.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:scale-105 active:scale-98 transition duration-200 cursor-pointer block"
          id="link-easybyz-family"
        >
          <img 
            src="https://i.ibb.co/6RMHG2Bm/patitour-2026-07-22-T152839-769.png" 
            alt="Logo Patitour / Easy Byz Creator" 
            className="object-contain"
            style={{ height: "3cm" }}
            referrerPolicy="no-referrer"
          />
        </a>
      </footer>

      {/* 
        A4 Printable Layout
        Hidden in normal view, displayed only during printing.
        Uses specialized high-contrast design optimized for physical paper.
      */}
      <div className="hidden print:block bg-white p-8 text-black min-h-screen text-left" id="printable-routine-a4">
        <div className="flex items-center justify-between border-b-4 border-[#FF7A00] pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src="https://i.ibb.co/nqDLFnjg/easy-routine.png" className="w-16 h-16 rounded-2xl border" alt="EASY ROUTINE" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">EASY ROUTINE</h1>
              <p className="text-sm font-bold text-gray-500">Minhas Atividades & Escolhas Saudáveis • Apoio TDAH</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[#FF7A00]">Rotina do(a) {childName || "Criança"}</h2>
            <p className="text-xs text-gray-500 font-bold">Impresso para colar na geladeira 💛</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black text-gray-800 border-b pb-2 uppercase tracking-wide">📋 MINHA LISTA DE TAREFAS DIÁRIAS</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task, idx) => (
              <div key={task.id} className="border-2 border-gray-200 rounded-2xl p-4 flex gap-4 items-start">
                {/* Visual number indicator */}
                <div className="w-10 h-10 rounded-full border-4 border-gray-300 flex items-center justify-center font-black text-lg text-gray-400 shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-gray-900">{task.title}</h4>
                    <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                      ⏱️ {task.durationMinutes} min
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-semibold">{task.description || "Sem descrição cadastrada."}</p>

                  {/* Micro-steps list */}
                  {task.steps && task.steps.length > 0 && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Micro-passos para marcar com lápis:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {task.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md border-2 border-gray-400 shrink-0"></div>
                            <span className="text-xs font-bold text-gray-700">{step.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Task Photo */}
                {task.imageUrl && (
                  <img
                    src={task.imageUrl}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                    alt={task.title}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Menus de escolha de suporte visual */}
          {choicePairs && choicePairs.filter(p => p.active).length > 0 && (
            <div className="mt-8 border-t pt-6 space-y-4">
              <h3 className="text-lg font-black text-gray-800 border-b pb-2 uppercase tracking-wide">🧠 MEU MENU DE DUAS ESCOLHAS</h3>
              <p className="text-xs text-gray-500 font-bold mb-3">Quando estiver cansado, posso escolher entre duas opções saudáveis:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {choicePairs.filter(p => p.active).map(pair => {
                  const taskA = tasks.find(t => t.id === pair.taskAId);
                  const taskB = tasks.find(t => t.id === pair.taskBId);
                  return (
                    <div key={pair.id} className="border-2 border-dashed border-[#FF7A00] p-4 rounded-2xl bg-orange-50/20">
                      <h4 className="text-sm font-black text-[#FF7A00] uppercase mb-2">{pair.label}</h4>
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 bg-white p-3 rounded-xl border-2 border-gray-200 text-center font-extrabold text-xs">
                          {taskA?.title || "Opção A"}
                        </div>
                        <span className="text-xs font-bold text-gray-400">OU</span>
                        <div className="flex-1 bg-white p-3 rounded-xl border-2 border-gray-200 text-center font-extrabold text-xs">
                          {taskB?.title || "Opção B"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rodapé motivacional */}
          <div className="border-t-2 border-dashed border-gray-300 pt-6 mt-12 text-center text-gray-500 space-y-2">
            <p className="text-sm font-bold italic">"Cada pequeno passo é uma grande vitória! Você é incrível! 🌟"</p>
            <div className="flex items-center justify-center gap-6 text-xs font-bold text-gray-400">
              <span>Metodologia Fabrine Fernandes - Neuropsicopedagoga</span>
              <span>•</span>
              <span>Aplicativo EASY ROUTINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE AJUDA PARA IMPRESSÃO EM IFRAME */}
      {showPrintIframeWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden animate-fade-in animate-duration-200" id="print-iframe-warning-modal">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Printer className="w-6 h-6" />
              </div>
              <button 
                type="button"
                onClick={() => setShowPrintIframeWarning(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition duration-150 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900 leading-tight">Como Imprimir sua Rotina 🖨️</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Você está visualizando o <strong>EASY ROUTINE</strong> dentro da janela de simulação do AI Studio. 
                Por motivos de segurança do navegador, recursos de impressão física (como <code className="bg-gray-100 px-1 py-0.5 rounded">window.print()</code>) são bloqueados dentro de simuladores.
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-gray-150 p-4 rounded-2xl space-y-2">
              <p className="text-xs font-black text-gray-800">Siga estes 2 passos simples:</p>
              <ol className="text-[11px] text-gray-600 font-bold list-decimal pl-4 space-y-1.5">
                <li>Clique no botão verde abaixo para abrir o app em uma <strong>Nova Aba</strong> dedicada.</li>
                <li>Na nova aba, clique no mesmo botão verde de impressão no Painel dos Pais para abrir a tela de imprimir do seu computador!</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, "_blank");
                  setShowPrintIframeWarning(false);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Abrir e Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintIframeWarning(false)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl text-xs transition duration-200 cursor-pointer text-center"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
