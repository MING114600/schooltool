import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DoorOpen, Settings2, Trophy } from 'lucide-react'; 
import * as htmlToImage from 'html-to-image';

// --- 引入 Hooks 與 Constants ---
import { useStudentImport } from './hooks/useStudentImport';
import { useModalManager } from './hooks/useModalManager'; // 引入新 Hook
import { UI_THEME, MODAL_ID } from './utils/constants';

// --- 引入 Context ---
import { ClassroomProvider, useClassroomContext } from './context/ClassroomContext';

// --- 引入 UI 組件 ---
import Toolbar from './pages/Manager/components/Toolbar';
import Sidebar from './pages/Manager/components/Sidebar';
import SeatCell from './pages/Manager/components/SeatCell'; 
import ScoreFeedback from './pages/Manager/components/ScoreFeedback'; 
import GroupScoreTicker from './pages/Manager/components/GroupScoreTicker';
import SeatGrid from './pages/Manager/components/SeatGrid';

import TimerWidget from './components/common/widgets/TimerWidget';   
import LotteryWidget from './components/common/widgets/LotteryWidget'; 
import SoundBoard from './components/common/widgets/SoundBoard';

// --- 引入 Modals ---
import LayoutTemplateModal from './pages/Manager/modals/LayoutTemplateModal';
import AttendanceModal from './pages/Manager/modals/AttendanceModal';
import BatchGroupModal from './pages/Manager/modals/BatchGroupModal';
import BehaviorSettingsModal from './pages/Manager/modals/BehaviorSettingsModal';
import ExportStatsModal from './pages/Manager/modals/ExportStatsModal';
import ScoringModal from './pages/Manager/modals/ScoringModal';
import EditStudentModal from './pages/Manager/modals/EditStudentModal';
import DialogModal from './components/common/DialogModal';

