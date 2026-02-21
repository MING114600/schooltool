// src/pages/ExamReader/components/ExamSidebar.jsx
import React, { useRef, useEffect } from 'react';
import { List, Bookmark, Hash, CircleDot, Image as ImageIcon } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

const ExamSidebar = ({ isOpen, examItems, currentIndex, setCurrentIndex }) => {
  // ✅ 建立一個 ref 來追蹤目前被選中的項目
  const activeItemRef = useRef(null);

  // ✅ 當 currentIndex 改變時，自動捲動到該項目
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // 確保項目出現在可視範圍內，減少不必要的劇烈捲動
      });
    }
  }, [currentIndex]);
  return (
    <aside className={`
      ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} 
      transition-all duration-300 ease-in-out border-r ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} 
      flex flex-col flex-shrink-0 overflow-y-auto
    `}>
      {/* 固定在頂部的標題列 */}
      <div className="p-4 sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${UI_THEME.TEXT_SECONDARY} flex items-center gap-2`}>
          <List size={18} /> 試卷結構導覽
        </h3>
      </div>
      
      <div className="flex flex-col p-3 gap-1.5 pb-20">
        {examItems.map((item, index) => {
          const isSelected = index === currentIndex;
          const isSection = item.type === 'section';
          const isOption = item.type === 'option';
          const isImage = item.type === 'image';
          
          // --- 根據題目類型設定基礎樣式與圖示 ---
          let itemStyle = '';
          let Icon = Hash;
          let iconSize = 14;
          
          if (isSection) {
            // 大題樣式：醒目色塊、左側粗邊框
            itemStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border-l-4 border-indigo-500 rounded-r-lg mt-3 mb-1';
            Icon = Bookmark;
            iconSize = 16;
          } else if (isOption) {
            // 選項樣式：內縮、文字較小
            itemStyle = 'ml-6 text-sm text-slate-600 dark:text-slate-400 border border-transparent';
            Icon = CircleDot;
            iconSize = 12;
          } else if (isImage) {
            // 圖片樣式：特定顏色標示
            itemStyle = 'ml-6 text-sm text-amber-600 dark:text-amber-500 border border-transparent italic';
            Icon = ImageIcon;
            iconSize = 14;
          } else {
            // 預設一般題目樣式
            itemStyle = 'ml-2 text-base text-slate-700 dark:text-slate-300 border border-transparent';
          }

          // --- 處理被選中 (Active) 時的樣式覆蓋 ---
          if (isSelected) {
            if (isSection) {
              itemStyle = 'bg-indigo-600 dark:bg-indigo-600 text-white font-bold border-l-4 border-indigo-800 rounded-r-lg mt-3 mb-1 shadow-md';
            } else {
              itemStyle = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/50 rounded-lg shadow-sm ml-2';
            }
          } else if (!isSection) {
            // 未選中時的 Hover 效果 (排除大題，因為大題已有自己的底色)
            itemStyle += ` hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg ${UI_THEME.BTN_GHOST}`;
          }

          return (
            <button
              key={item.id}
			  ref={isSelected ? activeItemRef : null}
              onClick={() => setCurrentIndex(index)}
              className={`text-left p-2.5 transition-all flex items-start gap-2.5 group ${itemStyle}`}
            >
              {/* 圖示容器 */}
              <div className={`mt-0.5 ${isSelected && !isSection ? 'text-blue-500' : 'opacity-60'}`}>
                <Icon size={iconSize} />
              </div>
              
              {/* 文字內容 */}
              <div className="truncate flex-1 leading-tight">
                {isImage ? '[圖片附件]' : item.title}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ExamSidebar;