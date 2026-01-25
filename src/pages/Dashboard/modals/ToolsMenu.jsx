import React from 'react';
import { 
  Clock, Shuffle, Volume2, X, Box
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

const ToolCard = ({ icon: Icon, title, desc, colorClass, onClick }) => (
  <button 
    onClick={onClick}
    className={`group relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 text-left ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT} hover:shadow-xl hover:border-transparent`}
  >
    <div className={`mb-4 p-4 rounded-full text-white shadow-lg transition-transform group-hover:scale-110 ${colorClass}`}>
      <Icon size={32} />
    </div>
    <h3 className={`text-lg font-bold mb-1 ${UI_THEME.TEXT_PRIMARY}`}>{title}</h3>
    <p className={`text-xs font-bold ${UI_THEME.TEXT_MUTED}`}>{desc}</p>
  </button>
);

const ToolsMenu = ({ isOpen, onClose, onOpenTool }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`${UI_THEME.SURFACE_MAIN} w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border ${UI_THEME.BORDER_LIGHT} animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${UI_THEME.BORDER_LIGHT}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${UI_THEME.TEXT_PRIMARY}`}>
            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                <Box size={24}/> 
            </div>
            教室百寶箱
          </h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_SECONDARY}`}
          >
            <X size={24}/>
          </button>
        </div>

        {/* Content */}
        <div className={`p-8 grid grid-cols-1 md:grid-cols-3 gap-6 ${UI_THEME.BACKGROUND}`}>
          <ToolCard 
            icon={Clock} 
            title="倒數計時" 
            desc="自訂時間、鈴聲提醒"
            colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
            onClick={() => { onOpenTool('timer'); onClose(); }}
          />
          <ToolCard 
            icon={Shuffle} 
            title="幸運抽籤" 
            desc="隨機抽選學生或號碼"
            colorClass="bg-gradient-to-br from-purple-400 to-purple-600"
            onClick={() => { onOpenTool('lottery'); onClose(); }}
          />
          <ToolCard 
            icon={Volume2} 
            title="課堂音效" 
            desc="掌聲、叮咚、警告音"
            colorClass="bg-gradient-to-br from-amber-400 to-orange-500"
            onClick={() => { onOpenTool('sound'); onClose(); }}
          />
        </div>
        
        <div className={`p-4 text-center text-xs font-bold ${UI_THEME.TEXT_MUTED} border-t ${UI_THEME.BORDER_LIGHT}`}>
           點擊工具後將以懸浮視窗開啟，可自由拖曳位置
        </div>
      </div>
    </div>
  );
};

export default ToolsMenu;