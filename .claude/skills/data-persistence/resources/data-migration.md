---
name: data-migration
description: データ形式のバージョン管理と移行パターン
---

# Data Migration

データ形式の変更に対応するバージョン管理と移行パターンを定義します。

## How to use

- `/data-migration`
  この会話のすべてのデータ移行作業にこれらの制約を適用

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | バージョン番号 | critical |
| 2 | 移行関数 | critical |
| 3 | 後方互換性 | high |
| 4 | バックアップ | medium |

## Quick Reference

### 1. バージョン番号（critical）

- すべてのデータにバージョン番号を含める
- バージョンは整数で管理
- 現在のバージョンを定数で定義

```javascript
// 現在のデータバージョン
const CURRENT_VERSION = 3;

// データ構造
const createDefaultData = () => ({
  version: CURRENT_VERSION,
  items: [],
  settings: {
    theme: 'light',
    language: 'ja'
  }
});

// 保存時にバージョンを含める
function saveData(data) {
  const payload = {
    ...data,
    version: CURRENT_VERSION,
    updatedAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
```

### 2. 移行関数（critical）

- バージョンごとに移行関数を定義
- 連鎖的に適用可能にする
- 移行ログを残す

```javascript
// 移行関数の定義
const migrations = {
  // v1 -> v2: items配列にidを追加
  1: (data) => {
    return {
      ...data,
      version: 2,
      items: data.items.map((item, index) => ({
        ...item,
        id: item.id || `item_${index}_${Date.now()}`
      }))
    };
  },

  // v2 -> v3: settingsにlanguageを追加
  2: (data) => {
    return {
      ...data,
      version: 3,
      settings: {
        ...data.settings,
        language: data.settings.language || 'ja'
      }
    };
  },

  // v3 -> v4: itemsにcreatedAtを追加
  3: (data) => {
    return {
      ...data,
      version: 4,
      items: data.items.map(item => ({
        ...item,
        createdAt: item.createdAt || Date.now()
      }))
    };
  }
};

// 移行を実行
function migrateData(data) {
  let current = data;
  const startVersion = current.version || 1;

  while (current.version < CURRENT_VERSION) {
    const migrateFn = migrations[current.version];
    if (!migrateFn) {
      console.error(`Migration function not found for v${current.version}`);
      break;
    }

    console.log(`Migrating from v${current.version} to v${current.version + 1}`);
    current = migrateFn(current);
  }

  if (startVersion !== current.version) {
    console.log(`Migration complete: v${startVersion} -> v${current.version}`);
  }

  return current;
}
```

### 3. 後方互換性（high）

- 古いデータも読み込めるように
- 未知のフィールドは保持
- デフォルト値を適切に設定

```javascript
// 安全なデータ読み込み
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultData();
  }

  try {
    let data = JSON.parse(raw);

    // バージョンがない場合はv1とみなす
    if (!data.version) {
      data.version = 1;
    }

    // 移行が必要な場合は実行
    if (data.version < CURRENT_VERSION) {
      // 移行前にバックアップ
      backupData(data);
      data = migrateData(data);
      // 移行後のデータを保存
      saveData(data);
    }

    // デフォルト値とマージ（未知のフィールドを保持）
    return mergeWithDefaults(data, createDefaultData());
  } catch (e) {
    console.error('Failed to load data:', e);
    return createDefaultData();
  }
}

// デフォルト値とマージ
function mergeWithDefaults(data, defaults) {
  const result = { ...data };

  for (const key in defaults) {
    if (!(key in result)) {
      result[key] = defaults[key];
    } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeWithDefaults(result[key] || {}, defaults[key]);
    }
  }

  return result;
}
```

### 4. バックアップ（medium）

- 移行前にバックアップを作成
- 一定数のバックアップを保持
- 復元機能を提供

