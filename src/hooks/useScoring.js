import { useState, useEffect } from 'react';
import { useAudio } from './useAudio';
import { ATTENDANCE_STATUS } from '../utils/constants';

const MAX_LOGS = 100;
const MILESTONE_STEP = 10; // 設定每 10 分觸發一次里程碑

export const useScoring = (currentClass, updateClass) => {
    const { playAudio } = useAudio();
    const [feedbacks, setFeedbacks] = useState([]);

    // --- 1. 資料邏輯層 ---
    const scoreStudent = (targetId, behavior, mode) => {
        const timestamp = Date.now();
        const scoreValue = Number(behavior.value !== undefined ? behavior.value : (behavior.score || 0));
        const todayDate = new Date().toISOString().split('T')[0];
        const todayAttendance = currentClass.attendanceRecords?.[todayDate] || {};

        // 決定目標學生
        let targetStudents = [];
        if (mode === 'individual') targetStudents = currentClass.students.filter(s => s.id === targetId);
        else if (mode === 'class') targetStudents = currentClass.students;
        else if (mode === 'group_members') targetStudents = currentClass.students.filter(s => s.group === targetId);
        else if (mode === 'group') targetStudents = []; 

        // 過濾出席
        let validStudents = targetStudents;
        if (mode === 'class' || mode === 'group_members') {
            validStudents = targetStudents.filter(s => {
                const statusKey = todayAttendance[s.id] || 'present';
                if (ATTENDANCE_STATUS && ATTENDANCE_STATUS[statusKey]) return ATTENDANCE_STATUS[statusKey].isPresent;
                return statusKey !== 'absent' && statusKey !== 'personal' && statusKey !== 'leave';
            });
        }

        // 構建 Log
        let targetName = '未知目標';
        if (mode === 'class') targetName = '全班同學';
        else if (mode === 'group') targetName = `第 ${targetId} 組 (小組)`;
        else if (mode === 'group_members') targetName = `第 ${targetId} 組 (全員)`;
        else if (mode === 'individual') targetName = targetStudents[0]?.name || '未知';

        const behaviorLabel = behavior.label || (behavior.isQuick ? (scoreValue > 0 ? '快速加分' : '快速扣分') : '評分');
        const effectType = behavior.type || (scoreValue > 0 ? 'positive' : scoreValue < 0 ? 'negative' : 'neutral');

        const newLog = {
            id: `log_${timestamp}_${Math.random()}`,
            targetId: targetId === 'all' ? 'all' : targetId,
            targetType: mode,
            targetName,
            behaviorId: behavior.id || 'quick',
            behaviorLabel,
            score: scoreValue,
            value: scoreValue,
            timestamp,
            effectType,
            count: validStudents.length,
            validStudentIds: validStudents.map(s => s.id)
        };

        // 更新資料與偵測里程碑
        let updates = {};
        let milestoneEvents = []; // 收集里程碑事件

        if (mode === 'group') {
            const currentGroupScores = currentClass.groupScores || {};
            const oldScore = currentGroupScores[targetId] || 0;
            const newScore = oldScore + scoreValue;
            updates.groupScores = { ...currentGroupScores, [targetId]: newScore };

            // 偵測小組里程碑 (只在加分時觸發，且必須跨越 10 的倍數)
            if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                milestoneEvents.push({
                    type: 'group',
                    id: targetId,
                    score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP // 顯示 10, 20, 30...
                });
            }

        } else {
            const validIds = new Set(validStudents.map(s => s.id));
            updates.students = currentClass.students.map(s => {
                if (validIds.has(s.id)) {
                    const oldScore = s.score || 0;
                    const newScore = oldScore + scoreValue;
                    
                    // 偵測個人里程碑
                    if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                        milestoneEvents.push({
                            type: 'student',
                            id: s.id,
                            score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP
                        });
                    }
                    return { ...s, score: newScore };
                }
                return s;
            });
        }

        const currentLogs = currentClass.scoreLogs || [];
        newLog.milestones = milestoneEvents; 
        
        const updatedLogs = [...currentLogs, newLog].slice(-MAX_LOGS);

        updateClass({ ...currentClass, ...updates, scoreLogs: updatedLogs });

        // --- 觸發視覺效果 (包含一般加分 與 里程碑) ---
        
        // 1. 播放基本音效 (加/扣分) - 這裡先播放，如果有里程碑會再播放歡呼
        if (effectType === 'positive') playAudio('positive');
        else if (effectType === 'negative') playAudio('negative');

        // 2. 一般加分 Feedbacks
        const newFeedbacks = [];
        
        if (mode === 'group') {
            newFeedbacks.push({
                id: `fb_${timestamp}_GROUP`, x: window.innerWidth - 240, y: window.innerHeight / 2 - 100,
                value: scoreValue, label: `第 ${targetId} 組`, type: 'group'
            });
        } else {
            (validStudents || []).forEach((s, index) => {
                const el = document.getElementById(`student-card-${s.id}`);
                let rect = { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0 };
                if (el) rect = el.getBoundingClientRect();

                newFeedbacks.push({
                    id: `fb_${timestamp}_${s.id}_${Math.random()}`,
                    x: rect.left + rect.width / 2 - 20,
                    y: rect.top,
                    value: scoreValue,
                    delay: index * 10,
                    type: 'student'
                });
            });
            if (mode === 'class') {
                newFeedbacks.push({
                    id: `fb_${timestamp}_CLASS`, x: window.innerWidth / 2, y: window.innerHeight / 2,
                    value: scoreValue, label: '全班獎勵', type: 'class'
                });
            }
        }

        // 3. 里程碑 Feedbacks 與音效
        milestoneEvents.forEach(event => {
            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;
            
            if (event.type === 'student') {
                const el = document.getElementById(`student-card-${event.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    x = rect.left + rect.width / 2;
                    y = rect.top + rect.height / 2;
                }
            } else if (event.type === 'group') {
                x = window.innerWidth - 200; // 靠近右側戰況欄
                y = 100;
            }

            newFeedbacks.push({
                id: `milestone_${timestamp}_${event.id}`,
                x, y,
                value: event.score,
                label: '里程碑達成！',
                type: 'milestone',
                milestoneType: event.type // 'student' or 'group'
            });
        });

        if (newFeedbacks.length > 0) {
            setFeedbacks(prev => [...prev, ...newFeedbacks]);
            setTimeout(() => {
                const idsToRemove = new Set(newFeedbacks.map(f => f.id));
                setFeedbacks(prev => prev.filter(f => !idsToRemove.has(f.id)));
            }, 3000); // 延長顯示時間，讓里程碑特效可以演完
        }

        // ✅ 修改：若有里程碑事件，播放歡呼音效 (applause)
        if (milestoneEvents.length > 0) {
            // 延遲一點點播放，讓它跟 "positive" 音效稍微錯開，更有層次感
            setTimeout(() => {
                playAudio('applause');
            }, 100);
        }
    };

    const resetScores = (type) => {
        let updates = {};
        if (type === 'student') {
            updates.students = currentClass.students.map(s => ({ ...s, score: 0 }));
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'student');
        } else if (type === 'group') {
            updates.groupScores = {};
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'group_entity');
        }
        updateClass({ ...currentClass, ...updates });
    };

    const updateBehaviors = (newBehaviors) => updateClass({ ...currentClass, behaviors: newBehaviors });
    const clearScoreLogs = () => updateClass({ ...currentClass, scoreLogs: [] });

    return { scoreStudent, resetScores, updateBehaviors, clearScoreLogs, feedbacks };
};