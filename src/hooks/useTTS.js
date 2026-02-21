// src/hooks/useTTS.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateSpokenTextData } from '../utils/ttsProcessor'; // ✅ 引入獨立的文字處理模組

export const useTTS = () => {
  const [voices, setVoices] = useState([]);
  const [highlightRange, setHighlightRange] = useState([0, 0]);
  const [ttsState, setTtsState] = useState('stopped'); // 'stopped' | 'playing' | 'paused'

  const synth = window.speechSynthesis;
  const cursorIndexRef = useRef(0);
  const prevBoundaryStartRef = useRef(null);
  const walkTimerRef = useRef(null);
  const utteranceIdRef = useRef(0);
  const currentUtteranceRef = useRef(null); 

  const stopWalking = useCallback(() => {
    if (walkTimerRef.current) {
      clearInterval(walkTimerRef.current);
      walkTimerRef.current = null;
    }
  }, []);

  const startWalkingThrough = useCallback(
    (text, start, end, rate = 1.0) => {
      stopWalking();
      if (!text || text.length === 0) return;

      const safeStart = Math.max(0, Math.min(text.length - 1, start));
      const safeEnd = Math.max(safeStart + 1, Math.min(text.length, end));

      if (cursorIndexRef.current < safeStart) cursorIndexRef.current = safeStart;

      const stepMs = Math.max(50, Math.round(250 / Math.max(0.5, rate)));

      if (safeEnd - safeStart <= 1) {
        cursorIndexRef.current = safeStart;
        setHighlightRange([safeStart, Math.min(text.length, safeStart + 1)]);
        return;
      }

      walkTimerRef.current = setInterval(() => {
        const cur = cursorIndexRef.current;
        if (cur >= safeEnd - 1) {
          stopWalking();
          return;
        }

        let next = cur + 1;
        while (next < safeEnd && /\s/.test(text[next])) next++;

        cursorIndexRef.current = next;
        setHighlightRange([next, Math.min(text.length, next + 1)]);
      }, stepMs);
    },
    [stopWalking]
  );

  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
	
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    return () => {
      if (synth.onvoiceschanged === loadVoices) synth.onvoiceschanged = null;
    };
  }, [synth]);
  
  const pickBestVoice = (voices, lang = 'zh-TW') => {
    if (!Array.isArray(voices) || voices.length === 0) return null;

    const isZh = (v) => String(v?.lang || '').toLowerCase().startsWith('zh');
    const notHK = (v) => !String(v?.lang || '').toLowerCase().includes('zh-hk');

    const candidates = voices.filter((v) => isZh(v) && notHK(v));
    const local = candidates.filter((v) => v.localService);
    const exactLocal = local.filter((v) => v.lang === lang);
    const pool = exactLocal.length ? exactLocal : (local.length ? local : candidates);

    const nameRank = (name = '') => {
      if (name.includes('Online (Natural)')) return 0; 
      if (name.includes('Yating')) return 1;           
      if (name.includes('Hanhan')) return 2;           
      if (name.includes('Zhiwei')) return 3;           
      if (name.includes('Mei-Jia') || name.includes('Meijia')) return 4; 
      if (name.includes('Tian-Tian') || name.includes('Tiantian')) return 5;
      return 9;
    };

    pool.sort((a, b) => {
      const langScore = (v) => (v.lang === lang ? 0 : v.lang.includes('zh-Hant') ? 1 : v.lang.includes('zh-TW') ? 2 : v.lang.includes('zh-CN') ? 3 : 9);
      const d = langScore(a) - langScore(b);
      if (d !== 0) return d;
      const ls = (b.localService ? 0 : 1) - (a.localService ? 0 : 1);
      if (ls !== 0) return ls;
      return nameRank(a.name) - nameRank(b.name);
    });

    return pool[0] || null;
  };

  const speak = useCallback(
    (text, lang = 'zh-TW', rate = 0.9, startIndex = 0, pitch = 0.98) => {
      if (!synth || !text) return;
	  
      utteranceIdRef.current += 1;
      const currentUtteranceId = utteranceIdRef.current;

      stopWalking();
      if (synth.speaking || synth.paused) {
        synth.cancel();
      }

      // ✅ 呼叫分離出去的模組來處理文字與索引映射
      const {
        fullSpokenText,
        slicedSpokenText,
        indexMap,
        spokenStartIndex,
        safeStartIndex
      } = generateSpokenTextData(text, startIndex);

      prevBoundaryStartRef.current = null;
      cursorIndexRef.current = safeStartIndex;
      setHighlightRange([safeStartIndex, safeStartIndex + 1]);
      setTtsState('playing');

      const utterance = new SpeechSynthesisUtterance(slicedSpokenText);

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
      const safeRate = clamp(rate, 0.5, 1.05);      
      const safePitch = clamp(pitch, 0.9, 1.15);     

      utterance.lang = lang;
      utterance.rate = safeRate;
      utterance.pitch = safePitch;
      utterance.volume = 1.0;

      const bestVoice = pickBestVoice(voices, lang);
      if (bestVoice) utterance.voice = bestVoice;
      
      currentUtteranceRef.current = utterance;

      utterance.onstart = () => {
        if (utteranceIdRef.current === currentUtteranceId) {
          startWalkingThrough(text, safeStartIndex, text.length, safeRate);
        }
      };

      utterance.onboundary = (event) => {
        if (typeof event.charIndex !== 'number') return;
        stopWalking();

        const actualSpokenIndex = event.charIndex + spokenStartIndex;
        const boundedIndex = Math.max(0, Math.min(fullSpokenText.length - 1, actualSpokenIndex));
        const thisStart = indexMap[boundedIndex];

        if (prevBoundaryStartRef.current !== null) {
          const prevStart = prevBoundaryStartRef.current;
          const prevEnd = thisStart;

          if (prevEnd > prevStart) {
            cursorIndexRef.current = Math.max(cursorIndexRef.current, prevStart);
            setHighlightRange([
              cursorIndexRef.current,
              Math.min(text.length, cursorIndexRef.current + 1),
            ]);
            startWalkingThrough(text, prevStart, prevEnd, safeRate);
          } else {
            cursorIndexRef.current = thisStart;
            setHighlightRange([thisStart, Math.min(text.length, thisStart + 1)]);
          }
        } else {
          cursorIndexRef.current = thisStart;
          setHighlightRange([thisStart, Math.min(text.length, thisStart + 1)]);
        }

        prevBoundaryStartRef.current = thisStart;
      };

      utterance.onend = () => {
        if (utteranceIdRef.current === currentUtteranceId) {
          stopWalking();
          const lastStart = prevBoundaryStartRef.current;
          if (typeof lastStart === 'number' && lastStart < text.length - 1) {
            startWalkingThrough(text, lastStart, text.length, safeRate);
            setTimeout(() => setHighlightRange([0, 0]), 300);
          } else {
            setHighlightRange([0, 0]);
          }
          prevBoundaryStartRef.current = null;
          setTtsState('stopped'); 
          currentUtteranceRef.current = null; 
        }
      };

      utterance.onerror = () => {
        if (utteranceIdRef.current === currentUtteranceId) {
          stopWalking();
          setHighlightRange([0, 0]);
          prevBoundaryStartRef.current = null;
          setTtsState('stopped');
          currentUtteranceRef.current = null;
        }
      };
      
      if (utteranceIdRef.current === currentUtteranceId) {
        synth.speak(utterance);
      }
    },
    [voices, synth, stopWalking, startWalkingThrough]
  );

  const cancel = useCallback(() => {
    utteranceIdRef.current += 1; 
    if (synth) synth.cancel();
    stopWalking();
    prevBoundaryStartRef.current = null;
    setHighlightRange([0, 0]);
    setTtsState('stopped');
    currentUtteranceRef.current = null;
  }, [synth, stopWalking]);
  
  const pauseTTS = useCallback(() => {
    if (synth && synth.speaking) {
      synth.pause();
      stopWalking(); 
      setTtsState('paused');
    }
  }, [synth, stopWalking]);

  const resumeTTS = useCallback(() => {
    if (synth && synth.paused) {
      synth.resume();
      setTtsState('playing');
      if (currentUtteranceRef.current) {
         startWalkingThrough(
           currentUtteranceRef.current.text, 
           cursorIndexRef.current, 
           cursorIndexRef.current + 500, 
           currentUtteranceRef.current.rate
         );
      }
    }
  }, [synth, startWalkingThrough]);

  return { speak, cancel, pauseTTS, resumeTTS, ttsState, voices, highlightRange };
};