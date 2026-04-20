// src/hooks/useTTS.js
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { applyTTSDictionary } from '../utils/ttsProcessor';

export const useTTS = () => {
  const [voices, setVoices] = useState([]);
  const [activeChunkId, setActiveChunkId] = useState(null); // 取代 highlightRange
  const [ttsState, setTtsState] = useState('stopped');

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  
  // 記錄目前的播放佇列與進度
  const utteranceIdRef = useRef(0);
  const currentChunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  const currentSubjectRef = useRef('general');
  const currentRateRef = useRef(1.0);

  const bestVoice = useMemo(() => {
    if (voices.length === 0) return null;

    // ✅ 修復：明確篩選繁體中文語音，排除 zh-CN (普通話) 避免音調錯亂
    const lang = (v) => String(v?.lang || '').toLowerCase();
    const isTW = (v) => lang(v).startsWith('zh-tw') || lang(v).startsWith('zh_tw');
    const isCN = (v) => lang(v).startsWith('zh-cn') || lang(v).startsWith('zh_cn');
    const isZhGeneric = (v) => lang(v).startsWith('zh') && !lang(v).includes('hk') && !isCN(v);

    // 優先取 zh-TW 語系，若完全沒有才考慮通用 zh 語音
    let candidates = voices.filter(isTW);
    if (candidates.length === 0) candidates = voices.filter(isZhGeneric);
    if (candidates.length === 0) {
      console.warn('[useTTS] 找不到任何繁體中文語音，將使用瀏覽器預設語音。');
      return null;
    }

    // ✅ 修復：重建優先順序。
    // - Online (Natural) 是微軟最高品質的神經語音，最優先
    // - Yating Online 是次選線上語音
    // - Mei-Jia 是 Windows 高品質本機語音，優先於未知語音
    // - 不再用 localService 作為主要排序鍵，因為本機語音不一定比線上語音好
    const nameRank = (name = '') => {
      if (name.includes('Online (Natural)')) return 0; // 微軟神經語音 (最佳)
      if (name.includes('Yating') && name.includes('Online')) return 1; // 雅婷線上版
      if (name.includes('Yating')) return 2; // 雅婷本機版
      if (name.includes('Mei-Jia')) return 3; // ✅ 修復：美佳從 rank 4 升至 rank 3
      if (name.includes('HsinHsin') || name.includes('Zhiwei')) return 4; // 其他微軟語音
      return 8; // 其他未知語音
    };

    const ranked = [...candidates].sort((a, b) => nameRank(a.name) - nameRank(b.name));
    const selected = ranked[0] || null;

    if (selected) {
      console.info(`[useTTS] 已選擇語音: "${selected.name}" (${selected.lang}, localService: ${selected.localService})`);
    }
    return selected;
  }, [voices]);

  // 使用 Ref 保存 bestVoice 避免重新觸發 useCallback
  const bestVoiceRef = useRef(null);
  useEffect(() => { bestVoiceRef.current = bestVoice; }, [bestVoice]);

  // ✅ 新增：語音就緒狀態追蹤，解決競態條件
  const [voicesReady, setVoicesReady] = useState(false);
  const pendingSpeakRef = useRef(null); // 暫存待播放的任務
  const isUnlockedRef = useRef(false); // ✅ 新增：iOS 語音解鎖狀態標記

  const cancel = useCallback(() => {
    utteranceIdRef.current += 1; // 使目前的遞迴佇列失效
    if (synth) synth.cancel();
    setTtsState('stopped');
    setActiveChunkId(null);
  }, [synth]);

  // 🌟 核心：遞迴播放佇列
  const playNext = useCallback((expectedId) => {
    if (expectedId !== utteranceIdRef.current) return;

    const chunks = currentChunksRef.current;
    const index = currentChunkIndexRef.current;

    // 播完了
    if (index >= chunks.length) {
        setTtsState('stopped');
        setActiveChunkId(null);
        return;
    }

    const chunk = chunks[index];
    const processedText = applyTTSDictionary(chunk.spokenText, currentSubjectRef.current);

    // 如果該節點沒有實質語音內容（例如純圖片的空白節點），直接跳下一個
    if (!processedText || processedText.trim() === '。') {
        currentChunkIndexRef.current += 1;
        playNext(expectedId);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = 'zh-TW'; // 強制設定語系，作為所有情況的最後保護層
    utterance.rate = currentRateRef.current;
    if (bestVoiceRef.current) {
      utterance.voice = bestVoiceRef.current;
    } else {
      // ✅ 修復：若語音仍為 null，記錄警告並依賴 lang='zh-TW' 讓瀏覽器選擇
      console.warn('[useTTS] bestVoice 為 null，將依賴 lang="zh-TW" 由瀏覽器自動選擇語音。');
    }

    // 開始唸時，更新 UI 反白
    utterance.onstart = () => {
      if (expectedId === utteranceIdRef.current) {
        setActiveChunkId(chunk.id);
        setTtsState('playing');
      }
    };

    // 唸完時，播放下一個 Chunk
    utterance.onend = () => {
      if (expectedId === utteranceIdRef.current) {
        currentChunkIndexRef.current += 1;
        playNext(expectedId);
      }
    };

    utterance.onerror = (e) => {
      // 被手動 cancel 的 error 不用理會，其餘跳過繼續唸下一段
      if (e.error !== 'canceled' && expectedId === utteranceIdRef.current) {
         console.warn("TTS Error on chunk:", chunk.id, e);
         currentChunkIndexRef.current += 1;
         playNext(expectedId);
      }
    };

    synth.speak(utterance);
  }, [synth]);

  // 🌟 新的 speak 介面：接收 chunks 陣列，而非單一字串
const speak = useCallback((payload, subject = 'general', rate = 0.9, startChunkId = null) => {
    if (!synth || !payload) return;
    cancel();

    // ==========================================
    // 🌟 iOS 語音解鎖機制 (Audio Unlock)
    // 必須在「使用者點擊事件」的同步 Call Stack 中執行第一次發聲。
    // ==========================================
    if (!isUnlockedRef.current) {
        try {
            const unlockUtterance = new SpeechSynthesisUtterance(' ');
            unlockUtterance.volume = 0;
            unlockUtterance.rate = 2.0; // 越快結束越好
            synth.speak(unlockUtterance);
            isUnlockedRef.current = true;
            console.info('[useTTS] iOS 語音通路已解鎖');
        } catch (e) {
            console.error('[useTTS] 語音解鎖失敗', e);
        }
    }

    // ==========================================
    // 向下相容與自動包裝機制
    // ==========================================
    let validChunks = [];
    if (typeof payload === 'string') {
      validChunks = [{ id: 'sys_msg', text: payload, spokenText: payload }];
    } else if (Array.isArray(payload)) {
      validChunks = payload;
    }
    if (validChunks.length === 0) return;
    // ==========================================

    const currentId = utteranceIdRef.current;
    currentChunksRef.current = validChunks;
    currentSubjectRef.current = subject;
    currentRateRef.current = Math.max(0.5, Math.min(1.05, rate));

    let startIndex = 0;
    if (startChunkId) {
      const idx = validChunks.findIndex(c => c.id === startChunkId);
      if (idx !== -1) startIndex = idx;
    }
    currentChunkIndexRef.current = startIndex;

    // ✅ 修復：若語音清單尚未就緒，暫存任務並等待 voiceschanged 後再播放
    // 雖然這裡會脫離 Click Stack，但因為上方已執行過一次 speak()，通路已開啟
    if (!voicesReady || voices.length === 0) {
      console.warn('[useTTS] 語音清單尚未就緒，已暫存播放任務，等待語音加載完成後自動執行...');
      pendingSpeakRef.current = currentId;
      setTtsState('playing'); // 告知 UI 正在等待
      return;
    }

    // ✅ 改進：如果已經 Ready，直接啟動，不需要額外的 setTimeout 增加延遲風險
    playNext(currentId);

  }, [synth, cancel, playNext, voicesReady, voices.length]);

  const pauseTTS = useCallback(() => {
    if (synth) {
      synth.pause();
      setTtsState('paused');
    }
  }, [synth]);

  const resumeTTS = useCallback(() => {
    if (synth) {
      synth.resume();
      setTtsState('playing');
    }
  }, [synth]);

  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => {
      const v = synth.getVoices();
      setVoices(v);
      if (v.length > 0) {
        setVoicesReady(true);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
      cancel();
    };
  }, [synth, cancel]);

  // ✅ 新增：語音就緒後，自動觸發暫存的待播放任務
  useEffect(() => {
    if (!voicesReady || pendingSpeakRef.current === null) return;
    const pendingId = pendingSpeakRef.current;
    pendingSpeakRef.current = null;
    // 確認任務ID仍有效（未被新的 cancel 廢棄）
    if (pendingId === utteranceIdRef.current) {
      console.info('[useTTS] 語音就緒，自動執行暫存的播放任務。');
      setTimeout(() => playNext(pendingId), 50);
    }
  }, [voicesReady, playNext]);

  return { speak, cancel, pauseTTS, resumeTTS, ttsState, voices, activeChunkId };
};