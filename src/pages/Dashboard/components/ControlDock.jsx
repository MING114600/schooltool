import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Sun, Moon, Box, Maximize, Minimize, Settings,
  Laptop, MonitorOff, Monitor, Sidebar, Volume2, VolumeX, Edit3,
  Users, BookOpen, Eye, Bell, MessageSquare
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { SYSTEM_BUTTONS_CONFIG } from '../utils/dashboardConstants';

const ICON_MAP = {
  Megaphone, Users, BookOpen, Eye, Bell, MessageSquare
};

const ControlDock = ({ 
  statusMode, setSpecialStatus, setIsManualEco, isFullscreen, toggleFullScreen, setShowSettings, isAutoNapActive, 
  onBroadcastClick, 
  visibleButtons, 
  setShowTools, theme, cycleTheme,
  showSidebar, toggleSidebar,
  isSystemSoundEnabled, toggleSystemSound,
  // 1. 補上漏掉的 props
  customPresets, 
  onCustomBroadcast,
  // 2. 新增：ghostMode (幽靈模式) 與 onToggleEco (切換Eco狀態)
  ghostMode = false,
  onToggleEco
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // 注意：在 EcoView 裡使用時，statusMode 可能是 'eco' 或 'off-hours'，
  // 所以這裡不能直接 return null，而是要依賴父層決定是否渲染。
  // 如果是傳統模式下 (非 EcoView 內部)，父層會自己控制渲染時機。
  if (statusMode === 'special' || isAutoNapActive) return null;
  
  const toggleDropdown = (id) => setActiveDropdown(prev => prev === id ? null : id);
  const getVisibleItems = (items) => items.filter(item => visibleButtons.includes(item.id));

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Moon size={20} />; 
  };

  const getThemeLabel = () => {
    if (theme === 'system') return '系統設定';
    if (theme === 'light') return '淺色模式';
    return '深色模式';
  };

  // --- 樣式定義區 ---
  // 根據 ghostMode 切換容器樣式
  const containerClass = ghostMode
    ? `bg-black/20 border-white/10 text-slate-200 backdrop-blur-md shadow-none hover:bg-black/30` // 幽靈模式：深色半透明
    : `${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_DEFAULT} shadow-2xl hover:scale-105`; // 一般模式：亮色/深色毛玻璃

  // 通用按鈕樣式 (Icon Button)
  const iconButtonClass = ghostMode
    ? `hover:bg-white/10 text-slate-300 hover:text-white border-transparent`
    : `${UI_THEME.BTN_GHOST}`;

  // 側邊欄按鈕樣式 (因為它有 Active 狀態)
  const sidebarButtonClass = ghostMode
    ? `hover:bg-white/10 text-slate-300 hover:text-white ${!showSidebar ? "opacity-50" : ""}`
    : `${showSidebar ? UI_THEME.BTN_GHOST : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white'}`;

  // 音效按鈕樣式
  const soundButtonClass = isSystemSoundEnabled
    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
    : ghostMode 
        ? 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-slate-200' 
        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-transparent';

  // 分隔線樣式
  const dividerClass = ghostMode ? "bg-white/20" : "bg-slate-300 dark:bg-slate-600";

  // Dropdown 選單樣式 (總是保持原本的 UI_THEME 風格，因為展開後需要清晰可讀)
  const dropdownMenuClass = `${UI_THEME.SURFACE_GLASS} rounded-2xl shadow-2xl border ${UI_THEME.BORDER_LIGHT}`;


  return (
    <div className={`
        absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl border flex items-center gap-2 whitespace-nowrap z-50 transition-all max-w-[95vw] overflow-visible no-scrollbar 
        ${containerClass}
    `}>
      
      {/* 語音開關 */}
      <button 
        onClick={toggleSystemSound} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 font-bold flex items-center gap-2 border ${soundButtonClass}`} 
        title={isSystemSoundEnabled ? "廣播語音：開啟" : "廣播語音：靜音"}
      >
        {isSystemSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      <div className={`w-px h-6 mx-1 shrink-0 ${dividerClass}`}></div>

      {/* 自訂廣播按鈕 (Dropdown 群組) */}
      <div className="relative group">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleDropdown('custom_broadcast'); }} 
            className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-1 ${activeDropdown === 'custom_broadcast' ? 'ring-2 ring-white ring-opacity-50' : ''}`}
          >
            <Megaphone size={16} /> 自訂廣播
          </button>
          
          {/* 展開選單 */}
          {activeDropdown === 'custom_broadcast' && (
             <div className={`absolute bottom-full left-0 mb-3 w-56 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 origin-bottom z-50 ${dropdownMenuClass}`}>
                
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    快速廣播
                </div>

                {customPresets && customPresets.map(preset => {
                    const IconComponent = ICON_MAP[preset.icon] || Megaphone;
                    return (
                        <button 
                            key={preset.id} 
                            onClick={() => onCustomBroadcast(preset)} 
                            className={`w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${UI_THEME.TEXT_PRIMARY} font-bold`}
                        >
                            <div className={`p-2 rounded-full text-white bg-gradient-to-br ${preset.color}`}>
                                <IconComponent size={14} />
                            </div>
                            <div className="flex flex-col leading-none gap-1">
                                <span>{preset.name}</span>
                                <span className="text-[10px] opacity-60 font-normal truncate max-w-[100px]">{preset.title}</span>
                            </div>
                        </button>
                    );
                })}

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                <button 
                    onClick={() => { onBroadcastClick(); setActiveDropdown(null); }} 
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm"
                >
                    <Edit3 size={14} /> 編輯按鈕設定
                </button>
             </div>
          )}
      </div>

      <div className={`w-px h-6 mx-1 shrink-0 ${dividerClass}`}></div>
      
      {/* 系統預設按鈕 */}
      {SYSTEM_BUTTONS_CONFIG.singles.filter(btn => visibleButtons.includes(btn.id)).map(btn => (
        <button key={btn.id} onClick={() => setSpecialStatus(btn)} className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 bg-gradient-to-br flex items-center gap-1 ${btn.color}`}>
          <btn.icon size={16} /> {btn.label}
        </button>
      ))}
      
      {SYSTEM_BUTTONS_CONFIG.groups.map(group => {
          const visibleItems = getVisibleItems(group.items);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.id} className="relative group">
                <button onClick={(e) => { e.stopPropagation(); toggleDropdown(group.id); }} className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 flex items-center gap-1 ${group.color} ${activeDropdown === group.id ? 'ring-2 ring-white ring-opacity-50' : ''}`}>
                    <group.icon size={16} /> {group.label}
                </button>
                {activeDropdown === group.id && (
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 origin-bottom z-50 ${dropdownMenuClass}`}>
                        {visibleItems.map(item => (
                            <button key={item.id} onClick={() => setSpecialStatus(item)} className={`w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${UI_THEME.TEXT_PRIMARY} font-bold`}>
                                <div className={`p-2 rounded-full text-white bg-gradient-to-br ${item.color}`}><item.icon size={14} /></div>
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          );
      })}
      
      <div className={`w-px h-6 mx-1 shrink-0 ${dividerClass}`}></div>
      
      {/* 功能按鈕區 */}
      <button 
        onClick={cycleTheme} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${iconButtonClass}`} 
        title={`切換主題 (目前：${getThemeLabel()})`}
      >
        {getThemeIcon()}
      </button>

	  <button 
        onClick={toggleSidebar} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${sidebarButtonClass}`} 
        title={showSidebar ? "隱藏側邊欄" : "顯示側邊欄"}
      >
        <Sidebar size={20} className={!showSidebar ? "opacity-50" : ""} />
      </button>

      {/* 省電模式切換按鈕 (根據 ghostMode 改變行為) */}
      <button 
        onClick={() => {
            if (ghostMode && onToggleEco) {
                onToggleEco(); // 如果在 Eco 模式下，執行退出
            } else {
                setIsManualEco(true); // 如果在一般模式下，進入 Eco
            }
        }} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${iconButtonClass}`} 
        title={ghostMode ? "喚醒螢幕 (退出省電)" : "進入省電模式"}
      >
        {ghostMode ? <Monitor size={20} /> : <MonitorOff size={20} />}
      </button>
      
      <button onClick={() => setShowTools(true)} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${iconButtonClass}`} title="教室小工具">
          <Box size={20} />
      </button>
      
      <button onClick={toggleFullScreen} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${iconButtonClass}`} title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}>
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      
      <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl shadow-lg transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_PRIMARY}`}>
          <Settings size={20} />
      </button>
    </div>
  );
};

export default ControlDock;