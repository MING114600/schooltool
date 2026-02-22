// src/pages/ExamReader/utils/examParser.js

const FILTER_KEYWORDS = ['國小', '練習卷', '姓名', '座號', '班級', '得分', '閱卷', '定期考試','學年度', '期末考', '期中考', '試卷', '測驗卷', '試題'];

export const shouldFilterText = (text) => {
  if (text.length < 40 && FILTER_KEYWORDS.some(key => text.includes(key))) return true;
  if (/^_+$/.test(text)) return true; 
  return false;
};

const classifyText = (text) => {
  const sectionRegex = /^([一二三四五六七八九十壹貳參肆伍陸柒捌玖拾]+[、. ]|第.*[單單]元|第.*部分)/;
  const questionRegex = /^(?:[(（\[【]\s*[)）\]】]\s*)?([0-9０-９]+)[、. )）(（]/;
  const optionRegex = /^([(（]?[A-Ea-e1-4甲乙丙丁][)）.]|[①②③④⑤⑥⑦⑧⑨⑩])/; 
  const blankRegex = /^(答[：:]|\(\s*\)|（\s*）|___)/;

  if (sectionRegex.test(text)) return 'section';
  if (questionRegex.test(text)) return 'question';
  if (optionRegex.test(text)) return 'option';
  if (blankRegex.test(text)) return 'blank';
  return 'text'; 
};

const splitInlineOptions = (rawText) => {
  return rawText.replace(/([^\n])\s*([(（][A-Ea-e1-4甲乙丙丁][)）]|[①②③④⑤⑥⑦⑧⑨⑩])/g, '$1\n$2');
};

const SUPERSCRIPT_MAP = { '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ' };
const SUBSCRIPT_MAP = { '0':'₀', '1':'₁', '2':'₂', '3':'₃', '4':'₄', '5':'₅', '6':'₆', '7':'₇', '8':'₈', '9':'₉', '+': '₊', '-': '₋', 'x': 'ₓ', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ' };

const toSuperscript = (text) => text.split('').map(c => SUPERSCRIPT_MAP[c] || c).join('');
const toSubscript = (text) => text.split('').map(c => SUBSCRIPT_MAP[c] || c).join('');

// 🌟 新增：智慧切句器 (將一段文字依據全形標點切分成多個句子 Chunk)
export const splitTextIntoSentenceChunks = (text, baseId, type) => {
  // 為了保持排版與語意完整，選項 (A) 或填空題不進行細部切割，當作一整塊
  if (type === 'option' || type === 'blank') {
    return [{ 
      id: baseId, 
      type, 
      text: type === 'option' ? `    ${text}` : text, 
      spokenText: text 
    }];
  }

  const chunks = [];
  // 💡 關鍵：只使用「全形標點」切割，不使用半形逗號或小數點，避免切斷「1.」或「3.14」或「1,000」
  const parts = text.split(/([，。？！；：]+)/g);
  let tempText = '';
  let chunkIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    tempText += part;
    // 如果這個片段是標點符號，或者是字串的最後結尾，就打包成一個 Chunk
    if (/^[，。？！；：]+$/.test(part) || i === parts.length - 1) {
      if (tempText.trim()) {
         chunks.push({
           id: `${baseId}_sub_${chunkIdx++}`,
           type,
           text: tempText,
           spokenText: tempText
         });
         tempText = '';
      }
    }
  }
  
  // 收尾：如果最後有殘留的空白，補到最後一個 chunk 裡
  if (tempText && chunks.length > 0) {
    chunks[chunks.length - 1].text += tempText;
    chunks[chunks.length - 1].spokenText += tempText;
  } else if (tempText) {
    chunks.push({ id: `${baseId}_sub_${chunkIdx}`, type, text: tempText, spokenText: tempText });
  }

  return chunks.length > 0 ? chunks : [{ id: baseId, type, text, spokenText: text }];
};

