import { Plugin } from "obsidian";
import { Prec, Text } from "@codemirror/state";
import { keymap, EditorView } from "@codemirror/view";

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

// 前の単語境界を算出
const getPrevBoundary = (doc: Text, head: number): number => {
    const line = doc.lineAt(head);
    if (head === line.from) return Math.max(0, head - 1);

    const textBefore = line.text.slice(0, head - line.from);
    // アンダースコアを半角スペースに置換してセグメント分割
    const segments = Array.from(segmenter.segment(textBefore.replace(/_/g, " ")));
    if (segments.length === 0) return line.from;

    let i = segments.length - 1;

    // 1. 直前の連続する非単語（空白・記号）をすべてスキップ
    while (i >= 0 && !segments[i]?.isWordLike) {
        i--;
    }

    // 2. その手前にある1単語（1セグメント）をスキップ
    if (i >= 0 && segments[i]?.isWordLike) {
        i--;
    }

    const targetSegment = segments[i + 1];
    return targetSegment ? line.from + targetSegment.index : line.from;
};

// 次の単語境界を算出
const getNextBoundary = (doc: Text, head: number): number => {
    const line = doc.lineAt(head);
    if (head === line.to) return Math.min(doc.length, head + 1);

    const textAfter = line.text.slice(head - line.from);
    // アンダースコアを半角スペースに置換してセグメント分割
    const segments = Array.from(segmenter.segment(textAfter.replace(/_/g, " ")));
    if (segments.length === 0) return head;

    let i = 0;

    if (segments[i]?.isWordLike) {
        // 直後が単語の場合：1単語進み、さらに続く非単語（空白など）もまとめてスキップ
        i++;
        while (i < segments.length && !segments[i]?.isWordLike) {
            i++;
        }
    } else {
        // 直後が非単語の場合：連続する非単語のみをまとめてスキップ
        while (i < segments.length && !segments[i]?.isWordLike) {
            i++;
        }
    }

    let offset = 0;
    for (let j = 0; j < i; j++) {
        offset += segments[j]?.segment.length || 0;
    }

    return offset > 0 ? head + offset : head + (segments[0]?.segment.length || 1);
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
