/**
 * Web Audio API synthesizer for gentle, sensory-friendly chimes and therapeutic tones.
 * Avoids harsh buzzers or sharp alarms that trigger anxiety or sensory overload in children with ADHD.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Plays a warm, sweet, gentle marimba-like chime for transition alerts.
   */
  playTransitionChime() {
    this.init();
    if (!this.ctx) return;

    const sound = localStorage.getItem("easy_routine_alert_sound") || "tibetan_bell";

    if (sound === "marimba") {
      const now = this.ctx.currentTime;
      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + delay);
        osc.stop(now + delay + dur);
      };

      // Warm ascending pentatonic scale: C5 -> E5 -> G5
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.15, 0.4);
      playTone(783.99, 0.3, 0.5);
    } else if (sound === "tibetan_bell") {
      const now = this.ctx.currentTime;
      const fundamental = 220.0; // A3 deep bowl sound
      const partials = [1.0, 1.49, 2.0, 2.62, 3.14, 4.07];
      const gains = [0.15, 0.09, 0.07, 0.05, 0.03, 0.02];

      partials.forEach((ratio, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(fundamental * ratio, now);
        osc.detune.setValueAtTime(idx * 4, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[idx], now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 3.5);
      });
    } else if (sound === "birds") {
      const now = this.ctx.currentTime;
      const playChirp = (delay: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, now + delay);
        osc.frequency.exponentialRampToValueAtTime(3800, now + delay + 0.06);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      };

      playChirp(0);
      playChirp(0.1);
      playChirp(0.2);
      playChirp(0.38);
      playChirp(0.48);
    } else if (sound === "rain") {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 2.0);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 2.0);
    } else if (sound === "guitar") {
      const now = this.ctx.currentTime;
      // Notes of G Major 9 chord: G3, D4, A4, B4, F#5
      const freqs = [196.00, 293.66, 440.00, 493.88, 739.99];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(900, now + idx * 0.05);
        filter.frequency.exponentialRampToValueAtTime(180, now + idx * 0.05 + 1.2);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 1.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 1.8);
      });
    }
  }

  /**
   * Plays a cheerful, accomplishment arpeggio (harp-like) when completing tasks ("Feito!").
   */
  playSuccessChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playTone = (freq: number, delay: number, dur: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      // Blend sine and triangle for a warm bell/harp tone
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };

    // Ascending arpeggio: C5 -> E5 -> G5 -> C6 (major chord, rewarding and positive)
    playTone(523.25, 0, 0.6);
    playTone(659.25, 0.08, 0.6);
    playTone(783.99, 0.16, 0.6);
    playTone(1046.50, 0.24, 0.8);
  }

  /**
   * Plays a rhythmic breathing prompt tone during active decompression (soft ocean wave style)
   */
  playBreathingBreath(inhale: boolean) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Soft soothing frequency, lower during exhale
    osc.frequency.setValueAtTime(inhale ? 220 : 180, now);
    if (inhale) {
      osc.frequency.exponentialRampToValueAtTime(280, now + 3);
    } else {
      osc.frequency.exponentialRampToValueAtTime(150, now + 4);
    }

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0, now);
    if (inhale) {
      gain.gain.linearRampToValueAtTime(0.08, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
    } else {
      gain.gain.linearRampToValueAtTime(0.05, now + 2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (inhale ? 3 : 4));
  }
}

export const synth = new AudioSynth();

/**
 * 100% Gratuito e Nativo: Leitor de Texto em Áudio (Web Speech API)
 * Funciona offline no navegador, sem custos ou chaves de API pagas.
 */
let currentSpeakingText: string | null = null;
const speechListeners = new Set<(text: string | null) => void>();

// Pré-carrega vozes do navegador
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      window.speechSynthesis.getVoices();
    } catch (e) {
      // Ignorar erros em sandboxes
    }
  };
}

export function subscribeSpeechState(listener: (text: string | null) => void): () => void {
  speechListeners.add(listener);
  return () => {
    speechListeners.delete(listener);
  };
}

function notifySpeechState(text: string | null) {
  currentSpeakingText = text;
  speechListeners.forEach((fn) => {
    try {
      fn(text);
    } catch (e) {
      console.warn("Erro no listener de fala:", e);
    }
  });
}

