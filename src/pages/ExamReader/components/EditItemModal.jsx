// src/pages/ExamReader/components/EditItemModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';

const EditItemModal = ({ isOpen, onClose, currentItem, onSave }) => {
  const [editText, setEditText] = useState('');

  // 每次打開視窗時，自動帶入當前題目的文字
  useEffect(() => {
    if (isOpen && currentItem) {
      setEditText(currentItem.text || '');
    }
  }, [isOpen, currentItem]);

  if (!isOpen || !currentItem) return null;

  const handleSave = () => {
    onSave(currentItem.id, editText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 標題列 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
            <Edit3 className="text-indigo-500" size={20} />
            快速編輯題目
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 編輯區 */}
        <div className="p-6">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-64 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:bg-slate-700 dark:text-white outline-none transition-all text-lg leading-relaxed"
            placeholder="請輸入題目內容..."
          />
          <p className="text-xs text-slate-500 mt-3 font-medium flex justify-between">
            <span>支援多行文字與選項編號調整。</span>
            <span>修改後將自動存入本機資料庫。</span>
          </p>
        </div>

        {/* 按鈕區 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save size={18} />
            儲存修改
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditItemModal;