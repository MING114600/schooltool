import React, { useState, useEffect, useRef, useMemo } from 'react';
import StarryBackground from '../components/StarryBackground';
import WeatherWidget from '../components/WeatherWidget';
import MoonPhaseTech from "../components/MoonPhaseTech";

// --- 天文算法 (維持不變) ---
const SYNODIC_MONTH = 29.530588853;
const NEW_MOON_JD = 2451550.1;

const toJulianDayUTC = (date) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const D = date.getUTCDate() + (date.getUTCHours() + (date.getUTCMinutes() + date.getUTCSeconds() / 60) / 60) / 24;
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
};

export const getMoonPhase = (date = new Date()) => {
  const jd = toJulianDayUTC(date);
  const age = ((jd - NEW_MOON_JD) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH));
  let name, waxing;
  if (age < 1 || age > 28.5) { name = "新月"; waxing = true; }
  else if (age < 6.5) { name = "眉月"; waxing = true; }
  else if (age < 8.5) { name = "上弦月"; waxing = true; }
  else if (age < 13.8) { name = "盈凸月"; waxing = true; }
  else if (age < 15.8) { name = "滿月"; waxing = true; }
  else if (age < 21.5) { name = "虧凸月"; waxing = false; }
  else if (age < 23.5) { name = "下弦月"; waxing = false; }
  else { name = "殘月"; waxing = false; }
  const isSuperMoon = (name === "滿月" && illumination > 0.995);
  return { name, waxing, age, illumination, isSuperMoon };
};

// --- 日期格式化 ---
const formatROCDate = (date) => {
    const rocYear = date.getFullYear() - 1911;
    const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return {
        // 這裡稍微簡化格式，讓垂直佈局更緊湊
        fullDate: `民國${rocYear}年${(date.getMonth() + 1).toString().padStart(2,'0')}月${date.getDate().toString().padStart(2,'0')}日`,
        week: `(${week})` 
    };
};

const EcoView = ({ 
    now, 
    is24Hour, 
    onWake, 
    onBackgroundClick,
    weatherConfig, 
    controlDock
}) => {
  const [isWaking, setIsWaking] = useState(false);
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  const [screenSaverPos, setScreenSaverPos] = useState({ x: 0, y: 0 });
  const cursorTimerRef = useRef(null);

  const currentMoonPhase = useMemo(() => getMoonPhase(now), [now.getFullYear(), now.getMonth(), now.getDate()]);
  const rocDate = useMemo(() => formatROCDate(now), [now]);

  useEffect(() => {
    const handleActivity = () => {
      setIsCursorHidden(false);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => setIsCursorHidden(true), 3000);
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    handleActivity(); 
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearTimeout(cursorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const time = Date.now() / 8000; 
      const radius = 12; 
      setScreenSaverPos({ x: Math.cos(time) * radius, y: Math.sin(time) * radius });
    };
    const interval = setInterval(updatePosition, 5000);
    updatePosition();
    return () => clearInterval(interval);
  }, []);

  const handleWakeClick = () => {
    if (isCursorHidden) {
        setIsCursorHidden(false);
        if(onWake) onWake(); 
    } else {
        if (onBackgroundClick) onBackgroundClick();
    }
  };

  return (
    <div
      onClick={handleWakeClick}
      className={`h-full w-full relative overflow-hidden group select-none transition-cursor duration-500
        ${isCursorHidden ? 'cursor-none' : 'cursor-default'}
        bg-[radial-gradient(circle_at_center,_#171725_0%,_#0a0a12_50%,_#000000_100%)]
      `}
    >
      {/* 星空層 */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-[3000ms] ${isCursorHidden ? 'opacity-60' : 'opacity-80'}`}>
        <StarryBackground theme="deep" isWaking={isWaking} />
      </div>

      {/* --- HUD 內容層 (垂直中軸堆疊) --- */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center z-10 transition-transform duration-[5000ms] ease-linear"
        style={{ transform: `translate(${screenSaverPos.x}px, ${screenSaverPos.y}px)` }}
      >
        
        {/* 1. 上方：月相 (Idle 時淡出) */}
        <div className={`mb-8 transition-all duration-[1500ms] ease-in-out flex flex-col items-center
            ${isCursorHidden ? 'opacity-0 -translate-y-10 scale-90' : 'opacity-100 translate-y-0 scale-100'}
        `}>
           <MoonPhaseTech 
             size={150} 
             isIdle={isCursorHidden}
             illumination={currentMoonPhase.illumination}
             waxing={currentMoonPhase.waxing}
           />
           <div className="mt-3 text-slate-400 text-xs tracking-[0.3em] font-light uppercase">
               {currentMoonPhase.name}
           </div>
        </div>

        {/* 2. 中央：時間 (雙層疊加，視覺重心) */}
        <div className="relative z-20 grid place-items-center mb-10">
            {/* Idle Layer (消光灰) */}
            <h1 className={`
                col-start-1 row-start-1 p-4
                text-[13rem] leading-none font-sans tabular-nums tracking-tighter
                font-bold text-slate-500/40 
                transition-all duration-[2000ms] ease-out select-none
                ${isCursorHidden ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !is24Hour })}
            </h1>

            {/* Active Layer (金屬光) */}
            <h1 className={`
                col-start-1 row-start-1 p-4
                text-[13rem] leading-none font-sans tabular-nums tracking-tighter
                font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 drop-shadow-2xl
                transition-all duration-[800ms] ease-out select-none
                ${isCursorHidden ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
            `}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !is24Hour })}
            </h1>
        </div>

        {/* 3. 下方：資訊整合區 (日期 | 天氣) */}
        {/* 改為置中的 Flex Row，並在 Idle 時淡出 */}
        <div className={`
            flex items-center justify-center gap-8 px-8 py-4
            rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-xl
            transition-all duration-[1000ms] ease-in-out pointer-events-none mb-24
            ${isCursorHidden ? 'opacity-0 translate-y-10 blur-sm' : 'opacity-100 translate-y-0 blur-0'}
        `}>
            
            {/* 日期區塊 */}
            <div className="flex items-center gap-3 pointer-events-auto">
                <div className="text-slate-200 text-2xl font-light tracking-wide whitespace-nowrap drop-shadow-lg">
                    {rocDate.fullDate}
                </div>
                <div className="text-slate-400 text-xl font-light tracking-widest">
                        {rocDate.week}
                </div>
            </div>

            {/* 分隔線 */}
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-600/50 to-transparent"></div>

            {/* 天氣區塊 */}
            <div className="pointer-events-auto scale-110 grayscale-[0.2] hover:grayscale-0 transition-all">
                <WeatherWidget weatherConfig={weatherConfig} minimal={true} />
            </div>
        </div>

        {/* 4. Control Dock (底部獨立層) */}
        {controlDock && (
            <div className={`absolute inset-x-0 bottom-0 z-50 transition-all duration-[1000ms] ease-in-out flex justify-center
                ${isCursorHidden ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}
            `}>
                {controlDock}
            </div>
        )}

      </div>
    </div>
  );
};

export default EcoView;