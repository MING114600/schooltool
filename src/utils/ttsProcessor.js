// src/utils/ttsProcessor.js

export const generateSpokenTextData = (text, startIndex = 0) => {
  if (!text) return { fullSpokenText: '', slicedSpokenText: '', indexMap: [], spokenStartIndex: 0, safeStartIndex: 0 };

  const DEFAULT_DICT = {
    '○': '圈', '△': '角', '×': '成以', '÷': '廚以', 
    '＋': '加', '+': '加', '－': '減', '-': '減',
    '＝': '等於', '=': '等於', '□': '框框',  
    '①': '一', '②': '二', '③': '三', '④': '四', '⑤': '五',
    '⑥': '六', '⑦': '七', '⑧': '八', '⑨': '九', '⑩': '十'
  };

  let userDict = {};
  try {
    userDict = JSON.parse(localStorage.getItem('tts_custom_dict')) || {};
  } catch (e) {
    console.error("讀取自訂字典失敗", e);
  }
  
  const FINAL_DICT = { ...DEFAULT_DICT, ...userDict };
  const sortedDictKeys = Object.keys(FINAL_DICT).sort((a, b) => b.length - a.length);

  const blankPattern = /[(（][\s_]*[)）]/g;
  const blankRanges = [];
  let match;
  while ((match = blankPattern.exec(text)) !== null) {
    blankRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  let fullSpokenText = ''; 
  const indexMap = []; 
  let i = 0;

  const secMatch = text.match(/^([一二三四五六七八九十壹貳參肆伍陸柒捌玖拾]+)[、.\s]+/);
  const qMatch = text.match(/^(?:[(（\[【]\s*[)）\]】]\s*)?([0-9０-９]+)[、. ]*(?:[(（][\s_]*[)）])?\s*/);

  if (secMatch) {
    const replaceStr = `第${secMatch[1]}大題，`; 
    fullSpokenText += replaceStr;
    for (let j = 0; j < replaceStr.length; j++) indexMap.push(0);
    i = secMatch[0].length; 
  } else if (qMatch) {
    const replaceStr = `第${qMatch[1]}題，`; 
    fullSpokenText += replaceStr;
    for (let j = 0; j < replaceStr.length; j++) indexMap.push(0);
    i = qMatch[0].length; 
  }

  while (i < text.length) {
    const currentBlank = blankRanges.find(r => r.start === i);
    if (currentBlank) {
      const replaceStr = '括弧';
      fullSpokenText += replaceStr;
      for (let j = 0; j < replaceStr.length; j++) indexMap.push(i);
      i = currentBlank.end;
      continue;
    }

    let matchedOptionStr = null;
    let optionSpokenText = null;

    const stdMatch = text.slice(i).match(/^([(（]?)([A-FＡ-Ｆa-fａ-ｆ]|[0-9０-９]{1,2})([.、)）])(?!\d)/);
    const circleMatch = text.slice(i).match(/^([①-⑳])([.、)）]?)/);

    if (stdMatch) {
      matchedOptionStr = stdMatch[0];
      optionSpokenText = stdMatch[2]; 
    } else if (circleMatch) {
      matchedOptionStr = circleMatch[0];
      optionSpokenText = circleMatch[1]; 
      
      if (FINAL_DICT[optionSpokenText]) {
        optionSpokenText = FINAL_DICT[optionSpokenText];
      }
    }

    if (matchedOptionStr) {
      const replaceStr = `${optionSpokenText}，`;
      fullSpokenText += replaceStr;
      for (let j = 0; j < replaceStr.length; j++) {
        indexMap.push(i);
      }
      i += matchedOptionStr.length; 
      continue;
    }

    let matchedKey = null;
    for (const key of sortedDictKeys) {
      if (text.startsWith(key, i)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      const replaceStr = FINAL_DICT[matchedKey];
      fullSpokenText += replaceStr;
      for (let j = 0; j < replaceStr.length; j++) indexMap.push(i);
      i += matchedKey.length;
    } else {
      fullSpokenText += text[i];
      indexMap.push(i);
      i++;
    }
  }

  const safeStartIndex = Math.max(0, Math.min(text.length - 1, startIndex));
  let spokenStartIndex = indexMap.indexOf(safeStartIndex);
  if (spokenStartIndex === -1) spokenStartIndex = 0; 

  const slicedSpokenText = fullSpokenText.substring(spokenStartIndex);

  return {
    fullSpokenText,
    slicedSpokenText,
    indexMap,
    spokenStartIndex,
    safeStartIndex
  };
};