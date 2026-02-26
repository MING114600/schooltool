import React, { memo } from 'react';
import { useOS } from '../../context/OSContext'; // 改從 Context 引入

const ZhuyinRenderer = ({ 
  text, 
  isActive, 
  className = ""
}) => {
  // 1. 從 OS 取得最新的注音校正引擎 (已包含使用者自訂字典)
  const { fixZhuyinText } = useOS();

  if (!text) return null;

  // 處理 CSS Class
  const baseClass = isActive ? `font-with-zhuyin ${className}` : className;

  // 核心邏輯：若啟用注音模式，使用 Context 提供的函式進行替換
  // fixZhuyinText 會自動處理「使用者自訂優先」與「最長詞彙匹配」
  const displayText = isActive ? fixZhuyinText(text) : text;

  return (
    <span className={baseClass.trim()}>
      {displayText}
    </span>
  );
};

// 效能優化核心：
// 雖然我們使用了 useContext，但這個 areEqual 仍然有幫助。
// 它會阻擋來自「父元件重繪」但「props 沒變」的無效渲染。
// 當 OSContext 內的 userDict 更新時，React 會自動無視 memo 強制更新此元件，
// 所以不用擔心自訂讀音不會即時生效。
const areEqual = (prevProps, nextProps) => {
  return prevProps.text === nextProps.text && 
         prevProps.isActive === nextProps.isActive &&
         prevProps.className === nextProps.className;
};

export default memo(ZhuyinRenderer, areEqual);