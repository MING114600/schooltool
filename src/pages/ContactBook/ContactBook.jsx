import React, { useEffect, useState } from 'react';
import StandardAppLayout from '../../components/common/layout/StandardAppLayout';
import { useContactBookStore } from '../../store/useContactBookStore';
import { Calendar, PenTool, Printer, Download, BookOpen, Clock, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import ContactBookEditor from './components/ContactBookEditor';
import QuickTemplatePanel from './components/QuickTemplatePanel';
import PrintPreviewModal from './components/PrintPreviewModal';
import HistoryCalendar from './components/HistoryCalendar';
import { useOS } from '../../context/OSContext';
import { formatMinguoDate } from './utils/dateUtils';
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const ContactBook = () => {
    // Zustand State
    const initStore = useContactBookStore(state => state.initStore);
    const isLoading = useContactBookStore(state => state.isLoading);
    const logs = useContactBookStore(state => state.logs);
    const currentLog = useContactBookStore(state => state.currentLog);
    const loadLogForDate = useContactBookStore(state => state.loadLogForDate);
    const editorZoom = useContactBookStore(state => state.editorZoom);
    const setEditorZoom = useContactBookStore(state => state.setEditorZoom);
    const writingMode = useContactBookStore(state => state.writingMode);
    const setWritingMode = useContactBookStore(state => state.setWritingMode);
    const undo = useContactBookStore(state => state.undo);
    const redo = useContactBookStore(state => state.redo);
    const undoStack = useContactBookStore(state => state.undoStack);
    const redoStack = useContactBookStore(state => state.redoStack);
    const addItemToCurrentLog = useContactBookStore(state => state.addItemToCurrentLog);
    const reorderItemsInCurrentLog = useContactBookStore(state => state.reorderItemsInCurrentLog);
    const { isGlobalZhuyin } = useOS();

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(true); // 控制右側面板
    const [isFocusMode, setIsFocusMode] = useState(false); // 投影時專注模式
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // 初始化載入
    useEffect(() => {
        initStore();
    }, [initStore]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const [activeId, setActiveId] = useState(null);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        // 如果拖曳的是模板 (id 以 template- 開頭)
        if (active.id.toString().startsWith('template-')) {
            const content = active.data.current?.content;
            if (content) {
                // 找到放下的位置索引
                // 如果放下的對象是現有項目
                const overId = over.id;
                const items = currentLog.items;
                const overIndex = items.findIndex(i => i.id === overId);

                if (overIndex !== -1) {
                    // 插入到該位置
                    addItemToCurrentLog(content, false, overIndex);
                } else {
                    // 否則加到最後
                    addItemToCurrentLog(content, false);
                }
            }
            return;
        }

        // 如果是內部排序
        if (active.id !== over.id) {
            const oldIndex = currentLog.items.findIndex(i => i.id === active.id);
            const newIndex = currentLog.items.findIndex(i => i.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderItemsInCurrentLog(oldIndex, newIndex);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Z → Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Ctrl+Y or Ctrl+Shift+Z → Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
            // Ctrl+P → Print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                setIsPrintModalOpen(true);
            }
            // Escape → Close modals
            if (e.key === 'Escape') {
                setIsPrintModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="text-slate-500 animate-pulse flex flex-col items-center">
                    <BookOpen size={48} className="mb-4 text-indigo-400" />
                    <span className="font-bold text-lg cursor-default">正在載入智慧聯絡簿...</span>
                </div>
            </div>
        );
    }

    // --- Header 元件 ---
    const renderHeader = () => (
        <div className="flex items-center justify-between px-6 py-3 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white cursor-default">智慧聯絡簿</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 cursor-default">模板化聯絡簿工具與紀錄</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* 顯示模式切換 */}
                {!isFocusMode && (
                    <select
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        value={writingMode}
                        onChange={(e) => setWritingMode(e.target.value)}
                    >
                        <option value="horizontal-tb">橫排顯示</option>
                        <option value="vertical-rl">直排顯示</option>
                    </select>
                )}

                {/* 文字縮放控制 */}
                {!isFocusMode && (
                    <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setEditorZoom(editorZoom - 10)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title="縮小文字"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-center">{editorZoom}%</span>
                        <button
                            onClick={() => setEditorZoom(editorZoom + 10)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title="放大文字"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
                )}

                {/* Undo/Redo */}
                {!isFocusMode && (
                    <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={undo}
                            disabled={undoStack.length === 0}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="復原 (Ctrl+Z)"
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={redoStack.length === 0}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="重做 (Ctrl+Y)"
                        >
                            <Redo2 size={16} />
                        </button>
                    </div>
                )}
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                    <PenTool size={16} />
                    {isFocusMode ? '退出投影模式' : '大屏投影模式'}
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    title="匯出與列印"
                >
                    <Download size={18} />
                    <Printer size={18} />
                    輸出
                </button>
            </div>
        </div>
    );

    // --- Sidebar 元件 ---
    const renderSidebar = () => (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
            {/* 月曆瀏覽 */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <HistoryCalendar
                    logs={logs}
                    currentDate={currentLog?.date}
                    onSelectDate={loadLogForDate}
                />
            </div>

            {/* 歷史紀錄列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 cursor-default">歷史紀錄</span>
                </div>
                {logs.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-sm">尚無歷史紀錄</div>
                ) : (
                    logs.map(log => (
                        <button
                            key={log.id}
                            onClick={() => loadLogForDate(log.date)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentLog?.id === log.id
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                                }`}
                        >
                            {log.date} ({log.items?.length || 0} 項)
                        </button>
                    ))
                )}
            </div>

            {/* Helper buttons (暫時隱藏，待優化後再開放) */}
            {/* 
            {currentLog && !isFocusMode && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                    {logs.length > 0 && (
                        <button
                            onClick={() => {
                                const yesterday = logs.find(l => l.id !== currentLog.id);
                                if (yesterday) {
                                    useContactBookStore.getState().copyFromDate(yesterday.date);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <Clock size={16} />
                            複製上次作業
                        </button>
                    )}
                </div>
            )}
            */}
        </div>
    );

    // --- 主畫面 (聯絡簿展示與編輯區) ---
    const renderMainBody = () => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 h-full flex overflow-hidden">
                <div className="flex-1 overflow-hidden relative">
                    <ContactBookEditor isFocusMode={isFocusMode} isGlobalZhuyin={isGlobalZhuyin} />

                    {/* 退出投影模式按鈕 (只在專注模式下顯示) */}
                    {isFocusMode && (
                        <button
                            onClick={() => setIsFocusMode(false)}
                            className="absolute top-6 right-6 z-[100] flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl transition-all"
                        >
                            <X size={24} />
                            <span className="font-bold">退出投影</span>
                        </button>
                    )}
                </div>

                {/* 右側快速插入面板 (專注模式時隱藏，平時可展開/收合) */}
                {!isFocusMode && (
                    <div className={`transition-all duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-20 ${isTemplatePanelOpen ? 'w-72' : 'w-0 border-l-0'}`}>
                        {/* 小小的展開/收合開關 */}
                        <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 z-50">
                            <button
                                onClick={() => setIsTemplatePanelOpen(!isTemplatePanelOpen)}
                                className="p-1 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                title={isTemplatePanelOpen ? '收起面板' : '展開面板'}
                            >
                                {isTemplatePanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                            </button>
                        </div>

                        <div className={`w-72 h-full overflow-hidden transition-opacity duration-300 ${isTemplatePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <QuickTemplatePanel />
                        </div>
                    </div>
                )}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeId ? (
                    <div className="opacity-80 scale-105 pointer-events-none shadow-2xl rounded-xl bg-white dark:bg-slate-800 p-3 border-2 border-indigo-400 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <PenTool size={16} className="text-indigo-500" />
                        <span className="truncate text-sm font-bold">
                            {activeId.toString().startsWith('template-')
                                ? '插入模板內容'
                                : '移動現有項目'}
                        </span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );

    return (
        <div className="w-full h-full border-4 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <StandardAppLayout
                header={renderHeader()}
                sidebar={renderSidebar()}
                sidebarWidth="w-72"
                sidebarOpenWidth="18rem" // 與 Width 相呼應
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isFocusMode={isFocusMode}
            >
                {renderMainBody()}
            </StandardAppLayout>

            <PrintPreviewModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                isGlobalZhuyin={isGlobalZhuyin}
            />
        </div>
    );
};

export default ContactBook;
