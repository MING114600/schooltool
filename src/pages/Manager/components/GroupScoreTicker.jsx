import React, { memo } from 'react';
import { Trophy, Crown, Plus, Minus, Users, LayoutDashboard } from 'lucide-react';
import { GROUP_THEME } from '../../../constants';
import { cn } from '../../../utils/cn';
import DraggableWidget from '../../../components/common/widgets/DraggableWidget';

const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.isVisible !== nextProps.isVisible) return false;
  if (prevProps.batchScoreMode !== nextProps.batchScoreMode) return false;
  if (prevProps.groupScores !== nextProps.groupScores) return false;

  // 由於 students 陣列如果重新產生 reference 會更新，我們這裡可以簡單比對 length，
  // 因為 group ticker 主要關心的是 groupScores
  if (prevProps.students?.length !== nextProps.students?.length) return false;

  return true;
};

const GroupScoreTicker = ({
  groupScores = {},
  students = [],
  isVisible,
  onClose,
  onQuickScore,
  onDetailScore
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

  const defaultPosition = {
    x: typeof window !== 'undefined' ? Math.max(window.innerWidth - 260, 20) : 1000,
    y: 80
  };

  return (
    <DraggableWidget
      title="小組記分板"
      icon={Trophy}
      isOpen={isVisible}
      onClose={onClose}
      initialPosition={defaultPosition}
      width="w-56"
    >
      <div className="flex flex-col gap-2">
        <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
          <LayoutDashboard size={12} /> 小組列表
        </div>

        {scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400 opacity-60">
            <Users size={32} className="mb-2 text-slate-300" />
            <p>尚無小組資料</p>
            <p className="mt-1 text-[10px]">請先在側邊欄設定學生組別</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 relative">
            {scores.map((item) => {
              const isLeader = item.score === maxScore && item.score > 0;
              const groupNum = parseInt(item.groupId) || 0;

              const theme = GROUP_THEME[groupNum % 9] || GROUP_THEME[0];

              return (
                <div
                  key={item.groupId}
                  className={cn(
                    "relative p-2 rounded-xl border transition-all duration-300 group",
                    isLeader
                      ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm"
                  )}
                >
                  {isLeader && (
                    <div className="absolute -top-1.5 -left-1.5">
                      <div className="bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200 p-1 rounded-full shadow-sm border border-white dark:border-slate-700 animate-bounce-slight">
                        <Crown size={12} fill="currentColor" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onDetailScore(item.groupId)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm shrink-0 border",
                        theme.bg, theme.text, theme.border
                      )}>
                        {item.groupId}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[14px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">第 {item.groupId} 組</span>
                        <span className={cn(
                          "text-lg font-black leading-none",
                          isLeader ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {item.score}
                        </span>
                      </div>
                    </button>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onQuickScore(item.groupId, 1)}
                        className="w-8 h-7 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-90 shadow-sm"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => onQuickScore(item.groupId, -1)}
                        className="w-8 h-6 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-700/50 text-rose-400 dark:text-rose-400 border border-slate-100 dark:border-slate-600 hover:bg-rose-500 hover:text-white hover:border-rose-200 transition-all active:scale-90"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    </DraggableWidget>
  );
};

export default memo(GroupScoreTicker, arePropsEqual);