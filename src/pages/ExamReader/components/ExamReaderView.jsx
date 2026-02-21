import React, { useState, useEffect } from 'react';
import { UI_THEME } from '../../../utils/constants';
import { useOS } from '../../../context/OSContext';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';
import { ArrowUp, ArrowDown, Edit3 } from 'lucide-react';

const ExamReaderView = ({ currentItem, zoomLevel = 1.0, isKaraokeMode, highlightRange, onWordClick, onMoveMedia, onOpenEdit, isFocusMode }) => {
  const { isGlobalZhuyin } = useOS();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentItem]);

  return (
    // ✅ RWD: 在小螢幕時縮小 padding (p-4 sm:p-8)
    <main 
      className={`flex-1 flex flex-col p-4 sm:p-8 ${UI_THEME.CONTENT_AREA} overflow-y-auto`}
      style={{ '--font-scale': zoomLevel }}
    >
      {/* 🌟 3. 新增：右上角的絕對定位編輯按鈕 */}
      {/* 這裡設定為絕對定位 (absolute)，並靠右上角對齊 */}
	  {!isFocusMode && (
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button 
          onClick={onOpenEdit}
          className="p-2 sm:p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800 transition-all flex items-center gap-2 group"
          title="快速編輯此題文字"
        >
          <Edit3 size={18} className="group-hover:scale-110 transition-transform" />
          {/* 在大螢幕時顯示文字，小螢幕只顯示 Icon 保持簡潔 */}
          <span className="hidden sm:inline text-sm font-bold">編輯題目</span>
        </button>
      </div>
	  )}
      {currentItem ? (
        <div className={`
          max-w-5xl w-full mx-auto p-6 sm:p-12 rounded-2xl sm:rounded-3xl shadow-lg border transition-all duration-300
          ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}
          ${currentItem.type === 'section' ? 'bg-slate-50 dark:bg-slate-800/50 text-center' : 'text-left'} 
        `}>
          
          {/* ✅ 1. 渲染文字題幹 (改用 style 套用絕對 pixel 字級) */}
          {currentItem.text && (
             <div 
               className="mb-6 whitespace-pre-wrap leading-relaxed text-[calc(2.5rem*var(--font-scale))]"
             >
               <ZhuyinRenderer 
                 text={currentItem.text}
                 globalOffset={0} /* ✅ 題幹永遠從 0 開始 */
                 isActive={isGlobalZhuyin}
                 isKaraokeMode={isKaraokeMode}
                 highlightRange={highlightRange}
                 onWordClick={onWordClick} 
                 className={`font-bold tracking-wide ${UI_THEME.TEXT_PRIMARY}`}
               />
             </div>
          )}

          {/* ✅ 2. 依序渲染附加元素（圖片與表格） */}
          {currentItem.elements && currentItem.elements.map((el, index) => {
            // 處理圖片
            if (el.type === 'image') {
              return (
                <div key={el.id || index} className="mt-8 flex flex-col items-center relative group">
				{/* ✅ 手動微調工具列 (Hover 時顯示) */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 z-10">
                    <button onClick={() => onMoveMedia && onMoveMedia(currentItem.id, el.id, 'up')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="將圖片移至上一題">
                      <ArrowUp size={18} />
                    </button>
                    <button onClick={() => onMoveMedia && onMoveMedia(currentItem.id, el.id, 'down')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="將圖片移至下一題">
                      <ArrowDown size={18} />
                    </button>
                  </div>
                  
                  {imgError || !el.src || !el.src.startsWith('data:image') ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-800 w-full max-w-2xl">
                      <div className="text-rose-500 dark:text-rose-400 font-bold text-lg sm:text-xl mb-3">⚠️ 無法顯示部分圖形</div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed text-center">
                        Word 內的繪圖物件無法直接轉換。<br/>
                        請在 Word 中使用截圖 (<kbd className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded shadow-sm mx-1">Win+Shift+S</kbd>) 取代原圖後重新匯入。
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={el.src} 
                      alt={`考卷附圖 ${index + 1}`} 
                      className="max-w-full max-h-[50vh] rounded-2xl shadow-sm object-contain"
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
              );
            }

            // 處理表格
            if (el.type === 'table') {
              return (
                // ✅ RWD: overflow-x-auto 讓表格在手機上可以橫向滑動，避免撐破版面
                <div key={el.id || index} className="mt-8 flex flex-col items-center w-full relative group">
				{/* ✅ 手動微調工具列 (Hover 時顯示) */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 z-10">
                    <button onClick={() => onMoveMedia && onMoveMedia(currentItem.id, el.id, 'up')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="將表格移至上一題">
                      <ArrowUp size={18} />
                    </button>
                    <button onClick={() => onMoveMedia && onMoveMedia(currentItem.id, el.id, 'down')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="將表格移至下一題">
                      <ArrowDown size={18} />
                    </button>
                  </div>                  
                  <table className={`w-full min-w-[500px] border-collapse border ${UI_THEME.BORDER_DEFAULT}`}>
                    <tbody>
                      {el.rows.map((row, rIndex) => (
                        <tr key={rIndex}>
                          {row.map((cellText, cIndex) => (
                            <td 
							  key={cIndex} 
							  className={`border ${UI_THEME.BORDER_DEFAULT} p-3 sm:p-4 align-top whitespace-pre-wrap leading-relaxed break-words text-[calc(2.25rem*var(--font-scale))]`}
							>
							  {/* ✅ 支援渲染儲存格內的陣列 (文字與圖片混合) */}
							  {cellText.map((content, idx) => {
								if (content.type === 'image') {
								  return (
									<img 
									  key={idx} 
									  src={content.src} 
									  alt="表格內圖片" 
									  className="max-w-[200px] max-h-[200px] object-contain my-2 rounded" 
									/>
								  );
								}
								return (
								  <ZhuyinRenderer 
                                    key={idx}
                                    text={content.text}
                                    globalOffset={content.globalOffset || 0} /* ✅ 傳入 Parser 算好的絕對起點 */
                                    isActive={isGlobalZhuyin}
                                    isKaraokeMode={isKaraokeMode}
                                    highlightRange={highlightRange}
                                    onWordClick={onWordClick}
                                    className={`font-bold tracking-wide ${UI_THEME.TEXT_PRIMARY}`}
                                  />
								);
							  })}
							</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            return null;
          })}
        </div>
      ) : (
        <div className={`text-xl sm:text-2xl text-center mt-20 ${UI_THEME.TEXT_MUTED}`}>請匯入試卷或選擇題目</div>
      )}
    </main>
  );
};

export default ExamReaderView;