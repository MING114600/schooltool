import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Edit3, X } from 'lucide-react';

const DialogModal = ({ isOpen, onClose, title, message, type, onConfirm, defaultValue = '' }) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        setInputValue(defaultValue);
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transition-all border border-slate-200 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {type === 'confirm' || type === 'alert' ? <AlertTriangle className="text-amber-500" size={20}/> : <Edit3 className="text-blue-500" size={20}/>}
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"><X size={16}/></button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{message}</p>
          {type === 'prompt' && (
            <input 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-2 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-white"
              placeholder="請輸入..."
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(inputValue)}
            />
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
          {type !== 'alert' && <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>}
          <button onClick={() => onConfirm(type === 'prompt' ? inputValue : true)} className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors ${type === 'confirm' || type === 'alert' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>確定</button>
        </div>
      </div>
    </div>
  );
};

export default DialogModal;