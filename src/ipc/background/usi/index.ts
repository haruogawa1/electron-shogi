import { USIEngineSetting } from "@/settings/usi";
import {
  EngineProcess,
  GameResult as USIGameResult,
  TimeState,
} from "./engine";
import * as uri from "@/uri";
import { onUSIBestMove, onUSIInfo, onUSIPonderInfo } from "@/ipc/background";
import { Color, getNextColorFromUSI } from "@/shogi";
import { USIInfoSender } from "@/ipc/usi";
import { TimeLimitSetting } from "@/settings/game";
import { GameResult } from "@/players/player";

const TimeoutSeconds = 10;

export async function getUSIEngineInfo(
  path: string
): Promise<USIEngineSetting> {
  const sessionID = issueSessionID();
  return new Promise<USIEngineSetting>((resolve, reject) => {
    const process = new EngineProcess(path, sessionID, {
      setupOnly: true,
      timeout: TimeoutSeconds * 1e3,
    });
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    process.on("usiok", () => {
      resolve({
        uri: uri.issueEngineURI(),
        name: process.name,
        defaultName: process.name,
        author: process.author,
        path,
        options: process.engineOptions,
      });
      process.quit();
    });
    process.launch();
  });
}

export function sendSetOptionCommand(
  path: string,
  name: string
): Promise<void> {
  const sessionID = issueSessionID();
  return new Promise((resolve, reject) => {
    const process = new EngineProcess(path, sessionID, {
      setupOnly: true,
      timeout: TimeoutSeconds * 1e3,
    });
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    process.on("usiok", () => {
      process.setOption(name);
      resolve();
      process.quit();
    });
    process.launch();
  });
}

enum SessionType {
  GAME,
  RESEARCH,
}

type Session = {
  name: string;
  process: EngineProcess;
  setting: USIEngineSetting;
  sessionType: SessionType;
};

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const sessions = new Map<number, Session>();

function getSession(sessionID: number): Session {
  const session = sessions.get(sessionID);
  if (!session) {
    throw new Error(
      "エンジンのセッションが見つかりません: SessionID=" + sessionID
    );
  }
  return session;
}

export function setupPlayer(setting: USIEngineSetting): Promise<number> {
  const sessionID = issueSessionID();
  const process = new EngineProcess(setting.path, sessionID, {
    timeout: TimeoutSeconds * 1e3,
    engineOptions: Object.values(setting.options),
  });
  sessions.set(sessionID, {
    name: setting.name,
    process,
    setting,
    sessionType: SessionType.GAME,
  });
  return new Promise<number>((resolve, reject) => {
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    process.on("bestmove", (usi, sfen, ponder) => {
      onUSIBestMove(sessionID, usi, sfen, ponder);
    });
    process.on("ready", () => {
      resolve(sessionID);
    });
    process.launch();
  });
}

function buildTimeState(
  timeLimit: TimeLimitSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): TimeState {
  // USI では btime + binc (または wtime + winc) が今回利用可能な時間を表すとしている。
  // Electron Shogi では既に加算した後の値を保持しているため、ここで減算する。
  return {
    btime: blackTimeMs - timeLimit.increment * 1e3,
    wtime: whiteTimeMs - timeLimit.increment * 1e3,
    byoyomi: timeLimit.byoyomi * 1e3,
    binc: timeLimit.increment * 1e3,
    winc: timeLimit.increment * 1e3,
  };
}

export function go(
  sessionID: number,
  usi: string,
  timeLimit: TimeLimitSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): void {
  const session = getSession(sessionID);
  session.process.go(usi, buildTimeState(timeLimit, blackTimeMs, whiteTimeMs));
  session.process.on("info", (usi, info) => {
    const sender =
      getNextColorFromUSI(usi) === Color.BLACK
        ? USIInfoSender.BLACK_PLAYER
        : USIInfoSender.WHITE_PLAYER;
    onUSIInfo(sessionID, usi, sender, session.name, info);
  });
}

export function goPonder(
  sessionID: number,
  usi: string,
  timeLimit: TimeLimitSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): void {
  const session = getSession(sessionID);
  session.process.goPonder(
    usi,
    buildTimeState(timeLimit, blackTimeMs, whiteTimeMs)
  );
  session.process.on("ponderInfo", (usi, info) => {
    const sender =
      getNextColorFromUSI(usi) === Color.BLACK
        ? USIInfoSender.BLACK_PLAYER
        : USIInfoSender.WHITE_PLAYER;
    onUSIPonderInfo(sessionID, usi, sender, session.name, info);
  });
}

export function goInfinite(sessionID: number, usi: string): void {
  const session = getSession(sessionID);
  session.process.go(usi);
  session.process.on("info", (usi, info) => {
    onUSIInfo(sessionID, usi, USIInfoSender.RESEARCHER, session.name, info);
  });
}

export function ponderHit(sessionID: number): void {
  const session = getSession(sessionID);
  session.process.ponderHit();
}

export function stop(sessionID: number): void {
  const session = getSession(sessionID);
  session.process.stop();
}

export function gameover(sessionID: number, result: GameResult): void {
  const session = getSession(sessionID);
  switch (result) {
    case GameResult.WIN:
      session.process.gameover(USIGameResult.WIN);
      break;
    case GameResult.LOSE:
      session.process.gameover(USIGameResult.LOSE);
      break;
    case GameResult.DRAW:
      session.process.gameover(USIGameResult.DRAW);
      break;
  }
}

export function quit(sessionID: number): void {
  const session = getSession(sessionID);
  session.process.quit();
  sessions.delete(sessionID);
}

export function quitAll(): void {
  sessions.forEach((session) => {
    session.process.quit();
  });
  sessions.clear();
}
