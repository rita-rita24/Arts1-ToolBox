---
name: dom-manipulation
description: 効率的なDOM操作のベストプラクティス
---

# DOM Manipulation

効率的なDOM操作のパターンとアンチパターンを定義します。

## How to use

- `/dom-manipulation`
  この会話のすべてのDOM操作にこれらの制約を適用

- `/dom-manipulation <file>`
  以下のルールに対してファイルをレビューし、報告:
  - 違反箇所（正確な行またはスニペットを引用）
  - 重要性（短い一文）
  - 具体的な修正案（コードレベルの提案）

## 要素の取得

### 推奨パターン

```javascript
// ID による取得（最速）
const element = document.getElementById('my-id');

// querySelector（柔軟性）
const element = document.querySelector('.my-class');
const elements = document.querySelectorAll('[data-action]');

// 特定のコンテナ内での検索
const container = document.getElementById('container');
const button = container.querySelector('.submit-btn');
```

### 避けるべきパターン

```javascript
// AVOID: getElementsByClassName（ライブコレクション）
const elements = document.getElementsByClassName('item');

// AVOID: getElementsByTagName（ライブコレクション）
const divs = document.getElementsByTagName('div');
```

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | バッチ更新 | critical |
| 2 | DocumentFragment | high |
| 3 | クローン vs 新規作成 | medium |
| 4 | 属性操作 | medium |

## Quick Reference

### 1. バッチ更新（critical）

- ループ内でDOMを直接更新しない
- 複数の変更はまとめて適用
- レイアウトスラッシングを避ける

```javascript
// GOOD: バッチ更新
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const li = document.createElement('li');
  li.textContent = item.name;
  fragment.appendChild(li);
});
list.appendChild(fragment);

// BAD: ループ内で個別追加
items.forEach(item => {
  const li = document.createElement('li');
  li.textContent = item.name;
  list.appendChild(li); // 毎回リフロー発生
});
```

### 2. DocumentFragment（high）

- 複数要素の追加にはDocumentFragmentを使用
- innerHTMLの代わりにDocumentFragmentを検討

```javascript
// GOOD
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  fragment.appendChild(div);
}
container.appendChild(fragment);
```

### 3. クローン vs 新規作成（medium）

- 繰り返し要素にはテンプレートのクローンを使用

```javascript
// テンプレート要素
const template = document.getElementById('item-template');

// クローンして使用
function createItem(data) {
  const clone = template.content.cloneNode(true);
  clone.querySelector('.title').textContent = data.title;
  clone.querySelector('.content').textContent = data.content;
  return clone;
}
```

### 4. 属性操作（medium）

- dataset を使用してdata属性を操作
- classList を使用してクラスを操作
- setAttribute/getAttribute は必要時のみ

```javascript
// GOOD: dataset
element.dataset.id = '123';
const id = element.dataset.id;

// GOOD: classList
element.classList.add('active');
element.classList.remove('hidden');
element.classList.toggle('expanded');

// AVOID: className直接操作
element.className = 'active'; // 他のクラスが消える
```

## レイアウトスラッシング防止

```javascript
// BAD: 読み取り→書き込み→読み取り→書き込み
elements.forEach(el => {
  const height = el.offsetHeight; // 読み取り
  el.style.height = height + 10 + 'px'; // 書き込み
});

// GOOD: まとめて読み取り→まとめて書き込み
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

## 要素の表示/非表示

```javascript
// 推奨: クラスによる制御
element.classList.add('hidden');
element.classList.remove('hidden');

// CSS
.hidden {
  display: none;
}

// 避ける: style直接操作
element.style.display = 'none';
element.style.display = 'block';
```

## 要素の削除

```javascript
// 推奨
element.remove();

// 古いブラウザ対応が必要な場合
element.parentNode.removeChild(element);

// 子要素をすべて削除
container.replaceChildren();
// または
container.innerHTML = '';
```

## レビューガイダンス

- ループ内のDOM操作を優先的にチェック
- DocumentFragmentの使用を推奨
- レイアウトプロパティの読み取りと書き込みの混在を検出
- classListとdatasetの使用を推奨
