import React, { useState, useEffect } from 'react';
import { Edit3, X, Users, AlertCircle } from 'lucide-react';
import { UI_THEME } from '../../../constants';

const ManualAttendanceModal = ({ isOpen, onClose, data, onSave }) => {
  const [tempData, setTempData] = useState(data || { expected: 0, actual: 0, note: '' });
  useEffect(() => {
  if (isOpen) setTempData(data || { expected: 0, actual: 0, note: '' });
}, [isOpen, data]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempData);
    onClose();
  };

  const inputClass = `w-full p-3 rounded-xl border ${UI_THEME.INPUT_BASE} text-lg font-bold`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${UI_THEME.SURFACE_MAIN} border ${UI_THEME.BORDER_DEFAULT}`}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold flex items-center gap-2"><Edit3 size={20}/> 手動輸入人數</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">應到人數</label>
              <input 
                type="number" 
                value={tempData.expected} 
                onChange={e => setTempData({...tempData, expected: parseInt(e.target.value) || 0})}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">實到人數</label>
              <input 
                type="number" 
                value={tempData.actual} 
                onChange={e => setTempData({...tempData, actual: parseInt(e.target.value) || 0})}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">缺席/備註 (文字)</label>
            <textarea 
              placeholder="例如：3號、15號、王小明"
              value={tempData.note}
              onChange={e => setTempData({...tempData, note: e.target.value})}
              className={`${inputClass} font-normal text-base min-h-24 max-h-60 overflow-auto resize-y`}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold">取消</button>
          <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">確認儲存</button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;