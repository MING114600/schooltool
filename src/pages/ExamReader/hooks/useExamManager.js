// src/hooks/useExamManager.js
import { useState, useEffect } from 'react';
import { saveExam, getAllExamMetas, getExamById, deleteExam } from '../../../services/examDatabase';
// 🌟 1. 新增引入 applySmartTTSPostProcessing
import { splitTextIntoSentenceChunks, applySmartTTSPostProcessing } from '../utils/examParser';

const INITIAL_DATA = [
  { id: 'welcome', type: 'section', text: '歡迎使用考卷報讀助理' },
  { id: 'step1', type: 'question', text: '請點擊右上角匯入 Word 或文字檔。' },
];

export const useExamManager = ({ onStopAudio }) => {
  const [examList, setExamList] = useState([]);
  const [activeExamId, setActiveExamId] = useState('');
  const [examItems, setExamItems] = useState(INITIAL_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeletingExam, setIsDeletingExam] = useState(false);
  const [deleteExamError, setDeleteExamError] = useState('');

  useEffect(() => {
    loadExamList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExamList = async () => {
    try {
      const metas = await getAllExamMetas();
      setExamList(metas);
      if (metas.length > 0 && !activeExamId) {
        handleSelectExam(metas[0].id);
      } else if (metas.length === 0) {
        setExamItems(INITIAL_DATA);
      }
    } catch (err) {
      console.error("讀取考卷清單失敗", err);
    }
  };

  const handleSelectExam = async (id) => {
    if (!id) return;
    try {
      if (onStopAudio) onStopAudio();
      const fullExam = await getExamById(id);
      if (fullExam) {
        setActiveExamId(id);
        setExamItems(fullExam.items);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("切換考卷失敗", err);
    }
  };

  const handleDeleteClick = () => {
    if (!activeExamId) return;
    setIsClearModalOpen(true);
  };

  const executeDeleteExam = async () => {
    const examIdToDelete = activeExamId;
    if (!examIdToDelete) {
      setDeleteExamError('目前沒有可刪除的考卷。');
      return;
    }
    if (isDeletingExam) return;

    setIsDeletingExam(true);
    setDeleteExamError('');

    try {
      if (onStopAudio) onStopAudio();
      await deleteExam(examIdToDelete);

      const metas = await getAllExamMetas();
      setExamList(metas);

      if (metas.length > 0) {
        handleSelectExam(metas[0].id);
      } else {
        setActiveExamId('');
        setExamItems(INITIAL_DATA);
      }
      setIsClearModalOpen(false);
    } catch (err) {
      console.error('刪除失敗', err);
      setDeleteExamError('刪除失敗，請稍後再試。');
    } finally {
      setIsDeletingExam(false);
    }
  };

  // 🌟 修改重點：加入 subject 參數，預設值為 'general'
  const handleImportSuccess = async (parsedItems, examTitle, subject = 'general') => {
    const newExam = {
      id: `exam_${Date.now()}`,
      title: examTitle || `匯入考卷_${new Date().toLocaleString()}`,
      subject: subject, // 🌟 將科目標籤寫入考卷 Metadata
      items: parsedItems
    };

    try {
      await saveExam(newExam);
      await loadExamList();
      await handleSelectExam(newExam.id);
    } catch (err) {
      alert("儲存考卷失敗，可能是容量不足！");
      console.error(err);
    }
  };

  // 🌟 新增：更新指定考卷的科目標籤
  const handleUpdateExamSubject = async (examId, newSubject) => {
    // 1. 更新記憶體中的考卷清單狀態
    setExamList(prevList => prevList.map(exam =>
      exam.id === examId ? { ...exam, subject: newSubject } : exam
    ));

    // 2. 同步更新 IndexedDB 資料庫
    try {
      const fullExam = await getExamById(examId);
      if (fullExam) {
        fullExam.subject = newSubject;
        await saveExam(fullExam);
      }
    } catch (err) {
      console.error("更新考卷科目失敗", err);
    }
  };

  const handleMoveMedia = async (currentGroupId, mediaElementId, direction) => {
    setExamItems(prevItems => {
      const newData = [...prevItems];
      const currentGroupIndex = newData.findIndex(g => g.id === currentGroupId);
      if (currentGroupIndex === -1) return prevItems;

      const targetGroupIndex = direction === 'up' ? currentGroupIndex - 1 : currentGroupIndex + 1;
      if (targetGroupIndex < 0 || targetGroupIndex >= newData.length) return prevItems;

      const currentGroup = { ...newData[currentGroupIndex], elements: [...newData[currentGroupIndex].elements] };
      const targetGroup = { ...newData[targetGroupIndex], elements: [...newData[targetGroupIndex].elements] };

      const mediaIndex = currentGroup.elements.findIndex(el => el.id === mediaElementId);
      if (mediaIndex === -1) return prevItems;

      const mediaElement = currentGroup.elements[mediaIndex];

      currentGroup.elements.splice(mediaIndex, 1);
      if (mediaElement.label) {
        currentGroup.text = currentGroup.text.replace(mediaElement.label, '').trim();
      }

      targetGroup.elements.push(mediaElement);
      if (mediaElement.label) {
        targetGroup.text = targetGroup.text + (targetGroup.text ? '\n' : '') + mediaElement.label;
      }

      newData[currentGroupIndex] = currentGroup;
      newData[targetGroupIndex] = targetGroup;

      if (activeExamId) {
        getExamById(activeExamId).then(fullExam => {
          if (fullExam) {
            fullExam.items = newData;
            saveExam(fullExam).catch(err => console.error("更新考卷排序失敗", err));
          }
        });
      }

      return newData;
    });
  };

  // 🌟 新增：快速更新單一題目的純文字與語音文字，改寫更新題目邏輯，讓它不僅更新 text，也同步重組 chunks
  const handleUpdateItemText = async (itemId, newText) => {
    setExamItems(prevItems => {
      const newData = prevItems.map(item => {
        if (item.id === itemId) {
          let updatedSpokenText = newText;
          const newChunks = [];

          // --- 核心修正：將使用者編輯的新文字，重新拆解成 Chunks ---
          // 由於編輯視窗的文字可能包含換行 (題目與選項)，我們先按換行拆開
          const lines = newText.split('\n');
          lines.forEach((line, index) => {
            if (!line.trim()) return;

            // 簡單判定這行是不是選項，如果是選項就給 option type，否則依據是不是第一行給 text 或原本的 type
            const isOption = /^(\s*[(（]?[A-Ea-e1-4甲乙丙丁][)）.]|\s*[①②③④⑤⑥⑦⑧⑨⑩])/.test(line);
            const lineType = isOption ? 'option' : (index === 0 ? item.type : 'text');

            // 呼叫切句器，為了確保 React key 不重複，加上時間戳記
            const lineChunks = splitTextIntoSentenceChunks(line, `${item.id}_edit_${Date.now()}_${index}`, lineType);

            // 確保排版正確：如果不是第一段文字，且有內容，就標記前方需要換行
            if (index > 0 && lineChunks.length > 0) {
              lineChunks[0].prependNewline = true;
            }

            newChunks.push(...lineChunks);
          });

          // --- 處理表格語音與隱藏 Chunk 恢復 ---
          if (item.elements && item.elements.length > 0) {
            item.elements.forEach(el => {
              if (el.type === 'table') {
                let tableSpokenText = '\n表格內容：\n';
                el.rows.forEach(row => {
                  row.forEach(cellTextArray => {
                    cellTextArray.forEach(content => {
                      if (content.type === 'text') {
                        tableSpokenText += content.text + '，';
                      }
                    });
                  });
                  tableSpokenText += '\n';
                });
                tableSpokenText += '表格結束。\n';

                // 舊版字串相容
                updatedSpokenText += tableSpokenText;

                // 新版架構：將表格語音推入 Chunks 中
                newChunks.push({
                  id: `chunk_table_${el.id}`,
                  type: 'table_audio',
                  text: '',
                  spokenText: tableSpokenText,
                  targetElementId: el.id
                });
              }
            });
          }

          // 🌟 2. 核心修正：將更新後的物件，通過智慧後處理大腦，重新判定題號與括號
          const updatedItem = { ...item, text: newText, spokenText: updatedSpokenText, chunks: newChunks };
          applySmartTTSPostProcessing(updatedItem);

          return updatedItem;
        }
        return item;
      });

      // 背景同步存入 IndexedDB
      if (activeExamId) {
        getExamById(activeExamId).then(fullExam => {
          if (fullExam) {
            fullExam.items = newData;
            saveExam(fullExam).catch(err => console.error("更新題目失敗", err));
          }
        });
      }
      return newData;
    });
  };

  return {
    examList,
    activeExamId,
    examItems,
    currentIndex,
    setCurrentIndex,
    isClearModalOpen,
    setIsClearModalOpen,
    isDeletingExam,
    deleteExamError,
    setDeleteExamError,
    loadExamList,
    handleSelectExam,
    handleDeleteClick,
    executeDeleteExam,
    handleImportSuccess,
    handleMoveMedia,
    handleUpdateItemText,
    handleUpdateExamSubject
  };
};