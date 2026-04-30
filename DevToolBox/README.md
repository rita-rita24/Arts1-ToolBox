# DevToolBox

複数の開発者向けツールをサイドバーで切替できる、単一HTMLの統合 devtool。
TextChanger / BindSQL / Maskinger を**統一デザインシステム**でひとつにまとめた成果物です。

## 起動方法

ブラウザで `DevToolBox.html` を開くだけ。`file://` でも動作します。

```
open DevToolBox/DevToolBox.html
```

ビルド・サーバ・依存パッケージは不要です。Google Fonts（Inter / Noto Sans JP / Material Symbols Rounded）のみネットワークから読み込みます。

## 同梱ツール

| ツール | 概要 |
|---|---|
| **TextChanger** | 1行1値の入力を、A5M2 Caption / TSV / SQL IN句 / PostgreSQL SELECT+INSERT+DELETE / 連番調整 の5形式に同時変換 |
| **BindSQL** | Eclipse 等のデバッグ出力（SQL + バインド変数）を実行可能 SQL に統合 + A5:SQL Mk-2 風整形 + シンタックスハイライト |
| **Maskinger** | AI 送信前のテキスト/コードに含まれる機密情報・PII を自動マスキング（メール・トークン・IP・電話番号・カード番号・関数名・Javaのpackage名・SQL文字列など 25+ パターン） |

TextChanger の PostgreSQL 変換では、`NULL` および `<< NULL >>` のセル値は `WHERE` 条件に含めません。
生成される PostgreSQL 文では、文末の `;` は単独行で左寄せになります。

## 操作

- **ツール切替**: 左サイドバーまたはウェルカム画面のカードをクリック
- **テーマ切替**: トップバー右の太陽/月トグル（ライト/ダーク自動同期）
- **サイドバー折りたたみ**: タイトル右の3本線ボタン（デスクトップ）
- **モバイル**: 同じ3本線ボタンでサイドバーのドロワー開閉（720px 以下）
- **ハッシュリンク**: `DevToolBox.html#/textchanger` のように直接ツールを開ける
- **状態保持**: テーマ・最後に開いていたツール・サイドバー折りたたみは localStorage で永続化。TextChanger の入力値も自動保存

## ファイル構成

```
DevToolBox/
├── DevToolBox.html   ← 単一HTML（CSS・JS全て同梱）
└── README.md
```

既存の各単体ツール（`../TextChanger/`, `../BindSQLforSQLBuilder/`, `../Maskinger/`）は**一切変更されておらず**、引き続きスタンドアロン版として独立に利用できます。

## アーキテクチャ

### CSS

`@layer reset → base → component → utility` の cascade layers でレイヤ分離。色は全て **oklch**。`light-dark()` ではなく `[data-theme]` 属性で 2 テーマ切替。

主要トークン（`@layer base` 内）：

| 種別 | トークン |
|---|---|
| 表面 | `--bg`, `--bg-elevated`, `--surface`, `--surface-soft`, `--surface-strong` |
| 罫線 | `--border`, `--border-strong` |
| 文字 | `--text`, `--text-muted`, `--text-subtle` |
| アクセント | `--accent`, `--accent-strong`, `--accent-soft`, `--accent-fg` |
| ステータス | `--success`, `--warning`, `--danger` |
| SQLハイライト | `--sql-keyword`, `--sql-string`, `--sql-number`, `--sql-comment` |
| その他 | `--focus-ring`, `--shadow-sm/md/lg`, `--radius-sm/md/lg`, `--space-1..8` |

### コンポーネント

`.app` / `.sidebar` / `.workspace` / `.topbar` / `.tool-pane` の骨格に加え、以下の共通 UI 部品が全ツールで再利用されます:

- `.button` / `.button--primary` / `.button--ghost` / `.icon-btn`
- `.card` / `.card__header` / `.card__body`
- `.field` / `.field__label` / `.input` / `.textarea`
- `.switch`（テーマトグル）
- `.flash`（トースト）
- `.modal` / `.modal__dialog`（ヘルプモーダル）

ツール固有スタイル（`.tc-*`, `.bs-*`, `.mk-*`）はプレフィックスで衝突回避。

### JavaScript

```
script
├── ヘルパー (qs, qsa, _copyToClipboard, _showFlash, ...)
├── TOOLS レジストリ（全ツール定義）
├── _state / _tools 名前空間
├── シェル: _activateTool, _setTheme, _setCollapsed, _renderNav, _initShell
├── _tools.textchanger = (() => { return {init}; })()
├── _tools.bindsql     = (() => { return {init}; })()
└── _tools.maskinger   = (() => { return {init}; })()
```

全ツールは `init($pane)` を実装した IIFE。アクティブ化時に lazy 初期化され、以降は DOM に常駐します（タブ切替で入力状態が消えない）。

イベントは AGENTS.md 準拠で `$pane`（ツール section）にスコープしたデリゲーション。`document` レベルのリスナーは禁止（他ツールへの漏れ防止）。

## ツールを追加する

1. `DevToolBox.html` 内 `TOOLS` 配列に 1 エントリを追加：
   ```js
   {
     id: 'newtool',
     name: 'NewTool',
     description: '短い説明',
     icon: 'rocket_launch',         // Material Symbols Rounded のアイコン名
     eyebrow: 'Category',
     standalone: '../NewTool/NewTool.html',  // 任意
   }
   ```
2. `<main>` 内の同じ階層に新しいペイン要素を追加：
   ```html
   <section class="tool-pane" data-tool-pane="newtool" aria-label="NewTool">
     <!-- .card / .field / .textarea などの統一コンポーネントで構築 -->
   </section>
   ```
3. JS に IIFE を追加：
   ```js
   _tools.newtool = (() => {
     const _init = ($pane) => {
       // DOM参照を $pane スコープで取得
       // イベントは $pane.addEventListener で委譲
     };
     return { init: _init };
   })();
   ```

シェルは自動でナビ項目・ウェルカムカード・タブ切替・状態保存を処理します。

## ID プレフィックス規約

| プレフィックス | ツール |
|---|---|
| `tc-` | TextChanger |
| `bs-` | BindSQL |
| `mk-` | Maskinger |
| `$` | シェル要素（`#$nav`, `#$themeToggle` など） |

## localStorage キー

| キー | 用途 |
|---|---|
| `devtoolbox_active_tool` | 最後に開いていたツール ID |
| `devtoolbox_theme` | 親テーマ（`light` / `dark`） |
| `devtoolbox_sidebar_collapsed` | サイドバー折りたたみ状態 |
| `textChanger_settings` | TextChanger の入力値（既存スタンドアロン版と互換） |

## 動作環境

- モダンブラウザ（Chrome/Edge/Firefox/Safari の最新版）
- `[data-theme]` 切替・cascade layers・oklch・`field-sizing` 等を使用
- ネットワーク不要（フォントのみ Google Fonts CDN から取得。オフラインでもシステムフォントで動作）

## ライセンス・由来

各ツールのロジックは元のスタンドアロン HTML から JS のみを抽出し、新規の統一デザインで包み直したもの：

- TextChanger: `../TextChanger/TextChanger.html`
- BindSQL: `../BindSQLforSQLBuilder/BindSQLforSQLBuilder.html`
- Maskinger: `../Maskinger/Maskinger.html`

UI（HTML/CSS）は完全に書き直しています。元ファイルは無変更で残してあります。
