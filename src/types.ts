/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContestantStatus = 'active' | 'eliminated' | 'rescued' | 'champion';

export interface Contestant {
  id: number; // 1-indexed
  name: string;
  status: ContestantStatus;
  eliminatedAtQuestion: number | null; // Question number where eliminated (e.g. 5)
  correctAnswersCount: number; // Count of correct answers
  rescuedAtQuestion: number | null; // Question number when rescued
  round1CorrectCount?: number; // Số câu đúng Vòng 1
  round2CorrectCount?: number; // Số câu đúng Vòng 2
  rescueCount?: number; // Số lần cứu trợ
  isInRound2?: boolean; // Có tham gia Vòng 2 không
}

export interface ContestState {
  id: string;
  name: string;
  organizer: string;
  totalContestants: number;
  currentQuestion: number;
  currentRound: 1 | 2;
  round1MaxQuestion: number;
  round2MaxQuestion: number;
  round2StartQuestion?: number;
  isCompleted: boolean;
  contestants: Contestant[];
  recentlyRescued?: Contestant[];
  createdAt: string;
  updatedAt: string;
  colsPerRow?: number; // Tùy chỉnh số lượng cột mỗi hàng
}

export interface SavedContestSummary {
  id: string;
  name: string;
  organizer: string;
  totalContestants: number;
  createdAt: string;
  winnerCount: number;
  winners: string[];
}
