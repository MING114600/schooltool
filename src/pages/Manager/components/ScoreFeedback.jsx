import React from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Crown, Star } from 'lucide-react';

const ScoreFeedback = ({ feedbacks }) => {
  if (!feedbacks || feedbacks.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {feedbacks.map((fb) => {
        if (fb.type === 'milestone') {
            return <MilestoneEffect key={fb.id} feedback={fb} />;
        }
        return <FloatingBubble key={fb.id} feedback={fb} />;
      })}
    </div>,
    document.body
  );
};

// --- 一般加分氣泡 ---
const FloatingBubble = ({ feedback }) => {
  const isPositive = feedback.value > 0;
  const isClass = feedback.type === 'class';
  const isGroup = feedback.type === 'group';
  
  // 隨機微調 x 軸，讓氣泡不會完全重疊
  const randomX = (Math.random() - 0.5) * 40; 
  
  return (
    <div
      className={`absolute flex flex-col items-center justify-center animate-float-up opacity-0`}
      style={{ 
        left: feedback.x + randomX, 
        top: feedback.y,
        animationDelay: `${feedback.delay || 0}ms`
      }}
    >
      <div 
        className={`
          font-black rounded-full shadow-lg border-2 flex items-center justify-center backdrop-blur-sm
          ${isClass ? 'text-4xl px-6 py-3 border-yellow-300 bg-yellow-100/90 text-yellow-600' : 
            isGroup ? 'text-3xl px-5 py-2 border-indigo-300 bg-indigo-100/90 text-indigo-600' :
            isPositive ? 'text-2xl w-12 h-12 border-emerald-200 bg-emerald-100/90 text-emerald-600' : 
            'text-2xl w-12 h-12 border-rose-200 bg-rose-100/90 text-rose-600'
          }
        `}
      >
        {feedback.value > 0 ? '+' : ''}{feedback.value}
      </div>
      {(feedback.label) && (
        <span className="mt-1 text-sm font-bold text-white text-shadow-sm bg-black/20 px-2 rounded-full">
            {feedback.label}
        </span>
      )}
    </div>
  );
};

// --- 里程碑特效 ---
const MilestoneEffect = ({ feedback }) => {
    // 依據里程碑類型決定樣式
    const isGroup = feedback.milestoneType === 'group';
    
    return (
        <div 
            // ✅ 新增 animate-fade-out-end 讓它在最後 0.5 秒淡出
            className="absolute flex flex-col items-center pointer-events-none animate-fade-out-end"
            style={{ 
                left: feedback.x, 
                top: feedback.y,
                transform: 'translate(-50%, -50%)' // 置中
            }}
        >
            {/* 1. 爆發的光芒背景 */}
            {/* ✅ 修改：使用 animate-pulse-slow 替代 ping，效果較柔和且持續 */}
            <div className="absolute inset-0 animate-pulse-slow opacity-50">
                <div className={`w-32 h-32 rounded-full blur-xl ${isGroup ? 'bg-indigo-400' : 'bg-amber-400'}`}></div>
            </div>

            {/* 2. 主體圖示與文字 (彈跳動畫) */}
            <div className="relative animate-bounce-in flex flex-col items-center">
                <div className={`
                    p-3 rounded-full border-4 shadow-2xl mb-2
                    ${isGroup ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-amber-100 border-amber-300 text-amber-600'}
                `}>
                    {isGroup ? <Crown size={32} fill="currentColor"/> : <Trophy size={28} fill="currentColor"/>}
                </div>
                
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-white text-stroke-2 drop-shadow-lg tracking-wider font-mono">
                        {feedback.value}
                    </span>
                    <span className="text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-full mt-1">
                        LEVEL UP!
                    </span>
                </div>
            </div>

            {/* 3. 簡單的粒子 (CSS 模擬) */}
            <div className="absolute inset-0 w-full h-full overflow-visible">
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-particle-1"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-particle-2"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-particle-3"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-particle-4"></div>
            </div>
        </div>
    );
};

export default ScoreFeedback;

// 補充：需要在全域 CSS (index.css) 或這裡加入 keyframes
const styles = `
  @keyframes float-up {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
    80% { transform: translateY(-60px) scale(1); opacity: 1; }
    100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
  }
  
  @keyframes bounce-in {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.5); opacity: 1; }
      70% { transform: scale(0.9); }
      /* ✅ 修改：100% 時保持 opacity: 1，讓它停留在畫面上 */
      100% { transform: scale(1); opacity: 1; }
  }

  /* ✅ 新增：在 3 秒生命週期的最後淡出 */
  @keyframes fade-out-end {
      0% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
  }

  @keyframes pulse-slow {
      0% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.5); opacity: 0.8; }
      100% { transform: scale(1); opacity: 0.5; }
  }

  /* 簡易粒子動畫 */
  @keyframes particle-1 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(-30px, -40px); opacity: 0;} }
  @keyframes particle-2 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(30px, -40px); opacity: 0;} }
  @keyframes particle-3 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(-20px, 30px); opacity: 0;} }
  @keyframes particle-4 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(20px, 30px); opacity: 0;} }

  .animate-float-up { animation: float-up 1.5s ease-out forwards; }
  .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  /* ✅ 修改：套用 fade-out-end，總時長 3s */
  .animate-fade-out-end { animation: fade-out-end 3s linear forwards; }
  .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
  
  .animate-particle-1 { animation: particle-1 0.8s ease-out forwards; }
  .animate-particle-2 { animation: particle-2 0.8s ease-out forwards; }
  .animate-particle-3 { animation: particle-3 0.8s ease-out forwards; }
  .animate-particle-4 { animation: particle-4 0.8s ease-out forwards; }
  
  .text-stroke-2 { -webkit-text-stroke: 1px rgba(0,0,0,0.2); }
  .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
`;

// 注入 Style
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}