/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, HelpCircle, Activity, Play, Square, RotateCcw, 
  Volume2, VolumeX, Maximize2, Tv, RefreshCw, Sparkles, Award
} from 'lucide-react';
import { ContestState, Contestant } from '../types';
import { sounds } from './SoundEffects';

const getGridColsClass = (cols: number) => {
  const lgMap: Record<number, string> = {
    5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
    7: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7',
    8: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-8',
    9: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9',
    10: 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
    11: 'grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11',
    12: 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12',
  };
  return lgMap[cols] || 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
};

interface ProjectorViewProps {
  state: ContestState;
  onClose: () => void;
}

export default function ProjectorView({ state, onClose }: ProjectorViewProps) {
  // Countdown Timer states
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hideRescueOverlay, setHideRescueOverlay] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto reset hide flag when recentlyRescued list changes
  useEffect(() => {
    setHideRescueOverlay(false);
  }, [state.recentlyRescued]);

  const displayedContestants = state.currentRound === 2 
    ? state.contestants.filter(c => c.isInRound2)
    : state.contestants;

  const activeContestants = displayedContestants.filter(
    (c) => c.status === 'active' || c.status === 'rescued' || c.status === 'champion'
  );
  
  const eliminatedCount = displayedContestants.filter((c) => c.status === 'eliminated').length;
  const champions = displayedContestants.filter((c) => c.status === 'champion');

  // Trigger countdown ticks
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            if (soundEnabled) {
              sounds.playGong(); // Ring gong at end of time
            }
            return 0;
          }
          
          const nextSec = prev - 1;
          if (soundEnabled) {
            if (nextSec <= 5) {
              sounds.playTock(); // play low tock for last 5 secs
            } else {
              sounds.playTick(); // regular tick
            }
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, soundEnabled]);

  const handleStartTimer = () => {
    setTimeLeft(timerPreset);
    setTimerRunning(true);
    if (soundEnabled) {
      sounds.playTick();
    }
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(timerPreset);
  };

  const handlePresetChange = (secs: number) => {
    setTimerPreset(secs);
    setTimeLeft(secs);
    setTimerRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col p-6 relative overflow-hidden antialiased select-none" id="projector-view-root">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-850 pb-5 mb-5 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shadow-lg shadow-amber-500/[0.02] animate-pulse">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="text-center md:text-left">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/25">
              Sân Đấu Dự Khán
            </span>
            <h1 className="text-2xl font-black mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-tight drop-shadow">
              {state.name}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Đơn vị tổ chức: {state.organizer}</p>
          </div>
        </div>

        {/* Live Timer Section */}
        <div className="flex items-center gap-4 bg-slate-905/60 border border-slate-800/85 p-3 rounded-2xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Thời gian viết đáp án</span>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-450" />}
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Presets */}
              <div className="flex flex-col gap-1">
                {[10, 15, 30].map((secs) => (
                  <button
                    key={secs}
                    id={`timer-preset-${secs}`}
                    onClick={() => handlePresetChange(secs)}
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                      timerPreset === secs
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {secs}s
                  </button>
                ))}
              </div>

              {/* Giant Countdown Numeral */}
              <div className={`text-4xl font-mono font-black px-4 py-1 rounded-xl flex items-center justify-center min-w-[70px] border shadow-inner ${
                timeLeft <= 5 && timerRunning
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-450 animate-pulse'
                  : 'bg-slate-955 border-slate-850 text-amber-400/90'
              }`}>
                {timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-1">
                {!timerRunning ? (
                  <button
                    id="btn-play-timer"
                    onClick={handleStartTimer}
                    className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded shadow-md transition-all flex items-center justify-center cursor-pointer"
                    title="Bắt đầu đếm ngược"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                ) : (
                  <button
                    id="btn-stop-timer"
                    onClick={handleStopTimer}
                    className="p-1.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded shadow-md transition-all flex items-center justify-center cursor-pointer"
                    title="Dừng lại"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                )}
                <button
                  id="btn-reset-timer"
                  onClick={handleResetTimer}
                  className="p-1.5 bg-slate-955 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 rounded transition-all flex items-center justify-center cursor-pointer"
                  title="Đặt lại rải thời gian"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back and exit buttons */}
        <button
          id="btn-close-projector"
          onClick={onClose}
          className="px-4 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
        >
          Trở về Bàn Admin
        </button>
      </div>

      {/* Main Grid & Highlight banner container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch relative z-10">
        
        {/* Left indicators side view */}
        <div className="lg:col-span-1 flex flex-col justify-between gap-4">
          
          {/* Question board */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg backdrop-blur-md">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5" />
              Tiến trình cuộc thi
            </span>
            <div className="text-[9px] text-indigo-300 uppercase tracking-widest font-black">
              Vòng thi thứ {state.currentRound}
            </div>
            <div className="text-6xl font-black font-mono tracking-tighter text-white mt-1.5 drop-shadow">
              CÂU {state.currentQuestion}
            </div>
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-4 border border-slate-900">
              <div 
                className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-500" 
                style={{ 
                  width: `${(state.currentQuestion / (state.currentRound === 1 ? state.round1MaxQuestion : state.round2MaxQuestion)) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Crowd Stats dashboard */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex-1 flex flex-col justify-around gap-4 shadow-lg backdrop-blur-lg select-none">
            {/* Active count in court */}
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">SỐ THÍ SINH CÒN LẠI</span>
              <div className="text-6xl font-black font-mono text-emerald-400 mt-1 animate-pulse">
                {activeContestants.length}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Đang ngồi tại sân đấu</p>
            </div>

            <div className="border-t border-slate-850 my-1"></div>

            {/* General metrics */}
            <div className="grid grid-cols-2 text-center gap-2">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Tổng ban đầu</span>
                <span className="text-xl font-mono font-black text-slate-200 block mt-0.5">{state.totalContestants}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">Đã bị loại</span>
                <span className="text-xl font-mono font-black text-rose-450 block mt-0.5">{eliminatedCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Central visual grid (Maximized for projector) */}
        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-850 rounded-3xl p-5 flex flex-col justify-between shadow-lg relative min-h-[450px] backdrop-blur-lg">
          
          {champions.length > 0 ? (
            /* Crowning Overlay inside court */
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-slate-950/95 to-slate-950/98 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center text-center p-8 z-20 border border-amber-500/20 overflow-y-auto">
              {/* Animated fireworks crown symbol */}
              <div className="inline-flex p-5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full shadow-2xl relative mb-5 animate-pulse">
                <Trophy className="w-14 h-14 animate-bounce" />
                <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
              </div>

              <h2 className="text-yellow-400 font-black text-xs uppercase tracking-widest">
                🏆 QUÁN QUÂN XUẤT SẮC 🏆
              </h2>
              
              <div className="space-y-2.5 mt-3 w-full">
                {champions.map((champ) => (
                  <div key={champ.id} className="bg-slate-955/80 border border-amber-500/20 p-5 rounded-2xl max-w-lg mx-auto shadow-2xl">
                    <div className="text-[10px] font-mono font-bold text-amber-400 mb-0.5 tracking-wider uppercase">
                      SỐ BÁO DANH: {`0${champ.id}`.slice(-2)}
                    </div>
                    <div className="text-3xl font-black tracking-tight text-white line-clamp-1">
                      {champ.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Vượt qua xuất sắc cuộc thi với thành tích vượt trội {champ.correctAnswersCount} câu trả lời đúng!
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-amber-200/60 mt-6 leading-relaxed max-w-md">
                Xin chúc mừng các bạn học sinh đã kiên cường vượt qua các câu hỏi hóc búa để rung vang chiếc Chuông Vàng danh giá!
              </p>
            </div>
          ) : null}

          {/* Recently Rescued Overlay */}
          {state.recentlyRescued && state.recentlyRescued.length > 0 && !hideRescueOverlay ? (
            <div className="absolute inset-0 bg-[#0c1020]/98 border-2 border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-2xl z-20 animate-fadeIn">
              <div className="text-center space-y-1.5">
                <div className="inline-flex p-2.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full animate-bounce">
                  <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 uppercase tracking-tight">
                  🎉 THÍ SINH ĐƯỢC CỨU TRỢ VỪA QUA 🎉
                </h3>
                <p className="text-[11px] text-indigo-200 font-medium leading-relaxed">
                  Hân hoan chào đón các bạn quay trở lại sân đấu Rung Chuông Vàng!
                </p>
              </div>

              {/* Scrollable list of SBD & Names */}
              <div className="flex-1 my-3 overflow-y-auto max-h-[280px] border border-slate-800/80 rounded-2xl bg-[#070914]/80 p-4 space-y-2 scrollbar-thin">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {state.recentlyRescued.map((c) => (
                    <div 
                      key={c.id} 
                      className="flex items-center gap-2.5 bg-slate-900/50 border border-slate-800/60 p-2 rounded-xl text-left hover:border-amber-550/30 transition-all"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-400 text-slate-950 font-black font-mono flex items-center justify-center text-sm shadow-md shadow-amber-500/10">
                        {`0${c.id}`.slice(-2)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-white truncate">{c.name}</div>
                        <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Cứu trợ thành công</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setHideRescueOverlay(true)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5 hover:shadow-indigo-500/10"
                >
                  Xác nhận & Quay lại sơ đồ thi đấu
                </button>
              </div>
            </div>
          ) : null}

          {/* Majestic screen representation */}
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
              <span>Sơ đồ ghế ngồi thi đấu</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-450"></span> Đang thi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span> Được cứu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-800 border border-slate-755"></span> Bị loại
                </span>
              </span>
            </div>

            {/* Big Projector Grid */}
            <div className={`grid ${getGridColsClass(state.colsPerRow || 10)} gap-2.5 items-center flex-1 max-h-[500px] overflow-y-auto pr-1`}>
              {displayedContestants.map((c) => {
                const paddedId = `0${c.id}`.slice(-2);
                
                let boxClass = 'bg-slate-955/25 border-slate-900/60 text-slate-705/65'; // Eliminated
                if (c.status === 'active') {
                  boxClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-450 font-bold shadow shadow-emerald-500/[0.01]';
                } else if (c.status === 'rescued') {
                  boxClass = 'bg-amber-500/20 text-amber-450 border-amber-500/30 font-black shadow shadow-amber-500/[0.01]';
                } else if (c.status === 'champion') {
                  boxClass = 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/25 animate-pulse';
                }

                return (
                  <div
                    key={c.id}
                    id={`projector-contestant-card-${c.id}`}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-center p-1.5 transition-all select-none ${boxClass}`}
                  >
                    <span className="text-xl font-mono font-black tracking-tighter">
                      {paddedId}
                    </span>
                    {/* Compact layout show first-last strings if active */}
                    {(c.status === 'active' || c.status === 'rescued' || c.status === 'champion') && (
                      <span className="text-[9px] line-clamp-1 opacity-80 font-semibold truncate max-w-full">
                        {c.name.split(' ').slice(-1)[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
