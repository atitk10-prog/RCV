/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users, UserX, UserCheck, HelpCircle, Layers } from 'lucide-react';
import { ContestState } from '../types';

interface StatsBannerProps {
  state: ContestState;
  onQuestionClick?: () => void;
}

export default function StatsBanner({ state, onQuestionClick }: StatsBannerProps) {
  const activeCount = state.contestants.filter(c => c.status === 'active' || c.status === 'rescued' || c.status === 'champion').length;
  const eliminatedCount = state.contestants.filter(c => c.status === 'eliminated').length;
  const rescuedCount = state.contestants.filter(c => c.status === 'rescued').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-1 font-sans text-slate-100" id="stats-banner-container">
      {/* Total Contestants */}
      <div className="bg-slate-900/60 backdrop-blur-lg p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-md">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng thí sinh</p>
          <p className="text-xl font-mono font-black text-slate-100">{state.totalContestants}</p>
        </div>
        <div className="p-2 bg-slate-950 text-slate-400 border border-slate-850 rounded-lg">
          <Users className="w-4 h-4" />
        </div>
      </div>

      {/* Remaining Active */}
      <div className="bg-emerald-500/10 backdrop-blur-lg p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between shadow-md shadow-emerald-500/[0.02]">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">Còn lại</p>
          <p className="text-xl font-mono font-black text-emerald-400">{activeCount}</p>
        </div>
        <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-lg">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>

      {/* Eliminated */}
      <div className="bg-rose-500/10 backdrop-blur-lg p-3 rounded-xl border border-rose-500/20 flex items-center justify-between shadow-md shadow-rose-500/[0.02]">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-rose-400/90 uppercase tracking-widest">Bị loại</p>
          <p className="text-xl font-mono font-black text-rose-400">{eliminatedCount}</p>
        </div>
        <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/35 rounded-lg">
          <UserX className="w-4 h-4" />
        </div>
      </div>

      {/* Current Round */}
      <div className="bg-amber-500/10 backdrop-blur-lg p-3 rounded-xl border border-amber-500/20 flex items-center justify-between shadow-md shadow-amber-500/[0.02]">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest">Vòng thi</p>
          <p className="text-xl font-black text-amber-400">
            Vòng {state.currentRound}
          </p>
        </div>
        <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/35 rounded-lg">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      {/* Current Question */}
      <button
        onClick={onQuestionClick}
        disabled={!onQuestionClick}
        className={`col-span-2 md:col-span-1 p-3 rounded-xl border flex items-center justify-between transition-all text-left shadow-lg cursor-pointer transform active:scale-[0.98] ${
          onQuestionClick 
            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-transparent text-slate-950 font-bold hover:brightness-110 shadow-amber-500/10' 
            : 'bg-slate-900/60 border-slate-800 text-slate-100'
        }`}
      >
        <div className="space-y-0.5">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${onQuestionClick ? 'text-slate-900/80' : 'text-slate-400'}`}>
            Đang ở Câu
          </p>
          <p className="text-xl font-mono font-black">
            {state.currentQuestion}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${onQuestionClick ? 'bg-slate-950/25 text-slate-950 border border-slate-950/10' : 'bg-slate-950 text-slate-400 border border-slate-850'}`}>
          <HelpCircle className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
