---
name: storage-basics
description: localStorage/sessionStorageの基本的な使用方法
---

# Storage Basics

ブラウザストレージの基本的な使用方法とベストプラクティスを定義します。

## How to use

- `/storage-basics`
  この会話のすべてのストレージ操作にこれらの制約を適用

## ストレージの選択

| 種類 | 有効期限 | 容量 | 用途 |
|------|----------|------|------|
| localStorage | 永続 | 5-10MB | ユーザー設定、保存データ |
| sessionStorage | タブを閉じるまで | 5-10MB | 一時データ、フォーム下書き |

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | エラーハンドリング | critical |
| 2 | キー命名 | high |
| 3 | データ構造 | high |
| 4 | 容量管理 | medium |

## Quick Reference

### 1. エラーハンドリング（critical）

- try-catchで囲む（容量超過、プライベートモード対策）
- フォールバック値を用意

```javascript
// GOOD: エラーハンドリング付き
const Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      // QuotaExceededError の場合は古いデータを削除検討
      if (e.name === 'QuotaExceededError') {
        this._handleQuotaExceeded();
      }
      return false;
    }
  },

  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  _handleQuotaExceeded() {
    // 古いデータや不要なキーを削除
    console.warn('Storage quota exceeded');
  }
};

// BAD: エラーハンドリングなし
localStorage.setItem('key', JSON.stringify(data));
```

### 2. キー命名（high）

- アプリ名をプレフィックスに
- アンダースコア区切り
- バージョン情報を含める（オプション）

```javascript
// キー命名規則
const STORAGE_KEYS = {
  // アプリ名_データ種別
  NOTES: 'keepplus_notes',
  SETTINGS: 'keepplus_settings',
  LABELS: 'keepplus_labels',

  // バージョン付き（データ移行用）
  DATA_V2: 'keepplus_data_v2'
};

// 使用例
Storage.save(STORAGE_KEYS.NOTES, notes);
```

### 3. データ構造（high）

- スキーマを事前定義
- バージョン番号を含める
- タイムスタンプを記録

```javascript
// データ構造の定義
const createDataSchema = () => ({
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  data: {
    items: [],
    settings: {
      theme: 'light',
      fontSize: 'medium'
    }
  }
});

// 保存時にタイムスタンプ更新
function saveData(key, newData) {
  const stored = Storage.load(key, createDataSchema());
  stored.data = { ...stored.data, ...newData };
  stored.updatedAt = Date.now();
  Storage.save(key, stored);
}
```

### 4. 容量管理（medium）

- 保存前にサイズを確認
- 不要なデータを定期的に削除
- 大きなデータは圧縮を検討

```javascript
// ストレージ使用量の確認
function getStorageUsage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key).length * 2; // UTF-16
    }
  }
  return total;
}

// 特定キーのサイズ
function getKeySize(key) {
  const item = localStorage.getItem(key);
  return item ? item.length * 2 : 0;
}

// サイズ制限付き保存
function saveWithLimit(key, data, maxSizeBytes = 1024 * 1024) {
  const json = JSON.stringify(data);
  if (json.length * 2 > maxSizeBytes) {
    console.warn('Data too large:', json.length * 2, 'bytes');
    return false;
  }
  return Storage.save(key, data);
}
```

## ストレージクラス実装例

```javascript
class AppStorage {
  constructor(prefix = 'app') {
    this.prefix = prefix;
  }

  _key(name) {
    return `${this.prefix}_${name}`;
  }

  save(name, data) {
    try {
      const payload = {
        data,
        savedAt: Date.now()
      };
      localStorage.setItem(this._key(name), JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  }

  load(name, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._key(name));
      if (!raw) return defaultValue;

      const payload = JSON.parse(raw);
      return payload.data;
    } catch (e) {
      return defaultValue;
    }
  }

  remove(name) {
    localStorage.removeItem(this._key(name));
  }

  clear() {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix + '_'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  // すべてのキーを取得
  keys() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix + '_'))
      .map(key => key.slice(this.prefix.length + 1));
  }
}

// 使用例
const storage = new AppStorage('myapp');
storage.save('settings', { theme: 'dark' });
const settings = storage.load('settings', { theme: 'light' });
```

## sessionStorageの使い分け

```javascript
// フォームの下書き保存（sessionStorage）
function saveDraft(formId, data) {
  sessionStorage.setItem(`draft_${formId}`, JSON.stringify(data));
}

function loadDraft(formId) {
  const draft = sessionStorage.getItem(`draft_${formId}`);
  return draft ? JSON.parse(draft) : null;
}

function clearDraft(formId) {
  sessionStorage.removeItem(`draft_${formId}`);
}

// 使用例
const form = document.getElementById('edit-form');
form.addEventListener('input', debounce(() => {
  saveDraft('edit-form', new FormData(form));
}, 1000));

form.addEventListener('submit', () => {
  clearDraft('edit-form');
});
```

## レビューガイダンス

- try-catch なしのストレージ操作を検出
- キー名のハードコーディングを検出
- JSON.parse/stringifyのエラーハンドリングを確認
- 大きなデータの保存を警告
