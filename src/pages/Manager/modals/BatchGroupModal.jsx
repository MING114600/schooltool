import React, { useState, useEffect } from 'react';
import { Layers, X, Shuffle, Trash2, Users, GripVertical, TrendingUp, Scale } from 'lucide-react';
import { GROUP_THEME } from '../../../utils/constants';

const BatchGroupModal = ({ isOpen, onClose, students, onUpdateStudents, onShowDialog }) => {
  const [localStudents, setLocalStudents] = useState([]);
  const [groupCount, setGroupCount] = useState(6); 
  const [styleMode, setStyleMode] = useState('filled');

  useEffect(() => {
    if (isOpen) {
      setLocalStudents(JSON.parse(JSON.stringify(students))); 
      const maxGroup = Math.max(...students.map(s => parseInt(s.group) || 0), 0);
      if (maxGroup > 0) setGroupCount(maxGroup);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const hasPerformanceData = localStudents.some(s => s.performance !== undefined && s.performance !== null);

  // ... (演算法邏輯保持不變)
  const handleRandomDistribute = () => {
    const shuffled = [...localStudents].sort(() => Math.random() - 0.5);
    setLocalStudents(shuffled.map((s, i) => ({ ...s, group: ((i % groupCount) + 1).toString() })));
  };
  
  const handleGenderBalanced = () => {
      const boys = localStudents.filter(s => s.gender === 'M').sort(() => Math.random() - 0.5);
      const girls = localStudents.filter(s => s.gender === 'F').sort(() => Math.random() - 0.5);
      const others = localStudents.filter(s => s.gender !== 'M' && s.gender !== 'F').sort(() => Math.random() - 0.5);
      const groups = Array.from({ length: groupCount }, () => []);
      const distributeWithReset = (list) => {
          let currentGroup = 0; let direction = 1;
          list.forEach(s => {
              groups[currentGroup].push(s);
              if (direction === 1) { if (currentGroup === groupCount - 1) direction = -1; else currentGroup++; } 
              else { if (currentGroup === 0) direction = 1; else currentGroup--; }
          });
      };
      distributeWithReset(boys); distributeWithReset(girls); distributeWithReset(others);
      flattenAndSet(groups);
  };
  const handleScoreBalanced = () => {
      const sorted = [...localStudents].sort((a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
      const groups = Array.from({ length: groupCount }, () => []);
      let currentGroup = 0; let direction = 1;
      sorted.forEach((student) => {
          groups[currentGroup].push(student);
          if (direction === 1) { if (currentGroup === groupCount - 1) direction = -1; else currentGroup++; }
          else { if (currentGroup === 0) direction = 1; else currentGroup--; }
      });
      flattenAndSet(groups);
  };
  const handleFullBalanced = () => {
      const boys = localStudents.filter(s => s.gender === 'M').sort((a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
      const girls = localStudents.filter(s => s.gender === 'F').sort((a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
      const others = localStudents.filter(s => s.gender !== 'M' && s.gender !== 'F').sort((a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
      const groups = Array.from({ length: groupCount }, () => []);
      const distributeSortedList = (list, startDirection = 1) => {
          let currentGroup = startDirection === 1 ? 0 : groupCount - 1;
          let direction = startDirection;
          list.forEach(s => {
              groups[currentGroup].push(s);
              if (direction === 1) { if (currentGroup === groupCount - 1) direction = -1; else currentGroup++; }
              else { if (currentGroup === 0) direction = 1; else currentGroup--; }
          });
      };
      distributeSortedList(boys, 1); distributeSortedList(girls, -1); distributeSortedList(others, 1);
      flattenAndSet(groups);
  };
  const flattenAndSet = (groups) => {
      const finalStudents = [];
      groups.forEach((gList, idx) => {
          const groupId = (idx + 1).toString();
          gList.forEach(s => { s.group = groupId; finalStudents.push(s); });
      });
      const groupMap = {}; finalStudents.forEach(s => groupMap[s.id] = s.group);
      setLocalStudents(prev => prev.map(s => ({ ...s, group: groupMap[s.id] !== undefined ? groupMap[s.id] : '' })));
  };
  const handleClearGroups = () => { 
    onShowDialog({
        type: 'confirm',
        title: '清除分組',
        message: '確定要清除所有分組設定嗎？\n學生將回到未分組狀態。',
        variant: 'warning',
        confirmText: '清除',
        onConfirm: () => {
            setLocalStudents(prev => prev.map(s => ({ ...s, group: '' })));
        }
    });
  };
  const handleSave = () => { onUpdateStudents(localStudents); onClose(); };
  const handleDragStart = (e, studentId) => { e.dataTransfer.setData("studentId", studentId); e.dataTransfer.effectAllowed = "move"; };
  const handleDrop = (e, targetGroupId) => { e.preventDefault(); const studentId = e.dataTransfer.getData("studentId"); if (!studentId) return; setLocalStudents(prev => prev.map(s => { if (s.id === studentId) return { ...s, group: targetGroupId }; return s; })); };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const groupedData = { unassigned: [] };
  for (let i = 1; i <= groupCount; i++) groupedData[i.toString()] = [];
  localStudents.forEach(s => {
      const g = (s.group && groupedData[s.group]) ? s.group : 'unassigned';
      groupedData[g].push(s);
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Layers size={24} className="text-purple-300"/>
              </div>
              <div>
                <h3 className="font-bold text-lg">分組管理看板</h3>
                <p className="text-xs text-slate-400">請從左側名單拖曳學生至右側組別，或使用自動分配</p>
              </div>
          </div>
          <div className="flex items-center gap-3">


              <div className="h-6 w-px bg-slate-600 mx-2"></div>

              <div className="flex items-center bg-slate-700 rounded-lg p-1">
                  <span className="text-xs font-bold px-2 text-slate-300">組數:</span>
                  <button onClick={() => setGroupCount(c => Math.max(2, c-1))} className="w-6 h-6 flex items-center justify-center bg-slate-600 hover:bg-slate-500 rounded text-white font-bold">-</button>
                  <span className="w-8 text-center font-mono font-bold">{groupCount}</span>
                  <button onClick={() => setGroupCount(c => Math.min(12, c+1))} className="w-6 h-6 flex items-center justify-center bg-slate-600 hover:bg-slate-500 rounded text-white font-bold">+</button>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
          </div>
        </div>

        {/* Toolbar - 深色適配 */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 shrink-0 items-center">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mr-1">自動分配：</span>
            
            <button onClick={handleRandomDistribute} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 transition-all shadow-sm">
                <Shuffle size={16}/> 純隨機
            </button>
            <button onClick={handleGenderBalanced} className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-all shadow-sm">
                <Users size={16}/> 性別平均
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button 
                onClick={handleScoreBalanced} 
                disabled={!hasPerformanceData}
                className={`px-3 py-2 border rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${hasPerformanceData ? 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
            >
                <TrendingUp size={16}/> 成績平均
            </button>
            <button 
                onClick={handleFullBalanced} 
                disabled={!hasPerformanceData}
                className={`px-3 py-2 border rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${hasPerformanceData ? 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
            >
                <Scale size={16}/> 性別+成績平均
            </button>
            <div className="flex-1"></div>
            <button onClick={handleClearGroups} className="px-3 py-2 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm">
                <Trash2 size={16}/> 清空
            </button>
        </div>

        {/* Board Area */}
        <div className="flex-1 flex overflow-hidden bg-slate-200/50 dark:bg-slate-950/50">
            {/* 左側：未分組 */}
            <div 
                className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '')}
            >
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex justify-between items-center">
                    <h4 className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Users size={16}/> 未分組名單
                    </h4>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">{groupedData.unassigned.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {groupedData.unassigned.map(s => (
                        <DraggableStudentCard key={s.id} student={s} onDragStart={handleDragStart} showPerformance={hasPerformanceData}/>
                    ))}
                    {groupedData.unassigned.length === 0 && (
                        <div className="py-10 text-center text-slate-400 dark:text-slate-600 text-xs italic border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                            全數已分配
                        </div>
                    )}
                </div>
            </div>

            {/* 右側：組別網格 */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                    {Array.from({ length: groupCount }).map((_, idx) => {
                        const groupId = (idx + 1).toString();
                        const students = groupedData[groupId];
                        const count = students.length;
                        const boyCount = students.filter(s => s.gender === 'M').length;
                        const girlCount = students.filter(s => s.gender === 'F').length;
                        
                        let avgScore = 0;
                        if (hasPerformanceData && count > 0) {
                            const total = students.reduce((sum, s) => sum + (parseFloat(s.performance) || 0), 0);
                            avgScore = Math.round(total / count);
                        }
                        
                        // ✅ 改用新的 GROUP_THEME 結構，無需再手動串接 .dark
                        const theme = GROUP_THEME[(idx + 1) % 9] || GROUP_THEME[0];

                        return (
                            <div 
                                key={groupId}
                                className={`flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 ${theme.border} min-h-[200px] transition-colors`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, groupId)}
                            >
                                <div className={`p-3 border-b-2 rounded-t-lg flex justify-between items-start ${theme.bg} ${theme.border}`}>
                                    <div>
                                        <h4 className={`font-black text-lg ${theme.text}`}>第 {groupId} 組</h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>{boyCount}</span>
                                                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>{girlCount}</span>
                                            </div>
                                            {hasPerformanceData && (
                                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <TrendingUp size={10}/> Avg: {avgScore}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg text-sm font-black shadow-sm">{count}人</span>
                                </div>
                                
                                <div className={`flex-1 p-2 space-y-2 ${styleMode === 'filled' ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                    {students.map(s => (
                                        <DraggableStudentCard key={s.id} student={s} onDragStart={handleDragStart} showPerformance={hasPerformanceData}/>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="h-24 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg">
                                            拖曳至此
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0 z-20">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
            <button onClick={handleSave} className="px-8 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl transition-all active:scale-95">
                儲存分組設定
            </button>
        </div>

      </div>
    </div>
  );
};

// 內部小卡片
const DraggableStudentCard = ({ student, onDragStart, showPerformance }) => {
    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, student.id)}
            className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-3 group"
        >
            <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 cursor-grab"><GripVertical size={14}/></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${student.gender === 'M' ? 'bg-blue-400' : 'bg-rose-400'}`}>
                {student.number}
            </div>
            <div className="flex-1 min-w-0 flex justify-between items-center">
                <div className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm">{student.name}</div>
                {showPerformance && student.performance !== undefined && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">{student.performance}</span>
                )}
            </div>
        </div>
    );
};

export default BatchGroupModal;