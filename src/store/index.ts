import api from "@/ipc/api";
import {
  Color,
  exportCSA,
  ImmutableRecord,
  InitialPositionType,
  Move,
  PositionChange,
  Record,
  SpecialMove,
  specialMoveToDisplayString,
  exportKakinoki,
  RecordMetadataKey,
} from "@/shogi";
import { reactive, UnwrapNestedRefs, watch } from "vue";
import { GameSetting } from "@/settings/game";
import {
  AppSetting,
  AppSettingUpdate,
  ClockSoundTarget,
  defaultAppSetting,
  validateAppSetting,
} from "@/settings/app";
import {
  AudioEventHandler,
  beepShort,
  beepUnlimited,
  playPieceBeat,
} from "@/audio";
import { InfoCommand, USIInfoSender } from "@/store/usi";
import { RecordCustomData, RecordManager } from "./record";
import { defaultPlayerBuilder, GameManager } from "./game";
import { defaultRecordFileName } from "@/helpers/path";
import { ResearchSetting } from "@/settings/research";
import { BussyStore } from "./bussy";
import { USIPlayerMonitor, USIMonitor } from "./usi";
import { AppState } from "./state";
import { MessageStore } from "./message";
import { ErrorStore } from "./error";
import * as uri from "@/uri";
import { Confirmation } from "./confirm";
import {
  AnalysisManager,
  AnalysisResult,
  appendAnalysisComment,
  buildRecordComment,
} from "./analysis";
import { AnalysisSetting } from "@/settings/analysis";
import { USIPlayer } from "@/players/usi";
import { LogLevel } from "@/ipc/log";
import { toString } from "@/helpers/string";

export class Store {
  private _bussy: BussyStore;
  private _message: MessageStore;
  private _error: ErrorStore;
  private recordManager: RecordManager;
  private _appSetting: AppSetting;
  private _appState: AppState;
  private lastAppState?: AppState;
  private _isAppSettingDialogVisible: boolean;
  private _confirmation?: Confirmation;
  private usiMonitor: USIMonitor;
  private gameManager: GameManager;
  private researcher?: USIPlayer;
  private analysisManager?: AnalysisManager;
  private unlimitedBeepHandler?: AudioEventHandler;

  constructor() {
    this._bussy = new BussyStore();
    this._message = new MessageStore();
    this._error = new ErrorStore();
    this.recordManager = new RecordManager();
    this._appSetting = defaultAppSetting();
    this._appState = AppState.NORMAL;
    this._isAppSettingDialogVisible = false;
    this.usiMonitor = new USIMonitor();
    this.gameManager = new GameManager(
      this.recordManager,
      defaultPlayerBuilder,
      this
    );
  }

  get isBussy(): boolean {
    return this._bussy.isBussy;
  }

  retainBussyState(): void {
    return this._bussy.retain();
  }

  releaseBussyState(): void {
    return this._bussy.release();
  }

  get message(): string {
    return this._message.message;
  }

  get hasMessage(): boolean {
    return this._message.hasMessage;
  }

  enqueueMessage(message: string): void {
    this._message.enqueue(message);
  }

  dequeueMessage(): void {
    this._message.dequeue();
  }

  get errors(): Error[] {
    return this._error.errors;
  }

  get hasError(): boolean {
    return this._error.hasError;
  }

  pushError(e: unknown): void {
    api.log(LogLevel.ERROR, toString(e));
    this._error.push(e);
  }

  clearErrors(): void {
    this._error.clear();
  }

  get record(): ImmutableRecord {
    return this.recordManager.record;
  }

  get recordFilePath(): string | undefined {
    return this.recordManager.recordFilePath;
  }

  updateStandardRecordMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this.recordManager.updateStandardMetadata(update);
  }

  get appSetting(): AppSetting {
    return this._appSetting;
  }

  async updateAppSetting(update: AppSettingUpdate): Promise<void> {
    const newAppSetting = {
      ...this.appSetting,
      ...update,
    };
    const error = validateAppSetting(newAppSetting);
    if (error) {
      throw error;
    }
    await api.saveAppSetting(newAppSetting);
    this._appSetting = newAppSetting;
  }

  flipBoard(): void {
    this._appSetting.boardFlipping = !this.appSetting.boardFlipping;
    api.saveAppSetting(this.appSetting);
  }

  get appState(): AppState {
    return this._appState;
  }

  get confirmation(): string | undefined {
    return this._confirmation?.message;
  }

  showConfirmation(confirmation: Confirmation): void {
    if (this.appState == AppState.TEMPORARY) {
      api.log(
        LogLevel.ERROR,
        "確認ダイアログを多重に表示しようとしました。" +
          ` lastAppState=${this.lastAppState}` +
          (this._confirmation
            ? ` currentMessage=${this._confirmation.message}`
            : "") +
          ` newMessage=${confirmation.message}`
      );
      return;
    }
    this._confirmation = confirmation;
    this.lastAppState = this.appState;
    this._appState = AppState.TEMPORARY;
  }

  confirmationOk(): void {
    const onOk = this._confirmation?.onOk;
    this._confirmation = undefined;
    if (this.lastAppState) {
      this._appState = this.lastAppState;
      this.lastAppState = undefined;
    }
    if (onOk) {
      onOk();
    }
  }

  confirmationCancel(): void {
    const onCancel = this._confirmation?.onCancel;
    this._confirmation = undefined;
    if (this.lastAppState) {
      this._appState = this.lastAppState;
      this.lastAppState = undefined;
    }
    if (onCancel) {
      onCancel();
    }
  }

  showPasteDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.PASTE_DIALOG;
    }
  }

  showGameDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.GAME_DIALOG;
    }
  }

  showResearchDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.RESEARCH_DIALOG;
    }
  }

  showAnalysisDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.ANALYSIS_DIALOG;
    }
  }

  showUsiEngineManagementDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.USI_ENGINE_SETTING_DIALOG;
    }
  }

  closeModalDialog(): void {
    if (
      this.appState === AppState.PASTE_DIALOG ||
      this.appState === AppState.GAME_DIALOG ||
      this.appState === AppState.RESEARCH_DIALOG ||
      this.appState === AppState.ANALYSIS_DIALOG ||
      this.appState === AppState.USI_ENGINE_SETTING_DIALOG
    ) {
      this._appState = AppState.NORMAL;
    }
  }

  get isAppSettingDialogVisible(): boolean {
    return this._isAppSettingDialogVisible;
  }

  showAppSettingDialog(): void {
    this._isAppSettingDialogVisible = true;
  }

  closeAppSettingDialog(): void {
    this._isAppSettingDialogVisible = false;
  }

  get usiBlackPlayerMonitor(): USIPlayerMonitor | undefined {
    return this.usiMonitor.blackPlayer;
  }

  get usiWhitePlayerMonitor(): USIPlayerMonitor | undefined {
    return this.usiMonitor.whitePlayer;
  }

  get usiResearcherMonitor(): USIPlayerMonitor | undefined {
    return this.usiMonitor.researcher;
  }

  updateUSIInfo(
    sessionID: number,
    usi: string,
    sender: USIInfoSender,
    name: string,
    info: InfoCommand
  ): void {
    if (this.recordManager.record.usi !== usi) {
      return;
    }
    this.usiMonitor.update(
      sessionID,
      this.recordManager.record.position,
      sender,
      name,
      info
    );
    const data = new RecordCustomData(
      this.recordManager.record.current.customData
    );
    data.updateUSIInfo(this.recordManager.record.position.color, sender, info);
    this.recordManager.record.current.customData = data.stringify();
    if (this.analysisManager) {
      this.analysisManager.updateUSIInfo(
        this.recordManager.record.position,
        info
      );
    }
  }

  updateUSIPonderInfo(
    sessionID: number,
    usi: string,
    sender: USIInfoSender,
    name: string,
    info: InfoCommand
  ): void {
    const record = Record.newByUSI(usi);
    if (record instanceof Error) {
      api.log(LogLevel.ERROR, `invalid USI: ${usi} (updateUSIPonderInfo)`);
      return;
    }
    const ponderMove = record.current.move;
    if (!(ponderMove instanceof Move)) {
      return;
    }
    this.usiMonitor.update(
      sessionID,
      record.position,
      sender,
      name,
      info,
      ponderMove
    );
  }

  get gameSetting(): GameSetting {
    return this.gameManager.setting;
  }

  get blackTimeMs(): number {
    return this.gameManager.blackTimeMs;
  }

  get blackByoyomi(): number {
    return this.gameManager.blackByoyomi;
  }

  get whiteTimeMs(): number {
    return this.gameManager.whiteTimeMs;
  }

  get whiteByoyomi(): number {
    return this.gameManager.whiteByoyomi;
  }

  startGame(setting: GameSetting): void {
    this.startGameAsync(setting).catch((e) => {
      this.pushError("対局の初期化中にエラーが出ました: " + e);
    });
  }

  private async startGameAsync(setting: GameSetting): Promise<void> {
    if (this.appState !== AppState.GAME_DIALOG) {
      return;
    }
    this.retainBussyState();
    try {
      await api.saveGameSetting(setting);
      this.initializeDisplaySettingForGame(setting);
      await this.gameManager.startGame(setting);
      this._appState = AppState.GAME;
    } finally {
      this.releaseBussyState();
    }
  }

  private initializeDisplaySettingForGame(setting: GameSetting): void {
    if (setting.humanIsFront) {
      let flip = this.appSetting.boardFlipping;
      if (
        setting.black.uri === uri.ES_HUMAN &&
        setting.white.uri !== uri.ES_HUMAN
      ) {
        flip = false;
      } else if (
        setting.black.uri !== uri.ES_HUMAN &&
        setting.white.uri === uri.ES_HUMAN
      ) {
        flip = true;
      }
      if (flip !== this.appSetting.boardFlipping) {
        this.flipBoard();
      }
    }
  }

  stopGame(): void {
    if (this.appState === AppState.GAME) {
      this.gameManager.endGame(SpecialMove.INTERRUPT);
    }
  }

  onPieceBeat(): void {
    playPieceBeat(this.appSetting.pieceVolume);
  }

  onEndGame(specialMove?: SpecialMove): void {
    if (this.appState !== AppState.GAME) {
      return;
    }
    if (specialMove) {
      this.enqueueMessage(
        `対局終了（${specialMoveToDisplayString(specialMove)})`
      );
    }
    this._appState = AppState.NORMAL;
  }

  onBeepShort(): void {
    if (
      this.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    if (this.unlimitedBeepHandler) {
      return;
    }
    beepShort({
      frequency: this.appSetting.clockPitch,
      volume: this.appSetting.clockVolume,
    });
  }

  onBeepUnlimited(): void {
    if (
      this.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    if (this.unlimitedBeepHandler) {
      return;
    }
    this.unlimitedBeepHandler = beepUnlimited({
      frequency: this.appSetting.clockPitch,
      volume: this.appSetting.clockVolume,
    });
  }

  onStopBeep(): void {
    if (this.unlimitedBeepHandler) {
      this.unlimitedBeepHandler.stop();
      this.unlimitedBeepHandler = undefined;
    }
  }

  doMove(move: Move): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    if (!this.recordManager.appendMove({ move })) {
      return;
    }
    playPieceBeat(this.appSetting.pieceVolume);
  }

  onNext(number: number): ImmutableRecord | null {
    if (this.appState === AppState.ANALYSIS) {
      this.recordManager.changeMoveNumber(number);
      return this.recordManager.record.current.number === number
        ? this.recordManager.record
        : null;
    }
    return null;
  }

  onResult(result: AnalysisResult): void {
    if (this.appState === AppState.ANALYSIS && this.analysisManager) {
      const comment = buildRecordComment(result, this.appSetting);
      if (comment) {
        this.recordManager.record.current.comment = appendAnalysisComment(
          this.recordManager.record.current.comment,
          comment,
          this.analysisManager.setting.commentBehavior
        );
      }
    }
  }

  onFinish(): void {
    if (this.appState === AppState.ANALYSIS) {
      this._message.enqueue("棋譜解析が終了しました。");
      this._appState = AppState.NORMAL;
    }
  }

  onError(e: unknown): void {
    this.pushError(e);
  }

  startResearch(researchSetting: ResearchSetting): void {
    this.startResearchAsync(researchSetting)
      .then(() => {
        this.onUpdatePosition();
      })
      .catch((e) => {
        this.pushError("検討の初期化中にエラーが出ました: " + e);
      });
  }

  private async startResearchAsync(
    researchSetting: ResearchSetting
  ): Promise<void> {
    if (this.appState !== AppState.RESEARCH_DIALOG) {
      return;
    }
    this.retainBussyState();
    try {
      await api.saveResearchSetting(researchSetting);
      if (!researchSetting.usi) {
        throw new Error("エンジンが設定されていません。");
      }
      const researcher = new USIPlayer(researchSetting.usi);
      await researcher.launch();
      this.researcher = researcher;
      this._appState = AppState.RESEARCH;
    } finally {
      this.releaseBussyState();
    }
  }

  stopResearch(): void {
    if (this.appState !== AppState.RESEARCH) {
      return;
    }
    if (this.researcher) {
      this.researcher.close();
      this.researcher = undefined;
    }
    this._appState = AppState.NORMAL;
  }

  startAnalysis(analysisSetting: AnalysisSetting): void {
    this.startAnalysisAsync(analysisSetting).catch((e) => {
      this.pushError("検討の初期化中にエラーが出ました: " + e);
    });
  }

  private async startAnalysisAsync(analysisSetting: AnalysisSetting) {
    if (this.appState !== AppState.ANALYSIS_DIALOG) {
      return;
    }
    this.retainBussyState();
    try {
      await api.saveAnalysisSetting(analysisSetting);
      const analysisManager = new AnalysisManager(analysisSetting, this);
      await analysisManager.start();
      this.analysisManager = analysisManager;
      this._appState = AppState.ANALYSIS;
    } finally {
      this.releaseBussyState();
    }
  }

  stopAnalysis(): void {
    if (this.appState !== AppState.ANALYSIS) {
      return;
    }
    if (this.analysisManager) {
      this.analysisManager.close();
      this.analysisManager = undefined;
    }
    this._appState = AppState.NORMAL;
  }

  onUpdatePosition(): void {
    if (this.researcher) {
      this.researcher.startResearch(this.recordManager.record);
    }
  }

  resetRecord(): void {
    if (this.appState != AppState.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: "現在の棋譜は削除されます。よろしいですか？",
      onOk: () => {
        this.recordManager.reset();
      },
    });
  }

  updateRecordComment(comment: string): void {
    this.recordManager.updateComment(comment);
  }

  insertSpecialMove(specialMove: SpecialMove): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    this.recordManager.appendMove({ move: specialMove });
  }

  startPositionEditing(): void {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: "現在の棋譜は削除されます。よろしいですか？",
      onOk: () => {
        this._appState = AppState.POSITION_EDITING;
        this.recordManager.resetByCurrentPosition();
      },
    });
  }

  endPositionEditing(): void {
    if (this.appState === AppState.POSITION_EDITING) {
      this._appState = AppState.NORMAL;
    }
  }

  initializePosition(initialPositionType: InitialPositionType): void {
    if (this.appState != AppState.POSITION_EDITING) {
      return;
    }
    this.showConfirmation({
      message: "現在の局面は破棄されます。よろしいですか？",
      onOk: () => {
        this.recordManager.reset(initialPositionType);
      },
    });
  }

  changeTurn(): void {
    if (this.appState == AppState.POSITION_EDITING) {
      this.recordManager.swapNextTurn();
    }
  }

  editPosition(change: PositionChange): void {
    if (this.appState === AppState.POSITION_EDITING) {
      this.recordManager.changePosition(change);
    }
  }

  changeMoveNumber(number: number): void {
    if (
      this.appState === AppState.NORMAL ||
      this.appState === AppState.RESEARCH
    ) {
      this.recordManager.changeMoveNumber(number);
    }
  }

  changeBranch(index: number): void {
    if (
      this.appState === AppState.NORMAL ||
      this.appState === AppState.RESEARCH
    ) {
      this.recordManager.changeBranch(index);
    }
  }

  removeRecordAfter(): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    if (this.recordManager.record.current.isLastMove) {
      this.recordManager.removeAfter();
      return;
    }
    this.showConfirmation({
      message: `${this.recordManager.record.current.number}手目以降を削除します。よろしいですか？`,
      onOk: () => {
        this.recordManager.removeAfter();
      },
    });
  }

  copyRecordKIF(): void {
    const str = exportKakinoki(this.recordManager.record, {
      returnCode: this.appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordCSA(): void {
    const str = exportCSA(this.recordManager.record, {
      returnCode: this.appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIBefore(): void {
    const str = this.recordManager.record.usi;
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIAll(): void {
    const str = this.recordManager.record.usiAll;
    navigator.clipboard.writeText(str);
  }

  copyBoardSFEN(): void {
    const str = this.recordManager.record.sfen;
    navigator.clipboard.writeText(str);
  }

  pasteRecord(data: string): void {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    const error = this.recordManager.importRecord(data);
    if (error) {
      this.pushError(error);
      return;
    }
  }

  openRecord(path?: string): void {
    this.openRecordAsync(path).catch((e) => {
      this.pushError("棋譜の読み込み中にエラーが出ました: " + e);
    });
  }

  private async openRecordAsync(path?: string): Promise<void> {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    this.retainBussyState();
    try {
      if (!path) {
        path = await api.showOpenRecordDialog();
        if (!path) {
          return;
        }
      }
      const data = await api.openRecord(path);
      const error = this.recordManager.importRecordFromBuffer(
        data as Buffer,
        path
      );
      if (error) {
        throw error;
      }
    } finally {
      this.releaseBussyState();
    }
  }

  saveRecord(options?: { overwrite: boolean }): void {
    this.saveRecordAsync(options).catch((e) => {
      this.pushError("棋譜の保存中にエラーが出ました: " + e);
    });
  }

  private async saveRecordAsync(options?: {
    overwrite: boolean;
  }): Promise<void> {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    this.retainBussyState();
    try {
      let path = this.recordManager.recordFilePath;
      if (!options?.overwrite || !path) {
        const defaultPath = defaultRecordFileName(
          this.recordManager.record.metadata
        );
        path = await api.showSaveRecordDialog(defaultPath);
        if (!path) {
          return;
        }
      }
      const dataOrError = this.recordManager.exportRecordAsBuffer(path, {
        returnCode: this.appSetting.returnCode,
      });
      if (dataOrError instanceof Error) {
        throw dataOrError;
      }
      await api.saveRecord(path, dataOrError);
    } finally {
      this.releaseBussyState();
    }
  }

  get isMovableByUser() {
    switch (this.appState) {
      case AppState.NORMAL:
      case AppState.RESEARCH:
        return true;
      case AppState.GAME:
        return (
          (this.recordManager.record.position.color === Color.BLACK
            ? this.gameSetting.black.uri
            : this.gameSetting.white.uri) === uri.ES_HUMAN
        );
    }
    return false;
  }
}

const store = reactive<Store>(new Store());

export function useStore(): UnwrapNestedRefs<Store> {
  return store;
}

watch([useStore().record], () => {
  useStore().onUpdatePosition();
});
