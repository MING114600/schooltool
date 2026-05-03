import React from 'react';
import { 
  X, ZoomIn, ZoomOut, Highlighter, BookA, Volume2, 
  Settings2, ChevronRight, Type
} from 'lucide-react';
import { UI_THEME } from '../../../constants';

const MobileToolsModal = ({ 
  isOpen, 
  onClose, 
  zoomLevel, 
  setZoomLevel, 
  isKaraokeMode, 
  setIsKaraokeMode,
  onOpenVoiceSettings,
  onOpenDict,
  isFocusMode
}) => {
  if (!isOpen) return null;

  const ToolItem = ({ icon: Icon, label, value, onClick, colorClass = "text-slate-500", showChevron = true }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 ${colorClass}`}>
          <Icon size={22} />
        </div>
        <div className="text-left">
          <div className="font-bold text-slate-700 dark:text-slate-200">{label}</div>
          {value && <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{value}</div>}
        </div>
      </div>
      {showChevron && <ChevronRight size={18} className="text-slate-300" />}
    </button>
  );

  return (
    <div className="absolute inset-0 z-[115] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className={`${UI_THEME.SURFACE_MAIN} w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col border-t sm:border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom duration-300`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Handle for Mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden"></div>

        {/* Title */}
        <div className="px-6 py-6 flex justify-between items-center">
          <h3 className={`font-black text-2xl ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
            <Settings2 size={28} className="text-indigo-500" /> 閱讀助手設定
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 pb-10 space-y-4 overflow-y-auto max-h-[70vh]">
          
          {/* Zoom Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Type size={18} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">字體縮放比例</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-200 active:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <ZoomOut size={24} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{Math.round(zoomLevel * 100)}</span>
                <span className="text-xl font-bold text-slate-400 ml-1">%</span>
              </div>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.1))}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-200 active:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <ZoomIn size={24} />
              </button>
            </div>
          </div>

          {/* Karaoke Toggle */}
          <ToolItem 
            icon={Highlighter} 
            label="指讀模式 (Karaoke)" 
            value={isKaraokeMode ? "已開啟：正在同步標記朗讀文字" : "已關閉：僅播放完整音訊"}
            onClick={() => setIsKaraokeMode(!isKaraokeMode)}
            colorClass={isKaraokeMode ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-slate-400"}
            showChevron={false}
          />

          {/* Voice Settings */}
          <ToolItem 
            icon={Volume2} 
            label="調整報讀語音" 
            value="自由更換朗讀者、發音速度或引擎"
            onClick={() => { onClose(); onOpenVoiceSettings(); }}
            colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          />

          {/* Dict (Only if not focus mode) */}
          {!isFocusMode && (
            <ToolItem 
              icon={BookA} 
              label="自訂發音字典" 
              value="修改破音字或特定專有名詞讀法"
              onClick={() => { onClose(); onOpenDict(); }}
              colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
            />
          )}

        </div>

        {/* Footer info */}
        <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800">
           <p className="text-xs text-slate-400 font-medium">ClassroomOS ExamReader v8.6.1</p>
        </div>
      </div>
    </div>
  );
};

export default MobileToolsModal;
