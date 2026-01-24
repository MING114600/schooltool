import { useState, useEffect } from 'react';

/**
 * useTheme Hook
 * 提供 'light' | 'dark' | 'system' 三種模式的切換與持久化
 */
export const useTheme = () => {
  // 1. 初始化狀態：優先讀取 LocalStorage，預設為 'system'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-theme-mode') || 'system';
    }
    return 'system';
  });

  // 2. 實際生效的模式 (用於 JS 邏輯判斷，如匯出圖片背景色)
  const [isEffectiveDark, setIsEffectiveDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 核心邏輯：根據設定決定是否加上 .dark class
    const applyTheme = () => {
      let isDark = false;

      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // system 模式：跟隨系統
        isDark = mediaQuery.matches;
      }

      setIsEffectiveDark(isDark);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // 初始執行
    applyTheme();

    // 儲存設定
    localStorage.setItem('app-theme-mode', theme);

    // 監聽系統變化 (僅在 system 模式下生效)
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // 輔助函式：循環切換模式
  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return { theme, setTheme, cycleTheme, isEffectiveDark };
};