// 🌟 新增：將智慧後處理抽離為獨立、可匯出的共用函式
export const applySmartTTSPostProcessing = (groupItem) => {
  if (!groupItem.chunks || groupItem.chunks.length === 0) return groupItem;

  const firstChunk = groupItem.chunks[0];
  let spoken = firstChunk.spokenText;

  // 1. 處理大題標題
  if (groupItem.type === 'section') {
    // 加上 ^\s* 容許前方有空白
    const secMatch = spoken.match(/^\s*([一二三四五六七八九十壹貳參肆伍陸柒捌玖拾]+)[、.\s]*(.*)/);
    if (secMatch) {
      firstChunk.spokenText = `第${secMatch[1]}大題，${secMatch[2]}`;
    }
  } 
  // 2. 處理題目編號與作答括號
  else if (groupItem.type === 'question') {
    const hasOptions = groupItem.chunks.some(c => c.type === 'option');

    // 模式 A：括號在最前面 （ ） 1. 題目
    const matchPrefix = spoken.match(/^\s*[(（\[【]\s*[\s_＿]*\s*[)）\]】]\s*([0-9０-９]+)[、.\s]*(.*)/);
    if (matchPrefix) {
      firstChunk.spokenText = `第${matchPrefix[1]}題，${matchPrefix[2]}`;
    } else {
      // 模式 B：數字在前面 1. ( ) 題目
      const matchNum = spoken.match(/^\s*([0-9０-９]+)[、.\s]*(.*)/);
      if (matchNum) {
        let num = matchNum[1];
        let rest = matchNum[2];
        
        // 只有在「有選項」的情況下，才把題號後面的作答括號拔除
        if (hasOptions) {
          rest = rest.replace(/^\s*[(（\[【]\s*[\s_＿]*\s*[)）\]】]\s*/, '');
        }
        firstChunk.spokenText = `第${num}題，${rest}`;
      }
    }
  }

  return groupItem;
};


// 🌟 核心重構：將散落的文字打包，並新增 chunks 陣列提供給 TTS 佇列使用
const groupExamItems = (flatItems) => {
  const grouped = [];
  let currentGroup = null;
  let pendingMedia = []; 

  flatItems.forEach((item, index) => {
    if (item.type === 'section' || item.type === 'question') {
      currentGroup = {
        id: item.id,
        type: item.type,
        title: item.text ? item.text.substring(0, 20) : '[區塊]',
        text: item.text || '',
        spokenText: item.text || '',
        elements: [],
        chunks: [] 
      };
      
      // 🌟 套用切句器：將題幹切成多個小 Chunk
      const titleChunks = splitTextIntoSentenceChunks(item.text || '', `${item.id}_title`, item.type);
      currentGroup.chunks.push(...titleChunks);

      if (pendingMedia.length > 0) {
        pendingMedia.forEach(media => currentGroup.elements.push(media));
        pendingMedia = []; 
      }
      grouped.push(currentGroup);
      
    } else {
      if (!currentGroup) {
        currentGroup = { id: item.id, type: 'text', title: '[段落]', text: '', spokenText: '', elements: [], chunks: [] };
        grouped.push(currentGroup);
      }

      if (item.type === 'image' || item.type === 'table') {
        let belongsToNext = false;
        for (let i = index + 1; i < flatItems.length; i++) {
          const nextItem = flatItems[i];
          if (nextItem.type === 'question' || nextItem.type === 'section') {
            belongsToNext = true; 
            break;
          }
          if (nextItem.type === 'text' || nextItem.type === 'option' || nextItem.type === 'blank') {
            break; 
          }
        }

        if (belongsToNext) {
          pendingMedia.push(item); 
        } else {
          currentGroup.elements.push(item);
        }
      } else {
        const addText = (item.type === 'option') ? (currentGroup.text ? '\n    ' : '    ') + item.text : (currentGroup.text ? '\n' : '') + item.text;
        currentGroup.text += addText;
        currentGroup.spokenText += addText; 

        // 🌟 套用切句器：處理內文與選項
        const bodyChunks = splitTextIntoSentenceChunks(item.text, item.id, item.type);
        if (bodyChunks.length > 0 && currentGroup.chunks.length > 0) {
            // 💡 標記此 Chunk 渲染時前方需要加一個換行符號 (用來分隔題目與選項)
            bodyChunks[0].prependNewline = true;
        }
        currentGroup.chunks.push(...bodyChunks);
      }
    }
  });

  // 🌟 處理表格與 Media ID
  grouped.forEach(group => {
    group.elements.forEach((el, elIndex) => {
      // 確保每個 element 都有 id，方便後續 UI 對齊
      if (!el.id) el.id = `${group.id}_el_${elIndex}`;

      if (el.type === 'table') {
        let tableSpokenText = '\n表格內容：\n'; 
        el.rows.forEach(row => {
          row.forEach(cellTextArray => {
            cellTextArray.forEach(content => {
              if (content.type === 'text') {
                // 移除舊的 globalOffset 紀錄，新架構不再需要
                tableSpokenText += content.text + '，'; 
              }
            });
          });
          tableSpokenText += '\n'; 
        });
        tableSpokenText += '表格結束。\n'; 

        group.spokenText += tableSpokenText; // 舊相容

        // 🌟 新增：把表格獨立作為一個語音 Chunk，text 留空不渲染純文字
        group.chunks.push({
            id: `chunk_table_${el.id}`,
            type: 'table_audio',
            text: '', 
            spokenText: tableSpokenText,
            targetElementId: el.id // 紀錄對應的 DOM ID，可於朗讀時讓表格閃爍或高亮
        });
      }
    });
  });

  if (pendingMedia.length > 0 && currentGroup) {
    pendingMedia.forEach((media, idx) => {
      if (!media.id) media.id = `${currentGroup.id}_pending_el_${idx}`;
      currentGroup.elements.push(media);
    });
  }

  // 🌟 套用智慧後處理 (包含大題與題號的轉換)
  grouped.forEach(group => {
    applySmartTTSPostProcessing(group);
  });

  return grouped;
};

