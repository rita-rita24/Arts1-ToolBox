# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Arts1-ToolBoxは、Vanilla JavaScriptで構築されたシングルファイルSPAのツールボックスです。各アプリケーションは独立したHTMLファイルとして動作し、ビルドプロセスを必要としません。

### アプリケーション構成

| ファイル | 説明 |
|---------|------|
| `simple-todo.html` | タスク管理アプリ |
| `csv-tsv-editor.html` | CSV/TSVエディタ |
| `keep-plus.html` | Google Keepライクなノートアプリ |

## 技術スタック

- **言語**: Vanilla JavaScript（フレームワーク不使用）
- **マークアップ**: HTML5
- **スタイリング**: CSS3（CSS変数によるテーマ管理）
- **アイコン**: Material Icons / Material Symbols Outlined
- **データ永続化**: localStorage / sessionStorage
- **デプロイ**: スタンドアロンHTML（ビルド不要）

## アーキテクチャ原則

### シングルファイルSPA構成

```
app.html
├── <head>
│   ├── メタデータ
│   ├── <style> CSS
│   └── 外部リソース（フォント、アイコン）
└── <body>
    ├── HTML構造
    └── <script> JavaScript
```

### 設計ルール

1. **外部依存の最小化**: CDN経由のフォント・アイコンのみ許可
2. **オフラインファースト**: localStorageで自動保存
3. **プログレッシブエンハンスメント**: JavaScript無効でも基本表示
4. **レスポンシブデザイン**: モバイル・デスクトップ対応

## コーディング規約

### JavaScript

```javascript
// 関数名: camelCase
function handleButtonClick() {}

// 定数: UPPER_SNAKE_CASE
const STORAGE_KEY = 'app_data';

// プライベート関数: _プレフィックス
function _internalHelper() {}

// DOM要素取得: getElementById優先
const element = document.getElementById('my-element');

// イベントリスナー: addEventListener使用
element.addEventListener('click', handleClick);
```

### CSS

```css
/* CSS変数によるテーマ定義 */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent-color: #4285f4;
}

/* ダークモード */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}

/* クラス名: kebab-case */
.card-container {}
.button-primary {}
```

### HTML

```html
<!-- ID: kebab-case -->
<div id="main-container">

<!-- data属性: data-*形式 -->
<button data-action="save">
```

## UI/UXパターン

### テーマ切り替え

```javascript
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
```

### 自動保存

```javascript
// デバウンス付き自動保存
let saveTimeout;
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, 500);
}
```

### モーダル/ダイアログ

- Escapeキーで閉じる
- 背景クリックで閉じる（オプション）
- フォーカストラップ実装
- 開く前の要素にフォーカスを戻す

## データ永続化

### localStorage使用パターン

```javascript
// 保存
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// 読み込み
function loadData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
```

### キー命名規則

```
appName_dataType
例: keepplus_notes, csvEditor_settings
```

## コミット規約

### 形式

```
ファイル名: 変更内容の簡潔な説明
```

### 例

```
keep-plus.html: ドラッグ&ドロップ機能を追加
csv-tsv-editor.html: 検索機能のバグを修正
CLAUDE.md: プロジェクトガイドラインを追加
```

## Skills参照

詳細なガイドラインは `.claude/skills/` を参照：

- **web-design-standards**: UI/UX標準、アクセシビリティ
- **javascript-patterns**: JavaScriptコーディングパターン
- **data-persistence**: データ永続化パターン
- **single-file-spa**: シングルファイルSPA設計

## 禁止事項

- フレームワーク（React, Vue等）の導入
- ビルドツール（webpack, vite等）の導入
- node_modulesの作成
- 外部APIへの依存（認証、データベース等）
- パスワードや機密情報のハードコーディング

## 推奨事項

- 既存のコードスタイルを踏襲
- 機能追加時は既存アプリのパターンを参考に
- アクセシビリティ（キーボード操作、ARIA属性）を考慮
- モバイル対応を忘れずに
