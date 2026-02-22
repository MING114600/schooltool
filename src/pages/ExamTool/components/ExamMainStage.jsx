import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Users, Coffee, AlertCircle , ArrowRight, Moon, Sun} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { useOS } from '../../../context/OSContext';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';

// --- 子元件：跑馬燈（淡入/停留/淡出/換句） ---
const SimpleTicker = ({ messages = [], isActive, isGlobalZhuyin }) => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // 當啟用狀態或訊息池變動（break↔exam）就重置
  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [isActive, safeMessages.length]);

	useEffect(() => {
	  if (!isActive || safeMessages.length === 0) return;

	  const DISPLAY_DURATION = 8000;
	  const FADE_DURATION = 500;

	  let t2;
	  const t1 = setTimeout(() => {
		setVisible(false);
		t2 = setTimeout(() => {
		  setIndex((prev) => (prev + 1) % safeMessages.length);
		  setVisible(true);
		}, FADE_DURATION);
	  }, DISPLAY_DURATION);

	  return () => {
		clearTimeout(t1);
		if (t2) clearTimeout(t2);
	  };
	}, [index, isActive, safeMessages.length]);

  if (!isActive || safeMessages.length === 0) return null;

  return (
    <div
      className={`
        transition-all duration-500 ease-in-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <ZhuyinRenderer text={safeMessages[index]} isActive={isGlobalZhuyin} />
    </div>
  );
};

// --- 子元件：音訊播放器 ---
const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if(!audio) return;
    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const togglePlay = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };
  const seek = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };
  const rewind = () => {
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  return (
    <div className={`mt-6 p-4 rounded-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 z-50 border shadow-lg ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
      <audio ref={audioRef} src={src} />
      <div className="flex items-center gap-4">
        <button onClick={togglePlay} className={`p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md ${UI_THEME.BTN_PRIMARY}`}>
          {playing ? <Pause fill="currentColor" size={20}/> : <Play fill="currentColor" className="ml-1" size={20}/>}
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <input type="range" min="0" max={duration || 100} value={progress} onChange={seek} className="w-full accent-blue-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
          <div className={`flex justify-between text-xs font-mono ${UI_THEME.TEXT_SECONDARY}`}>
            <span>{new Date(progress * 1000).toISOString().substr(14, 5)}</span>
            <span>{new Date((duration || 0) * 1000).toISOString().substr(14, 5)}</span>
          </div>
        </div>
        <button onClick={rewind} className={`p-2 rounded-full transition-all ${UI_THEME.BTN_GHOST}`} title="倒帶 10 秒">
          <RotateCcw size={20} /><span className="text-[10px] block text-center">-10s</span>
        </button>
      </div>
    </div>
  );
};

