import { Plugin } from "obsidian";
import { Prec } from "@codemirror/state";
import { keymap, EditorView } from "@codemirror/view";

// 日本語・単語単位のセグメンター初期化
const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

// 削除処理のコアロジック
const deleteCjkWord = (view: EditorView): boolean => {
    const state = view.state;
    const { head, empty } = state.selection.main;

    // 範囲選択中、またはドキュメント先頭の場合はデフォルト処理に委譲
    if (!empty || head === 0) return false;

    const line = state.doc.lineAt(head);
    const textBefore = line.text.slice(0, head - line.from);

    // 行頭の場合はデフォルト処理に委譲
    if (textBefore.length === 0) return false;

    // カーソル前までの文字列をセグメント分割
    const segments = Array.from(segmenter.segment(textBefore));
    if (segments.length === 0) return false;

    const lastSegment = segments[segments.length - 1];
	if (!lastSegment) return false; // 追加

    // 対象範囲の削除トランザクションを発行
    view.dispatch({
        changes: { from: head - lastSegment.segment.length, to: head }
    });

    return true; // デフォルトの削除処理をブロック
};

// プラグイン本体
export default class CjkWordDeletePlugin extends Plugin {
    async onload() {
        // CodeMirror拡張としてキーマップを最優先(Prec.highest)で登録
        this.registerEditorExtension(
            Prec.highest(
                keymap.of([{ key: "Mod-Backspace", run: deleteCjkWord }])
            )
        );
    }

    onunload() {
        // ObsidianAPIによりEditorExtensionは自動クリーンアップされるため処理不要
    }
}
