// src/hooks/useExamManager.js
import { useState, useEffect } from 'react';
import { saveExam, getAllExamMetas, getExamById, deleteExam } from '../utils/examDatabase';

const INITIAL_DATA = [
  { id: 'welcome', type: 'section', text: '歡迎使用考卷報讀助理' },
  { id: 'step1', type: 'question', text: '請點擊右上角匯入 Word 或文字檔。' },
];

export const useExamManager = ({ onStopAudio }) => {
  const [examList, setExamList] = useState([]);      
  const [activeExamId, setActiveExamId] = useState(''); 
  const [examItems, setExamItems] = useState(INITIAL_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 刪除相關狀態
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
      if (onStopAudio) onStopAudio(); // 切換考卷時停止播放
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

  const handleImportSuccess = async (parsedItems, examTitle) => {
    const newExam = {
      id: `exam_${Date.now()}`,
      title: examTitle || `匯入考卷_${new Date().toLocaleString()}`,
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
  
  // 🌟 新增：快速更新單一題目的純文字
  const handleUpdateItemText = async (itemId, newText) => {
    setExamItems(prevItems => {
      const newData = prevItems.map(item => 
        item.id === itemId ? { ...item, text: newText } : item
      );

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
	handleUpdateItemText
  };
};