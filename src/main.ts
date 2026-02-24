import { Plugin } from "obsidian";
import { Prec, Text } from "@codemirror/state";
import { keymap, EditorView } from "@codemirror/view";

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

// 前の単語境界を算出
const getPrevBoundary = (doc: Text, head: number): number => {
    const line = doc.lineAt(head);
    if (head === line.from) return Math.max(0, head - 1); // 行頭の場合は前の行へ
    const textBefore = line.text.slice(0, head - line.from);
    const segments = Array.from(segmenter.segment(textBefore));
    const last = segments[segments.length - 1];
    return last ? head - last.segment.length : head;
};

// 次の単語境界を算出
const getNextBoundary = (doc: Text, head: number): number => {
    const line = doc.lineAt(head);
    if (head === line.to) return Math.min(doc.length, head + 1); // 行末の場合は次の行へ
    const textAfter = line.text.slice(head - line.from);
    const segments = Array.from(segmenter.segment(textAfter));
    const first = segments[0];
    return first ? head + first.segment.length : head;
};

// 移動・選択処理
const moveCjk = (view: EditorView, forward: boolean, select: boolean): boolean => {
    const { main } = view.state.selection;
    const newHead = forward ? getNextBoundary(view.state.doc, main.head) : getPrevBoundary(view.state.doc, main.head);

    if (newHead === main.head) return false;

    view.dispatch({
        selection: { anchor: select ? main.anchor : newHead, head: newHead },
        scrollIntoView: true
    });
    return true;
};

// 削除処理
const deleteCjk = (view: EditorView, forward: boolean): boolean => {
    const { main } = view.state.selection;
    if (!main.empty) return false; // 範囲選択中はデフォルトの削除処理へ委譲

    const newHead = forward ? getNextBoundary(view.state.doc, main.head) : getPrevBoundary(view.state.doc, main.head);

    if (newHead === main.head) return false;

    view.dispatch({
        changes: { from: Math.min(main.head, newHead), to: Math.max(main.head, newHead) },
        scrollIntoView: true
    });
    return true;
};

// プラグイン本体
export default class CjkWordEditPlugin extends Plugin {
    async onload() {
        this.registerEditorExtension(
            Prec.highest(
                keymap.of([
                    // 削除
                    { key: "Mod-Backspace", run: (v) => deleteCjk(v, false) },
                    { key: "Mod-Delete", run: (v) => deleteCjk(v, true) },
                    // 移動
                    { key: "Mod-ArrowLeft", run: (v) => moveCjk(v, false, false) },
                    { key: "Mod-ArrowRight", run: (v) => moveCjk(v, true, false) },
                    // 選択
                    { key: "Shift-Mod-ArrowLeft", run: (v) => moveCjk(v, false, true) },
                    { key: "Shift-Mod-ArrowRight", run: (v) => moveCjk(v, true, true) }
                ])
            )
        );
    }
}
