import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, GripHorizontal } from 'lucide-react';

const DraggableWidget = ({ 
  title, 
  isOpen, 
  onClose, 
  children, 
  icon: Icon, 
  initialPosition = { x: 20, y: 80 },
  width = "w-72" 
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const widgetRef = useRef(null);

  // 當 Widget 開啟時，重置位置 (可選，或保留上次位置)
  useEffect(() => {
    if (isOpen) {
      // 如果需要每次開啟都重置位置，可以在這裡寫
      // setPosition(initialPosition);
      setIsMinimized(false);
    }
  }, [isOpen]);

  // 拖曳邏輯：滑鼠移動與放開
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault(); // 防止選取文字
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 簡單邊界檢查 (可選)
        // const boundedY = Math.max(0, newY); 
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e) => {
    // 只有點擊標題列 (Header) 才能拖曳
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={widgetRef}
      className={`
        fixed z-[100] flex flex-col
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
        border border-white/20 dark:border-slate-700
        shadow-2xl rounded-2xl overflow-hidden transition-shadow duration-300
        ${isDragging ? 'cursor-grabbing scale-[1.02] shadow-xl ring-2 ring-blue-400/30' : ''}
        ${isMinimized ? 'h-12 w-auto min-w-[200px]' : width}
      `}
      style={{ 
        left: position.x, 
        top: position.y,
        // 防止拖曳造成文字模糊
        willChange: 'transform, left, top' 
      }}
    >
      {/* 標題列 (拖曳區) */}
      <div 
        onMouseDown={handleMouseDown}
        className={`
          h-12 flex items-center justify-between px-3 cursor-grab select-none
          bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50
          transition-colors hover:bg-slate-100 dark:hover:bg-slate-800
        `}
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
          {Icon && <Icon size={18} className={isDragging ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'} />}
          <span className="truncate">{title}</span>
        </div>
        
        {/* 控制按鈕區 (防止觸發拖曳) */}
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isMinimized ? "展開" : "縮小"}
          >
            {isMinimized ? <Maximize2 size={14}/> : <Minus size={14}/>}
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors"
            title="關閉"
          >
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      {!isMinimized && (
        <div className="p-4 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
          {children}
        </div>
      )}

      {/* 縮小時顯示簡易把手提示 */}
      {isMinimized && (
         <div className="absolute bottom-1 w-full flex justify-center opacity-20 pointer-events-none">
             <GripHorizontal size={12}/>
         </div>
      )}
    </div>
  );
};

export default DraggableWidget;