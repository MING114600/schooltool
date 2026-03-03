import React, { useState } from 'react';
import { Timer, X, Type } from 'lucide-react';
import { UI_THEME } from '../../../constants';

const QuickExamModal = ({ isOpen, onClose, onConfirm }) => {
  const [minutes, setMinutes] = useState(10);
  const [title, setTitle] = useState('隨堂考');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const mins = parseInt(minutes, 10);
    if (mins > 0) {
      onConfirm(mins, title || '隨堂考');
      onClose();
    }
  };

  const inputClass = `w-full p-3 rounded-xl border ${UI_THEME.INPUT_BASE} font-bold`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${UI_THEME.SURFACE_MAIN} border ${UI_THEME.BORDER_DEFAULT}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Timer className="text-blue-500" size={24}/> 設定臨時測驗
          </h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="examtext" className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Type size={12}/> 測驗標題
            </label>
            <input  name="exam-text-input" id="examtext"
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：第一課小考"
              className={inputClass}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>

          <div>
            <label htmlFor="examtitle" className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Timer size={12}/> 測驗時間 (分鐘)
            </label>
            <input name="exam-title-input" id="examtitle"
              type="number" 
              min="1"
              value={minutes} 
              onChange={e => setMinutes(e.target.value)}
              className={`${inputClass} text-2xl text-center text-blue-600 dark:text-blue-400`}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors">取消</button>
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
            開始測驗
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickExamModal;