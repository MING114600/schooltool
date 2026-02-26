// src/components/Zhuyin/ZhuyinCustomizer.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Save, Search, Edit2, RotateCcw, Book } from 'lucide-react';
import { CHAR_PRONUNCIATION_MAP, IVS_CODES } from '../../constants/charMap';
import { UI_THEME } from '../../utils/constants';
import { useOS } from '../../context/OSContext'; // 改用 useOS，因 addCustomReading 在這裡
import ZhuyinRenderer from './ZhuyinRenderer'; // 引入渲染器

const ZhuyinCustomizer = () => {
  const { userDict, addCustomReading, removeCustomReading } = useOS();
  const [inputText, setInputText] = useState('');
  const [selections, setSelections] = useState([]);
  const [editingKey, setEditingKey] = useState(null); // 追蹤正在編輯哪個詞，null 表示新增模式
  const [searchTerm, setSearchTerm] = useState('');

  // 當使用者輸入文字時
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    // 重置為預設 (全選第0個)
    setSelections(text.split('').map(() => 0));
    setEditingKey(null); // 輸入新文字視為新增模式
  };

  // 當使用者切換下拉選單
  const handleSelectionChange = (charIndex, optionIndex) => {
    const newSelections = [...selections];
    newSelections[charIndex] = Number(optionIndex);
    setSelections(newSelections);
  };

  // 儲存邏輯
  const handleSave = () => {
    if (!inputText) return;

    let resultString = '';
    const chars = inputText.split('');

    chars.forEach((char, idx) => {
      const selectedIdx = selections[idx];
      resultString += char;
      if (selectedIdx > 0) {
        resultString += (IVS_CODES[selectedIdx] || '');
      }
    });

    addCustomReading(inputText, resultString);
    
    // 儲存後重置
    setInputText('');
    setSelections([]);
    setEditingKey(null);
  };

  // 載入編輯邏輯 (反向解析)
  const loadForEdit = (key, ivsValue) => {
    setInputText(key);
    setEditingKey(key);

    // 解析 IVS 字串回原選項 Index
    // 這邊比較 tricky，需要比對 ivsValue 跟 charMap
    // 簡單作法：遍歷 key 的每個字，看它在 ivsValue 裡後面跟著什麼 IVS Code
    
    const newSelections = [];
    let currentIndex = 0; // 在 ivsValue 中的游標位置

    const keyChars = key.split('');
    keyChars.forEach(char => {
      // 在 ivsValue 中找到這個字
      const charInIvs = ivsValue[currentIndex];
      
      // 確保字元匹配 (理論上一定匹配)
      if (char !== charInIvs) {
         newSelections.push(0); 
         return;
      }

      currentIndex++; // 移過漢字

      // 檢查下一個字元是否為 IVS Selector
      let foundCodeIndex = 0;
      // 檢查 IVS_2, IVS_3, IVS_4... (從 index 1 開始)
      for (let i = 1; i < IVS_CODES.length; i++) {
        const code = IVS_CODES[i];
        if (code && ivsValue.startsWith(code, currentIndex)) {
          foundCodeIndex = i;
          currentIndex += code.length; // 移過 IVS code
          break;
        }
      }
      newSelections.push(foundCodeIndex);
    });

    setSelections(newSelections);
  };

  // 預覽目前的輸入狀態 (即時組合 IVS 字串供 Renderer 顯示)
  const previewString = useMemo(() => {
    if (!inputText) return '';
    let res = '';
    inputText.split('').forEach((char, idx) => {
      res += char;
      const sel = selections[idx];
      if (sel > 0) res += (IVS_CODES[sel] || '');
    });
    return res;
  }, [inputText, selections]);

  // 過濾列表
  const filteredDict = useMemo(() => {
    const list = Object.entries(userDict);
    if (!searchTerm) return list;
    return list.filter(([k]) => k.includes(searchTerm));
  }, [userDict, searchTerm]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* --- 上半部：編輯器 --- */}
      <div className={`flex flex-col gap-4 p-5 rounded-2xl border ${UI_THEME.BORDER_DEFAULT} bg-slate-50 dark:bg-slate-900/50 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${editingKey ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {editingKey ? <Edit2 size={16} /> : <Plus size={16} />}
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {editingKey ? '修改讀音' : '新增自訂讀音'}
            </span>
          </div>
          
          {editingKey && (
            <button 
              onClick={() => {
                setInputText('');
                setSelections([]);
                setEditingKey(null);
              }}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600"
            >
              <RotateCcw size={12}/> 取消修改
            </button>
          )}
        </div>
        
        {/* 輸入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="輸入詞語 (例如: 銀行、參差)"
            className={`flex-1 p-3 text-lg font-bold tracking-widest ${UI_THEME.INPUT_BASE}`}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!inputText}
            className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
              inputText 
                ? editingKey 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800'
            }`}
          >
            <Save size={18} />
            {editingKey ? '更新' : '加入'}
          </button>
        </div>

        {/* 核心功能：動態選音卡片區 */}
        {inputText && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-3 mb-4">
              {inputText.split('').map((char, idx) => {
                const options = CHAR_PRONUNCIATION_MAP[char];
                // 無多音字：顯示灰底卡片
                if (!options) {
                  return (
                    <div key={idx} className="flex flex-col items-center justify-center w-14 h-20 bg-slate-200/50 dark:bg-slate-800 rounded-xl border border-transparent">
                      <span className="font-bold text-xl text-slate-400">{char}</span>
                    </div>
                  );
                }

                // 有多音字：顯示白底互動卡片
                return (
                  <div key={idx} className="flex flex-col gap-1 w-20">
                    <div className="h-14 flex items-center justify-center bg-white dark:bg-slate-800 rounded-t-xl border-x border-t border-slate-200 dark:border-slate-700">
                       <span className="font-bold text-2xl text-slate-700 dark:text-slate-200">{char}</span>
                    </div>
                    <select
                      className={`text-sm p-1.5 rounded-b-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-center appearance-none cursor-pointer hover:bg-slate-50`}
                      value={selections[idx] || 0}
                      onChange={(e) => handleSelectionChange(idx, e.target.value)}
                    >
                      {options.map((opt, optIdx) => (
                        <option key={optIdx} value={optIdx}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* 即時預覽結果 */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">PREVIEW</span>
              <ArrowRight size={16} className="text-indigo-300" />
              {/* 這裡使用 ZhuyinRenderer 來渲染「帶有 IVS 的字串」，這就是您要的效果！ */}
              <div className="text-xl">
                 <ZhuyinRenderer text={previewString} isActive={true} className="text-indigo-700 dark:text-indigo-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- 下半部：字典列表 --- */}
      <div className="flex-1 flex flex-col min-h-0"> {/* min-h-0 讓內層 scroll 生效 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
            <Book size={16}/>
            我的字典 ({Object.keys(userDict).length})
          </div>
          {/* 搜尋框 */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input 
              className={`pl-8 pr-3 py-1 text-sm rounded-full ${UI_THEME.INPUT_BASE} w-40`}
              placeholder="搜尋..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-4">
          {filteredDict.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400">
              <Book size={32} className="mb-2 opacity-20"/>
              <p className="text-sm">尚無自訂資料</p>
            </div>
          ) : (
            filteredDict.map(([key, val]) => (
              <div 
                key={key} 
                onClick={() => loadForEdit(key, val)} // 點擊載入編輯
                className={`group flex items-center justify-between p-3 rounded-xl border ${UI_THEME.BORDER_DEFAULT} bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                   {/* 左側：原始詞 */}
                   <span className="font-bold text-lg text-slate-400 w-24 truncate text-right">{key}</span>
                   
                   <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                   
                   {/* 右側：實際渲染結果 (這就是您要的【銀行ㄏㄤˊ】顯示效果) */}
                   <div className="px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                     <ZhuyinRenderer 
                        text={val} 
                        isActive={true} 
                        className="text-lg text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300" 
                     />
                   </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 避免觸發編輯
                    if(window.confirm(`確定要刪除「${key}」的設定嗎？`)) {
                      removeCustomReading(key);
                    }
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ZhuyinCustomizer;