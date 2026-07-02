/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, Printer, Download, Save, ArrowUp, ArrowDown, 
  Trash2, FileSpreadsheet, RefreshCw, Layers, Sparkles
} from 'lucide-react';
import { Contestant, ContestState } from '../types';

interface ReportsAndLogsProps {
  state: ContestState;
  onSaveHistory: () => void;
  onSetContestants: (contestants: Contestant[]) => void;
}

export default function ReportsAndLogs({ state, onSaveHistory, onSetContestants }: ReportsAndLogsProps) {
  const [rankings, setRankings] = useState<Contestant[]>([]);

  // Calculate tie logic
  const isTied = (a: Contestant, b: Contestant, isRound2: boolean) => {
    if (isRound2) {
      if (!!a.isInRound2 !== !!b.isInRound2) return false;
      if (a.isInRound2) {
        if (a.round2CorrectCount !== b.round2CorrectCount) return false;
        if (a.round1CorrectCount !== b.round1CorrectCount) return false;
        
        const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
        const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
        if (aAlive !== bAlive) return false;
        
        const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
        const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
        if (aElim !== bElim) return false;
        
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return false;
        return true;
      } else {
        if (a.round1CorrectCount !== b.round1CorrectCount) return false;
        if ((a.eliminatedAtQuestion || 0) !== (b.eliminatedAtQuestion || 0)) return false;
        if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return false;
        return true;
      }
    } else {
      if (a.round1CorrectCount !== b.round1CorrectCount) return false;
      const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
      const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
      if (aAlive !== bAlive) return false;
      const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
      const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
      if (aElim !== bElim) return false;
      if ((a.rescueCount || 0) !== (b.rescueCount || 0)) return false;
      return true;
    }
  };

  const computedRankings = React.useMemo(() => {
    const result = [];
    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
      if (i > 0 && !isTied(rankings[i], rankings[i-1], state.currentRound === 2)) {
        currentRank = i + 1;
      }
      result.push({ ...rankings[i], displayRank: currentRank });
    }
    return result;
  }, [rankings, state.currentRound]);

  // Calculate and sort rankings automatically on state mount/change
  useEffect(() => {
    const isRound2 = state.currentRound === 2;

    const sorted = [...state.contestants].sort((a, b) => {
      if (isRound2) {
        // Round 2 sorting
        const aInR2 = a.isInRound2 ? 1 : 0;
        const bInR2 = b.isInRound2 ? 1 : 0;
        if (bInR2 !== aInR2) {
          return bInR2 - aInR2; // Round 2 participants first
        }

        if (a.isInRound2 && b.isInRound2) {
          // Both are Round 2 participants
          // 1. Score in Round 2 (Desc)
          const aR2Score = a.round2CorrectCount || 0;
          const bR2Score = b.round2CorrectCount || 0;
          if (bR2Score !== aR2Score) {
            return bR2Score - aR2Score;
          }

          // 2. Score in Round 1 (Desc) / Tie-breaker
          const aR1Score = a.round1CorrectCount || 0;
          const bR1Score = b.round1CorrectCount || 0;
          if (bR1Score !== aR1Score) {
            return bR1Score - aR1Score;
          }

          // 3. Status (Alive first)
          const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
          const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
          if (bAlive !== aAlive) {
            return bAlive - aAlive;
          }

          // 4. Eliminated later in Round 2 (higher eliminatedAtQuestion)
          const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
          const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
          if (bElim !== aElim) {
            return bElim - aElim;
          }

          // 5. Fewer rescues
          const aRescue = a.rescueCount || 0;
          const bRescue = b.rescueCount || 0;
          if (aRescue !== bRescue) {
            return aRescue - bRescue;
          }

          // 6. SBD
          return a.id - b.id;
        } else {
          // Both did not qualify for Round 2
          // Sort by Round 1 achievements
          const aR1Score = a.round1CorrectCount || 0;
          const bR1Score = b.round1CorrectCount || 0;
          if (bR1Score !== aR1Score) {
            return bR1Score - aR1Score;
          }

          const aElim = a.eliminatedAtQuestion || 0;
          const bElim = b.eliminatedAtQuestion || 0;
          if (bElim !== aElim) {
            return bElim - aElim;
          }

          const aRescue = a.rescueCount || 0;
          const bRescue = b.rescueCount || 0;
          if (aRescue !== bRescue) {
            return aRescue - bRescue;
          }

          return a.id - b.id;
        }
      } else {
        // Round 1 sorting
        const aR1Score = a.round1CorrectCount || 0;
        const bR1Score = b.round1CorrectCount || 0;
        if (bR1Score !== aR1Score) {
          return bR1Score - aR1Score;
        }

        const aAlive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
        const bAlive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
        if (bAlive !== aAlive) {
          return bAlive - aAlive;
          }

        const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
        const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
        if (bElim !== aElim) {
          return bElim - aElim;
        }

        const aRescue = a.rescueCount || 0;
        const bRescue = b.rescueCount || 0;
        if (aRescue !== bRescue) {
          return aRescue - bRescue;
        }

        return a.id - b.id;
      }
    });

    setRankings(sorted);
  }, [state.contestants, state.currentRound]);

  // Adjust rank manually
  const moveRanking = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankings.length) return;

    const updated = [...rankings];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setRankings(updated);
  };

  // Export to CSV with UTF-8 BOM so Excel opens it with Vietnamese characters perfectly preserved
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    let csvContent = BOM;
    
    // Header Info
    csvContent += `QUẢN LÝ CUỘC THI RUNG CHUÔNG VÀNG\n`;
    csvContent += `Tên cuộc thi:;${state.name}\n`;
    csvContent += `Đơn vị tổ chức:;${state.organizer}\n`;
    csvContent += `Tổng số thí sinh:;${state.totalContestants}\n`;
    csvContent += `Ngày xuất báo cáo:;${new Date().toLocaleDateString('vi-VN')}\n\n`;
    
    // Table Header
    csvContent += `Thứ hạng;Số báo danh;Họ và tên;Điểm Vòng 1;Điểm Vòng 2;Tổng câu đúng;Số lần cứu trợ;Trạng thái;Bị loại ở câu\n`;
    
    // Table rows
    rankings.forEach((c, idx) => {
      let statusStr = 'Đang thi';
      if (c.status === 'eliminated') statusStr = 'Đã bị loại';
      else if (c.status === 'rescued') statusStr = 'Đang cứu trợ';
      else if (c.status === 'champion') statusStr = 'Quán quân 🏆';

      const elimAt = c.eliminatedAtQuestion ? `Câu ${c.eliminatedAtQuestion}` : '-';
      csvContent += `${idx + 1};"${`0${c.id}`.slice(-2)}";"${c.name}";${c.round1CorrectCount || 0};${c.round2CorrectCount || 0};${c.correctAnswersCount};${c.rescueCount || 0};"${statusStr}";"${elimAt}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Clean filename
    const filename = `RungChuongVang_${state.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native Print layout styles injected dynamically to format PDF / Printer nicely
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRows = '';
    rankings.forEach((c, idx) => {
      let statusStr = 'Đang thi';
      let rowClass = '';
      if (c.status === 'eliminated') {
        statusStr = 'Đã bị loại';
        rowClass = 'color: #94a3b8;';
      } else if (c.status === 'rescued') {
        statusStr = 'Cứu trợ';
        rowClass = 'font-weight: bold; color: #d97706;';
      } else if (c.status === 'champion') {
        statusStr = 'Quán quân 🏆';
        rowClass = 'font-weight: bold; background-color: #fef3c7; color: #b45309;';
      }

      // @ts-ignore
      const dRank = c.displayRank || (idx + 1);

      tableRows += `
        <tr style="${rowClass}">
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold;">${dRank}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-family: monospace;"><b>${`0${c.id}`.slice(-2)}</b></td>
          <td style="border: 1px solid #cbd5e1; padding: 10px;">${c.name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${c.round1CorrectCount || 0}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${c.round2CorrectCount || 0}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold; background-color: #f8fafc;">${c.correctAnswersCount}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${c.rescueCount || 0} lần</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${statusStr}</td>
          <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${c.eliminatedAtQuestion ? `Câu ${c.eliminatedAtQuestion}` : '-'}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
        <head>
          <title>Bảng xếp hạng Rung Chuông Vàng - ${state.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 26px; font-weight: bold; text-transform: uppercase; }
            .header h2 { margin: 0 0 15px 0; font-size: 18px; font-weight: 500; color: #475569; }
            .meta { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0f172a; color: white; border: 1px solid #cbd5e1; padding: 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; }
            .footer { margin-top: 40px; text-align: right; font-size: 13px; color: #64748b; font-style: italic; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Kết quả chung cuộc</h1>
            <h2>${state.name}</h2>
            <div class="meta">
              <span>Đơn vị tổ chức: <b>${state.organizer}</b></span>
              <span>Tổng số thí sinh: <b>${state.totalContestants}</b></span>
              <span>Ngày lập: <b>${new Date().toLocaleDateString('vi-VN')}</b></span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Hạng</th>
                <th style="width: 10%;">SBD</th>
                <th style="width: 27%;">Họ và tên</th>
                <th style="width: 10%;">Điểm V1</th>
                <th style="width: 10%;">Điểm V2</th>
                <th style="width: 10%;">Tổng điểm</th>
                <th style="width: 10%;">Cứu trợ</th>
                <th style="width: 15%;">Trạng thái</th>
                <th style="width: 10%;">Loại ở</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Hệ thống tự động ghi nhận kết quả và phát hành vào lúc ${new Date().toLocaleTimeString('vi-VN')}</p>
            <p style="margin-top: 50px;">BÀN KIỂM SOÁT THI ĐẤU</p>
            <p style="margin-top: 2px;">(Ký và ghi rõ họ tên)</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-850 shadow-xl overflow-hidden font-sans text-slate-100" id="reports-logs-panel">
      {/* Table Headers Action bar */}
      <div className="p-4 border-b border-slate-850 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Bảng Xếp Hạng Hiện Tại / Chung Cuộc
          </h3>
          <p className="text-[10px] text-slate-400">Sắp xếp tự động. Dùng mũi tên để tinh chỉnh thứ hạng.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Save contest state to history list */}
          <button
            id="btn-save-log"
            onClick={onSaveHistory}
            className="p-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Lưu Lịch Sử</span>
          </button>

          {/* Export CSV/Excel */}
          <button
            id="btn-export-excel"
            onClick={handleExportCSV}
            className="p-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel (.csv)</span>
          </button>

          {/* Export PDF/In */}
          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            className="p-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Standings Table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850">
              <th className="py-2.5 px-3 text-center w-12">Hạng</th>
              <th className="py-2.5 px-3 text-center w-16">SBD</th>
              <th className="py-2.5 px-3">Thí Sinh</th>
              <th className={`py-2.5 px-3 text-center w-20 transition-all ${state.currentRound === 1 ? 'font-black text-amber-400 bg-amber-500/5' : ''}`}>Điểm V1</th>
              <th className={`py-2.5 px-3 text-center w-20 transition-all ${state.currentRound === 2 ? 'font-black text-amber-400 bg-amber-500/5' : ''}`}>Điểm V2</th>
              <th className="py-2.5 px-3 text-center w-24">Tổng Điểm</th>
              <th className="py-2.5 px-3 text-center w-24">Cứu Trợ</th>
              <th className="py-2.5 px-3 text-center w-28">Trạng Thái</th>
              <th className="py-2.5 px-3 text-center w-24">Bị Loại Ở</th>
              <th className="py-2.5 px-3 text-center w-24">Điều Chỉnh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 select-none">
            {computedRankings.map((c, idx) => {
              const paddedId = `0${c.id}`.slice(-2);
              const rank = c.displayRank;
              const isTop10 = rank <= 10;
              
              let statusLabel = (
                <span className="px-2 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                  Đang thi
                </span>
              );

              if (c.status === 'eliminated') {
                statusLabel = (
                  <span className="px-2 py-0.5 rounded-full text-xxs font-semibold bg-slate-950 text-slate-500 border border-slate-850">
                    Bị loại
                  </span>
                );
              } else if (c.status === 'rescued') {
                statusLabel = (
                  <span className="px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    Được cứu
                  </span>
                );
              } else if (c.status === 'champion') {
                statusLabel = (
                  <span className="px-2.5 py-0.5 rounded-full text-xxs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-transparent flex items-center gap-0.5 max-w-fit mx-auto justify-center shadow shadow-amber-500/10">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Quán quân
                  </span>
                );
              }

              return (
                <tr 
                  key={c.id} 
                  id={`ranking-row-${c.id}`}
                  className={`text-xs transition-all ${
                    c.status === 'champion' 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 font-semibold' 
                      : (state.isCompleted && isTop10) || (!state.isCompleted && idx < 10)
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/15 border-l-4 border-emerald-500/30 font-semibold' 
                        : 'hover:bg-slate-950/20'
                  }`}
                >
                  {/* Rank index */}
                  <td className="py-2.5 px-3 text-center font-bold">
                    {rank <= 3 ? (
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                        rank === 1 ? 'bg-amber-500 text-slate-950' :
                        rank === 2 ? 'bg-slate-400 text-slate-950' :
                        'bg-amber-800 text-white'
                      }`}>
                        {rank}
                      </span>
                    ) : isTop10 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {rank}
                      </span>
                    ) : (
                      <span className="text-slate-400">{rank}</span>
                    )}
                  </td>

                  {/* ID */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                    {paddedId}
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {c.name}
                  </td>

                  {/* Điểm V1 */}
                  <td className={`py-2.5 px-3 text-center font-mono transition-all ${state.currentRound === 1 ? 'font-black text-amber-400 bg-amber-500/5' : 'text-slate-300'}`}>
                    {c.round1CorrectCount ?? 0}
                  </td>

                  {/* Điểm V2 */}
                  <td className={`py-2.5 px-3 text-center font-mono transition-all ${state.currentRound === 2 ? 'font-black text-amber-400 bg-amber-500/5' : 'text-slate-300'}`}>
                    {c.round2CorrectCount ?? 0}
                  </td>

                  {/* Tổng Điểm */}
                  <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                    {c.correctAnswersCount}
                  </td>

                  {/* Số lần cứu */}
                  <td className="py-2.5 px-3 text-center font-mono">
                    {c.rescueCount ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                        {c.rescueCount} lần
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center">
                    {statusLabel}
                  </td>

                  {/* Eliminated At */}
                  <td className="py-2.5 px-3 text-center text-white font-bold font-mono text-xxs">
                    {c.eliminatedAtQuestion ? `Câu ${c.eliminatedAtQuestion}` : '-'}
                  </td>

                  {/* Manual adjustment arrows */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => moveRanking(idx, 'up')}
                        disabled={idx === 0}
                        id={`btn-move-up-${c.id}`}
                        className="p-1 rounded text-white bg-slate-800 border border-slate-700 hover:text-emerald-400 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Tăng thứ tự (Bằng điểm)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveRanking(idx, 'down')}
                        disabled={idx === rankings.length - 1}
                        id={`btn-move-down-${c.id}`}
                        className="p-1 rounded text-white bg-slate-800 border border-slate-700 hover:text-emerald-400 hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                        title="Giảm thứ tự (Bằng điểm)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
