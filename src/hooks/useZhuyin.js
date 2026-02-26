// src/hooks/useZhuyin.js
import { useCallback, useMemo } from 'react';
import usePersistentState from './usePersistentState'; // 使用您提供的 Hook
import { POLYPHONE_MAP, SORTED_POLYPHONE_KEYS } from '../constants/polyphoneDict';

export const useZhuyin = () => {
  // 1. 讀取老師自訂的字典 (存於 localStorage)
  // 格式範例: { "銀行": "銀\uDB40\uDDE1行\uDB40\uDDE1" }
  const [userDict, setUserDict] = usePersistentState('user-custom-polyphones', {}, '1.0');

  // 2. 混合字典邏輯：使用者自訂優先權 > 系統預設
  // 為了效能，我們可以將邏輯封裝在函數內，不一定要合併成一個巨大物件
  
  /**
   * 核心修正函數
   * @param {string} text - 原始文字
   */
  const fixText = useCallback((text) => {
    if (!text || typeof text !== 'string') return text;
    
    let processed = text;

    // A. 先處理使用者自訂 (優先權最高)
    // 排序 Key 長度 (長詞優先匹配)
    const userKeys = Object.keys(userDict).sort((a, b) => b.length - a.length);
    userKeys.forEach(word => {
      if (processed.includes(word)) {
        const replacement = userDict[word];
        processed = processed.split(word).join(replacement);
      }
    });

    // B. 再處理系統預設
    // 只有當純文字還沒被換掉時才會匹配到
    SORTED_POLYPHONE_KEYS.forEach(word => {
      if (processed.includes(word)) {
        const replacement = POLYPHONE_MAP[word];
        processed = processed.split(word).join(replacement);
      }
    });

    return processed;
  }, [userDict]);

  // 新增自訂讀音
  const addCustomReading = (phrase, ivsString) => {
    setUserDict(prev => ({
      ...prev,
      [phrase]: ivsString
    }));
  };

  // 刪除自訂讀音
  const removeCustomReading = (phrase) => {
    setUserDict(prev => {
      const next = { ...prev };
      delete next[phrase];
      return next;
    });
  };

  return {
    userDict,
    fixText,
    addCustomReading,
    removeCustomReading
  };
};