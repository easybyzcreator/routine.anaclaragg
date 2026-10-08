import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smile, ShieldAlert, Sparkles, Bell, Calendar, Layers, Clock, 
  Volume2, ShieldCheck, HelpCircle, X, CheckSquare, Settings,
  Lock, User, Key, Camera, RefreshCw
} from "lucide-react";
import { Task, ChoicePair, Alarm, RoutineLog, SystemState } from "./types";
import { 
  AUTISM_DEFAULT_TASKS as DEFAULT_TASKS, 
  AUTISM_DEFAULT_PAIRS as DEFAULT_PAIRS, 
  AUTISM_DEFAULT_ALARMS as DEFAULT_ALARMS 
} from "./data/defaultRoutines";
import ChildView from "./components/ChildView";
import FamilyDashboard from "./components/FamilyDashboard";
import ParentGate from "./components/ParentGate";
import DecompressionPanel from "./components/DecompressionPanel";
import synth from "./utils/audio";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer 
} from "firebase/firestore";

// Beautiful, focused and reassuring Login screen for Parents supporting EASY ROUTINE
function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Por favor, preencha a sua senha de acesso.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Login estritamente anônimo via Firebase conforme requisitado
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // 2. Buscar o documento único compartilhado da família no Firestore
      const sharedDocRef = doc(db, "users", "shared_family_data");
      const sharedDocSnap = await getDoc(sharedDocRef);

      if (!sharedDocSnap.exists()) {
        // Se o documento compartilhado ainda não existir (banco vazio), inicializamos com a senha padrão "admin123" ou a senha digitada
        const initialPassword = password.trim() || "admin123";
        await setDoc(sharedDocRef, {
          password: initialPassword,
          childName: "Ana Clara",
          childPhoto: "",
          createdAt: new Date().toISOString()
        });

        // Semeando as rotinas e subcoleções padrão de onboarding
        for (const t of DEFAULT_TASKS) {
          await setDoc(doc(db, "users/shared_family_data/tasks", t.id), t);
        }
        for (const p of DEFAULT_PAIRS) {
          await setDoc(doc(db, "users/shared_family_data/choicePairs", p.id), p);
        }
        for (const a of DEFAULT_ALARMS) {
          await setDoc(doc(db, "users/shared_family_data/alarms", a.id), a);
        }

        onLoginSuccess(user);
      } else {
        const data = sharedDocSnap.data();
        const storedPassword = data.password || "admin123";

        // Comparação de senha direta no Firestore (seguro, compartilhado e síncrono para todos os dispositivos)
        if (password.trim() === storedPassword.trim()) {
          onLoginSuccess(user);
        } else {
          // Desconectar o usuário imediatamente caso a senha digitada seja inválida
          await signOut(auth);
          setErrorMsg("Senha incorreta. Por favor, tente novamente.");
        }
      }
    } catch (err: any) {
      console.error("Erro ao fazer login anônimo ou verificar dados:", err);
      setErrorMsg("Erro na autenticação. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-[32px] p-8 md:p-10 shadow-lg text-center space-y-7">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center mx-auto border shadow-sm bg-white">
            <img src="https://i.ibb.co/nqDLFnjg/easy-routine.png" className="w-full h-full object-cover" alt="Easy Routine AnaClaraGG" referrerPolicy="no-referrer" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-[#1A2530] text-2xl font-black tracking-tight uppercase">Easy Routine AnaClaraGG</h2>
            <p className="text-xs text-gray-500 font-bold">Desenvolvimento & Estimulação Neuropsicopedagógica • TDAH</p>
          </div>

          {/* Fabrine Methodology Tag */}
          <div className="pt-1 flex justify-center">
            <a 
              href="https://fabrinefernandes.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#FAF9F6] border border-gray-150 rounded-2xl px-4 py-2 hover:scale-102 active:scale-98 transition duration-200 cursor-pointer text-left"
              id="link-fabrine-login"
            >
              <img 
                src="https://i.ibb.co/35xmCgjs/fabrine-logo.png" 
                alt="Logo Fabrine" 
                className="w-10 h-10 object-contain rounded-full bg-white shadow-xs shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col select-none text-left min-w-0">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1 shrink-0">
                  METODOLOGIA
                </span>
                <span className="text-xs font-black text-[#1E293B] leading-none mb-0.5">
                  Fabrine Fernandes
                </span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider leading-none shrink-0">
                  Neuropsicopedagoga
                </span>
              </div>
            </a>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-700 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha de acesso"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#FF7A00] font-bold text-gray-700 bg-[#FAF9F6]"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
              * Digite a senha secreta fornecida para acessar o aplicativo de forma segura.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 font-extrabold text-center bg-red-50 py-2.5 px-3 rounded-xl animate-shake">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-extrabold rounded-2xl text-sm transition duration-200 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Entrar no Aplicativo</span>
            )}
          </button>
        </form>
      </div>

      {/* Developed By EasyByz Footer */}
      <div className="flex flex-col items-center justify-center text-center gap-1 select-none pt-2">
        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">
          Desenvolvido por
        </span>
        <a 
          href="https://www.easybyzcreator.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:scale-105 active:scale-98 transition duration-200 cursor-pointer block"
          id="link-easybyz-login"
        >
          <img 
            src="https://i.ibb.co/6RMHG2Bm/patitour-2026-07-22-T152839-769.png" 
            alt="Logo Patitour / Easy Byz Creator" 
            className="object-contain"
            style={{ height: "1.8cm" }}
            referrerPolicy="no-referrer"
          />
        </a>
      </div>
    </div>
  );
}

