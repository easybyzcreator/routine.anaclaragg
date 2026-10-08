import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { speakText, stopSpeaking, isCurrentlySpeaking, subscribeSpeechState } from "../utils/audio";

interface AudioReaderButtonProps {
  text: string;
  title?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "pill";
  className?: string;
}

export default function AudioReaderButton({
  text,
  title = "Ouvir em voz alta (gratuito)",
  label,
  size = "sm",
  variant = "ghost",
  className = "",
}: AudioReaderButtonProps) {
  const [isSpeakingThis, setIsSpeakingThis] = useState<boolean>(() => isCurrentlySpeaking(text));

  useEffect(() => {
    const unsubscribe = subscribeSpeechState((speakingText) => {
      setIsSpeakingThis(speakingText === text);
    });
    return unsubscribe;
  }, [text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isSpeakingThis) {
      stopSpeaking();
    } else {
      speakText(text);
    }
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonPaddings = {
    sm: "p-1.5 text-xs",
    md: "px-2.5 py-1.5 text-xs",
    lg: "px-3.5 py-2 text-sm",
  };

  const variantStyles = {
    ghost: isSpeakingThis
      ? "bg-orange-100 text-[#FF7A00] ring-2 ring-[#FF7A00]/40 scale-105"
      : "bg-white/80 hover:bg-orange-50 text-gray-500 hover:text-[#FF7A00] border border-gray-200/60 shadow-3xs",
    solid: isSpeakingThis
      ? "bg-[#FF7A00] text-white shadow-md scale-105"
      : "bg-orange-50 hover:bg-orange-100 text-[#FF7A00] border border-orange-200 shadow-3xs",
    pill: isSpeakingThis
      ? "bg-[#FF7A00] text-white ring-2 ring-[#FF7A00]/30 shadow-sm scale-105"
      : "bg-white hover:bg-orange-50 text-gray-700 hover:text-[#FF7A00] border border-gray-200 shadow-3xs",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isSpeakingThis ? "Clique para pausar áudio" : title}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer shrink-0 select-none ${buttonPaddings[size]} ${variantStyles[variant]} ${className}`}
      aria-label={title}
    >
      {isSpeakingThis ? (
        <>
          <Volume2 className={`${iconSizes[size]} animate-pulse text-current`} />
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-2.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-3.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-2 bg-current rounded-full animate-bounce"></span>
          </span>
        </>
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
      {label && <span>{isSpeakingThis ? "Ouvindo..." : label}</span>}
    </button>
  );
}
