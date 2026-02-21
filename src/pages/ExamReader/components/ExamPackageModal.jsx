import React, { useState, useEffect } from 'react';
import { X, Box, CheckCircle2, Circle, Loader2, Send } from 'lucide-react';
import { getAllExamMetas, getExamById } from '../../../utils/examDatabase';

const ExamPackageModal = ({ isOpen, onClose, onConfirm, isSharing }) => {
  const [list, setList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadList();
      setSelectedIds([]);
    }
  }, [isOpen]);

  const loadList = async () => {
    const metas = await getAllExamMetas();
    setList(metas);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    
    // 抓取選中考卷的完整內容
    const fullExams = [];
    for (const id of selectedIds) {
      const exam = await getExamById(id);
      if (exam) fullExams.push(exam);
    }
    
    onConfirm(fullExams);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Box className="text-indigo-500" size={20} />
            建立考卷派送包
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4 font-bold">請勾選要一次派送給學生的考卷：</p>
          <div className="space-y-2">
            {list.map(exam => (
              <div 
                key={exam.id}
                onClick={() => toggleSelect(exam.id)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedIds.includes(exam.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
              >
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate pr-2">{exam.title}</span>
                {selectedIds.includes(exam.id) ? <CheckCircle2 className="text-indigo-500" size={20} /> : <Circle className="text-slate-300" size={20} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={handleSend}
            disabled={selectedIds.length === 0 || isSharing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {isSharing ? '打包派送中...' : `確認派送 (${selectedIds.length} 份考卷)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPackageModal;