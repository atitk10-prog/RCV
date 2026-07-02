import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Share2, LogOut, CheckCircle2, AlertTriangle, 
  RefreshCw, CloudLightning, Copy, ExternalLink, Wifi, WifiOff, Check
} from 'lucide-react';
import { 
  googleSignIn, logout, createGoogleSpreadsheet, appendSheetRow, 
  updateSheetValues, syncStateToFirestore, getAccessToken, setAccessToken
} from '../lib/firebase';
import { ContestState } from '../types';

interface SyncQueueItem {
  id: number;
  type: 'append' | 'update';
  range: string;
  values: any[][];
  status: 'pending' | 'failed';
}

interface GoogleSheetsSyncPanelProps {
  state: ContestState;
  onStateUpdate: (newState: ContestState) => void;
  // Callback when manual or auto save occurs
  onSavedQuestionsUpdate: (saved: Record<number, boolean>) => void;
  savedQuestions: Record<number, boolean>;
}

export default function GoogleSheetsSyncPanel({ 
  state, 
  onStateUpdate, 
  onSavedQuestionsUpdate,
  savedQuestions 
}: GoogleSheetsSyncPanelProps) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Google Sheet Config states
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return state.spreadsheetId || localStorage.getItem(`rungchuongvang_sheet_id_${state.id}`) || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return state.spreadsheetUrl || localStorage.getItem(`rungchuongvang_sheet_url_${state.id}`) || '';
  });
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    return localStorage.getItem(`rungchuongvang_sheet_autosave_${state.id}`) !== 'false';
  });
  const [existingInput, setExistingInput] = useState<string>('');

  // Realtime Sync Room State
  const [roomId, setRoomId] = useState<string>(() => {
    return localStorage.getItem(`rungchuongvang_room_id_${state.id}`) || state.id;
  });
  const [isLive, setIsLive] = useState<boolean>(() => {
    return localStorage.getItem(`rungchuongvang_live_sync_${state.id}`) === 'true';
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync Queue State
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    try {
      const q = localStorage.getItem(`rungchuongvang_sync_queue_${state.id}`);
      return q ? JSON.parse(q) : [];
    } catch { return []; }
  });

  // Sync queue to local storage
  useEffect(() => {
    localStorage.setItem(`rungchuongvang_sync_queue_${state.id}`, JSON.stringify(syncQueue));
  }, [syncQueue, state.id]);

  // Background processor for the queue
  useEffect(() => {
    const processQueue = async () => {
      if (!token || !spreadsheetId || syncQueue.length === 0) return;
      
      const item = syncQueue[0];
      try {
        if (item.type === 'append') {
          await appendSheetRow(spreadsheetId, item.range, item.values, token);
        } else if (item.type === 'update') {
          await updateSheetValues(spreadsheetId, item.range, item.values, token);
        }
        
        // Remove item on success
        setSyncQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (err) {
        console.error('Lỗi đồng bộ ngầm, sẽ thử lại sau:', err);
      }
    };

    const interval = setInterval(processQueue, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [syncQueue, token, spreadsheetId]);

  // Sync spreadsheetId from parent state if available
  useEffect(() => {
    if (state.spreadsheetId && state.spreadsheetId !== spreadsheetId) {
      setSpreadsheetId(state.spreadsheetId);
      setSpreadsheetUrl(state.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${state.spreadsheetId}/edit`);
      localStorage.setItem(`rungchuongvang_sheet_id_${state.id}`, state.spreadsheetId);
      if (state.spreadsheetUrl) {
        localStorage.setItem(`rungchuongvang_sheet_url_${state.id}`, state.spreadsheetUrl);
      }
    }
  }, [state.spreadsheetId, state.spreadsheetUrl, state.id]);

  // Restore session token if user is already signed in via firebase (or from local cache)
  useEffect(() => {
    const cachedToken = getAccessToken();
    if (cachedToken) {
      setToken(cachedToken);
    }
  }, []);

  // Sync to Firestore whenever state changes and isLive is true
  useEffect(() => {
    if (isLive && roomId) {
      syncStateToFirestore(roomId, state.name, state);
    }
  }, [state, isLive, roomId]);

  // If Auto-Save is enabled and state changes, auto save question if contestants status changed
  useEffect(() => {
    if (autoSave && token && spreadsheetId && !savedQuestions[state.currentQuestion]) {
      // Check if we have active contestants to prevent saving blank initial states
      const activeCount = state.contestants.filter(c => c.status === 'active' || c.status === 'rescued' || c.status === 'champion').length;
      if (activeCount < state.totalContestants) {
        handleSaveQuestionToSheet();
      }
    }
  }, [state.currentQuestion, token, spreadsheetId, autoSave]);

  // Real-time debounce for ranking sync to Google Sheets (one-way sync from Web to Sheet)
  // This satisfies the requirement to update Google Sheets in real-time (with a 3s delay to avoid API limits)
  // whenever any contestant is eliminated, rescued, or changes score.
  useEffect(() => {
    if (autoSave && token && spreadsheetId) {
      const timer = setTimeout(() => {
        handleEnqueueRankingsSync();
      }, 3000); // 3 seconds debounce

      return () => clearTimeout(timer);
    }
  }, [state.contestants, autoSave, token, spreadsheetId]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      alert(`Đăng nhập Google thất bại: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setAccessToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const title = `Kết quả Rung Chuông Vàng - ${state.name}`;
      const res = await createGoogleSpreadsheet(title, token);
      setSpreadsheetId(res.spreadsheetId);
      setSpreadsheetUrl(res.spreadsheetUrl);
      localStorage.setItem(`rungchuongvang_sheet_id_${state.id}`, res.spreadsheetId);
      localStorage.setItem(`rungchuongvang_sheet_url_${state.id}`, res.spreadsheetUrl);
      
      // Update parent state
      onStateUpdate({
        ...state,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl
      });
      alert('Đã khởi tạo Google Sheets thành công!');
    } catch (err: any) {
      alert(`Lỗi tạo Google Sheet: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkExistingSheet = () => {
    let id = existingInput.trim();
    if (!id) {
      alert('Vui lòng nhập đường dẫn Google Sheets hoặc Spreadsheet ID!');
      return;
    }
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      id = match[1];
    }
    const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;
    setSpreadsheetId(id);
    setSpreadsheetUrl(url);
    localStorage.setItem(`rungchuongvang_sheet_id_${state.id}`, id);
    localStorage.setItem(`rungchuongvang_sheet_url_${state.id}`, url);
    
    // Update parent state
    onStateUpdate({
      ...state,
      spreadsheetId: id,
      spreadsheetUrl: url
    });
    alert('Đã liên kết với Google Sheets cũ thành công!');
    setExistingInput('');
  };

  const handleSaveQuestionToSheet = async () => {
    if (!token || !spreadsheetId) return;
    setIsLoading(true);
    try {
      // Calculate contestants eliminated in this question
      const eliminatedInThisQ = state.contestants
        .filter(c => c.status === 'eliminated' && c.eliminatedAtQuestion === state.currentQuestion)
        .map(c => `SBD ${`0${c.id}`.slice(-2)} (${c.name})`);

      // Calculate contestants rescued in this question
      const rescuedInThisQ = state.contestants
        .filter(c => c.status === 'rescued' && c.rescuedAtQuestion === state.currentQuestion)
        .map(c => `SBD ${`0${c.id}`.slice(-2)} (${c.name})`);

      const displayedContestants = state.currentRound === 2 
        ? state.contestants.filter(c => c.isInRound2)
        : state.contestants;

      const activeCount = displayedContestants.filter(
        (c) => c.status === 'active' || c.status === 'rescued' || c.status === 'champion'
      ).length;

      // Create new log row
      const logRow = [
        new Date().toLocaleString('vi-VN'),
        `Vòng ${state.currentRound}`,
        `Câu ${state.currentQuestion}`,
        displayedContestants.length,
        activeCount,
        eliminatedInThisQ.length > 0 ? 'Loại thí sinh' : rescuedInThisQ.length > 0 ? 'Cứu trợ thí sinh' : 'Không có thay đổi',
        eliminatedInThisQ.length > 0 ? eliminatedInThisQ.join(', ') : 'Không có',
        rescuedInThisQ.length > 0 ? rescuedInThisQ.join(', ') : 'Không có'
      ];

      // Enqueue append task
      const appendItem: SyncQueueItem = {
        id: Date.now(),
        type: 'append',
        range: 'Nhật Ký Câu Hỏi!A2',
        values: [logRow],
        status: 'pending'
      };
      setSyncQueue(prev => [...prev, appendItem]);

      // Enqueue ranking refresh as well
      handleEnqueueRankingsSync();

      // Mark question as saved
      const updatedSaved = { ...savedQuestions, [state.currentQuestion]: true };
      onSavedQuestionsUpdate(updatedSaved);
      localStorage.setItem(`rungchuongvang_saved_q_${state.id}`, JSON.stringify(updatedSaved));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnqueueRankingsSync = () => {
    if (!token || !spreadsheetId) return;
    
    // Sort contestants by status, scores, etc. for ranking
    const sortedContestants = [...state.contestants].sort((a, b) => {
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

    const rows = sortedContestants.map((c, index) => {
      const totalScore = (c.round1CorrectCount || 0) + (c.round2CorrectCount || 0);
      let statusText = 'Đã bị loại';
      if (c.status === 'champion') statusText = 'Quán quân 👑';
      else if (c.status === 'active') statusText = 'Đang thi đấu';
      else if (c.status === 'rescued') statusText = 'Được cứu trợ 🟡';

      return [
        index + 1,
        `SBD ${`0${c.id}`.slice(-2)}`,
        c.name,
        c.round1CorrectCount || 0,
        c.round2CorrectCount || 0,
        totalScore,
        c.rescueCount || 0,
        statusText,
        c.eliminatedAtQuestion ? `Câu ${c.eliminatedAtQuestion}` : '-'
      ];
    });

    const updateItem: SyncQueueItem = {
      id: Date.now() + 1,
      type: 'update',
      range: 'Xếp Hạng Thí Sinh!A2:I500',
      values: rows,
      status: 'pending'
    };

    // Replace existing pending ranking updates to avoid redundant requests
    setSyncQueue(prev => {
      const filtered = prev.filter(q => q.type !== 'update');
      return [...filtered, updateItem];
    });
  };

  const handleToggleAutoSave = () => {
    const newVal = !autoSave;
    setAutoSave(newVal);
    localStorage.setItem(`rungchuongvang_sheet_autosave_${state.id}`, String(newVal));
  };

  const handleToggleLive = () => {
    const newVal = !isLive;
    setIsLive(newVal);
    localStorage.setItem(`rungchuongvang_live_sync_${state.id}`, String(newVal));
    if (newVal) {
      // Initial sync
      syncStateToFirestore(roomId, state.name, state);
    }
  };

  const handleCopySpectatorLink = () => {
    // Generate viewer URL using the current path and appending spectator mode params
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isCurrentQSaved = savedQuestions[state.currentQuestion];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md p-5 space-y-4">
      {/* Header with Title and Google Auth Profile */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Google Sheets & Realtime</h3>
        </div>
        
        {token ? (
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-450 transition-colors text-xxs flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            Đăng xuất
          </button>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-950 font-black text-xxs px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 shadow shadow-emerald-500/10"
          >
            <CloudLightning className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            Kết nối Google
          </button>
        )}
      </div>

      {/* Google Sheets Integration Controls */}
      {token ? (
        <div className="space-y-3.5">
          {spreadsheetId ? (
            <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Bảng Tính Đang Kết Nối</span>
                  <a 
                    href={spreadsheetUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-200 hover:text-emerald-400 transition-all flex items-center gap-1 underline"
                  >
                    <span>Mở Google Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                {/* Auto Save Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[10px] text-slate-400">Tự động lưu:</span>
                  <input 
                    type="checkbox" 
                    checked={autoSave}
                    onChange={handleToggleAutoSave}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800 cursor-pointer"
                  />
                </label>
              </div>

              {/* Queue Status Badge */}
              {syncQueue.length > 0 && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                    Đang lưu đệm {syncQueue.length} tác vụ (Chờ mạng ổn định)
                  </span>
                </div>
              )}

              {/* Current Question Save Status */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Lưu dữ liệu Câu {state.currentQuestion}:</span>
                  {isCurrentQSaved ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã lưu</span>
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Chưa lưu</span>
                    </span>
                  )}
                </div>

                {!isCurrentQSaved && (
                  <button
                    onClick={handleSaveQuestionToSheet}
                    disabled={isLoading}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xxs rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/5"
                  >
                    {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                    <span>LƯU DỮ LIỆU CÂU {state.currentQuestion} LÊN GOOGLE SHEET</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-850 space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-xxs text-slate-400 leading-relaxed">
                  Bạn hãy khởi tạo Bảng Tính Google Sheets mới để tự động lưu điểm và nhật ký thi đấu:
                </p>
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Khởi tạo Google Sheet Mới</span>
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">HOẶC</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="space-y-2">
                <p className="text-xxs text-slate-400 leading-relaxed text-center">
                  Nhập đường dẫn (Link) hoặc ID Bảng tính Google Sheet cũ để tiếp tục đồng bộ:
                </p>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={existingInput}
                    onChange={(e) => setExistingInput(e.target.value)}
                    placeholder="Dán link Google Sheet hoặc ID vào đây..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xxs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleLinkExistingSheet}
                    disabled={isLoading || !existingInput.trim()}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-55 text-slate-200 hover:text-white font-bold text-xxs rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Liên kết Bảng tính cũ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-slate-950/30 rounded-lg text-center border border-slate-850">
          <p className="text-xxs text-slate-400 leading-relaxed">
            Nhấp nút <strong>"Kết nối Google"</strong> phía trên để liên kết tài khoản Google Drive và Google Sheets của bạn. Hệ thống sẽ hỗ trợ lưu và ghi lịch sử điểm số tự động.
          </p>
        </div>
      )}

      {/* Realtime Website Broadcast sync */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">Phát Sóng Website Realtime</span>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isLive}
              onChange={handleToggleLive}
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950"></div>
          </label>
        </div>

        {isLive && (
          <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Mã phòng thi đấu</span>
                <span className="text-xs font-mono font-black text-amber-400">{roomId}</span>
              </div>
              <button
                onClick={handleCopySpectatorLink}
                className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 text-xxs flex items-center gap-1 cursor-pointer transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép link xem</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ● Khán giả hoặc các máy tính khác chỉ cần quét QR hoặc mở link trên để xem kết quả sân đấu cập nhật liên tục <strong>thời gian thực</strong>!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