export function isCurrentlySpeaking(text?: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  if (!window.speechSynthesis.speaking) return false;
  if (!text) return window.speechSynthesis.speaking;
  return currentSpeakingText === text;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
    notifySpeechState(null);
  }
}

export function getSavedVoiceName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("easy_routine_voice_name") || "";
}

export function setSavedVoiceName(name: string) {
  if (typeof window !== "undefined") {
    if (name) {
      localStorage.setItem("easy_routine_voice_name", name);
    } else {
      localStorage.removeItem("easy_routine_voice_name");
    }
  }
}

export function getSavedVoiceRate(): number {
  if (typeof window === "undefined") return 0.95;
  const val = parseFloat(localStorage.getItem("easy_routine_voice_rate") || "0.95");
  return isNaN(val) ? 0.95 : val;
}

export function setSavedVoiceRate(rate: number) {
  if (typeof window !== "undefined") {
    localStorage.setItem("easy_routine_voice_rate", String(rate));
  }
}

export function getSavedVoicePitch(): number {
  if (typeof window === "undefined") return 1.05;
  const val = parseFloat(localStorage.getItem("easy_routine_voice_pitch") || "1.05");
  return isNaN(val) ? 1.05 : val;
}

export function setSavedVoicePitch(pitch: number) {
  if (typeof window !== "undefined") {
    localStorage.setItem("easy_routine_voice_pitch", String(pitch));
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Lê o texto em voz alta em português de forma 100% gratuita usando a síntese nativa do dispositivo
 * com a voz, tom e velocidade configurados pelos pais.
 */
export function speakText(text: string, onEnd?: () => void, onError?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis não suportado neste navegador.");
    onEnd?.();
    return;
  }

  try {
    // Se o mesmo texto já estiver tocando, clicar novamente pausa/cancela!
    if (window.speechSynthesis.speaking && currentSpeakingText === text) {
      window.speechSynthesis.cancel();
      notifySpeechState(null);
      onEnd?.();
      return;
    }

    // Cancela qualquer fala anterior
    window.speechSynthesis.cancel();

    // Limpa pontuações estranhas ou emojis para uma leitura natural
    const cleanedText = text
      .replace(/[⏱️🎨🌟🏆🚀🔔💡📌❤️😊⭐☕👕📖🍴🎮💧🌙🚿🏃‍♀️☀️🚗]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "pt-BR";
    
    // Aplica velocidade e tom salvos pelos pais
    utterance.rate = getSavedVoiceRate();
    utterance.pitch = getSavedVoicePitch();

    // Tentar selecionar a voz escolhida pelos pais, ou a melhor voz em português do sistema
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceName = getSavedVoiceName();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (savedVoiceName) {
      selectedVoice = voices.find((v) => v.name === savedVoiceName);
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang.startsWith("pt")
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || "pt-BR";
    }

    notifySpeechState(text);

    utterance.onend = () => {
      notifySpeechState(null);
      onEnd?.();
    };

    utterance.onerror = (e) => {
      notifySpeechState(null);
      if (e.error !== "canceled") {
        console.warn("SpeechSynthesis erro:", e);
      }
      onError?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Erro ao reproduzir voz:", err);
    notifySpeechState(null);
    onError?.();
  }
}

/**
 * Função de prévia da voz específica para a tela de configurações dos pais.
 */
export function previewVoice(
  voiceName: string,
  rate: number = 0.95,
  pitch: number = 1.05,
  testText: string = "Olá! Esta é a voz que lerá as tarefas e rotinas para a criança no aplicativo.",
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = "pt-BR";
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) => v.name === voiceName);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang || "pt-BR";
    } else {
      const fallbackPt = voices.find(
        (v) => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang.startsWith("pt")
      );
      if (fallbackPt) {
        utterance.voice = fallbackPt;
      }
    }

    notifySpeechState(testText);

    utterance.onend = () => {
      notifySpeechState(null);
      onEnd?.();
    };

    utterance.onerror = () => {
      notifySpeechState(null);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Erro ao testar voz:", e);
    notifySpeechState(null);
    onEnd?.();
  }
}

export default synth;
