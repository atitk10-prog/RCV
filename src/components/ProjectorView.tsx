/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Trophy, HelpCircle, Activity, Play, Square, RotateCcw, 
  Volume2, VolumeX, Maximize2, Tv, RefreshCw, Sparkles, Award
} from 'lucide-react';
import { ContestState, Contestant } from '../types';
import { sounds } from './SoundEffects';
import ChampionCelebration from './ChampionCelebration';

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
  isSpectator?: boolean;
}

export default function ProjectorView({ state, onClose, isSpectator = false }: ProjectorViewProps) {
  // Countdown Timer states
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState<number>(15); // Default 15s
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hideCelebration, setHideCelebration] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
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
  
  // Compute champions - check both isCompleted flag AND champion status (for spectator sync)
  const champions = useMemo(() => {
    const champList = state.contestants.filter(c => c.status === 'champion');
    return champList;
  }, [state.contestants]);

  const isContestEnded = state.isCompleted || champions.length > 0;

  // Compute Top 10 leaderboard with SAME sorting as Admin (ReportsAndLogs)
  const top10Leaderboard = useMemo(() => {
    if (!isContestEnded) return [];

    const sorted = [...state.contestants].sort((a, b) => {
      // Round 2 participants first
      const aInR2 = a.isInRound2 ? 1 : 0;
      const bInR2 = b.isInRound2 ? 1 : 0;
      if (bInR2 !== aInR2) return bInR2 - aInR2;

      if (a.isInRound2 && b.isInRound2) {
        // 1. Score in Round 2 (Desc)
        const aR2 = a.round2CorrectCount || 0;
        const bR2 = b.round2CorrectCount || 0;
        if (bR2 !== aR2) return bR2 - aR2;
        // 2. Score in Round 1 (Desc)
        const aR1 = a.round1CorrectCount || 0;
        const bR1 = b.round1CorrectCount || 0;
        if (bR1 !== aR1) return bR1 - aR1;
        // 3. Status (Alive first)
        const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
        const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
        if (bAlive !== aAlive) return bAlive - aAlive;
        // 4. Eliminated later
        const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
        const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
        if (bElim !== aElim) return bElim - aElim;
        // 5. Fewer rescues
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return (a.rescueCount || 0) - (b.rescueCount || 0);
        // 6. SBD
        return a.id - b.id;
      } else {
        // Both not in Round 2
        const aR1 = a.round1CorrectCount || 0;
        const bR1 = b.round1CorrectCount || 0;
        if (bR1 !== aR1) return bR1 - aR1;
        const aElim = a.eliminatedAtQuestion || 0;
        const bElim = b.eliminatedAtQuestion || 0;
        if (bElim !== aElim) return bElim - aElim;
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return (a.rescueCount || 0) - (b.rescueCount || 0);
        return a.id - b.id;
      }
    });

    // Compute display ranks (with ties)
    const isTied = (a: Contestant, b: Contestant) => {
      if (!!a.isInRound2 !== !!b.isInRound2) return false;
      if (a.isInRound2) {
        if ((a.round2CorrectCount || 0) !== (b.round2CorrectCount || 0)) return false;
        if ((a.round1CorrectCount || 0) !== (b.round1CorrectCount || 0)) return false;
        const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
        const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
        if (aAlive !== bAlive) return false;
        const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
        const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
        if (aElim !== bElim) return false;
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return false;
        return true;
      } else {
        if ((a.round1CorrectCount || 0) !== (b.round1CorrectCount || 0)) return false;
        if ((a.eliminatedAtQuestion || 0) !== (b.eliminatedAtQuestion || 0)) return false;
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return false;
        return true;
      }
    };

    const withRanks: (Contestant & { displayRank: number })[] = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && !isTied(sorted[i], sorted[i-1])) {
        currentRank = i + 1;
      }
      withRanks.push({ ...sorted[i], displayRank: currentRank });
    }

    // Include all contestants with displayRank <= 10 (handles ties at boundary)
    const cutoff = withRanks.filter(c => c.displayRank <= 10);
    return cutoff.length > 0 ? cutoff : withRanks.slice(0, 10);
  }, [isContestEnded, state.contestants]);

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
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/25">
                {isSpectator ? 'Khán Giả Trực Tuyến' : 'Sân Đấu Dự Khán'}
              </span>
              {isSpectator && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/25 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>TRỰC TIẾP REALTIME</span>
                </span>
              )}
            </div>
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
          {isSpectator ? 'Trở về Trang chủ' : 'Trở về Bàn Admin'}
        </button>

        {/* Button to show Top 10 leaderboard (always visible when contest ended) */}
        {isContestEnded && (
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`px-4 py-2 border text-xs font-black rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
              showLeaderboard 
                ? 'bg-amber-500 border-amber-400 text-slate-950 hover:brightness-110' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <Award className="w-4 h-4" />
            {showLeaderboard ? 'Đóng Bảng Xếp Hạng' : 'Xem Top 10 🏆'}
          </button>
        )}
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
          
          {(isContestEnded && champions.length > 0) || showLeaderboard ? (
            /* Full Leaderboard Overlay when contest completed */
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/98 via-slate-950/95 to-amber-950/10 backdrop-blur-xl rounded-3xl flex flex-col p-6 z-20 border border-amber-500/20 overflow-y-auto">
              {/* Champion Banner */}
              <div className="text-center mb-4 pb-4 border-b border-amber-500/20">
                <div className="inline-flex p-3 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full shadow-2xl relative mb-3 animate-pulse">
                  <Trophy className="w-10 h-10 animate-bounce" />
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h2 className="text-yellow-400 font-black text-xs uppercase tracking-widest mb-2">
                  🏆 QUÁN QUÂN XUẤT SẮC 🏆
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {champions.map((champ) => (
                    <div key={champ.id} className="bg-slate-900/80 border border-amber-500/30 px-5 py-3 rounded-xl shadow-lg">
                      <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 leading-tight">
                        {champ.name}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-amber-400/70 mt-0.5">
                        SBD: {`0${champ.id}`.slice(-2)} · V1: {champ.round1CorrectCount || 0} · V2: {champ.round2CorrectCount || 0} · Tổng: {champ.correctAnswersCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 10 Leaderboard Table */}
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  BẢNG XẾP HẠNG TOP 10 - VÒNG 2
                </h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800">
                      <th className="py-2 px-2 text-center w-8">STT</th>
                      <th className="py-2 px-2 text-center w-10">Hạng</th>
                      <th className="py-2 px-2 text-center w-12">SBD</th>
                      <th className="py-2 px-3">Thí Sinh</th>
                      <th className="py-2 px-2 text-center w-16">V1</th>
                      <th className="py-2 px-2 text-center w-16 text-amber-400">V2</th>
                      <th className="py-2 px-2 text-center w-16">Tổng</th>
                      <th className="py-2 px-2 text-center w-20">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {top10Leaderboard.map((c, idx) => {
                      const isTop10 = c.displayRank <= 10;
                      let statusText = 'Đang thi';
                      let statusClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                      if (c.status === 'champion') {
                        statusText = '🏆 Quán quân';
                        statusClass = 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-black';
                      } else if (c.status === 'eliminated') {
                        statusText = 'Bị loại';
                        statusClass = 'text-slate-500 bg-slate-900 border-slate-800';
                      } else if (c.status === 'rescued') {
                        statusText = 'Được cứu';
                        statusClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                      }
                      return (
                        <tr 
                          key={c.id}
                          className={`text-xs transition-all ${
                            c.status === 'champion'
                              ? 'bg-amber-500/10 font-bold'
                              : isTop10
                                ? 'bg-emerald-500/5 border-l-2 border-emerald-500/30'
                                : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-center text-[10px] text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2 text-center font-bold">
                            {c.displayRank <= 3 ? (
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                                c.displayRank === 1 ? 'bg-amber-500 text-slate-950' :
                                c.displayRank === 2 ? 'bg-slate-400 text-slate-950' :
                                'bg-amber-800 text-white'
                              }`}>{c.displayRank}</span>
                            ) : (
                              <span className={isTop10 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{c.displayRank}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-300">{`0${c.id}`.slice(-2)}</td>
                          <td className="py-2 px-3 font-semibold text-slate-200">{c.name}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400">{c.round1CorrectCount || 0}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-amber-400">{c.round2CorrectCount || 0}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-200">{c.correctAnswersCount || 0}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusClass}`}>{statusText}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

      {isContestEnded && champions.length > 0 && !hideCelebration && (
        <ChampionCelebration 
          champions={champions}
          onClose={() => setHideCelebration(true)} 
        />
      )}
    </div>
  );
}
