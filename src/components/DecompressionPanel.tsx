import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Wind, Sparkles, Volume2 } from "lucide-react";
import synth from "../utils/audio";

interface DecompressionPanelProps {
  onClose: (durationSeconds: number) => void;
}

type BreathState = "inhale" | "hold" | "exhale";

export default function DecompressionPanel({ onClose }: DecompressionPanelProps) {
  const [breathState, setBreathState] = useState<BreathState>("inhale");
  const [secondsLeft, setSecondsLeft] = useState<number>(4); // Default inhale time
  const [sessionTime, setSessionTime] = useState<number>(0); // Total seconds in session
  const [selectedStyle, setSelectedStyle] = useState<"balloon" | "wave" | "star">("balloon");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Total session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Breathing pattern engine (4-2-4 Pranayama model tailored for sensory calming)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else {
      // Cycle to the next breathing state
      if (breathState === "inhale") {
        setBreathState("hold");
        setSecondsLeft(2); // Hold for 2s
      } else if (breathState === "hold") {
        setBreathState("exhale");
        setSecondsLeft(4); // Exhale for 4s
        if (soundEnabled) {
          synth.playBreathingBreath(false);
        }
      } else {
        setBreathState("inhale");
        setSecondsLeft(4); // Inhale for 4s
        if (soundEnabled) {
          synth.playBreathingBreath(true);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [secondsLeft, breathState, soundEnabled]);

  // Initial sound trigger
  useEffect(() => {
    if (soundEnabled) {
      synth.playBreathingBreath(true);
    }
  }, []);

  // Formatter for total session time
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Descriptive instructional text based on current state
  const getInstruction = () => {
    switch (breathState) {
      case "inhale":
        return {
          title: "Cheire a florzinha...",
          subtitle: "Puxe o ar bem devagar e encha o balão",
          color: "text-blue-500",
          scale: 1.5,
          bgColor: "bg-blue-100",
        };
      case "hold":
        return {
          title: "Segure o ar com calma",
          subtitle: "Sinta o ar quietinho no peito",
          color: "text-orange-500",
          scale: 1.5,
          bgColor: "bg-orange-100",
        };
      case "exhale":
        return {
          title: "Assopre a velinha...",
          subtitle: "Solte o ar bem devagar, esvaziando o balão",
          color: "text-emerald-500",
          scale: 1.0,
          bgColor: "bg-emerald-100",
        };
    }
  };

  const instruction = getInstruction();

  return (
    <motion.div
      id="decompression-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-between p-6 overflow-y-auto"
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-full">
            <Wind className="w-5 h-5 text-[#FF7A00]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Pausa de Descompressão</h2>
            <p className="text-xs text-gray-500">Tempo de descanso: {formatTime(sessionTime)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="toggle-decompression-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
            title="Sons de Respiração"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            id="close-decompression"
            onClick={() => onClose(sessionTime)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Breathing Guide */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center py-8">
        {/* Breathing Animation Canvas */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Outer ripples */}
          <AnimatePresence>
            {breathState === "inhale" && (
              <motion.div
                key="ripple-1"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 border-2 border-blue-200 rounded-full"
              />
            )}
          </AnimatePresence>

          {/* Core Breathing Sphere */}
          <motion.div
            id="breathing-circle"
            animate={{
              scale: instruction.scale,
              backgroundColor: breathState === "inhale" 
                ? "rgba(59, 130, 246, 0.15)" 
                : breathState === "hold" 
                ? "rgba(255, 122, 0, 0.15)" 
                : "rgba(16, 185, 129, 0.15)",
              borderColor: breathState === "inhale" 
                ? "#3B82F6" 
                : breathState === "hold" 
                ? "#FF7A00" 
                : "#10B981",
            }}
            transition={{
              duration: breathState === "hold" ? 2 : 4,
              ease: "easeInOut",
            }}
            className="w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center text-center shadow-lg relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={breathState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center"
              >
                {breathState === "inhale" && (
                  <Wind className="w-12 h-12 text-blue-500 mb-1" />
                )}
                {breathState === "hold" && (
                  <Heart className="w-12 h-12 text-orange-500 mb-1 animate-pulse" />
                )}
                {breathState === "exhale" && (
                  <Sparkles className="w-12 h-12 text-emerald-500 mb-1" />
                )}
                
                <span className="text-3xl font-bold font-mono text-gray-700">
                  {secondsLeft}s
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Text Guidelines */}
        <div className="text-center min-h-[100px] flex flex-col justify-center px-4">
          <motion.h3
            key={instruction.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-2xl font-extrabold tracking-tight mb-2 ${instruction.color}`}
          >
            {instruction.title}
          </motion.h3>
          <motion.p
            key={instruction.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 max-w-xs mx-auto"
          >
            {instruction.subtitle}
          </motion.p>
        </div>

        {/* Visual Breathing Style Selector */}
        <div className="mt-8 bg-gray-50 border border-gray-100 p-1 rounded-2xl flex gap-1">
          <button
            id="style-balloon"
            onClick={() => setSelectedStyle("balloon")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedStyle === "balloon"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🎈 Balão
          </button>
          <button
            id="style-wave"
            onClick={() => setSelectedStyle("wave")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedStyle === "wave"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🌊 Onda do Mar
          </button>
          <button
            id="style-star"
            onClick={() => setSelectedStyle("star")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedStyle === "star"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ⭐ Estrelinha
          </button>
        </div>
      </div>

      {/* Helpful Decompression Advice / Quote */}
      <div className="w-full max-w-md bg-orange-50 border border-orange-100 p-5 rounded-2xl text-center mb-4 flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-orange-800">
          Você está fazendo um ótimo trabalho! Respire fundo, descanse seu corpo e, quando estiver pronto, podemos voltar.
        </p>
        <button
          id="btn-ready-to-restart"
          onClick={onClose}
          className="w-full bg-[#FF7A00] hover:bg-[#E06B00] active:scale-98 text-white font-black text-base py-3 px-6 rounded-2xl shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 mt-1"
        >
          <Sparkles className="w-5 h-5" />
          <span>Estou pronto para recomeçar!</span>
        </button>
      </div>
    </motion.div>
  );
}