// --- 主畫面 ---
const ExamMainStage = ({ 
  statusData, 
  attendanceStats, 
  onOpenAttendance,
  announcements 
}) => {
  const { isGlobalZhuyin } = useOS();
  const { status, remainingSeconds, progress, slot, nextSlot, audioUrl } = statusData;

  const [now, setNow] = useState(new Date());

	useEffect(() => {
	  const timer = setInterval(() => {
		setNow(new Date());
	  }, 1000);
	  return () => clearInterval(timer);
	}, []);

  // ★ 修正點：轉換為民國年格式
  const today = new Date();
  const rocYear = today.getFullYear() - 1911;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const weekdayStr = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
  
  // 組合字串：115/01/29 週四
  const fullDateStr = `民國${rocYear}年${month}月${day}日 (${weekdayStr})`;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isBreak = status === 'break';
  const isIdle = status === 'idle';
  const isExam = status === 'exam';
  
  const getProgressColor = () => {
	if (isIdle) return 'bg-slate-300 dark:bg-slate-700';
    if (isBreak) return 'bg-emerald-500';
    if (progress > 50) return 'bg-blue-600';
    if (progress > 20) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  const timerTextColor = 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]';
	const announcementsSafe = announcements ?? { active: false, break: [], exam: [] };
	const tickerActive = Boolean(announcementsSafe.active);
	const isBreakLike = isBreak || isIdle;
	const tickerMessages = isBreakLike
	  ? (Array.isArray(announcementsSafe.break) ? announcementsSafe.break : [])
	  : (Array.isArray(announcementsSafe.exam) ? announcementsSafe.exam : []);


  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden transition-colors duration-500 ${UI_THEME.BACKGROUND}`}>
      
      {/* --- A. 頂部資訊列 (Header) --- */}
      <div className="w-full p-6 flex justify-between items-start z-20">
        
        {/* ★ 修正點：日期與星期同一行 */}
        <div className="flex flex-col gap-1">
            <div className={`text-3xl md:text-xl font-black ${UI_THEME.TEXT_PRIMARY} opacity-80`}>
                {fullDateStr}
            </div>
			<div className={`text-3xl md:text-6xl font-black ${UI_THEME.TEXT_PRIMARY} `}>
			{now.toLocaleTimeString('zh-TW', {
			  hour: '2-digit',
			  minute: '2-digit',
			  second: '2-digit'
			})}
		  </div>
        </div>
	  </div>
        {/* 應到實到 (HUD) */}
		<div className="absolute top-8 right-8 z-30 pointer-events-auto hover:scale-110 transition-transform ease-out">
         <div className="flex flex-col items-center gap-2">
            <button 
                onClick={onOpenAttendance}
                className={`flex items-center gap-3 px-6 py-3 rounded-full border shadow-sm hover:shadow-md transition-all group ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}
            >
                <Users size={24} className={UI_THEME.TEXT_SECONDARY} />
                <span className="font-mono font-bold text-2xl flex items-center gap-2">
					  {/* 實到 */}
					  <span className="text-sm opacity-60">實到：</span>
					  <span
						className={
						  attendanceStats.actual < attendanceStats.expected
							? 'text-rose-600 dark:text-rose-400 text-4xl'
							: UI_THEME.TEXT_PRIMARY
						}
					  >
						{attendanceStats.actual}
					  </span>
					  <span className="text-sm opacity-60">人</span>
					  <span className="opacity-40 mx-1">/</span>

					  {/* 應到 */}
					  <span className="text-sm opacity-60">應到：</span>
					  <span>
						{attendanceStats.expected}
					  </span>
					</span>
					<span className="text-sm opacity-60">人</span>
            </button>
            
            {/* 未到名單提示 */}
            {attendanceStats.absentees.length > 0 && (
				<div className={`mt-2 backdrop-blur text-sm rounded-xl p-3 max-w-[200px] animate-in fade-in slide-in-from-top-2 shadow-sm hover:shadow-md ${UI_THEME.SURFACE_CARD}  ${UI_THEME.BORDER_DEFAULT}`}>
					<ul className="space-y-1 ">
					  <span className="text-[20px] uppercase text-rose-400 font-bold">
						缺席
					  </span>
					{attendanceStats.absentees.map(s => (
						<li key={s.id} className="flex flex-col">
							{s.isManualNote ? (
								// 手動模式：顯示大段備註文字
								<div className="flex flex-col gap-1 w-full">									
									<span className={`font-bold text-lg leading-relaxed  whitespace-pre-wrap break-words block w-[150px] ${UI_THEME.TEXT_PRIMARY} max-h-[50vh] overflow-auto`}>
										{s.name}
									</span>
								</div>
							) : (
								// 系統名單模式：顯示座號+姓名
								<div className="flex flex-col gap-1 w-full">
								 {attendanceStats.absentees.idx === 0 && (
								 <span className="text-[16px] uppercase text-rose-400 font-bold">缺席</span> )}
								<div className="flex justify-between items-center w-full">
									<span className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>{s.number} {s.name}</span>
									<span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded">{s.statusLabel}</span>
								</div>
								</div>
							)}
						</li>
					))}
					</ul>
				</div>
			)}
        </div>
		</div>
      

      {/* --- B. 中央舞台 (Center Stage) --- */}
