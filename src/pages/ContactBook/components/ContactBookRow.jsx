import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlertOctagon, X, Square, CheckSquare } from 'lucide-react';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';

const ContactBookRow = ({
    item,
    index,
    isFocusMode,
    isVertical,
    isTwoCol,
    writingMode,
    isGlobalZhuyin,
    editingId,
    setEditingId,
    updateItemInCurrentLog,
    removeItemFromCurrentLog,
    isExporting
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        disabled: isFocusMode // Focus 模式下停用拖曳
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex ${isFocusMode ? 'items-start pt-2 cursor-pointer' : 'items-baseline'} gap-2 md:gap-3 rounded-xl ${isTwoCol ? 'p-0.5 md:p-1' : 'p-1 md:p-2'} transition-all hover:bg-white/5 ${isDragging ? 'bg-white/10 shadow-lg' : ''} ${isVertical ? 'h-full shrink-0' : 'w-full'}`}
            onClick={isFocusMode ? () => updateItemInCurrentLog(item.id, { isChecked: !item.isChecked }) : undefined}
        >
            {/* 拖曳把手 (非 Focus 模式、非匯出時顯示) */}
            {!isFocusMode && !isExporting && (
                <div
                    {...attributes}
                    {...listeners}
                    className={`no-export flex-shrink-0 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/80 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 ${isVertical ? 'self-start mt-4' : 'self-center'}`}
                >
                    <GripVertical size={24} className={isVertical ? 'rotate-90' : ''} />
                </div>
            )}

            {/* 順序編號 */}
            <span className={`${isFocusMode ? 'text-[2.5em] mt-3' : 'text-[1.875em]'} opacity-60 select-none whitespace-nowrap ${item.isChecked ? 'opacity-20 line-through' : ''}`} style={{ textCombineUpright: 'all' }}>
                {index + 1}.
            </span>

            {/* 內文 */}
            {isFocusMode ? (
                <div className={`flex-1 text-[3em] leading-tight md:leading-relaxed select-none transition-all duration-300 ${item.isImportant ? 'text-[color:#ffa0a0]' : 'text-white'} ${item.isChecked ? 'line-through opacity-30 grayscale' : ''}`}>
                    <ZhuyinRenderer text={item.content} isActive={isGlobalZhuyin} writingMode={writingMode} />
                </div>
            ) : (
                <div className="flex-1 flex gap-2 w-full h-full cursor-text" onClick={() => setEditingId(item.id)}>
                    {editingId === item.id ? (
                        <input
                            type="text"
                            value={item.content}
                            autoFocus
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setEditingId(null); }}
                            onChange={(e) => updateItemInCurrentLog(item.id, { content: e.target.value })}
                            className={`flex-1 bg-transparent border-b border-white/30 focus:outline-none focus:border-white text-[1.875em] px-2 py-1 ${item.isImportant ? 'text-[color:#ffa0a0] font-bold border-rose-400/50' : 'text-white'}`}
                            style={{ writingMode: writingMode }}
                        />
                    ) : (
                        <div className={`flex-1 text-[1.875em] px-2 py-1 ${isTwoCol ? 'leading-snug' : 'leading-relaxed'} border-b border-transparent hover:border-white/30 transition-colors ${item.isImportant ? 'text-[color:#ffa0a0] border-rose-400/50' : 'text-white border-white/30'}`} style={{ writingMode: writingMode }}>
                            <ZhuyinRenderer text={item.content} isActive={isGlobalZhuyin} writingMode={writingMode} />
                        </div>
                    )}
                </div>
            )}

            {/* 控制項按鈕 (非 Focus 模式、非匯出時顯示) */}
            {!isFocusMode && !isExporting && (
                <div
                    className="no-export opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg p-1 flex items-center gap-1 transform-gpu will-change-opacity"
                    style={isVertical ? { writingMode: 'horizontal-tb' } : undefined}
                >
                    <button
                        onClick={() => updateItemInCurrentLog(item.id, { isImportant: !item.isImportant })}
                        className={`p-1.5 rounded-md transition-colors ${item.isImportant ? 'bg-rose-500/80 text-white' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
                        title="標示為重要"
                    >
                        <AlertOctagon size={18} />
                    </button>
                    <button onClick={() => removeItemFromCurrentLog(item.id)} className="p-1.5 rounded-md text-white/60 hover:bg-rose-500 hover:text-white" title="刪除">
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(ContactBookRow);
