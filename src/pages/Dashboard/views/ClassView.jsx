import React from 'react';
import { Bell } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

const ClassView = ({ schedule, now, currentSlot }) => {
  return (
    <div className={`flex-1 flex items-center justify-center p-8 transition-colors duration-500 ${UI_THEME.BACKGROUND}`}>
        <div className={`max-w-5xl w-full rounded-[3rem] shadow-2xl p-16 text-center border-4 relative overflow-hidden ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                <Bell size={48} />
            </div>
            
            <h1 className={`text-7xl font-bold mb-8 tracking-tight ${UI_THEME.TEXT_PRIMARY}`}>上課了</h1>
            
            <div className={`text-3xl ${UI_THEME.TEXT_SECONDARY} mb-12 font-medium`}>
                現在是 
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mx-2">
                    {schedule[now.getDay()]?.[currentSlot?.id] || currentSlot?.name}
                </span> 
                時間
            </div>
            
            <div className={`rounded-2xl p-8 max-w-2xl mx-auto ${UI_THEME.BACKGROUND} ${UI_THEME.BORDER_LIGHT} border`}>
                <p className={`text-2xl leading-relaxed ${UI_THEME.TEXT_SECONDARY}`}>請拿出課本與學用品<br/>保持安靜，專心聽講</p>
            </div>
        </div>
    </div>
  );
};

export default ClassView;