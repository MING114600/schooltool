import React from 'react';
import { Users, Plus, Loader2, Download } from 'lucide-react';
import { UI_THEME } from '../../../../constants';

const Sidebar = ({
    students,
    activeStudent,
    activeStudentId,
    isLoading,
    isSyncing,
    setActiveStudentId,
    setIsAddStudentOpen,
    handleImportStudent // 🌟 新增：觸發 Google Picker 匯入
}) => {
    return (
        <div className={`flex w-full h-full shrink-0 flex-col ${UI_THEME.SURFACE_MAIN}`}>
            <div className={`p-4 border-b ${UI_THEME.BORDER_DEFAULT} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <Users className={UI_THEME.TEXT_PRIMARY} size={20} />
                    <h2 className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>學生名單</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : students.length === 0 ? (
                    <div className={`text-sm text-center p-4 ${UI_THEME.TEXT_MUTED}`}>尚無學生資料</div>
                ) : (
                    students.map(student => (
                        <button
                            key={student.id}
                            onClick={() => setActiveStudentId(student.id)}
                            className={`flex items-center justify-between p-3 rounded-xl text-left font-bold transition-all ${activeStudentId === student.id
                                ? 'bg-blue-500 text-white shadow-md'
                                : `hover:bg-slate-100 dark:hover:bg-slate-800 ${UI_THEME.TEXT_PRIMARY}`
                                }`}
                        >
                            <span>{student.name}</span>
                        </button>
                    ))
                )}
            </div>

            <div className="p-4 border-t flex flex-col gap-2 border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setIsAddStudentOpen(true)}
                    disabled={isSyncing}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors`}
                >
                    <Plus size={18} /> 新增學生
                </button>
                <button
                    onClick={handleImportStudent}
                    disabled={isSyncing}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors`}
                >
                    <Download size={18} /> 匯入共有學生
                </button>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
