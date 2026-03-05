import React from 'react';
import { ChevronDown } from 'lucide-react';
// 引入全域主題與小組配色
import { UI_THEME, GROUP_THEME } from '../../../../constants';

// 建立映射表：將語意化的顏色名稱 對應到 GROUP_THEME 的 ID
const THEME_MAP = {
  gray: 0,    // Slate (對應 Group 0)
  rose: 1,    // Red (對應 Group 1)
  orange: 2,  // Orange (對應 Group 2)
  amber: 3,   // Amber (對應 Group 3)
  emerald: 4, // Emerald (對應 Group 4)
  cyan: 5,    // Cyan (對應 Group 5)
  blue: 6,    // Blue (對應 Group 6)
  purple: 7,  // Violet (對應 Group 7)
  pink: 8,    // Fuchsia (對應 Group 8)
};

const SettingsSection = ({ title, icon: Icon, isOpen, onToggle, children, theme = 'gray' }) => {
  // 1. 取得對應的主題樣式物件
  const themeId = THEME_MAP[theme] ?? 0; // 若找不到則預設用 gray (0)
  const styles = GROUP_THEME[themeId];

  return (
    <div 
      className={`
        rounded-2xl overflow-hidden transition-all duration-300 border 
        ${isOpen 
          ? `${styles.border} shadow-lg` // 開啟時使用主題色邊框
          : `${UI_THEME.BORDER_DEFAULT} shadow-sm hover:shadow-md` // 關閉時使用預設邊框
        }
      `}
    >
      <button 
        onClick={onToggle}
        className={`
          w-full p-5 flex items-center justify-between transition-colors text-left 
          ${isOpen 
            ? styles.bg // 開啟時使用主題色背景 (GROUP_THEME 已包含 dark mode 設定)
            : `${UI_THEME.SURFACE_CARD} hover:bg-slate-50 dark:hover:bg-slate-800`
          }
        `}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
             {/* 使用主題色文字來渲染 Icon */}
             <Icon className={styles.text} size={24} />
          </div>
          <span className={`text-lg font-bold ${UI_THEME.TEXT_PRIMARY}`}>{title}</span>
        </div>
        
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${UI_THEME.TEXT_MUTED}`}>
          <ChevronDown size={20}/>
        </div>
      </button>
      
      {isOpen && (
        <div className={`p-6 border-t animate-in slide-in-from-top-2 duration-300 ${styles.border} bg-white/50 dark:bg-slate-900/20`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsSection;