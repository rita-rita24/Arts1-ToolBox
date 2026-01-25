---
name: module-patterns
description: JavaScriptモジュールパターンとコード構造化のベストプラクティス
---

# Module Patterns

シングルファイルSPAにおけるJavaScriptのモジュールパターンとコード構造化を定義します。

## How to use

- `/module-patterns`
  この会話のすべてのコード構造化にこれらの制約を適用

- `/module-patterns <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | IIFE パターン | critical |
| 2 | 状態管理 | critical |
| 3 | 初期化順序 | high |
| 4 | 名前空間 | medium |

## Quick Reference

### 1. IIFE パターン（critical）

- グローバルスコープの汚染を防止
- プライベート変数/関数を実現
- シングルファイルSPAの基本構造

```javascript
// 基本的なIIFEパターン
(function() {
  'use strict';

  // プライベート変数
  const STORAGE_KEY = 'app_data';
  let state = {};

  // プライベート関数
  function _saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // パブリック関数（必要に応じてwindowに公開）
  function init() {
    loadState();
    bindEvents();
    render();
  }

  // DOM読み込み後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 2. 状態管理（critical）

- 単一の状態オブジェクトで管理
- 直接変更せずメソッド経由で更新
- 状態変更後は必ずUIを更新

```javascript
(function() {
  'use strict';

  // 状態の定義
  const State = {
    data: {
      items: [],
      filter: 'all',
      searchQuery: ''
    },

    // 状態の取得
    get(key) {
      return key ? this.data[key] : { ...this.data };
    },

    // 状態の更新
    set(key, value) {
      this.data[key] = value;
      this._persist();
      this._notify();
    },

    // 永続化
    _persist() {
      localStorage.setItem('app_state', JSON.stringify(this.data));
    },

    // 変更通知
    _notify() {
      document.dispatchEvent(new CustomEvent('statechange'));
    },

    // 復元
    load() {
      const saved = localStorage.getItem('app_state');
      if (saved) {
        this.data = { ...this.data, ...JSON.parse(saved) };
      }
    }
  };

  // 状態変更を監視してUI更新
  document.addEventListener('statechange', render);
})();
```

### 3. 初期化順序（high）

- 依存関係を考慮した初期化順序
- DOM要素の存在確認
- エラーハンドリング

```javascript
(function() {
  'use strict';

  // 1. 定数定義
  const CONFIG = {
    STORAGE_KEY: 'app_data',
    DEBOUNCE_MS: 300
  };

  // 2. 状態定義
  let state = {};

  // 3. DOM参照（init時に取得）
  let elements = {};

  // 4. ユーティリティ関数
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // 5. ビジネスロジック
  function addItem(item) {
    state.items.push(item);
    save();
    render();
  }

  // 6. イベントハンドラ
  function handleSubmit(e) {
    e.preventDefault();
    // ...
  }

  // 7. レンダリング
  function render() {
    // ...
  }

  // 8. 初期化
  function init() {
    // DOM参照を取得
    elements = {
      form: document.getElementById('form'),
      list: document.getElementById('list'),
      input: document.getElementById('input')
    };

    // 存在確認
    if (!elements.form || !elements.list) {
      console.error('Required elements not found');
      return;
    }

    // イベントバインド
    bindEvents();

    // データ読み込み
    loadState();

    // 初期レンダリング
    render();
  }

  // 9. イベントバインド
  function bindEvents() {
    elements.form.addEventListener('submit', handleSubmit);
    elements.input.addEventListener('input', debounce(handleInput, CONFIG.DEBOUNCE_MS));
  }

  // 10. 起動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 4. 名前空間（medium）

- 複数モジュール間の連携が必要な場合
- グローバル公開は最小限に

```javascript
// グローバル名前空間
window.App = window.App || {};

// モジュール定義
window.App.Utils = (function() {
  function debounce(fn, delay) { /* ... */ }
  function throttle(fn, limit) { /* ... */ }

  // 公開API
  return {
    debounce,
    throttle
  };
})();

window.App.Storage = (function() {
  const STORAGE_KEY = 'app_data';

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function load() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  return { save, load };
})();

// メインアプリ
window.App.Main = (function() {
  const { debounce } = window.App.Utils;
  const Storage = window.App.Storage;

  // ...
})();
```

## コード構成テンプレート

```javascript
/**
 * アプリケーション名
 * 説明
 */
(function() {
  'use strict';

  // ============================================
  // 定数
  // ============================================
  const CONFIG = {
    STORAGE_KEY: 'app_data',
    API_ENDPOINT: '/api'
  };

  // ============================================
  // 状態
  // ============================================
  let state = {
    items: [],
    isLoading: false
  };

  // ============================================
  // DOM参照
  // ============================================
  let elements = {};

  // ============================================
  // ユーティリティ
  // ============================================
  function debounce(fn, delay) { /* ... */ }

  // ============================================
  // データ操作
  // ============================================
  function loadData() { /* ... */ }
  function saveData() { /* ... */ }

  // ============================================
  // ビジネスロジック
  // ============================================
  function addItem(item) { /* ... */ }
  function removeItem(id) { /* ... */ }

  // ============================================
  // イベントハンドラ
  // ============================================
  function handleSubmit(e) { /* ... */ }
  function handleClick(e) { /* ... */ }

  // ============================================
  // レンダリング
  // ============================================
  function render() { /* ... */ }
  function renderItem(item) { /* ... */ }

  // ============================================
  // イベントバインド
  // ============================================
  function bindEvents() { /* ... */ }

  // ============================================
  // 初期化
  // ============================================
  function init() {
    elements = {
      // DOM要素を取得
    };
    bindEvents();
    loadData();
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
```

## レビューガイダンス

- グローバル変数の使用を検出
- 状態管理の一貫性を確認
- 初期化順序の依存関係を確認
- DOM要素の存在確認を推奨
