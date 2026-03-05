import React from 'react';
import { Calendar, Users } from 'lucide-react';

const PrintView = ({ activeStudent, logs, selectedLogIds }) => {
    return (
        <>
            <style type="text/css">
                {`
          @media print {
            @page { 
              size: A4 portrait; 
              margin: 12mm; 
            }
            html, body, #root {
              height: auto !important;
              overflow: visible !important;
              background-color: white !important;
            }
          }
        `}
            </style>

            <div className="hidden print:block w-full bg-white text-black font-sans">
                <h1 className="text-2xl font-bold text-center mb-6 pb-3 border-b-2 border-black">
                    {activeStudent?.name} - 學生紀錄日誌
                </h1>

                <div className="grid grid-cols-2 gap-4 items-start">
                    {logs
                        .filter(log => selectedLogIds.includes(log.id))
                        .map(log => (
                            <div key={log.id} className="break-inside-avoid border border-gray-400 p-4 rounded-lg">

                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                                    <h2 className="text-base font-bold flex items-center gap-1.5">
                                        <Calendar size={16} />
                                        {log.date}
                                    </h2>
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                        <Users size={12} /> {log.author.replace(' (已編輯)', '')}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {log.template?.map(block => {
                                        const val = log.content[block.id];
                                        if (val === undefined || val === '') return null;

                                        const isFullWidth = block.type === 'text';

                                        return (
                                            <div key={block.id} className={`flex flex-col gap-1 ${isFullWidth ? 'w-full' : ''}`}>
                                                <span className="text-xs font-bold text-gray-500">{block.label}</span>
                                                <div className="text-sm font-medium whitespace-pre-wrap">
                                                    {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {log.attachments && log.attachments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 break-inside-avoid">
                                        <span className="text-xs font-bold text-gray-500 mb-2 block">照片紀錄</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {log.attachments.map((file, idx) => {
                                                const hasDriveId = Boolean(file.driveId);
                                                if (!hasDriveId) return null;

                                                return (
                                                    <div key={idx} className="aspect-square rounded border border-gray-300 overflow-hidden">
                                                        <img
                                                            src={`https://drive.google.com/thumbnail?id=${file.driveId}&sz=w400`}
                                                            alt={file.name || '照片紀錄'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                </div>
            </div>
        </>
    );
};

export default React.memo(PrintView);
