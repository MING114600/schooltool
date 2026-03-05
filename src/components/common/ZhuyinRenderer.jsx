import React, { memo } from 'react';
import { useOS } from '../../context/OSContext'; // 改從 Context 引入

const ZhuyinRenderer = ({
  text,
  isActive,
  writingMode = 'horizontal-tb',
  className = ""
}) => {
  // 1. 從 OS 取得最新的注音校正引擎 (已包含使用者自訂字典)
  const { fixZhuyinText } = useOS();

  if (!text) return null;

  // 處理 CSS Class
  const baseClass = isActive ? `font-with-zhuyin ${className}` : className;

  // 核心邏輯：若啟用注音模式，使用 Context 提供的函式進行替換
  const processedText = isActive ? fixZhuyinText(text) : text;

  // 是否需要做直排英數字處理
  const isVertical = writingMode === 'vertical-rl';

  // ===== 英數字橫排組合渲染邏輯 =====
  // 在直排模式 (text-orientation: mixed) 下：
  //   - CJK 文字 & 全形標點 → 自然直立 ✓
  //   - 英數字 → 預設會側躺
  // 
  // 解法：把連續的英數字區段（如 "P.12"）包在一個
  // writing-mode: horizontal-tb 的 inline-block 中，
  // 讓它們以「橫排小群組」的方式嵌入直排文字流中。
  // 這是傳統 CJK 排版中的「縦中横」做法。
  //
  // 注意：~ 符號不納入英數字群組，讓它作為自然分隔符，
  // 這樣 "P.12~P.15" 會被拆為 [P.12] [~] [P.15] 三段。
  const LATIN_REGEX = /([A-Za-z0-9!@#$%^&*_+=;':"|\-.,<>\/? ]+)/g;

  const renderSplitText = (displayText, fontClass) => {
    const parts = displayText.split(LATIN_REGEX);

    return (
      <span className={className.trim()}>
        {parts.map((part, index) => {
          if (!part) return null;
          // 重設 regex lastIndex（因為 /g flag）
          LATIN_REGEX.lastIndex = 0;
          if (LATIN_REGEX.test(part)) {
            // 英數字區段 → 以橫排 inline-block 群組呈現
            return (
              <span
                key={index}
                style={{
                  writingMode: 'horizontal-tb',
                  display: 'inline-block',
                  textOrientation: 'mixed',
                }}
              >
                {part.trim()}
              </span>
            );
          }
          // 中文/括號/~ 區段 → 套用注音字體 (如啟用) 或保持原樣
          return <span key={index} className={fontClass}>{part}</span>;
        })}
      </span>
    );
  };

  // ===== 渲染邏輯 =====
  const renderTextContent = () => {
    // 情境 1：橫排模式 → 不需要任何特殊處理
    if (!isVertical) {
      return <span className={baseClass.trim()}>{processedText}</span>;
    }

    // 情境 2：直排 + 注音模式 → 英數字橫排群組，中文用注音字體
    if (isActive) {
      return renderSplitText(processedText, 'font-with-zhuyin');
    }

    // 情境 3：直排 + 非注音模式 → 英數字橫排群組，中文/括號保持 mixed 自然渲染
    return renderSplitText(processedText, '');
  };

  return renderTextContent();
};

// 效能優化核心：
// 雖然我們使用了 useContext，但這個 areEqual 仍然有幫助。
// 它會阻擋來自「父元件重繪」但「props 沒變」的無效渲染。
// 當 OSContext 內的 userDict 更新時，React 會自動無視 memo 強制更新此元件，
// 所以不用擔心自訂讀音不會即時生效。
const areEqual = (prevProps, nextProps) => {
  return prevProps.text === nextProps.text &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.writingMode === nextProps.writingMode &&
    prevProps.className === nextProps.className;
};

export default memo(ZhuyinRenderer, areEqual);