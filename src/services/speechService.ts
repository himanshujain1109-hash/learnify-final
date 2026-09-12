// Audio & Speech Synthesis Service for Teacher Lecture
// Uses Web Speech API with robust fallback, utterance synchronization, and synthesized classroom SFX

export class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onWordCallback: ((charIndex: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private isMuted: boolean = false;
  private playbackRate: number = 1.0;
  private isSoundEffectsEnabled: boolean = true;
  private currentSessionId: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public setSoundEffectsEnabled(enabled: boolean) {
    this.isSoundEffectsEnabled = enabled;
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
  }

  // Plays a subtle wooden/chalkboard slide transition chime
  public playSlideChime() {
    if (!this.isSoundEffectsEnabled || this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Gentle warm bell harmonic
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Soft chalk click sound for bullet or keyword highlighting
  public playChalkClick() {
    if (!this.isSoundEffectsEnabled || this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // Pick the best natural voice for the teacher according to language and gender
  private getBestVoice(gender: 'female' | 'male', language: string = 'English'): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    if (this.voices.length === 0) return null;

    const lowerLang = (language || '').toLowerCase();

    // 1. If Hindi requested, prioritize hi-IN voices
    if (lowerLang.includes('hindi') || lowerLang.includes('hi')) {
      const hindiVoices = this.voices.filter(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoices.length > 0) {
        const femaleKw = ['female', 'kalpana', 'lekha', 'neerja', 'swara'];
        const maleKw = ['male', 'hemant', 'madhav'];
        const kwList = gender === 'female' ? femaleKw : maleKw;
        for (const kw of kwList) {
          const m = hindiVoices.find(v => v.name.toLowerCase().includes(kw));
          if (m) return m;
        }
        return hindiVoices[0];
      }
    }

    // 2. If Hinglish requested, prioritize Indian English (en-IN) or Hindi voices
    if (lowerLang.includes('hinglish')) {
      const indianVoices = this.voices.filter(v => v.lang === 'en-IN' || v.lang.startsWith('en_IN') || v.name.toLowerCase().includes('india'));
      if (indianVoices.length > 0) {
        const femaleKw = ['female', 'heera', 'neerja', 'priya', 'veena'];
        const maleKw = ['male', 'ravi', 'kashif'];
        const kwList = gender === 'female' ? femaleKw : maleKw;
        for (const kw of kwList) {
          const m = indianVoices.find(v => v.name.toLowerCase().includes(kw));
          if (m) return m;
        }
        return indianVoices[0];
      }
    }

    // 3. English voices
    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    const femaleKeywords = ['female', 'samantha', 'karen', 'victoria', 'zira', 'natural', 'google uk english female', 'susan', 'jenny'];
    const maleKeywords = ['male', 'daniel', 'george', 'oliver', 'david', 'guy', 'google uk english male', 'tom', 'alex'];

    const targetKeywords = gender === 'female' ? femaleKeywords : maleKeywords;

    for (const kw of targetKeywords) {
      const match = pool.find(v => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    return pool[0] || null;
  }

  private mutedTimer: any = null;

  public speak(
    text: string,
    options: {
      gender?: 'female' | 'male';
      language?: string;
      rate?: number;
      pitch?: number;
      onWord?: (charIndex: number) => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (!this.synth) {
      if (options.onEnd) options.onEnd();
      return;
    }

    this.stop();
    const sessionId = ++this.currentSessionId;

    if (this.isMuted) {
      // Simulate duration if muted so the presentation still plays
      const durationMs = Math.max(1000, (text.split(' ').length / 2.5) * 1000);
      this.mutedTimer = setTimeout(() => {
        if (this.currentSessionId === sessionId && options.onEnd) {
          options.onEnd();
        }
      }, durationMs);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const voice = this.getBestVoice(options.gender || 'female', options.language || 'English');
    if (voice) {
      utterance.voice = voice;
      if (options.language?.toLowerCase() === 'hindi') {
        utterance.lang = 'hi-IN';
      } else if (options.language?.toLowerCase() === 'hinglish') {
        utterance.lang = 'en-IN';
      }
    }

    utterance.rate = (options.rate || 1.0) * this.playbackRate;
    const defaultPitch = options.gender === 'male' ? 0.9 : 1.05;
    utterance.pitch = options.pitch || defaultPitch;

    this.onWordCallback = options.onWord || null;
    this.onEndCallback = options.onEnd || null;

    utterance.onboundary = (e) => {
      if (this.currentSessionId === sessionId && e.name === 'word' && this.onWordCallback) {
        this.onWordCallback(e.charIndex);
      }
    };

    utterance.onend = () => {
      if (this.currentSessionId !== sessionId) return;
      this.currentUtterance = null;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      if (this.currentSessionId !== sessionId) return;
      this.currentUtterance = null;
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('Speech synthesis notice:', e.error || e);
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    // Chrome keep-alive: pause/resume to prevent 15s freeze
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech speak error:', err);
      if (this.currentSessionId === sessionId && options.onEnd) {
        options.onEnd();
      }
    }
  }

  private keepAliveInterval: any = null;

  public pause(): void {
    if (this.synth && this.synth.speaking) {
      try {
        this.synth.pause();
      } catch (e) {
        this.stop();
      }
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      try {
        this.synth.resume();
      } catch (e) {
        // ignore
      }
    }
  }

  public stop(): void {
    this.currentSessionId++;
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.mutedTimer) {
      clearTimeout(this.mutedTimer);
      this.mutedTimer = null;
    }
    this.onEndCallback = null;
    this.onWordCallback = null;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking && !this.synth.paused);
  }
}

export const speechService = new SpeechService();
