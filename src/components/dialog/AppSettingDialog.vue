<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">アプリ設定</div>
      <div class="dialog-form-area settings">
        <div class="section">
          <div class="section-title">外観</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">テーマ</div>
            <select ref="thema" :value="appSetting.thema">
              <option
                v-for="themaOption of themaOptions"
                :key="themaOption.value"
                :value="themaOption.value"
              >
                {{ themaOption.name }}
              </option>
            </select>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">駒画像</div>
            <select ref="pieceImage" :value="appSetting.pieceImage">
              <option
                v-for="pieceImageType of pieceImageTypes"
                :key="pieceImageType.value"
                :value="pieceImageType.value"
              >
                {{ pieceImageType.name }}
              </option>
            </select>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">盤画像</div>
            <select ref="boardImage" :value="appSetting.boardImage">
              <option
                v-for="boardImageType of boardImageTypes"
                :key="boardImageType.value"
                :value="boardImageType.value"
              >
                {{ boardImageType.name }}
              </option>
            </select>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">段・筋を表示</div>
            <input
              ref="displayBoardLabels"
              class="toggle"
              :checked="appSetting.boardLabelType != BoardLabelType.NONE"
              type="checkbox"
            />
          </div>
        </div>
        <hr />
        <div class="section">
          <div class="section-title">音</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">駒音の大きさ</div>
            <input
              ref="pieceVolume"
              :value="appSetting.pieceVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">時計音の大きさ</div>
            <input
              ref="clockVolume"
              :value="appSetting.clockVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">時計音の高さ</div>
            <input
              ref="clockPitch"
              :value="appSetting.clockPitch"
              type="number"
              max="880"
              min="220"
            />
            <div class="dialog-form-item-unit">Hz (220 ~ 880)</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">時計音の対象</div>
            <select ref="clockSoundTarget" :value="appSetting.clockSoundTarget">
              <option value="all">全ての手番</option>
              <option value="onlyUser">人の手番のみ</option>
            </select>
          </div>
        </div>
        <hr />
        <div class="section">
          <div class="section-title">ファイル</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">改行文字</div>
            <select ref="returnCode" :value="appSetting.returnCode">
              <option value="crlf">CR + LF (Windows)</option>
              <option value="lf">LF (UNIX/Mac)</option>
              <option value="cr">CR (90年代Mac)</option>
            </select>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">棋譜の自動保存先</div>
            <input
              ref="autoSaveDirectory"
              class="directory"
              :value="appSetting.autoSaveDirectory"
              type="text"
            />
            <button class="dialog-button" @click="selectAutoSaveDirectory">
              選択
            </button>
          </div>
        </div>
        <hr />
        <div class="section">
          <div class="section-title">評価値・期待勝率</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">勝率換算係数</div>
            <input
              ref="coefficientInSigmoid"
              :value="appSetting.coefficientInSigmoid"
              type="number"
              max="10000"
              min="1"
            />
            <div class="dialog-form-item-unit">(推奨: 600 から 1500 まで)</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">緩手の閾値</div>
            <input
              ref="badMoveLevelThreshold1"
              :value="appSetting.badMoveLevelThreshold1"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">疑問手の閾値</div>
            <input
              ref="badMoveLevelThreshold2"
              :value="appSetting.badMoveLevelThreshold2"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold3"
              :value="appSetting.badMoveLevelThreshold3"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">大悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold4"
              :value="appSetting.badMoveLevelThreshold4"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
        </div>
        <hr />
        <div class="section">
          <div class="section-title">開発者向け</div>
          <div class="dialog-form-area dialog-form-warning">
            <div v-if="!isNative" class="dialog-form-note">
              ※ブラウザ版でログは出力されません。
            </div>
            <div class="dialog-form-note">
              ※ログの有効化にはアプリの再起動が必要です。
            </div>
            <div class="dialog-form-note">
              ※ログの出力先は「デバッグ」-「ログファイルの場所を開く」で開きます。
            </div>
            <div class="dialog-form-note">
              ※現在、古いログファイルの自動削除機能はありません。
            </div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">アプリログを出力</div>
            <input
              ref="enableAppLog"
              class="toggle"
              :checked="appSetting.enableAppLog"
              type="checkbox"
            />
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">USI通信ログを出力</div>
            <input
              ref="enableUSILog"
              class="toggle"
              :checked="appSetting.enableUSILog"
              type="checkbox"
            />
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">CSA通信ログを出力</div>
            <input
              ref="enableCSALog"
              class="toggle"
              :checked="appSetting.enableCSALog"
              type="checkbox"
            />
          </div>
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="saveAndClose()">
          保存して閉じる
        </button>
        <button class="dialog-button" @click="cancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import {
  PieceImageType,
  BoardImageType,
  BoardLabelType,
} from "@/components/primitive/BoardLayout";
import { AppSettingUpdate, Thema } from "@/settings/app";
import { useStore } from "@/store";
import { ref, defineComponent, onMounted, Ref, computed } from "vue";
import { readInputAsNumber } from "@/helpers/form";
import { showModalDialog } from "@/helpers/dialog";
import api, { isNative } from "@/ipc/api";

const returnCodeToName: { [name: string]: string } = {
  "\r\n": "crlf",
  "\n": "lf",
  "\r": "cr",
};

const nameToReturnCode: { [name: string]: string } = {
  crlf: "\r\n",
  lf: "\n",
  cr: "\r",
};

