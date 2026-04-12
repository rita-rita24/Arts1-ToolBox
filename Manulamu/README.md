# Manulamu (SES DocForge)

単一HTMLで動作する、SES向けドキュメント作成ツールです。

## 2026-04-12 UIリデザイン

- `border-inline-start` / `border-left` 依存の装飾を廃止
- 引用・アラート・目次を「面 + 余白 + 境界」の構成へ刷新
- ホーム画面を非対称レイアウトに変更し、主導線を明確化
- エディタ本文を紙面ライクな読みやすい構成へ調整
- エクスポートHTMLのスタイルも同方針へ統一
- カラースキーム制御を `document.documentElement.style.colorScheme` に統一

## 2026-04-12 テキスト入力仕様の再構築（Notionライク）

- Enter: キャレット位置でブロックを分割
- 見出し・引用: 空行 Enter で段落へ戻る
- リスト・ToDo: 空行 Enter / Backspace で段落へ戻る
- 段落: 行頭 Backspace で前段落に結合、空段落は削除
- 段落: 行末 Delete で次段落に結合
- ArrowUp / ArrowDown: 先頭行・末尾行で前後ブロックへ移動
- 入力モード中は `\\snippet` 自動展開を停止（スラッシュ/Markdown優先）

## ローカル確認

1. `Manulamu.html` をブラウザで開く
2. ホーム・エディタ・目次表示・引用・アラートの表示を確認
3. HTMLエクスポート結果でも左側ライン装飾が残っていないことを確認
