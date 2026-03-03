import React, { useState, useEffect } from 'react';
import { CalendarCheck, X, Copy, AlertCircle } from 'lucide-react';
import { ATTENDANCE_STATUS, ATTENDANCE_CYCLE, UI_THEME } from '../../../constants'; // 確保引用 UI_THEME
import { cn } from '../../../utils/cn'; // ★ 引入工具

const AttendanceModal = ({ isOpen, onClose, students, attendanceRecords, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentStatus, setCurrentStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(attendanceRecords[selectedDate] || {});
    }
  }, [isOpen, selectedDate, attendanceRecords]);

  const cycleStatus = (studentId) => {
    const current = currentStatus[studentId] || 'present';
    const currentIndex = ATTENDANCE_CYCLE.indexOf(current);
    const nextIndex = (currentIndex + 1) % ATTENDANCE_CYCLE.length;
    const nextStatus = ATTENDANCE_CYCLE[nextIndex];

    setCurrentStatus(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));
  };

  const handleSave = () => {
    onSave(selectedDate, currentStatus);
    onClose();
  };

  const setAllStatus = (status) => {
    const newStatus = {};
    students.forEach(s => newStatus[s.id] = status);
    setCurrentStatus(newStatus);
  };

  const handleExportMonth = () => {
    const targetMonth = selectedDate.substring(0, 7); 
    const datesInMonth = Object.keys(attendanceRecords || {})
      .filter(date => date.startsWith(targetMonth))
      .sort();

    if (datesInMonth.length === 0) {
      alert(`目前 ${targetMonth} 月份尚無點名紀錄。`);
      return;
    }

    const sortedStudents = [...students].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const headers = ['座號', '姓名', ...datesInMonth];
    const rows = sortedStudents.map(s => {
      const recordCells = datesInMonth.map(date => {
        const status = attendanceRecords[date]?.[s.id] || 'present';
        return ATTENDANCE_STATUS[status]?.label || '出席';
      });
      return `${s.number}\t${s.name}\t${recordCells.join('\t')}`;
    });

    const text = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => alert(`已複製 ${targetMonth} 月份的出缺席報表！\n直接貼上 Excel 即可。`));
  };

  const stats = Object.values(currentStatus).reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
  }, {});
  const presentCount = students.length - (Object.keys(currentStatus).length) + (stats['present'] || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-4">
              <h3 className="font-bold text-xl flex items-center gap-2"><CalendarCheck size={24} className="text-emerald-400"/> 點名簿</h3>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="text-sm flex gap-3 text-slate-300">
                  <span>應到 <b className="text-white">{students.length}</b></span>
                  <span>實到 <b className="text-emerald-400">{presentCount}</b></span>
                  {(stats['personal'] || 0) > 0 && <span>請假 <b className="text-slate-400">{stats['personal']}</b></span>}
                  {(stats['absent'] || 0) > 0 && <span>缺席 <b className="text-rose-400">{stats['absent']}</b></span>}
                  {(stats['late'] || 0) > 0 && <span>遲到 <b className="text-amber-400">{stats['late']}</b></span>}
              </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full text-slate-300"><X size={20}/></button>
        </div>

        {/* Date & Batch Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-600 dark:text-slate-300 text-sm">日期：</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-700 focus:border-blue-500 outline-none shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAllStatus('present')} className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all">全班出席</button>
            <button onClick={() => setAllStatus('personal')} className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 shadow-sm transition-all">全班請假</button>
          </div>
        </div>

        {/* Student Grid (Click to Cycle) */}
        <div className="p-6 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/50 flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {students.map(s => {
              const statusKey = currentStatus[s.id] || 'present';
              const config = ATTENDANCE_STATUS[statusKey] || ATTENDANCE_STATUS['present'];
              
              return (
                <button
                  key={s.id}
                  onClick={() => cycleStatus(s.id)}
                  className={cn(
                    "relative p-3 rounded-xl border-2 shadow-sm transition-all active:scale-95 flex flex-col items-center gap-2",
                    // 動態套用狀態顏色
                    config.bg, config.border, config.color,
                    // 狀態特效
                    statusKey !== 'present' 
                        ? "ring-2 ring-offset-2 ring-slate-300 dark:ring-offset-slate-900 dark:ring-slate-600" 
                        : "hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                  )}
                  title="點擊切換狀態：出席 > 請假 > 缺席 > 遲到"
                >
                  <div className="absolute top-2 right-2">
                      {config.icon}
                  </div>

                  <div className="w-full flex justify-start">
                    <span className="font-mono text-xs font-black opacity-60 bg-black/5 dark:bg-white/10 px-1.5 rounded">{s.number}</span>
                  </div>
                  
                  <div className="text-lg font-bold truncate w-full text-center leading-tight">
                      {s.name}
                  </div>
                  
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5">
                      {config.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <button onClick={handleExportMonth} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"><Copy size={16}/> 複製本月報表</button>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mr-4">
                 <AlertCircle size={14}/>
                 點擊卡片循環切換狀態
             </div>
             <button onClick={handleSave} className="px-8 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                儲存紀錄
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;