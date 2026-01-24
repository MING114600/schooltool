import React, { useState, useRef } from 'react';
import { DoorOpen } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// --- 引入 Context ---
import { ClassroomProvider, useClassroomContext } from './context/ClassroomContext';

// --- 引入 UI 組件 ---
import Toolbar from './pages/Manager/components/Toolbar';
import Sidebar from './pages/Manager/components/Sidebar';
import SeatCell from './pages/Manager/components/SeatCell'; 
import SoundBoard from './components/common/SoundBoard'; 
import ScoreFeedback from './pages/Manager/components/ScoreFeedback'; 
import GroupScoreTicker from './pages/Manager/components/GroupScoreTicker';

// --- 引入 Modals ---
import LayoutTemplateModal from './pages/Manager/modals/LayoutTemplateModal';
import AttendanceModal from './pages/Manager/modals/AttendanceModal';
import TimerModal from './pages/Manager/modals/TimerModal';
import LotteryModal from './pages/Manager/modals/LotteryModal';
import BatchGroupModal from './pages/Manager/modals/BatchGroupModal';
import BehaviorSettingsModal from './pages/Manager/modals/BehaviorSettingsModal';
import ExportStatsModal from './pages/Manager/modals/ExportStatsModal';
import ScoringModal from './pages/Manager/modals/ScoringModal';
import EditStudentModal from './pages/Manager/modals/EditStudentModal';
import DialogModal from './pages/Manager/modals/DialogModal';
import GroupScoreBoardModal from './pages/Manager/modals/GroupScoreBoardModal'; 