<div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
  <div className="w-full max-w-fulll px-4">
    <div className="flex flex-col items-center gap-10 animate-in slide-in-from-bottom-4 fade-in duration-700">

      {/* 1) 標題 + 下一節（整塊往上移） */}
      <div className="flex flex-col items-center gap-4 -mt-16">
        <div className="flex items-center gap-4">
          {(isBreak || isIdle) && (
            <Coffee size={36} className="text-emerald-500 dark:text-emerald-400" />
          )}
          <h2
            className={`
              text-4xl md:text-6xl
              font-black tracking-widest uppercase text-center
              ${isBreak ? 'text-emerald-600 dark:text-emerald-400' : UI_THEME.TEXT_PRIMARY}
            `}
          >
		  {isBreak ? (
                    <ZhuyinRenderer text="下課休息" isActive={isGlobalZhuyin} />
                  ) : isIdle ? (
                    <ZhuyinRenderer text="目前無考試" isActive={isGlobalZhuyin} />
                  ) : slot?.name ? (
                    <>
                      <span className="opacity-70">
                        <ZhuyinRenderer text="目前考試：" isActive={isGlobalZhuyin} />
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        <ZhuyinRenderer text={slot.name} isActive={isGlobalZhuyin} />
                      </span>
                    </>
                  ) : (
                    <ZhuyinRenderer text="準備中" isActive={isGlobalZhuyin} />
                  )}
          </h2>
        </div>

        {isBreak && nextSlot && (
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 border-2 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 animate-pulse shadow-sm">
            <span className="text-lg font-bold opacity-70"><ZhuyinRenderer text="下一節" isActive={isGlobalZhuyin} /></span>
            <ArrowRight size={20} />
            <span className="text-2xl font-black"><ZhuyinRenderer text={nextSlot.name} isActive={isGlobalZhuyin} /></span>
          </div>
        )}
      </div>

{/* Timer：幾何正中央；Ticker：掛在 Timer 下方，不影響 Timer 置中 */}
<div className="absolute inset-0 z-10 pointer-events-none">
  {/* 1) Timer 本體：幾何置中 */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[80%]">
    {/* 膠囊計時器外殼 */}
    <div className="relative w-full h-48 md:h-64 rounded-[3rem] bg-slate-200 dark:bg-slate-800 shadow-inner overflow-hidden border-4 border-slate-100 dark:border-slate-700 ring-1 ring-slate-200 dark:ring-slate-800">
      {/* 進度條 */}
      <div
        className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear shadow-[0_0_30px_rgba(0,0,0,0.1)]`}
        style={{ width: `${progress}%` }}
      />

      {/* Timer 字 */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${timerTextColor} font-mono leading-none font-bold tracking-tighter tabular-nums select-none z-10`}
      >
        {isIdle ? (
          <span className="text-[4rem] md:text-[6rem] tracking-widest opacity-80">
            --:--
          </span>
        ) : (
          <span className="text-[12rem] md:text-[15rem] leading-none">
            {formatTime(remainingSeconds)}
          </span>
        )}
      </div>
    </div>

    {/* 2) Ticker：掛在 Timer 下方（不影響 Timer 幾何置中） */}
    <div
      className="absolute left-1/2 top-full -translate-x-1/2 mt-6 w-[92vw] max-w-[92vw] flex justify-center z-20"
      style={{
        // ✅ 防止 iPad/小螢幕時 ticker 太長掉出畫面：最多佔視窗高度的一小段
        maxHeight: "22vh",
      }}
    >
      <div className="w-full text-center">
        <div
          className={`font-bold tracking-wide ${UI_THEME.TEXT_PRIMARY} break-words`}
          style={{
            // ✅ 字再大一點，但有上限；在 iPad 也不會爆
            fontSize: "clamp(2.4rem, 6.5vw, 7rem)",
            lineHeight: 1.08,
          }}
        >
          {/* ✅ 兩行保護：避免文字過多把底部擠出畫面 */}
          <div className="line-clamp-2">
            <SimpleTicker
              isActive={tickerActive}
              messages={tickerMessages}
              isGlobalZhuyin={isGlobalZhuyin}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      {/* 4) 音訊播放（如果你想它可以點，這裡要把 pointer-events 打開） */}
      {audioUrl && !isBreak && (
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
          <AudioPlayer src={audioUrl} />
        </div>
      )}
	
      {/* 5) 即將結束遮罩：覆蓋在最上層 */}
      {isExam && remainingSeconds > 0 && progress < 16 && (
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-30 overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/10 dark:bg-rose-700/20 animate-pulse" />
          <p className="mt-10 text-rose-300/70 dark:text-rose-300 text-[10vw] font-black tracking-widest select-none">
            即將結束
          </p>
        </div>
      )}

    </div>
  </div>
</div>
</div>  
  );
};

export default ExamMainStage;