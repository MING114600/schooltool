import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, GripVertical, Save, Copy, Check, X, Loader2 } from 'lucide-react';
import { UI_THEME } from '../../../constants';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 常數定義 ---
export const BLOCK_TYPES = [
  { type: 'rating', label: '評分 (1-5星)', icon: '⭐', canAddOptions: false },
  { type: 'checkbox', label: '核取方塊 (多選)', icon: '☑️', canAddOptions: true },
  { type: 'radio', label: '選擇圓鈕 (單選)', icon: '🔘', canAddOptions: true },
  { type: 'select', label: '下拉選單 (單選)', icon: '🏷️', canAddOptions: true },
  { type: 'text', label: '多行文字', icon: '📝', canAddOptions: false },
  { type: 'image', label: '圖片上傳', icon: '🖼️', canAddOptions: false },
];

// --- 排序區塊組件 ---
const SortableBlock = ({
  block,
  isFocused,
  setFocusedBlockId,
  renderFocusedCard,
  renderPreviewCard
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (isFocused ? 20 : 1),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex transition-all duration-200
        border-l-4 rounded-xl shadow-sm bg-white dark:bg-slate-800
        ${isFocused
          ? 'border-l-blue-500 shadow-md py-6 pl-12 pr-6 my-2'
          : 'border-l-transparent border border-slate-200 dark:border-slate-700 py-4 pl-12 pr-6 hover:border-l-slate-300 dark:hover:border-l-slate-600'
        }
        ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
      `}
    >
      {/* 左側把手區塊 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-l-xl transition-all border-r border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 z-30"
        title="拖曳排序"
      >
        <GripVertical size={20} />
      </div>

      <div
        className="flex-1 w-full cursor-pointer"
        onClick={() => setFocusedBlockId(block.id)}
      >
        {isFocused ? renderFocusedCard(block) : renderPreviewCard(block)}
      </div>
    </div>
  );
};

export default function TemplateEditor({ template = [], onSave, onChange, isSaving }) {
  const [blocks, setBlocks] = useState(() => Array.isArray(template) ? template : []);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const newBlocks = Array.isArray(template) ? [...template] : [];
    setBlocks(newBlocks);
    setFocusedBlockId(null);
    if (onChange) onChange(newBlocks);
  }, [JSON.stringify(template)]);

  useEffect(() => {
    if (onChange) onChange(blocks);
  }, [blocks, onChange]);

  // --- 基礎操作 ---
  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: '新增題目',
      ...(BLOCK_TYPES.find(t => t.type === type)?.canAddOptions ? { options: ['選項 1'] } : {}),
      ...(type === 'rating' ? { max: 5 } : {})
    };
    setBlocks(prev => [...prev, newBlock]);
    setFocusedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (e, id) => {
    e.stopPropagation();
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (focusedBlockId === id) setFocusedBlockId(null);
  };

  const handleDuplicateBlock = (e, block) => {
    e.stopPropagation();
    const newBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: `${block.label} (複製)`
    };
    const index = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleUpdateOption = (blockId, optionIndex, newValue) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const newOptions = [...b.options];
      newOptions[optionIndex] = newValue;
      return { ...b, options: newOptions };
    }));
  };

  const handleAddOption = (blockId) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, options: [...b.options, `選項 ${b.options.length + 1}`] };
    }));
  };

  const handleDeleteOption = (blockId, optionIndex) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const newOptions = b.options.filter((_, idx) => idx !== optionIndex);
      return { ...b, options: newOptions.length ? newOptions : ['選項 1'] };
    }));
  };

  // --- 拖曳處理 ---
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setFocusedBlockId(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const activeBlock = useMemo(() => blocks.find(b => b.id === activeId), [activeId, blocks]);

  // --- Render 輔助 ---
  const renderFocusedCard = (block) => {
    const isOptionsType = ['checkbox', 'radio', 'select'].includes(block.type);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            autoFocus
            type="text"
            className="flex-1 p-3 text-lg font-bold bg-slate-100 dark:bg-slate-900/50 outline-none border-b-2 border-slate-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400 transition-colors placeholder-slate-400"
            value={block.label}
            onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
            placeholder="請輸入題目..."
          />
          <div className="py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 min-w-[140px]">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {BLOCK_TYPES.find(t => t.type === block.type)?.icon} {BLOCK_TYPES.find(t => t.type === block.type)?.label}
            </span>
          </div>
        </div>

        {isOptionsType && (
          <div className="flex flex-col gap-2 mt-2">
            {block.options?.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {block.type === 'checkbox' && <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />}
                {block.type === 'radio' && <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />}
                {block.type === 'select' && <div className="text-slate-400 flex-shrink-0 text-sm font-bold">{idx + 1}.</div>}

                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleUpdateOption(block.id, idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (idx === block.options.length - 1) handleAddOption(block.id);
                    }
                  }}
                  className="flex-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  placeholder={`選項 ${idx + 1}`}
                />

                <button
                  onClick={() => handleDeleteOption(block.id, idx)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-3 mt-2 group cursor-pointer" onClick={() => handleAddOption(block.id)}>
              {block.type === 'checkbox' && <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 opacity-50 flex-shrink-0 group-hover:border-blue-400 transition-colors" />}
              {block.type === 'radio' && <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 opacity-50 flex-shrink-0 group-hover:border-blue-400 transition-colors" />}
              {block.type === 'select' && <div className="text-slate-400 opacity-50 flex-shrink-0 font-bold group-hover:text-blue-500 transition-colors">+</div>}
              <span className="text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors border-b border-transparent group-hover:border-blue-500 pb-1">
                新增選項
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-2 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={(e) => handleDuplicateBlock(e, block)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="複製欄位"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={(e) => handleDeleteBlock(e, block.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
            title="刪除欄位"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderPreviewCard = (block) => {
    return (
      <div className="flex flex-col gap-3 opacity-90">
        <div className="text-base font-bold text-slate-800 dark:text-slate-200">
          {block.label}
          {block.type === 'text' && <span className="ml-2 text-xs font-normal text-slate-400">(長文字題)</span>}
          {block.type === 'image' && <span className="ml-2 text-xs font-normal text-slate-400">(圖片題)</span>}
        </div>

        {block.type === 'rating' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className="text-slate-200 dark:text-slate-700"><Check size={24} /></div>
            ))}
          </div>
        )}

        {block.type === 'checkbox' && (
          <div className="flex flex-col gap-2">
            {block.options?.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" />
                {opt}
              </div>
            ))}
          </div>
        )}

        {block.type === 'radio' && (
          <div className="flex flex-col gap-2">
            {block.options?.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                {opt}
              </div>
            ))}
          </div>
        )}

        {block.type === 'select' && (
          <div className="w-full md:w-1/2 p-2 rounded-lg border border-slate-300 dark:border-slate-600 flex justify-between items-center text-slate-400 text-sm font-bold">
            <span>請選擇...</span>
            <span className="text-xs">▼</span>
          </div>
        )}

        {block.type === 'text' && (
          <div className="w-full h-20 rounded-lg border border-slate-300 dark:border-slate-600 border-dashed" />
        )}

        {block.type === 'image' && (
          <div className="w-1/3 h-20 rounded-lg border border-slate-300 dark:border-slate-600 border-dashed bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 font-bold text-sm">
            [ 圖片預覽區 ]
          </div>
        )}
      </div>
    );
  }

  const handleBgClick = (e) => {
    if (e.target.id === 'editor-canvas') {
      setFocusedBlockId(null);
    }
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div className={`flex flex-col min-h-full pb-32`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          id="editor-canvas"
          className="flex flex-col gap-4 max-w-3xl mx-auto w-full px-4 pt-6"
          onClick={handleBgClick}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <SortableBlock
                key={block.id}
                block={block}
                index={index}
                isFocused={focusedBlockId === block.id}
                setFocusedBlockId={setFocusedBlockId}
                renderFocusedCard={renderFocusedCard}
                renderPreviewCard={renderPreviewCard}
              />
            ))}
          </SortableContext>

          {blocks.length === 0 && (
            <div
              className="text-center p-12 my-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all font-bold text-slate-500"
              onClick={() => handleAddBlock('text')}
            >
              目前學生版面是空的。點選右下角的按鈕新增欄位，或是從最上方的功能列套用既有公版。
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeBlock ? (
            <div className="border-l-4 border-l-blue-500 rounded-xl shadow-2xl bg-white dark:bg-slate-800 py-4 px-6 opacity-90 scale-105 pointer-events-none border border-slate-200 dark:border-slate-700">
              {renderPreviewCard(activeBlock)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 底部浮動區(儲存 + 新增工具列) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-6">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 flex items-center gap-1 overflow-x-auto max-w-[90vw] md:max-w-none">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              onClick={() => handleAddBlock(bt.type)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-sm text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
              title={`新增 ${bt.label}`}
            >
              <span>{bt.icon}</span>
              <span className="hidden md:inline">{bt.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSave(blocks)}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-xl transition-all ${isSaving ? 'opacity-70' : 'hover:scale-105 active:scale-95'} ${UI_THEME.BTN_PRIMARY}`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? '儲存中...' : '儲存此學生配置'}
        </button>
      </div>
    </div>
  );
}
