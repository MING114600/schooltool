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

// 🌟 核心功能二：將散落的文字打包成「獨立題目區塊 (Group)」
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
        spokenText: item.text || '', // ✅ 新增：專門用來餵給語音引擎的字串
        elements: []
      };

      if (pendingMedia.length > 0) {
        pendingMedia.forEach(media => currentGroup.elements.push(media));
        pendingMedia = []; 
      }
      grouped.push(currentGroup);
      
    } else {
      if (!currentGroup) {
        currentGroup = { id: item.id, type: 'text', title: '[段落]', text: '', spokenText: '', elements: [] };
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
        currentGroup.elements.push(item);
        const addText = (item.type === 'option') ? (currentGroup.text ? '\n    ' : '    ') + item.text : (currentGroup.text ? '\n' : '') + item.text;
        currentGroup.text += addText;
        currentGroup.spokenText += addText; // ✅ 同步加入朗讀字串
      }
    }
  });

  // ✅ 後處理：將所有表格內容依序轉化為朗讀字串，並標記儲存格的絕對位置
  grouped.forEach(group => {
    group.elements.forEach(el => {
      if (el.type === 'table') {
        group.spokenText += '\n表格內容：\n'; // 提示語音
        el.rows.forEach(row => {
          row.forEach(cellTextArray => {
            cellTextArray.forEach(content => {
              if (content.type === 'text') {
                // 標記這段文字在語音字串中的起點！
                content.globalOffset = group.spokenText.length;
                group.spokenText += content.text;
                group.spokenText += '，'; // 加入全形逗號強制停頓，避免連音
              }
            });
          });
          group.spokenText += '\n'; 
        });
        group.spokenText += '表格結束。\n'; // 提示語音
      }
    });
  });

  if (pendingMedia.length > 0 && currentGroup) {
    pendingMedia.forEach(media => currentGroup.elements.push(media));
  }

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
          const cellContent = []; // ✅ 改為陣列，用來同時儲存文字與圖片
          
          const extract = (node) => {
            if (node.nodeName === 'BR') cellContent.push({ type: 'text', text: '\n' });
            else if (node.nodeName === 'IMG') cellContent.push({ type: 'image', src: node.src });
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
      // 解析完表格後，不需要再 traverse 表格內的子節點
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
      // ✅ 新增：將表格加入扁平化陣列
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