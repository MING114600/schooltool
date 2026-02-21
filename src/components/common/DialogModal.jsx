import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Edit3, X, CheckCircle2, Info, Trash2 } from 'lucide-react';

/**
 * 通用對話框組件
 * @param {boolean} isOpen - 是否開啟
 * @param {function} onClose - 關閉回呼（任何關閉原因都會走）
 * @param {function} onCancel - 取消回呼（取消/背景/ESC 等「非確認」關閉才走）
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {string} type - 'alert' | 'confirm' | 'prompt'
 * @param {function} onConfirm - 確認回呼（prompt 模式會回傳輸入值；其他模式不強塞 true）
 * @param {string} defaultValue - prompt 模式的預設值
 * @param {string} placeholder - prompt 模式的提示字
 * @param {string} confirmText - 確認按鈕文字
 * @param {string} cancelText - 取消按鈕文字
 * @param {string} variant - 'danger' | 'info' | 'success' | 'warning'
 * @param {string} confirmColor - 自訂確認按鈕 class（若有給，優先於 variant）
 * @param {string} cancelColor - 自訂取消按鈕 class
 * @param {boolean} closeOnBackdrop - 點背景是否關閉（預設 true）
 * @param {boolean} closeOnEsc - 按 ESC 是否關閉（預設 true）
 * @param {boolean} isBusy - 執行中（禁用按鈕、避免重複觸發）
 * @param {string} errorMessage - 錯誤訊息（顯示在訊息下方）
 */
const DialogModal = ({
  isOpen,
  onClose,
  onCancel,
  title,
  message,
  type = 'alert',
  onConfirm,
  defaultValue = '',
  placeholder = '請輸入...',
  confirmText = '確定',
  cancelText = '取消',
  variant = 'info',
  confirmColor,
  cancelColor,
  closeOnBackdrop = true,
  closeOnEsc = true,
  isBusy = false,
  errorMessage = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);

  // 同步 prompt 的預設值 + focus
  useEffect(() => {
    if (!isOpen) return;

    setInputValue(defaultValue || '');

    if (type === 'prompt') {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, defaultValue, type]);

  // ESC 關閉
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') requestClose('esc');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closeOnEsc]);

  if (!isOpen) return null;

  // 主題色
  const getTheme = () => {
    switch (variant) {
      case 'danger':
        return { icon: 'text-rose-500', btn: 'bg-rose-500 hover:bg-rose-600', ring: 'focus:ring-rose-400' };
      case 'success':
        return { icon: 'text-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-400' };
      case 'warning':
        return { icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600', ring: 'focus:ring-amber-400' };
      default:
        return { icon: 'text-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-400' };
    }
  };

  const theme = getTheme();

  // 取消按鈕樣式（如果未提供就給安全預設）
  const cancelBtnClass =
    cancelColor ||
    'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white';

  // 確認按鈕樣式（如果有 confirmColor 就覆蓋 variant）
  const confirmBtnClass = confirmColor || theme.btn;

  // 圖示
  const renderIcon = () => {
    if (type === 'prompt') return <Edit3 className={theme.icon} size={24} />;
    if (variant === 'danger') return <Trash2 className={theme.icon} size={24} />;
    if (variant === 'success') return <CheckCircle2 className={theme.icon} size={24} />;
    if (variant === 'warning') return <AlertTriangle className={theme.icon} size={24} />;
    return <Info className={theme.icon} size={24} />;
  };

  /**
   * 統一關閉入口：避免 X / 背景 / 取消按鈕行為不一致
   * reason: 'x' | 'backdrop' | 'cancel' | 'esc' | 'confirm'
   */
  const requestClose = (reason) => {
    if (reason === 'cancel' || reason === 'backdrop' || reason === 'esc') {
      onCancel?.(reason);
    }
    onClose?.(reason);
  };

  const handleConfirm = async () => {
    if (isBusy) return;

    // prompt 回傳字串，其他模式不硬塞 true（避免父層誤吃參數）
    const payload = type === 'prompt' ? inputValue : undefined;

    try {
      // 允許 async confirm
      const result = await onConfirm?.(payload);
      // 若父層回傳 false，代表不要關閉（例如驗證失敗、刪除失敗想留在視窗）
      if (result === false) return;

      requestClose('confirm');
    } catch (err) {
      // 這裡不強制關閉，讓父層用 errorMessage 控制 UI
      console.error('[DialogModal] onConfirm error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => closeOnBackdrop && requestClose('backdrop')}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transition-all border border-slate-200 dark:border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 id="dialog-title" className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            {renderIcon()}
            {title}
          </h3>
          <button
            onClick={() => requestClose('x')}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            aria-label="close"
            disabled={isBusy}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed text-sm font-bold">
            {message}
          </p>

          {errorMessage && (
            <p className="mb-4 text-sm font-bold text-rose-600 dark:text-rose-400 whitespace-pre-wrap">
              {errorMessage}
            </p>
          )}

          {type === 'prompt' && (
            <input
              id="dialog-input"
              name="input"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`w-full p-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all focus:border-transparent focus:ring-2 ${theme.ring}`}
              placeholder={placeholder}
              disabled={isBusy}
              onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleConfirm()}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
          {type !== 'alert' && (
            <button
              onClick={() => requestClose('cancel')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${cancelBtnClass} ${
                isBusy ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              disabled={isBusy}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 ${confirmBtnClass} ${
              isBusy ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            disabled={isBusy}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogModal;
