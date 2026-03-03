// src/components/common/ExamPackageModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Box, CheckCircle2, Circle, Loader2, Send, Edit3 } from 'lucide-react';
import { getAllExamMetas, getExamById } from '../../../services/examDatabase';

const ExamPackageModal = ({ isOpen, onClose, onConfirm, isSharing }) => {
  const [list, setList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // 🌟 新增：用來控制自訂名稱的 State
  const [customPackageName, setCustomPackageName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadList();
      setSelectedIds([]);
      setCustomPackageName('');
    }
  }, [isOpen]);

  // 🌟 當選擇變動時，自動產生「預設名稱」
  useEffect(() => {
    updateDefaultName();
  }, [selectedIds, list]);

  const loadList = async () => {
    const metas = await getAllExamMetas();
    setList(metas);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 🌟 邏輯核心：產生預設名稱
  const updateDefaultName = () => {
    if (selectedIds.length <= 1) return;

    // 找到第一份被選中的考卷 (為了拿到標題)
    // 注意：selectedIds 順序可能跟 list 不同，建議照 list 順序找，比較符合視覺直覺
    const firstSelected = list.find(exam => exam.id === selectedIds[0]); // 或是照勾選順序
    
    if (firstSelected) {
      const defaultName = `${firstSelected.title}_等${selectedIds.length}份`;
      setCustomPackageName(defaultName);
    }
  };

const handleSend = async () => {
    if (selectedIds.length === 0) return;
    
    // 抓取完整考卷資料
    const fullExams = [];
    for (const id of selectedIds) {
      const exam = await getExamById(id);
      if (exam) fullExams.push(exam);
    }
    
    const count = fullExams.length;
    let displayTitle = '';
    let cloudFileName = '';

    // 🌟 關鍵修正：從畫面上已知的 list 提取標題作為最安全的備案
    const firstSelectedMeta = list.find(exam => exam.id === selectedIds[0]);
    const safeTitle = fullExams[0]?.title || (firstSelectedMeta ? firstSelectedMeta.title : '未命名考卷');

    if (count === 1) {
      // 單份：直接用考卷標題，不需老師輸入
      displayTitle = safeTitle;
      cloudFileName = `[派送考卷]_${safeTitle}`;
    } else {
      // 多份：使用老師輸入的名稱 (或是預設值)
      const finalName = customPackageName.trim() || `${safeTitle}_等${count}份`;
      displayTitle = finalName;
      cloudFileName = `[派送考卷包]_${finalName}`; 
    }

    onConfirm(fullExams, displayTitle, cloudFileName);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Box className="text-indigo-500" size={20} />
            建立考卷派送包
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List Body */}
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-bold">
            請勾選要一次派送給學生的考卷：
          </p>
          <div className="space-y-2">
            {list.length === 0 ? (
              <p className="text-center text-slate-400 py-4">目前沒有考卷可供派送</p>
            ) : (
              list.map(exam => (
                <div 
                  key={exam.id}
                  onClick={() => toggleSelect(exam.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                    selectedIds.includes(exam.id) 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                  }`}
                >
                  <span className={`font-bold text-sm truncate pr-2 transition-colors ${selectedIds.includes(exam.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    {exam.title}
                  </span>
                  {selectedIds.includes(exam.id) 
                    ? <CheckCircle2 className="text-indigo-500" size={20} /> 
                    : <Circle className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-300" size={20} />
                  }
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Action Area */}
        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
          
          {/* 🌟 動態輸入框：只有多選時才出現 */}
          {selectedIds.length > 1 && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                <Edit3 size={12} />
                自訂派送包名稱 (可修改)
              </label>
              <input
                type="text"
                value={customPackageName}
                onChange={(e) => setCustomPackageName(e.target.value)}
                placeholder="例如：週末國語複習包"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}

          <button 
            onClick={handleSend}
            disabled={selectedIds.length === 0 || isSharing}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
              selectedIds.length === 0 || isSharing
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span>
              {isSharing 
                ? '打包派送中...' 
                : selectedIds.length <= 1 
                  ? '確認派送 (單份)' 
                  : `確認建立派送包 (${selectedIds.length} 份)`
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPackageModal;