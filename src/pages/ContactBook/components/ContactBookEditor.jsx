import React, { useState, useEffect } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useContactBookStore } from '../../../store/useContactBookStore';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';
import { X, AlertOctagon, CheckSquare, Square } from 'lucide-react';
import ContactBookRow from './ContactBookRow';
import { formatMinguoDate } from '../utils/dateUtils';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';


const ContactBookEditor = ({ isFocusMode, isGlobalZhuyin }) => {
    const {
        currentLog,
        updateItemInCurrentLog,
        removeItemFromCurrentLog,
        addItemToCurrentLog,
        reorderItemsInCurrentLog,
        editorZoom,
        writingMode,
        isExporting,
        lastSavedTime
    } = useContactBookStore();

    const [parent] = useAutoAnimate();
    const [showSaveTip, setShowSaveTip] = useState(false);

    useEffect(() => {
        if (lastSavedTime) {
            setShowSaveTip(true);
            const timer = setTimeout(() => setShowSaveTip(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [lastSavedTime]);
    const [inputValue, setInputValue] = useState('');
    const [editingId, setEditingId] = useState(null);

    if (!currentLog) return null;


    const handleAddItem = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            addItemToCurrentLog(inputValue.trim(), false);
            setInputValue('');
        }
    };




    const isVertical = writingMode === 'vertical-rl';

    // 自適應佈局計算（只在橫排模式下作用）
    const itemCount = currentLog.items.length;
    const isTwoCol = !isVertical && itemCount >= 6;
    const dynamicFontSize = (() => {
        // 雙欄模式：6–12 項雙欄本身已降低密度，字型不限制，讓縮放工具正常運作
        // 只有極多項目時才溫和收斂，避免真正爆版
        if (isTwoCol && itemCount >= 17) return Math.min(editorZoom, 70);
        if (isTwoCol && itemCount >= 13) return Math.min(editorZoom, 85);
        return editorZoom;
    })();
    const outerGap = itemCount > 5 ? 'gap-2' : 'gap-4';
    const innerGap = itemCount >= 13 ? 'gap-1' : (itemCount >= 6 ? 'gap-1.5' : 'gap-2');

    const dateString = formatMinguoDate(currentLog.date);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Content Area */}
            <div className={`flex-1 overflow-hidden bg-black/5 dark:bg-black/20 relative flex justify-center items-center`}>
                {/* 黑板 + 板溝槽容器 */}
                <div className="w-[90%] h-[92%] flex flex-col items-center">
                    <div
                        id="contact-book-blackboard"
                        className={`w-full flex-1 rounded-2xl bg-[#274C43] text-white shadow-2xl relative flex flex-col ${writingMode === 'vertical-rl' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`}
                        style={{
                            letterSpacing: '0.1em',
                        }}
                    >
                        {/* 黑板粉筆灰質感背景 */}
                        <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0.8px, transparent 0.8px)', backgroundSize: '24px 24px' }}></div>

                        {/* 文字內容區 — fontSize 只影響這裡 */}
                        <div
                            className={`flex-1 p-6 md:p-10 flex flex-col ${outerGap}`}
                            style={{
                                writingMode: writingMode,
                                textOrientation: 'mixed',
                                fontSize: `${dynamicFontSize}%`
                            }}
                        >

                            {/* 第一行：日期 */}
                            <div className={`group flex items-center gap-3 relative z-10 shrink-0 ${writingMode === 'vertical-rl' ? 'h-full' : 'w-full'}`}>
                                <div className="text-[2.25em]" style={{ color: '#ffeb3b', letterSpacing: '0.1em' }}>
                                    <ZhuyinRenderer text={dateString} isActive={isGlobalZhuyin} writingMode={writingMode} />
                                </div>
                            </div>


                            <SortableContext items={currentLog.items.map(i => i.id)} strategy={isVertical ? horizontalListSortingStrategy : verticalListSortingStrategy}>
                                <div ref={parent} className={isVertical ? 'flex flex-col gap-4 h-full' : isTwoCol ? `grid grid-cols-2 ${innerGap} w-full` : `flex flex-col ${innerGap} w-full`}>
                                    {currentLog.items.map((item, index) => (
                                        <ContactBookRow
                                            key={item.id}
                                            item={item}
                                            index={index}
                                            isFocusMode={isFocusMode}
                                            isVertical={isVertical}
                                            isTwoCol={isTwoCol}
                                            writingMode={writingMode}
                                            isGlobalZhuyin={isGlobalZhuyin}
                                            editingId={editingId}
                                            setEditingId={setEditingId}
                                            updateItemInCurrentLog={updateItemInCurrentLog}
                                            removeItemFromCurrentLog={removeItemFromCurrentLog}
                                            isExporting={isExporting}
                                        />
                                    ))}
                                </div>
                            </SortableContext>


                            {/* 自動儲存提示 */}
                            {!isExporting && lastSavedTime && (
                                <div className={`absolute bottom-4 right-6 no-export flex items-center gap-2 text-white/40 text-sm transition-opacity duration-500 pointer-events-none ${showSaveTip ? 'opacity-100' : 'opacity-0'}`}>
                                    <CheckSquare size={14} className="text-green-400/60" />
                                    <span>已自動儲存於 {lastSavedTime}</span>
                                </div>
                            )}

                            {/* 新增列 */}
                            {!isFocusMode && !isExporting && (
                                <div className={`no-export flex items-center gap-3 relative z-10 mt-4 opacity-70 hover:opacity-100 transition-opacity ${writingMode === 'vertical-rl' ? 'h-full shrink-0' : 'w-full'}`}>
                                    <span className="text-[1.875em] font-bold pb-2">＋</span>
                                    <div className="flex-1 flex w-full">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleAddItem}
                                            placeholder="輸入後按 Enter，或點右側模板"
                                            className="flex-1 bg-transparent border-b-2 border-white/20 text-[1.875em] focus:outline-none focus:border-white px-2 py-1 text-white placeholder:text-white/30 placeholder:text-[0.66em]"
                                            style={{ writingMode: writingMode }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 黑板板溝槽裝飾 */}
                    <div className="no-export w-full flex flex-col items-center select-none pointer-events-none" style={{ marginTop: '-0.5rem' }}>
                        {/* 板槽本體 */}
                        <div className="w-full h-4 rounded-b-lg bg-gradient-to-b from-[#8B7355] via-[#A0896C] to-[#6B5B45] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_2px_6px_rgba(0,0,0,0.4)] relative">
                            {/* 板槽上緣反光 */}
                            <div className="absolute top-0 left-2 right-2 h-[1.5px] bg-white/15 rounded-full"></div>
                        </div>
                        {/* 粉筆和板擦 */}
                        <div className="w-[85%] flex items-end justify-center gap-3 -mt-[14px] relative z-10">
                            <div className="w-[4px] h-[18px] rounded-[1px] bg-white shadow-sm rotate-[-8deg]"></div>
                            <div className="w-[4px] h-[14px] rounded-[1px] bg-yellow-300 shadow-sm rotate-[3deg]"></div>
                            <div className="w-[4px] h-[16px] rounded-[1px] bg-pink-300 shadow-sm rotate-[-2deg]"></div>
                            <div className="w-[36px] h-[14px] rounded-sm bg-gradient-to-b from-[#4a4a4a] to-[#2a2a2a] shadow-md ml-2 flex flex-col justify-end">
                                <div className="w-full h-[4px] bg-[#f5f0e8] rounded-b-sm"></div>
                            </div>
                            <div className="w-[4px] h-[12px] rounded-[1px] bg-sky-300 shadow-sm rotate-[6deg] ml-1"></div>
                            <div className="w-[4px] h-[15px] rounded-[1px] bg-orange-300 shadow-sm rotate-[-4deg]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactBookEditor;
