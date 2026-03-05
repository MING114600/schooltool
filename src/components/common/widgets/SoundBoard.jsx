import React from 'react';
import {
  Volume2, CheckCircle2, XCircle,
  PartyPopper, AlertTriangle, Zap,
  Drum, Gem, Coins, Megaphone
} from 'lucide-react';
import { playAudio } from '../../../services/audioService';
import DraggableWidget from './DraggableWidget';

const SoundButton = ({ icon: Icon, label, onClick, colorClass, subLabel, isLarge }) => (
  <button
    onClick={onClick}
    className={`
      relative group flex flex-col items-center justify-center rounded-xl 
      border transition-all duration-100 active:scale-95 shadow-sm hover:shadow-md
      bg-white dark:bg-slate-800 
      ${colorClass}
      ${isLarge ? 'p-3' : 'p-2.5'}
    `}
  >
    <Icon size={isLarge ? 26 : 22} className="mb-1 transition-transform group-hover:scale-110" />
    <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-bold`}>{label}</span>
    {subLabel && <span className="text-[9px] opacity-70 scale-90 font-mono mt-0.5">{subLabel}</span>}
  </button>
);

const SoundBoard = ({ isOpen, onClose }) => {


  return (
    <DraggableWidget
      title="課堂音效"
      isOpen={isOpen}
      onClose={onClose}
      icon={Volume2}
      initialPosition={{ x: window.innerWidth - 340, y: 100 }}
      width="w-[320px]"
    >
      <div className="flex flex-col gap-3">

        {/* 區塊 1: 秩序管控 (最常用的放在第一排) */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
            秩序管控
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SoundButton
              icon={Megaphone} label="裁判哨音" subLabel="(Stop!)" isLarge
              colorClass="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              onClick={() => playAudio('whistle')}
            />
            <SoundButton
              icon={AlertTriangle} label="注意警告" subLabel="(Alert)" isLarge
              colorClass="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40"
              onClick={() => playAudio('alert')}
            />
          </div>
        </div>

        {/* 區塊 2: 問答回饋 */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
            問答回饋
          </div>
          <div className="grid grid-cols-3 gap-2">
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
            <SoundButton
              icon={Zap} label="失誤/扣分"
              colorClass="text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              onClick={() => playAudio('negative')}
            />
          </div>
        </div>

        {/* 區塊 3: 遊戲氣氛 */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
            遊戲氣氛
          </div>
          <div className="grid grid-cols-4 gap-2">
            <SoundButton
              icon={Drum} label="鼓聲"
              colorClass="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => playAudio('drumroll')}
            />
            <SoundButton
              icon={Coins} label="金幣"
              colorClass="text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              onClick={() => playAudio('coin')}
            />
            <SoundButton
              icon={Gem} label="升級"
              colorClass="text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              onClick={() => playAudio('level_up')}
            />
            <SoundButton
              icon={PartyPopper} label="歡呼"
              colorClass="text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/50 hover:bg-pink-50 dark:hover:bg-pink-900/20"
              onClick={() => playAudio('applause')}
            />
          </div>
        </div>

        <div className="text-[9px] text-center text-slate-400/60 dark:text-slate-600 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
          Web Audio API Synthetic Sounds
        </div>

      </div>
    </DraggableWidget>
  );
};

export default SoundBoard;