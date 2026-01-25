---
name: auto-save
description: 自動保存機能の実装パターン
---

# Auto Save

自動保存機能の実装パターンとベストプラクティスを定義します。

## How to use

- `/auto-save`
  この会話のすべての自動保存実装にこれらの制約を適用

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | デバウンス | critical |
| 2 | 保存インジケータ | high |
| 3 | 競合防止 | high |
| 4 | 復元機能 | medium |

## Quick Reference

### 1. デバウンス（critical）

- 入力ごとに保存しない
- 300-1000msのデバウンス推奨
- 最後の変更のみ保存

```javascript
// デバウンス付き自動保存
const AutoSave = {
  timeout: null,
  delay: 500,
  isDirty: false,

  schedule(saveFn) {
    this.isDirty = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      saveFn();
      this.isDirty = false;
    }, this.delay);
  },

  // ページ離脱時の強制保存
  flush(saveFn) {
    if (this.isDirty) {
      clearTimeout(this.timeout);
      saveFn();
      this.isDirty = false;
    }
  }
};

// 使用例
input.addEventListener('input', () => {
  AutoSave.schedule(() => saveData());
});

window.addEventListener('beforeunload', () => {
  AutoSave.flush(() => saveData());
});
```

### 2. 保存インジケータ（high）

- 保存中・保存完了を表示
- 最終保存時刻を表示
- エラー時は明確に通知

```javascript
const SaveIndicator = {
  element: null,

  init(selector) {
    this.element = document.querySelector(selector);
  },

  showSaving() {
    this.element.textContent = '保存中...';
    this.element.classList.remove('saved', 'error');
    this.element.classList.add('saving');
  },

  showSaved() {
    const time = new Date().toLocaleTimeString();
    this.element.textContent = `保存済み (${time})`;
    this.element.classList.remove('saving', 'error');
    this.element.classList.add('saved');
  },

  showError(message = '保存に失敗しました') {
    this.element.textContent = message;
    this.element.classList.remove('saving', 'saved');
    this.element.classList.add('error');
  }
};

// 使用例
async function saveData() {
  SaveIndicator.showSaving();
  try {
    await Storage.save(STORAGE_KEY, data);
    SaveIndicator.showSaved();
  } catch (e) {
    SaveIndicator.showError();
  }
}
```

### 3. 競合防止（high）

- 保存中は新たな保存をキューイング
- タブ間の競合を考慮
- ロック機構の実装

```javascript
const SafeAutoSave = {
  isSaving: false,
  pendingSave: null,
  delay: 500,
  timeout: null,

  schedule(saveFn) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.execute(saveFn), this.delay);
  },

  async execute(saveFn) {
    // 保存中なら待機
    if (this.isSaving) {
      this.pendingSave = saveFn;
      return;
    }

    this.isSaving = true;
    try {
      await saveFn();
    } finally {
      this.isSaving = false;

      // 待機中の保存があれば実行
      if (this.pendingSave) {
        const pending = this.pendingSave;
        this.pendingSave = null;
        this.execute(pending);
      }
    }
  }
};

// タブ間の同期（storage イベント）
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    // 他タブで変更された
    const newData = JSON.parse(e.newValue);
    handleExternalChange(newData);
  }
});
```

### 4. 復元機能（medium）

- 前回の状態を復元可能に
- 復元バナーを表示
- ユーザーが選択できるように

```javascript
const RecoveryManager = {
  RECOVERY_KEY: 'app_recovery',

  // 復元データを保存
  saveRecoveryPoint(data) {
    const recovery = {
      data,
      timestamp: Date.now(),
      url: location.href
    };
    sessionStorage.setItem(this.RECOVERY_KEY, JSON.stringify(recovery));
  },

  // 復元データを取得
  getRecoveryData() {
    const raw = sessionStorage.getItem(this.RECOVERY_KEY);
    if (!raw) return null;

    const recovery = JSON.parse(raw);
    // 1時間以上前のデータは無視
    if (Date.now() - recovery.timestamp > 60 * 60 * 1000) {
      this.clearRecovery();
      return null;
    }
    return recovery;
  },

  // 復元データをクリア
  clearRecovery() {
    sessionStorage.removeItem(this.RECOVERY_KEY);
  },

  // 復元バナーを表示
  showRecoveryBanner(onRestore, onDiscard) {
    const recovery = this.getRecoveryData();
    if (!recovery) return;

    const banner = document.createElement('div');
    banner.className = 'recovery-banner';
    banner.innerHTML = `
      <span>未保存の変更があります。復元しますか？</span>
      <button class="restore-btn">復元</button>
      <button class="discard-btn">破棄</button>
    `;

    banner.querySelector('.restore-btn').onclick = () => {
      onRestore(recovery.data);
      banner.remove();
      this.clearRecovery();
    };

    banner.querySelector('.discard-btn').onclick = () => {
      onDiscard();
      banner.remove();
      this.clearRecovery();
    };

    document.body.prepend(banner);
  }
};
```

## 完全な自動保存実装例

```javascript
class AutoSaveManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'app_data';
    this.delay = options.delay || 500;
    this.onSave = options.onSave || (() => {});
    this.onError = options.onError || (() => {});

    this.timeout = null;
    this.isSaving = false;
    this.isDirty = false;
    this.lastSaved = null;

    this._bindEvents();
  }

  _bindEvents() {
    // ページ離脱時に強制保存
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        this.saveSync();
        // 未保存の場合は確認ダイアログ
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // 可視性変更時に保存
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isDirty) {
        this.saveSync();
      }
    });
  }

  // データ変更を通知
  markDirty() {
    this.isDirty = true;
  }

  // デバウンス付き保存をスケジュール
  scheduleSave(data) {
    this.isDirty = true;
    this._pendingData = data;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.save(data);
    }, this.delay);
  }

  // 非同期保存
  async save(data) {
    if (this.isSaving) return;

    this.isSaving = true;
    try {
      const payload = {
        data,
        version: 1,
        savedAt: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.isDirty = false;
      this.lastSaved = new Date();
      this.onSave(this.lastSaved);
    } catch (e) {
      this.onError(e);
    } finally {
      this.isSaving = false;
    }
  }

  // 同期保存（beforeunload用）
  saveSync() {
    if (this._pendingData) {
      try {
        const payload = {
          data: this._pendingData,
          version: 1,
          savedAt: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
        this.isDirty = false;
      } catch (e) {
        console.error('Sync save failed:', e);
      }
    }
  }

  // データ読み込み
  load(defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return defaultValue;

      const payload = JSON.parse(raw);
      this.lastSaved = new Date(payload.savedAt);
      return payload.data;
    } catch (e) {
      return defaultValue;
    }
  }
}

// 使用例
const autoSave = new AutoSaveManager({
  storageKey: 'myapp_data',
  delay: 500,
  onSave: (time) => {
    document.getElementById('save-status').textContent =
      `保存済み: ${time.toLocaleTimeString()}`;
  },
  onError: (e) => {
    document.getElementById('save-status').textContent = '保存エラー';
  }
});

// 初期読み込み
const data = autoSave.load({ items: [] });

// 変更時に自動保存
function updateData(newData) {
  autoSave.scheduleSave(newData);
}
```

## レビューガイダンス

- デバウンスなしの保存を検出
- beforeunloadでの保存処理を確認
- 保存状態のUI表示を推奨
- 同時保存の競合対策を確認
