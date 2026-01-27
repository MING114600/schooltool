import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Edit3, X, CheckCircle2, Info, HelpCircle, Trash2 } from 'lucide-react';

/**
 * 通用對話框組件
 * @param {boolean} isOpen - 是否開啟
 * @param {function} onClose - 關閉函式
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {string} type - 'alert' | 'confirm' | 'prompt'
 * @param {function} onConfirm - 確認回呼，prompt 模式下會回傳輸入值
 * @param {string} defaultValue - prompt 模式的預設值
 * @param {string} placeholder - prompt 模式的提示字
 * @param {string} confirmText - 確認按鈕文字 (預設：確定)
 * @param {string} cancelText - 取消按鈕文字 (預設：取消)
 * @param {string} variant - 'danger' (紅) | 'info' (藍) | 'success' (綠) | 'warning' (黃)
 */
const DialogModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'alert', 
  onConfirm, 
  defaultValue = '', 
  placeholder = '請輸入...',
  confirmText = '確定',
  cancelText = '取消',
  variant = 'info' 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        setInputValue(defaultValue || '');
        // 如果是 prompt，延遲聚焦
        if (type === 'prompt') {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }
  }, [isOpen, defaultValue, type]);

  if (!isOpen) return null;

  const handleConfirm = () => {
      if (type === 'prompt') {
          // 可以在這裡加入簡單的驗證邏輯
          onConfirm(inputValue);
      } else {
          onConfirm(true);
      }
      // 注意：通常由父層決定是否關閉，或在這裡呼叫 onClose()
  };

  // 根據 variant 決定顏色主題
  const getThemeColor = () => {
      switch (variant) {
          case 'danger': return { icon: 'text-rose-500', btn: 'bg-rose-500 hover:bg-rose-600', ring: 'focus:ring-rose-400' };
          case 'success': return { icon: 'text-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-400' };
          case 'warning': return { icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600', ring: 'focus:ring-amber-400' };
          default: return { icon: 'text-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-400' };
      }
  };

  const theme = getThemeColor();

  // 根據 variant 或 type 決定圖示
  const renderIcon = () => {
      if (type === 'prompt') return <Edit3 className={theme.icon} size={24}/>;
      if (variant === 'danger') return <Trash2 className={theme.icon} size={24}/>;
      if (variant === 'success') return <CheckCircle2 className={theme.icon} size={24}/>;
      if (variant === 'warning') return <AlertTriangle className={theme.icon} size={24}/>;
      return <Info className={theme.icon} size={24}/>;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transition-all border border-slate-200 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            {renderIcon()}
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><X size={18}/></button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed text-sm font-bold">
              {message}
          </p>
          
          {type === 'prompt' && (
            <input 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`w-full p-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all focus:border-transparent focus:ring-2 ${theme.ring}`}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
          {type !== 'alert' && (
              <button 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                  {cancelText}
              </button>
          )}
          <button 
            onClick={handleConfirm} 
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 ${theme.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogModal;