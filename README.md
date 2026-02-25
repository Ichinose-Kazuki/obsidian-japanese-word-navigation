# Japanese Word Navigation

使い方: https://qiita.com/zuxianW/items/5197f428d5f191dfd412#5-%E6%89%8B%E5%85%83%E3%81%AE-obsidian-%E3%81%A7%E5%8B%95%E3%81%8B%E3%81%97%E3%81%A6%E3%81%BF%E3%82%8B を参照。

機能:
1. 移動（ナビゲーション）
   - Ctrl + ArrowLeft：前の単語境界へカーソル移動。
   - Ctrl + ArrowRight：次の単語境界へカーソル移動。
2. 選択（セレクション）
    - Ctrl + Shift + ArrowLeft：前の単語境界まで範囲選択。
    - Ctrl + Shift + ArrowRight：次の単語境界まで範囲選択。
    - ダブルクリック：カーソル下のCJK単語の正確な範囲選択（標準動作の上書き）。
3. 削除（デリーション）
    - Ctrl + Backspace：カーソル位置から前の単語境界までを削除（後方削除）
    - Ctrl + Delete：カーソル位置から次の単語境界までを削除（前方削除）。

実装の簡単な説明
- 単語境界の判定には Obsidian（Chrome/Electron環境）に標準搭載されている `Intl.Segmenter` を利用
- `isWordLike` を使って半角スペース等が入っていても一単語として扱っている。加えて、アンダースコア `_` も同様の扱いをしている。
- CodeMirror の `keymap.of` を用いてキーバインドに関数を登録

