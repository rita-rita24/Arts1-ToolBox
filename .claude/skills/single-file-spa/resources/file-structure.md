---
name: file-structure
description: シングルファイルSPAのファイル構造とテンプレート
---

# File Structure

シングルファイルSPAの基本構造とテンプレートを定義します。

## How to use

- `/file-structure`
  この会話のすべてのSPA構造設計にこれらの制約を適用

## 基本構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <!-- 1. メタデータ -->
  <!-- 2. 外部リソース -->
  <!-- 3. CSS -->
</head>
<body>
  <!-- 4. HTML構造 -->
  <!-- 5. JavaScript -->
</body>
</html>
```

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | メタデータ | critical |
| 2 | CSS構造 | high |
| 3 | HTML構造 | high |
| 4 | JavaScript構造 | critical |

## Quick Reference

### 1. メタデータ（critical）

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="アプリケーションの説明">

  <!-- ファビコン（インライン SVG 推奨） -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">

  <title>アプリケーション名</title>

  <!-- 外部リソース（最小限に） -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
```

### 2. CSS構造（high）

```html
<style>
/* ============================================
   1. CSS変数（テーマ）
   ============================================ */
:root {
  /* カラー */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent-color: #4285f4;
  --border-color: #e0e0e0;
  --error-color: #d93025;
  --success-color: #188038;

  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* ボーダー */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* シャドウ */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.2);

  /* トランジション */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  /* フォント */
  --font-family: 'Noto Sans JP', sans-serif;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
}

/* ダークモード */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
}

/* ============================================
   2. リセット・ベース
   ============================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 100dvh;
}

/* ============================================
   3. レイアウト
   ============================================ */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.app-header { /* ... */ }
.app-main { flex: 1; }
.app-footer { /* ... */ }

/* ============================================
   4. コンポーネント
   ============================================ */
/* ボタン */
.btn { /* ... */ }
.btn-primary { /* ... */ }

/* 入力 */
.input { /* ... */ }

/* カード */
.card { /* ... */ }

/* ============================================
   5. ユーティリティ
   ============================================ */
.hidden { display: none !important; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* ============================================
   6. レスポンシブ
   ============================================ */
@media (max-width: 768px) {
  /* タブレット以下 */
}

@media (max-width: 480px) {
  /* モバイル */
}

/* ============================================
   7. アクセシビリティ
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
```

### 3. HTML構造（high）

```html
<body>
  <div class="app-container">
    <!-- ヘッダー -->
    <header class="app-header">
      <h1 class="app-title">アプリ名</h1>
      <nav class="app-nav">
        <!-- ナビゲーション -->
      </nav>
    </header>

    <!-- メインコンテンツ -->
    <main class="app-main" id="main-content">
      <!-- 動的コンテンツ -->
    </main>

    <!-- フッター（オプション） -->
    <footer class="app-footer">
      <!-- フッター内容 -->
    </footer>
  </div>

  <!-- モーダル・ダイアログ（メインコンテンツ外） -->
  <div id="modal-container"></div>

  <!-- トースト通知 -->
  <div id="toast-container" aria-live="polite"></div>

  <!-- JavaScript -->
  <script>
    // アプリケーションコード
  </script>
</body>
```

### 4. JavaScript構造（critical）

```html
<script>
/**
 * アプリケーション名
 * 説明文
 */
(function() {
  'use strict';

  // ============================================
  // 定数
  // ============================================
  const CONFIG = {
    STORAGE_KEY: 'app_data',
    DEBOUNCE_MS: 300
  };

  // ============================================
  // 状態
  // ============================================
  let state = {
    items: [],
    isLoading: false,
    settings: {
      theme: 'light'
    }
  };

  // ============================================
  // DOM参照
  // ============================================
  let elements = {};

  // ============================================
  // ユーティリティ
  // ============================================
  const Utils = {
    debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    },

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  // ============================================
  // ストレージ
  // ============================================
  const Storage = {
    save(data) {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Storage save error:', e);
      }
    },

    load(defaultValue = null) {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    }
  };

  // ============================================
  // テーマ管理
  // ============================================
  const Theme = {
    init() {
      const saved = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      this.set(saved || preferred);
    },

    set(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      state.settings.theme = theme;
    },

    toggle() {
      const current = state.settings.theme;
      this.set(current === 'dark' ? 'light' : 'dark');
    }
  };

  // ============================================
  // ビジネスロジック
  // ============================================
  function addItem(data) {
    const item = {
      id: Utils.generateId(),
      ...data,
      createdAt: Date.now()
    };
    state.items.push(item);
    saveAndRender();
  }

  function removeItem(id) {
    state.items = state.items.filter(item => item.id !== id);
    saveAndRender();
  }

  function saveAndRender() {
    Storage.save(state);
    render();
  }

  // ============================================
  // イベントハンドラ
  // ============================================
  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    addItem(Object.fromEntries(formData));
    e.target.reset();
  }

  function handleClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;

    const { action: actionType, id } = action.dataset;

    switch (actionType) {
      case 'delete':
        removeItem(id);
        break;
      case 'toggle-theme':
        Theme.toggle();
        break;
    }
  }

  // ============================================
  // レンダリング
  // ============================================
  function render() {
    elements.list.innerHTML = state.items
      .map(item => renderItem(item))
      .join('');
  }

  function renderItem(item) {
    return `
      <div class="item" data-id="${item.id}">
        <span>${Utils.escapeHtml(item.name)}</span>
        <button data-action="delete" data-id="${item.id}" aria-label="削除">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;
  }

  // ============================================
  // イベントバインド
  // ============================================
  function bindEvents() {
    elements.form.addEventListener('submit', handleSubmit);
    elements.list.addEventListener('click', handleClick);
    elements.themeToggle?.addEventListener('click', () => Theme.toggle());
  }

  // ============================================
  // 初期化
  // ============================================
  function init() {
    // DOM参照を取得
    elements = {
      form: document.getElementById('item-form'),
      list: document.getElementById('item-list'),
      themeToggle: document.getElementById('theme-toggle')
    };

    // 存在確認
    if (!elements.form || !elements.list) {
      console.error('Required elements not found');
      return;
    }

    // テーマ初期化
    Theme.init();

    // データ読み込み
    const saved = Storage.load({ items: [] });
    state.items = saved.items || [];

    // イベントバインド
    bindEvents();

    // 初期レンダリング
    render();
  }

  // ============================================
  // 起動
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
```

## 完全なテンプレート

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="アプリケーションの説明">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">
  <title>アプリ名</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

  <style>
    /* CSS はここに */
  </style>
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <h1>アプリ名</h1>
    </header>

    <main class="app-main" id="main-content">
      <!-- コンテンツ -->
    </main>
  </div>

  <script>
    // JavaScript はここに
  </script>
</body>
</html>
```

## レビューガイダンス

- メタデータの必須項目を確認
- CSS変数によるテーマ管理を推奨
- JavaScript のIIFEパターンを確認
- DOM要素の存在確認を推奨
