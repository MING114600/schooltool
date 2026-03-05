import React, { useRef, useEffect, useCallback } from 'react';
import { Settings2, Trophy } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// --- 引入 Hooks 與 Constants ---
// 路徑修正：跳出兩層到 src 根目錄
import { useStudentImport } from '../../hooks/useStudentImport';
import { useManagerUI } from '../../pages/Manager/hooks/useManagerUI';
import { UI_THEME, MODAL_ID } from '../../constants';

// --- 引入 Context ---
import { useClassroomStore } from '../../store/useClassroomStore';
import { ModalProvider, useModalContext } from '../../context/ModalContext';

// --- 引入 UI 組件 (Manager Local) ---
// 路徑修正：同層級 (Manager) 下的 components
import ScoreFeedback from './components/ScoreFeedback';
import GroupScoreTicker from './components/GroupScoreTicker';
import QuickScoreBar from './components/QuickScoreBar';
import ArrangeToolboxWidget from './components/widgets/ArrangeToolboxWidget';
import SeatGrid from './components/SeatGrid';
import ClassroomMenuWidget from './components/widgets/ClassroomMenuWidget';
import Sidebar from './components/Sidebar';

// --- 引入 Widgets (Common) ---
// 路徑修正：跳出兩層到 src/components/common/widgets
import TimerWidget from '../../components/common/widgets/TimerWidget';
import LotteryWidget from '../../components/common/widgets/LotteryWidget';
import SoundBoard from '../../components/common/widgets/SoundBoard';
import StandardAppLayout from '../../components/common/layout/StandardAppLayout';

// --- 引入 Common Modals ---

