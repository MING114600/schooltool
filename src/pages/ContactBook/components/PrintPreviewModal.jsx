import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useContactBookStore } from '../../../store/useContactBookStore';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';
import { toPng } from 'html-to-image';
import { Download, Printer, X, Share2 } from 'lucide-react';
import { formatMinguoDate } from '../utils/dateUtils';

// 聯絡簿單板渲染元件 (供預覽 & 列印共用)
const BoardCard = ({ currentLog, isGlobalZhuyin, writingMode, exportBackground, fontSize = '1.4rem', titleSize = '1.8rem' }) => {
    const isVertical = writingMode === 'vertical-rl';

    return (
        <div className={`single-board rounded-lg p-6 flex flex-col h-full border-[3px] overflow-hidden relative ${exportBackground ? 'bg-[#274C43] border-[#3a6155]' : 'bg-white border-slate-300'}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            {/* 黑板背景紋理 */}
            {exportBackground && <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #182e28ff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}

            {/* 標題列 */}
            <h3
                className={`text-center font-bold mb-4 border-b pb-2 relative z-10 ${exportBackground ? 'text-[#ffeb3b] border-white/20' : 'text-slate-900 border-slate-300'}`}
                style={{ fontSize: titleSize, writingMode: 'horizontal-tb' }}
            >
                <ZhuyinRenderer text={`${formatMinguoDate(currentLog.date)}`} isActive={isGlobalZhuyin} />
            </h3>

            {/* 內容區 — 使用和 ContactBookEditor 一致的 flex 佈局 */}
            <div
                className={`flex-1 relative z-10 flex ${isVertical ? 'flex-col gap-4' : 'flex-col gap-2'}`}
                style={{
                    writingMode: writingMode,
                    textOrientation: 'mixed',
                    letterSpacing: '0.05em'
                }}
            >
                {currentLog.items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-2 relative z-10 ${isVertical ? 'h-full shrink-0' : 'w-full'}`}
                    >
                        {/* 編號 */}
                        <span
                            className={`opacity-70 font-bold select-none whitespace-nowrap ${exportBackground ? 'text-white' : 'text-slate-700'}`}
                            style={{ fontSize, textCombineUpright: 'all' }}
                        >
                            {index + 1}.
                        </span>

                        {/* 內容 */}
                        <div className="flex-1" style={{
                            color: item.isImportant
                                ? (exportBackground ? '#ffa0a0' : '#e11d48')
                                : (exportBackground ? 'white' : '#1e293b'),
                            fontSize
                        }}>
                            <ZhuyinRenderer text={item.content} isActive={isGlobalZhuyin} writingMode={writingMode} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PrintPreviewModal = ({ isOpen, onClose, isGlobalZhuyin }) => {
    const { currentLog, exportBackground, setExportBackground, writingMode, setIsExporting, isExporting } = useContactBookStore();
    const [copies, setCopies] = React.useState(1);
    const previewRef = useRef(null);
    const printRef = useRef(null);

    if (!isOpen || !currentLog) return null;

    // 圖檔匯出 (直接擷取編輯區黑板)
    const handleExportImage = async () => {
        setIsExporting(true);

        const blackboard = document.getElementById('contact-book-blackboard');
        if (!blackboard) {
            setIsExporting(false);
            return alert('找不到黑板元素');
        }

        // 等待一幀讓 React 根據 isExporting 隱藏控制項，並讓瀏覽器渲染完成
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));


        // 等待一幀讓瀏覽器重新渲染
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const dataUrl = await toPng(blackboard, {
                quality: 0.95,
                backgroundColor: exportBackground ? '#274C43' : '#ffffff',
                pixelRatio: 2
            });
            const link = document.createElement('a');
            link.download = `聯絡簿_${currentLog.date}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('匯出圖檔失敗', err);
            alert('圖檔匯出失敗，請再試一次');
        } finally {
            setIsExporting(false);
        }
    };

    // 列印：將隱藏的 #print-area 顯示並列印
    const handlePrint = () => {
        window.print();
    };

    // 圖檔分享：Web Share API + clipboard fallback
    const handleShare = async () => {
        setIsExporting(true);

        const blackboard = document.getElementById('contact-book-blackboard');
        if (!blackboard) {
            setIsExporting(false);
            return alert('找不到黑板元素');
        }

        // 等待一幀讓 React 更新
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const dataUrl = await toPng(blackboard, {
                quality: 0.95,
                backgroundColor: exportBackground ? '#274C43' : '#ffffff',
                pixelRatio: 2
            });

            // 將 dataUrl 轉換為 Blob/File
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `聯絡簿_${currentLog.date}.png`, { type: 'image/png' });

            // 優先使用 Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `聯絡簿 ${currentLog.date}`,
                    files: [file]
                });
            } else {
                // Fallback: 複製到剪貼簿
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    alert('✅ 已複製圖片到剪貼簿，可直接貼到 LINE 或其他應用程式！');
                } catch {
                    // 若剪貼簿也不支援，改為下載
                    const link = document.createElement('a');
                    link.download = `聯絡簿_${currentLog.date}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('分享失敗', err);
            }
        } finally {
            setIsExporting(false);
        }
    };

    const copyArray = Array.from({ length: copies });

    // grid class
    const getGridClass = () => {
        switch (copies) {
            case 1: return 'grid-cols-1 grid-rows-1';
            case 2: return 'grid-cols-1 grid-rows-2';
            case 4: return 'grid-cols-2 grid-rows-2';
            case 8: return 'grid-cols-2 grid-rows-4';
            default: return 'grid-cols-1 grid-rows-1';
        }
    };

    // 根據份數計算字型大小
    const getFontSize = () => {
        if (copies >= 8) return '1rem';
        if (copies >= 4) return '1.2rem';
        if (copies >= 2) return '1.8rem';
        return '2rem';
    };

    const getTitleSize = () => {
        if (copies >= 8) return '1.2rem';
        if (copies >= 4) return '1.5rem';
        if (copies >= 2) return '2.4rem';
        return '2.4rem';
    };

    return (
        <>
            {/* ===== 主 Modal (螢幕上的預覽介面，列印時隱藏) ===== */}
            <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex justify-center items-center print:hidden">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-[1200px] h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Printer className="text-indigo-500" />
                            列印與匯出預覽
                        </h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={24} />
                        </button>
                    </div>

                    {/* 控制列 */}
                    <div className="flex gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl items-center flex-wrap">
                        <div className="text-sm font-medium mr-2">列印佈局 (A4)：</div>
                        {[1, 2, 4, 8].map(num => (
                            <button
                                key={num}
                                onClick={() => setCopies(num)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${copies === num ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                            >
                                1 頁 {num} 份
                            </button>
                        ))}

                        <div className="ml-auto flex gap-4 items-center">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={exportBackground}
                                    onChange={(e) => setExportBackground(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                />
                                保留黑板背景
                            </label>
                            <button
                                onClick={handleExportImage}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold transition-colors"
                            >
                                <Download size={18} />
                                {isExporting ? '處理中...' : '下載單圖'}
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg font-bold transition-colors"
                            >
                                <Share2 size={18} />
                                分享
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-md transition-colors"
                            >
                                <Printer size={18} />
                                開始列印
                            </button>
                        </div>
                    </div>

                    {/* 預覽區域 */}
                    <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 rounded-xl p-8 flex justify-center items-start">
                        <div
                            ref={previewRef}
                            className={`bg-white shadow-xl aspect-[1/1.414] w-[794px] p-2 grid ${getGridClass()} gap-0`}
                        >
                            {copyArray.map((_, i) => (
                                <div key={i} className="border border-dashed border-slate-300 p-1 overflow-hidden">
                                    <BoardCard
                                        currentLog={currentLog}
                                        isGlobalZhuyin={isGlobalZhuyin}
                                        writingMode={writingMode}
                                        exportBackground={exportBackground}
                                        fontSize={getFontSize()}
                                        titleSize={getTitleSize()}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 列印專用 DOM (平常 hidden，列印時覆蓋畫面) — 透過 Portal 直接換到 body ===== */}
            {createPortal(
                <>
                    <div ref={printRef} id="print-area" className="hidden print:block fixed inset-0 z-[9999] bg-white">
                        <div className={`w-full h-full grid ${getGridClass()} gap-0 p-2`}>
                            {copyArray.map((_, i) => (
                                <div key={i} className="border border-dashed border-slate-400 p-1 overflow-hidden">
                                    <BoardCard
                                        currentLog={currentLog}
                                        isGlobalZhuyin={isGlobalZhuyin}
                                        writingMode={writingMode}
                                        exportBackground={exportBackground}
                                        fontSize={getFontSize()}
                                        titleSize={getTitleSize()}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 列印 CSS */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            body > *:not(#print-area) { display: none !important; }
                            #print-area { 
                                display: block !important;
                                position: fixed !important;
                                inset: 0 !important;
                                z-index: 99999 !important;
                                background: white !important;
                            }
                            #print-area * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            @page { margin: 5mm; size: A4 portrait; }
                        }
                    `}} />
                </>,
                document.body
            )}
        </>
    );
};

export default PrintPreviewModal;
