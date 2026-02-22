import React, { memo } from 'react';
// 引入破音字修正引擎 (請確認相對路徑是否正確)
import { fixPolyphones } from '../../constants/polyphoneDict'; 

const ZhuyinRenderer = ({ 
  text, 
  isActive, 
  className = ""
}) => {
  if (!text) return null;

  // 處理 CSS Class
  const baseClass = isActive ? `font-with-zhuyin ${className}` : className;

  // 核心邏輯：若啟用注音模式，則將傳入的文字經過破音字引擎替換，否則維持原字串
  const displayText = isActive ? fixPolyphones(text) : text;

  return (
    <span className={baseClass.trim()}>
      {displayText}
    </span>
  );
};

// 效能優化核心：由於移除了 TTS 狀態，現在只需要最基本的比對
const areEqual = (prevProps, nextProps) => {
  return prevProps.text === nextProps.text && 
         prevProps.isActive === nextProps.isActive &&
         prevProps.className === nextProps.className;
};

export default memo(ZhuyinRenderer, areEqual);