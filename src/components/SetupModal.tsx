/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Users, Award, Play, History, Trash2, FileSpreadsheet, X } from 'lucide-react';
import { ContestState, SavedContestSummary } from '../types';

interface SetupModalProps {
  onStart: (config: {
    name: string;
    organizer: string;
    totalContestants: number;
    names: string[];
    round1MaxQuestion: number;
    round2MaxQuestion: number;
    round2StartQuestion: number;
    colsPerRow: number;
  }) => void;
  savedSummaries: SavedContestSummary[];
  onLoadHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onResume?: () => void;
}

export default function SetupModal({ onStart, savedSummaries, onLoadHistory, onDeleteHistory, onResume }: SetupModalProps) {
  const [name, setName] = useState('Cuộc thi Rung Chuông Vàng 2026');
  const [organizer, setOrganizer] = useState('Ban Chấp Hành Đoàn Trường / Đơn vị');
  const [totalContestants, setTotalContestants] = useState(64);
  const [round1MaxQuestion, setRound1MaxQuestion] = useState(15);
  const [round2StartQuestion, setRound2StartQuestion] = useState(16);
  const [round2MaxQuestion, setRound2MaxQuestion] = useState(30);
  const [colsPerRow, setColsPerRow] = useState(10);
  const [namesText, setNamesText] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [activeSession, setActiveSession] = useState<any>(() => {
    const saved = localStorage.getItem('rungchuongvang_current_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleDiscardSession = () => {
    setShowDiscardConfirm(true);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Rung Chuông Vàng';
    const cleanOrg = organizer.trim() || 'Ban Tổ Chức';
    
    // Parse custom names
    const lines = namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const namesArray: string[] = [];
    for (let i = 1; i <= totalContestants; i++) {
      const paddedId = i < 10 ? `0${i}` : `${i}`;
      if (lines[i - 1]) {
        namesArray.push(lines[i - 1]);
      } else {
        namesArray.push(`Thí sinh ${paddedId}`);
      }
    }

    onStart({
      name: cleanName,
      organizer: cleanOrg,
      totalContestants,
      names: namesArray,
      round1MaxQuestion,
      round2MaxQuestion,
      round2StartQuestion,
      colsPerRow,
    });
  };

  const handleQuickSize = (size: number) => {
    setTotalContestants(size);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-100">
      <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col md:flex-row">
        
        {/* Sidebar Illustration/Branding */}
        <div className="md:w-1/3 bg-slate-950 p-8 flex flex-col justify-between text-white relative border-r border-slate-800/80">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-xl text-amber-400 group border border-amber-500/30">
              <Trophy className="w-8 h-8 animate-pulse text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase">
                Rung Chuông Vàng
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Hệ thống quản lý trực quan cho người điều phối. Theo dõi thời gian thực, quản lý cứu trợ và tự động xuất kết quả.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500">
            <div>Hoạt động tối ưu trên máy chiếu, máy tính & điện thoại.</div>
            <div className="mt-1 font-mono tracking-wider text-amber-500/80">Phiên bản 1.2.0</div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-10 select-none">
          {activeSession && onResume && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl space-y-3.5 shadow-lg shadow-amber-500/5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">Phát hiện cuộc thi đang diễn ra</span>
                  <p className="text-sm font-bold text-slate-100 mt-1">{activeSession.name}</p>
                  <p className="text-xxs text-slate-400 mt-0.5">Tiến trình: Câu {activeSession.currentQuestion} / Vòng {activeSession.currentRound}</p>
                </div>
                <span className="animate-pulse flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  id="btn-resume-session-modal"
                  onClick={onResume}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-lg transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>TIẾP TỤC CUỘC THI ➔</span>
                </button>
                <button
                  type="button"
                  id="btn-discard-session-modal"
                  onClick={handleDiscardSession}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-rose-450 hover:text-rose-400 text-xs font-bold rounded-lg transition-all border border-slate-800 cursor-pointer flex items-center justify-center gap-1"
                  title="Xóa cuộc thi hiện tại để cài đặt cuộc thi mới từ đầu"
                >
                  <span>XÓA PHIÊN CŨ</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tab */}
          <div className="flex border-b border-slate-800 mb-8">
            <button
              id="tab-new-contest"
              onClick={() => setActiveTab('new')}
              className={`pb-3 text-sm font-semibold border-b-2 mr-6 transition-all ${
                activeTab === 'new'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Thiết lập Cuộc thi Mới
            </button>
            <button
              id="tab-history-contest"
              disabled={savedSummaries.length === 0}
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center ${
                savedSummaries.length === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-600'
                  : activeTab === 'history'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Lịch sử Cuộc thi ({savedSummaries.length})
            </button>
          </div>

          {activeTab === 'new' ? (
            <form onSubmit={handleStart} className="space-y-6">
              {/* Contest name */}
              <div className="space-y-1.5">
                <label htmlFor="contest-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Tên cuộc thi
                </label>
                <input
                  id="contest-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Rung Chuông Vàng - Khối 12 niên khóa 2026"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                />
              </div>

              {/* Organizer */}
              <div className="space-y-1.5">
                <label htmlFor="organizer" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Đơn vị tổ chức
                </label>
                <input
                  id="organizer"
                  type="text"
                  required
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Ví dụ: Ban Chấp Hành Đoàn Trường"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
                />
              </div>

              {/* Max Questions config */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="round1-max-q" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Vòng 1 tối đa
                  </label>
                  <input
                    id="round1-max-q"
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={round1MaxQuestion}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setRound1MaxQuestion(val);
                      setRound2StartQuestion(val + 1);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans font-mono font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-500 block text-center">Câu 1 ➔ {round1MaxQuestion}</span>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="round2-start-q" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Vòng 2 từ câu
                  </label>
                  <input
                    id="round2-start-q"
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={round2StartQuestion}
                    onChange={(e) => setRound2StartQuestion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans font-mono font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-500 block text-center">Bắt đầu Vòng 2</span>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="round2-max-q" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Vòng 2 đến câu
                  </label>
                  <input
                    id="round2-max-q"
                    type="number"
                    min="1"
                    max="150"
                    required
                    value={round2MaxQuestion}
                    onChange={(e) => setRound2MaxQuestion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans font-mono font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-500 block text-center">Kết thúc Vòng 2</span>
                </div>
              </div>

              {/* Number of contestants and quick tags */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="total-contestants" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Số lượng thí sinh tham gia
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="total-contestants-number"
                      type="number"
                      min="1"
                      max="500"
                      value={totalContestants}
                      onChange={(e) => setTotalContestants(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 transition-all"
                    />
                    <span className="text-xs text-slate-500 font-medium">thí sinh</span>
                  </div>
                </div>
                <input
                  id="total-contestants"
                  type="range"
                  min="5"
                  max="200"
                  step="1"
                  value={totalContestants}
                  onChange={(e) => setTotalContestants(parseInt(e.target.value, 10) || 5)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                
                {/* Defaults */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Chọn nhanh:</span>
                  {[30, 50, 64, 100, 150].map((size) => (
                    <button
                      key={size}
                      type="button"
                      id={`quick-size-${size}`}
                      onClick={() => handleQuickSize(size)}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded-full border transition-all ${
                        totalContestants === size
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns per row configuration */}
              <div className="space-y-1.5">
                <label htmlFor="cols-per-row" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Số thí sinh hiển thị trên một hàng
                </label>
                <select
                  id="cols-per-row"
                  value={colsPerRow}
                  onChange={(e) => setColsPerRow(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans cursor-pointer"
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num} className="bg-slate-950 text-slate-200">
                      {num} thí sinh / hàng
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Names text area (Optional) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="custom-names" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Nhập tên thí sinh (mỗi người 1 dòng - Tùy chọn)
                  </label>
                  <span className="text-xs text-slate-500">
                    Sẽ tự động điền nếu trống
                  </span>
                </div>
                <textarea
                  id="custom-names"
                  rows={4}
                  value={namesText}
                  onChange={(e) => setNamesText(e.target.value)}
                  placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C..."
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-slate-700 leading-relaxed"
                />
              </div>

              {/* Action */}
              <button
                id="btn-start-contest"
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950 stroke-slate-950" />
                Khởi tạo & Bắt đầu Cuộc thi
              </button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>Danh sách cuộc thi đã lưu</span>
              </div>
              
              {savedSummaries.map((summary) => (
                <div
                  key={summary.id}
                  id={`saved-contest-${summary.id}`}
                  className="p-4 border border-slate-800/80 rounded-xl hover:border-slate-700/80 bg-slate-950/40 hover:bg-slate-950/80 transition-all flex justify-between items-center group"
                >
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{summary.name}</h4>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                      <span>{summary.organizer}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                      <span>{summary.totalContestants} thí sinh</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                      <span>{new Date(summary.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {summary.winners && summary.winners.length > 0 && (
                      <p className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Quán quân: {summary.winners.join(', ')}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pl-4">
                    <button
                      type="button"
                      id={`btn-load-contest-${summary.id}`}
                      onClick={() => onLoadHistory(summary.id)}
                      className="p-1 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-100 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Mở lại
                    </button>
                    <button
                      type="button"
                      id={`btn-delete-contest-${summary.id}`}
                      onClick={() => onDeleteHistory(summary.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      title="Xóa cuộc thi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Discard Confirm Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">⚠️</span>
                <h3 className="font-black text-slate-100 text-sm uppercase">Xóa cuộc thi hiện tại?</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDiscardConfirm(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Bạn có chắc chắn muốn xóa tiến trình cuộc thi đang diễn ra để bắt đầu cuộc thi mới từ đầu? Toàn bộ kết quả chưa lưu của phiên này sẽ bị mất vĩnh viễn và không thể khôi phục.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('rungchuongvang_current_session');
                  setActiveSession(null);
                  setShowDiscardConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-lg shadow-rose-600/10"
              >
                XÓA PHIÊN CŨ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
