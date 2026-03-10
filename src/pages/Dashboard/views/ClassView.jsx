import React from 'react';
import { Bell } from 'lucide-react';
import { UI_THEME } from '../../../constants';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer'; // 1. 引入

const ClassView = ({ schedule, now, currentSlot, isGlobalZhuyin }) => {
    const subjectName = schedule[now.getDay()]?.[currentSlot?.id] || currentSlot?.name;
    return (
        <div className={`flex-1 flex items-center justify-center p-8 transition-colors duration-500 ${UI_THEME.BACKGROUND}`}>
            <div className={`max-w-5xl w-full rounded-[3rem] shadow-2xl p-20 text-center border-4 relative overflow-hidden ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <Bell size={48} />
                </div>

                <h1 className={`text-7xl font-bold mb-8 tracking-tight ${isGlobalZhuyin ? '-tracking-widest' : 'tracking-tight'} ${UI_THEME.TEXT_PRIMARY}`}>
                    <ZhuyinRenderer text="上課了" isActive={isGlobalZhuyin} />
                </h1>

                <div className={`text-3xl ${UI_THEME.TEXT_SECONDARY} mb-12 font-medium`}>
                    <ZhuyinRenderer text="現在是" isActive={isGlobalZhuyin} />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mx-2 text-5xl inline-block align-middle"> {/* 稍微放大科目字體 */}
                        <ZhuyinRenderer
                            text={subjectName}
                            isActive={isGlobalZhuyin}
                        />
                    </span>
                    <ZhuyinRenderer text="的時間" isActive={isGlobalZhuyin} />
                </div>

                <div className={`rounded-2xl p-8 max-w-2xl mx-auto ${UI_THEME.BACKGROUND} ${UI_THEME.BORDER_LIGHT} border`}>
                    <p className={`text-2xl leading-relaxed ${UI_THEME.TEXT_SECONDARY}`}><ZhuyinRenderer text="請拿出課本與學用品" isActive={isGlobalZhuyin} /><br />
                        <ZhuyinRenderer text="保持安靜，專心聽講" isActive={isGlobalZhuyin} /></p>
                </div>
            </div>
        </div>
    );
};

export default ClassView;