import React, { useState, useEffect, useRef } from 'react';
// ✅ 新增 Download, Upload 圖示
import { X, Plus, Trash2, BookOpen, Edit3, Check, Search, Download, Upload } from 'lucide-react'; 

const TTSDictModal = ({ isOpen, onClose }) => {
  const [dict, setDict] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [editingSymbol, setEditingSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  // ✅ 用來觸發隱藏的檔案上傳 input
  const fileInputRef = useRef(null);

  const handleCancelEdit = () => {
    setNewSymbol('');
    setNewPronunciation('');
    setEditingSymbol(null);
  };

  const handleSave = () => {
    const sym = newSymbol.trim();
    const pron = newPronunciation.trim();
    if (!sym || !pron) return;

    const updatedDict = { ...dict };
    if (editingSymbol && editingSymbol !== sym) {
      delete updatedDict[editingSymbol];
    }

    updatedDict[sym] = pron;
    setDict(updatedDict);
    localStorage.setItem('tts_custom_dict', JSON.stringify(updatedDict));
    handleCancelEdit();
  };

  const handleEdit = (sym, pron) => {
    setNewSymbol(sym);
    setNewPronunciation(pron);
    setEditingSymbol(sym);
  };

  const handleDelete = (symbolToDelete) => {
    const updatedDict = { ...dict };
    delete updatedDict[symbolToDelete];
    setDict(updatedDict);
    localStorage.setItem('tts_custom_dict', JSON.stringify(updatedDict));
    if (editingSymbol === symbolToDelete) {
      handleCancelEdit();
    }
  };

  // ==========================================
  // 🚀 新增：CSV 匯出與匯入功能
  // ==========================================
  
  const handleExportCSV = () => {
    // 加上 \uFEFF BOM 標記，確保 Excel 打開中文不會亂碼
    let csvContent = "\uFEFF字詞或符號,正確讀音\n"; 
    
    Object.entries(dict).forEach(([sym, pron]) => {
      // 處理字詞中可能包含的逗號或引號
      const safeSym = `"${sym.replace(/"/g, '""')}"`;
      const safePron = `"${pron.replace(/"/g, '""')}"`;
      csvContent += `${safeSym},${safePron}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `自訂發音字典_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const updatedDict = { ...dict };
        let importCount = 0;

        // 從第二行開始讀 (跳過標題)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // 簡易 CSV 解析 (切分逗號並去掉引號)
          // 假設老師正常用 Excel 編輯，通常是 A欄,B欄
          const parts = line.split(',');
          if (parts.length >= 2) {
            const sym = parts[0].replace(/^"|"$/g, '').trim();
            const pron = parts[1].replace(/^"|"$/g, '').trim();
            
            if (sym && pron) {
              updatedDict[sym] = pron;
              importCount++;
            }
          }
        }

        setDict(updatedDict);
        localStorage.setItem('tts_custom_dict', JSON.stringify(updatedDict));
        alert(`成功匯入 ${importCount} 筆發音規則！`);
        
      } catch (err) {
        alert("匯入失敗，請確認是否為正確的 CSV 格式。");
        console.error("CSV 解析錯誤:", err);
      }
    };
    reader.readAsText(file, "UTF-8"); // 使用 UTF-8 讀取
    event.target.value = null; // 重置 input
  };

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('tts_custom_dict')) || {};
        setDict(saved);
      } catch (e) {
        console.error("讀取字典失敗", e);
      }
    } else {
      handleCancelEdit();
      setSearchTerm(''); 
    }
  }, [isOpen]);

  const filteredDictEntries = Object.entries(dict).filter(([sym, pron]) => 
    sym.includes(searchTerm) || pron.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      
      {/* 🚀 放大視窗：改為 max-w-4xl (為了容納三欄排版) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* 標題列 */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="text-indigo-500" size={24} />
            自訂發音字典
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* 上半部：輸入區與匯入匯出操作 */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            
            {/* 新增/編輯區塊 (佔據大部分空間) */}
            <div className={`flex-1 w-full flex gap-3 items-center p-3 rounded-xl border transition-colors ${editingSymbol ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'}`}>
              <input 
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="字詞或符號 (例: 骨骼)"
                className="w-2/5 p-2 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none font-bold text-slate-700 dark:text-white focus:border-indigo-400 transition-colors"
              />
              <span className="text-slate-400 font-bold">👉</span>
              <input 
                value={newPronunciation}
                onChange={(e) => setNewPronunciation(e.target.value)}
                placeholder="正確讀音 (例: 古格)"
                className="flex-1 p-2 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none font-bold text-slate-700 dark:text-white focus:border-indigo-400 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              
              {editingSymbol ? (
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleSave} disabled={!newSymbol.trim() || !newPronunciation.trim()} className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg transition-colors"><Check size={20} /></button>
                  <button onClick={handleCancelEdit} className="p-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"><X size={20} /></button>
                </div>
              ) : (
                <button onClick={handleSave} disabled={!newSymbol.trim() || !newPronunciation.trim()} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shrink-0"><Plus size={20} /></button>
              )}
            </div>

            {/* 🚀 CSV 操作按鈕 */}
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-colors shadow-sm"
                title="下載 Excel 格式的 CSV 檔案"
              >
                <Download size={18} />
                匯出
              </button>
              
              {/* 隱藏的 File Input */}
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-colors shadow-sm"
                title="匯入已編輯好的 CSV 檔案"
              >
                <Upload size={18} />
                匯入
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* 搜尋過濾區塊 */}
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-600 dark:text-slate-300">
              已建立的規則 ({Object.keys(dict).length})
            </h4>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋字詞或讀音..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-full text-sm outline-none focus:border-indigo-400 dark:text-white transition-colors"
              />
            </div>
          </div>

          {/* 🚀 響應式三欄排版：md:grid-cols-2 lg:grid-cols-3 */}
          <div className="mt-1 max-h-[50vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
            {filteredDictEntries.length === 0 ? (
              <div className="col-span-full text-center text-slate-400 py-10 text-sm">
                {searchTerm ? '找不到符合的搜尋結果' : '尚未新增任何自訂發音'}
              </div>
            ) : (
              filteredDictEntries.map(([sym, pron]) => (
                <div 
                  key={sym} 
                  className={`flex justify-between items-center p-3 border rounded-lg shadow-sm group transition-colors ${editingSymbol === sym ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-white dark:bg-slate-800 hover:border-indigo-300 border-slate-100 dark:border-slate-700'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400 truncate max-w-[110px]" title={sym}>{sym}</span>
                    <span className="text-slate-400 text-xs shrink-0">讀作</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={pron}>{pron}</span>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button onClick={() => handleEdit(sym, pron)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all" title="編輯"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(sym)} className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-all" title="刪除"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TTSDictModal;