export const parseExamText = (rawText) => {
  const lines = [];
  rawText.split('\n').forEach(line => {
    const expanded = splitInlineOptions(line);
    expanded.split('\n').forEach(subLine => {
      const trimmed = subLine.trim();
      if (trimmed && !shouldFilterText(trimmed)) {
        lines.push(trimmed);
      }
    });
  });

  let currentId = 1;
  const flatItems = lines.map(line => ({ id: `item_${currentId++}`, type: classifyText(line), text: line }));
  return groupExamItems(flatItems);
};

export const parseExamHtml = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const results = [];
  let currentText = '';

  const flushText = () => {
    if (currentText.trim()) {
      const expanded = splitInlineOptions(currentText);
      expanded.split('\n').forEach(subLine => {
        const trimmed = subLine.trim();
        if (trimmed && !shouldFilterText(trimmed)) {
          results.push({ type: 'text_node', text: trimmed });
        }
      });
    }
    currentText = '';
  };

  const traverse = (n) => {
    if (n.nodeName === 'BR') {
      currentText += '\n';
    } else if (n.nodeName === 'IMG') {
      flushText();
      results.push({ type: 'image', src: n.src });
    } else if (n.nodeName === 'TABLE') {
      flushText();
      const rows = [];
      n.querySelectorAll('tr').forEach(tr => {
        const rowData = [];
        tr.querySelectorAll('td, th').forEach(cell => {
          const cellContent = []; 
          
          const extract = (node) => {
            if (node.nodeName === 'BR') cellContent.push({ type: 'text', text: '\n' });
            else if (node.nodeName === 'IMG') cellContent.push({ type: 'image', src: node.src });
            else if (node.nodeName === 'SUP') cellContent.push({ type: 'text', text: toSuperscript(node.textContent) });
            else if (node.nodeName === 'SUB') cellContent.push({ type: 'text', text: toSubscript(node.textContent) });
            else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              cellContent.push({ type: 'text', text: node.textContent });
            }
            else node.childNodes.forEach(extract);
          };
          cell.childNodes.forEach(extract);
          
          if (cellContent.length > 0) rowData.push(cellContent);
        });
        if (rowData.length > 0) rows.push(rowData);
      });
      if (rows.length > 0) results.push({ type: 'table', rows });
    } else if (n.nodeName === 'SUP') {
      currentText += toSuperscript(n.textContent);
    } else if (n.nodeName === 'SUB') {
      currentText += toSubscript(n.textContent);
    } else if (n.nodeType === Node.TEXT_NODE) {
      currentText += n.textContent;
    } else if (n.nodeName === 'LI') {
      flushText();
      results.push({ type: 'li_start' });
      n.childNodes.forEach(traverse);
      flushText();
    } else if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(n.nodeName)) {
      flushText();
      n.childNodes.forEach(traverse);
      flushText();
    } else {
      n.childNodes.forEach(traverse);
    }
  };

  traverse(doc.body);
  flushText();

  const flatItems = [];
  let currentId = 1;
  let globalQuestionCounter = 1; 
  let nextIsLi = false;

  results.forEach(item => {
    if (item.type === 'image') {
      flatItems.push({ id: `item_${currentId++}`, type: 'image', src: item.src });
      nextIsLi = false;
    } else if (item.type === 'table') {
      flatItems.push({ id: `item_${currentId++}`, type: 'table', rows: item.rows });
      nextIsLi = false;
    } else if (item.type === 'li_start') {
      nextIsLi = true; 
    } else if (item.type === 'text_node') {
      let text = item.text;
      const classifiedType = classifyText(text);

      if (classifiedType === 'section') {
        globalQuestionCounter = 1;
      }

      if (nextIsLi) {
        if (classifiedType === 'text' || classifiedType === 'blank') {
          text = `${globalQuestionCounter}. ${text}`;
          globalQuestionCounter++;
        }
        nextIsLi = false;
      }

      flatItems.push({ id: `item_${currentId++}`, type: classifyText(text), text: text });
    }
  });

  return groupExamItems(flatItems);
};