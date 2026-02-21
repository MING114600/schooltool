import React from 'react';
import { List, ZoomIn, ZoomOut, FileText, Highlighter, Trash2, BookOpen, Share2, Loader2, Play, LogOut } from 'lucide-react'; // 🌟 新增 Play, LogOut 圖示
import { UI_THEME } from '../../../utils/constants';

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
  onEnterFocusMode // 🌟 記得從 ExamReader 傳入這個新 Props
}) => {
  return (
    <header className={`min-h-[3.5rem] py-2 flex flex-wrap items-center justify-between px-2 sm:px-4 gap-y-2 border-b ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS}`}>
      
{/* ================= 左側區塊 ================= */}
      <div className="flex items-center gap-1 sm:gap-3">
        
        {/* 🌈【永遠顯示】側邊欄開關 (讓學生可以自由開關題目列表) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
        >
          <List size={20} />
        </button>

        {isFocusMode ? (
          // 🛑【考試模式】左側：只顯示乾淨的考卷標題
          <div className="px-2 py-1 font-bold text-lg text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[400px] ml-1 sm:ml-2">
            {examList.find(e => e.id === activeExamId)?.title || '考試報讀中'}
          </div>
        ) : (
          // 🟢【編輯模式】左側：考卷下拉選單 + 刪除 (老師管理專區)
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
            <select 
              value={activeExamId || ''} 
              onChange={(e) => onSelectExam(e.target.value)}
              disabled={examList.length === 0}
              className="p-1.5 px-2 sm:px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed max-w-[130px] sm:max-w-[200px] truncate"
            >
              {examList.length === 0 ? (
                <option value="">請先匯入考卷...</option>
              ) : (
                examList.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))
              )}
            </select>

            <button 
              onClick={onDeleteExam}
              disabled={!activeExamId}
              className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="刪除這份考卷"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
      
      {/* ================= 右側區塊 ================= */}
      <div className="flex items-center gap-1 sm:gap-2">
         
         {/* 🌈【永遠顯示】無障礙輔助：字體大小 */}
         <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-1 sm:mr-2">
			  <button 
				onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))} 
				className="p-1 sm:p-1.5 rounded text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
			  >
				<ZoomOut size={16} className="sm:w-[18px] sm:h-[18px]" />
			  </button>
			  
			  <span className="px-1 sm:px-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 w-12 sm:w-16 text-center">
				{Math.round(zoomLevel * 100)}%
			  </span>
			  
			  <button 
				onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.1))} 
				className="p-1 sm:p-1.5 rounded text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
			  >
				<ZoomIn size={16} className="sm:w-[18px] sm:h-[18px]" />
			  </button>
			</div>

         {/* 🌈【永遠顯示】無障礙輔助：指讀開關 */}
         <button onClick={() => setIsKaraokeMode(!isKaraokeMode)} className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 font-medium ${isKaraokeMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
           <Highlighter size={18} className="sm:w-[20px] sm:h-[20px]" />
           <span className="text-sm hidden sm:inline">指讀</span>
         </button>

         {/* ================= 模式分流按鈕群 ================= */}
         {isFocusMode ? (
           // 🛑【考試模式】專屬：退出按鈕
           <button 
             onClick={onExitFocusMode}
             className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors font-bold"
             title="退出考試模式 (恢復編輯功能)"
           >
             <LogOut size={18} />
             <span className="hidden sm:inline text-sm">結束考試</span>
           </button>
         ) : (
           // 🟢【編輯模式】專屬：字典、派送、匯入、進入考試
           <>
             {/* 發音字典 */}
             <button onClick={onOpenDict} className="p-1.5 sm:p-2 rounded-lg transition-colors text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30" title="自訂發音字典">
               <BookOpen size={18} className="sm:w-[20px] sm:h-[20px]" />
             </button>
             
             {/* 派送按鈕 */}
             <button 
               onClick={onShareExam}
               disabled={!activeExamId || isSharing}
               className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
               title="將考卷派送給學生"
             >
               {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
               <span className="hidden xl:inline text-sm">{isSharing ? '產生中...' : '派送'}</span>
             </button>

             {/* 匯入按鈕 */}
             <button onClick={onOpenImport} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white rounded-lg transition-colors shadow-sm font-medium">
               <FileText size={18} />
               <span className="hidden xl:inline text-sm">匯入</span>
             </button>

             {/* 🌟 新增：手動進入考試模式按鈕 */}
             <button 
               onClick={onEnterFocusMode}
               disabled={!activeExamId}
               className="flex items-center gap-1 sm:gap-2 ml-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
               title="全螢幕進入學生專注考試模式"
             >
               <Play size={18} />
               <span className="hidden sm:inline text-sm">進入考試</span>
             </button>
           </>
         )}

      </div>
    </header>
  );
};

export default ExamHeader;