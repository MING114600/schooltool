import React from 'react';
import { UI_THEME } from '../../../utils/constants';
import { Coffee } from 'lucide-react';
import WeatherWidget from '../components/WeatherWidget';
import StarryBackground from '../components/StarryBackground'; 

const OffHoursView = ({ now, is24Hour, weatherConfig }) => {
  const formatROCDate = (date) => {
    const rocYear = date.getFullYear() - 1911;
    const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return `民國${rocYear}年${(date.getMonth() + 1).toString().padStart(2,'0')}月${date.getDate().toString().padStart(2,'0')}日 星期${week}`;
  };

  return (
    <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-8 transition-colors duration-1000">
	<div className="absolute inset-0 z-0 opacity-60">
          {/* opacity-60 是為了不要讓背景太搶眼，你可以自己調整 */}
          <StarryBackground />
      </div>
        <div className="text-center z-10">
            <div className="mb-8">
                <div className="text-xl text-blue-300 font-medium mb-2 tracking-widest uppercase">Off-Hours</div>
                <h2 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">非上課時段</h2>
            </div>
            <div className="font-mono text-[8rem] leading-none text-slate-200 font-bold drop-shadow-2xl">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}
            </div>
            <div className="text-2xl text-slate-400 mt-4 font-light">
                {formatROCDate(now)}
            </div>
			{weatherConfig?.enabled && (
               <div className="dark mt-8 transform scale-120 origin-top opacity-80 hover:opacity-100 transition-opacity"> 
                  <WeatherWidget weatherConfig={weatherConfig} />
               </div>
            )}			
        </div>
    </div>
  );
};

export default OffHoursView;