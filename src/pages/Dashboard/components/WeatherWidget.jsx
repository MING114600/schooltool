import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudRain, Sun, CloudLightning, Snowflake, CloudFog, 
  MapPin, Umbrella, SunDim 
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// 天氣代碼轉換圖示 (保持不變)
const getWeatherIcon = (code) => {
  if (code === 0) return <Sun size={36} className="text-amber-500 animate-pulse-slow" />; 
  if (code >= 1 && code <= 3) return <Cloud size={36} className="text-slate-400" />;
  if ([45, 48].includes(code)) return <CloudFog size={36} className="text-slate-300" />;
  if (code >= 51 && code <= 67) return <CloudRain size={36} className="text-blue-400" />;
  if (code >= 71 && code <= 77) return <Snowflake size={36} className="text-cyan-300" />;
  if (code >= 80 && code <= 82) return <CloudRain size={36} className="text-blue-500" />;
  if (code >= 95) return <CloudLightning size={36} className="text-yellow-400" />;
  return <Sun size={36} className="text-amber-500" />;
};

const WeatherWidget = ({ weatherConfig }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!weatherConfig?.lat || !weatherConfig?.lon) return;
      
      try {
        setLoading(true);
        // 更新 API URL：增加 daily=precipitation_probability_max,uv_index_max
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${weatherConfig.lat}&longitude=${weatherConfig.lon}&current=temperature_2m,weather_code,apparent_temperature&daily=precipitation_probability_max,uv_index_max&timezone=auto`
        );
        const data = await res.json();
        
        if (data.current && data.daily) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            feel: Math.round(data.current.apparent_temperature),
            code: data.current.weather_code,
            // 抓取今天的資料 (index 0)
            rainChance: data.daily.precipitation_probability_max[0],
            uv: data.daily.uv_index_max[0]
          });
        }
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30分鐘更新
    return () => clearInterval(interval);
  }, [weatherConfig]);

  if (loading) return <div className={`animate-pulse w-48 h-20 rounded-2xl ${UI_THEME.SURFACE_GLASS}`}></div>;
  if (!weather) return null;

  return (
    <div className={`flex items-center gap-5 px-6 py-4 rounded-3xl border backdrop-blur-md shadow-lg transition-all hover:scale-105 group ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_LIGHT}`}>
      
      {/* 左側：圖示與氣溫 */}
      <div className="flex items-center gap-3">
        <div className="filter drop-shadow-md">{getWeatherIcon(weather.code)}</div>
        <div>
           <div className={`text-3xl font-black leading-none tracking-tight ${UI_THEME.TEXT_PRIMARY}`}>
             {weather.temp}°
           </div>
           <div className={`text-base font-bold mt-1 ${UI_THEME.TEXT_SECONDARY} opacity-80`}>
             體感 {weather.feel}°
           </div>
        </div>
      </div>

      <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-1"></div>

      {/* 右側：詳細資訊 (降雨/紫外線/地點) */}
      <div className="flex flex-col gap-1">
         {/* 降雨機率 */}
         <div className="flex items-center gap-2 text-base font-bold text-blue-600 dark:text-blue-400">
            <Umbrella size={14} />
            <span>降雨 {weather.rainChance}%</span>
         </div>
         
         {/* 紫外線 */}
         <div className={`flex items-center gap-2 text-base font-bold ${weather.uv > 7 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
            <SunDim size={14} />
            <span>UV {weather.uv}</span>
         </div>

         {/* 地點 */}
         <div className={`flex items-center gap-1 text-[10px] font-bold ${UI_THEME.TEXT_MUTED} mt-1 opacity-60`}>
             <MapPin size={10} />
             <span className="max-w-[80px] truncate">{weatherConfig.district || weatherConfig.city}</span>
         </div>
      </div>
    </div>
  );
};

export default WeatherWidget;