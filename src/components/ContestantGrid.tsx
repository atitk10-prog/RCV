/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, RotateCcw, ShieldCheck, RefreshCw } from 'lucide-react';
import { Contestant, ContestantStatus } from '../types';

interface ContestantGridProps {
  contestants: Contestant[];
  currentQuestion: number;
  rescueMode: boolean;
  selectedRescueIds: number[];
  onToggleRescueSelect: (id: number) => void;
  onEliminate: (id: number) => void;
  onRestore: (id: number) => void;
  onCrownChampion?: (id: number) => void;
  showFilters?: boolean;
  currentRound?: number;
  colsPerRow?: number;
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

export default function ContestantGrid({
  contestants,
  currentQuestion,
  rescueMode,
  selectedRescueIds,
  onToggleRescueSelect,
  onEliminate,
  onRestore,
  onCrownChampion,
  showFilters = true,
  currentRound = 1,
  colsPerRow = 10,
}: ContestantGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'eliminated' | 'rescued' | 'champion'>('all');

  const filteredContestants = contestants.filter((c) => {
    // If currentRound is 2, hide contestants who did not make it to Round 2
    if (currentRound === 2 && !c.isInRound2) {
      return false;
    }

    // Search filter
    const matchesSearch =
      c.id.toString() === searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `0${c.id}`.slice(-2) === searchTerm;
    
    // Status filter
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && c.status === 'active';
    if (statusFilter === 'eliminated') return matchesSearch && c.status === 'eliminated';
    if (statusFilter === 'rescued') return matchesSearch && c.status === 'rescued';
    if (statusFilter === 'champion') return matchesSearch && c.status === 'champion';
    return matchesSearch;
  });

  const getStatusColorAndLabels = (contestant: Contestant) => {
    const isSelectedRescue = selectedRescueIds.includes(contestant.id);
    
    if (rescueMode) {
      if (contestant.status !== 'eliminated') {
        return {
          bg: 'bg-slate-950/20 text-slate-700 border-slate-900 pointer-events-none opacity-40',
          dot: 'bg-slate-800',
          title: 'Đang thi (Không thể cứu trợ)',
        };
      }
      return {
        bg: isSelectedRescue
          ? 'bg-amber-500/20 text-amber-300 border-amber-500 ring-4 ring-amber-500/20 shadow-lg animate-pulse font-bold'
          : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400 hover:scale-105 cursor-pointer',
        dot: isSelectedRescue ? 'bg-amber-400' : 'bg-rose-500',
        title: isSelectedRescue ? 'Đang chọn cứu trợ' : 'Nhấp để cứu trợ',
      };
    }

    switch (contestant.status) {
      case 'active':
        return {
          bg: 'bg-emerald-500/10 hover:bg-rose-500/20 border-emerald-500/20 hover:border-rose-500/40 text-emerald-400 hover:text-rose-450 hover:scale-[1.03] cursor-pointer transition-all shadow-md shadow-emerald-500/[0.01]',
          dot: 'bg-emerald-400',
          title: 'Đang thi - Nhấp để LOẠI',
        };
      case 'rescued':
        return {
          bg: 'bg-amber-500/10 hover:bg-rose-500/20 border-amber-500/20 hover:border-rose-500/40 text-amber-400 hover:text-rose-450 hover:scale-[1.03] cursor-pointer transition-all shadow-md shadow-amber-500/[0.01]',
          dot: 'bg-amber-300',
          title: 'Được cứu trợ - Nhấp để LOẠI',
        };
      case 'eliminated':
        return {
          bg: 'bg-rose-500/10 hover:bg-slate-800/40 border-rose-500/20 hover:border-slate-800 text-rose-400 hover:text-slate-200 hover:scale-[1.03] cursor-pointer transition-all',
          dot: 'bg-rose-500',
          title: `Đã loại ở Câu ${contestant.eliminatedAtQuestion} - Nhấp để KHÔI PHỤC`,
        };
      case 'champion':
        return {
          bg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-500 shadow-amber-500/30 shadow-lg cursor-pointer transform hover:scale-[1.05]',
          dot: 'bg-slate-950',
          title: 'QUÁN QUÂN - Nhấp để khôi phục',
        };
    }
  };

  const handleCellClick = (contestant: Contestant) => {
    if (rescueMode) {
      if (contestant.status === 'eliminated') {
        onToggleRescueSelect(contestant.id);
      }
    } else {
      if (contestant.status === 'active' || contestant.status === 'rescued') {
        onEliminate(contestant.id);
      } else if (contestant.status === 'eliminated' || contestant.status === 'champion') {
        onRestore(contestant.id);
      }
    }
  };

  return (
    <div className="space-y-3 font-sans text-slate-100" id="contestant-grid-wrapper">
      {/* Search and Filters */}
      {showFilters && (
        <div className="bg-slate-900/60 backdrop-blur-lg p-3 rounded-xl border border-slate-850 shadow-lg flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="search-contestant"
              type="text"
              placeholder="Tìm theo số hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 select-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Bộ lọc:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang thi 🟢' },
              { id: 'rescued', label: 'Cứu trợ 🟡' },
              { id: 'eliminated', label: 'Đã loại 🔴' },
              { id: 'champion', label: 'Quán quân 🏆' },
            ].map((option) => (
              <button
                key={option.id}
                id={`filter-${option.id}`}
                onClick={() => setStatusFilter(option.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  statusFilter === option.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid View */}
      {rescueMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-400 flex items-center gap-2 font-medium">
          <span className="animate-ping flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          <span>
            <strong>ĐANG BẬT CHẾ ĐỘ CỨU TRỢ:</strong> Nhấp chọn các ô màu đỏ của thí sinh được cứu, sau đó nhấn nút <strong>LƯU CỨU TRỢ</strong> để hoàn tất.
          </span>
        </div>
      )}

      {filteredContestants.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
          Không tìm thấy thí sinh nào phù hợp bộ lọc.
        </div>
      ) : (
        <div className={`grid ${getGridColsClass(colsPerRow)} gap-2`}>
          {filteredContestants.map((c) => {
            const visual = getStatusColorAndLabels(c);
            const isWinner = c.status === 'champion';
            const paddedId = `0${c.id}`.slice(-2);

            return (
              <div
                key={c.id}
                id={`contestant-card-${c.id}`}
                onClick={() => handleCellClick(c)}
                title={visual.title}
                className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center text-center aspect-square select-none transition-all group ${visual.bg}`}
              >
                {/* Crown / Trophy for champion */}
                {isWinner ? (
                  <span className="absolute -top-1.5 text-xs animate-bounce">👑</span>
                ) : (
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${visual.dot}`}></span>
                )}

                {/* ID representation */}
                <span className="text-base font-mono font-bold tracking-tight">
                  {paddedId}
                </span>

                {/* Name tooltip/caption for dense screen */}
                <span className="text-[9px] font-medium line-clamp-1 mt-1 opacity-80 max-w-full">
                  {c.name.split(' ').slice(-1).join(' ')}
                </span>

                {/* Small overlay if click state is active - shows details inside hover */}
                {!rescueMode && c.status === 'eliminated' && (
                  <span className="text-[8px] font-mono opacity-50 mt-0.5">
                    Câu {c.eliminatedAtQuestion}
                  </span>
                )}

                {/* Fast champion crowning action for active contestants */}
                {!rescueMode && onCrownChampion && (c.status === 'active' || c.status === 'rescued') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCrownChampion(c.id);
                    }}
                    id={`crown-btn-${c.id}`}
                    title="Phong làm Quán Quân"
                    className="absolute -bottom-1 bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600 rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity cursor-pointer z-10"
                    style={{ fontSize: '7px' }}
                  >
                    🏆
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