export default defineComponent({
  name: "AppSettingDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const thema: Ref = ref(null);
    const pieceImage: Ref = ref(null);
    const boardImage: Ref = ref(null);
    const displayBoardLabels: Ref = ref(null);
    const pieceVolume: Ref = ref(null);
    const clockVolume: Ref = ref(null);
    const clockPitch: Ref = ref(null);
    const clockSoundTarget: Ref = ref(null);
    const returnCode: Ref = ref(null);
    const autoSaveDirectory: Ref = ref(null);
    const coefficientInSigmoid: Ref = ref(null);
    const badMoveLevelThreshold1: Ref = ref(null);
    const badMoveLevelThreshold2: Ref = ref(null);
    const badMoveLevelThreshold3: Ref = ref(null);
    const badMoveLevelThreshold4: Ref = ref(null);
    const enableAppLog: Ref = ref(null);
    const enableUSILog: Ref = ref(null);
    const enableCSALog: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const saveAndClose = async () => {
      const update: AppSettingUpdate = {
        thema: thema.value.value,
        pieceImage: pieceImage.value.value,
        boardImage: boardImage.value.value,
        boardLabelType: displayBoardLabels.value.checked
          ? BoardLabelType.STANDARD
          : BoardLabelType.NONE,
        pieceVolume: readInputAsNumber(pieceVolume.value),
        clockVolume: readInputAsNumber(clockVolume.value),
        clockPitch: readInputAsNumber(clockPitch.value),
        clockSoundTarget: clockSoundTarget.value.value,
        returnCode: nameToReturnCode[returnCode.value.value],
        autoSaveDirectory: autoSaveDirectory.value.value,
        coefficientInSigmoid: readInputAsNumber(coefficientInSigmoid.value),
        badMoveLevelThreshold1: readInputAsNumber(badMoveLevelThreshold1.value),
        badMoveLevelThreshold2: readInputAsNumber(badMoveLevelThreshold2.value),
        badMoveLevelThreshold3: readInputAsNumber(badMoveLevelThreshold3.value),
        badMoveLevelThreshold4: readInputAsNumber(badMoveLevelThreshold4.value),
        enableAppLog: enableAppLog.value.checked,
        enableUSILog: enableUSILog.value.checked,
        enableCSALog: enableCSALog.value.checked,
      };
      store.retainBussyState();
      try {
        await store.updateAppSetting(update);
        store.closeAppSettingDialog();
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const selectAutoSaveDirectory = async () => {
      store.retainBussyState();
      try {
        const path = await api.showSelectDirectoryDialog(
          autoSaveDirectory.value.value
        );
        if (path) {
          autoSaveDirectory.value.value = path;
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const cancel = () => {
      store.closeAppSettingDialog();
    };

    const appSetting = computed(() => {
      return {
        ...store.appSetting,
        returnCode: returnCodeToName[store.appSetting.returnCode],
      };
    });

    const themaOptions = [
      {
        name: "標準（緑）",
        value: Thema.STANDARD,
      },
      {
        name: "桜",
        value: Thema.CHERRY_BLOSSOM,
      },
      {
        name: "ダーク",
        value: Thema.DARK,
      },
    ];

    const pieceImageTypes = [
      {
        name: "一文字駒",
        value: PieceImageType.HITOMOJI,
      },
      {
        name: "一文字駒（ゴシック体）",
        value: PieceImageType.HITOMOJI_GOTHIC,
      },
      {
        name: "一文字駒（ダーク）",
        value: PieceImageType.HITOMOJI_DARK,
      },
      {
        name: "一文字駒（ゴシック体・ダーク）",
        value: PieceImageType.HITOMOJI_GOTHIC_DARK,
      },
    ];

    const boardImageTypes = [
      {
        name: "木目（明るい）",
        value: BoardImageType.LIGHT,
      },
      {
        name: "木目（暖かい）",
        value: BoardImageType.WARM,
      },
      {
        name: "レジン",
        value: BoardImageType.RESIN,
      },
      {
        name: "レジン2",
        value: BoardImageType.RESIN2,
      },
      {
        name: "レジン3",
        value: BoardImageType.RESIN3,
      },
      {
        name: "ダーク",
        value: BoardImageType.DARK,
      },
      {
        name: "緑",
        value: BoardImageType.GREEN,
      },
      {
        name: "桜",
        value: BoardImageType.CHERRY_BLOSSOM,
      },
    ];

    return {
      BoardLabelType,
      dialog,
      thema,
      pieceImage,
      boardImage,
      displayBoardLabels,
      pieceVolume,
      clockVolume,
      clockPitch,
      clockSoundTarget,
      returnCode,
      autoSaveDirectory,
      coefficientInSigmoid,
      badMoveLevelThreshold1,
      badMoveLevelThreshold2,
      badMoveLevelThreshold3,
      badMoveLevelThreshold4,
      enableAppLog,
      enableUSILog,
      enableCSALog,
      appSetting,
      themaOptions,
      pieceImageTypes,
      boardImageTypes,
      isNative: isNative(),
      selectAutoSaveDirectory,
      saveAndClose,
      cancel,
    };
  },
});
</script>

<style scoped>
.settings {
  width: 540px;
  height: 540px;
  padding: 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.section {
  margin: 20px 0px 20px 0px;
}
.section-title {
  font-size: 1.1em;
}
input.toggle {
  height: 1em;
  width: 1em;
  margin-right: 10px;
}
input.directory {
  width: 250px;
}
</style>
