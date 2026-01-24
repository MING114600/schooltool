import React from 'react';
import { X, User, Users, Trophy, GraduationCap, ThumbsUp, ThumbsDown } from 'lucide-react';

const ScoringModal = ({ isOpen, onClose, student, behaviors = [], onScore, defaultMode = 'individual' }) => {
  
  if (!isOpen || !student) return null;

  let targetMode = 'individual';
  let title = student.name;
  let subtitle = `座號: ${student.number}`;
  let icon = <User size={20}/>;
  let headerColor = 'bg-slate-800 dark:bg-slate-950'; 
  let subHeaderColor = 'bg-slate-700 dark:bg-slate-800';

  if (student.isClassEntity) {
      targetMode = 'class'; title = '全班同學'; subtitle = 'Classroom'; icon = <Users size={20}/>; headerColor = 'bg-indigo-600 dark:bg-indigo-900'; subHeaderColor = 'bg-indigo-700 dark:bg-indigo-800';
  } else if (student.isGroupEntity) {
      if (defaultMode === 'group_members') {
          targetMode = 'group_members'; title = `第 ${student.group} 組 (全員)`; subtitle = 'Group Members'; icon = <GraduationCap size={20}/>; headerColor = 'bg-pink-600 dark:bg-pink-900'; subHeaderColor = 'bg-pink-700 dark:bg-pink-800';
      } else {
          targetMode = 'group'; title = `第 ${student.group} 組 (小組)`; subtitle = 'Group Entity'; icon = <Trophy size={20}/>; headerColor = 'bg-purple-600 dark:bg-purple-900'; subHeaderColor = 'bg-purple-700 dark:bg-purple-800';
      }
  }

  // ✅ 優化：僅使用 score 進行判斷，移除對 value 的檢查
  const getScore = (b) => {
    return Number(b.score) || 0;
  };

  const handleScoreClick = (behavior) => {
    let targetId = student.id;
    if (targetMode === 'class') targetId = 'all'; 
    else if (targetMode === 'group' || targetMode === 'group_members') targetId = student.group; 
    
    // 這裡同樣只需傳遞 score
    const safeBehavior = { ...behavior, score: getScore(behavior) };
    onScore(targetId, safeBehavior, targetMode);
  };

  const validBehaviors = Array.isArray(behaviors) ? behaviors : [];
  const positiveBehaviors = validBehaviors.filter(b => getScore(b) >= 0);
  const negativeBehaviors = validBehaviors.filter(b => getScore(b) < 0);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-auto" onClick={onClose}/>
      
      {/* 側邊面板 */}
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className={`p-5 flex justify-between items-start text-white shrink-0 ${headerColor}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${subHeaderColor} shadow-inner`}>
                 {icon}
              </div>
              <div>
                  <h3 className="font-bold text-xl leading-tight">{title}</h3>
                  <p className="text-xs text-white/60 font-medium tracking-wide mt-0.5">{subtitle}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-white/20 rounded-full text-white/80 transition-colors"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-800">
            {/* Positive */}
            <div className="p-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
                    <ThumbsUp size={14} className="text-emerald-500"/> 加分項目
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {positiveBehaviors.map(b => (
                        <button key={b.id} onClick={() => handleScoreClick(b)} className="group relative p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 hover:ring-1 hover:ring-emerald-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center gap-2">
                            <span className="text-3xl group-hover:scale-110 transition-transform duration-200 filter drop-shadow-sm">{b.icon}</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center leading-tight">{b.label}</span>
                            <span className="absolute top-2 right-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">+{getScore(b)}</span>
                        </button>
                    ))}
                    {positiveBehaviors.length === 0 && <div className="col-span-full text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 py-6">尚無加分項目</div>}
                </div>
            </div>

            {/* Negative */}
            {negativeBehaviors.length > 0 && (
                <div className="p-4 pt-0">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 px-1 mt-2">
                        <ThumbsDown size={14} className="text-rose-500"/> 扣分/提醒
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {negativeBehaviors.map(b => (
                            <button key={b.id} onClick={() => handleScoreClick(b)} className="group relative p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 shadow-sm hover:border-rose-400 dark:hover:border-rose-500 hover:ring-1 hover:ring-rose-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center gap-2">
                                <span className="text-3xl group-hover:scale-110 transition-transform duration-200 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100">{b.icon}</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center leading-tight">{b.label}</span>
                                <span className="absolute top-2 right-2 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded-md border border-rose-100 dark:border-rose-800">{getScore(b)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400">
           點擊項目即可評分
        </div>

      </div>
    </div>
  );
};

export default ScoringModal;