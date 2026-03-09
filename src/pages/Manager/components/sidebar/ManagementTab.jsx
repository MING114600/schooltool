import React, { useRef, memo } from 'react';
import { Edit3, Trash2, Plus, CalendarCheck, Layers, Download, Box, UserPlus } from 'lucide-react';
import StudentCard from '../../../../components/business/StudentCard';
import { useClassroomStore } from '../../../../store/useClassroomStore';
import { useModalContext } from '../../../../context/ModalContext';
import { UI_THEME, MODAL_ID } from '../../../../constants';

const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.isEditingList !== nextProps.isEditingList) return false;
  if (prevProps.displayMode !== nextProps.displayMode) return false;
  if (prevProps.appMode !== nextProps.appMode) return false;
  return true;
};

const ManagementTab = ({
  // 這些 UI 狀態仍需保留
  isEditingList, setIsEditingList,
  onImportList,
  onStudentClick, onDragStart,
  onDrop,
  displayMode, appMode,
  // ★ 移除所有 Modal 相關 props (onOpenAttendance, onShowDialog...)
}) => {
  const classes = useClassroomStore(state => state.classes);
  const currentClassId = useClassroomStore(state => state.currentClassId);
  const setCurrentClassId = useClassroomStore(state => state.setCurrentClassId);
  const addClass = useClassroomStore(state => state.addClass);
  const updateClass = useClassroomStore(state => state.updateClass);
  const deleteClass = useClassroomStore(state => state.deleteClass);
  const toggleLock = useClassroomStore(state => state.toggleLock);

  const currentClass = classes.find(c => c.id === currentClassId);

  const unseatedStudents = React.useMemo(() => {
    if (!currentClass || !currentClass.students) return [];
    const layout = currentClass.layout;
    if (!layout || !layout.seats) return currentClass.students;
    const seatedIds = new Set(Object.values(layout.seats));
    return currentClass.students.filter(student => !seatedIds.has(student.id));
  }, [currentClass]);

  // ★ 直接取得控制權
  const { openModal, openDialog, closeDialog } = useModalContext();

  const importTextRef = useRef(null);
  const todayDate = new Date().toLocaleDateString('en-CA');
  const currentAttendanceStatus = currentClass?.attendanceRecords?.[todayDate] || {};

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const sourceSeat = e.dataTransfer.getData("sourceSeat");
    if (sourceSeat && onDrop) {
      onDrop(sourceSeat);
    }
  };

  const handleAddClass = () => {
    openDialog({
      type: 'prompt',
      title: '新增班級',
      message: '請輸入新班級的名稱：',
      placeholder: '例如：一年二班',
      confirmText: '新增',
      onConfirm: (name) => {
        if (name && name.trim()) addClass(name);
        closeDialog();
      }
    });
  };

  const handleEditClassName = () => {
    openDialog({
      type: 'prompt',
      title: '重新命名',
      message: `請輸入「${currentClass.name}」的新名稱：`,
      defaultValue: currentClass.name,
      confirmText: '更新',
      onConfirm: (newName) => {
        if (newName && newName.trim()) updateClass({ ...currentClass, name: newName.trim() });
        closeDialog();
      }
    });
  };

  const handleDeleteClass = () => {
    if (classes.length <= 1) {
      openDialog({
        type: 'alert',
        title: '無法刪除',
        message: '這是最後一個班級，無法刪除。',
        variant: 'warning',
        onConfirm: closeDialog
      });
      return;
    }

    openDialog({
      type: 'confirm',
      title: '刪除班級',
      message: `確定要刪除「${currentClass.name}」嗎？\n此動作無法復原，所有相關的學生與紀錄將被移除。`,
      variant: 'danger',
      confirmText: '確認刪除',
      onConfirm: () => {
        deleteClass();
        closeDialog();
      }
    });
  };

  const handleLocalImportList = () => {
    if (importTextRef.current && onImportList) {
      onImportList(importTextRef.current.value);
    }
  };

  return (
    <>
      <div className={`p-4 space-y-2 border-b ${UI_THEME.BORDER_LIGHT}`}>
        {/* 標題與班級操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY} truncate max-w-[140px]`} title={currentClass.name}>{currentClass.name}</span>
            <button onClick={handleEditClassName} className={`p-1 rounded-md ${UI_THEME.BTN_GHOST}`}><Edit3 size={14} /></button>
            <button onClick={handleDeleteClass} className={`p-1 rounded-md transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30`}><Trash2 size={14} /></button>
          </div>
          <button onClick={handleAddClass} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-xs flex items-center gap-1 transition-colors"><Plus size={14} /> 新增</button>
        </div>

        {/* 班級列表 */}
        <div className="grid grid-cols-2 gap-2 pb-2">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setCurrentClassId(c.id)}
              className={`px-2 py-1.5 rounded-md text-xs font-bold whitespace-nowrap border transition-colors truncate 
                      ${c.id === currentClass.id ? UI_THEME.BTN_PRIMARY : UI_THEME.BTN_SECONDARY}
                    `}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* 功能按鈕區 - 改用 openModal */}
        <div className={`grid grid-cols-2 gap-2 mb-2 pt-2 border-t border-dashed ${UI_THEME.BORDER_DEFAULT}`}>
          <button onClick={() => openModal(MODAL_ID.ATTENDANCE)} className="py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"><CalendarCheck size={14} /> 點名</button>
          <button onClick={() => openModal(MODAL_ID.BATCH_GROUP)} className="py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"><Layers size={14} /> 批次分組</button>
        </div>

        {/* 備份還原 (這裡使用 GlobalBackupModal，也可以考慮改為 openModal 統一管理，但目前維持原狀即可) */}
        {/* 注意：GlobalBackupModal 目前是在 Sidebar 父層透過 state 控制，我們可以暫時保留透過 props 傳入 onOpenBackup，或是將 GlobalBackupModal 也移入 Context 管理。
              為了簡化，這裡假設 Sidebar 還是會傳 onOpenBackup 進來（因為這不是標準 Modal 系統的一部分）。
           */}
      </div>

      {/* 未排座位區 (無變更) */}
      <div
        className={`flex-1 overflow-hidden flex flex-col transition-colors duration-200 ${unseatedStudents.length === 0 ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={`px-4 py-2 border-y ${UI_THEME.BORDER_LIGHT} flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50`}>
          <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED}`}>未排座位 ({unseatedStudents.length})</span>
          <button
            onClick={() => setIsEditingList(true)}
            className={`p-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-bold text-xs flex items-center gap-1 transition-colors`}
            title="匯入名單"
          >
            <UserPlus size={14} /> 匯入學生
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
          {isEditingList ? (
            <div className="h-full flex flex-col gap-2">
              <textarea
                ref={importTextRef}
                className={`flex-1 w-full p-2 ${UI_THEME.INPUT_BASE} text-sm font-mono resize-none`}
                placeholder="格式：座號 姓名 [性別] [組別] [參考成績]"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsEditingList(false)} className={`flex-1 py-2 ${UI_THEME.BTN_SECONDARY} text-sm font-bold`}>取消</button>
                <button onClick={handleLocalImportList} className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white shadow hover:bg-blue-700 transition-colors">儲存</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 content-start min-h-full">
              {unseatedStudents.map(student => (
                <div key={student.id} className="aspect-[3/2]">
                  <StudentCard
                    student={student}
                    onDragStart={(e) => onDragStart(e, student.id)}
                    onClick={() => onStudentClick(student)}
                    displayMode={displayMode}
                    mode={appMode}
                    attendanceStatus={currentAttendanceStatus}
                    onToggleLock={toggleLock}
                  />
                </div>
              ))}
              {unseatedStudents.length === 0 && (
                <div className={`col-span-2 text-center py-8 ${UI_THEME.TEXT_MUTED} text-sm flex flex-col items-center gap-2 pointer-events-none opacity-60`}>
                  <Box className="text-slate-300 dark:text-slate-600" size={32} />
                  <span>全數已排位</span>
                  <span className="text-xs text-slate-300 dark:text-slate-600 mt-2">將學生拖曳至此以移除座位</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(ManagementTab, arePropsEqual);