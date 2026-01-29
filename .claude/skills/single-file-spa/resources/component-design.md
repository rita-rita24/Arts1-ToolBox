---
name: component-design
description: シングルファイルSPAにおけるコンポーネント設計パターン
---

# Component Design

フレームワークなしでコンポーネント的な設計を実現するパターンを定義します。

## How to use

- `/component-design`
  この会話のすべてのコンポーネント設計にこれらの制約を適用

## ルールカテゴリ

| 優先度 | カテゴリ | 影響 |
|--------|----------|------|
| 1 | モーダル/ダイアログ | critical |
| 2 | フォーム | high |
| 3 | リスト | high |
| 4 | トースト通知 | medium |
| 5 | ドロップダウン | medium |

## Quick Reference

### 1. モーダル/ダイアログ（critical）

```javascript
const Modal = {
  container: null,
  previousFocus: null,

  init() {
    this.container = document.getElementById('modal-container');
  },

  open(content, options = {}) {
    // 現在のフォーカスを保存
    this.previousFocus = document.activeElement;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (options.title) {
      modal.setAttribute('aria-labelledby', 'modal-title');
    }

    modal.innerHTML = `
      <div class="modal-content">
        ${options.title ? `<h2 id="modal-title" class="modal-title">${options.title}</h2>` : ''}
        <div class="modal-body">${content}</div>
        <div class="modal-actions">
          ${options.actions || '<button class="btn" data-action="close">閉じる</button>'}
        </div>
        <button class="modal-close" data-action="close" aria-label="閉じる">
          <span class="material-icons">close</span>
        </button>
      </div>
    `;

    // イベントリスナー
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-action="close"]')) {
        this.close();
      }
    });

    // Escapeで閉じる
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escHandler);

    // 背景スクロール無効化
    document.body.style.overflow = 'hidden';

    this.container.appendChild(modal);

    // フォーカストラップ
    this._trapFocus(modal);

    return modal;
  },

  close() {
    const modal = this.container.querySelector('.modal-overlay');
    if (!modal) return;

    document.removeEventListener('keydown', this._escHandler);
    document.body.style.overflow = '';

    modal.remove();

    // フォーカスを戻す
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  },

  _trapFocus(modal) {
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  },

  // 確認ダイアログ
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const content = `<p>${message}</p>`;
      const actions = `
        <button class="btn btn-secondary" data-action="cancel">キャンセル</button>
        <button class="btn btn-primary" data-action="confirm">${options.confirmText || '確認'}</button>
      `;

      const modal = this.open(content, { title: options.title, actions });

      modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="confirm"]')) {
          resolve(true);
          this.close();
        } else if (e.target.closest('[data-action="cancel"]')) {
          resolve(false);
          this.close();
        }
      });
    });
  }
};
```

