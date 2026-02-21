import React, { useState, useEffect, useMemo } from 'react';
import { UI_THEME } from '../../utils/constants';
import { useTTS } from '../../hooks/useTTS';
import { useHotkeys } from '../../hooks/useHotkeys';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useExamCloud } from '../../hooks/useExamCloud';
import { useExamManager } from '../../hooks/useExamManager';

// 引入元件
import DialogModal from '../../components/common/DialogModal';
import TTSDictModal from './components/TTSDictModal';
import ExamHeader from './components/ExamHeader';
import ExamSidebar from './components/ExamSidebar';
import ExamReaderView from './components/ExamReaderView';
import ExamControls from './components/ExamControls';
import ImportModal from './components/ImportModal';
import ExamShareModal from './components/ExamShareModal';
import ExamPackageModal from './components/ExamPackageModal';
import EditItemModal from './components/EditItemModal';

const ExamReader = ({ user, login, shareId, setShareId }) => {
  const { speak, cancel, pauseTTS, resumeTTS, ttsState, voices, highlightRange } = useTTS();
  const {
    examList, activeExamId, examItems, currentIndex, setCurrentIndex, isClearModalOpen,    setIsClearModalOpen, isDeletingExam, deleteExamError, setDeleteExamError, loadExamList,    handleSelectExam, handleDeleteClick, executeDeleteExam, handleImportSuccess, handleMoveMedia, handleUpdateItemText} = useExamManager({ onStopAudio: cancel });
  
  // ✅ 2. 修正字體大小的預設值 (配合 ExamHeader 的運算邏輯)
  const [speechRate, setSpeechRate] = useState(0.85);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKaraokeMode, setIsKaraokeMode] = useState(true);

  // Modal 狀態
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDictModalOpen, setIsDictModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false); // 🌟 控制考卷包選擇視窗
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // 🌟 進入專注模式 (全螢幕 + 關閉側邊欄)
  const handleEnterFocusMode = async () => {
    setIsFocusMode(true);
    //setIsSidebarOpen(false); // 自動收合側邊欄，讓版面最大化
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("全螢幕請求被阻擋", e);
    }
  };

  // 🌟 退出專注模式
  const handleExitFocusMode = async () => {
    setIsFocusMode(false);
    setIsSidebarOpen(true); // 恢復側邊欄
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.log("退出全螢幕失敗", e);
    }
  };

  // 🌟 監聽使用者按 ESC 鍵退出全螢幕的動作，同步更新我們的 UI 狀態
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFocusMode]);
  
  // 派送功能相關狀態  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' 或 'confirm'
    confirmText: '確定',
    onConfirm: null
  });
  
  const { 
    isSharing, 
    isDownloading, 
    shareModalData, 
    setShareModalData, 
    handlePackageShare 
  } = useExamCloud({
    user,
    login,
    shareId,
    setShareId,
    setAlertDialog,
    onDownloadSuccess: async (firstExamId) => {
      await loadExamList();
      if (firstExamId) await handleSelectExam(firstExamId);
    },
	onStartFocusMode: handleEnterFocusMode
  });
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000); // 3秒後自動消失
  };
  
  // 快捷鍵設定
  const hotkeyMap = useMemo(() => {
    if (isImportModalOpen || isClearModalOpen || isDictModalOpen) return {};
    return {
      ' ': () => ttsState === 'playing' ? handlePause() : handlePlay(),
      'arrowright': () => handleNext(),
      'arrowleft': () => handlePrev()
    };
  }, [ttsState, isImportModalOpen, isClearModalOpen, isDictModalOpen, currentIndex, examItems.length]);
  
  useHotkeys(hotkeyMap);

  // 播放控制邏輯
  const handlePlay = () => {
    if (!activeExamId || examItems.length === 0) return;
    if (ttsState === 'paused') {
      resumeTTS();
    } else {
      // ✅ 優先讀取包含表格的 fullSpokenText，若無則向下相容讀取舊版的 text
      const textToSpeak = examItems[currentIndex].spokenText || examItems[currentIndex].text;
      speak(textToSpeak, 'zh-TW', speechRate);
    }
  };

  const handlePause = () => pauseTTS();
  const handleStop = () => cancel();

  const handleNext = () => {
    if (currentIndex < examItems.length - 1) {
      handleStop();
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      handleStop();
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    handleStop();
  }, [currentIndex]);

  const handleWordClick = (clickedIndex) => {	  
    if (!activeExamId || examItems.length === 0) return;
    const textToSpeak = examItems[currentIndex].spokenText || examItems[currentIndex].text;
    speak(textToSpeak, 'zh-TW', speechRate, clickedIndex);
  };
  
  return (
    <div className={`w-full h-full flex flex-col ${UI_THEME.BACKGROUND} transition-colors duration-300 relative`}>
	  {/* 🌟 3. 新增：學生端下載中的全螢幕遮罩 */}
      {isDownloading && (
        <div className="absolute inset-0 z-[999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">正在為您下載考卷...</h2>
          <p className="text-slate-500 mt-2 font-medium">請稍候，即將進入報讀系統</p>
        </div>
      )}
	  {/* 🌟 快速編輯視窗 */}
      <EditItemModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentItem={examItems[currentIndex]} // 傳入目前正在閱讀的題目
        onSave={async (id, text) => {
          await handleUpdateItemText(id, text);
          showToast('題目修改已儲存！'); // 🌟 儲存後呼叫 Toast
        }} // 綁定儲存函式
      />
      {/* 派送彈窗 */}
      <ExamShareModal 
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData({ ...shareModalData, isOpen: false })}
        shareId={shareModalData.shareId}
        examTitle={shareModalData.title}
      />
	  <ExamPackageModal 
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        isSharing={isSharing}
        onConfirm={async (fullExams) => {
          await handlePackageShare(fullExams);
          setIsPackageModalOpen(false); // 派送完畢後關閉視窗
        }} 
      />
	  
      {/* 匯入考卷功能 */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(items, title) => {
          handleImportSuccess(items, title);
          setIsImportModalOpen(false); // 🌟 記得加這行關閉視窗
        }} 
      />

      {/* DialogModal 用來做刪除確認 */}
      <DialogModal
		  isOpen={isClearModalOpen}
		  title="刪除考卷"
		  message="確定要刪除這份考卷嗎？刪除後將無法復原。"
		  type="confirm"
		  onConfirm={executeDeleteExam}
		  onCancel={() => { setIsClearModalOpen(false); setDeleteExamError(''); }}
		  onClose={() => { setIsClearModalOpen(false); setDeleteExamError(''); }}
		  cancelText="取消"
		  confirmText={isDeletingExam ? "刪除中…" : "確定刪除"}
		  variant="danger"
		  isBusy={isDeletingExam}
		  errorMessage={deleteExamError}
		/>
		
	  <DialogModal
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        variant={alertDialog.variant || 'info'}
        confirmText={alertDialog.confirmText}
        cancelText="取消"
        onConfirm={alertDialog.onConfirm}
        onCancel={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
	  
	  {/* 🌟 輕量級 Toast 通知 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[400] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      <TTSDictModal 
        isOpen={isDictModalOpen}
        onClose={() => setIsDictModalOpen(false)}
      />

      {/* 頂部工具列 */}
      <ExamHeader 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        zoomLevel={zoomLevel} 
        setZoomLevel={setZoomLevel}
        onOpenImport={() => setIsImportModalOpen(true)}
        isKaraokeMode={isKaraokeMode}
        setIsKaraokeMode={setIsKaraokeMode}
        onOpenDict={() => setIsDictModalOpen(true)}
        examList={examList}
        activeExamId={activeExamId}
        onSelectExam={handleSelectExam}
        onDeleteExam={handleDeleteClick} // 綁定開啟刪除對話框的函數
		onShareExam={() => setIsPackageModalOpen(true)}
        isSharing={isSharing}
		isFocusMode={isFocusMode}
		onExitFocusMode={handleExitFocusMode}
		onEnterFocusMode={handleEnterFocusMode}
      />

      {/* 中央主畫面區塊 */}
      <div className="flex flex-1 overflow-hidden relative">
        <ExamSidebar 
          isOpen={isSidebarOpen}
          examItems={examItems}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />

        <ExamReaderView 
          currentItem={examItems[currentIndex]}
          zoomLevel={zoomLevel}
          isKaraokeMode={isKaraokeMode}
          highlightRange={highlightRange}
          onWordClick={handleWordClick}
		  onMoveMedia={handleMoveMedia}
		  onOpenEdit={() => setIsEditModalOpen(true)}
		  isFocusMode={isFocusMode}
        />
      </div>

      {/* 底部控制列 */}
      <ExamControls 
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        ttsState={ttsState}
        onPlay={handlePlay} 
        onPause={handlePause}
        onStop={handleStop}
        onNext={handleNext}
        onPrev={handlePrev}
        currentIndex={currentIndex}
        totalItems={examItems.length}
      />
    </div>
  );
};

export default ExamReader;