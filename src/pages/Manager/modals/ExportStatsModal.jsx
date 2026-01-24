import React, { useState } from 'react';
import { Table, X, Users, User, Copy, Download, Trash2, CalendarDays } from 'lucide-react';

const ExportStatsModal = ({ isOpen, onClose, students, groupScores, attendanceRecords, onResetScores }) => {
  if (!isOpen) return null;

  const individualStats = students.map(s => {
    let absentCount = 0; let lateCount = 0; let leaveCount = 0;
    if (attendanceRecords) {
        Object.values(attendanceRecords).forEach(record => {
            const status = record[s.id];
            if (status === 'absent') absentCount++; else if (status === 'late') lateCount++; else if (status === 'personal' || status === 'sick') leaveCount++;
        });
    }
    return { id: s.id, number: s.number, name: s.name, group: s.group || '-', score: s.score || 0, absent: absentCount, late: lateCount, leave: leaveCount };
  }).sort((a, b) => parseInt(a.number) - parseInt(b.number));

  const groupStats = Object.keys(groupScores || {}).map(groupId => ({ group: groupId, score: groupScores[groupId] })).sort((a, b) => b.score - a.score);

  const generateCSV = (headers, rows) => {
      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      return '\ufeff' + csvContent;
  };
  const downloadCSV = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  };
  const copyToClipboard = (headers, rows) => {
      const text = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
      navigator.clipboard.writeText(text).then(() => alert('內容已複製到剪貼簿！(可直接貼上 Excel)'));
  };

  const handleExportIndividual = (mode) => {
      const headers = ['座號', '姓名', '組別', '總分', '缺席', '遲到', '請假'];
      const rows = individualStats.map(s => [s.number, s.name, s.group, s.score, s.absent, s.late, s.leave]);
      if (mode === 'csv') { downloadCSV(generateCSV(headers, rows), `個人成績與出席統計_${new Date().toLocaleDateString()}.csv`); } else { copyToClipboard(headers, rows); }
  };

  const handleExportGroup = (mode) => {
      const headers = ['組別', '小組總分'];
      const rows = groupStats.map(g => [`第 ${g.group} 組`, g.score]);
      if (mode === 'csv') { downloadCSV(generateCSV(headers, rows), `小組成績統計_${new Date().toLocaleDateString()}.csv`); } else { copyToClipboard(headers, rows); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><Table size={20} className="text-emerald-400"/> 匯出統計報表</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-auto flex-1 bg-slate-50 dark:bg-slate-800 space-y-8">
          
          {/* 小組成績 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Users size={18} className="text-purple-500"/> 小組競賽榜</h4>
                <div className="flex gap-2">
                    <button onClick={() => handleExportGroup('copy')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 transition-colors"><Copy size={14}/> 複製</button>
                    <button onClick={() => handleExportGroup('csv')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"><Download size={14}/> 下載 CSV</button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <tr><th className="p-3 w-20">排名</th><th className="p-3">組別</th><th className="p-3 text-right">總分</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {groupStats.length > 0 ? groupStats.map((g, idx) => (
                            <tr key={g.group} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="p-3 font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                <td className="p-3 font-bold text-slate-700 dark:text-slate-200">第 {g.group} 組</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{g.score}</td>
                            </tr>
                        )) : <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic">尚無小組分數資料</td></tr>}
                    </tbody>
                </table>
            </div>
          </div>

          {/* 個人成績與出缺席 */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><User size={18} className="text-blue-500"/> 學生個人紀錄 (含出缺席)</h4>
                <div className="flex gap-2">
                    <button onClick={() => handleExportIndividual('copy')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 transition-colors"><Copy size={14}/> 複製</button>
                    <button onClick={() => handleExportIndividual('csv')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"><Download size={14}/> 下載 CSV</button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700 max-h-64">
                <table className="w-full text-sm text-left relative text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider sticky top-0 shadow-sm z-10">
                        <tr>
                            <th className="p-3 w-16">座號</th>
                            <th className="p-3">姓名</th>
                            <th className="p-3 w-20 text-center">組別</th>
                            <th className="p-3 w-24 text-right">總分</th>
                            <th className="p-3 w-20 text-center text-rose-500">缺席</th>
                            <th className="p-3 w-20 text-center text-amber-500">遲到</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {individualStats.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{s.number}</td>
                                <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{s.name}</td>
                                <td className="p-3 text-center text-slate-400 dark:text-slate-500 text-xs">{s.group}</td>
                                <td className={`p-3 text-right font-mono font-bold ${s.score < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{s.score}</td>
                                <td className="p-3 text-center font-bold text-rose-200 dark:text-rose-900">
                                    {s.absent > 0 && <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">{s.absent}</span>}
                                </td>
                                <td className="p-3 text-center font-bold text-amber-200 dark:text-amber-900">
                                    {s.late > 0 && <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">{s.late}</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                <CalendarDays size={14}/> 提示：定期匯出並結算分數，可讓系統保持輕量。
            </span>
            {onResetScores && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => { if(confirm('確定要結算並清除所有「學生個人」的分數嗎？\n請確認您已匯出備份。')) { onResetScores('student'); onClose(); } }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14}/> 結算個人分數
                    </button>
                    <button 
                        onClick={() => { if(confirm('確定要結算並清除所有「小組」的分數嗎？\n請確認您已匯出備份。')) { onResetScores('group'); onClose(); } }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14}/> 結算小組分數
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ExportStatsModal;