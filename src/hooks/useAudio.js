import { useRef, useCallback, useState } from 'react';

export const useAudio = () => {
  const audioCtxRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 初始化 AudioContext
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 通用合成器函數
  const playTone = (freq, type, duration, volume = 0.1) => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // 音量包絡線
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playAudio = useCallback((soundType) => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    switch (soundType) {
      case 'positive': // 加分
        playTone(1046.50, 'sine', 0.8, 0.2);
        break;
        
      case 'correct': // 答對
        {
          const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
          osc1.type = 'triangle'; osc1.frequency.value = 523.25;
          gain1.gain.setValueAtTime(0.1, now); gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc1.connect(gain1); gain1.connect(ctx.destination);
          osc1.start(now); osc1.stop(now + 0.4);

          const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
          osc2.type = 'triangle'; osc2.frequency.value = 659.25;
          gain2.gain.setValueAtTime(0.1, now + 0.1); gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc2.connect(gain2); gain2.connect(ctx.destination);
          osc2.start(now + 0.1); osc2.stop(now + 0.5);

          const osc3 = ctx.createOscillator(); const gain3 = ctx.createGain();
          osc3.type = 'sine'; osc3.frequency.value = 783.99;
          gain3.gain.setValueAtTime(0.2, now + 0.2); gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
          osc3.connect(gain3); gain3.connect(ctx.destination);
          osc3.start(now + 0.2); osc3.stop(now + 1.0);
        }
        break;

      case 'negative': // 扣分
        playTone(150, 'sawtooth', 0.4, 0.15);
        break;

      case 'wrong': // 答錯
        {
            const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
            osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(150, now); osc1.frequency.linearRampToValueAtTime(100, now + 0.5);
            gain1.gain.setValueAtTime(0.15, now); gain1.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc1.connect(gain1); gain1.connect(ctx.destination);
            osc1.start(now); osc1.stop(now + 0.5);
        }
        break;

      case 'alert': // 警告
        {
            for(let i=0; i<3; i++) {
                const t = now + i * 0.15;
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.type = 'square'; osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.1);
            }
        }
        break;
        
      case 'applause': // 歡呼
        {
           const notes = [523.25, 659.25, 783.99, 1046.50];
           notes.forEach((freq, i) => {
               const t = now + i * 0.05;
               const osc = ctx.createOscillator(); const gain = ctx.createGain();
               osc.type = 'triangle'; osc.frequency.value = freq;
               gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
               osc.connect(gain); gain.connect(ctx.destination);
               osc.start(t); osc.stop(t + 1.5);
           });
        }
        break;

      case 'drumroll': // 抽籤滾動
         {
           const osc = ctx.createOscillator();
           const gain = ctx.createGain();
           osc.type = 'square';
           osc.frequency.setValueAtTime(100, now);
           gain.gain.setValueAtTime(0.1, now);
           gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
           osc.connect(gain);
           gain.connect(ctx.destination);
           osc.start(now);
           osc.stop(now + 0.1);
         }
         break;

      // ✅ 新增：最後倒數滴答聲 (Tick)
      case 'tick':
         {
           // 短促的高頻聲 (類似木魚或電子錶滴答)
           const osc = ctx.createOscillator();
           const gain = ctx.createGain();
           osc.type = 'triangle'; // 使用三角波比較清脆
           osc.frequency.setValueAtTime(1000, now); 
           gain.gain.setValueAtTime(0.15, now);
           gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
           osc.connect(gain);
           gain.connect(ctx.destination);
           osc.start(now);
           osc.stop(now + 0.1);
         }
         break;

      case 'alarm': // 時間到
         {
             for(let i=0; i<4; i++) {
                const t = now + i * 0.2;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = 2000;
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.1);
             }
         }
         break;

      default:
        break;
    }
  }, []);

  return { playAudio, initAudio };
};