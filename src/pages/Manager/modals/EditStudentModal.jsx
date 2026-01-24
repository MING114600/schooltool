import React, { useState, useEffect } from 'react';
import { User, X, TrendingUp } from 'lucide-react';

const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({ name: '', number: '', gender: 'M', group: '', performance: '' });

  useEffect(() => {
    if (student) {
      setFormData({ 
          ...student, 
          group: student.group || '',
          performance: student.performance !== undefined && student.performance !== null ? student.performance : '' 
      });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden scale-100 border border-slate-200 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><User className="text-blue-500" size={20}/> 編輯學生資料</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">座號</label>
                <input type="text" value={formData.number} onChange={(e) => handleChange('number', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"/>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">姓名</label>
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">性別</label>
            <div className="flex gap-2">
              <button onClick={() => handleChange('gender', 'M')} className={`flex-1 py-2 rounded-lg border font-bold transition-all ${formData.gender === 'M' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>男生</button>
              <button onClick={() => handleChange('gender', 'F')} className={`flex-1 py-2 rounded-lg border font-bold transition-all ${formData.gender === 'F' ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>女生</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">組別</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                <button key={g} onClick={() => handleChange('group', g.toString())} className={`w-8 h-8 rounded-full font-bold text-sm border flex items-center justify-center transition-all ${formData.group === g.toString() ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white scale-110 shadow-md' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>{g}</button>
              ))}
              <button onClick={() => handleChange('group', '')} className={`px-3 h-8 rounded-full font-bold text-xs border flex items-center justify-center transition-all ${!formData.group ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'}`}>無</button>
            </div>
            <input type="text" placeholder="或輸入自訂組別名稱..." value={formData.group} onChange={(e) => handleChange('group', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"/>
          </div>
          
          <div>
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <TrendingUp size={12}/> 參考成績 (選填)
             </label>
             <input 
                type="number" 
                min="0" 
                max="100" 
                placeholder="輸入 S 型分組用的參考數值 (0-100)"
                value={formData.performance} 
                onChange={(e) => handleChange('performance', e.target.value)} 
                className="w-full p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-mono"
             />
          </div>

        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">儲存</button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;