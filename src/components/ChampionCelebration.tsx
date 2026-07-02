import React, { useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { Contestant } from '../types';

interface Props {
  champions: Contestant[];
  onClose: () => void;
}

export default function ChampionCelebration({ champions, onClose }: Props) {
  useEffect(() => {
    // Dynamic import/injection of canvas-confetti
    const shoot = () => {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
      
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        if ((window as any).confetti) {
          (window as any).confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
        }
      }, 250);
    };

    if (!(window as any).confetti) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
      script.onload = shoot;
      document.head.appendChild(script);
    } else {
      shoot();
    }
  }, []);

  if (champions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border-2 border-amber-500/50 shadow-[0_0_100px_rgba(245,158,11,0.3)] max-w-2xl w-full text-center space-y-6 transform animate-scaleUp">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center -mt-16 mb-4">
          <div className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] border-4 border-slate-900 animate-bounce">
            <Trophy className="w-16 h-16 text-slate-900" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">
          Chúc mừng Quán Quân
        </h2>
        
        <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar px-2">
          {champions.map((champ, idx) => (
            <div key={champ.id} className="animate-fadeIn py-2 border-b border-slate-800/50 last:border-0" style={{ animationDelay: `${idx * 200}ms` }}>
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 pb-2 drop-shadow-lg leading-tight">
                {champ.name}
              </div>
              <div className="text-lg font-mono text-slate-400 font-bold">
                SBD: {`0${champ.id}`.slice(-2)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-1">Điểm Vòng 1</div>
            <div className="text-amber-400 font-mono font-bold text-xl">{champions[0]?.round1CorrectCount || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-1">Điểm Vòng 2</div>
            <div className="text-amber-400 font-mono font-bold text-xl">{champions[0]?.round2CorrectCount || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-1">Tổng câu đúng</div>
            <div className="text-emerald-400 font-mono font-black text-xl">{champions[0]?.correctAnswersCount || 0}</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
        >
          Tuyệt vời
        </button>
      </div>
    </div>
  );
}
