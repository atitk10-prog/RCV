import React, { useState } from 'react';
import { 
  Trophy, ArrowLeft, Tv, Shield, Users, UserCheck, UserX, 
  Layers, HelpCircle, Search, Sparkles, Star, Award
} from 'lucide-react';
import { ContestState, Contestant } from '../types';

interface SpectatorDashboardProps {
  state: ContestState;
  onExit: () => void;
  onSwitchToProjector: () => void;
}

const getGridColsClass = (cols: number) => {
  const lgMap: Record<number, string> = {
    5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
    7: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7',
    8: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-8',
    9: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9',
    10: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
    11: 'grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11',
    12: 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12',
  };
  return lgMap[cols] || 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
};

export default function SpectatorDashboard({ state, onExit, onSwitchToProjector }: SpectatorDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'eliminated' | 'rescued' | 'champion'>('all');

  const displayedContestants = state.currentRound === 2 
    ? state.contestants.filter(c => c.isInRound2)
    : state.contestants;

  const activeCount = state.contestants.filter(c => c.status === 'active' || c.status === 'rescued' || c.status === 'champion').length;
  const eliminatedCount = state.contestants.filter(c => c.status === 'eliminated').length;

  // Filter for grid
  const filteredContestants = displayedContestants.filter((c) => {
    const matchesSearch =
      c.id.toString() === searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `0${c.id}`.slice(-2) === searchTerm;
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && c.status === 'active';
    if (statusFilter === 'eliminated') return matchesSearch && c.status === 'eliminated';
    if (statusFilter === 'rescued') return matchesSearch && c.status === 'rescued';
    if (statusFilter === 'champion') return matchesSearch && c.status === 'champion';
    return matchesSearch;
  });

  // Calculate sorted rankings
  const sortedRankings = [...state.contestants].sort((a, b) => {
    const statusScore = (c: any) => {
      if (c.status === 'champion') return 4;
      if (c.status === 'active' || c.status === 'rescued') return 3;
      return 1;
    };

    if (statusScore(b) !== statusScore(a)) {
      return statusScore(b) - statusScore(a);
    }

    const aTotal = (a.round1CorrectCount || 0) + (a.round2CorrectCount || 0);
    const bTotal = (b.round1CorrectCount || 0) + (b.round2CorrectCount || 0);
    if (bTotal !== aTotal) {
      return bTotal - aTotal;
    }

    const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
    const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
    if (bElim !== aElim) {
      return bElim - aElim;
    }

    return a.id - b.id;
  });

  const getStatusVisuals = (contestant: Contestant) => {
    switch (contestant.status) {
      case 'active':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-400',
          badge: 'Đang thi đấu',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'rescued':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-400',
          badge: 'Được cứu 🟡',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'eliminated':
        return {
          bg: 'bg-rose-500/5 border-rose-500/10 text-rose-400 opacity-60',
          dot: 'bg-rose-500',
          badge: `Loại ở Câu ${contestant.eliminatedAtQuestion}`,
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };
      case 'champion':
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-500 shadow-amber-500/20 shadow-md',
          dot: 'bg-slate-950',
          badge: 'Quán quân 👑',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/35'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-x-hidden select-none">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shadow-lg">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>REALTIME SPECTATOR</span>
              </span>
              <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                CHẾ ĐỘ XEM KHÁN GIẢ
              </span>
            </div>
            <h1 className="text-base md:text-lg font-black mt-1 text-slate-100 uppercase tracking-tight line-clamp-1">
              {state.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToProjector}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 fill-slate-950" />
            <span>MÀN HÌNH MÁY CHIẾU</span>
          </button>

          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Bento Stats row */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3" id="spectator-stats-banner">
          {/* Total */}
          <div className="bg-slate-900/60 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sỹ số sân đấu</p>
              <p className="text-xl font-mono font-black text-slate-100">{state.totalContestants}</p>
            </div>
            <div className="p-2 bg-slate-950 text-slate-500 border border-slate-850 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* Active */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Đang thi đấu</p>
              <p className="text-xl font-mono font-black text-emerald-400">{activeCount}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Eliminated */}
          <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Đã bị loại</p>
              <p className="text-xl font-mono font-black text-rose-400">{eliminatedCount}</p>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          {/* Round */}
          <div className="bg-slate-900/60 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vòng hiện tại</p>
              <p className="text-xl font-black text-amber-400">Vòng {state.currentRound}</p>
            </div>
            <div className="p-2 bg-slate-950 text-slate-500 border border-slate-850 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {/* Question */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border border-amber-500/25 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Tiến trình câu hỏi</p>
              <p className="text-xl font-mono font-black text-amber-400">Câu {state.currentQuestion}</p>
            </div>
            <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <HelpCircle className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </section>

        {/* Workspace Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Rankings / Standings List */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400 animate-bounce" />
                <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">Bảng Xếp Hạng Thí Sinh</h2>
              </div>
              <span className="text-[9px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-950 border border-slate-900 rounded-full">
                Vị thứ thực tế
              </span>
            </div>

            <div className="divide-y divide-slate-850 max-h-[500px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              {sortedRankings.map((c, index) => {
                const totalCorrect = (c.round1CorrectCount || 0) + (c.round2CorrectCount || 0);
                const isEliminated = c.status === 'eliminated';
                const isChampion = c.status === 'champion';
                const visual = getStatusVisuals(c);
                const rankPos = index + 1;

                return (
                  <div 
                    key={c.id} 
                    className={`py-2.5 px-3 flex items-center justify-between text-xs rounded-xl transition-all ${
                      isChampion 
                        ? 'bg-gradient-to-r from-amber-400/10 via-yellow-500/5 to-transparent border border-amber-500/20' 
                        : isEliminated 
                        ? 'opacity-40 hover:opacity-70 bg-slate-955/20' 
                        : 'bg-slate-900/20 border border-slate-850/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank Position Badge */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] ${
                        rankPos === 1 
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20' 
                          : rankPos === 2 
                          ? 'bg-slate-300 text-slate-950' 
                          : rankPos === 3 
                          ? 'bg-amber-700/80 text-white' 
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}>
                        {rankPos}
                      </span>

                      {/* Name & ID */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[10px] text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                            {`0${c.id}`.slice(-2)}
                          </span>
                          <span className={`font-semibold ${isEliminated ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${visual?.badgeBg}`}>
                            {visual?.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Đúng</span>
                      <span className="text-sm font-mono font-black text-slate-200">{totalCorrect} câu</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Arena Grid (Read-Only) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-850">
              <div>
                <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200">Sơ đồ vị trí Sân đấu</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Trạng thái thời gian thực của các sĩ tử trên sàn đấu</p>
              </div>

              {/* Search input in panel */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="SBD hoặc Tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xxs text-slate-200 focus:outline-none focus:border-amber-500 font-sans font-semibold"
                />
              </div>
            </div>

            {/* Quick Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 select-none overflow-x-auto pb-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mr-1">Lọc ô:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'active', label: 'Đang đấu 🟢' },
                { id: 'rescued', label: 'Cứu trợ 🟡' },
                { id: 'eliminated', label: 'Bị loại 🔴' },
                { id: 'champion', label: 'Quán quân 🏆' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStatusFilter(option.id as any)}
                  className={`px-2.5 py-1 text-xxs font-bold rounded-full border transition-all cursor-pointer ${
                    statusFilter === option.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Grid display */}
            {filteredContestants.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-500 text-xs font-semibold">
                Không tìm thấy thí sinh nào khớp với bộ lọc.
              </div>
            ) : (
              <div className={`grid ${getGridColsClass(state.colsPerRow || 10)} gap-2`}>
                {filteredContestants.map((c) => {
                  const visual = getStatusVisuals(c);
                  const isWinner = c.status === 'champion';
                  const paddedId = `0${c.id}`.slice(-2);

                  return (
                    <div
                      key={c.id}
                      className={`relative p-2 rounded-lg border flex flex-col items-center justify-center text-center aspect-square select-none transition-all ${visual?.bg}`}
                    >
                      {/* Winner Crown indicator */}
                      {isWinner ? (
                        <span className="absolute -top-1.5 text-xs animate-bounce">👑</span>
                      ) : (
                        <span className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full ${visual?.dot}`}></span>
                      )}

                      {/* Padded ID */}
                      <span className="text-sm font-mono font-black tracking-tight">
                        {paddedId}
                      </span>

                      {/* Name tooltip caption */}
                      <span className="text-[8px] font-bold line-clamp-1 mt-0.5 opacity-80 max-w-full">
                        {c.name.split(' ').slice(-1).join(' ')}
                      </span>

                      {c.status === 'eliminated' && (
                        <span className="text-[7px] font-mono opacity-50">
                          Câu {c.eliminatedAtQuestion}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
