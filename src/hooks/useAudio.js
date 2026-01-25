import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioCtxRef = useRef(null);

  // 初始化 AudioContext：確保單一實例
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 優化：高階音效產生器 (讓特定效果能複用底層邏輯，但保有獨立參數)
  const createSimpleTone = useCallback((ctx, freq, type, start, duration, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }, []);

  const playAudio = useCallback((soundType) => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    switch (soundType) {
      case 'positive':
        createSimpleTone(ctx, 1046.50, 'sine', now, 0.6, 0.15);
        break;

      case 'correct': // 保留和弦細節
        [523.25, 659.25, 783.99].forEach((f, i) => {
          createSimpleTone(ctx, f, 'triangle', now + i * 0.1, 0.5, 0.1);
        });
        break;

      case 'negative':
        createSimpleTone(ctx, 150, 'sawtooth', now, 0.4, 0.1);
        break;

      case 'wrong': // 原創滑音效果 (保留原始複雜邏輯)
        {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.5);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        }
        break;

      case 'alert': // 原創警告連音
        for (let i = 0; i < 3; i++) {
          createSimpleTone(ctx, 880, 'square', now + i * 0.15, 0.1, 0.05);
        }
        break;

      case 'applause': // 原創歡呼效果
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const t = now + i * 0.05;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.5);
        });
        break;

      case 'tick': // 原創滴答聲
        createSimpleTone(ctx, 1000, 'triangle', now, 0.1, 0.15);
        break;

      case 'alarm': // 原創鬧鐘連拍
        for (let i = 0; i < 4; i++) {
          createSimpleTone(ctx, 2000, 'square', now + i * 0.2, 0.1, 0.1);
        }
        break;

      default:
        break;
    }
  }, [initAudio, createSimpleTone]);

  return { playAudio, initAudio };
};