// --- Manager 內容組件 ---
const ClassroomManager = () => {
    // 1. 從 Context 取得所有需要的資料與函式
    const { 
        currentClass, 
        seatMode, 
        isTeacherView, setIsTeacherView,
        toggleLock, toggleVoid, seatDrop, sidebarDrop,
        scoreStudent, // 核心評分函式
        updateAttendance,
        feedbacks, // 特效回饋陣列
        hoveredGroup, setHoveredGroup,
        
        // 狀態開關
        isSoundBoardOpen, setIsSoundBoardOpen,
    } = useClassroomContext();

    // 2. 本地 UI 狀態
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    
    // Modal 狀態管理
    const [activeModal, setActiveModal] = useState(null);
    const [scoringTarget, setScoringTarget] = useState(null); // 評分對象 (學生/小組/全班)
    const [editingStudent, setEditingStudent] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isLotteryOpen, setIsLotteryOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isScoreTickerOpen, setIsScoreTickerOpen] = useState(true); // 預設開啟小組計分條
    const [isGroupBoardOpen, setIsGroupBoardOpen] = useState(false); // 小組詳細計分板

    // 縮放邏輯 (RWD)
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const baseWidth = 1200; 
                const baseHeight = 800;
                const scaleX = clientWidth / baseWidth;
                const scaleY = clientHeight / baseHeight;
                // 限制最大縮放與最小縮放，保持適讀性
                const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2);
                setScale(newScale);
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // --- 關鍵修復：定義小組快速加分函式 ---
    const handleGroupQuickScore = (groupId, delta) => {
        // 建構一個「虛擬的小組實體」，讓 scoreStudent 知道這是針對小組的操作
        const groupTarget = {
            id: `GROUP_${groupId}`,
            name: `第 ${groupId} 組`,
            group: groupId,
            isGroupEntity: true, // 標記為小組實體
        };
        
        // 呼叫 Context 中的通用評分函式
        scoreStudent(groupTarget, delta, delta > 0 ? '快速加分' : '快速扣分');
    };

    // 處理全班加分
    const handleClassQuickScore = (delta) => {
        const classTarget = {
            id: 'CLASS_ENTITY',
            name: '全班同學',
            isClassEntity: true
        };
        scoreStudent(classTarget, delta, delta > 0 ? '全班獎勵' : '全班扣分');
    };

    // 處理學生點擊 (依據模式決定行為)
    const handleStudentClick = (student) => {
        if (!student) return;
        
        if (seatMode === 'attendance') {
             // 出席模式：切換出席狀態
             const currentStatus = currentClass.attendanceRecords?.[new Date().toISOString().split('T')[0]]?.[student.id] || 'present';
             const statusKeys = ['present', 'late', 'leave', 'absent'];
             const nextStatusIndex = (statusKeys.indexOf(currentStatus) + 1) % statusKeys.length;
             const nextStatus = statusKeys[nextStatusIndex];
             
             // 更新 Context
             const today = new Date().toISOString().split('T')[0];
             const currentRecord = currentClass.attendanceRecords?.[today] || {};
             updateAttendance(today, { ...currentRecord, [student.id]: nextStatus });
             
        } else if (seatMode === 'arrange') {
            // 排位模式：編輯學生
            setEditingStudent(student);
        } else {
            // 一般模式：打開評分視窗
            setScoringTarget(student);
        }
    };

    // 處理匯出圖片
    const handleExportImage = async () => {
        if (containerRef.current) {
            try {
                const dataUrl = await htmlToImage.toPng(containerRef.current, { backgroundColor: '#f8fafc' });
                const link = document.createElement('a');
                link.download = `${currentClass.name}_座位表.png`;
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error('匯出失敗:', error);
                alert('匯出圖片失敗，請重試');
            }
        }
    };

    // 若無班級資料，顯示載入中或空狀態
    if (!currentClass) return <div className="flex items-center justify-center h-screen text-slate-400">載入班級資料中...</div>;

    // 計算 Grid 樣式
    const gridRows = currentClass.layout?.rows || 6;
    const gridCols = currentClass.layout?.cols || 6;
    
    // 門的位置樣式
    const doorCommonClass = "absolute w-24 h-16 bg-slate-800 text-white flex items-center justify-center rounded-lg shadow-md z-10 font-bold border-2 border-slate-600";
    const doorSideClass = isTeacherView ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2";

    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-800">
            
            {/* 1. 側邊欄 */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                activeTab={activeModal} // 暫用，實際可能需要獨立狀態
                setActiveTab={setActiveModal}
                onOpenAttendance={() => setActiveModal('attendance')}
                onOpenBatchGroup={() => setActiveModal('batch_group')}
                onOpenExportStats={() => setActiveModal('export_stats')}
                onOpenSettings={() => setActiveModal('settings')}
                // 傳遞拖放相關 Props
                onStudentClick={handleStudentClick}
                onDragStart={(e, s) => e.dataTransfer.setData('studentId', s.id)}
            />

            {/* 2. 主內容區 */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
                
                {/* 頂部工具列 */}
                <Toolbar 
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isToolbarOpen={isToolbarOpen}
                    setIsToolbarOpen={setIsToolbarOpen}
                    setIsTemplateModalOpen={setIsTemplateModalOpen}
                    setIsLotteryOpen={setIsLotteryOpen}
                    setIsTimerOpen={setIsTimerOpen}
                    isTeacherView={isTeacherView}
                    setIsTeacherView={setIsTeacherView}
                    handleExportImage={handleExportImage}
                    isSoundBoardOpen={isSoundBoardOpen}
                    setIsSoundBoardOpen={setIsSoundBoardOpen}
                    isScoreTickerOpen={isScoreTickerOpen}
                    setIsScoreTickerOpen={setIsScoreTickerOpen}
                />

                {/* 座位表畫布區域 */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-200/50 p-4">
                    
                    {/* 縮放容器 */}
                    <div 
                        ref={containerRef}
                        className="relative bg-white shadow-2xl rounded-3xl p-8 md:p-12 transition-transform duration-300 origin-center border-4 border-slate-300 print:shadow-none print:border-none print:transform-none"
                        style={{ 
                            width: '1200px', 
                            height: '800px',
                            transform: `scale(${scale})` 
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            sidebarDrop && sidebarDrop(e); // 處理從側邊欄拉進空白處
                        }}
                    >
                        {/* 教室結構 */}
                        <div className="w-full h-full relative flex flex-col overflow-hidden print:shadow-none print:border-2 print:border-slate-800">
                            
                            {/* 門 (前後門依視角切換) */}
                            <div className={`${doorCommonClass} ${doorSideClass} top-8 print:border-slate-800 print:text-slate-800 print:bg-transparent`}>
                                <DoorOpen size={16} className="mb-2"/> {isTeacherView ? '後門' : '前門'}
                            </div>
                            <div className={`${doorCommonClass} ${doorSideClass} bottom-8 print:border-slate-800 print:text-slate-800 print:bg-transparent`}>
                                <DoorOpen size={16} className="mb-2"/> {isTeacherView ? '前門' : '後門'}
                            </div>

                            {/* 講台 / 後方區域 */}
                            <div className={`w-full h-12 mb-4 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-md shrink-0 print:border print:border-slate-300 print:text-black print:bg-transparent ${isTeacherView ? 'bg-slate-500 order-last mt-4 mb-0' : 'bg-slate-700'}`}>
                                {isTeacherView ? '教室後方 / 布告欄 (BACK)' : '講台 / 黑板 (TEACHER)'}
                            </div>

                            {/* 座位網格 */}
                            <div className="flex-1 w-full min-h-0 relative">
                                <div 
                                    className="grid gap-4 h-full w-full"
                                    style={{
                                        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                                        gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`
                                    }}
                                >
                                    {/* 產生所有格子 */}
                                    {Array.from({ length: gridRows * gridCols }).map((_, index) => {
                                        const row = Math.floor(index / gridCols);
                                        const col = index % gridCols;
                                        // 找出此位置的學生
                                        const student = currentClass.students.find(s => s.x === col && s.y === row);
                                        
                                        return (
                                            <SeatCell 
                                                key={`${row}-${col}`}
                                                row={row} col={col}
                                                student={student}
                                                onDrop={seatDrop}
                                                onStudentClick={handleStudentClick}
                                                onDragStart={(e) => {
                                                    if (student) e.dataTransfer.setData('studentId', student.id);
                                                }}
                                                // 傳遞狀態
                                                displayMode={seatMode === 'attendance' ? 'attendance' : 'normal'} // 簡化傳遞
                                                mode={seatMode}
                                                isVoid={currentClass.voidSeats?.some(v => v.x === col && v.y === row)}
                                                onToggleVoid={() => toggleVoid(col, row)}
                                                onToggleLock={() => toggleLock(student?.id)}
                                                attendanceStatus={currentClass.attendanceRecords?.[new Date().toISOString().split('T')[0]]}
                                                hoveredGroup={hoveredGroup}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 教師視角時的底部 (其實是原本的頂部) */}
                            {isTeacherView && (
                                <div className="w-full h-12 mt-4 rounded-xl flex items-center justify-center bg-slate-700 text-white font-bold tracking-widest shadow-md shrink-0 print:hidden">
                                    講台 / 黑板 (TEACHER)
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. 浮動組件層 (UI Overlays) */}
                
                {/* 小組計分跑馬燈 - 關鍵修復：傳入 handleGroupQuickScore */}
                <GroupScoreTicker 
                    isVisible={isScoreTickerOpen}
                    groupScores={currentClass.groupScores || {}}
                    onQuickScore={handleGroupQuickScore}
                    onDetailScore={() => setIsGroupBoardOpen(true)}
                    onClassScore={handleClassQuickScore}
                />

                {/* 分數特效回饋層 */}
                <ScoreFeedback feedbacks={feedbacks} />

                {/* 音效板 (隱藏式) */}
                {isSoundBoardOpen && <SoundBoard isOpen={true} onClose={() => setIsSoundBoardOpen(false)} />}
            </div>

            {/* 4. Modals 層 */}
            <ScoringModal 
                isOpen={!!scoringTarget} 
                onClose={() => setScoringTarget(null)} 
                student={scoringTarget}
                behaviors={currentClass.behaviors || []}
                onScore={(student, score, reason) => {
                    scoreStudent(student, score, reason);
                    // 評分後如果不希望自動關閉，可註解下行
                    setScoringTarget(null);
                }}
            />

            <GroupScoreBoardModal
                isOpen={isGroupBoardOpen}
                onClose={() => setIsGroupBoardOpen(false)}
                groupScores={currentClass.groupScores || {}}
                students={currentClass.students}
                onQuickScore={handleGroupQuickScore}
                onDetailScore={(groupId) => {
                    // 打開該組全員的評分
                    const dummyGroupStudent = { 
                        id: `GROUP_ENTITY_${groupId}`, 
                        name: `第 ${groupId} 組`, 
                        group: groupId, 
                        isGroupEntity: true 
                    };
                    setScoringTarget(dummyGroupStudent);
                }}
                onHoverGroup={setHoveredGroup}
            />

            <EditStudentModal
                isOpen={!!editingStudent}
                onClose={() => setEditingStudent(null)}
                student={editingStudent}
                onSave={(updatedStudent) => {
                    // 呼叫 Context 的 updateStudent (假設有) 或直接更新 class
                    const newStudents = currentClass.students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
                    // updateClass...
                    setEditingStudent(null);
                }}
            />

            {/* 其他工具型 Modals */}
            <LayoutTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} />
            <AttendanceModal isOpen={activeModal === 'attendance'} onClose={() => setActiveModal(null)} />
            <LotteryModal isOpen={isLotteryOpen} onClose={() => setIsLotteryOpen(false)} students={currentClass.students} />
            <TimerModal isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
            <BatchGroupModal isOpen={activeModal === 'batch_group'} onClose={() => setActiveModal(null)} />
            <ExportStatsModal isOpen={activeModal === 'export_stats'} onClose={() => setActiveModal(null)} />
            <BehaviorSettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} />

        </div>
    );
};

export default ClassroomManager;