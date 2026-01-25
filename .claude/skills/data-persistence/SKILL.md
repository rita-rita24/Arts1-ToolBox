---
name: Data Persistence
description: localStorage/sessionStorageを使用したデータ永続化のベストプラクティス
---

# Data Persistence

ブラウザストレージを使用したデータ永続化のパターンとベストプラクティスを定義します。

## Key Resources

- **ストレージ基本**: [storage-basics.md](resources/storage-basics.md) を参照
- **自動保存**: [auto-save.md](resources/auto-save.md) を参照
- **データ移行**: [data-migration.md](resources/data-migration.md) を参照

## How to use

- `/data-persistence`
  この会話のすべてのデータ永続化にこれらの制約を適用

- `/data-persistence <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## Instructions

1. **ストレージ選択**: localStorage（永続）vs sessionStorage（セッション）
2. **データ構造設計**: スキーマを定義してから実装
3. **エラーハンドリング**: ストレージ容量超過を考慮
4. **バージョン管理**: データ形式の変更に対応
