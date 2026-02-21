import { useState, useEffect, useCallback } from 'react';

export function useDashboardEvents({ 
  specialStatus, 
  isSystemSoundEnabled, 
  // 傳入 UI 狀態，用來判斷 ESC 鍵的行為
  uiState, 
  onCloseUI ,
  tts
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. 處理 TTS 語音廣播 (Side Effect)
  useEffect(() => {
	if (!tts) return;
    // 如果沒有廣播狀態，或系統靜音，或該廣播不需要 TTS (可擴充)，則停止
    if (!specialStatus || !isSystemSoundEnabled) {
      return;
    }

    // 建構語音內容
    const textToSpeak = `${specialStatus.message}。${specialStatus.sub || ''}`;

    // ✅ 統一交給 useTTS
    // 參數：text, lang, rate, startIndex, pitch（pitch 即使 useTTS 目前沒接，也不會壞，JS 會忽略多餘參數）
    tts.speak?.(textToSpeak, 'zh-TW', 0.9, 0, 1.05);

    return () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
};
}, [specialStatus, isSystemSoundEnabled, tts?.speak, tts?.cancel]);

  // 2. 處理全螢幕切換 (Action)
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }, []);

  // 3. 處理全螢幕狀態監聽 (Event Listener)
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 4. 處理全域鍵盤快捷鍵 (F11 & ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 忽略輸入框內的按鍵
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // F 鍵或 F11 切換全螢幕
      if (e.key === 'f' || e.key === 'F') {
        // 如果正在打字或設定中，可能不想觸發，這裡依需求調整
        if (!uiState.isEditingMessage && !uiState.showSettings && !uiState.showBroadcastInput) {
            toggleFullScreen();
        }
      }

      // ESC 鍵：統一關閉所有視窗
      if (e.key === 'Escape') {
        onCloseUI(); // 呼叫外部傳入的「關閉大法」
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState, onCloseUI, toggleFullScreen]);

  return {
    isFullscreen,
    toggleFullScreen
  };
}