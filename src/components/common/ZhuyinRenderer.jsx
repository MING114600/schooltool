import React, { memo } from 'react';

const ZhuyinRenderer = ({ 
  text, 
  isActive, 
  isKaraokeMode = false, 
  highlightRange = [0, 0], 
  globalOffset = 0, 
  className = "",
  onWordClick 
}) => {
  const baseClass = isActive ? `font-with-zhuyin ${className}` : className;

  if (!text) return null;

  const renderClickableText = (str, localOffset) => {
    if (!onWordClick) return str; 
    
    return str.split('').map((char, i) => (
      <span
        key={localOffset + i}
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(globalOffset + localOffset + i); 
        }}
        className="cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors rounded-sm inline-block" 
        title="點擊從此處開始朗讀"
      >
        {char}
      </span>
    ));
  };

  if (!isKaraokeMode) {
    return <span className={baseClass}>{renderClickableText(text, 0)}</span>;
  }

  const globalStart = highlightRange[0];
  const globalEnd = highlightRange[1];

  if (globalEnd <= globalOffset || globalStart >= globalOffset + text.length) {
    return <span className={baseClass}>{renderClickableText(text, 0)}</span>;
  }

  const localStart = Math.max(0, globalStart - globalOffset);
  const localEnd = Math.min(text.length, globalEnd - globalOffset);

  if (localStart === localEnd) {
    return <span className={baseClass}>{renderClickableText(text, 0)}</span>;
  }

  const textBefore = text.slice(0, localStart);
  const textHighlight = text.slice(localStart, localEnd);
  const textAfter = text.slice(localEnd);

  const cursorClass =
    "relative inline-block px-0.5 rounded-sm " +
    "bg-yellow-200/35 dark:bg-amber-300/20 " +
    "underline decoration-yellow-500 dark:decoration-amber-300 " +
    "decoration-4 underline-offset-4 " +
    "transition-all duration-150 ease-out";

  return (
    <span className={baseClass}>
      {renderClickableText(textBefore, 0)}
      
      {textHighlight.trim() ? (
        <span className={cursorClass}>
          {renderClickableText(textHighlight, localStart)}
        </span>
      ) : (
        renderClickableText(textHighlight, localStart)
      )}
      
      {renderClickableText(textAfter, localEnd)}
    </span>
  );
};

// 🌟 效能優化核心：自訂比對邏輯，決定是否需要重新渲染
const areEqual = (prevProps, nextProps) => {
  // 1. 基礎屬性改變時，必須重新渲染
  if (prevProps.text !== nextProps.text) return false;
  if (prevProps.isKaraokeMode !== nextProps.isKaraokeMode) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.globalOffset !== nextProps.globalOffset) return false;

  const textLength = nextProps.text.length;
  const segmentStart = nextProps.globalOffset;
  const segmentEnd = segmentStart + textLength;

  const prevRange = prevProps.highlightRange || [0, 0];
  const nextRange = nextProps.highlightRange || [0, 0];

  // 判斷上一次渲染時，游標是否在這個元件範圍內
  const wasHighlighted = (prevRange[1] > segmentStart) && (prevRange[0] < segmentEnd);
  // 判斷這一次渲染時，游標是否在這個元件範圍內
  const isHighlighted = (nextRange[1] > segmentStart) && (nextRange[0] < segmentEnd);

  // 2. 如果游標跟這個元件有任何交集 (進來、出去、或在裡面移動)
  if (wasHighlighted || isHighlighted) {
    // 確保範圍真的有變動才重新渲染，避免無意義的更新
    if (prevRange[0] !== nextRange[0] || prevRange[1] !== nextRange[1]) {
      return false; // false 代表需要 Re-render
    }
  }

  // 3. 如果游標一直在元件外面移動，這個元件就完全不需要重新渲染，省下大量 CPU 資源
  return true; 
};

// 使用 React.memo 包裝並匯出
export default memo(ZhuyinRenderer, areEqual);