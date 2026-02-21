// src/components/common/ExamShareModal.jsx
import React, { useState } from 'react';
import { X, QrCode, Link as LinkIcon, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ExamShareModal = ({ isOpen, onClose, shareId, examTitle }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !shareId) return null;

  // 自動組合出帶有 shareId 的專屬網址
  const shareUrl = `${window.location.origin}/?shareId=${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col items-center p-8 relative" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
          <QrCode size={32} />
        </div>

        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1 text-center">
          考卷派送成功
        </h3>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 text-center line-clamp-1 px-4">
          {examTitle}
        </p>

        {/* QR Code 顯示區 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 mb-6 transition-transform hover:scale-105">
          <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={false} />
        </div>

        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
          請學生使用平板掃描上方行動條碼
        </p>

        {/* 網址複製區 */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-2">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono text-slate-500 truncate px-2 select-all">
              {shareUrl}
            </p>
          </div>
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`}
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? '已複製' : '複製'}
          </button>
        </div>

        <a 
          href={shareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-1.5 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          <ExternalLink size={16} />
          在新分頁開啟測試
        </a>

      </div>
    </div>
  );
};

export default ExamShareModal;