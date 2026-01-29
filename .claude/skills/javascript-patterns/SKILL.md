---
name: JavaScript Patterns
description: Vanilla JavaScriptのベストプラクティス、DOM操作、イベントハンドリング、モジュールパターンのガイドライン
---

# JavaScript Patterns

Vanilla JavaScriptでのコーディングパターンとベストプラクティスを定義します。フレームワークに依存しない純粋なJavaScriptでの開発に適用してください。

## Key Resources

- **DOM操作**: [dom-manipulation.md](resources/dom-manipulation.md) を参照
- **イベントハンドリング**: [event-handling.md](resources/event-handling.md) を参照
- **モジュールパターン**: [module-patterns.md](resources/module-patterns.md) を参照

## How to use

- `/javascript-patterns`
  この会話のすべてのJavaScript作業にこれらの制約を適用

- `/javascript-patterns <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## Instructions

1. **コード作成前**: モジュールパターンを確認し、適切な構造を選択
2. **DOM操作時**: パフォーマンスを考慮したDOM操作を使用
3. **イベント実装時**: イベント委譲パターンを検討
4. **レビュー時**: これらのドキュメントのチェックリストで実装を検証
