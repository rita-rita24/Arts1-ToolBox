---
name: Single File SPA
description: シングルファイルSPAの設計パターンとベストプラクティス
---

# Single File SPA

ビルドプロセスなしで動作するシングルファイルSPAの設計パターンを定義します。

## Key Resources

- **ファイル構造**: [file-structure.md](resources/file-structure.md) を参照
- **コンポーネント設計**: [component-design.md](resources/component-design.md) を参照
- **パフォーマンス**: [performance.md](resources/performance.md) を参照

## How to use

- `/single-file-spa`
  この会話のすべてのSPA開発にこれらの制約を適用

- `/single-file-spa <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## 基本原則

1. **自己完結型**: 1つのHTMLファイルですべて完結
2. **ビルド不要**: ブラウザで直接実行可能
3. **オフライン対応**: 外部依存は最小限
4. **プログレッシブ**: 基本機能はJS無効でも動作

## Instructions

1. **新規SPA作成時**: ファイル構造テンプレートを使用
2. **機能追加時**: コンポーネント設計パターンを参照
3. **最適化時**: パフォーマンスガイドラインを確認