const Manager = () => {
  const feedbacks = useClassroomStore(state => state.feedbacks);
  const currentClassId = useClassroomStore(state => state.currentClassId);
  const getStore = useClassroomStore.getState;
  const classes = useClassroomStore(state => state.classes);

  const currentClass = classes.find(c => c.id === currentClassId);
  const students = currentClass?.students || [];
  const groupScores = currentClass?.groupScores || {};

  const updateClass = useClassroomStore(state => state.updateClass);
  const toggleLock = useClassroomStore(state => state.toggleLock);
  const sidebarDrop = useClassroomStore(state => state.sidebarDrop);
  const scoreStudent = useClassroomStore(state => state.scoreStudent);
  const seatMode = useClassroomStore(state => state.seatMode);
  const setSeatMode = useClassroomStore(state => state.setSeatMode);
  const actionToggleVoid = useClassroomStore(state => state.toggleVoid);
  const actionToggleColumnVoid = useClassroomStore(state => state.toggleColumnVoid);
  const actionToggleRowVoid = useClassroomStore(state => state.toggleRowVoid);
  const actionSeatDrop = useClassroomStore(state => state.seatDrop);

  const historyState = useClassroomStore(state => state.historyState);
  const canUndo = historyState.index > 0;
  const canRedo = historyState.index < historyState.history.length - 1;
  const undo = useClassroomStore(state => state.undo);
  const redo = useClassroomStore(state => state.redo);

  const { parseImportText } = useStudentImport();

  const {
    activeModal, modalData, openModal, closeModal, isModalOpen,
    dialogConfig, openDialog, closeDialog
  } = useModalContext();

  const {
    state: {
      isTeacherView, isEditingList, showShuffleMenu, displayMode, appMode,
      isSidebarOpen, sidebarTab, isSoundBoardOpen, isTimerOpen,
      isLotteryOpen, isScoreTickerOpen, batchScoreMode, hoveredGroup, scale
    },
    setters: {
      setIsTeacherView, setIsEditingList, setShowShuffleMenu, setDisplayMode, setAppMode,
      setIsSidebarOpen, setSidebarTab, setIsSoundBoardOpen, setIsTimerOpen,
      setIsLotteryOpen, setIsScoreTickerOpen, setBatchScoreMode, setHoveredGroup
    },
    actions: {
      handleSwitchMode, cycleDisplayMode, getDisplayModeLabel, toggleBatchMode
    },
    refs: {
      gridRef, containerRef
    }
  } = useManagerUI({
    currentClass, activeModal, closeModal, dialogConfig, closeDialog,
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    },
    canUndo, undo, canRedo, redo, setSeatMode
  });

  // --- 業務處理邏輯 ---
  const handleImportList = (text) => {
    const newStudents = parseImportText(text);
    if (newStudents.length > 0) {
      openDialog({
        type: 'confirm',
        title: '確認匯入名單',
        message: `成功解析 ${newStudents.length} 筆資料。\n這將重置座位表，確定嗎？`,
        onConfirm: () => {
          const state = getStore();
          const cls = state.classes.find(c => c.id === state.currentClassId);
          if (cls) {
            updateClass({
              ...cls,
              students: newStudents,
              layout: { ...cls.layout, seats: {}, voidSeats: [] },
              scoreLogs: []
            });
          }
          setIsEditingList(false);
          closeDialog();
        }
      });
    } else {
      openDialog({
        type: 'alert',
        title: '格式錯誤',
        message: '無法解析資料，請檢查格式是否包含：座號 姓名'
      });
    }
  };

  const handleStudentClick = useCallback((student) => {
    if (!student) return;
    if (batchScoreMode) {
      const value = batchScoreMode === 'add' ? 1 : -1;
      scoreStudent(student.id, { id: 'batch_quick', value, score: value, label: value > 0 ? '快速加分' : '快速扣分', type: value > 0 ? 'positive' : 'negative', isQuick: true }, 'individual');
      return;
    }
    if (appMode === 'arrange') { openModal(MODAL_ID.EDIT_STUDENT, student); return; }
    if (appMode === 'score') { openModal(MODAL_ID.SCORING, student); }
  }, [batchScoreMode, appMode, scoreStudent, openModal]);

  const handleExportImage = async () => {
    if (!gridRef.current) return;

    openModal(MODAL_ID.DIALOG, {
      type: 'alert',
      title: '影像處理中',
      message: '正在產生高品質座位表（4x 採樣），這可能需要幾秒鐘...'
    });

    try {
      const dataUrl = await htmlToImage.toPng(gridRef.current, {
        pixelRatio: 4,
        quality: 1.0,
        filter: (node) => {
          const classList = node.classList;
          return classList ? !classList.contains('no-print') : true;
        }
      });

      const state = getStore();
      const cls = state.classes.find(c => c.id === state.currentClassId);
      const className = cls ? cls.name : 'Class';

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${className}_座位表_HD.png`;
      link.click();
      closeModal();
    } catch (error) {
      console.error("匯出失敗:", error);
      openModal(MODAL_ID.DIALOG, {
        type: 'alert',
        title: '匯出失敗',
        message: '請確認瀏覽器支援快照功能，或嘗試縮小視窗後再試一次。'
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const renderClassroomMenu = () => (
    <ClassroomMenuWidget
      isTeacherView={isTeacherView}
      setIsTeacherView={setIsTeacherView}
      cycleDisplayMode={cycleDisplayMode}
      getDisplayModeLabel={getDisplayModeLabel}
      handleExportImage={handleExportImage}
      toggleFullscreen={toggleFullscreen}
      isSidebarOpen={isSidebarOpen}
      sidebarWidth={340}
    />
  );

  const renderSidebar = () => (
    <Sidebar
      isOpen={true} // 由 StandardAppLayout 控制顯示，Sidebar 元件內不再需要自帶開關邏輯
      onClose={() => setIsSidebarOpen(false)}
      activeTab={sidebarTab} setActiveTab={setSidebarTab} isEditingList={isEditingList} setIsEditingList={setIsEditingList}
      displayMode={displayMode} appMode={appMode} onStudentClick={handleStudentClick}
      onDragStart={(e, id) => e.dataTransfer.setData("studentId", id)} onDrop={sidebarDrop} onImportList={handleImportList}
    />
  );

  return (
    <StandardAppLayout
      header={renderClassroomMenu()}
      sidebar={renderSidebar()}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      sidebarWidth="w-[340px]" // Manager Sidebar 有點寬，稍微手動指定
      sidebarOpenWidth="340px"
    >
      {/* 獨立模組：Feedback */}
      <ScoreFeedback feedbacks={feedbacks} mode="" />

      {/* 排座位獨立按鈕 (FAB) */}
      {appMode === 'score' && (
        <div className="absolute bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-4 fade-in duration-500 no-print print:hidden">
          <button
            onClick={() => handleSwitchMode('arrange')}
            className="px-5 py-3 bg-white/95 dark:bg-indigo-900/90 backdrop-blur text-indigo-600 dark:text-indigo-200 rounded-2xl shadow-2xl font-black flex items-center gap-2 hover:bg-indigo-50 hover:dark:bg-indigo-800/80 hover:-translate-y-1 transition-all border border-indigo-200 dark:border-indigo-500/50"
          >
            <span className="text-xl">🪑</span>排座位
          </button>
        </div>
      )}

      {/* 排座位專屬控制列 */}
      <ArrangeToolboxWidget
        isVisible={appMode === 'arrange'}
        onComplete={() => handleSwitchMode('score')}
      />

      <QuickScoreBar
        isVisible={appMode === 'score'}
        batchScoreMode={batchScoreMode}
        onToggleBatchMode={toggleBatchMode}
        onClassScore={() => openModal(MODAL_ID.SCORING, { mode: 'class', name: '全班同學' })}
        isScoreTickerOpen={isScoreTickerOpen}
        onToggleScoreTicker={() => setIsScoreTickerOpen(!isScoreTickerOpen)}
        isLotteryOpen={isLotteryOpen} setIsLotteryOpen={setIsLotteryOpen}
        isTimerOpen={isTimerOpen} setIsTimerOpen={setIsTimerOpen}
        isSoundBoardOpen={isSoundBoardOpen} setIsSoundBoardOpen={setIsSoundBoardOpen}
      />

      <GroupScoreTicker
        isVisible={isScoreTickerOpen && appMode === 'score'} onClose={() => setIsScoreTickerOpen(false)}
        onQuickScore={(groupId, value) => scoreStudent(groupId, { id: 'group_quick', value, score: value, type: value > 0 ? 'positive' : 'negative', isQuick: true }, 'group')}
        onDetailScore={(groupId) => openModal(MODAL_ID.SCORING, { mode: 'group_members', group: groupId, name: `第 ${groupId} 組 (全員)` })}
        groupScores={groupScores}
        students={students}
      />

      <LotteryWidget isOpen={isLotteryOpen} onClose={() => setIsLotteryOpen(false)} />
      <TimerWidget isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
      <SoundBoard isOpen={isSoundBoardOpen} onClose={() => setIsSoundBoardOpen(false)} />

      <div ref={containerRef} className={`flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-32 md:pt-4 flex flex-col items-center justify-start overflow-hidden ${batchScoreMode ? 'cursor-crosshair' : ''}`}>
        <div className="flex flex-col items-center w-full max-w-6xl h-full min-h-0" ref={gridRef}>
          <div className={`w-full max-w-4xl h-10 min-h-10 shrink-0 mb-2 rounded-[0.5rem] flex items-center justify-center text-white font-bold tracking-widest shadow-md transition-all duration-500 z-10 ${isTeacherView ? 'bg-slate-500 dark:bg-slate-700' : 'bg-slate-700 dark:bg-slate-800'}`}>
            {isTeacherView ? '教室後方 / 布告欄' : '講台 / 黑板'}
          </div>

          <div className={`relative ${UI_THEME.SURFACE_GLASS} rounded-3xl shadow-2xl p-8 md:p-12 border-4 ${UI_THEME.BORDER_LIGHT} max-w-5xl w-full mx-auto flex-1 flex flex-col overflow-hidden`}>
            <SeatGrid
              isTeacherView={isTeacherView}
              onSeatDrop={actionSeatDrop}
              onStudentClick={handleStudentClick}
              displayMode={displayMode}
              appMode={appMode}
              seatMode={seatMode}
              onToggleVoid={actionToggleVoid}
              onToggleColumnVoid={actionToggleColumnVoid}
              onToggleRowVoid={actionToggleRowVoid}
              onToggleLock={toggleLock}
              hoveredGroup={hoveredGroup}
            />
          </div>

          <div className={`w-full max-w-4xl h-10 min-h-10 shrink-0 mt-2 rounded-[0.5rem] flex items-center justify-center text-white font-bold tracking-widest shadow-md transition-all duration-500 z-10 ${isTeacherView ? 'bg-slate-700 dark:bg-slate-800' : 'bg-slate-500 dark:bg-slate-700'}`}>
            {isTeacherView ? '講台 / 黑板' : '教室後方 / 布告欄'}
          </div>
        </div>
      </div>
    </StandardAppLayout>
  );
};

export default Manager;