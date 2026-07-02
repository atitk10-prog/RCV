/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowRight, ArrowLeft, LifeBuoy, Check, AlertCircle, 
  RotateCcw, History, Sparkles, ChevronRight, Ban, X
} from 'lucide-react';
import { ContestState } from '../types';
import { sounds } from './SoundEffects';

interface AdminControlsProps {
  state: ContestState;
  rescueMode: boolean;
  selectedRescueIds: number[];
  onToggleRescueMode: () => void;
  onApplyRescue: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onEndRound1: () => void;
  onStartRound2: () => void;
  onReset: () => void;
  onUndoLastAction: () => void;
  hasUndo: boolean;
  onAutoRescuePercent: (percent: number) => void;
  onRescueAll: () => void;
  onRescueLatest: (count: number) => void;
  onUpdateMaxQuestion: (round: 1 | 2, maxQuestion: number) => void;
  onEndRound2?: () => void;
}

export default function AdminControls({
  state,
  rescueMode,
  selectedRescueIds,
  onToggleRescueMode,
  onApplyRescue,
  onNextQuestion,
  onPrevQuestion,
  onEndRound1,
  onStartRound2,
  onReset,
  onUndoLastAction,
  hasUndo,
  onAutoRescuePercent,
  onRescueAll,
  onRescueLatest,
  onRescueCustomIds,
  onUpdateMaxQuestion,
  onEndRound2,
}: AdminControlsProps) {
  const [showAutoRescue, setShowAutoRescue] = useState(false);
  const [rescueCountInput, setRescueCountInput] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmRescueAll, setShowConfirmRescueAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCount = state.contestants.filter(c => c.status === 'active' || c.status === 'rescued' || c.status === 'champion').length;
  const eliminatedCount = state.contestants.filter(c => c.status === 'eliminated').length;

  const handleRescueCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(rescueCountInput.trim(), 10);
    if (isNaN(count) || count <= 0) {
      setErrorMessage("Vui lòng nhập một số lượng thí sinh hợp lệ lớn hơn 0.");
      return;
    }
    if (count > eliminatedCount) {
      setShowConfirmRescueAll(true);
      return;
    }
    onRescueLatest(count);
    setRescueCountInput('');
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-lg p-5 rounded-xl border border-slate-850 shadow-xl space-y-5 font-sans text-slate-100 select-none" id="admin-controls-panel">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-wider">
            Bảng Điều Khiển Ban Tổ Chức
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Điều phối, định cấu hình thí sinh và vòng thi</p>
        </div>
        
        {/* Quick Undo */}
        <button
          id="btn-undo-admin"
          disabled={!hasUndo}
          onClick={onUndoLastAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            hasUndo
              ? 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-800 shadow-md'
              : 'text-slate-650 border-slate-900 cursor-not-allowed opacity-30'
          }`}
          title="Hoàn tác thao tác loại hoặc cứu trợ gần nhất"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hoàn tác</span>
        </button>
      </div>

      {/* Question & Progress Controllers */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tiến độ câu hỏi</span>
        <div className="flex items-center gap-2">
          {/* Back Question Button */}
          <button
            id="btn-prev-question"
            onClick={onPrevQuestion}
            disabled={state.currentQuestion <= 1}
            className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-850 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lùi Câu Hỏi</span>
          </button>

          {/* Next Question Button */}
          <button
            id="btn-next-question"
            onClick={onNextQuestion}
            disabled={state.isCompleted}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer transform active:scale-[0.98]"
          >
            <span>Câu Tiếp Theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rescue Management */}
      <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <LifeBuoy className="w-4 h-4 text-emerald-450 animate-spin" style={{ animationDuration: '4s' }} />
            Cứu trợ thí sinh
          </span>
          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
            {eliminatedCount} bị loại
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Toggle Rescue Button */}
          <button
            id="btn-toggle-rescue"
            onClick={onToggleRescueMode}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              rescueMode
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                : 'bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
            }`}
          >
            {rescueMode ? (
              <>
                <Ban className="w-3.5 h-3.5" />
                <span>Hủy Cứu Trợ</span>
              </>
            ) : (
              <>
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>CHỌN CỨU TRỢ ({selectedRescueIds.length})</span>
              </>
            )}
          </button>

          {/* Apply Rescue Button */}
          {rescueMode && (
            <button
              id="btn-apply-rescue"
              onClick={onApplyRescue}
              disabled={selectedRescueIds.length === 0}
              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ÁP DỤNG CỨU TRỢ ({selectedRescueIds.length})</span>
            </button>
          )}

          {/* Quick Auto Rescue Dropdown button */}
          {!rescueMode && eliminatedCount > 0 && (
            <button
              id="btn-quick-rescue"
              onClick={() => setShowAutoRescue(!showAutoRescue)}
              className="py-2 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cứu Nhanh / Tự Động</span>
            </button>
          )}
        </div>

        {/* Custom Input Rescue Form */}
        {!rescueMode && (
          <form onSubmit={handleRescueCountSubmit} className="space-y-2 pt-2 border-t border-slate-800/40">
            <label htmlFor="rescue-count-input" className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Nhập số lượng thí sinh được cứu trợ:
            </label>
            <div className="flex gap-1.5">
              <input
                id="rescue-count-input"
                type="number"
                min="1"
                max={eliminatedCount || 100}
                value={rescueCountInput}
                onChange={(e) => setRescueCountInput(e.target.value)}
                placeholder="Ví dụ: 15"
                className="flex-1 min-w-0 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder-slate-700"
              />
              <button
                type="submit"
                id="btn-submit-rescue-count"
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-lg transition-all shadow shadow-amber-500/5 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              >
                Xác nhận cứu
              </button>
            </div>
          </form>
        )}

        {/* Quick Auto Rescue Selection Panel */}
        {showAutoRescue && !rescueMode && eliminatedCount > 0 && (
          <div className="p-3 bg-slate-955 border border-slate-800 rounded-lg space-y-3 animate-fadeIn">
            {/* Rescue all / Rescue 20 */}
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cứu trợ hàng loạt:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-rescue-all"
                  type="button"
                  onClick={() => {
                    onRescueAll();
                    setShowAutoRescue(false);
                  }}
                  className="py-1.5 px-3 text-xxs font-bold border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 hover:border-transparent rounded text-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Cứu Toàn Bộ ({eliminatedCount})</span>
                </button>

                <button
                  id="btn-rescue-latest-20"
                  type="button"
                  onClick={() => {
                    onRescueLatest(20);
                    setShowAutoRescue(false);
                  }}
                  className="py-1.5 px-3 text-xxs font-bold border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 hover:border-transparent rounded text-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                  title="Cứu tối đa 20 học sinh bị loại gần đây nhất (lasted longest)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cứu 20 Em Gần Nhất</span>
                </button>
              </div>
            </div>

            {/* Rescue random percentage */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Chọn phần trăm cứu trợ ngẫu nhiên:</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    id={`btn-auto-rescue-${percent}`}
                    type="button"
                    onClick={() => {
                      onAutoRescuePercent(percent);
                      setShowAutoRescue(false);
                    }}
                    className="py-1 px-2 text-xxs font-bold border border-slate-800 bg-slate-900/60 rounded text-slate-300 hover:bg-emerald-500 hover:text-slate-950 hover:border-transparent transition-all font-mono cursor-pointer"
                  >
                    {percent}% ({Math.ceil(eliminatedCount * (percent / 100))} TS)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rounds & Progression State Actions */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Quản lý vòng thi</span>
        
        <div className="flex flex-col gap-2">
          {state.currentRound === 1 && (
            <button
              id="btn-end-round1"
              onClick={onEndRound1}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>KỂT THÚC VÒNG 1 (Lưu kết quả)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {state.currentRound === 2 && !state.isCompleted && (
            <div className="flex flex-col gap-2">
              <div className="text-center py-2 px-3 bg-emerald-500/10 text-[10px] text-emerald-400 font-bold rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                Đang tham gia Vòng 2 (Câu {state.round2StartQuestion || 16} → {state.round2MaxQuestion || 30})
              </div>
              <button
                id="btn-end-round2"
                onClick={onEndRound2}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>KẾT THÚC SỚM VÒNG 2 & XEM TOP 10</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Trigger start round 2 if needed */}
          {state.currentRound === 1 && state.currentQuestion > state.round1MaxQuestion && (
            <button
              id="btn-start-round2"
              onClick={onStartRound2}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>BẮT ĐẦU VÒNG 2 (Câu {state.round2StartQuestion || (state.currentQuestion)} → {state.round2MaxQuestion || (state.currentQuestion + 19)})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* System Sound Control and Master reset */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2" id="audio-synthesizer-admin-section">
          <input
            type="checkbox"
            id="sound-toggle"
            defaultChecked={sounds.enabled}
            onChange={(e) => {
              sounds.enabled = e.target.checked;
              if (sounds.enabled) sounds.playCorrect();
            }}
            className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/40 w-3.5 h-3.5 cursor-pointer accent-amber-500"
          />
          <label htmlFor="sound-toggle" className="text-[9px] font-bold text-slate-500 uppercase cursor-pointer select-none">
            Bật âm thanh hiệu ứng (Web Audio API)
          </label>
        </div>

        <button
          id="btn-reset-contest"
          onClick={() => setShowConfirmReset(true)}
          className="text-xs font-bold text-rose-450 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Custom Reset Confirm Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">⚠️</span>
                <h3 className="font-black text-slate-100 text-sm uppercase">Cảnh báo Đặt Lại</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfirmReset(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Bạn có chắc chắn muốn HỦY và KHỞI TẠO LẠI cuộc thi này? Toàn bộ tiến trình thi và kết quả hiện tại sẽ bị xóa sạch vĩnh viễn và không thể khôi phục.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-lg shadow-rose-600/10"
              >
                ĐẶT LẠI NGAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Rescue All Confirm Modal */}
      {showConfirmRescueAll && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-lg">⚠️</span>
                <h3 className="font-black text-slate-100 text-sm uppercase">Xác nhận cứu toàn bộ</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfirmRescueAll(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Số lượng yêu cầu cứu trợ vượt quá số thí sinh bị loại hiện tại. Bạn có muốn thực hiện cứu trợ TOÀN BỘ {eliminatedCount} thí sinh đang bị loại không?
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmRescueAll(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => {
                  onRescueLatest(eliminatedCount);
                  setRescueCountInput('');
                  setShowConfirmRescueAll(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer shadow-lg shadow-amber-500/10"
              >
                CỨU TOÀN BỘ ({eliminatedCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Error/Notice Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-lg">💡</span>
                <h3 className="font-black text-slate-100 text-sm uppercase">Thông báo</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer shadow-md"
              >
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