**CSS:**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  position: relative;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  margin: 0;
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.modal-close {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--text-secondary);
}
```

### 2. フォーム（high）

```javascript
const Form = {
  // バリデーションルール
  validators: {
    required: (value) => value.trim() !== '' || '必須項目です',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '有効なメールアドレスを入力してください',
    minLength: (min) => (value) => value.length >= min || `${min}文字以上で入力してください`,
    maxLength: (max) => (value) => value.length <= max || `${max}文字以内で入力してください`
  },

  // フォームのバリデーション
  validate(form, rules) {
    const errors = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const input = form.elements[field];
      if (!input) continue;

      const value = input.value;

      for (const rule of fieldRules) {
        const result = typeof rule === 'function' ? rule(value) : this.validators[rule](value);

        if (result !== true) {
          errors[field] = result;
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  },

  // エラー表示
  showErrors(form, errors) {
    // 既存エラーをクリア
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    for (const [field, message] of Object.entries(errors)) {
      const input = form.elements[field];
      if (!input) continue;

      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');

      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.id = `${field}-error`;
      errorEl.textContent = message;

      input.setAttribute('aria-describedby', errorEl.id);
      input.parentNode.appendChild(errorEl);
    }
  },

  // エラークリア
  clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => {
      el.classList.remove('input-error');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
  },

  // フォームデータ取得
  getData(form) {
    return Object.fromEntries(new FormData(form));
  }
};

// 使用例
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const rules = {
    name: ['required', Form.validators.minLength(2)],
    email: ['required', 'email']
  };

  const { isValid, errors } = Form.validate(e.target, rules);

  if (!isValid) {
    Form.showErrors(e.target, errors);
    return;
  }

  Form.clearErrors(e.target);
  const data = Form.getData(e.target);
  submitData(data);
});
```

### 3. リスト（high）

```javascript
const List = {
  // 仮想スクロール（大量データ用）
  createVirtualList(container, items, renderItem, itemHeight = 50) {
    const visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
    let scrollTop = 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'virtual-list-wrapper';
    wrapper.style.height = `${items.length * itemHeight}px`;
    wrapper.style.position = 'relative';

    const render = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);

      wrapper.innerHTML = '';
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        const div = document.createElement('div');
        div.innerHTML = item;
        div.style.position = 'absolute';
        div.style.top = `${i * itemHeight}px`;
        div.style.width = '100%';
        wrapper.appendChild(div);
      }
    };

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      render();
    });

    container.innerHTML = '';
    container.appendChild(wrapper);
    render();
  },

  // ドラッグ&ドロップ並べ替え
  enableDragSort(container, onReorder) {
    let draggedEl = null;

    container.addEventListener('dragstart', (e) => {
      draggedEl = e.target.closest('[draggable="true"]');
      if (!draggedEl) return;

      draggedEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    container.addEventListener('dragend', (e) => {
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
        draggedEl = null;
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target.closest('[draggable="true"]');
      if (!target || target === draggedEl) return;

      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        target.parentNode.insertBefore(draggedEl, target);
      } else {
        target.parentNode.insertBefore(draggedEl, target.nextSibling);
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      const newOrder = [...container.querySelectorAll('[draggable="true"]')]
        .map(el => el.dataset.id);
      onReorder(newOrder);
    });
  }
};
```

### 4. トースト通知（medium）

```javascript
const Toast = {
  container: null,
  queue: [],

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },

  show(message, options = {}) {
    const { type = 'info', duration = 3000 } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icon = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    }[type];

    toast.innerHTML = `
      <span class="material-icons toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="閉じる">
        <span class="material-icons">close</span>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // アニメーション
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // 自動非表示
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  },

  success(message, duration) {
    return this.show(message, { type: 'success', duration });
  },

  error(message, duration) {
    return this.show(message, { type: 'error', duration });
  },

  warning(message, duration) {
    return this.show(message, { type: 'warning', duration });
  },

  info(message, duration) {
    return this.show(message, { type: 'info', duration });
  }
};
```

**CSS:**

```css
#toast-container {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  box-shadow: var(--shadow-md);
  opacity: 0;
  transform: translateX(100%);
  transition: all var(--transition-normal);
}

.toast-visible {
  opacity: 1;
  transform: translateX(0);
}

.toast-success { border-left: 4px solid var(--success-color); }
.toast-error { border-left: 4px solid var(--error-color); }
.toast-warning { border-left: 4px solid #f9a825; }
.toast-info { border-left: 4px solid var(--accent-color); }
```

### 5. ドロップダウン（medium）

```javascript
const Dropdown = {
  activeDropdown: null,

  init() {
    // グローバルクリックで閉じる
    document.addEventListener('click', (e) => {
      if (this.activeDropdown && !this.activeDropdown.contains(e.target)) {
        this.close();
      }
    });

    // Escapeで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeDropdown) {
        this.close();
      }
    });
  },

  create(trigger, items, onSelect) {
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.setAttribute('role', 'menu');

    dropdown.innerHTML = items.map((item, index) => `
      <button class="dropdown-item" role="menuitem" data-value="${item.value}" tabindex="${index === 0 ? 0 : -1}">
        ${item.icon ? `<span class="material-icons">${item.icon}</span>` : ''}
        ${item.label}
      </button>
    `).join('');

    // キーボードナビゲーション
    dropdown.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.dropdown-item');
      const currentIndex = [...items].indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(currentIndex + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length].focus();
      }
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        onSelect(item.dataset.value);
        this.close();
      }
    });

    return dropdown;
  },

  open(trigger, dropdown) {
    this.close();

    const rect = trigger.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;

    document.body.appendChild(dropdown);
    this.activeDropdown = dropdown;
    trigger.setAttribute('aria-expanded', 'true');

    dropdown.querySelector('.dropdown-item')?.focus();
  },

  close() {
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }
  }
};
```

## レビューガイダンス

- モーダルのフォーカストラップを確認
- フォームのアクセシブルなエラー表示を確認
- トーストのaria-live設定を確認
- ドロップダウンのキーボードナビゲーションを確認
