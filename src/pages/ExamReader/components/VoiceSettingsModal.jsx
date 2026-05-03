import React from 'react';
import { X, Check, Volume2, Sparkles, Globe, Laptop } from 'lucide-react';
import { UI_THEME } from '../../../constants';

const VoiceSettingsModal = ({ 
  isOpen, 
  onClose, 
  voices, 
  preferredVoiceName, 
  onSelectVoice, 
  simplifyVoiceName 
}) => {
  if (!isOpen) return null;

  // 篩選出中文語音 (排除廣東話)
  const filteredVoices = voices.filter(v => {
    const l = v.lang.toLowerCase();
    return l.startsWith('zh') && !l.includes('hk');
  });

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div 
        className={`${UI_THEME.SURFACE_MAIN} w-full max-w-md rounded-3xl shadow-2xl flex flex-col border ${UI_THEME.BORDER_DEFAULT} animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${UI_THEME.BORDER_DEFAULT} flex justify-between items-center`}>
          <h3 className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY} flex items-center gap-2`}>
            <Volume2 size={20} className="text-indigo-500" /> 報讀語音設定
          </h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${UI_THEME.BTN_GHOST}`}>
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2 custom-scrollbar">
          
          {/* 自動推薦選項 */}
          <button
            onClick={() => { onSelectVoice(null); onClose(); }}
            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
              !preferredVoiceName 
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700' 
                : 'bg-white border-slate-100 hover:border-indigo-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!preferredVoiceName ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                <Sparkles size={20} />
              </div>
              <div className="text-left">
                <div className={`font-bold ${!preferredVoiceName ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  系統自動推薦
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">依據裝置清單自動選取最佳語音</div>
              </div>
            </div>
            {!preferredVoiceName && <Check size={20} className="text-indigo-500" />}
          </button>

          <div className="py-2 flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"></div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">可用語音清單</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"></div>
          </div>

          {filteredVoices.map(voice => {
            const isSelected = preferredVoiceName === voice.name;
            const isOnline = !voice.localService;
            
            return (
              <button
                key={voice.name}
                onClick={() => { onSelectVoice(voice.name); onClose(); }}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700' 
                    : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                    {isOnline ? <Globe size={16} /> : <Laptop size={16} />}
                  </div>
                  <div className="text-left">
                    <div className={`font-bold text-sm ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {simplifyVoiceName(voice.name)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 font-mono">
                        {voice.lang}
                      </span>
                      {isOnline && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 dark:bg-blue-900/40 dark:text-blue-300 rounded font-bold">
                          ONLINE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isSelected && <Check size={18} className="text-emerald-500" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
          <p className="text-center text-[10px] text-slate-400 leading-relaxed italic">
            提示：語音品質取決於作業系統提供的引擎。<br/>推薦選用帶有「ONLINE」標籤的神經語音獲取最佳聽感。
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsModal;
