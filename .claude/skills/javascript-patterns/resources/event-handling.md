---
name: event-handling
description: イベントハンドリングのベストプラクティス
---

# Event Handling

イベントハンドリングのパターンとベストプラクティスを定義します。

## How to use

- `/event-handling`
  この会話のすべてのイベント処理にこれらの制約を適用

- `/event-handling <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | イベント委譲 | critical |
| 2 | リスナー管理 | high |
| 3 | デバウンス/スロットル | high |
| 4 | キーボードイベント | medium |
| 5. カスタムイベント | medium |

## Quick Reference

### 1. イベント委譲（critical）

- 動的に追加される要素には親要素でリスナーを設定
- 多数の同種要素には委譲パターンを使用

```javascript
// GOOD: イベント委譲
document.getElementById('list').addEventListener('click', (e) => {
  const item = e.target.closest('[data-action]');
  if (!item) return;

  const action = item.dataset.action;
  const id = item.dataset.id;

  switch (action) {
    case 'edit':
      editItem(id);
      break;
    case 'delete':
      deleteItem(id);
      break;
  }
});

// BAD: 各要素に個別リスナー
items.forEach(item => {
  item.addEventListener('click', handleClick);
});
```

### 2. リスナー管理（high）

- 不要になったリスナーは必ず削除
- AbortControllerでグループ削除
- once オプションを活用

```javascript
// AbortControllerでグループ管理
const controller = new AbortController();

element.addEventListener('click', handleClick, {
  signal: controller.signal
});
element.addEventListener('keydown', handleKeydown, {
  signal: controller.signal
});

// まとめて削除
function cleanup() {
  controller.abort();
}

// 一度だけ実行
element.addEventListener('click', handleOnce, { once: true });
```

### 3. デバウンス/スロットル（high）

- 入力イベントにはデバウンス
- スクロール/リサイズにはスロットル
- 検索入力には300-500msのデバウンス

```javascript
// デバウンス
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 使用例
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
  performSearch(e.target.value);
}, 300));

// スロットル
function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用例
window.addEventListener('scroll', throttle(handleScroll, 100));
```

### 4. キーボードイベント（medium）

- keydownを使用（keypress非推奨）
- event.keyを使用（keyCode非推奨）
- 修飾キーの確認を忘れずに

```javascript
// GOOD
document.addEventListener('keydown', (e) => {
  // Escapeでモーダルを閉じる
  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  // Ctrl+S で保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveDocument();
    return;
  }

  // Enterで送信（テキストエリア以外）
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    submitForm();
  }
});

// BAD: 非推奨プロパティ
if (e.keyCode === 27) {} // keyCode非推奨
```

### 5. カスタムイベント（medium）

- 疎結合のためにカスタムイベントを使用
- 詳細データはdetailプロパティで渡す
- bubblesをtrueにして伝播可能に

```javascript
// カスタムイベントの発火
function notifyChange(data) {
  const event = new CustomEvent('datachange', {
    bubbles: true,
    detail: { data }
  });
  document.dispatchEvent(event);
}

// リスナー登録
document.addEventListener('datachange', (e) => {
  console.log('Data changed:', e.detail.data);
  updateUI(e.detail.data);
});
```

## イベントオプション

```javascript
element.addEventListener('click', handler, {
  capture: false,    // キャプチャフェーズで処理
  once: true,        // 一度だけ実行
  passive: true,     // preventDefault()を呼ばないと宣言
  signal: controller.signal  // AbortController
});

// スクロールパフォーマンス向上
window.addEventListener('scroll', handleScroll, { passive: true });

// タッチイベントのパフォーマンス向上
element.addEventListener('touchstart', handleTouch, { passive: true });
```

## フォームイベント

```javascript
// フォーム送信
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  submitData(Object.fromEntries(formData));
});

// 入力変更（デバウンス付き）
input.addEventListener('input', debounce((e) => {
  validateField(e.target);
}, 300));

// フォーカス管理
input.addEventListener('focus', () => {
  input.select();
});

input.addEventListener('blur', () => {
  validateField(input);
});
```

## ドラッグ&ドロップ

```javascript
// ドラッグ可能要素
draggable.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
  e.target.classList.add('dragging');
});

draggable.addEventListener('dragend', (e) => {
  e.target.classList.remove('dragging');
});

// ドロップターゲット
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必須
  dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  handleDrop(id, e.target);
  dropzone.classList.remove('drag-over');
});
```

## レビューガイダンス

- 動的要素に対する個別リスナー登録を検出
- 未削除のリスナーを確認
- 高頻度イベント（scroll, resize, input）のデバウンス/スロットルを確認
- keyCodeの使用を検出してkeyへの移行を推奨
