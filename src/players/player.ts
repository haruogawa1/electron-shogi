import { TimeLimitSetting } from "@/settings/game";
import { ImmutableRecord, Move } from "@/shogi";

export type SearchInfo = {
  usi: string; // 局面
  score?: number; // 先手から見た評価値
  mate?: number; // 先手勝ちの場合に正の値、後手勝ちの場合に負の値
  pv?: Move[];
};

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  DRAW = "draw",
}

export interface SearchHandler {
  onMove: (move: Move, info?: SearchInfo) => void;
  onResign: () => void;
  onWin: () => void;
  onError: (e: unknown) => void;
}

export interface PonderHandler {
  onSearchInfo: (info: SearchInfo) => void;
}

export interface Player {
  isEngine(): boolean;
  startSearch(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number,
    handler: SearchHandler
  ): Promise<void>;
  startPonder(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  stop(): Promise<void>;
  gameover(result: GameResult): Promise<void>;
  close(): Promise<void>;
}
