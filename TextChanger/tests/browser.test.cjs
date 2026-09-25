const { test } = require('node:test');
const ASSERT = require('node:assert/strict');
const PATH = require('node:path');
const { pathToFileURL } = require('node:url');
const PLAYWRIGHT = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const HTML_URL = pathToFileURL(process.env.TEXTCHANGER_HTML || PATH.join(__dirname, '..', 'text-changer.html')).href;
const BROWSERS = (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',');
const STORAGE_KEY = 'textChanger_settings';
const COPY_SELECTOR = '[data-copy-target="#output-sql-in"]';

for (const _name of BROWSERS) {
  test(`${_name}: offline browser regression`, async (_suite) => {
    const _browser = await PLAYWRIGHT[_name].launch({ headless: true });
    _suite.after(() => _browser.close());

    async function _page(_test, _init) {
      const _context = await _browser.newContext();
      const _errors = [];
      const _requests = [];
      await _context.route(/^https?:/, async (_route) => {
        _requests.push(_route.request().url());
        await _route.abort();
      });
      if (_init) await _context.addInitScript(_init);
      _context.on('page', (_tab) => {
        _tab.on('pageerror', (_error) => _errors.push(_error.message));
        _tab.on('console', (_message) => {
          if (_message.type() === 'error') _errors.push(_message.text());
        });
      });
      const _page = await _context.newPage();
      _test.after(async () => {
        await _context.close();
        ASSERT.deepEqual(_errors, [], 'no console errors or uncaught exceptions');
        ASSERT.deepEqual(_requests, [], 'no external network requests');
      });
      await _page.goto(HTML_URL);
      return _page;
    }

    await _suite.test('file opens offline and all five conversions update', async (_test) => {
      const _tab = await _page(_test);
      ASSERT.equal(await _tab.locator('.copy-btn:disabled').count(), 5);
      ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'light');
      await _tab.locator('#pg-table-name').fill('public.records');
      await _tab.locator('#number-offset').fill('1');
      await _tab.locator('#input-area').fill("id\tnote\n1\tO'Reilly");
      ASSERT.equal(await _tab.locator('.copy-btn:disabled').count(), 0);
      ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /INSERT INTO "public"\."records"/);
      ASSERT.match(await _tab.locator('#output-sql-in').inputValue(), /O''Reilly/);
      ASSERT.match(await _tab.locator('#output-number-adjust').inputValue(), /2\t/);
      await _tab.locator('#input-area').fill('');
      ASSERT.equal(await _tab.locator('.copy-btn:disabled').count(), 5);
      ASSERT.deepEqual(
        await _tab.locator('.output-area').evaluateAll((_outputs) => _outputs.map(($output) => $output.value)),
        ['', '', '', '', '']
      );
    });

    await _suite.test('an invalid table clears previous SQL and disables its copy button', async (_test) => {
      const _tab = await _page(_test);
      await _tab.locator('#input-area').fill('id\tname\n1\tone');
      ASSERT.notEqual(await _tab.locator('#output-pg-sql').inputValue(), '');
      await _tab.locator('#input-area').fill('id\tname\n1\tone\n2');
      ASSERT.equal(await _tab.locator('#output-pg-sql').inputValue(), '');
      ASSERT.equal(await _tab.locator('[data-copy-target="#output-pg-sql"]').isDisabled(), true);
      ASSERT.notEqual(await _tab.locator('#output-sql-in').inputValue(), '');
    });

    await _suite.test('immediate reload retains pending input and settings', async (_test) => {
      const _tab = await _page(_test);
      await _tab.evaluate(() => {
        const qs = (_selector) => document.querySelector(_selector);
        qs('#input-area').value = 'last keystroke';
        qs('#pg-table-name').value = 'saved_table';
        qs('#number-offset').value = '9007199254740993';
        qs('#lightModeToggle').checked = false;
        qs('#input-area').dispatchEvent(new Event('input', { bubbles: true }));
      });
      await _tab.reload();
      ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'last keystroke');
      ASSERT.equal(await _tab.locator('#pg-table-name').inputValue(), 'saved_table');
      ASSERT.equal(await _tab.locator('#number-offset').inputValue(), '9007199254740993');
      ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'dark');
    });

    await _suite.test('debounced save and real theme toggle survive reload', async (_test) => {
      const _tab = await _page(_test);
      await _tab.locator('#input-area').fill('debounced');
      await _tab.waitForFunction((_key) => JSON.parse(localStorage.getItem(_key))?.input === 'debounced', STORAGE_KEY);
      await _tab.locator('label[for="lightModeToggle"]').click();
      await _tab.reload();
      ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'debounced');
      ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'dark');
    });

    await _suite.test('corrupt storage and wrong value types recover without errors', async (_test) => {
      const _tab = await _page(_test);
      for (const _raw of [
        '{bad',
        'null',
        '[]',
        '3',
        '{"input":4,"theme":"unknown","pgTableName":[],"numberOffset":{}}'
      ]) {
        await _tab.evaluate(([_key, _value]) => localStorage.setItem(_key, _value), [STORAGE_KEY, _raw]);
        await _tab.reload();
        ASSERT.equal(await _tab.locator('#input-area').inputValue(), '');
        ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'light');
      }
    });

    await _suite.test('blocked storage does not break typing, saving or theme changes', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Blocked', 'SecurityError');
          }
        });
      });
      await _tab.locator('#input-area').fill('available');
      await _tab.locator('label[for="lightModeToggle"]').click();
      ASSERT.equal(await _tab.locator('#output-sql-in').inputValue(), "in ('available');");
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    });

    await _suite.test('quota failure preserves in-memory input and conversion', async (_test) => {
      const _tab = await _page(_test, () => {
        Storage.prototype.setItem = () => {
          throw new DOMException('Full', 'QuotaExceededError');
        };
      });
      await _tab.locator('#input-area').fill('retained');
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'retained');
      ASSERT.equal(await _tab.locator('#output-tsv').inputValue(), 'retained');
    });

    await _suite.test('modern clipboard success shows feedback and edits clear it', async (_test) => {
      const _tab = await _page(_test, () => {
        window._written = [];
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: async (_text) => {
              window._written.push(_text);
            }
          }
        });
      });
      await _tab.locator('#input-area').fill("O'Reilly");
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.waitForFunction(
        (_selector) => document.querySelector(_selector).classList.contains('copied'),
        COPY_SELECTOR
      );
      ASSERT.deepEqual(await _tab.evaluate(() => window._written), ["in ('O''Reilly');"]);
      await _tab.locator('#input-area').fill('new');
      ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピー');
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.waitForFunction(
        (_selector) => document.querySelector(_selector).classList.contains('copied'),
        COPY_SELECTOR
      );
      await _tab.waitForFunction(
        (_selector) => !document.querySelector(_selector).classList.contains('copied'),
        COPY_SELECTOR
      );
    });

    await _suite.test('fallback success restores focus, selection and scroll', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText() {
              throw new Error('Denied');
            }
          }
        });
        document.execCommand = () => true;
      });
      await _tab.locator('#input-area').fill('focus test');
      const _state = await _tab.evaluate(async (_selector) => {
        const qs = (_selector) => document.querySelector(_selector);
        const $input = qs('#input-area');
        const $output = qs('#output-sql-in');
        $input.focus();
        $input.setSelectionRange(1, 4);
        $output.setSelectionRange(2, 6, 'backward');
        await _copyResult(qs(_selector));
        return {
          active: document.activeElement.id,
          input: [$input.selectionStart, $input.selectionEnd],
          output: [$output.selectionStart, $output.selectionEnd, $output.selectionDirection],
          copied: qs(_selector).classList.contains('copied')
        };
      }, COPY_SELECTOR);
      ASSERT.deepEqual(_state, { active: 'input-area', input: [1, 4], output: [2, 6, 'backward'], copied: true });
    });

    await _suite.test('false and throwing fallback never report success or leak rejection', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => Promise.reject(new Error('Denied')) }
        });
      });
      await _tab.locator('#input-area').fill('cannot copy');
      for (const _mode of ['false', 'throw']) {
        await _tab.evaluate((_mode) => {
          document.execCommand = () => {
            if (_mode === 'throw') throw new Error('Blocked');
            return false;
          };
        }, _mode);
        await _tab.locator(COPY_SELECTOR).click();
        await _tab.evaluate(() => new Promise((_resolve) => setTimeout(_resolve, 0)));
        ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピー');
      }
    });

    await _suite.test('missing clipboard uses fallback without adding DOM', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined });
        document.execCommand = () => true;
      });
      await _tab.locator('#input-area').fill('legacy');
      const _count = await _tab.locator('*').count();
      await _tab.locator(COPY_SELECTOR).click();
      ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピーしました');
      ASSERT.equal(await _tab.locator('*').count(), _count);
    });

    await _suite.test('stale async copy completion cannot claim the changed result was copied', async (_test) => {
      const _tab = await _page(_test, () => {
        window._pending = [];
        window._fallbackCalls = 0;
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => new Promise((_resolve, _reject) => window._pending.push({ _resolve, _reject })) }
        });
        document.execCommand = () => {
          window._fallbackCalls += 1;
          return true;
        };
      });
      for (const _action of ['_resolve', '_reject']) {
        await _tab.locator('#input-area').fill('old');
        await _tab.locator(COPY_SELECTOR).click();
        await _tab.locator('#input-area').fill('new');
        await _tab.evaluate((_action) => window._pending.shift()[_action](), _action);
        ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピー');
      }
      ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
    });

    await _suite.test('rapid repeated copies ignore completion of superseded attempts', async (_test) => {
      const _tab = await _page(_test, () => {
        window._pending = [];
        window._fallbackCalls = 0;
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => new Promise((_resolve, _reject) => window._pending.push({ _resolve, _reject })) }
        });
        document.execCommand = () => {
          window._fallbackCalls += 1;
          return true;
        };
      });
      await _tab.locator('#input-area').fill('same');
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.evaluate(() => window._pending[1]._resolve());
      ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピーしました');
      await _tab.evaluate(() => window._pending[0]._reject());
      ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
    });

    await _suite.test('a delayed fallback from another card cannot overwrite the latest copy', async (_test) => {
      const _tab = await _page(_test, () => {
        window._pending = [];
        window._fallbackCalls = 0;
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => new Promise((_resolve, _reject) => window._pending.push({ _resolve, _reject })) }
        });
        document.execCommand = () => {
          window._fallbackCalls += 1;
          return true;
        };
      });
      await _tab.locator('#input-area').fill('shared clipboard');
      await _tab.locator('[data-copy-target="#output-a5m2"]').click();
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.evaluate(() => window._pending[1]._resolve());
      await _tab.evaluate(() => window._pending[0]._reject());
      ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
      ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 1);
      ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピーしました');
    });

    await _suite.test('a delayed success on another card cannot replace the latest feedback', async (_test) => {
      const _tab = await _page(_test, () => {
        window._pending = [];
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => new Promise((_resolve) => window._pending.push(_resolve)) }
        });
      });
      await _tab.locator('#input-area').fill('latest copy');
      await _tab.locator('[data-copy-target="#output-a5m2"]').click();
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.evaluate(() => window._pending[1]());
      await _tab.evaluate(() => window._pending[0]());
      ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 1);
      ASSERT.equal(await _tab.locator(`${COPY_SELECTOR} .copy-label`).textContent(), 'コピーしました');
    });

    await _suite.test('an idle tab changing theme cannot overwrite another tab’s text', async (_test) => {
      const _tab = await _page(_test);
      const _second = await _tab.context().newPage();
      await _second.goto(HTML_URL);
      await _tab.locator('#input-area').fill('new content in first tab');
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await _second.locator('label[for="lightModeToggle"]').click();
      let _stored = await _second.evaluate((_key) => JSON.parse(localStorage.getItem(_key)), STORAGE_KEY);
      ASSERT.equal(_stored.input, 'new content in first tab');
      ASSERT.equal(_stored.theme, 'dark');
      await _tab.locator('#number-offset').fill('5');
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      _stored = await _tab.evaluate((_key) => JSON.parse(localStorage.getItem(_key)), STORAGE_KEY);
      ASSERT.equal(_stored.theme, 'dark');
      ASSERT.equal(_stored.numberOffset, '5');
    });

    await _suite.test('unchanged events do not rewrite settings or overwrite another tab', async (_test) => {
      const _tab = await _page(_test);
      const _result = await _tab.evaluate((_key) => {
        localStorage.setItem(_key, JSON.stringify({ input: 'external', theme: 'dark' }));
        document.querySelector('#input-area').dispatchEvent(new Event('input', { bubbles: true }));
        window.dispatchEvent(new Event('pagehide'));
        return JSON.parse(localStorage.getItem(_key));
      }, STORAGE_KEY);
      ASSERT.equal(_result.input, 'external');
      ASSERT.equal(_result.theme, 'dark');
    });

    await _suite.test('failed saves retry after storage becomes available', async (_test) => {
      const _tab = await _page(_test, () => {
        const _setItem = Storage.prototype.setItem;
        window._blocked = true;
        Storage.prototype.setItem = function (..._args) {
          if (window._blocked) throw new DOMException('Full', 'QuotaExceededError');
          return _setItem.apply(this, _args);
        };
      });
      await _tab.locator('#input-area').fill('recover me');
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await _tab.evaluate(() => {
        window._blocked = false;
        window.dispatchEvent(new Event('pagehide'));
      });
      await _tab.reload();
      ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'recover me');
    });

    await _suite.test('parameter changes only recalculate dependent results', async (_test) => {
      const _tab = await _page(_test);
      await _tab.locator('#input-area').fill('id\tvalue\n1\ttext');
      await _tab.evaluate(() => {
        window._calls = { lines: 0, table: 0, number: 0 };
        for (const [_name, _key] of [
          ['_getLines', 'lines'],
          ['_parseTabularInput', 'table'],
          ['_convertNumberAdjustment', 'number']
        ]) {
          const _original = window[_name];
          window[_name] = (..._args) => {
            window._calls[_key] += 1;
            return _original(..._args);
          };
        }
      });
      await _tab.locator('#number-offset').fill('2');
      ASSERT.deepEqual(await _tab.evaluate(() => window._calls), { lines: 0, table: 0, number: 1 });
      ASSERT.match(await _tab.locator('#output-number-adjust').inputValue(), /3\ttext/);
      await _tab.locator('#pg-table-name').fill('changed_table');
      ASSERT.deepEqual(await _tab.evaluate(() => window._calls), { lines: 0, table: 0, number: 1 });
      ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /"changed_table"/);
    });

    await _suite.test('fallback restores a page-text selection and body focus', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined });
        document.execCommand = () => true;
      });
      await _tab.locator('#input-area').fill('fallback selection');
      const _state = await _tab.evaluate(async (_selector) => {
        document.activeElement.blur();
        const _selection = window.getSelection();
        const _range = document.createRange();
        _range.selectNodeContents(document.querySelector('h1'));
        _selection.removeAllRanges();
        _selection.addRange(_range);
        const _before = _selection.toString();
        await _copyResult(document.querySelector(_selector));
        return { active: document.activeElement.tagName, before: _before, after: _selection.toString() };
      }, COPY_SELECTOR);
      ASSERT.equal(_state.active, 'BODY');
      ASSERT.equal(_state.after, _state.before);
    });

    await _suite.test('pageshow refreshes results after browser form restoration', async (_test) => {
      const _tab = await _page(_test);
      await _tab.evaluate(() => {
        document.querySelector('#input-area').value = 'restored by browser';
        window.dispatchEvent(new Event('pageshow'));
      });
      ASSERT.equal(await _tab.locator('#output-sql-in').inputValue(), "in ('restored by browser');");
    });

    await _suite.test('pageshow repairs restored output fields even when the input did not change', async (_test) => {
      const _tab = await _page(_test);
      await _tab.locator('#input-area').fill('id\n1');
      const _expected = await _tab
        .locator('.output-area')
        .evaluateAll((_outputs) => _outputs.map(($output) => $output.value));
      await _tab.evaluate(() => {
        document.querySelectorAll('.output-area').forEach(($output) => {
          $output.value = 'stale browser snapshot';
        });
        window.dispatchEvent(new Event('pageshow'));
      });
      ASSERT.deepEqual(
        await _tab.locator('.output-area').evaluateAll((_outputs) => _outputs.map(($output) => $output.value)),
        _expected
      );
    });

    await _suite.test('pageshow synchronizes a restored theme switch with every theme surface', async (_test) => {
      const _tab = await _page(_test);
      await _tab.evaluate(() => {
        document.querySelector('#lightModeToggle').checked = false;
        window.dispatchEvent(new Event('pageshow'));
      });
      ASSERT.deepEqual(
        await _tab.evaluate(() => [
          document.documentElement.style.colorScheme,
          document.documentElement.dataset.theme,
          document.body.dataset.mode
        ]),
        ['dark', 'dark', 'dark']
      );
    });

    await _suite.test(
      'restored values without input events are saved on idle and immediate departure',
      async (_test) => {
        const _tab = await _page(_test);
        await _tab.evaluate(() => {
          document.querySelector('#input-area').value = 'restored without events';
          window.dispatchEvent(new Event('pageshow'));
        });
        await _tab.waitForFunction(
          (_key) => JSON.parse(localStorage.getItem(_key))?.input === 'restored without events',
          STORAGE_KEY
        );
        await _tab.evaluate(() => {
          document.querySelector('#input-area').value = 'last restored value';
          document.querySelector('#pg-table-name').value = 'restored_table';
          window.dispatchEvent(new Event('pagehide'));
        });
        await _tab.reload();
        ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'last restored value');
        ASSERT.equal(await _tab.locator('#pg-table-name').inputValue(), 'restored_table');
      }
    );

    await _suite.test('leaving the page cancels delayed clipboard fallbacks and success feedback', async (_test) => {
      const _tab = await _page(_test, () => {
        window._pending = [];
        window._fallbackCalls = 0;
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => new Promise((_resolve, _reject) => window._pending.push({ _resolve, _reject })) }
        });
        document.execCommand = () => {
          window._fallbackCalls += 1;
          return true;
        };
      });
      await _tab.locator('#input-area').fill('leaving');
      for (const _action of ['_resolve', '_reject']) {
        await _tab.locator(COPY_SELECTOR).click();
        await _tab.evaluate((_action) => {
          window.dispatchEvent(new Event('pagehide'));
          window.dispatchEvent(new Event('pageshow'));
          window._pending.shift()[_action]();
        }, _action);
        ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 0);
      }
      ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
    });

    await _suite.test('fallback restores the direction of a backward page-text selection', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined });
        document.execCommand = () => true;
      });
      await _tab.locator('#input-area').fill('backward selection');
      const _state = await _tab.evaluate(async (_selector) => {
        document.activeElement.blur();
        const _node = document.querySelector('h1 span').firstChild;
        const _selection = window.getSelection();
        _selection.setBaseAndExtent(_node, 5, _node, 1);
        const _before = _selection.toString();
        await _copyResult(document.querySelector(_selector));
        return {
          text: _selection.toString(),
          before: _before,
          anchor: _selection.anchorOffset,
          focus: _selection.focusOffset,
          sameNodes: _selection.anchorNode === _node && _selection.focusNode === _node,
          active: document.activeElement.tagName
        };
      }, COPY_SELECTOR);
      ASSERT.deepEqual(_state, {
        text: _state.before,
        before: _state.before,
        anchor: 5,
        focus: 1,
        sameNodes: true,
        active: 'BODY'
      });
    });

    await _suite.test(
      'IME candidates defer conversion and committing updates all affected results once',
      async (_test) => {
        const _tab = await _page(_test);
        await _tab.locator('#input-area').fill('id\n1');
        const _state = await _tab.evaluate(() => {
          const $input = document.querySelector('#input-area');
          const $output = document.querySelector('#output-tsv');
          const _convert = window._convertNumberAdjustment;
          let _calls = 0;
          window._convertNumberAdjustment = (..._args) => {
            _calls += 1;
            return _convert(..._args);
          };
          $input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
          for (const _value of ['id\nに', 'id\n日本', 'id\n日本語']) {
            $input.value = _value;
            $input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
          }
          const _during = { calls: _calls, output: $output.value };
          $input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
          $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
          return { during: _during, calls: _calls, output: $output.value };
        });
        ASSERT.deepEqual(_state, { during: { calls: 0, output: 'id\t1' }, calls: 1, output: 'id\t日本語' });
        ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /'日本語'/);
      }
    );

    await _suite.test('copying reconciles input changed without an input event', async (_test) => {
      const _tab = await _page(_test, () => {
        window._written = [];
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: async (_text) => window._written.push(_text) }
        });
      });
      await _tab.locator('#input-area').fill('previous');
      await _tab.evaluate(() => {
        document.querySelector('#input-area').value = 'current';
      });
      await _tab.locator(COPY_SELECTOR).click();
      ASSERT.deepEqual(await _tab.evaluate(() => window._written), ["in ('current');"]);
    });

    await _suite.test(
      'invalid parameters expose their state and recover without additional controls',
      async (_test) => {
        const _tab = await _page(_test);
        const _count = await _tab.locator('*').count();
        await _tab.locator('#input-area').fill('id\n1');
        await _tab.locator('#pg-table-name').fill('invalid;name');
        ASSERT.equal(await _tab.locator('#pg-table-name').getAttribute('aria-invalid'), 'true');
        ASSERT.equal(await _tab.locator('#output-pg-sql').inputValue(), '');
        await _tab.locator('#pg-table-name').fill('valid_name');
        ASSERT.equal(await _tab.locator('#pg-table-name').getAttribute('aria-invalid'), 'false');
        for (const _offset of ['1.5', '1e3']) {
          await _tab.locator('#number-offset').fill(_offset);
          ASSERT.equal(await _tab.locator('#number-offset').getAttribute('aria-invalid'), 'true');
          ASSERT.equal(await _tab.locator('#output-number-adjust').inputValue(), 'id\n1');
        }
        await _tab.locator('#number-offset').fill('-2');
        ASSERT.equal(await _tab.locator('#number-offset').getAttribute('aria-invalid'), 'false');
        ASSERT.equal(await _tab.locator('#output-number-adjust').inputValue(), 'id\n-1');
        ASSERT.equal(await _tab.locator('*').count(), _count);
      }
    );

    await _suite.test(
      'copy feedback is described accessibly and unchanged labels are not announced again',
      async (_test) => {
        const _tab = await _page(_test, () => {
          Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } });
        });
        await _tab.locator('#input-area').fill('copy feedback');
        await _tab.locator(COPY_SELECTOR).click();
        const _description = await _tab.locator(COPY_SELECTOR).getAttribute('aria-describedby');
        ASSERT.ok(_description);
        ASSERT.equal(await _tab.locator(`#${_description}`).textContent(), 'コピーしました');
        ASSERT.equal(await _tab.locator(`#${_description}`).getAttribute('role'), 'status');
        await _tab.locator('#input-area').fill('changed');
        ASSERT.equal(await _tab.locator(COPY_SELECTOR).getAttribute('aria-describedby'), null);
        const _changes = await _tab.evaluate(async () => {
          let _changes = 0;
          const _observer = new MutationObserver((_records) => {
            _changes += _records.length;
          });
          document
            .querySelectorAll('.copy-label')
            .forEach(($label) => _observer.observe($label, { childList: true, characterData: true, subtree: true }));
          document.querySelector('#input-area').value = '';
          document.querySelector('#input-area').dispatchEvent(new Event('input', { bubbles: true }));
          await Promise.resolve();
          _observer.disconnect();
          return _changes;
        });
        ASSERT.equal(_changes, 0);
      }
    );

    await _suite.test('keyboard users can toggle the theme and copy without losing button focus', async (_test) => {
      const _tab = await _page(_test, () => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } });
      });
      // macOSのWebKitでは、テキスト入力以外のフォーム部品にも移動するためにOption+Tabを使う。
      const _tabKey = _name === 'webkit' ? 'Alt+Tab' : 'Tab';
      await _tab.keyboard.press(_tabKey);
      ASSERT.equal(await _tab.evaluate(() => document.activeElement.id), 'lightModeToggle');
      await _tab.keyboard.press('Space');
      ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'dark');
      await _tab.keyboard.press(_tabKey);
      ASSERT.equal(await _tab.evaluate(() => document.activeElement.id), 'input-area');
      await _tab.keyboard.insertText('keyboard');
      await _tab.keyboard.press(_tabKey);
      ASSERT.equal(await _tab.evaluate(() => document.activeElement.dataset.copyTarget), '#output-a5m2');
      await _tab.keyboard.press('Enter');
      ASSERT.equal(await _tab.locator('[data-copy-target="#output-a5m2"] .copy-label').textContent(), 'コピーしました');
      ASSERT.equal(await _tab.evaluate(() => document.activeElement.dataset.copyTarget), '#output-a5m2');
      ASSERT.notEqual(await _tab.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
    });

    await _suite.test('an invalid table name stops before parsing a large input', async (_test) => {
      const _tab = await _page(_test);
      await _tab.locator('#pg-table-name').fill('invalid;');
      await _tab.evaluate(() => {
        window._parseCalls = 0;
        const _parse = window._parseTabularInput;
        window._parseTabularInput = (..._args) => {
          window._parseCalls += 1;
          return _parse(..._args);
        };
      });
      await _tab.locator('#input-area').evaluate(($input) => {
        $input.value = 'id\n' + Array.from({ length: 10000 }, (_, _index) => String(_index)).join('\n');
        $input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      ASSERT.equal(await _tab.evaluate(() => window._parseCalls), 0);
      ASSERT.equal(await _tab.locator('#output-pg-sql').inputValue(), '');
      await _tab.locator('#pg-table-name').fill('records');
      ASSERT.equal(await _tab.evaluate(() => window._parseCalls), 1);
      ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /INSERT INTO "records"/);
    });

    await _suite.test('continuous input is saved even before the debounce becomes idle', async (_test) => {
      const _tab = await _page(_test);
      const _stored = await _tab.evaluate(async (_key) => {
        const $input = document.querySelector('#input-area');
        for (let _index = 0; _index < 25; _index += 1) {
          $input.value = `typing-${_index}`;
          $input.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((_resolve) => setTimeout(_resolve, 100));
        }
        return JSON.parse(localStorage.getItem(_key));
      }, STORAGE_KEY);
      ASSERT.ok(_stored?.input.startsWith('typing-'));
    });

    await _suite.test(
      'native fallback selects exact output and dispatches copy without changing the clipboard',
      async (_test) => {
        const _tab = await _page(_test, () => {
          Object.defineProperty(navigator, 'clipboard', { value: undefined });
          window._copyEvents = [];
          document.addEventListener('copy', (_event) => {
            const $target = document.activeElement;
            window._copyEvents.push($target.value.slice($target.selectionStart, $target.selectionEnd));
            // ブラウザの実際のイベントを確認し、システムのクリップボードへの書き込みは取り消す。
            _event.preventDefault();
          });
        });
        await _tab.locator('#input-area').fill("日本語\nO'Reilly");
        const _expected = await _tab.locator('#output-sql-in').inputValue();
        await _tab.locator(COPY_SELECTOR).click();
        ASSERT.deepEqual(await _tab.evaluate(() => window._copyEvents), [_expected]);
      }
    );

    await _suite.test('HTML-like and script-like input remains inert text', async (_test) => {
      const _tab = await _page(_test);
      const _input =
        'id\tnote\n1\t</textarea><img src=https://example.invalid/qa onerror=alert(1)><script>window._injected=true</script>';
      await _tab.locator('#input-area').fill(_input);
      ASSERT.equal(await _tab.evaluate(() => window._injected), undefined);
      ASSERT.equal(await _tab.locator('img').count(), 0);
      ASSERT.ok((await _tab.locator('#output-pg-sql').inputValue()).includes('</textarea>'));
    });

    await _suite.test('100,000 rows retain the final record and parameter changes stay fast', async (_test) => {
      const _tab = await _page(_test);
      const _result = await _tab.evaluate(() => {
        const qs = (_selector) => document.querySelector(_selector);
        const $input = qs('#input-area');
        $input.value =
          'id\tvalue\n' + Array.from({ length: 100000 }, (_, _index) => `${_index}\trow${_index}`).join('\n');
        const _start = performance.now();
        $input.dispatchEvent(new Event('input', { bubbles: true }));
        const _convert = performance.now() - _start;
        const _sql = qs('#output-pg-sql').value;
        const $offset = qs('#number-offset');
        $offset.value = '1';
        const _adjustStart = performance.now();
        $offset.dispatchEvent(new Event('input', { bubbles: true }));
        return {
          convert: _convert,
          adjust: performance.now() - _adjustStart,
          count: (_sql.match(/^  \(/gm) || []).length,
          last: _sql.includes("('99999', 'row99999')"),
          adjusted: qs('#output-number-adjust').value.endsWith('100000\trow100000')
        };
      });
      ASSERT.equal(_result.count, 100000);
      ASSERT.equal(_result.last, true);
      ASSERT.equal(_result.adjusted, true);
      ASSERT.ok(_result.convert < 5000 && _result.adjust < 5000);
      _test.diagnostic(
        `100,000 rows: ${_result.convert.toFixed(1)} ms; adjustment only: ${_result.adjust.toFixed(1)} ms`
      );
    });

    await _suite.test('10,000 rows convert completely within a bounded time', async (_test) => {
      const _tab = await _page(_test);
      const _result = await _tab.evaluate(() => {
        const qs = (_selector) => document.querySelector(_selector);
        const $input = qs('#input-area');
        $input.value =
          'id\tnote\n' + Array.from({ length: 10000 }, (_, _index) => `${_index}\trow${_index}`).join('\n');
        const _start = performance.now();
        $input.dispatchEvent(new Event('input', { bubbles: true }));
        const _elapsed = performance.now() - _start;
        const _sql = qs('#output-pg-sql').value;
        return {
          elapsed: _elapsed,
          rows: (_sql.match(/^  \(/gm) || []).length,
          last: _sql.includes("('9999', 'row9999')")
        };
      });
      ASSERT.equal(_result.rows, 10000);
      ASSERT.equal(_result.last, true);
      ASSERT.ok(_result.elapsed < 5000, `conversion took ${_result.elapsed}ms`);
      _test.diagnostic(`10,000 rows: ${_result.elapsed.toFixed(1)} ms`);
    });
  });
}
