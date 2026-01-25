import React from 'react';

const StarryBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900 pointer-events-none z-0">
      {/* 1. 星星層 (小) */}
      <div className="absolute w-[1px] h-[1px] bg-transparent shadow-[10vw_10vh_#FFF,20vw_50vh_#FFF,50vw_20vh_#FFF,80vw_80vh_#FFF,10vw_90vh_#FFF,90vw_10vh_#FFF,30vw_30vh_#FFF,60vw_60vh_#FFF,40vw_80vh_#FFF,70vw_40vh_#FFF] animate-twinkle-slow rounded-full opacity-70"></div>
      
      {/* 2. 星星層 (中) - 增加一點數量與隨機感 */}
      <div className="absolute w-[2px] h-[2px] bg-transparent shadow-[15vw_15vh_#FFF,25vw_55vh_#FFF,55vw_25vh_#FFF,85vw_85vh_#FFF,15vw_95vh_#FFF,95vw_15vh_#FFF,35vw_35vh_#FFF,65vw_65vh_#FFF,45vw_85vh_#FFF,75vw_45vh_#FFF,5vw_5vh_#FFF,90vw_50vh_#FFF] animate-twinkle-medium rounded-full opacity-50"></div>

      {/* 3. 流星 (偶爾出現) */}
      <div className="absolute top-0 left-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent -rotate-45 animate-shooting-star opacity-0"></div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shooting {
          0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
          100% { transform: translateX(-500px) translateY(500px) rotate(-45deg); opacity: 0; }
        }
        .animate-twinkle-slow { animation: twinkle 5s infinite ease-in-out; }
        .animate-twinkle-medium { animation: twinkle 3s infinite ease-in-out reverse; }
        .animate-shooting-star { animation: shooting 10s infinite linear; animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default StarryBackground;