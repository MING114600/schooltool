import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Sun, Moon, Box, Maximize, Minimize, Settings,
  Laptop, MonitorOff , Sidebar, Volume2, VolumeX , Edit3,
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
  // 1. 修正：補上這兩個漏掉的 props
  customPresets, 
  onCustomBroadcast
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  if (statusMode === 'eco' || statusMode === 'special' || isAutoNapActive) return null;
  
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

  return (
    // 2. 修正：補回最外層的容器 (定義 Dock 的位置與樣式)
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl shadow-2xl border flex items-center gap-2 whitespace-nowrap z-50 transition-all ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_DEFAULT} max-w-[95vw] overflow-visible no-scrollbar hover:scale-105`}>
      
      {/* 語音開關 (移到最左邊) */}
      <button 
        onClick={toggleSystemSound} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 font-bold flex items-center gap-2 border ${
            isSystemSoundEnabled 
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/30' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-transparent'
        }`} 
        title={isSystemSoundEnabled ? "廣播語音：開啟" : "廣播語音：靜音"}
      >
        {isSystemSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      <div className="w-px h-6 mx-1 shrink-0 bg-slate-300 dark:bg-slate-600"></div>

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
             <div className={`absolute bottom-full left-0 mb-3 w-56 ${UI_THEME.SURFACE_GLASS} rounded-2xl shadow-2xl border ${UI_THEME.BORDER_LIGHT} p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 origin-bottom z-50`}>
                
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    快速廣播
                </div>

                {/* 6個快速按鈕 - 這裡會用到 customPresets */}
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

                {/* 編輯按鈕 */}
                <button 
                    onClick={() => { onBroadcastClick(); setActiveDropdown(null); }} 
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm"
                >
                    <Edit3 size={14} /> 編輯按鈕設定
                </button>
             </div>
          )}
      </div>

      <div className="w-px h-6 mx-1 shrink-0 bg-slate-300 dark:bg-slate-600"></div>
      
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
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 ${UI_THEME.SURFACE_GLASS} rounded-2xl shadow-2xl border ${UI_THEME.BORDER_LIGHT} p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 origin-bottom z-50`}>
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
      
      <div className="w-px h-6 mx-1 shrink-0 bg-slate-300 dark:bg-slate-600"></div>
      
      {/* 功能按鈕區 */}
      <button 
        onClick={cycleTheme} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_GHOST}`} 
        title={`切換主題 (目前：${getThemeLabel()})`}
      >
        {getThemeIcon()}
      </button>
	  <button 
        onClick={toggleSidebar} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${showSidebar ? UI_THEME.BTN_GHOST : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white'}`} 
        title={showSidebar ? "隱藏側邊欄" : "顯示側邊欄"}
      >
        <Sidebar size={20} className={!showSidebar ? "opacity-50" : ""} />
      </button>
      <button 
        onClick={() => setIsManualEco(true)} 
        className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_GHOST}`} 
        title="進入省電模式"
      >
        <MonitorOff size={20} />
      </button>
      
      <button onClick={() => setShowTools(true)} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_GHOST}`} title="教室小工具"><Box size={20} /></button>
       <button onClick={toggleFullScreen} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_GHOST}`} title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}>
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl shadow-lg transition-all hover:-translate-y-1 shrink-0 ${UI_THEME.BTN_PRIMARY}`}><Settings size={20} /></button>
    </div>
  );
};

export default ControlDock;