# AGENTS.md

## Repo overview
This repository contains multiple single-file HTML business tools.
Each tool lives in its own subdirectory.
Prioritize small, safe, high-confidence changes.

## Common rules
- Keep each tool self-contained in its own folder.
- Do not move files across tools unless explicitly requested.
- Do not add a build step unless explicitly requested.
- Prefer local-first behavior.
- Do not add telemetry or external network calls unless explicitly requested.

## Verification
Before finishing work:
1. Only modify the target tool directory unless explicitly requested.
2. Confirm the target tool opens without console errors.
3. Update that tool's README.md if behavior changed.

## CSS Rules
- Use CSS layers in this order: `reset -> base -> component -> utility`.
- Do not write styles outside declared layers.
- Use CSS nesting when possible.
- Use `oklch` for color definitions.
- Do not import external reset CSS.

## JavaScript Rules
- Prefer JavaScript-based color scheme control.
- Control color mode via `document.documentElement.style.colorScheme`.
- Keep behavior deterministic and easy to maintain.
- Do not introduce unnecessary dependencies.
- Write code that works in a single-file HTML environment when possible.

## DOM Helper Rules
- Use the following DOM helper functions for element selection:
  - `const qs = (sel, root = document) => root.querySelector(sel);`
  - `const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];`

## Naming Rules
- Prefix DOM element variables with `$`.
  - Example: `$button`, `$modal`, `$input`
- Prefix private/internal variables, methods, or fields with `_`.
  - Example: `_state`, `_render()`
- Write constants in `UPPER_SNAKE_CASE`.
  - Example: `MAX_ITEMS`, `DEFAULT_DELAY`

## Event Rules
- Prefer event delegation over direct event binding.
- Direct binding is allowed only for:
  - toolbar buttons
  - other static controls

## Implementation Notes
- Keep CSS and JavaScript consistent with the repository rules.
- Do not introduce alternative naming styles unless already required by existing code.
- Prefer consistency over personal style.

## Change Log
- 2026-04-05: テーマカラー8種を刷新。以下の指定カラーへ更新し、設定画面の色チップ表示とテーマ本体のトーンを一致させた: `#2ea9df`, `#68be8d`, `#f8b500`, `#f596aa`, `#b7282e`, `#bbbcde`, `#00a3af`, `#a86f4c`。
- 2026-04-05: 完了音遅延対策を追加。AudioContextを `latencyHint: "interactive"` で生成し、`suspended` 時は `resume()` 完了後に最新時刻で発音する実装へ変更。あわせて `touchstart` / `mousedown` でも事前ウォームアップを行うよう拡張。
- 2026-04-04: クリック時の体感遅延を低減。`render()` 内の毎回保存を廃止して状態変更時のみ保存に見直し、設定UI再描画を設定ページ表示時に限定。加えてAudioContextの再ウォームアップ耐性を強化し、完了演出（confetti/テキスト）の重い処理を `requestAnimationFrame` へ移して入力ブロックを抑制。
- 2026-04-04: テーマカラー選択の色丸（`.theme-dot`）を拡大し、外枠ボタンとのサイズ差を縮小して視認性を改善。
- 2026-04-04: テーマカラーを8種類に戻し、テーマ選択グリッドを8列表示へ調整（正方形タイル表示は維持）。
- 2026-04-04: テーマカラーを32種類へ拡張し、テーマ選択グリッドを16列固定（2行表示）に変更。各カラータイルは `aspect-ratio: 1 / 1` で正方形表示に調整。
- 2026-04-04: テーマカラー選択グリッドを8列固定に変更し、16色が常に「8列×2行」で表示されるよう調整。
- 2026-04-04: テーマカラーを8種類から16種類へ拡張。配色をコントラスト重視で再選定し、1番目は青系（オーシャン）を維持。
- 2026-04-04: 完了時サウンド遅延の軽減対応として、最初の `pointerdown` / `keydown` で AudioContext を事前ウォームアップする処理を追加。
- 2026-04-04: ファビコン表示を調整。チェックマーク+小バッジ方式を廃止し、未完了タスク数を中央に大きく表示する数字のみのデザインへ変更。
- 2026-04-04: タブタイトルとファビコンをタスク数連動に対応。未完了タスク数をタイトルに表示し、ファビコン右上に数値バッジを描画して更新するよう実装。
- 2026-04-04: 一時停止中でもタイマー下キャプション文言は「経過時間」のまま固定し、「一時停止中」表示は中央バナーとステータスチップに集約。
- 2026-04-04: 集中モードの一時停止中UIを強化。ヘッダーのステータスチップ追加、再開ボタンの強調、画面中央の「一時停止中」表示を実装し、停止状態がひと目で分かるよう改善。
- 2026-04-04: サイドバーに「整理メモ」を追加し、ナビ順を「Todoリスト → 整理メモ → 分析 → 設定」に変更。整理メモページを新設し、入力内容をローカル保存するよう対応。
- 2026-04-03: サイドバー折り畳み時のトグルアイコン位置を調整（横位置は中央寄せ、縦位置は展開時の高さに合わせる）。あわせて `yaruyanTodo.html` 内の `use strict` を削除。さらに、画面遷移・入力フォーカス・設定切り替え・削除確認・集中モード操作までキーボードショートカットを拡張。
- 2026-04-02: Settings内のテーマカラー選択UIで、色名テキスト表示を廃止し、色チップのみ表示に変更（`title` と `aria-label` は維持）。
