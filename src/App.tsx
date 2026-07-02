/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, Play, History, ArrowLeft, ArrowRight, LifeBuoy, 
  Trash2, FileSpreadsheet, RefreshCw, Layers, Award, Sparkles, 
  Check, X, Tv, Volume2, VolumeX, Printer, Save, Undo, Search
} from 'lucide-react';

import { ContestState, Contestant, SavedContestSummary } from './types';
import { sounds } from './components/SoundEffects';
import SetupModal from './components/SetupModal';
import StatsBanner from './components/StatsBanner';
import ContestantGrid from './components/ContestantGrid';
import AdminControls from './components/AdminControls';
import ReportsAndLogs from './components/ReportsAndLogs';
import ProjectorView from './components/ProjectorView';
import GoogleSheetsSyncPanel from './components/GoogleSheetsSyncPanel';
import { listenToFirestoreSession } from './lib/firebase';
import AdminLogin from './components/AdminLogin';
import SpectatorDashboard from './components/SpectatorDashboard';

export default function App() {
  const [state, setState] = useState<ContestState | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<SavedContestSummary[]>([]);
  const [rescueMode, setRescueMode] = useState<boolean>(false);
  const [selectedRescueIds, setSelectedRescueIds] = useState<number[]>([]);
  const [undoStack, setUndoStack] = useState<ContestState[]>([]);
  const [showProjector, setShowProjector] = useState<boolean>(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showConfirmBack, setShowConfirmBack] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<{ message: string; title?: string } | null>(null);

  // Admin authentication states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rungchuongvang_is_authenticated') === 'true';
  });
  const [isSpectatorSetupMode, setIsSpectatorSetupMode] = useState<boolean>(false);
  const [newAdminUser, setNewAdminUser] = useState<string>('');
  const [newAdminPass, setNewAdminPass] = useState<string>('');

  // Spectator and Google Sheet States
  const [isSpectatorMode, setIsSpectatorMode] = useState<boolean>(false);
  const [spectatorRoomId, setSpectatorRoomId] = useState<string>('');
  const [spectatorViewType, setSpectatorViewType] = useState<'dashboard' | 'projector'>('dashboard');
  const [savedQuestions, setSavedQuestions] = useState<Record<number, boolean>>({});

  // Load state and history list on component mount
  useEffect(() => {
    // Check if URL has spectator room query param
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setSpectatorRoomId(roomParam);
      setIsSpectatorMode(true);
    } else {
      const savedState = localStorage.getItem('rungchuongvang_current_session');
      if (savedState) {
        try {
          setState(JSON.parse(savedState));
        } catch (err) {
          console.error('Không thể khôi phục phiên hoạt động cũ:', err);
        }
      }
    }

    loadHistorySummaries();
  }, []);

  // Listen to Firestore real-time session when in Spectator Mode
  useEffect(() => {
    if (isSpectatorMode && spectatorRoomId) {
      const unsubscribe = listenToFirestoreSession(spectatorRoomId, (updatedState) => {
        if (updatedState) {
          setState(updatedState);
        }
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isSpectatorMode, spectatorRoomId]);

  // Load saved questions log when session is active
  useEffect(() => {
    if (state?.id) {
      const stored = localStorage.getItem(`rungchuongvang_saved_q_${state.id}`);
      if (stored) {
        try {
          setSavedQuestions(JSON.parse(stored));
        } catch (e) {
          setSavedQuestions({});
        }
      } else {
        setSavedQuestions({});
      }
    }
  }, [state?.id]);

  // Admin credentials management & logout
  const handleChangeAdminCredentials = () => {
    if (!newAdminUser && !newAdminPass) {
      alert('Vui lòng nhập ít nhất Tên tài khoản mới hoặc Mật khẩu mới!');
      return;
    }
    const currentUsername = localStorage.getItem('rungchuongvang_admin_user') || 'admin';
    const currentPassword = localStorage.getItem('rungchuongvang_admin_pass') || 'admin';

    const finalUser = newAdminUser || currentUsername;
    const finalPass = newAdminPass || currentPassword;

    localStorage.setItem('rungchuongvang_admin_user', finalUser);
    localStorage.setItem('rungchuongvang_admin_pass', finalPass);

    alert('Cập nhật tài khoản quản trị thành công!');
    setNewAdminUser('');
    setNewAdminPass('');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('rungchuongvang_is_authenticated');
    setIsAdminAuthenticated(false);
    setIsSpectatorSetupMode(false);
    setIsSpectatorMode(false);
    setState(null);
  };

  // Sync state to local storage automatically
  const saveStateToStorage = (newState: ContestState | null) => {
    setState(newState);
    if (newState) {
      localStorage.setItem('rungchuongvang_current_session', JSON.stringify(newState));
    } else {
      localStorage.removeItem('rungchuongvang_current_session');
    }
  };

  const loadHistorySummaries = () => {
    const listJson = localStorage.getItem('rungchuongvang_history_list');
    if (listJson) {
      try {
        setSavedSummaries(JSON.parse(listJson));
      } catch (e) {
        setSavedSummaries([]);
      }
    }
  };

  // Push to local undo stack
  const pushUndo = (currentState: ContestState) => {
    // Deep clone the current state to guarantee full isolation
    const clone = JSON.parse(JSON.stringify(currentState));
    setUndoStack((prev) => [...prev.slice(-30), clone]); // Limit undo stack to 30 history states
  };

  // Start a new contest
  const handleStartContest = ({
    name,
    organizer,
    totalContestants,
    names,
    round1MaxQuestion,
    round2MaxQuestion,
    round2StartQuestion,
    colsPerRow,
  }: {
    name: string;
    organizer: string;
    totalContestants: number;
    names: string[];
    round1MaxQuestion: number;
    round2MaxQuestion: number;
    round2StartQuestion: number;
    colsPerRow: number;
  }) => {
    const contestants: Contestant[] = names.map((name, i) => ({
      id: i + 1,
      name,
      status: 'active',
      eliminatedAtQuestion: null,
      correctAnswersCount: 0,
      rescuedAtQuestion: null,
      round1CorrectCount: 0,
      round2CorrectCount: 0,
      rescueCount: 0,
    }));

    const newState: ContestState = {
      id: `contest_${Date.now()}`,
      name,
      organizer,
      totalContestants,
      currentQuestion: 1,
      currentRound: 1,
      round1MaxQuestion,
      round2MaxQuestion,
      round2StartQuestion,
      isCompleted: false,
      contestants,
      colsPerRow,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUndoStack([]);
    saveStateToStorage(newState);
    setRescueMode(false);
    setSelectedRescueIds([]);
    sounds.playCorrect();
  };

  // Answer correctly / advanced to next question
  const handleNextQuestion = () => {
    if (!state) return;
    pushUndo(state);

    const nextQ = state.currentQuestion + 1;
    
    // Add 1 correct answer to everyone who is active/rescued/champion in this question
    const updatedContestants = state.contestants.map((c) => {
      if (c.status === 'active' || c.status === 'rescued' || c.status === 'champion') {
        const round1Correct = state.currentRound === 1 
          ? Math.min(state.round1MaxQuestion, (c.round1CorrectCount || 0) + 1) 
          : (c.round1CorrectCount || 0);
        const round2Correct = state.currentRound === 2 
          ? Math.min(state.round2MaxQuestion - (state.round2StartQuestion || 16) + 1, (c.round2CorrectCount || 0) + 1) 
          : (c.round2CorrectCount || 0);
        return {
          ...c,
          correctAnswersCount: round1Correct + round2Correct,
          round1CorrectCount: round1Correct,
          round2CorrectCount: round2Correct,
        };
      }
      return c;
    });

    const maxQ = state.currentRound === 1 ? state.round1MaxQuestion : state.round2MaxQuestion;
    const isCompleted = nextQ > maxQ;

    const updatedState: ContestState = {
      ...state,
      currentQuestion: isCompleted ? state.currentQuestion : nextQ,
      contestants: updatedContestants,
      recentlyRescued: [],
      isCompleted: isCompleted,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playTick();

    if (isCompleted) {
      sounds.playFanfare();
      setAlertConfig({
        title: "Hoàn thành Vòng Đấu",
        message: `Đã đạt tới câu hỏi tối đa của vòng ${state.currentRound}! Hãy tổng kết và di chuyển sang vòng tiếp theo.`
      });
    }
  };

  // Back progress a question
  const handlePrevQuestion = () => {
    if (!state || state.currentQuestion <= 1) return;
    pushUndo(state);

    const prevQ = state.currentQuestion - 1;

    // Deduct 1 correct answer logic to reverse accurately
    const updatedContestants = state.contestants.map((c) => {
      if (c.status === 'active' || c.status === 'rescued' || c.status === 'champion') {
        const round1Correct = state.currentRound === 1 
          ? Math.max(0, (c.round1CorrectCount || 0) - 1) 
          : (c.round1CorrectCount || 0);
        const round2Correct = state.currentRound === 2 
          ? Math.max(0, (c.round2CorrectCount || 0) - 1) 
          : (c.round2CorrectCount || 0);
        return {
          ...c,
          correctAnswersCount: round1Correct + round2Correct,
          round1CorrectCount: round1Correct,
          round2CorrectCount: round2Correct,
        };
      }
      return c;
    });

    const updatedState: ContestState = {
      ...state,
      currentQuestion: prevQ,
      contestants: updatedContestants,
      recentlyRescued: [],
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playTock();
  };

  // Eliminate a contestant on click
  const handleEliminate = (id: number) => {
    if (!state) return;
    pushUndo(state);

    const updatedContestants = state.contestants.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'eliminated' as const,
          eliminatedAtQuestion: state.currentQuestion,
          // Correct answers before elimination is calculated correctly based on question increments
        };
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: [],
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playIncorrect();
  };

  // Restore a contestant on click
  const handleRestore = (id: number) => {
    if (!state) return;
    pushUndo(state);

    const updatedContestants = state.contestants.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'active' as const,
          eliminatedAtQuestion: null,
          rescuedAtQuestion: null,
        };
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: [],
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playCorrect();
  };

  // Crown a champion
  const handleCrownChampion = (id: number) => {
    if (!state) return;
    pushUndo(state);

    const updatedContestants = state.contestants.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'champion' as const,
        };
      }
      return c;
    });

    const updatedState: ContestState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: [],
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playFanfare();
  };

  // Toggle Rescue Selecting mode
  const handleToggleRescueMode = () => {
    setRescueMode(!rescueMode);
    setSelectedRescueIds([]);
  };

  // Toggle single rescue selection inside the grid
  const handleToggleRescueSelect = (id: number) => {
    setSelectedRescueIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Apply chosen rescue
  const handleApplyRescue = () => {
    if (!state || selectedRescueIds.length === 0) return;
    pushUndo(state);

    const newlyRescued: Contestant[] = [];
    const updatedContestants = state.contestants.map((c) => {
      if (selectedRescueIds.includes(c.id)) {
        const updated = {
          ...c,
          status: 'rescued' as const,
          rescuedAtQuestion: state.currentQuestion,
          rescueCount: (c.rescueCount || 0) + 1,
          // Retains previous correctAnswersCount perfectly
        };
        newlyRescued.push(updated);
        return updated;
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: newlyRescued,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    setRescueMode(false);
    setSelectedRescueIds([]);
    sounds.playGong();
  };

  // Auto rescue percentage randomly
  const handleAutoRescuePercent = (percent: number) => {
    if (!state) return;
    const eliminated = state.contestants.filter((c) => c.status === 'eliminated');
    if (eliminated.length === 0) return;

    pushUndo(state);

    const totalToRescue = Math.ceil(eliminated.length * (percent / 100));
    
    // Shuffle and pick
    const shuffled = [...eliminated].sort(() => 0.5 - Math.random());
    const rescueIds = shuffled.slice(0, totalToRescue).map((c) => c.id);

    const newlyRescued: Contestant[] = [];
    const updatedContestants = state.contestants.map((c) => {
      if (rescueIds.includes(c.id)) {
        const updated = {
          ...c,
          status: 'rescued' as const,
          rescuedAtQuestion: state.currentQuestion,
          rescueCount: (c.rescueCount || 0) + 1,
        };
        newlyRescued.push(updated);
        return updated;
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: newlyRescued,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playGong();

    alert(`Hệ thống đã tự động chọn ngẫu nhiên cứu cứu thành công ${totalToRescue} thí sinh!`);
  };

  // Rescue all eliminated contestants
  const handleRescueAll = () => {
    if (!state) return;
    const eliminated = state.contestants.filter((c) => c.status === 'eliminated');
    if (eliminated.length === 0) return;

    pushUndo(state);

    const newlyRescued: Contestant[] = [];
    const updatedContestants = state.contestants.map((c) => {
      if (c.status === 'eliminated') {
        const updated = {
          ...c,
          status: 'rescued' as const,
          rescuedAtQuestion: state.currentQuestion,
          rescueCount: (c.rescueCount || 0) + 1,
        };
        newlyRescued.push(updated);
        return updated;
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: newlyRescued,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playGong();
    alert(`Đã cứu trợ toàn bộ ${eliminated.length} thí sinh bị loại thành công!`);
  };

  // Rescue the N most recently eliminated contestants
  const handleRescueLatest = (count: number) => {
    if (!state) return;
    const eliminated = state.contestants.filter((c) => c.status === 'eliminated');
    if (eliminated.length === 0) return;

    pushUndo(state);

    // Sort eliminated contestants for rescue based on:
    // 1. Current round correct answers (descending: more correct answers first)
    // 2. Fewer rescues (ascending: less rescued first)
    // 3. Question number when eliminated (descending: lasted longer first)
    // 4. Smaller SBD (id ascending)
    const sorted = [...eliminated].sort((a, b) => {
      const isRound2 = state.currentRound === 2;
      const aCorrect = isRound2 ? (a.round2CorrectCount || 0) : (a.round1CorrectCount || 0);
      const bCorrect = isRound2 ? (b.round2CorrectCount || 0) : (b.round1CorrectCount || 0);
      if (bCorrect !== aCorrect) {
        return bCorrect - aCorrect;
      }

      const aRescue = a.rescueCount || 0;
      const bRescue = b.rescueCount || 0;
      if (aRescue !== bRescue) {
        return aRescue - bRescue;
      }

      const aQ = a.eliminatedAtQuestion || 0;
      const bQ = b.eliminatedAtQuestion || 0;
      if (bQ !== aQ) {
        return bQ - aQ;
      }

      return a.id - b.id;
    });

    const isRound2 = state.currentRound === 2;
    const getScore = (c: any) => isRound2 ? (c.round2CorrectCount || 0) : (c.round1CorrectCount || 0);
    const getRescues = (c: any) => c.rescueCount || 0;
    const getElimQ = (c: any) => c.eliminatedAtQuestion || 0;

    let finalRescueCount = Math.min(count, sorted.length);
    if (finalRescueCount > 0 && finalRescueCount < sorted.length) {
      const boundary = sorted[finalRescueCount - 1];
      const boundaryScore = getScore(boundary);
      const boundaryRescues = getRescues(boundary);
      const boundaryElimQ = getElimQ(boundary);

      while (finalRescueCount < sorted.length) {
        const next = sorted[finalRescueCount];
        if (
          getScore(next) === boundaryScore &&
          getRescues(next) === boundaryRescues &&
          getElimQ(next) === boundaryElimQ
        ) {
          finalRescueCount++;
        } else {
          break;
        }
      }
    }

    const rescueIds = sorted.slice(0, finalRescueCount).map((c) => c.id);

    const newlyRescued: Contestant[] = [];
    const updatedContestants = state.contestants.map((c) => {
      if (rescueIds.includes(c.id)) {
        const updated = {
          ...c,
          status: 'rescued' as const,
          rescuedAtQuestion: state.currentQuestion,
          rescueCount: (c.rescueCount || 0) + 1,
        };
        newlyRescued.push(updated);
        return updated;
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: newlyRescued,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playGong();
    alert(`Đã cứu trợ thành công ${rescueIds.length} thí sinh ra gần nhất (bị loại muộn nhất, làm đúng nhiều nhất)!`);
  };

  // Rescue custom list of contestant IDs
  const handleRescueCustomIds = (ids: number[]) => {
    if (!state) return;
    pushUndo(state);

    const newlyRescued: Contestant[] = [];
    const updatedContestants = state.contestants.map((c) => {
      if (ids.includes(c.id)) {
        const updated = {
          ...c,
          status: 'rescued' as const,
          rescuedAtQuestion: state.currentQuestion,
          rescueCount: (c.rescueCount || 0) + 1,
        };
        newlyRescued.push(updated);
        return updated;
      }
      return c;
    });

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      recentlyRescued: newlyRescued,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playGong();
    alert(`Đã cứu trợ thành công ${newlyRescued.length} thí sinh: ${newlyRescued.map(c => `SBD ${`0${c.id}`.slice(-2)} (${c.name})`).join(', ')}`);
  };

  // Update dynamic question limit for current round
  const handleUpdateMaxQuestion = (round: 1 | 2, maxQuestion: number) => {
    if (!state) return;
    pushUndo(state);

    const updatedState = {
      ...state,
      round1MaxQuestion: round === 1 ? maxQuestion : state.round1MaxQuestion,
      round2MaxQuestion: round === 2 ? maxQuestion : state.round2MaxQuestion,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
  };

  // End Round 1 and auto-select half of the initial contestants
  const handleEndRound1 = () => {
    if (!state) return;
    pushUndo(state);

    const nextQ = state.round2StartQuestion || 16;
    const round2Max = state.round2MaxQuestion || 30;
    const selectCount = Math.ceil(state.totalContestants / 2);

    // Automatic select top half of contestants according to rules:
    // 1. Prioritize more correct answers in Round 1
    // 2. Prioritize fewer rescues
    // 3. Prioritize active/rescued/champion over eliminated
    // 4. Prioritize lasted longer (higher eliminatedAtQuestion)
    // 5. Smaller SBD
    const sortedRound1 = [...state.contestants].sort((a, b) => {
      const aCorrect = a.round1CorrectCount || 0;
      const bCorrect = b.round1CorrectCount || 0;
      if (bCorrect !== aCorrect) {
        return bCorrect - aCorrect;
      }

      const aRescue = a.rescueCount || 0;
      const bRescue = b.rescueCount || 0;
      if (aRescue !== bRescue) {
        return aRescue - bRescue;
      }

      const aActive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
      const bActive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
      if (bActive !== aActive) {
        return bActive - aActive;
      }

      const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
      const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
      if (bElim !== aElim) {
        return bElim - aElim;
      }

      return a.id - b.id;
    });

    // Select the top half, but extend if there are ties
    let finalSelectCount = Math.min(selectCount, sortedRound1.length);
    if (finalSelectCount > 0 && finalSelectCount < sortedRound1.length) {
      const boundary = sortedRound1[finalSelectCount - 1];
      const boundaryCorrect = boundary.round1CorrectCount || 0;
      const boundaryRescue = boundary.rescueCount || 0;
      const boundaryActive = boundary.status === 'active' || boundary.status === 'rescued' || boundary.status === 'champion' ? 1 : 0;
      const boundaryElimQ = boundary.status === 'eliminated' ? (boundary.eliminatedAtQuestion || 0) : 999;

      while (finalSelectCount < sortedRound1.length) {
        const next = sortedRound1[finalSelectCount];
        const nextCorrect = next.round1CorrectCount || 0;
        const nextRescue = next.rescueCount || 0;
        const nextActive = next.status === 'active' || next.status === 'rescued' || next.status === 'champion' ? 1 : 0;
        const nextElimQ = next.status === 'eliminated' ? (next.eliminatedAtQuestion || 0) : 999;

        if (
          nextCorrect === boundaryCorrect &&
          nextRescue === boundaryRescue &&
          nextActive === boundaryActive &&
          nextElimQ === boundaryElimQ
        ) {
          finalSelectCount++;
        } else {
          break;
        }
      }
    }

    const selectedIds = sortedRound1.slice(0, finalSelectCount).map(c => c.id);

    // Map contestants for Round 2
    const updatedContestants = state.contestants.map((c) => {
      const isSelected = selectedIds.includes(c.id);
      if (isSelected) {
        return {
          ...c,
          status: 'active' as const, // Activate for Round 2
          eliminatedAtQuestion: null,
          rescuedAtQuestion: null,
          round2CorrectCount: 0, // Reset Round 2 correct answers
          isInRound2: true,
        };
      } else {
        return {
          ...c,
          status: 'eliminated' as const, // Eliminate non-selected
          isInRound2: false,
        };
      }
    });

    const updatedState: ContestState = {
      ...state,
      currentQuestion: nextQ,
      currentRound: 2,
      round2StartQuestion: nextQ,
      round2MaxQuestion: round2Max,
      contestants: updatedContestants,
      recentlyRescued: [],
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playFanfare();
    alert(`Đã kết thúc Vòng 1 và tự động chọn ${selectedIds.length} thí sinh xuất sắc nhất bước vào Vòng 2 theo đúng quy chế!\n\nBắt đầu Vòng 2 từ Câu ${nextQ} đến Câu ${round2Max}.`);
  };

  const handleEndRound2 = () => {
    if (!state) return;
    if (window.confirm('Bạn có chắc chắn muốn KẾT THÚC VÒNG 2 SỚM để tổng kết Bảng xếp hạng Top 10 không?')) {
      pushUndo(state);
      const updatedState = { ...state, isCompleted: true, updatedAt: new Date().toISOString() };
      saveStateToStorage(updatedState);
      sounds.playFanfare();
      
      // Auto scroll to reports section to show top 10
      setTimeout(() => {
        const reportsPanel = document.getElementById('reports-logs-panel');
        if (reportsPanel) {
          reportsPanel.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
      
      alert('Đã kết thúc cuộc thi! Vui lòng cuộn xuống Bảng xếp hạng để xem danh sách Top 10 người xuất sắc nhất.');
    }
  };

  // Start Round 2 manually
  const handleStartRound2 = () => {
    if (!state) return;
    pushUndo(state);

    const nextQ = state.round2StartQuestion || 16;
    const round2Max = state.round2MaxQuestion || 30;
    const selectCount = Math.ceil(state.totalContestants / 2);

    // Automatic select top half of contestants according to rules:
    // 1. Prioritize more correct answers in Round 1
    // 2. Prioritize fewer rescues
    // 3. Prioritize active/rescued/champion over eliminated
    // 4. Prioritize lasted longer (higher eliminatedAtQuestion)
    // 5. Smaller SBD
    const sortedRound1 = [...state.contestants].sort((a, b) => {
      const aCorrect = a.round1CorrectCount || 0;
      const bCorrect = b.round1CorrectCount || 0;
      if (bCorrect !== aCorrect) {
        return bCorrect - aCorrect;
      }

      const aRescue = a.rescueCount || 0;
      const bRescue = b.rescueCount || 0;
      if (aRescue !== bRescue) {
        return aRescue - bRescue;
      }

      const aActive = a.status === 'active' || a.status === 'rescued' || a.status === 'champion' ? 1 : 0;
      const bActive = b.status === 'active' || b.status === 'rescued' || b.status === 'champion' ? 1 : 0;
      if (bActive !== aActive) {
        return bActive - aActive;
      }

      const aElim = a.status === 'eliminated' ? (a.eliminatedAtQuestion || 0) : 999;
      const bElim = b.status === 'eliminated' ? (b.eliminatedAtQuestion || 0) : 999;
      if (bElim !== aElim) {
        return bElim - aElim;
      }

      return a.id - b.id;
    });

    // Select the top half, but extend if there are ties
    let finalSelectCount2 = Math.min(selectCount, sortedRound1.length);
    if (finalSelectCount2 > 0 && finalSelectCount2 < sortedRound1.length) {
      const boundary = sortedRound1[finalSelectCount2 - 1];
      const boundaryCorrect = boundary.round1CorrectCount || 0;
      const boundaryRescue = boundary.rescueCount || 0;
      const boundaryActive = boundary.status === 'active' || boundary.status === 'rescued' || boundary.status === 'champion' ? 1 : 0;
      const boundaryElimQ = boundary.status === 'eliminated' ? (boundary.eliminatedAtQuestion || 0) : 999;

      while (finalSelectCount2 < sortedRound1.length) {
        const next = sortedRound1[finalSelectCount2];
        const nextCorrect = next.round1CorrectCount || 0;
        const nextRescue = next.rescueCount || 0;
        const nextActive = next.status === 'active' || next.status === 'rescued' || next.status === 'champion' ? 1 : 0;
        const nextElimQ = next.status === 'eliminated' ? (next.eliminatedAtQuestion || 0) : 999;

        if (
          nextCorrect === boundaryCorrect &&
          nextRescue === boundaryRescue &&
          nextActive === boundaryActive &&
          nextElimQ === boundaryElimQ
        ) {
          finalSelectCount2++;
        } else {
          break;
        }
      }
    }

    const selectedIds = sortedRound1.slice(0, finalSelectCount2).map(c => c.id);

    const updatedContestants = state.contestants.map((c) => {
      const isSelected = selectedIds.includes(c.id);
      if (isSelected) {
        return {
          ...c,
          status: 'active' as const,
          eliminatedAtQuestion: null,
          rescuedAtQuestion: null,
          round2CorrectCount: 0,
          isInRound2: true,
        };
      } else {
        return {
          ...c,
          status: 'eliminated' as const,
          isInRound2: false,
        };
      }
    });

    const updatedState: ContestState = {
      ...state,
      currentQuestion: nextQ,
      currentRound: 2,
      round2StartQuestion: nextQ,
      round2MaxQuestion: round2Max,
      contestants: updatedContestants,
      recentlyRescued: [],
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    sounds.playFanfare();
    alert(`Đã bắt đầu Vòng 2 và tự động chọn ${selectedIds.length} thí sinh xuất sắc nhất bước vào Vòng 2 theo đúng quy chế!\n\nSố câu hỏi Vòng 2 từ Câu ${nextQ} đến Câu ${round2Max}.`);
  };

  // Reset contest
  const handleReset = () => {
    saveStateToStorage(null);
    setRescueMode(false);
    setSelectedRescueIds([]);
    setUndoStack([]);
  };

  // Undo last action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setState(previous);
    localStorage.setItem('rungchuongvang_current_session', JSON.stringify(previous));
    sounds.playTock();
  };

  // Save current contest record to history log
  const handleSaveHistory = () => {
    if (!state) return;

    // Build summary header
    const winners = state.contestants
      .filter((c) => c.status === 'champion')
      .map((c) => `${`0${c.id}`.slice(-2)} - ${c.name}`);

    const summary: SavedContestSummary = {
      id: state.id,
      name: state.name,
      organizer: state.organizer,
      totalContestants: state.totalContestants,
      createdAt: state.createdAt,
      winnerCount: winners.length,
      winners: winners,
    };

    // Save full raw contest json
    localStorage.setItem(`rungchuongvang_contest_full_${state.id}`, JSON.stringify(state));

    const updatedSummaries = [summary, ...savedSummaries.filter((s) => s.id !== state.id)];
    setSavedSummaries(updatedSummaries);
    localStorage.setItem('rungchuongvang_history_list', JSON.stringify(updatedSummaries));

    alert('Đã lưu dữ liệu tổng kết cuộc thi vào bộ nhớ duyệt Web của thiết bị thành công!');
  };

  // Resume the current session from setup page
  const handleResumeActiveSession = () => {
    const savedState = localStorage.getItem('rungchuongvang_current_session');
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
      } catch (err) {
        console.error('Không thể khôi phục phiên hoạt động cũ:', err);
      }
    }
  };

  // Recover session from Cloud
  const handleRecoverFromCloud = (recoveredState: ContestState) => {
    saveStateToStorage(recoveredState);
    setUndoStack([]);
  };

  // Load a historical contest
  const handleLoadHistory = (id: string) => {
    const fullJson = localStorage.getItem(`rungchuongvang_contest_full_${id}`);
    if (fullJson) {
      try {
        const parsed = JSON.parse(fullJson);
        saveStateToStorage(parsed);
        alert(`Đã khôi phục thành công: ${parsed.name}`);
      } catch (e) {
        alert('Có lỗi khi đọc tệp lịch sử!');
      }
    }
  };

  // Delete a historical contest
  const handleDeleteHistory = (id: string) => {
    if (window.confirm('Bạn có thật sự muốn XÓA cuộc thi này khỏi lịch sử lưu trữ?')) {
      const updated = savedSummaries.filter((s) => s.id !== id);
      setSavedSummaries(updated);
      localStorage.setItem('rungchuongvang_history_list', JSON.stringify(updated));
      localStorage.removeItem(`rungchuongvang_contest_full_${id}`);
    }
  };

  // Save contestant edited name
  const handleSaveEditContestant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !editingContestant) return;

    pushUndo(state);

    const updatedContestants = state.contestants.map((c) =>
      c.id === editingContestant.id ? { ...c, name: editingContestant.name } : c
    );

    const updatedState = {
      ...state,
      contestants: updatedContestants,
      updatedAt: new Date().toISOString(),
    };

    saveStateToStorage(updatedState);
    setEditingContestant(null);
  };

  // If in Spectator Mode and state is not loaded yet, show loading spinner
  if (isSpectatorMode) {
    if (!state) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-lg">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-emerald-400 uppercase tracking-tight">
              ĐANG KẾT NỐI REALTIME...
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Hệ thống đang đồng bộ hóa trạng thái sân đấu trực tiếp từ Ban Tổ Chức. Vui lòng đợi trong giây lát!
            </p>
          </div>
        </div>
      );
    }

    if (spectatorViewType === 'projector') {
      return (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-950">
          <ProjectorView 
            state={state} 
            isSpectator={true} 
            onClose={() => {
              setSpectatorViewType('dashboard');
            }} 
          />
        </div>
      );
    }

    return (
      <SpectatorDashboard
        state={state}
        onExit={() => {
          setIsSpectatorMode(false);
          setSpectatorRoomId('');
          setState(null);
        }}
        onSwitchToProjector={() => {
          setSpectatorViewType('projector');
        }}
      />
    );
  }

  // If not authenticated and not in temporary spectator setup tab, show login
  if (!isAdminAuthenticated && !isSpectatorSetupMode) {
    return (
      <AdminLogin 
        onLoginSuccess={() => setIsAdminAuthenticated(true)} 
        onSwitchToSpectator={() => setIsSpectatorSetupMode(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Projector View Mode */}
      {state && showProjector && (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-950">
          <ProjectorView state={state} onClose={() => setShowProjector(false)} />
        </div>
      )}

      {/* Name editor modal */}
      {editingContestant && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveEditContestant} 
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase">Cập nhật thông tin thí sinh</h3>
              <button 
                type="button" 
                onClick={() => setEditingContestant(null)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Số báo danh SBD</span>
                <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {`0${editingContestant.id}`.slice(-2)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-widest block" htmlFor="edit-name">
                  Họ và tên thí sinh
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editingContestant.name}
                  onChange={(e) => setEditingContestant({ ...editingContestant, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingContestant(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Modal (Cài đặt cuộc thi đang diễn ra) */}
      {showSettingsModal && state && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <h3 className="font-bold text-slate-900 text-sm uppercase">Cài đặt cuộc thi đang diễn ra</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSettingsModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-name">
                  Tên cuộc thi
                </label>
                <input
                  id="settings-name"
                  type="text"
                  value={state.name}
                  onChange={(e) => {
                    const updated = { ...state, name: e.target.value };
                    setState(updated);
                    localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-organizer">
                  Đơn vị tổ chức
                </label>
                <input
                  id="settings-organizer"
                  type="text"
                  value={state.organizer}
                  onChange={(e) => {
                    const updated = { ...state, organizer: e.target.value };
                    setState(updated);
                    localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-r1-max">
                    Vòng 1 tối đa
                  </label>
                  <input
                    id="settings-r1-max"
                    type="number"
                    min="1"
                    value={state.round1MaxQuestion}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 15);
                      const updated = { ...state, round1MaxQuestion: val };
                      setState(updated);
                      localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">Câu 1 ➔ {state.round1MaxQuestion}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-r2-start">
                    Vòng 2 từ câu
                  </label>
                  <input
                    id="settings-r2-start"
                    type="number"
                    min="1"
                    value={state.round2StartQuestion || 16}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 16);
                      const updated = { ...state, round2StartQuestion: val };
                      setState(updated);
                      localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">Bắt đầu Vòng 2</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-r2-max">
                    Vòng 2 đến câu
                  </label>
                  <input
                    id="settings-r2-max"
                    type="number"
                    min="1"
                    value={state.round2MaxQuestion}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 30);
                      const updated = { ...state, round2MaxQuestion: val };
                      setState(updated);
                      localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">Kết thúc Vòng 2</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block" htmlFor="settings-cols-per-row">
                  Số thí sinh hiển thị trên một hàng
                </label>
                <select
                  id="settings-cols-per-row"
                  value={state.colsPerRow || 10}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const updated = { ...state, colsPerRow: val };
                    setState(updated);
                    localStorage.setItem('rungchuongvang_current_session', JSON.stringify(updated));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 cursor-pointer"
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} thí sinh / hàng
                    </option>
                  ))}
                </select>
              </div>

              {/* Thay đổi tài khoản Admin */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  Thay đổi tài khoản quản trị (Admin)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium" htmlFor="admin-new-username">Tên tài khoản mới</label>
                    <input
                      id="admin-new-username"
                      type="text"
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value.trim())}
                      placeholder="admin"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium" htmlFor="admin-new-password">Mật khẩu mới</label>
                    <input
                      id="admin-new-password"
                      type="password"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangeAdminCredentials}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs rounded-lg transition-all cursor-pointer"
                >
                  Cập nhật tài khoản Admin
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Hoàn tất cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {state === null ? (
        /* Setup Phase screen */
        <SetupModal
          onStart={handleStartContest}
          savedSummaries={savedSummaries}
          onLoadHistory={handleLoadHistory}
          onDeleteHistory={handleDeleteHistory}
          onResume={handleResumeActiveSession}
          onConnectSpectator={(roomId) => {
            setSpectatorRoomId(roomId);
            setIsSpectatorMode(true);
          }}
          isSpectatorOnly={isSpectatorSetupMode}
          onAdminLogout={handleAdminLogout}
          onRecoverFromCloud={handleRecoverFromCloud}
        />
      ) : (
        /* Standard Panel screen */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Main Visual Header */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-amber-400 rounded-xl shadow-md">
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cơ quan kiểm soát thi đấu
                </span>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {state.name}
                </h1>
                <p className="text-xs text-slate-500">Đơn vị: {state.organizer}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Projector Trigger */}
              <button
                id="btn-projector"
                onClick={() => setShowProjector(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 fill-slate-950" />
                <span>MÀN HÌNH KHÁN GIẢ (MÁY CHIẾU)</span>
              </button>

              {/* Settings button */}
              <button
                id="btn-open-settings-modal"
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <span>⚙️ Cài đặt</span>
              </button>

              <button
                id="btn-close-session"
                onClick={() => setShowConfirmBack(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Trở về Trang chủ / Cài đặt</span>
              </button>

              <button
                id="btn-admin-logout"
                onClick={handleAdminLogout}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-rose-200/60"
              >
                <span>🚪 Đăng xuất Admin</span>
              </button>
            </div>
          </div>

          {/* Stats metrics Banner */}
          <StatsBanner state={state} onQuestionClick={handleNextQuestion} />

          {/* Core interactive workspace split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="active-contest-workspace">
            
            {/* Left controller sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Google Sheets & Realtime Broadcast Control Panel */}
              <GoogleSheetsSyncPanel
                state={state}
                onStateUpdate={saveStateToStorage}
                savedQuestions={savedQuestions}
                onSavedQuestionsUpdate={(qLog) => {
                  setSavedQuestions(qLog);
                  localStorage.setItem(`rungchuongvang_saved_q_${state.id}`, JSON.stringify(qLog));
                }}
              />

              <AdminControls
                state={state}
                rescueMode={rescueMode}
                selectedRescueIds={selectedRescueIds}
                onToggleRescueMode={handleToggleRescueMode}
                onApplyRescue={handleApplyRescue}
                onNextQuestion={handleNextQuestion}
                onPrevQuestion={handlePrevQuestion}
                onEndRound1={handleEndRound1}
                onStartRound2={handleStartRound2}
                onReset={handleReset}
                onUndoLastAction={handleUndo}
                hasUndo={undoStack.length > 0}
                onAutoRescuePercent={handleAutoRescuePercent}
                onRescueAll={handleRescueAll}
                onRescueLatest={handleRescueLatest}
                onRescueCustomIds={handleRescueCustomIds}
                onUpdateMaxQuestion={handleUpdateMaxQuestion}
                onEndRound2={handleEndRound2}
              />

              {/* Roster Detailed list for editing names */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Danh Sách Thí Sinh Chi Tiết</h4>
                  <p className="text-[10px] text-slate-400">Click biểu tượng chiếc bút để sửa tên hoặc thông tin chi tiết</p>
                </div>

                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                  {state.contestants.map((c) => {
                    const paddedId = `0${c.id}`.slice(-2);
                    return (
                      <div key={c.id} className="py-2 flex items-center justify-between text-xs group" id={`roster-list-${c.id}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-xxs">
                            {paddedId}
                          </span>
                          <span className={`font-semibold ${
                            c.status === 'eliminated' ? 'text-slate-300 line-through' : 'text-slate-700'
                          }`}>
                            {c.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.status === 'eliminated' && (
                            <span className="text-[9px] text-rose-500 font-mono">Loại Q{c.eliminatedAtQuestion}</span>
                          )}
                          {c.status === 'champion' && (
                            <span className="text-[9px] text-amber-600 font-bold">Quán quân 👑</span>
                          )}
                          {c.status === 'rescued' && (
                            <span className="text-[9px] text-amber-500 font-medium">Được cứu 🟡</span>
                          )}
                          
                          <button
                            type="button"
                            id={`btn-edit-roster-name-${c.id}`}
                            onClick={() => setEditingContestant(c)}
                            className="p-1 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded transition-all opacity-0 group-hover:opacity-100"
                            title="Sửa tên thí sinh"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right main contestant board */}
            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Sân Đấu Thí Sinh Bản Admin</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nhấp vào ô thí sinh bất kỳ để ĐÁNH DẤU LOẠI hoặc KHÔI PHỤC hoặc CỨU TRỢ tùy theo chức năng điều phối.
                </p>
              </div>

              <ContestantGrid
                contestants={state.contestants}
                currentQuestion={state.currentQuestion}
                rescueMode={rescueMode}
                selectedRescueIds={selectedRescueIds}
                onToggleRescueSelect={handleToggleRescueSelect}
                onEliminate={handleEliminate}
                onRestore={handleRestore}
                onCrownChampion={handleCrownChampion}
                currentRound={state.currentRound}
                colsPerRow={state.colsPerRow}
              />
            </div>
          </div>

          {/* Full-width Stats & History / Reports */}
          <ReportsAndLogs
            state={state}
            onSaveHistory={handleSaveHistory}
            onSetContestants={(updated) => {
              if (!state) return;
              pushUndo(state);
              const updatedState = { ...state, contestants: updated };
              saveStateToStorage(updatedState);
            }}
          />

        </div>
      )}

      {/* Custom Confirmation Modal for Back to Home */}
      {showConfirmBack && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-lg">⚠️</span>
                <h3 className="font-black text-slate-900 text-sm uppercase">Xác nhận trở về</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfirmBack(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Bạn muốn trở về Trang chủ / Cài đặt ban đầu? Tiến trình cuộc thi hiện tại sẽ được lưu tự động trên thiết bị này và bạn có thể tiếp tục bất cứ lúc nào.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setShowConfirmBack(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => {
                  setState(null);
                  setShowConfirmBack(false);
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
              >
                XÁC NHẬN TRỞ VỀ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-lg">💡</span>
                <h3 className="font-black text-slate-900 text-sm uppercase">{alertConfig.title || 'Thông báo'}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setAlertConfig(null)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {alertConfig.message}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setAlertConfig(null)}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
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
