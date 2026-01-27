import React, { useRef, useState } from 'react';
import { 
  Users, BarChart3, PanelLeftClose, Edit3, Trash2, Plus, 
  CalendarCheck, Layers, Download, Upload, RotateCcw, RotateCw,
  Box, Trophy, Table, Settings2, User, Copy, Settings, History, Clock
} from 'lucide-react';
import GlobalBackupModal from '../../../components/common/GlobalBackupModal';
import StudentCard from '../../../components/business/StudentCard';
import { useClassroomContext } from '../../../context/ClassroomContext';
import { UI_THEME } from '../../../utils/constants'; 


const Sidebar = ({
  // UI 狀態 (從父層傳入)
  isOpen, onClose,
  activeTab, setActiveTab,
  onShowDialog,
  // 未排座位區 UI 狀態與互動
  isEditingList, setIsEditingList, 
  onImportList,
  onStudentClick, onDragStart, 
  onDrop, 
  
  // Modal 開關 (UI 控制)
  onOpenAttendance, 
  onOpenBatchGroup,
  onOpenExportStats, 
  onOpenSettings,
  
  // 顯示設定
  displayMode, appMode
}) => {
  const { 
    classes, currentClass, setCurrentClassId, unseatedStudents, 
    addClass, updateClass, deleteClass, importData,
    historyIndex, historyLength, clearScoreLogs ,toggleLock
  } = useClassroomContext();

  
  const fileInputRef = useRef(null);
  const importTextRef = useRef(null);
  const { undo, redo, canUndo, canRedo } = useClassroomContext();
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');
  const currentAttendanceStatus = currentClass?.attendanceRecords?.[today] || {};

  if (!isOpen) return null;

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
		onShowDialog({
			type: 'prompt',
			title: '新增班級',
			message: '請輸入新班級的名稱：',
			placeholder: '例如：一年二班',
			confirmText: '新增',
			onConfirm: (name) => {
				if (name && name.trim()) addClass(name);
			}
		});
	  };

  const handleEditClassName = () => {
    onShowDialog({
        type: 'prompt',
        title: '重新命名',
        message: `請輸入「${currentClass.name}」的新名稱：`,
        defaultValue: currentClass.name,
        confirmText: '更新',
        onConfirm: (newName) => {
            if (newName && newName.trim()) updateClass({ ...currentClass, name: newName.trim() });
        }
    });
  };

  const handleDeleteClass = () => {
    if (classes.length <= 1) { 
        onShowDialog({
            type: 'alert',
            title: '無法刪除',
            message: '這是最後一個班級，無法刪除。',
            variant: 'warning'
        });
        return; 
    }
    
    onShowDialog({
        type: 'confirm',
        title: '刪除班級',
        message: `確定要刪除「${currentClass.name}」嗎？\n此動作無法復原，所有相關的學生與紀錄將被移除。`,
        variant: 'danger', // 紅色按鈕
        confirmText: '確認刪除',
        onConfirm: () => deleteClass()
    });
  };

  const handleLocalImportList = () => {
      if (importTextRef.current && onImportList) {
          onImportList(importTextRef.current.value);
      }
  };


  // --- 內部渲染：管理分頁 ---
  const renderManagementTab = () => (
    <>
      <div className={`p-4 space-y-2 border-b ${UI_THEME.BORDER_LIGHT}`}>
          {/* 標題與班級操作 */}
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY} truncate max-w-[140px]`} title={currentClass.name}>{currentClass.name}</span>
                  <button onClick={handleEditClassName} className={`p-1 rounded-md ${UI_THEME.BTN_GHOST}`}><Edit3 size={14}/></button>
                  <button onClick={handleDeleteClass} className={`p-1 rounded-md transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30`}><Trash2 size={14}/></button>
              </div>
              <button onClick={handleAddClass} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold text-xs flex items-center gap-1 transition-colors"><Plus size={14}/> 新增</button>
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
          
          {/* 功能按鈕區 */}
          <div className={`grid grid-cols-2 gap-2 mb-2 pt-2 border-t border-dashed ${UI_THEME.BORDER_DEFAULT}`}>
            <button onClick={onOpenAttendance} className="py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"><CalendarCheck size={14}/> 點名</button>
            <button onClick={onOpenBatchGroup} className="py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"><Layers size={14}/> 批次分組</button>
          </div>
          
          {/* 備份還原 */}

		  <button 
            onClick={() => setIsBackupOpen(true)} 
            className={`w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors`}
          >
            <Download size={14}/> 系統資料備份/還原
          </button>

      </div>
      
      {/* 未排座位區 */}
      <div 
        className={`flex-1 overflow-hidden flex flex-col transition-colors duration-200 ${unseatedStudents.length === 0 ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
          <div className={`px-4 py-2 border-y ${UI_THEME.BORDER_LIGHT} flex justify-between items-center pointer-events-none bg-slate-50/50 dark:bg-slate-800/50`}>
              <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED}`}>未排座位 ({unseatedStudents.length})</span>
              <button onClick={() => setIsEditingList(true)} className={`p-1.5 rounded-lg ${UI_THEME.TEXT_MUTED} hover:text-blue-600 dark:hover:text-blue-400 pointer-events-auto transition-colors`} title="匯入名單"><Edit3 size={16}/></button>
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
                            <Box className="text-slate-300 dark:text-slate-600" size={32}/>
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

  // --- 內部渲染：分數分頁 ---
  const renderScoresTab = () => {
    const studentRanking = [...currentClass.students]
        .filter(s => s.score !== undefined && s.score !== 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10); 

    const logs = currentClass.scoreLogs ? [...currentClass.scoreLogs].reverse() : [];

    return (
    <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/30 overflow-hidden">
       {/* 頂部功能區 */}
       <div className={`p-4 ${UI_THEME.SURFACE_MAIN} border-b ${UI_THEME.BORDER_LIGHT} flex flex-col gap-3`}>
           <div className="flex justify-between items-center">
              <h3 className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY} flex items-center gap-2`}><Trophy size={16} className="text-yellow-500"/> 分數統計</h3>
              <button onClick={onOpenExportStats} className={`p-1.5 rounded ${UI_THEME.BTN_GHOST}`} title="匯出成績">
                <Table size={16}/>
             </button>
           </div>
           
           <button 
             onClick={onOpenSettings} 
             className={`w-full py-2 ${UI_THEME.BTN_PRIMARY} rounded-lg text-xs font-bold flex items-center justify-center gap-2`}
           >
              <Settings2 size={14}/> 評分項目設定
           </button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* 個人風雲榜 (Top 10) */}
          <div>
             <h4 className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} mb-2 uppercase tracking-wider flex items-center gap-1`}><User size={12}/> 個人風雲榜 (Top 10)</h4>
             <div className={`${UI_THEME.SURFACE_CARD} rounded-xl border ${UI_THEME.BORDER_LIGHT} shadow-sm overflow-hidden`}>
                {studentRanking.length > 0 ? (
                    <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {studentRanking.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className={`p-2 w-8 text-center font-bold ${UI_THEME.TEXT_MUTED}`}>
                                        {idx < 3 ? <Trophy size={12} className={idx===0?'text-yellow-500':idx===1?'text-slate-400':'text-amber-600'}/> : idx + 1}
                                    </td>
                                    <td className={`p-2 font-bold ${UI_THEME.TEXT_PRIMARY}`}>{s.name}</td>
                                    <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className={`text-center text-xs ${UI_THEME.TEXT_MUTED} py-4`}>尚無個人分數</div>}
             </div>
          </div>

          {/* 近期動態 (Recent Activity) */}
          <div>
             <div className="flex justify-between items-center mb-2">
                 <h4 className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} uppercase tracking-wider flex items-center gap-1`}><History size={12}/> 近期動態 (最新15筆)</h4>
                 {logs.length > 0 && (
                     <button 
                        onClick={() => onShowDialog({
						  type: 'confirm',
						  title: '清除紀錄',
						  message: '確定清除所有近期動態紀錄嗎？',
						  variant: 'warning',
						  onConfirm: () => clearScoreLogs()
					  })} >
                         <Trash2 size={12}/>
                     </button>
                 )}
             </div>
             <div className="space-y-2">
                {logs.length > 0 ? logs.slice(0, 15).map((log, idx) => (
                    <div key={idx} className={`${UI_THEME.SURFACE_CARD} p-2 rounded-lg border ${UI_THEME.BORDER_LIGHT} shadow-sm flex items-start gap-2 text-xs`}>
                        <div className={`mt-0.5 min-w-[3px] h-3 rounded-full ${log.score > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                        
                        <div className="flex-1 min-w-0"> 
                            <div className="flex justify-between items-center mb-0.5">
                                <span className={`font-bold ${UI_THEME.TEXT_PRIMARY} truncate mr-2`} title={log.targetName}>
                                    {log.targetName || '未知目標'}
                                </span>
                                <span className={`${UI_THEME.TEXT_MUTED} text-[10px] flex items-center gap-0.5 whitespace-nowrap`}>
                                    <Clock size={8}/> 
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            <div className={`${UI_THEME.TEXT_SECONDARY} flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded`}>
                                <span className="truncate max-w-[100px]" title={log.behaviorLabel}>
                                    {log.behaviorLabel || '評分'}
                                </span>
                                <span className={`font-mono font-bold ${log.score > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {log.score > 0 ? '+' : ''}{log.score}
                                </span>
                            </div>
                        </div>
                    </div>
                )) : <div className={`text-center text-xs ${UI_THEME.TEXT_MUTED} py-4 border-2 border-dashed ${UI_THEME.BORDER_DEFAULT} rounded-lg`}>尚無紀錄</div>}
             </div>
          </div>

       </div>
    </div>
  )};

  return (
    <div className={`${UI_THEME.SURFACE_MAIN} border-r ${UI_THEME.BORDER_DEFAULT} flex flex-col shadow-lg z-20 shrink-0 transition-all duration-300 ease-in-out relative no-print ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full border-r-0 opacity-0 overflow-hidden'}`}>
		<GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
        <div className="w-80 h-full flex flex-col">
          {/* Tabs 區域 - 這裡使用稍微不同的背景色以區分 Tab */}
          <div className={`flex border-b ${UI_THEME.BORDER_LIGHT} bg-slate-50 dark:bg-slate-800`}>
              <button onClick={() => setActiveTab('management')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'management' ? `${UI_THEME.SURFACE_MAIN} text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400` : `${UI_THEME.TEXT_SECONDARY} hover:bg-slate-100 dark:hover:bg-slate-700`}`}><Users size={16}/> 班級管理</button>
              <button onClick={() => setActiveTab('scores')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'scores' ? `${UI_THEME.SURFACE_MAIN} text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400` : `${UI_THEME.TEXT_SECONDARY} hover:bg-slate-100 dark:hover:bg-slate-700`}`}><BarChart3 size={16}/> 分數統計</button>
              <button onClick={onClose} className={`px-3 ${UI_THEME.TEXT_MUTED} hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-l ${UI_THEME.BORDER_DEFAULT}`}><PanelLeftClose size={16}/></button>
          </div>
          
          {activeTab === 'management' ? renderManagementTab() : renderScoresTab()}
          
          {/* Footer 區域 */}
          <div className={`p-4 pl-20 border-t ${UI_THEME.BORDER_LIGHT} bg-slate-50 dark:bg-slate-800 flex items-center justify-between pb-6`}>
             <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} whitespace-nowrap`}>操作紀錄</span>
             <div className="flex gap-2">
                 <button onClick={undo} disabled={!canUndo} className={`p-2 ${UI_THEME.BTN_SECONDARY} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed`} title="復原 (Undo)"><RotateCcw size={16}/></button>
                 <button onClick={redo} disabled={!canRedo} className={`p-2 ${UI_THEME.BTN_SECONDARY} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed`} title="重做 (Redo)"><RotateCw size={16}/></button>
             </div>
          </div>
        </div>
    </div>
  );
};

export default Sidebar;