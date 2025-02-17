export enum Background {
  GET_RECORD_PATH_FROM_PROC_ARG = "getRecordPathFromProcArg",
  UPDATE_MENU_STATE = "updateMenuState",
  SHOW_OPEN_RECORD_DIALOG = "showOpenRecordDialog",
  OPEN_RECORD = "openRecord",
  SHOW_SAVE_RECORD_DIALOG = "showSaveRecordDialog",
  SAVE_RECORD = "saveRecord",
  SHOW_SELECT_FILE_DIALOG = "showSelectFileDialog",
  SHOW_SELECT_DIRECTORY_DIALOG = "showSelectDirectoryDialog",
  LOAD_APP_SETTING = "loadAppSetting",
  SAVE_APP_SETTING = "saveAppSetting",
  LOAD_RESEARCH_SETTING = "loadResearchSetting",
  SAVE_RESEARCH_SETTING = "saveResearchSetting",
  LOAD_ANALYSIS_SETTING = "loadAnalysisSetting",
  SAVE_ANALYSIS_SETTING = "saveAnalysisSetting",
  LOAD_GAME_SETTING = "loadGameSetting",
  SAVE_GAME_SETTING = "saveGameSetting",
  LOAD_CSA_GAME_SETTING_HISTORY = "loadCSAGameSettingHistory",
  SAVE_CSA_GAME_SETTING_HISTORY = "saveCSAGameSettingHistory",
  LOAD_USI_ENGINE_SETTING = "loadUSIEngineSetting",
  SAVE_USI_ENGINE_SETTING = "saveUSIEngineSetting",
  SHOW_SELECT_USI_ENGINE_DIALOG = "showSelectUSIEngineDialog",
  GET_USI_ENGINE_INFO = "getUSIEngineInfo",
  SEND_USI_SET_OPTION = "sendUSISetOption",
  LAUNCH_USI = "usiLaunch",
  USI_GO = "usiGo",
  USI_GO_PONDER = "usiGoPonder",
  USI_GO_PONDER_HIT = "usiGoPonderHit",
  USI_GO_INFINITE = "usiGoInfinite",
  USI_STOP = "usiStop",
  USI_GAMEOVER = "usiGameover",
  USI_QUIT = "usiQuit",
  CSA_LOGIN = "csaLogin",
  CSA_LOGOUT = "csaLogout",
  CSA_AGREE = "csaAgree",
  CSA_MOVE = "csaMove",
  CSA_RESIGN = "csaResign",
  CSA_WIN = "csaWin",
  CSA_STOP = "csaStop",
  LOG = "log",
}

export enum Renderer {
  SEND_ERROR = "sendError",
  MENU_EVENT = "menuEvent",
  USI_BEST_MOVE = "usiBestMove",
  USI_INFO = "usiInfo",
  USI_PONDER_INFO = "usiPonderInfo",
  CSA_GAME_SUMMARY = "csaGameSummary",
  CSA_REJECT = "csaReject",
  CSA_START = "csaStart",
  CSA_MOVE = "csaMove",
  CSA_GAME_RESULT = "csaGameResult",
  CSA_CLOSE = "csaClose",
}
