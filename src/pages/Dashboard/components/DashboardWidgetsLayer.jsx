import React from 'react';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import TimerWidget from '../../../components/common/widgets/TimerWidget';
import LotteryWidget from '../../../components/common/widgets/LotteryWidget';
import SoundBoard from '../../../components/common/widgets/SoundBoard';
import DashboardContactBookWidget from './DashboardContactBookWidget';

const DashboardWidgetsLayer = ({
    toolsState,
    toggleTool,
    classes,
    currentClassId,
    todayAttendance,
    isContactBookOpen,
    setIsContactBookOpen,
    isGlobalZhuyin,
    statusMode
}) => {
    return (
        <>
            <ErrorBoundary>
                <TimerWidget isOpen={toolsState.timer} onClose={() => toggleTool('timer', false)} />
            </ErrorBoundary>

            <ErrorBoundary>
                <SoundBoard isOpen={toolsState.sound} onClose={() => toggleTool('sound', false)} />
            </ErrorBoundary>

            <ErrorBoundary>
                <LotteryWidget
                    isOpen={toolsState.lottery}
                    onClose={() => toggleTool('lottery', false)}
                    classes={classes}
                    defaultClassId={currentClassId}
                    attendanceStatus={todayAttendance}
                />
            </ErrorBoundary>

            {/* 聯絡簿 Widget */}
            <DashboardContactBookWidget
                isOpen={isContactBookOpen}
                onClose={() => setIsContactBookOpen(false)}
                isGlobalZhuyin={isGlobalZhuyin}
                statusMode={statusMode}
            />
        </>
    );
};

export default DashboardWidgetsLayer;
