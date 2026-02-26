import React from 'react';
import { 
  PanelLeft, // 🌟 替換 List，更像側邊欄
  ZoomIn, ZoomOut, Import, Highlighter, Trash2, 
  BookA, // 🌟 替換 BookOpen，帶有字母A更像字典
  Share2, Loader2, Play, LogOut, Cloud
} from 'lucide-react'; 
import { UI_THEME } from '../../../utils/constants';

const SUBJECT_OPTIONS = [
  { id: 'general', label: '通用 (國語/社會)' },
  { id: 'math', label: '數學科' },
  { id: 'english', label: '英文科' },
  { id: 'science', label: '自然科' }
];

const ExamHeader = ({ 
  isSidebarOpen, setIsSidebarOpen, 
  zoomLevel, setZoomLevel, 
  onOpenImport,
  isKaraokeMode, setIsKaraokeMode,
  onOpenDict,
  examList = [],
  activeExamId,
  onSelectExam,
  onDeleteExam,
  onShareExam,
  isSharing,
  isFocusMode, 
  onExitFocusMode,
  onEnterFocusMode,
  onUpdateSubject,
  onOpenHistory
}) => {
	// 取得目前選定考卷的科目，若無則預設為 general
  const currentExam = examList.find(e => e.id === activeExamId);
  const currentSubject = currentExam?.subject || 'general';
	
  return (
    <header className={`min-h-[4rem] py-2 flex flex-wrap items-center justify-between px-3 sm:px-5 gap-y-3 border-b ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS}`}>
      
      {/* ================= 1. 左側：導覽與定位區 ================= */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* 側邊欄開關：換成 PanelLeft 更直觀 */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-xl transition-all shadow-sm border ${isSidebarOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          title="切換題目列表"
        >
          <PanelLeft size={20} />
        </button>

        {isFocusMode ? (
          <div className="px-2 py-1 font-bold text-lg text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[400px]">
            {examList.find(e => e.id === activeExamId)?.title || '考試報讀中'}
          </div>
        ) : (
          // 🌟 考卷選擇與刪除：結合成一個精緻的 Combo 元件
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden h-10">
            <select 
              value={activeExamId || ''} 
              onChange={(e) => onSelectExam(e.target.value)}
              disabled={examList.length === 0}
              className="px-3 h-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer disabled:cursor-not-allowed max-w-[150px] sm:max-w-[250px] truncate border-r border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
            >
              {examList.length === 0 ? (
                <option value="">請先匯入考卷...</option>
              ) : (
                examList.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)
              )}
            </select>
			
			{activeExamId && (
      
        <select 
          value={currentSubject}
          onChange={(e) => onUpdateSubject(activeExamId, e.target.value)}
          className="px-3 h-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer disabled:cursor-not-allowed max-w-[150px] sm:max-w-[250px] truncate border-r border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
          title="切換報讀語音字典科目"
        >
          {SUBJECT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      
    )}

            <button 
              onClick={onDeleteExam}
              disabled={!activeExamId}
              className="px-3 h-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="刪除這份考卷"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* ================= 右側大區塊 ================= */}
      <div className="flex items-center gap-3 sm:gap-4">
         
         {/* ================= 2. 中右側：閱讀輔助區 (工具箱概念) ================= */}
         <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-inner">
            
            {/* 字體縮放 */}
            <div className="flex items-center px-1">
              <button onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))} className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 hover:shadow-sm transition-all"><ZoomOut size={16} /></button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.1))} className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 hover:shadow-sm transition-all"><ZoomIn size={16} /></button>
            </div>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>

            {/* 指讀開關 */}
            <button onClick={() => setIsKaraokeMode(!isKaraokeMode)} className={`p-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-bold ${isKaraokeMode ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`} title="指讀模式">
              <Highlighter size={16} />
              <span>指讀</span>
            </button>

            {/* 發音字典 (只有編輯模式顯示) */}
            {!isFocusMode && (
              <>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <button onClick={onOpenDict} className="p-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm" title="自訂發音字典">
                  <BookA size={16} />
                  <span>字典</span>
                </button>
              </>
            )}
         </div>

         {/* ================= 3. 最右側：考卷管理與模式切換 ================= */}
{isFocusMode ? (
  <button 
    onClick={onExitFocusMode} 
    className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 rounded-xl transition-all font-bold shadow-sm active:scale-95"
  >
    <LogOut size={18} />
    <span className="hidden sm:inline text-sm">結束考試</span>
  </button>
) : (
  <div className="flex items-center gap-3">
    
    {/* 🌟 1. 匯入：維持淺藍色，但加入 active 效果 */}
    <button 
      onClick={onOpenImport} 
      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 dark:bg-blue-900/20 hover:dark:bg-blue-700 dark:border-blue-800 dark:hover:border-blue-300 dark:text-blue-400 hover:dark:text-blue-300 rounded-xl transition-all font-bold shadow-sm active:scale-95"
    >
      <Import size={18} />
      <span className="hidden lg:inline text-sm">匯入</span>
    </button>

    {/* 🌟 2. 派送與管理群組：Split Button (一體成型設計) */}
    {/* 修改：外層負責邊框與圓角，內層負責背景色與互動 */}
    <div className="flex items-center h-10 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
      
      {/* 左半部：主要派送按鈕 */}
      <button 
        onClick={onShareExam} 
        disabled={!activeExamId || isSharing} 
        className="h-full px-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="派送目前考卷"
      >
        {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
        <span className="hidden lg:inline text-sm font-bold">派送</span>
      </button>

      {/* 中間分隔線：使用 Emerald 色系讓整體感一致 */}
      <div className="w-px h-5 bg-emerald-200 dark:bg-emerald-700 mx-0.5"></div>
      
      {/* 右半部：管理按鈕 */}
      <button 
        onClick={onOpenHistory}
        className="h-full px-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors flex items-center justify-center"
        title="管理已派送考卷"
      >
        <Cloud size={18} />
      </button>
    </div>

    {/* 🌟 3. 進入考試：最強烈的視覺權重 (Indigo 實心) */}
    <button 
      onClick={onEnterFocusMode} 
      disabled={!activeExamId} 
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-md shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed ml-1"
    >
      <Play size={16} className="fill-current" />
      <span className="hidden sm:inline text-sm">進入考試</span>
    </button>

  </div>
)}

      </div>
    </header>
  );
};

export default ExamHeader;