import React, { useRef, useEffect } from 'react';

const MessageInput = ({ isOpen, onClose, message, setMessage }) => {
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message, isOpen]);
  
  const fontSizeClass = message.length > 50 ? 'text-xl' : (message.length > 20 ? 'text-2xl' : 'text-3xl');

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
       <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-slate-700">新增便利貼留言 (可換行)</h3>
          <textarea ref={textareaRef} autoFocus value={message} onChange={e => setMessage(e.target.value)} className={`w-full font-bold p-4 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:outline-none resize-none overflow-hidden ${fontSizeClass}`} placeholder="例如：請將聯絡簿交到講桌&#10;記得帶水壺" rows={3} style={{ minHeight: '120px', maxHeight: '400px' }} />
          <div className="flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">完成</button>
             <button onClick={() => { setMessage(''); onClose(); }} className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50">清除</button>
          </div>
       </div>
    </div>
  );
};

export default MessageInput;