```javascript
const BackupManager = {
  MAX_BACKUPS: 5,
  BACKUP_PREFIX: 'backup_',

  // バックアップを作成
  create(key, data) {
    const backupKey = `${this.BACKUP_PREFIX}${key}_${Date.now()}`;
    const backup = {
      originalKey: key,
      data,
      createdAt: Date.now(),
      reason: 'pre-migration'
    };

    try {
      localStorage.setItem(backupKey, JSON.stringify(backup));
      this._cleanOldBackups(key);
      return backupKey;
    } catch (e) {
      console.error('Backup failed:', e);
      return null;
    }
  },

  // 古いバックアップを削除
  _cleanOldBackups(originalKey) {
    const backups = this.list(originalKey);
    if (backups.length > this.MAX_BACKUPS) {
      const toDelete = backups.slice(this.MAX_BACKUPS);
      toDelete.forEach(b => localStorage.removeItem(b.key));
    }
  },

  // バックアップ一覧を取得
  list(originalKey) {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`${this.BACKUP_PREFIX}${originalKey}_`)) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({ key, ...backup });
        } catch (e) {}
      }
    }
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  },

  // バックアップから復元
  restore(backupKey, targetKey) {
    try {
      const backup = JSON.parse(localStorage.getItem(backupKey));
      if (backup && backup.data) {
        localStorage.setItem(targetKey, JSON.stringify(backup.data));
        return true;
      }
    } catch (e) {
      console.error('Restore failed:', e);
    }
    return false;
  }
};

// バックアップ付き移行
function backupData(data) {
  BackupManager.create(STORAGE_KEY, data);
}
```

## 完全な移行マネージャー実装例

```javascript
class DataMigrationManager {
  constructor(options) {
    this.storageKey = options.storageKey;
    this.currentVersion = options.currentVersion;
    this.migrations = options.migrations || {};
    this.createDefault = options.createDefault;
  }

  // データを読み込み（必要に応じて移行）
  load() {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return this.createDefault();
    }

    try {
      let data = JSON.parse(raw);

      // バージョンチェック
      const dataVersion = data.version || 1;

      if (dataVersion < this.currentVersion) {
        console.log(`Data migration needed: v${dataVersion} -> v${this.currentVersion}`);

        // バックアップ
        this._backup(data);

        // 移行実行
        data = this._migrate(data);

        // 移行後のデータを保存
        this._save(data);
      }

      return this._mergeDefaults(data);
    } catch (e) {
      console.error('Load failed, returning default:', e);
      return this.createDefault();
    }
  }

  _migrate(data) {
    let current = { ...data };

    while ((current.version || 1) < this.currentVersion) {
      const version = current.version || 1;
      const migrateFn = this.migrations[version];

      if (!migrateFn) {
        throw new Error(`No migration for v${version}`);
      }

      current = migrateFn(current);
      console.log(`Migrated to v${current.version}`);
    }

    return current;
  }

  _backup(data) {
    const backupKey = `${this.storageKey}_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify({
        data,
        backedUpAt: Date.now()
      }));
    } catch (e) {
      console.warn('Backup failed:', e);
    }
  }

  _save(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  _mergeDefaults(data) {
    const defaults = this.createDefault();
    return this._deepMerge(defaults, data);
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

// 使用例
const migrationManager = new DataMigrationManager({
  storageKey: 'myapp_data',
  currentVersion: 3,
  createDefault: () => ({
    version: 3,
    items: [],
    settings: { theme: 'light', language: 'ja' }
  }),
  migrations: {
    1: (data) => ({ ...data, version: 2, items: data.items.map(i => ({ ...i, id: crypto.randomUUID() })) }),
    2: (data) => ({ ...data, version: 3, settings: { ...data.settings, language: 'ja' } })
  }
});

const data = migrationManager.load();
```

## レビューガイダンス

- データにバージョン番号が含まれているか確認
- 移行関数が連鎖的に動作するか確認
- バックアップなしの破壊的移行を警告
- デフォルト値のマージ処理を確認