export default function App() {
  // Core Application States (synced to Firebase and local storage as backup)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [childName, setChildName] = useState<string>(() => {
    return localStorage.getItem("tdah_child_name") || "Ana Clara";
  });

  const [childPhoto, setChildPhoto] = useState<string>(() => {
    return localStorage.getItem("tdah_child_photo") || "";
  });

  // Letra Bastão (Caixa Alta) para acessibilidade pedagógica e alfabetização infantil
  const [letraBastao, setLetraBastao] = useState<boolean>(() => {
    const saved = localStorage.getItem("tdah_letra_bastao");
    return saved !== null ? saved === "true" : true; // Padrão: ATIVADO para leitura facilitada
  });

  const toggleLetraBastao = () => {
    setLetraBastao((prev) => {
      const next = !prev;
      localStorage.setItem("tdah_letra_bastao", String(next));
      return next;
    });
  };

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tdah_tasks");
    const rawList: Task[] = saved ? JSON.parse(saved) : DEFAULT_TASKS;
    return rawList.map((t) => ({
      ...t,
      steps: (t.steps || []).map((s) => ({
        ...s,
        title: s.title.includes("Escolher a camiseta") && !s.title.includes("vestido")
          ? "Escolher a camiseta, calça, saia, bermuda ou vestido que mais gosta"
          : s.title
      }))
    }));
  });

  const [choicePairs, setChoicePairs] = useState<ChoicePair[]>(() => {
    const saved = localStorage.getItem("tdah_pairs");
    return saved ? JSON.parse(saved) : DEFAULT_PAIRS;
  });

  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem("tdah_alarms");
    return saved ? JSON.parse(saved) : DEFAULT_ALARMS;
  });

  const [logs, setLogs] = useState<RoutineLog[]>(() => {
    const saved = localStorage.getItem("tdah_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentMode, setCurrentMode] = useState<"child" | "family">("child");

  // Auxiliary UI States
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isDecompressionOpen, setIsDecompressionOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  // In-app interactive Notification Toast
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    body: string;
  } | null>(null);

  // Set of Alarms that already fired today to prevent double triggering
  const [firedAlarmsToday, setFiredAlarmsToday] = useState<Record<string, boolean>>({});

  // 1. Firebase Authentication & Synchronizer Effect
  useEffect(() => {
    // Validar conexão com Firestore (Requisito mandatório da Skill)
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Por favor, verifique a conexão com o Firebase.");
        }
      }
    };
    testConnection();

    // Escutar status de autenticação (Suporta login síncrono e anônimo)
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Usuário autenticado no Firebase:", user.uid);
        setCurrentUser(user);

        const userRef = doc(db, "users", "shared_family_data");
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (err) {
          console.warn("Erro ao obter documento do usuário:", err);
        }

        // Se o usuário não existir no Firestore, semeamos os dados de onboarding padrões
        if (!userSnap || !userSnap.exists()) {
          console.log("Onboarding: semeando rotinas padrão no banco de dados...");
          try {
            await setDoc(userRef, {
              password: "admin123",
              childName: localStorage.getItem("tdah_child_name") || "Ana Clara",
              childPhoto: localStorage.getItem("tdah_child_photo") || "",
              createdAt: new Date().toISOString()
            });

            // Seeding default tasks
            for (const t of DEFAULT_TASKS) {
              await setDoc(doc(db, `users/shared_family_data/tasks`, t.id), t);
            }

            // Seeding default choices
            for (const p of DEFAULT_PAIRS) {
              await setDoc(doc(db, `users/shared_family_data/choicePairs`, p.id), p);
            }

            // Seeding default alarms
            for (const a of DEFAULT_ALARMS) {
              await setDoc(doc(db, `users/shared_family_data/alarms`, a.id), a);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/shared_family_data`);
          }
        }

        // Configura escutas ativas em tempo real
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setChildName(data.childName || "Lucas");
            localStorage.setItem("tdah_child_name", data.childName || "Lucas");
            if (data.childPhoto) {
              setChildPhoto(data.childPhoto);
              localStorage.setItem("tdah_child_photo", data.childPhoto);
            } else {
              setChildPhoto("");
              localStorage.removeItem("tdah_child_photo");
            }
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/shared_family_data`));

        const unsubTasks = onSnapshot(collection(db, `users/shared_family_data/tasks`), async (querySnap) => {
          const list: Task[] = [];
          querySnap.forEach((doc) => {
            list.push(doc.data() as Task);
          });

          if (list.length > 0) {
            // Check if any task needs text migration for the requested clothing step
            const sanitizedList = list.map((t) => {
              let changed = false;
              const updatedSteps = (t.steps || []).map((s) => {
                if (s.title.includes("Escolher a camiseta") && !s.title.includes("vestido")) {
                  changed = true;
                  return {
                    ...s,
                    title: "Escolher a camiseta, calça, saia, bermuda ou vestido que mais gosta"
                  };
                }
                return s;
              });
              if (changed) {
                const updatedTask = { ...t, steps: updatedSteps };
                setDoc(doc(db, `users/shared_family_data/tasks`, t.id), updatedTask).catch((e) => console.warn("Task text update sync:", e));
                return updatedTask;
              }
              return t;
            });

            setTasks(sanitizedList);
            localStorage.setItem("tdah_tasks", JSON.stringify(sanitizedList));

            // Auto-enrich: If some default Autism routines are missing from Firestore (e.g. from previous partial seed), upload them seamlessly
            const missingDefaults = DEFAULT_TASKS.filter(dt => !list.some(t => t.id === dt.id));
            if (missingDefaults.length > 0) {
              for (const missingTask of missingDefaults) {
                try {
                  await setDoc(doc(db, `users/shared_family_data/tasks`, missingTask.id), missingTask);
                } catch (e) {
                  console.warn("Auto-enrich task warning:", e);
                }
              }
            }
          } else {
            // If empty, seed all 21 tasks
            for (const t of DEFAULT_TASKS) {
              await setDoc(doc(db, `users/shared_family_data/tasks`, t.id), t);
            }
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/shared_family_data/tasks`));

        const unsubPairs = onSnapshot(collection(db, `users/shared_family_data/choicePairs`), (querySnap) => {
          const list: ChoicePair[] = [];
          querySnap.forEach((doc) => {
            list.push(doc.data() as ChoicePair);
          });
          if (list.length > 0) {
            setChoicePairs(list);
            localStorage.setItem("tdah_pairs", JSON.stringify(list));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/shared_family_data/choicePairs`));

        const unsubAlarms = onSnapshot(collection(db, `users/shared_family_data/alarms`), (querySnap) => {
          const list: Alarm[] = [];
          querySnap.forEach((doc) => {
            list.push(doc.data() as Alarm);
          });
          if (list.length > 0) {
            setAlarms(list);
            localStorage.setItem("tdah_alarms", JSON.stringify(list));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/shared_family_data/alarms`));

        const unsubLogs = onSnapshot(collection(db, `users/shared_family_data/logs`), (querySnap) => {
          const list: RoutineLog[] = [];
          querySnap.forEach((doc) => {
            list.push(doc.data() as RoutineLog);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(list);
          localStorage.setItem("tdah_logs", JSON.stringify(list));
          setIsLoading(false);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/shared_family_data/logs`));

        return () => {
          unsubUser();
          unsubTasks();
          unsubPairs();
          unsubAlarms();
          unsubLogs();
        };
      } else {
        console.log("Nenhum usuário detectado. Exibindo tela de login...");
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Firebase Writes Callbacks (Provides complete safety and consistency)
  const handleUpdateChildName = async (newName: string) => {
    setChildName(newName);
    localStorage.setItem("tdah_child_name", newName);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "users", "shared_family_data"), { childName: newName });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/shared_family_data`);
      }
    }
  };

  const handleUpdateChildPhoto = async (newPhoto: string) => {
    setChildPhoto(newPhoto);
    localStorage.setItem("tdah_child_photo", newPhoto);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "users", "shared_family_data"), { childPhoto: newPhoto });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/shared_family_data`);
      }
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        // Altera a senha compartilhada guardada diretamente no Firestore de forma anônima e síncrona
        await updateDoc(doc(db, "users", "shared_family_data"), { password: newPassword.trim() });
        triggerInAppToast("Senha Atualizada! 🔒", "A senha de acesso ao Painel Familiar foi alterada com sucesso.");
      } catch (err: any) {
        console.error("Erro ao alterar senha:", err);
        throw err;
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      // Reset local state to default values
      setChildName("Lucas");
      setChildPhoto("");
      setTasks(DEFAULT_TASKS);
      setChoicePairs(DEFAULT_PAIRS);
      setAlarms(DEFAULT_ALARMS);
      setLogs([]);
      localStorage.clear();
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTasks = async (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem("tdah_tasks", JSON.stringify(updatedTasks));
    if (auth.currentUser) {
      try {
        const deletedTasks = tasks.filter(t => !updatedTasks.some(ut => ut.id === t.id));
        for (const task of updatedTasks) {
          await setDoc(doc(db, `users/shared_family_data/tasks`, task.id), task);
        }
        for (const task of deletedTasks) {
          await deleteDoc(doc(db, `users/shared_family_data/tasks`, task.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/shared_family_data/tasks`);
      }
    }
  };

  const handleUpdateChoicePairs = async (updatedPairs: ChoicePair[]) => {
    setChoicePairs(updatedPairs);
    localStorage.setItem("tdah_pairs", JSON.stringify(updatedPairs));
    if (auth.currentUser) {
      try {
        const deletedPairs = choicePairs.filter(p => !updatedPairs.some(up => up.id === p.id));
        for (const pair of updatedPairs) {
          await setDoc(doc(db, `users/shared_family_data/choicePairs`, pair.id), pair);
        }
        for (const pair of deletedPairs) {
          await deleteDoc(doc(db, `users/shared_family_data/choicePairs`, pair.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/shared_family_data/choicePairs`);
      }
    }
  };

  const handleUpdateAlarms = async (updatedAlarms: Alarm[]) => {
    setAlarms(updatedAlarms);
    localStorage.setItem("tdah_alarms", JSON.stringify(updatedAlarms));
    if (auth.currentUser) {
      try {
        const deletedAlarms = alarms.filter(a => !updatedAlarms.some(ua => ua.id === a.id));
        for (const alarm of updatedAlarms) {
          await setDoc(doc(db, `users/shared_family_data/alarms`, alarm.id), alarm);
        }
        for (const alarm of deletedAlarms) {
          await deleteDoc(doc(db, `users/shared_family_data/alarms`, alarm.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/shared_family_data/alarms`);
      }
    }
  };

  const handleClearLogs = async () => {
    setLogs([]);
    localStorage.setItem("tdah_logs", JSON.stringify([]));
    if (auth.currentUser) {
      try {
        for (const log of logs) {
          await deleteDoc(doc(db, `users/shared_family_data/logs`, log.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/shared_family_data/logs`);
      }
    }
  };

  const handleRestoreAutismRoutines = async () => {
    setTasks(DEFAULT_TASKS);
    localStorage.setItem("tdah_tasks", JSON.stringify(DEFAULT_TASKS));
    setChoicePairs(DEFAULT_PAIRS);
    localStorage.setItem("tdah_pairs", JSON.stringify(DEFAULT_PAIRS));
    setAlarms(DEFAULT_ALARMS);
    localStorage.setItem("tdah_alarms", JSON.stringify(DEFAULT_ALARMS));

    if (auth.currentUser) {
      try {
        for (const task of DEFAULT_TASKS) {
          await setDoc(doc(db, `users/shared_family_data/tasks`, task.id), task);
        }
        for (const pair of DEFAULT_PAIRS) {
          await setDoc(doc(db, `users/shared_family_data/choicePairs`, pair.id), pair);
        }
        for (const alarm of DEFAULT_ALARMS) {
          await setDoc(doc(db, `users/shared_family_data/alarms`, alarm.id), alarm);
        }
        triggerInAppToast("Rotinas TEA Atualizadas! 🌟", "Todas as 21 rotinas estruturadas para Autismo foram sincronizadas.");
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/shared_family_data/tasks`);
      }
    }
  };

  // Register PWA Service Worker & Read Notification Permission Status
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registrado com sucesso!", reg.scope))
        .catch((err) => console.warn("Falha ao registrar Service Worker:", err));
    }

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permissions
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        triggerInAppToast(
          "Notificações Ativadas! 🔔",
          "Tudo pronto para receber avisos prévios de transição de tarefas."
        );
      }
    } else {
      alert("Seu navegador não oferece suporte nativo para notificações locais.");
    }
  };

  // Helper to trigger custom beautiful in-app toast & audio chime
  const triggerInAppToast = (title: string, body: string, isSuccess: boolean = false) => {
    if (isSuccess) {
      synth.playSuccessChime();
    } else {
      synth.playTransitionChime();
    }
    setToastNotification({ title, body });
    // Automatically close toast after 10 seconds to give plenty of time to read
    setTimeout(() => {
      setToastNotification(null);
    }, 10000);
  };

  // Background Schedular Tick: Runs every 15 seconds to check alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Unique day identifier, e.g. "2026-07-22"
      const dateKey = now.toISOString().split("T")[0];

      alarms.forEach((alarm) => {
        if (!alarm.active) return;

        // Check if today is a repeat day
        if (!alarm.repeatDays.includes(currentDay)) return;

        // Alarm time conversion, e.g. "18:30" -> hours: 18, minutes: 30
        const [alarmHourStr, alarmMinStr] = alarm.time.split(":");
        const alarmHour = parseInt(alarmHourStr, 10);
        const alarmMin = parseInt(alarmMinStr, 10);

        const alarmTotalMinutes = alarmHour * 60 + alarmMin;
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // 1. Check for early transition warning (e.g. 10 or 15 minutes before)
        if (alarm.earlyWarningMinutes > 0) {
          const triggerMinutes = alarmTotalMinutes - alarm.earlyWarningMinutes;
          if (currentTotalMinutes === triggerMinutes) {
            const uniqueFireKey = `${alarm.id}-${dateKey}-${triggerMinutes}-early`;

            if (!firedAlarmsToday[uniqueFireKey]) {
              setFiredAlarmsToday(prev => ({ ...prev, [uniqueFireKey]: true }));

              const warningMessage = `Aviso prévio: Em ${alarm.earlyWarningMinutes} minutos começaremos a tarefa "${alarm.taskTitle}". Prepare-se com carinho!`;

              // Dispatch native notification
              if (Notification.permission === "granted") {
                try {
                  new Notification("Lembrete de Transição ⏱️", {
                    body: warningMessage,
                    icon: "/assets/icon.png",
                    tag: "tdah-early-alarm",
                    requireInteraction: true
                  });
                } catch (e) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification("Lembrete de Transição ⏱️", {
                      body: warningMessage,
                      icon: "/assets/icon.png",
                      tag: "tdah-early-alarm",
                    });
                  });
                }
              }

              triggerInAppToast("Lembrete de Preparação ⏱️", warningMessage, false);
            }
          }
        }

        // 2. Check for actual task start time
        if (currentTotalMinutes === alarmTotalMinutes) {
          const uniqueFireKey = `${alarm.id}-${dateKey}-${alarmTotalMinutes}-start`;

          if (!firedAlarmsToday[uniqueFireKey]) {
            setFiredAlarmsToday(prev => ({ ...prev, [uniqueFireKey]: true }));

            const warningMessage = `Está na hora de começar: "${alarm.taskTitle}"! Vamos iniciar com calma?`;

            // Dispatch native notification
            if (Notification.permission === "granted") {
              try {
                new Notification("Hora de Começar! 🚀", {
                  body: warningMessage,
                  icon: "/assets/icon.png",
                  tag: "tdah-start-alarm",
                  requireInteraction: true
                });
              } catch (e) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification("Hora de Começar! 🚀", {
                    body: warningMessage,
                    icon: "/assets/icon.png",
                    tag: "tdah-start-alarm",
                  });
                });
              }
            }

            triggerInAppToast("Início de Tarefa! 🔔", warningMessage, false);
          }
        }
      });
    };

    // Check immediately and then setup interval
    checkAlarms();
    const interval = setInterval(checkAlarms, 15000); // 15 seconds checks is light and extremely precise

    return () => clearInterval(interval);
  }, [alarms, firedAlarmsToday]);

  // Log Completion of a Task
  const handleLogTask = async (
    taskId: string, 
    durationSeconds: number, 
    completedStepsCount: number, 
    status: "completed" | "paused"
  ) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newLog: RoutineLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      taskTitle: taskObj.title,
      durationSeconds,
      status,
      stepsProgress: `${completedStepsCount}/${taskObj.steps.length} passos`
    };

    setLogs(prev => [newLog, ...prev]);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, `users/shared_family_data/logs`, newLog.id), newLog);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/shared_family_data/logs/${newLog.id}`);
      }
    }

    // Play Reward/Success sound if completed
    if (status === "completed") {
      synth.playSuccessChime();
    }

    // Push parent alert about task completion
    if (Notification.permission === "granted") {
      new Notification("Progresso Concluído! ✅", {
        body: `Seu filho concluiu a tarefa "${taskObj.title}" em ${Math.floor(durationSeconds / 60)}m!`,
        icon: "/assets/icon.png"
      });
    }

    // Trigger positive local toast for family review
    triggerInAppToast(
      "Tarefa Concluída! 🎉",
      `A tarefa "${taskObj.title}" foi concluída e o histórico já está atualizado no Painel Familiar.`,
      status === "completed"
    );
  };

  if (isLoading) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-[#FF7A00] rounded-full animate-spin"></div>
          <Smile className="w-8 h-8 text-[#FF7A00] absolute inset-0 m-auto" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mt-6 font-display">Carregando a Rotina...</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
          Preparando um ambiente focado, seguro e acolhedor para o seu filho.
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`bg-[#FAF9F6] min-h-screen relative font-sans ${letraBastao ? "letra-bastao" : ""}`}>
      
      {/* Top Banner indicating mode / quick alert configuration */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              currentMode === "child" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
            }`} />
            <span className="text-gray-600">
              Modo: <strong className="text-gray-800">{currentMode === "child" ? "Criança (Focado)" : "Responsáveis (Configurações)"}</strong>
            </span>
          </div>

          {/* Quick Letra Bastão toggle in top bar */}
          <button
            onClick={toggleLetraBastao}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
              letraBastao
                ? "bg-orange-50 border-orange-200 text-[#FF7A00]"
                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
            }`}
            title="Alternar Letra Bastão (Caixa Alta para Apoio à Leitura)"
          >
            <span className="font-mono text-xs font-black">Aa</span>
            <span className="hidden sm:inline">{letraBastao ? "Letra Bastão: ATIVA" : "Letra Padrão"}</span>
          </button>
        </div>

        {/* Browser local notifications warning if not accepted */}
        {notificationPermission !== "granted" ? (
          <button
            id="btn-enable-notifications"
            onClick={requestNotificationPermission}
            className="text-xs text-[#FF7A00] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Ativar Notificações de Celular (Gratuito)</span>
          </button>
        ) : (
          <div className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Notificações Locais Ativadas</span>
          </div>
        )}
      </div>

      {/* Main View Orchestrator */}
      <AnimatePresence mode="wait">
        {currentMode === "child" ? (
          <motion.div
            key="child-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChildView
              tasks={tasks}
              choicePairs={choicePairs}
              alarms={alarms}
              logs={logs}
              childName={childName}
              childPhoto={childPhoto}
              letraBastao={letraBastao}
              onToggleLetraBastao={toggleLetraBastao}
              onUpdateChildPhoto={handleUpdateChildPhoto}
              onOpenParentGate={() => setIsParentGateOpen(true)}
              onFinishTask={handleLogTask}
              onTriggerDecompression={() => setIsDecompressionOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="family-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <FamilyDashboard
              tasks={tasks}
              choicePairs={choicePairs}
              alarms={alarms}
              logs={logs}
              childName={childName}
              childPhoto={childPhoto}
              letraBastao={letraBastao}
              onToggleLetraBastao={toggleLetraBastao}
              isAnonymousUser={currentUser?.isAnonymous}
              onUpdateChildName={handleUpdateChildName}
              onUpdateChildPhoto={handleUpdateChildPhoto}
              onUpdateTasks={handleUpdateTasks}
              onUpdateChoicePairs={handleUpdateChoicePairs}
              onUpdateAlarms={handleUpdateAlarms}
              onClearLogs={handleClearLogs}
              onReturnToChild={() => setCurrentMode("child")}
              onTriggerMockNotification={triggerInAppToast}
              onSignOut={handleSignOut}
              onChangePassword={handleChangePassword}
              onRestoreAutismRoutines={handleRestoreAutismRoutines}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PARENTAL ARITHMETIC LOCK / GATE */}
      {isParentGateOpen && (
        <ParentGate
          onSuccess={() => {
            setIsParentGateOpen(false);
            setCurrentMode("family");
          }}
          onClose={() => setIsParentGateOpen(false)}
        />
      )}

      {/* SOOTHING ACTIVE DECOMPRESSION OVERLAY */}
      {isDecompressionOpen && (
        <DecompressionPanel onClose={async (durationSeconds) => {
          setIsDecompressionOpen(false);
          if (durationSeconds >= 2) {
            const newLog: RoutineLog = {
              id: `decomp_log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              taskTitle: "Pausa de Descompressão",
              durationSeconds,
              status: "completed",
              stepsProgress: "Respiração Ativa"
            };
            setLogs(prev => [newLog, ...prev]);
            if (auth.currentUser) {
              try {
                await setDoc(doc(db, `users/shared_family_data/logs`, newLog.id), newLog);
              } catch (err) {
                console.error("Erro ao salvar log de descompressão:", err);
              }
            } else {
              // Local storage fallback is done by snapshot subscription or manually if anonymous
              const saved = localStorage.getItem("tdah_logs");
              const list = saved ? JSON.parse(saved) : [];
              const updated = [newLog, ...list];
              localStorage.setItem("tdah_logs", JSON.stringify(updated));
            }
          }
        }} />
      )}

      {/* DYNAMIC FLOATING NOTIFICATION TOAST BANNER */}
      {/* Essential for preview simulation since standard native popups are blocked in sandboxed iFrames */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            id="floating-notification-toast"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-12 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white border-2 border-orange-200 p-4 rounded-3xl shadow-2xl flex gap-3.5 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0 animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            
            <div className="flex-1 space-y-0.5">
              <h4 className="text-sm font-extrabold text-gray-800 flex items-center justify-between">
                <span>{toastNotification.title}</span>
                <span className="text-[9px] font-bold bg-orange-50 text-[#FF7A00] px-1.5 py-0.5 rounded-md">
                  AVISO PRÉVIO
                </span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {toastNotification.body}
              </p>
            </div>

            <button
              id="btn-dismiss-toast"
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
