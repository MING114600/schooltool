import React from 'react';
import { 
  Volume2, CheckCircle2, XCircle, 
  PartyPopper, BellRing, AlertTriangle, Zap,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useAudio } from '../../../hooks/useAudio'; // 請確認路徑是否正確
import DraggableWidget from './DraggableWidget';

const SoundButton = ({ icon: Icon, label, onClick, colorClass, subLabel }) => (
  <button 
    onClick={onClick}
    className={`
      relative group flex flex-col items-center justify-center p-3 rounded-xl 
      border transition-all duration-100 active:scale-95 shadow-sm hover:shadow-md
      bg-white dark:bg-slate-800 
      ${colorClass}
    `}
  >
    <Icon size={24} className="mb-1 transition-transform group-hover:scale-110" />
    <span className="text-xs font-bold">{label}</span>
    {subLabel && <span className="text-[10px] opacity-60 scale-90 font-mono mt-0.5">{subLabel}</span>}
  </button>
);

const SoundBoard = ({ isOpen, onClose }) => {
  const { playAudio } = useAudio();

  return (
    <DraggableWidget
      title="課堂音效"
      isOpen={isOpen}
      onClose={onClose}
      icon={Volume2}
      initialPosition={{ x: window.innerWidth - 340, y: 100 }} // 預設在右側
      width="w-[300px]"
    >
      <div className="flex flex-col gap-4">
        
        {/* 區塊 1: 評價與回饋 */}
        <div>
           <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
              評價與回饋
           </div>
           <div className="grid grid-cols-2 gap-2">
              <SoundButton 
                icon={CheckCircle2} label="答對了" 
                colorClass="text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={() => playAudio('correct')} 
              />
              <SoundButton 
                icon={XCircle} label="答錯了" 
                colorClass="text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={() => playAudio('wrong')} 
              />
           </div>
        </div>

        {/* 區塊 2: 班級經營音效 */}
        <div>
           <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
              班級效果
           </div>
           <div className="grid grid-cols-2 gap-2">
              <SoundButton 
                icon={PartyPopper} label="掌聲鼓勵" 
                colorClass="text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                onClick={() => playAudio('applause')} 
              />
              <SoundButton 
                icon={BellRing} label="注意 / 叮" 
                colorClass="text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => playAudio('positive')} // 假設 positive 是叮聲
                subLabel="(Ding!)"
              />
              <SoundButton 
                icon={AlertTriangle} label="警告音" 
                colorClass="text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => playAudio('alert')} 
              />
              <SoundButton 
                icon={Zap} label="錯誤 / 扣分" 
                colorClass="text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => playAudio('negative')} 
                subLabel="(Buzz)"
              />
           </div>
        </div>

        {/* 底部提示 */}
        <div className="text-[10px] text-center text-slate-400/60 dark:text-slate-600 pt-2 border-t border-slate-100 dark:border-slate-800">
           Web Audio API Synthetic Sounds
        </div>

      </div>
    </DraggableWidget>
  );
};

export default SoundBoard;