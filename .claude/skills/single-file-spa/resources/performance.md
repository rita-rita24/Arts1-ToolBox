---
name: performance
description: シングルファイルSPAのパフォーマンス最適化ガイド
---

# Performance

シングルファイルSPAのパフォーマンス最適化パターンを定義します。

## How to use

- `/performance`
  この会話のすべてのパフォーマンス最適化にこれらの制約を適用

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | レンダリング最適化 | critical |
| 2 | イベント最適化 | high |
| 3 | メモリ管理 | high |
| 4 | リソース最適化 | medium |

## Quick Reference

### 1. レンダリング最適化（critical）

#### 差分更新

```javascript
// BAD: 全体を再レンダリング
function render() {
  container.innerHTML = items.map(renderItem).join('');
}

// GOOD: 差分更新
function updateItem(id, data) {
  const element = document.querySelector(`[data-id="${id}"]`);
  if (element) {
    // 変更された部分のみ更新
    element.querySelector('.title').textContent = data.title;
    element.querySelector('.status').className = `status ${data.status}`;
  }
}

// GOOD: DocumentFragmentで一括追加
function addItems(newItems) {
  const fragment = document.createDocumentFragment();
  newItems.forEach(item => {
    const el = createItemElement(item);
    fragment.appendChild(el);
  });
  container.appendChild(fragment);
}
```

#### レイアウトスラッシング防止

```javascript
// BAD: 読み取りと書き込みの混在
items.forEach(item => {
  const height = item.offsetHeight; // 読み取り（強制リフロー）
  item.style.width = height + 'px'; // 書き込み
});

// GOOD: 読み取りをまとめる
const heights = items.map(item => item.offsetHeight);
items.forEach((item, i) => {
  item.style.width = heights[i] + 'px';
});

// GOOD: requestAnimationFrameを使用
function batchUpdate(updates) {
  requestAnimationFrame(() => {
    updates.forEach(({ element, styles }) => {
      Object.assign(element.style, styles);
    });
  });
}
```

#### 仮想スクロール

```javascript
// 大量のリストアイテム用
class VirtualScroller {
  constructor(container, items, itemHeight, renderItem) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;

    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 5;
    this.scrollTop = 0;

    this._init();
  }

  _init() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      height: ${this.items.length * this.itemHeight}px;
      position: relative;
    `;

    this.container.innerHTML = '';
    this.container.appendChild(this.wrapper);
    this.container.addEventListener('scroll', this._onScroll.bind(this));

    this._render();
  }

  _onScroll() {
    this.scrollTop = this.container.scrollTop;
    this._render();
  }

  _render() {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - 2);
    const endIndex = Math.min(this.items.length, startIndex + this.visibleCount);

    this.wrapper.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const el = document.createElement('div');
      el.innerHTML = this.renderItem(this.items[i], i);
      el.style.cssText = `
        position: absolute;
        top: ${i * this.itemHeight}px;
        width: 100%;
        height: ${this.itemHeight}px;
      `;
      this.wrapper.appendChild(el);
    }
  }

  update(items) {
    this.items = items;
    this.wrapper.style.height = `${items.length * this.itemHeight}px`;
    this._render();
  }
}
```

### 2. イベント最適化（high）

#### デバウンス/スロットル

```javascript
// デバウンス（入力、検索）
function debounce(fn, delay = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// スロットル（スクロール、リサイズ）
function throttle(fn, limit = 100) {
  let inThrottle;
  let lastArgs;

  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

// 使用例
searchInput.addEventListener('input', debounce(handleSearch, 300));
window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });
window.addEventListener('resize', throttle(handleResize, 200));
```

#### イベント委譲

```javascript
// BAD: 各要素にリスナー
items.forEach(item => {
  item.addEventListener('click', handleClick);
});

// GOOD: 親要素で委譲
container.addEventListener('click', (e) => {
  const item = e.target.closest('[data-action]');
  if (!item) return;

  const { action, id } = item.dataset;
  handleAction(action, id);
});
```

#### Passive Event Listeners

```javascript
// スクロール・タッチイベントでpassiveを使用
window.addEventListener('scroll', handleScroll, { passive: true });
element.addEventListener('touchstart', handleTouch, { passive: true });

// preventDefault()が必要な場合のみpassive: false
element.addEventListener('touchmove', (e) => {
  e.preventDefault(); // スクロール防止
  handleDrag(e);
}, { passive: false });
```

### 3. メモリ管理（high）

#### リスナーのクリーンアップ

```javascript
// AbortControllerでまとめて削除
class Component {
  constructor() {
    this.controller = new AbortController();
  }

  init() {
    const { signal } = this.controller;

    this.element.addEventListener('click', this.handleClick, { signal });
    window.addEventListener('resize', this.handleResize, { signal });
    document.addEventListener('keydown', this.handleKeydown, { signal });
  }

  destroy() {
    this.controller.abort(); // すべてのリスナーを削除
    this.element = null;
  }
}
```

#### WeakMapでのデータ管理

```javascript
// DOM要素に関連データを紐付け
const elementData = new WeakMap();

function setData(element, data) {
  elementData.set(element, data);
}

function getData(element) {
  return elementData.get(element);
}

// 要素が削除されると自動的にデータも解放される
```

#### タイマーのクリーンアップ

```javascript
// タイマーIDを保存
const timers = {
  autoSave: null,
  notification: null
};

function startAutoSave() {
  stopAutoSave();
  timers.autoSave = setInterval(saveData, 30000);
}

function stopAutoSave() {
  if (timers.autoSave) {
    clearInterval(timers.autoSave);
    timers.autoSave = null;
  }
}

// ページ離脱時にクリーンアップ
window.addEventListener('beforeunload', () => {
  Object.values(timers).forEach(id => {
    clearInterval(id);
    clearTimeout(id);
  });
});
```

### 4. リソース最適化（medium）

#### 遅延読み込み

```javascript
// 画像の遅延読み込み
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px'
  });

  images.forEach(img => observer.observe(img));
}
```

#### CSS変数の活用

```css
/* 再計算を最小化 */
:root {
  --header-height: 60px;
  --sidebar-width: 250px;
}

.main {
  /* calc()は1回だけ評価 */
  height: calc(100dvh - var(--header-height));
  margin-left: var(--sidebar-width);
}
```

#### will-change の適切な使用

```css
/* アニメーション直前のみ適用 */
.card {
  transition: transform 0.2s;
}

.card:hover {
  will-change: transform;
}

.card.animating {
  will-change: transform;
}

/* BAD: 常時適用 */
.card {
  will-change: transform; /* メモリ浪費 */
}
```

## パフォーマンス計測

```javascript
// 実行時間計測
function measureTime(label, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// フレームレート監視
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const now = performance.now();

  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = now;
  }

  requestAnimationFrame(measureFPS);
}

// メモリ使用量（Chrome DevTools）
if (performance.memory) {
  console.log('Used JS Heap:', Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
}
```

## チェックリスト

- [ ] DocumentFragmentを使用した一括DOM操作
- [ ] レイアウトスラッシングの防止
- [ ] 大量リストには仮想スクロール
- [ ] 高頻度イベントのデバウンス/スロットル
- [ ] イベント委譲の活用
- [ ] passiveイベントリスナー
- [ ] 不要なリスナーのクリーンアップ
- [ ] タイマーのクリーンアップ
- [ ] 画像の遅延読み込み
- [ ] will-changeの適切な使用

## レビューガイダンス

- ループ内のDOM操作を検出
- 高頻度イベントのデバウンス/スロットルを確認
- リスナーのクリーンアップを確認
- 大量データのレンダリング方法を確認