const ManagerContent = () => {
  const {
    currentClass, 
    updateClass, saveTemplate, deleteTemplate, applyTemplate,
    toggleLock, toggleVoid, seatDrop, sidebarDrop, 
    updateStudents, scoreStudent, resetScores, updateBehaviors, updateAttendance,
    templates, feedbacks, clearSeats 
  } = useClassroomContext();

  const { parseImportText } = useStudentImport();
  
  // ✅ 整合後的 Modal 管理器
  const { 
      activeModal, 
      modalData, 
      openModal, 
      closeModal, 
      isModalOpen,
      dialogConfig,
      openDialog,
      closeDialog
  } = useModalManager();

  const handleShowDialog = useCallback((config) => {
      if (openDialog) {
          openDialog({
              ...config,
              onConfirm: (result) => {
                  if (config.onConfirm) config.onConfirm(result);
                  closeDialog(); 
              }
          });
      } else {
          console.error("openDialog is not defined in useModalManager");
      }
  }, [openDialog, closeDialog]);

  // --- UI 狀態 (保留必要的核心控制) ---
  const [isTeacherView, setIsTeacherView] = useState(false); 
  const [isEditingList, setIsEditingList] = useState(false); 
  const [showShuffleMenu, setShowShuffleMenu] = useState(false); 
  const [displayMode, setDisplayMode] = useState('group'); 
  const [appMode, setAppMode] = useState('score'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [sidebarTab, setSidebarTab] = useState('management');
  const [isToolbarOpen, setIsToolbarOpen] = useState(false); 
  const [isSoundBoardOpen, setIsSoundBoardOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isScoreTickerOpen, setIsScoreTickerOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [batchScoreMode, setBatchScoreMode] = useState(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const [hoveredGroup, setHoveredGroup] = useState(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null); 

  const today = new Date().toLocaleDateString('en-CA');
  const currentAttendanceStatus = currentClass?.attendanceRecords?.[today] || {};

  // --- 縮放與模式自動切換邏輯 ---
  useEffect(() => {
    if (currentClass?.students) {
        const hasGroups = currentClass.students.some(s => s.group && String(s.group).trim() !== '');
        setDisplayMode(hasGroups ? 'group' : 'normal');
    }
  }, [currentClass.id]); 

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            const scaleX = clientWidth / 1200;
            const scaleY = clientHeight / 800;
            setScale(Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2));
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, isToolbarOpen, isFocusMode]); 

  useEffect(() => {
      if (isFocusMode) { setIsSidebarOpen(false); setIsToolbarOpen(false); }
  }, [isFocusMode]);

  // --- 業務處理邏輯 ---
  const handleImportList = (text) => {
    const newStudents = parseImportText(text);
      if (newStudents.length > 0) {
	  handleShowDialog({
      type: 'confirm',
      title: '確認匯入名單',
      message: `成功解析 ${newStudents.length} 筆資料。\n這將重置座位表，確定嗎？`,
      onConfirm: () => {
        updateClass({
          ...currentClass,
          students: newStudents,
          layout: { ...currentClass.layout, seats: {}, voidSeats: [] },
          scoreLogs: []
        });
        setIsEditingList(false);
      }
    });
  } else {
    handleShowDialog({
      type: 'alert',
      title: '格式錯誤',
      message: '無法解析資料，請檢查格式是否包含：座號 姓名'
    });
  }
  };

  const handleSaveAttendance = (date, statusMap) => {
    // 呼叫 Context 的更新函式
    updateAttendance(date, statusMap); 
    
    // 這裡一更新，Context 就會通知 Dashboard，
    // Dashboard 就會算出新的 todayAttendance 傳給 LotteryWidget！
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

  // 1. 開啟 Dialog 提示使用者正在處理中，避免重複點擊
  openModal(MODAL_ID.DIALOG, {
    type: 'alert',
    title: '影像處理中',
    message: '正在產生高品質座位表（4x 採樣），這可能需要幾秒鐘...'
  });

  try {
    // 2. 執行高品質轉換
    const dataUrl = await htmlToImage.toPng(gridRef.current, { 
      pixelRatio: 4, // 提高解析度至 4 倍，確保沖洗質感
      quality: 1.0,
      // 過濾掉不需列印的 UI（如：鎖定按鈕、功能選單）
      filter: (node) => {
        const classList = node.classList;
        return classList ? !classList.contains('no-print') : true;
      }
    });

    // 3. 建立下載連結
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${currentClass.name}_座位表_HD.png`;
    link.click();

    // 4. 完成後自動關閉 Dialog
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
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`無法啟動全螢幕模式: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const isVisualRight = isTeacherView ? (currentClass?.layout?.doorSide === 'left') : (currentClass?.layout?.doorSide === 'right');
  const doorSideClass = isVisualRight ? 'right-0 rounded-l-lg border-l-4' : 'left-0 rounded-r-lg border-r-4';

  return (
    <div className={`flex h-screen ${UI_THEME.BACKGROUND} transition-colors duration-500 overflow-hidden font-sans`}>
      
      {/* ✅ 集中管理的 Modals */}
      <LayoutTemplateModal 
        isOpen={isModalOpen(MODAL_ID.LAYOUT_TEMPLATE)} onClose={closeModal} 
        currentLayout={currentClass?.layout} onApplyTemplate={applyTemplate} 
        onSaveTemplate={saveTemplate} templates={templates} onDeleteTemplate={deleteTemplate}
      />
      <EditStudentModal 
        isOpen={isModalOpen(MODAL_ID.EDIT_STUDENT)} student={modalData} onClose={closeModal} 
        onSave={(s) => { updateStudents(currentClass.students.map(old => old.id === s.id ? s : old)); closeModal(); }}
      />
      <BatchGroupModal 
        isOpen={isModalOpen(MODAL_ID.BATCH_GROUP)} onClose={closeModal} 
        students={currentClass?.students} onUpdateStudents={updateStudents}
		onShowDialog={handleShowDialog}
      />
      <AttendanceModal 
        isOpen={isModalOpen(MODAL_ID.ATTENDANCE)} onClose={closeModal} 
        students={currentClass?.students} attendanceRecords={currentClass?.attendanceRecords || {}} onSave={handleSaveAttendance}
      />
      <ScoringModal 
        isOpen={isModalOpen(MODAL_ID.SCORING)} student={modalData} 
        behaviors={currentClass?.behaviors} onClose={() => { closeModal(); setHoveredGroup(null); }} 
        onScore={scoreStudent} defaultMode="group_members" 
      />
      <BehaviorSettingsModal 
        isOpen={isModalOpen(MODAL_ID.BEHAVIOR_SETTINGS)} onClose={closeModal} 
        behaviors={currentClass?.behaviors} onUpdateBehaviors={updateBehaviors} onResetScores={resetScores}
		onShowDialog={handleShowDialog}
      />
      <ExportStatsModal 
        isOpen={isModalOpen(MODAL_ID.EXPORT_STATS)} onClose={closeModal} 
        students={currentClass?.students} groupScores={currentClass?.groupScores} 
        attendanceRecords={currentClass?.attendanceRecords || {}} onResetScores={resetScores} 
		onShowDialog={handleShowDialog}
      />
      <DialogModal 
        isOpen={!!dialogConfig} 
        onClose={closeDialog} 
        {...(dialogConfig || {})} 
      />
      
      <ScoreFeedback feedbacks={feedbacks} />

      {/* 詳細模式開關按鈕 */}
      {(isFocusMode || (!isSidebarOpen && !isToolbarOpen)) && (
        <div className="absolute top-3 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 no-print print:hidden">
          <button 
            onClick={() => { setIsFocusMode(false); setIsSidebarOpen(true); setIsToolbarOpen(true); }} 
            className="px-4 py-2 bg-white/90 dark:bg-blue-900/50 backdrop-blur text-blue-600 dark:text-blue-200 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-blue-50 hover:dark:bg-blue-500/50 hover:scale-105 transition-all border border-blue-200 dark:border-blue-500"
          >
            <Settings2 size={18}/> <span className="font-bold">詳細模式</span>
          </button>
        </div>
      )}

      {!isScoreTickerOpen && (isFocusMode || !isToolbarOpen) && (
          <div className="absolute top-15 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 no-print print:hidden">
              <button 
                onClick={() => setIsScoreTickerOpen(true)}
                className="px-4 py-2 bg-white/90 dark:bg-amber-900/50 backdrop-blur text-amber-600 dark:text-amber-200 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-amber-50 hover:dark:bg-amber-500/50 hover:scale-105 transition-all border border-amber-200 dark:border-amber-500 shadow-amber-100/50 dark:shadow-amber-700/50"
              >
                  <Trophy size={18}/> 評分工具
              </button>
          </div>
      )}


      <Sidebar 
        isOpen={isSidebarOpen && !isFocusMode} onClose={() => setIsSidebarOpen(false)}
        activeTab={sidebarTab} setActiveTab={setSidebarTab} isEditingList={isEditingList} setIsEditingList={setIsEditingList}
        displayMode={displayMode} appMode={appMode} onStudentClick={handleStudentClick}
        onDragStart={(e, id) => e.dataTransfer.setData("studentId", id)} onDrop={sidebarDrop} onImportList={handleImportList} 
        onOpenAttendance={() => openModal(MODAL_ID.ATTENDANCE)} onOpenBatchGroup={() => openModal(MODAL_ID.BATCH_GROUP)}
        onOpenExportStats={() => openModal(MODAL_ID.EXPORT_STATS)} onOpenSettings={() => openModal(MODAL_ID.BEHAVIOR_SETTINGS)}
		onShowDialog={handleShowDialog}
      />

      <div className={`flex-1 flex flex-col relative overflow-hidden ${UI_THEME.CONTENT_AREA} transition-all duration-500`}>
        <Toolbar 
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          isToolbarOpen={isToolbarOpen && !isFocusMode} setIsToolbarOpen={setIsToolbarOpen}
          appMode={appMode} handleSwitchMode={(m) => { setAppMode(m); setBatchScoreMode(null); }}
          showShuffleMenu={showShuffleMenu} setShowShuffleMenu={setShowShuffleMenu}
          cycleDisplayMode={() => setDisplayMode(prev => ({normal:'gender', gender:'group', group:'normal'}[prev]))} 
          getDisplayModeLabel={() => ({normal:'一般', gender:'性別', group:'小組'}[displayMode])}
          handleExportImage={handleExportImage} toggleFullscreen={toggleFullscreen}
          setIsTemplateModalOpen={() => openModal(MODAL_ID.LAYOUT_TEMPLATE)} 
          setScoringStudent={(s) => openModal(MODAL_ID.SCORING, s)} 
          setIsLotteryOpen={setIsLotteryOpen} setIsTimerOpen={setIsTimerOpen}
		  isLotteryOpen={isLotteryOpen} isTimerOpen={isTimerOpen}
          isTeacherView={isTeacherView} setIsTeacherView={setIsTeacherView}
          isSoundBoardOpen={isSoundBoardOpen} setIsSoundBoardOpen={setIsSoundBoardOpen}
          isScoreTickerOpen={isScoreTickerOpen} setIsScoreTickerOpen={setIsScoreTickerOpen}
          isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
		  onShowDialog={handleShowDialog}
        />
        
        <GroupScoreTicker 
          groupScores={currentClass?.groupScores} students={currentClass?.students}
          isVisible={isScoreTickerOpen && appMode === 'score'} onClose={() => setIsScoreTickerOpen(false)}
          batchScoreMode={batchScoreMode} onToggleBatchMode={(m) => setBatchScoreMode(prev => prev === m ? null : m)}
          onQuickScore={(groupId, value) => scoreStudent(groupId, { id: 'group_quick', value, score: value, type: value>0?'positive':'negative', isQuick: true }, 'group')}
          onDetailScore={(groupId) => openModal(MODAL_ID.SCORING, { isGroupEntity: true, group: groupId })}
          onClassScore={() => openModal(MODAL_ID.SCORING, { isClassEntity: true, name: '全班同學' })}
        />
        
		<LotteryWidget isOpen={isLotteryOpen} onClose={() => setIsLotteryOpen(false)} students={currentClass?.students} attendanceStatus={currentAttendanceStatus}/>
		<TimerWidget isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} students={currentClass?.students} attendanceStatus={currentAttendanceStatus}/>
		<SoundBoard isOpen={isSoundBoardOpen} onClose={() => setIsSoundBoardOpen(false)} />

<div ref={containerRef} className={`flex-1 p-4 md:p-8 flex flex-col items-center justify-center overflow-auto ${batchScoreMode ? 'cursor-crosshair' : ''}`}>
          <div className="flex flex-col items-center w-full max-w-6xl" ref={gridRef}>
            
            {/* 上標籤 */}
            <div className={`w-full max-w-4xl h-10 mb-6 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-lg transition-all duration-500 ${isTeacherView ? 'bg-slate-500 dark:bg-slate-700' : 'bg-slate-700 dark:bg-slate-800 border border-slate-600'}`}>
              {isTeacherView ? '教室後方 / 布告欄' : '講台 / 黑板'}
            </div>
            
            {/* 座位網格容器 */}
            <div className={`relative ${UI_THEME.SURFACE_GLASS} rounded-3xl shadow-2xl p-8 md:p-12 border-4 ${UI_THEME.BORDER_LIGHT} max-w-5xl w-full mx-auto flex-1 flex flex-col overflow-hidden`}>
              <SeatGrid 
                layout={currentClass?.layout}
                students={currentClass?.students || []}
                isTeacherView={isTeacherView}
                onSeatDrop={seatDrop}
                onStudentClick={handleStudentClick}
                displayMode={displayMode}
                appMode={appMode}
                attendanceStatus={currentAttendanceStatus}
                onToggleVoid={toggleVoid}
                onToggleLock={toggleLock}
                hoveredGroup={hoveredGroup}
              />
            </div>

            {/* 下標籤 */}
            <div className={`w-full max-w-4xl h-10 mt-6 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-lg transition-all duration-500 ${isTeacherView ? 'bg-slate-700 dark:bg-slate-800 border border-slate-600' : 'bg-slate-500 dark:bg-slate-700'}`}>
              {isTeacherView ? '講台 / 黑板' : '教室後方 / 布告欄'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassroomManagerRoot = () => (
  <ClassroomProvider>
    <ManagerContent />
  </ClassroomProvider>
);

export default ClassroomManagerRoot;