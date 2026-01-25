import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DoorOpen, Settings2, Trophy, ChevronRight } from 'lucide-react'; 
import * as htmlToImage from 'html-to-image';

// --- 引入 Context ---
//import { useTheme } from './hooks/useTheme'; 
import { UI_THEME } from './utils/constants.jsx';
import { ClassroomProvider, useClassroomContext } from './context/ClassroomContext';
import { useThemeContext } from './context/ThemeContext';

// --- 引入 UI 組件 ---
import Toolbar from './pages/Manager/components/Toolbar';
import Sidebar from './pages/Manager/components/Sidebar';
import SeatCell from './pages/Manager/components/SeatCell'; 
import ScoreFeedback from './pages/Manager/components/ScoreFeedback'; 
import GroupScoreTicker from './pages/Manager/components/GroupScoreTicker';

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
import DialogModal from './pages/Manager/modals/DialogModal';

const ManagerContent = () => {
  const {
    currentClass, 
    updateClass, saveTemplate, deleteTemplate, applyTemplate,
    toggleLock, toggleVoid, seatDrop, sidebarDrop, 
    updateStudents, scoreStudent, resetScores, updateBehaviors, updateAttendance,
    templates, feedbacks, clearSeats, shuffleSeats
  } = useClassroomContext();

  // ✅ 使用獨立主題 Hook
  //const { theme, cycleTheme, isEffectiveDark } = useTheme();

  // --- UI 狀態 ---
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

  // Modal 狀態保持不變...
  const [editingStudent, setEditingStudent] = useState(null);
  const [scoringStudent, setScoringStudent] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBatchGroupOpen, setIsBatchGroupOpen] = useState(false); 
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false); 
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'prompt', title: '', message: '', onConfirm: () => {} });

  const [hoveredGroup, setHoveredGroup] = useState(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null); 

  const todayDate = new Date().toISOString().split('T')[0];
  const currentAttendanceStatus = currentClass?.attendanceRecords?.[todayDate] || {};

  useEffect(() => {
    if (currentClass && currentClass.students) {
        const hasGroups = currentClass.students.some(s => s.group && String(s.group).trim() !== '');
        if (hasGroups) {
            if (displayMode === 'normal') setDisplayMode('group');
        } else {
            if (displayMode === 'group') setDisplayMode('normal');
        }
    }
  }, [currentClass.id]); 

	const handleClear = () => {
    // 加入確認視窗，避免誤觸
    if (window.confirm('確定要清空目前的座位表嗎？\n\n所有學生將回到左側「未排座位區」，此動作無法復原。')) {
        clearSeats();
    }
  };


  // 縮放邏輯
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            const baseWidth = 1200; 
            const baseHeight = 800;
            const scaleX = clientWidth / baseWidth;
            const scaleY = clientHeight / baseHeight;
            const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2);
            setScale(newScale);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, isToolbarOpen, isFocusMode]); 

  // 專注模式連動
  useEffect(() => {
      if (isFocusMode) {
          setIsSidebarOpen(false);
          setIsToolbarOpen(false);
      }
  }, [isFocusMode]);
  
  const handleEnterDetailMode = () => {
      setIsFocusMode(false);
      setIsSidebarOpen(true); 
      setIsToolbarOpen(true); 
  };

  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => { console.error(err); });
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleSwitchMode = (newMode) => {
      setAppMode(newMode);
      setBatchScoreMode(null);
  };

  const cycleDisplayMode = () => {
      const modes = ['normal', 'gender', 'group'];
      const nextIndex = (modes.indexOf(displayMode) + 1) % modes.length;
      setDisplayMode(modes[nextIndex]);
  };

  const getDisplayModeLabel = () => {
      switch(displayMode) {
          case 'normal': return '一般';
          case 'gender': return '性別';
          case 'group': return '小組';
          default: return '一般';
      }
  };

  const handleScoreStudentWrapper = (targetId, behavior, mode) => {
      scoreStudent(targetId, behavior, mode);
  };



  const handleStudentClick = useCallback((student) => {
    if (!student) return;
    if (batchScoreMode) {
      const value = batchScoreMode === 'add' ? 1 : -1;
      const behavior = { id: 'batch_quick', value, score: value, label: value > 0 ? '快速加分' : '快速扣分', type: value > 0 ? 'positive' : 'negative', isQuick: true };
      scoreStudent(student.id, behavior, 'individual');
      return;
    }
    if (appMode === 'arrange') { setEditingStudent(student); return; } 
    if (appMode === 'score') { setScoringStudent(student); }
  }, [batchScoreMode, appMode, scoreStudent]);

  const handleExportImage = async () => {
    if (!gridRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(gridRef.current, { 
        pixelRatio: 2 
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${currentClass.name}_座位表.png`;
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const renderGrid = () => {
    if (!currentClass?.layout) return null;
    const { rows, cols, seats, voidSeats } = currentClass.layout;
    const rowIndices = Array.from({ length: cols }, (_, i) => i);
    if (isTeacherView) rowIndices.reverse();

    return rowIndices.map(r => (
      <div key={r} className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows }, (_, c) => {
          const displayCol = isTeacherView ? (rows - 1 - c) : c;
          const key = `${r}-${displayCol}`;
          const student = currentClass.students.find(s => s.id === seats[key]);
          return (
            <SeatCell 
              key={key} row={r} col={displayCol} 
              student={student}
              onDrop={seatDrop} 
              onDragStart={(e, id) => { e.dataTransfer.setData("studentId", id); e.dataTransfer.setData("sourceSeat", key); }}
              onStudentClick={handleStudentClick} 
              displayMode={displayMode} mode={appMode}
              attendanceStatus={currentAttendanceStatus} isVoid={voidSeats?.includes(key)}
              onToggleVoid={toggleVoid} onToggleLock={toggleLock} hoveredGroup={hoveredGroup}
            />
          );
        })}
      </div>
    ));
  };

  const isVisualRight = isTeacherView ? (currentClass?.layout?.doorSide === 'left') : (currentClass?.layout?.doorSide === 'right');
  const doorSideClass = isVisualRight ? 'right-0 rounded-l-lg border-l-4' : 'left-0 rounded-r-lg border-r-4';

  return (
    <div className={`flex h-screen ${UI_THEME.BACKGROUND} transition-colors duration-500 overflow-hidden font-sans`}>
      
      {/* 所有的彈窗與回饋組件 */}
      <LayoutTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} currentLayout={currentClass?.layout} onApplyTemplate={applyTemplate} onSaveTemplate={saveTemplate} templates={templates} onDeleteTemplate={deleteTemplate}/>
      <EditStudentModal isOpen={!!editingStudent} student={editingStudent} onClose={() => setEditingStudent(null)} onSave={(s) => { updateStudents(currentClass.students.map(old => old.id === s.id ? s : old)); setEditingStudent(null); }}/>
      <BatchGroupModal isOpen={isBatchGroupOpen} onClose={() => setIsBatchGroupOpen(false)} students={currentClass?.students} onUpdateStudents={updateStudents}/>
      <AttendanceModal isOpen={isAttendanceOpen} onClose={() => setIsAttendanceOpen(false)} students={currentClass?.students} attendanceRecords={currentClass?.attendanceRecords || {}} onSave={updateAttendance}/>
      <ScoringModal isOpen={!!scoringStudent} student={scoringStudent} behaviors={currentClass?.behaviors} onClose={() => { setScoringStudent(null); setHoveredGroup(null); }} onScore={scoreStudent} defaultMode="group_members" />
      <BehaviorSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} behaviors={currentClass?.behaviors} onUpdateBehaviors={updateBehaviors} onResetScores={resetScores}/>
      <ExportStatsModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} students={currentClass?.students} groupScores={currentClass?.groupScores} attendanceRecords={currentClass?.attendanceRecords || {}} onResetScores={resetScores} />
      <DialogModal isOpen={dialogState.isOpen} onClose={() => setDialogState(p => ({...p, isOpen:false}))} title={dialogState.title} message={dialogState.message} type={dialogState.type} onConfirm={dialogState.onConfirm}/>
      <ScoreFeedback feedbacks={feedbacks} />

      {/* 詳細模式開關按鈕 */}
      {(isFocusMode || (!isSidebarOpen && !isToolbarOpen)) && (
        <div className="absolute top-3 right-4 z-[70] no-print animate-fade-in">
          <button 
            onClick={() => { setIsFocusMode(false); setIsSidebarOpen(true); setIsToolbarOpen(true); }} 
            className="px-10 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-full shadow-2xl flex items-center gap-2 border border-slate-600 hover:scale-105 transition-all"
          >
            <Settings2 size={18}/>
            <span className="font-bold">詳細模式</span>
          </button>
        </div>
      )}

      {/* 2. 右上角：開啟評分工具按鈕 */}
      {!isScoreTickerOpen && (isFocusMode || !isToolbarOpen) && (
          <div className="absolute top-4 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 no-print">
              <button 
                onClick={() => setIsScoreTickerOpen(true)}
                className="px-4 py-2 bg-white/90 backdrop-blur text-amber-600 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-amber-50 hover:scale-105 transition-all border border-amber-200 shadow-amber-100/50"
              >
                  <Trophy size={18}/> 評分工具
              </button>
          </div>
      )}


      <Sidebar 
        isOpen={isSidebarOpen && !isFocusMode} onClose={() => setIsSidebarOpen(false)}
        activeTab={sidebarTab} setActiveTab={setSidebarTab} isEditingList={isEditingList} setIsEditingList={setIsEditingList}
        displayMode={displayMode} appMode={appMode} onStudentClick={handleStudentClick}
        onDragStart={(e, id) => e.dataTransfer.setData("studentId", id)} onDrop={sidebarDrop} onImportList={(t)=>{}} 
        onOpenAttendance={() => setIsAttendanceOpen(true)} onOpenBatchGroup={() => setIsBatchGroupOpen(true)}
        onOpenExportStats={() => setIsExportOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className={`flex-1 flex flex-col relative overflow-hidden ${UI_THEME.CONTENT_AREA} transition-all duration-500`}>
        <Toolbar 
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          isToolbarOpen={isToolbarOpen && !isFocusMode} setIsToolbarOpen={setIsToolbarOpen}
          appMode={appMode} handleSwitchMode={(m) => { setAppMode(m); setBatchScoreMode(null); }}
          showShuffleMenu={showShuffleMenu} setShowShuffleMenu={setShowShuffleMenu}
          cycleDisplayMode={() => {
            const modes = ['normal', 'gender', 'group'];
            setDisplayMode(modes[(modes.indexOf(displayMode) + 1) % modes.length]);
          }} 
          getDisplayModeLabel={() => ({normal:'一般', gender:'性別', group:'小組'}[displayMode])}
          handleExportImage={handleExportImage} toggleFullscreen={toggleFullscreen}
          setIsTemplateModalOpen={setIsTemplateModalOpen} setScoringStudent={setScoringStudent} 
          setIsLotteryOpen={setIsLotteryOpen} setIsTimerOpen={setIsTimerOpen}
		  isLotteryOpen={isLotteryOpen} isTimerOpen={isTimerOpen}
          isTeacherView={isTeacherView} setIsTeacherView={setIsTeacherView}
          isSoundBoardOpen={isSoundBoardOpen} setIsSoundBoardOpen={setIsSoundBoardOpen}
          isScoreTickerOpen={isScoreTickerOpen} setIsScoreTickerOpen={setIsScoreTickerOpen}
          isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
        />
        
        <GroupScoreTicker 
          groupScores={currentClass?.groupScores} students={currentClass?.students}
          isVisible={isScoreTickerOpen && appMode === 'score'} onClose={() => setIsScoreTickerOpen(false)}
          batchScoreMode={batchScoreMode} onToggleBatchMode={(m) => setBatchScoreMode(prev => prev === m ? null : m)}
          onQuickScore={(groupId, value) => scoreStudent(groupId, { id: 'group_quick', value, score: value, type: value>0?'positive':'negative', isQuick: true }, 'group')}
          onDetailScore={(groupId) => setScoringStudent({ isGroupEntity: true, group: groupId })}
          onClassScore={() => setScoringStudent({ isClassEntity: true, name: '全班同學' })}
        />
        
		<LotteryWidget 
			isOpen={isLotteryOpen} 
			onClose={() => setIsLotteryOpen(false)} 
			students={currentClass?.students} 
			attendanceStatus={currentAttendanceStatus}
		/>
		
		<TimerWidget 
			isOpen={isTimerOpen} 
			onClose={() => setIsTimerOpen(false)} 
			students={currentClass?.students} 
			attendanceStatus={currentAttendanceStatus}
		/>
		
		<SoundBoard 
           isOpen={isSoundBoardOpen} 
           onClose={() => setIsSoundBoardOpen(false)} 
        />


        <div ref={containerRef} className={`flex-1 p-4 md:p-8 flex flex-col items-center justify-center overflow-auto ${batchScoreMode ? 'cursor-crosshair' : ''}`}>
          <div className="flex flex-col items-center w-full max-w-6xl" ref={gridRef}>
            
            {/* 講台/黑板標籤：落實深色模式 */}
            <div className={`w-full max-w-4xl h-10 mb-6 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-lg transition-all duration-500 ${isTeacherView ? 'bg-slate-500 dark:bg-slate-700' : 'bg-slate-700 dark:bg-slate-800 border border-slate-600'}`}>
              {isTeacherView ? '教室後方 / 布告欄' : '講台 / 黑板'}
            </div>
            
            {/* 座位區域主容器：強制深色背景 */}
            <div className={`relative ${UI_THEME.SURFACE_GLASS} rounded-3xl shadow-2xl p-8 md:p-12 border-4 ${UI_THEME.BORDER_LIGHT} max-w-5xl w-full mx-auto flex-1 flex flex-col overflow-hidden`}>
              <div className={`absolute w-5 h-20 bg-amber-200 dark:bg-amber-900/50 border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-[14px] writing-vertical ${doorSideClass} top-10 transition-colors`}>
                <DoorOpen size={14}/> {isTeacherView ? '後門' : '前門'}
              </div>
              <div className={`absolute w-5 h-20 bg-amber-200 dark:bg-amber-900/50 border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-[14px] writing-vertical ${doorSideClass} bottom-10 transition-colors`}>
                <DoorOpen size={14}/> {isTeacherView ? '前門' : '後門'}
              </div>
              
              <div className="flex-1 w-full min-h-0 grid gap-2">
                {renderGrid()}
              </div>
            </div>

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