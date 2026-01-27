import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Moon, Battery, BatteryCharging, MousePointer2, Circle } from 'lucide-react'; // 新增 Circle 用於滿月
import StarryBackground from '../components/StarryBackground';
import WeatherWidget from '../components/WeatherWidget';

// 農曆月相計算 (簡單近似法)
const getMoonPhase = (date) => {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    year--;
    month += 12;
  }

  ++month;
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09; // jd is total days elapsed
  b = jd / 29.5305882; // divide by the moon cycle
  b -= parseInt(b); // subtract integer part to leave fractional part of original total days
  b *= 29.5305882; // scale fraction from 0-29.5
  b = Math.round(b); // round to nearest day

  if (b >= 30) b = 0; // 0 and 30 are the same (new moon)

  const phases = [
    { name: "新月 (New Moon)", icon: "moon-off" },        // 0
    { name: "眉月 (Waxing Crescent)", icon: "moon" },     // 1-6
    { name: "上弦月 (First Quarter)", icon: "moon" },      // 7
    { name: "盈凸月 (Waxing Gibbous)", icon: "moon" },    // 8-14
    { name: "滿月 (Full Moon)", icon: "circle" },         // 15
    { name: "虧凸月 (Waning Gibbous)", icon: "moon" },    // 16-22
    { name: "下弦月 (Last Quarter)", icon: "moon" },      // 23
    { name: "殘月 (Waning Crescent)", icon: "moon" }      // 24-29
  ];

  if (b === 0) return phases[0];
  if (b <= 6) return phases[1];
  if (b === 7) return phases[2];
  if (b <= 14) return phases[3];
  if (b === 15) return phases[4];
  if (b <= 22) return phases[5];
  if (b === 23) return phases[6];
  return phases[7];
};

const EcoView = ({ now, is24Hour, onWake, weatherConfig }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  
  // 防烙印位移與電池狀態
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [battery, setBattery] = useState({ level: 100, charging: false });
  
  const cursorTimerRef = useRef(null);

  // 計算今日月相 (每天只會算一次，效能消耗極低)
  const currentMoonPhase = useMemo(() => getMoonPhase(now), [now.getDate()]);

  // 1. 滑鼠靜止隱藏邏輯
  useEffect(() => {
    const handleMouseMove = () => {
      setIsCursorHidden(false);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      // 設定 3 秒後進入「極簡模式」
      cursorTimerRef.current = setTimeout(() => {
        setIsCursorHidden(true);
      }, 3000);
    };

    handleMouseMove(); // 初始化
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, []);

  // 2. 防烙印與電池監聽 (合併優化)
  useEffect(() => {
    // 防烙印：每分鐘微移
    const shiftPixels = () => {
      const x = Math.floor(Math.random() * 10) - 5;
      const y = Math.floor(Math.random() * 10) - 5;
      setOffset({ x, y });
    };
    const burnInInterval = setInterval(shiftPixels, 60000);
    shiftPixels();

    // 電池 API
    let batteryConfig = null;
    const updateBattery = () => {
      if (batteryConfig) {
        setBattery({
          level: Math.round(batteryConfig.level * 100),
          charging: batteryConfig.charging
        });
      }
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then((batt) => {
        batteryConfig = batt;
        updateBattery();
        batt.addEventListener('levelchange', updateBattery);
        batt.addEventListener('chargingchange', updateBattery);
      });
    }

    return () => {
      clearInterval(burnInInterval);
      if (batteryConfig) {
        batteryConfig.removeEventListener('levelchange', updateBattery);
        batteryConfig.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  const handleWakeClick = () => {
    setIsWaking(true);
    setTimeout(() => onWake(), 700);
  };

  return (
    <div 
      onClick={handleWakeClick}
      className={`h-full w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden group select-none 
        ${isCursorHidden ? 'cursor-none' : 'cursor-pointer'}`}
    >
      {/* 背景：強制使用 deep theme */}
      <div className="absolute inset-0 z-0">
        <StarryBackground theme="deep" isWaking={isWaking} />
      </div>

      {/* 喚醒提示：滑鼠隱藏時，提示也完全消失 */}
      <div className={`absolute bottom-12 flex items-center gap-2 text-slate-400 font-bold bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700 transition-opacity duration-500
        ${isCursorHidden ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <MousePointer2 size={16} className="animate-bounce" />
        點擊畫面喚醒系統
      </div>

      {/* 主內容區域：應用防烙印位移 + 喚醒動畫 */}
      <div 
        className={`relative z-10 flex flex-col items-center transition-all duration-1000 ease-in-out 
          ${isWaking ? 'opacity-0 scale-95 blur-md' : 'opacity-100'}`}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        
        {/* --- 可隱藏資訊區 (月亮、狀態、天氣) --- */}
        {/* 當 isCursorHidden 為 true 時，透明度降為 0，實現「只留時間」的效果 */}
        <div className={`flex flex-col items-center transition-opacity duration-1000 delay-100
          ${isCursorHidden ? 'opacity-0' : 'opacity-100'}`}>
          
          {/* 月相顯示 */}
          <div className="p-8 rounded-full bg-indigo-950/20 border border-indigo-500/10 shadow-[0_0_50px_rgba(79,70,229,0.15)] mb-6">
              {/* 根據是否滿月切換 Icon */}
              {currentMoonPhase.icon === 'circle' ? (
                <Circle size={80} className="text-indigo-200 fill-indigo-100/20 drop-shadow-[0_0_25px_rgba(165,180,252,0.6)]" />
              ) : (
                <Moon size={80} className="text-indigo-300/80 drop-shadow-[0_0_15px_rgba(165,180,252,0.3)]" />
              )}
          </div>
        </div>

        {/* --- 時間顯示區 (永遠保留，但可以稍微變暗) --- */}
        <div className="flex flex-col gap-2 items-center">
            {/* 時間字體：在待機模式下稍微降低亮度 (opacity-80 -> opacity-40) 以進一步省電 */}
            <div className={`text-[8rem] font-black leading-none text-slate-200 tracking-tighter drop-shadow-2xl font-mono transition-opacity duration-1000
              ${isCursorHidden ? 'opacity-40' : 'opacity-90'}`}>
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
            </div>
            
            {/* --- 底部資訊區 (隨滑鼠隱藏) --- */}
            <div className={`flex flex-col items-center gap-4 transition-all duration-1000
              ${isCursorHidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                
                {/* 狀態列：月相名稱 + 電池 */}
                <div className="flex items-center gap-4 text-slate-500 font-medium tracking-widest text-sm uppercase">
                    <span>{currentMoonPhase.name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <div className={`flex items-center gap-2 ${battery.level < 20 && !battery.charging ? 'text-red-400' : 'text-emerald-400'}`}>
                        {battery.charging ? <BatteryCharging size={16} /> : <Battery size={16} />}
                        <span>{battery.level}%</span>
                    </div>
                </div>

                {/* 天氣 Widget */}
                {weatherConfig?.enabled && (
                   <div className="dark mt-2 transform scale-110 opacity-80"> 
                      <WeatherWidget weatherConfig={weatherConfig} />
                   </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EcoView;