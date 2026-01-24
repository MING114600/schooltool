import React from 'react';
import { Trophy, Crown, Plus, Minus, Users, MousePointerClick, Gift, LayoutDashboard, X } from 'lucide-react';
import { GROUP_THEME } from '../../../utils/constants';

const GroupScoreTicker = ({ 
  groupScores = {}, 
  students = [], 
  isVisible, 
  onClose, 
  onQuickScore, 
  onDetailScore, 
  onClassScore,
  batchScoreMode,
  onToggleBatchMode
}) => {
  if (!isVisible) return null;

  const availableGroups = new Set();
  Object.keys(groupScores).forEach(g => availableGroups.add(g));
  students.forEach(s => {
      if (s.group && s.group.trim() !== '') {
          availableGroups.add(s.group);
      }
  });

  const scores = Array.from(availableGroups)
    .map(groupId => ({ 
        groupId, 
        score: groupScores[groupId] || 0 
    }))
    .sort((a, b) => {
        const numA = parseInt(a.groupId);
        const numB = parseInt(b.groupId);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.groupId.localeCompare(b.groupId);
    }); 

  const maxScore = Math.max(...scores.map(s => s.score), 0);

  // 寬度與背景設定：深色模式下使用深藍黑背景
  const containerClass = "absolute right-0 top-14 md:top-16 bottom-0 w-44 md:w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-700 shadow-2xl z-[40] flex flex-col transition-all duration-300 animate-in slide-in-from-right";

  return (
    <div className={containerClass}>
      {/* Header Area */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2 shrink-0 relative">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="隱藏評分工具"
          >
              <X size={16}/>
          </button>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold pr-6">
              <Trophy size={16} className="text-amber-500"/>
              <span className="text-[16px] font-bold text-slate-600 dark:text-slate-200">
                 評分工具
              </span>
          </div>
          
          {/* 全班加分按鈕 */}
          <button 
            onClick={onClassScore}
            className="
                w-full py-2 px-3 rounded-lg 
                bg-gradient-to-r from-indigo-500 to-purple-600 
                text-white font-black text-lg shadow-md shadow-indigo-200 dark:shadow-none
                hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all
                flex items-center justify-center gap-2 mt-1
            "
          >
            <Gift size={16} className="animate-pulse"/>
            全班加分
          </button>

          {/* 批次評分控制區 */}
          <div className="mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-700">
             <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                   <MousePointerClick size={14}/> 快速評分模式
                </span>
                {batchScoreMode && (
                   <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                      {batchScoreMode === 'add' ? '加分中...' : '扣分中...'}
                   </span>
                )}
             </div>
             <div className="flex gap-2">
                 <button 
                    onClick={() => onToggleBatchMode && onToggleBatchMode('add')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all border-b-2 active:border-b-0 active:translate-y-[2px] ${
                       batchScoreMode === 'add' 
                       ? 'bg-emerald-500 text-white border-emerald-700 shadow-inner' 
                       : 'bg-emerald-50 dark:bg-emerald-700/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-500 dark:hover:text-white'
                    }`}
                    title="啟動後，點擊學生直接 +1 分"
                 >
                    <Plus size={18} strokeWidth={3}/>
                 </button>

                 <button 
                    onClick={() => onToggleBatchMode && onToggleBatchMode('deduct')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all border-b-2 active:border-b-0 active:translate-y-[2px] ${
                       batchScoreMode === 'deduct' 
                       ? 'bg-rose-500 text-white border-rose-700 shadow-inner' 
                       : 'bg-rose-50 dark:bg-rose-700/50 text-rose-600 dark:text-rose-100 border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-500  dark:hover:text-white'
                    }`}
                    title="啟動後，點擊學生直接 -1 分"
                 >
                    <Minus size={18} strokeWidth={3}/>
                 </button>
             </div>
          </div>
      </div>

      {/* Score List Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        <div className="px-1 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <LayoutDashboard size={12}/> 小組列表
        </div>
        
        {scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400 opacity-60">
                <Users size={32} className="mb-2 text-slate-300"/>
                <p>尚無小組資料</p>
                <p className="mt-1 text-[10px]">請先在側邊欄設定學生組別</p>
            </div>
        ) : (
            scores.map((item, index) => {
              const isLeader = item.score === maxScore && item.score > 0;
              const groupNum = parseInt(item.groupId) || 0;
              
              const theme = GROUP_THEME[groupNum % 9] || GROUP_THEME[0];
              // ✅ 簡化引用，移除 theme.dark
              const themeClasses = `${theme.bg} ${theme.text} ${theme.border}`;
              
              return (
                <div 
                  key={item.groupId} 
                  className={`
                    relative p-2 rounded-xl border transition-all duration-300 group
                    ${isLeader 
                        ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm'
                    }
                  `}
                >
                  {isLeader && (
                      <div className="absolute -top-1.5 -left-1.5">
                          <div className="bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200 p-1 rounded-full shadow-sm border border-white dark:border-slate-700 animate-bounce-slight">
                            <Crown size={12} fill="currentColor"/>
                          </div>
                      </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                      <button 
                        onClick={() => onDetailScore(item.groupId)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                          <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm shrink-0 border
                              ${themeClasses}
                          `}>
                              {item.groupId}
                          </div>
                          
                          <div className="flex flex-col">
                              <span className="text-[14px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">第 {item.groupId} 組</span>
                              <span className={`text-lg font-black leading-none ${isLeader ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {item.score}
                              </span>
                          </div>
                      </button>

                      <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => onQuickScore(item.groupId, 1)}
                            className="w-8 h-7 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-90 shadow-sm"
                          >
                              <Plus size={16} strokeWidth={3}/>
                          </button>
                          <button 
                            onClick={() => onQuickScore(item.groupId, -1)}
                            className="w-8 h-6 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-700/50 text-rose-400 dark:text-rose-400 border border-slate-100 dark:border-slate-600 hover:bg-rose-500 hover:text-white hover:border-rose-200 transition-all active:scale-90"
                          >
                              <Minus size={14} strokeWidth={3}/>
                          </button>
                      </div>
                  </div>
                </div>
              );
            })
        )}
        
        <div className="h-16"></div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        @keyframes bounce-slight {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(0, -3px); }
        }
        .animate-bounce-slight {
            animation: bounce-slight 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default GroupScoreTicker;