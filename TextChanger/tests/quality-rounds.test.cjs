const { test } = require('node:test');
const ASSERT = require('node:assert/strict');
const PATH = require('node:path');
const { pathToFileURL } = require('node:url');
const PLAYWRIGHT = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const HTML_URL = pathToFileURL(process.env.TEXTCHANGER_HTML || PATH.join(__dirname, '..', 'text-changer.html')).href;
const BROWSERS = (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',');
const STORAGE_KEY = 'textChanger_settings';
const COPY_SELECTOR = '[data-copy-target="#output-sql-in"]';

async function _page(_test, _name, _init) {
  const _browser = await PLAYWRIGHT[_name].launch({ headless: true });
  const _errors = [];
  const _requests = [];
  _test.after(async () => {
    await _browser.close();
    ASSERT.deepEqual(_errors, [], 'no console errors or uncaught exceptions');
    ASSERT.deepEqual(_requests, [], 'no external network requests');
  });
  const _context = await _browser.newContext();
  await _context.route(/^https?:/, async (_route) => {
    _requests.push(_route.request().url());
    await _route.abort();
  });
  if (_init) await _context.addInitScript(_init);
  const _tab = await _context.newPage();
  _tab.on('pageerror', (_error) => _errors.push(_error.message));
  _tab.on('console', (_message) => {
    if (_message.type() === 'error') _errors.push(_message.text());
  });
  await _tab.goto(HTML_URL);
  return _tab;
}

for (const _name of BROWSERS) {
  test(`${_name}: R16 committed input recovers a missing compositionend without waiting for blur`, async (_test) => {
    const _tab = await _page(_test, _name);
    for (const [_id, _before, _after, _output] of [
      ['input-area', 'before', '日本語', 'output-tsv'],
      ['pg-table-name', 'records', '売上', 'output-pg-sql']
    ]) {
      await _tab.locator('#input-area').fill('id\n1');
      await _tab.locator(`#${_id}`).fill(_before);
      const _result = await _tab.evaluate(
        ({ _id, _after, _output }) => {
          const $control = document.getElementById(_id);
          const $output = document.getElementById(_output);
          $control.focus();
          const _before = $output.value;
          let _conversions = 0;
          const _convert = window._convertAll;
          window._convertAll = () => {
            _conversions += 1;
            _convert();
          };
          $control.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
          $control.value = _after;
          $control.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
          // 別の入力欄で通常の入力が発生しても、この入力欄のIME変換を終了させない。
          document
            .querySelector('#number-offset')
            .dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: false }));
          const _during = $output.value;
          const _duringConversions = _conversions;
          $control.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: false }));
          const _afterCommit = $output.value;
          // 遅れて届いたIME終了通知で、確定済みの変換処理を繰り返さない。
          $control.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
          window._convertAll = _convert;
          return {
            before: _before,
            during: _during,
            duringConversions: _duringConversions,
            after: _afterCommit,
            conversions: _conversions,
            active: document.activeElement.id
          };
        },
        { _id, _after, _output }
      );
      ASSERT.equal(_result.during, _result.before);
      ASSERT.equal(_result.duringConversions, 0);
      if (_id === 'input-area') ASSERT.equal(_result.after, '日本語');
      else ASSERT.match(_result.after, /INSERT INTO "売上"/);
      ASSERT.equal(_result.conversions, 1);
      ASSERT.equal(_result.active, _id);
      await _tab.waitForFunction(
        ({ _key, _field, _after }) => JSON.parse(localStorage.getItem(_key))?.[_field] === _after,
        { _key: STORAGE_KEY, _field: _id === 'input-area' ? 'input' : 'pgTableName', _after }
      );
    }
  });

  test(`${_name}: R17 oversized quoted table-name pastes remain recoverable`, async (_test) => {
    const _tab = await _page(_test, _name);
    await _tab.locator('#input-area').fill('id\n1');
    const _elapsed = await _tab.evaluate(() => {
      const $table = document.querySelector('#pg-table-name');
      $table.value = '"' + '""'.repeat(1000000) + '"';
      const _start = performance.now();
      $table.dispatchEvent(new Event('input'));
      return performance.now() - _start;
    });
    ASSERT.equal(await _tab.locator('#pg-table-name').getAttribute('aria-invalid'), 'true');
    ASSERT.equal(await _tab.locator('#output-pg-sql').inputValue(), '');
    ASSERT.equal(await _tab.locator('[data-copy-target="#output-pg-sql"]').isDisabled(), true);
    ASSERT.equal(await _tab.locator('#output-tsv').inputValue(), 'id\t1');
    await _tab.locator('#pg-table-name').fill('records');
    ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /INSERT INTO "records"/);
    ASSERT.equal(await _tab.locator('#pg-table-name').getAttribute('aria-invalid'), 'false');
    _test.diagnostic(`2,000,002-character invalid table name: ${_elapsed.toFixed(1)} ms`);
  });

  test(`${_name}: R01 copied output is reconciled even when only output fields were restored`, async (_test) => {
    const _tab = await _page(_test, _name, () => {
      window._written = [];
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async (_text) => window._written.push(_text) }
      });
    });
    await _tab.locator('#input-area').fill('id\n1');
    const _expected = await _tab
      .locator('.output-area')
      .evaluateAll((_outputs) => _outputs.map(($output) => $output.value));
    await _tab.evaluate(() =>
      document.querySelectorAll('.output-area').forEach(($output) => {
        $output.value = 'stale restored output';
      })
    );
    await _tab.locator(COPY_SELECTOR).click();
    ASSERT.deepEqual(await _tab.evaluate(() => window._written), [_expected[2]]);
    ASSERT.deepEqual(
      await _tab.locator('.output-area').evaluateAll((_outputs) => _outputs.map(($output) => $output.value)),
      _expected
    );
  });

  test(`${_name}: R02 pending copy rechecks eventless source changes before fallback and feedback`, async (_test) => {
    const _tab = await _page(_test, _name, () => {
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
    for (const [_field, _value, _target] of [
      ['input-area', 'id\n2', '#output-sql-in'],
      ['pg-table-name', 'updated', '#output-pg-sql'],
      ['number-offset', '5', '#output-number-adjust']
    ]) {
      for (const _action of ['_resolve', '_reject']) {
        await _tab.locator('#input-area').fill('id\n1');
        await _tab.locator('#pg-table-name').fill('records');
        await _tab.locator('#number-offset').fill('1');
        await _tab.locator(`[data-copy-target="${_target}"]`).click();
        await _tab.evaluate(
          ([_field, _value, _action]) => {
            document.getElementById(_field).value = _value;
            window._pending.shift()[_action]();
          },
          [_field, _value, _action]
        );
        ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 0);
        ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
      }
    }
  });

  test(`${_name}: R03 hidden pages cancel copies and visible pages reconcile restored controls`, async (_test) => {
    const _tab = await _page(_test, _name, () => {
      window._pending = [];
      window._fallbackCalls = 0;
      window._visibility = 'visible';
      Object.defineProperty(document, 'visibilityState', { get: () => window._visibility });
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => new Promise((_resolve, _reject) => window._pending.push({ _resolve, _reject })) }
      });
      document.execCommand = () => {
        window._fallbackCalls += 1;
        return true;
      };
    });
    await _tab.locator('#input-area').fill('id\n1');
    for (const _action of ['_resolve', '_reject']) {
      await _tab.locator(COPY_SELECTOR).click();
      await _tab.evaluate((_action) => {
        window._visibility = 'hidden';
        document.dispatchEvent(new Event('visibilitychange'));
        window._pending.shift()[_action]();
      }, _action);
      ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 0);
      ASSERT.equal(await _tab.evaluate(() => window._fallbackCalls), 0);
      await _tab.evaluate(() => {
        window._visibility = 'visible';
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await _tab.evaluate(() => {
      window._visibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
      document.querySelector('#input-area').value = 'id\n9';
      document.querySelector('#lightModeToggle').checked = false;
      document.querySelector('#output-tsv').value = 'old';
      window._visibility = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    ASSERT.equal(await _tab.locator('#output-tsv').inputValue(), 'id\t9');
    ASSERT.equal(await _tab.evaluate(() => document.documentElement.style.colorScheme), 'dark');
    await _tab.waitForFunction((_key) => JSON.parse(localStorage.getItem(_key))?.input === 'id\n9', STORAGE_KEY);
  });

  test(`${_name}: R04 composition belongs to its control and blur recovers a missing compositionend`, async (_test) => {
    const _tab = await _page(_test, _name);
    await _tab.locator('#input-area').fill('id\n1');
    const _states = await _tab.evaluate(() => {
      const $input = document.querySelector('#input-area');
      const $table = document.querySelector('#pg-table-name');
      const $output = document.querySelector('#output-tsv');
      $input.focus();
      $input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      $input.value = 'id\n日本語';
      $input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      $table.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      const _unrelatedEnd = $output.value;
      $table.focus();
      const _afterBlur = $output.value;
      $table.value = 'records';
      $table.dispatchEvent(new InputEvent('input', { bubbles: true }));
      const _sql = document.querySelector('#output-pg-sql').value;
      $table.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      $table.value = '売上';
      $table.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      $input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      const _lateEnd = document.querySelector('#output-pg-sql').value;
      $table.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      return {
        unrelatedEnd: _unrelatedEnd,
        afterBlur: _afterBlur,
        sql: _sql,
        lateEnd: _lateEnd,
        final: document.querySelector('#output-pg-sql').value
      };
    });
    ASSERT.equal(_states.unrelatedEnd, 'id\t1');
    ASSERT.equal(_states.afterBlur, 'id\t日本語');
    ASSERT.match(_states.sql, /INSERT INTO "records"/);
    ASSERT.equal(_states.lateEnd, _states.sql);
    ASSERT.match(_states.final, /INSERT INTO "売上"/);
  });

  test(`${_name}: R05 change-only edits update all controls and save without duplicate conversions`, async (_test) => {
    const _tab = await _page(_test, _name);
    await _tab.evaluate(() => {
      for (const [_id, _value] of [
        ['input-area', 'id\n7'],
        ['pg-table-name', 'autofilled'],
        ['number-offset', '3']
      ]) {
        const $control = document.getElementById(_id);
        $control.value = _value;
        $control.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    ASSERT.equal(await _tab.locator('#output-tsv').inputValue(), 'id\t7');
    ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /INSERT INTO "autofilled"/);
    ASSERT.equal(await _tab.locator('#output-number-adjust').inputValue(), 'id\n10');
    await _tab.waitForFunction((_key) => JSON.parse(localStorage.getItem(_key))?.numberOffset === '3', STORAGE_KEY);
    const _calls = await _tab.evaluate(() => {
      const _convert = window._convertNumberAdjustment;
      let _calls = 0;
      window._convertNumberAdjustment = (..._args) => {
        _calls += 1;
        return _convert(..._args);
      };
      const $input = document.querySelector('#input-area');
      $input.value = 'id\n8';
      $input.dispatchEvent(new Event('input', { bubbles: true }));
      $input.dispatchEvent(new Event('change', { bubbles: true }));
      return _calls;
    });
    ASSERT.equal(_calls, 1);
  });

  test(`${_name}: R06 saving one preference does not resurrect externally deleted text`, async (_test) => {
    const _tab = await _page(_test, _name);
    await _tab.locator('#input-area').fill('previously saved');
    await _tab.locator('#pg-table-name').fill('previous_table');
    await _tab.locator('#number-offset').fill('8');
    await _tab.evaluate((_key) => {
      window.dispatchEvent(new Event('pagehide'));
      localStorage.removeItem(_key);
    }, STORAGE_KEY);
    await _tab.locator('label[for="lightModeToggle"]').click();
    ASSERT.deepEqual(await _tab.evaluate((_key) => JSON.parse(localStorage.getItem(_key)), STORAGE_KEY), {
      theme: 'dark'
    });
    ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'previously saved');
    await _tab.locator('#input-area').fill('explicitly edited again');
    await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    ASSERT.deepEqual(await _tab.evaluate((_key) => JSON.parse(localStorage.getItem(_key)), STORAGE_KEY), {
      theme: 'dark',
      input: 'explicitly edited again'
    });
    await _tab.reload();
    ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'explicitly edited again');
    ASSERT.equal(await _tab.locator('#pg-table-name').inputValue(), '');
    ASSERT.equal(await _tab.locator('#number-offset').inputValue(), '');
  });

  test(`${_name}: R07 page restoration reuses valid results without losing output repair or selection`, async (_test) => {
    const _tab = await _page(_test, _name);
    const _state = await _tab.evaluate(() => {
      const $input = document.querySelector('#input-area');
      const $output = document.querySelector('#output-pg-sql');
      $input.value = 'id\tvalue\n' + Array.from({ length: 10000 }, (_, _index) => `${_index}\trow${_index}`).join('\n');
      $input.dispatchEvent(new Event('input', { bubbles: true }));
      const _expected = $output.value;
      $input.setSelectionRange(10, 20, 'backward');
      const _calls = { lines: 0, table: 0, number: 0 };
      for (const [_name, _key] of [
        ['_getLines', 'lines'],
        ['_parseTabularInput', 'table'],
        ['_convertNumberAdjustment', 'number']
      ]) {
        const _original = window[_name];
        window[_name] = (..._args) => {
          _calls[_key] += 1;
          return _original(..._args);
        };
      }
      const _start = performance.now();
      for (let _index = 0; _index < 5; _index += 1) {
        $output.value = 'restored old SQL';
        window.dispatchEvent(new Event('pageshow'));
      }
      const _elapsed = performance.now() - _start;
      const _unchangedCalls = { ..._calls };
      const _repaired = $output.value === _expected;
      document.querySelector('#pg-table-name').value = 'new_table';
      window.dispatchEvent(new Event('pageshow'));
      return {
        unchangedCalls: _unchangedCalls,
        calls: _calls,
        repaired: _repaired,
        selection: [$input.selectionStart, $input.selectionEnd, $input.selectionDirection],
        elapsed: _elapsed,
        changed: $output.value.includes('INSERT INTO "new_table"')
      };
    });
    ASSERT.deepEqual(_state.unchangedCalls, { lines: 0, table: 0, number: 0 });
    ASSERT.deepEqual(_state.calls, { lines: 0, table: 0, number: 0 });
    ASSERT.equal(_state.repaired, true);
    ASSERT.equal(_state.changed, true);
    ASSERT.deepEqual(_state.selection, [10, 20, 'backward']);
    _test.diagnostic(`5 restorations of 10,000 rows: ${_state.elapsed.toFixed(1)} ms`);
  });

  test(`${_name}: R08 malformed large tables remain all-or-nothing and recover on correction`, async (_test) => {
    const _tab = await _page(_test, _name);
    const _timing = await _tab.evaluate(() => {
      const _tail = Array.from({ length: 100000 }, (_, _index) => `${_index}\tvalue${_index}`).join('\n');
      const _cases = ['id\tid\n', 'id\t\n', 'id\tvalue\nbad\n'];
      const _times = [];
      const _results = [];
      for (const _prefix of _cases) {
        const _text = _prefix + _tail;
        const _start = performance.now();
        _results.push(window._convertPostgreSQLBlock(_text, 'records'));
        _times.push(performance.now() - _start);
      }
      return { times: _times, results: _results };
    });
    ASSERT.deepEqual(_timing.results, ['', '', '']);
    for (const _input of ['id\tid\n1\t2', 'id\tvalue\n1\tgood\n2', 'id\tvalue\n1\tgood\n2\t"unclosed']) {
      await _tab.locator('#input-area').fill(_input);
      ASSERT.equal(await _tab.locator('#output-pg-sql').inputValue(), '');
      ASSERT.equal(await _tab.locator('[data-copy-target="#output-pg-sql"]').isDisabled(), true);
      ASSERT.notEqual(await _tab.locator('#output-tsv').inputValue(), '');
    }
    await _tab.locator('#input-area').fill('id\tvalue\n1\tgood\n2\t"repaired\nvalue"');
    ASSERT.match(await _tab.locator('#output-pg-sql').inputValue(), /\('2', 'repaired\nvalue'\)/);
    _test.diagnostic(`100,000-row invalid tables: ${_timing.times.map((_time) => _time.toFixed(1)).join(', ')} ms`);
  });

  test(`${_name}: R09 validity changes are exposed once and incomplete native numbers still recover`, async (_test) => {
    const _tab = await _page(_test, _name);
    const _unchanged = await _tab.evaluate(async () => {
      const $input = document.querySelector('#input-area');
      const _records = [];
      const _observer = new MutationObserver((_changes) => _records.push(..._changes));
      for (const _id of ['pg-table-name', 'number-offset']) {
        _observer.observe(document.getElementById(_id), { attributes: true, attributeFilter: ['aria-invalid'] });
      }
      for (let _index = 0; _index < 10; _index += 1) {
        $input.value = `id\n${_index}`;
        $input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await Promise.resolve();
      _observer.disconnect();
      return _records.length;
    });
    ASSERT.equal(_unchanged, 0);
    for (const [_id, _invalid, _valid] of [
      ['pg-table-name', 'bad;', 'records'],
      ['number-offset', '1.5', '-2']
    ]) {
      await _tab.locator(`#${_id}`).fill(_invalid);
      ASSERT.equal(await _tab.locator(`#${_id}`).getAttribute('aria-invalid'), 'true');
      await _tab.locator(`#${_id}`).fill(_valid);
      ASSERT.equal(await _tab.locator(`#${_id}`).getAttribute('aria-invalid'), 'false');
    }
    await _tab.locator('#number-offset').fill('');
    await _tab.locator('#number-offset').press('-');
    const _invalid = await _tab.locator('#number-offset').evaluate(($input) => $input.validity.badInput);
    ASSERT.equal(await _tab.locator('#number-offset').getAttribute('aria-invalid'), String(_invalid));
    await _tab.locator('#number-offset').press('Backspace');
    ASSERT.equal(await _tab.locator('#number-offset').getAttribute('aria-invalid'), 'false');
  });

  test(`${_name}: R10 mixed edits, copies and page restoration retain consistent results and persistence`, async (_test) => {
    const _tab = await _page(_test, _name, () => {
      window._written = [];
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async (_text) => window._written.push(_text) }
      });
    });
    const _structure = await _tab
      .locator('body *')
      .evaluateAll((_elements) => _elements.map(($element) => $element.tagName));
    for (let _step = 0; _step < 18; _step += 1) {
      const _number = 900 + _step;
      const _input = `id\n${_number}`;
      const _offset = _step % 4 === 0 ? '1.5' : String(_step - 9);
      const _table = _step % 5 === 0 ? 'invalid;' : `records_${_step}`;
      await _tab.evaluate(
        ({ _input, _offset, _table, _step }) => {
          const _eventType = _step % 2 ? 'change' : 'input';
          for (const [_id, _value] of [
            ['input-area', _input],
            ['number-offset', _offset],
            ['pg-table-name', _table]
          ]) {
            const $control = document.getElementById(_id);
            $control.value = _value;
            if (_step % 3 !== 0) $control.dispatchEvent(new Event(_eventType, { bubbles: true }));
          }
          if (_step % 3 === 0) {
            document.querySelectorAll('.output-area').forEach(($output) => {
              $output.value = 'stale restored';
            });
            window.dispatchEvent(new Event('pageshow'));
          }
        },
        { _input, _offset, _table, _step }
      );
      const _values = await _tab
        .locator('.output-area')
        .evaluateAll((_outputs) => _outputs.map(($output) => $output.value));
      ASSERT.equal(_values[0], `--*Captions id,${_number}`);
      ASSERT.equal(_values[1], `id\t${_number}`);
      ASSERT.equal(_values[2], `in ('id','${_number}');`);
      ASSERT.equal(_values[4], `id\n${_number + (Number.isInteger(Number(_offset)) ? Number(_offset) : 0)}`);
      if (_table === 'invalid;') ASSERT.equal(_values[3], '');
      else {
        ASSERT.ok(_values[3].includes(`INSERT INTO "${_table}"`));
        ASSERT.ok(_values[3].includes(`  ('${_number}')`));
      }
      await _tab.locator(COPY_SELECTOR).click();
      ASSERT.equal(await _tab.evaluate(() => window._written.at(-1)), _values[2]);
      await _tab.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      const _saved = await _tab.evaluate((_key) => JSON.parse(localStorage.getItem(_key)), STORAGE_KEY);
      ASSERT.equal(_saved.input, _input);
      ASSERT.equal(_saved.numberOffset, _offset);
      ASSERT.equal(_saved.pgTableName, _table);
      if (_step % 6 === 5) {
        await _tab.reload();
        ASSERT.deepEqual(
          await _tab.locator('.output-area').evaluateAll((_outputs) => _outputs.map(($output) => $output.value)),
          _values
        );
      }
    }
    ASSERT.deepEqual(
      await _tab.locator('body *').evaluateAll((_elements) => _elements.map(($element) => $element.tagName)),
      _structure
    );
    ASSERT.equal(await _tab.locator('.copy-btn').count(), 5);
  });

  test(`${_name}: R11 table-name edits reuse prepared SQL without rewriting cell values`, async (_test) => {
    const _tab = await _page(_test, _name);
    const _result = await _tab.evaluate(() => {
      const $input = document.querySelector('#input-area');
      const $table = document.querySelector('#pg-table-name');
      const $output = document.querySelector('#output-pg-sql');
      $input.value =
        'id\tnote\n' + Array.from({ length: 20000 }, (_, _index) => `${_index}\trecords public.orders ???`).join('\n');
      $input.dispatchEvent(new Event('input'));
      let _parses = 0;
      let _formats = 0;
      const _parse = window._parseTabularInput;
      const _format = window._formatPgValue;
      window._parseTabularInput = (..._args) => {
        _parses += 1;
        return _parse(..._args);
      };
      window._formatPgValue = (..._args) => {
        _formats += 1;
        return _format(..._args);
      };
      const _start = performance.now();
      for (const _name of ['records', 'public.orders', 'bad;', '"日本語"."a.b"', '']) {
        $table.value = _name;
        $table.dispatchEvent(new Event('input'));
        if (_name === 'bad;' && $output.value !== '') throw new Error('Invalid table accepted');
      }
      return {
        parses: _parses,
        formats: _formats,
        elapsed: performance.now() - _start,
        rows: ($output.value.match(/^  \(/gm) || []).length,
        last: $output.value.includes("('19999', 'records public.orders ???')"),
        placeholder: $output.value.includes('INSERT INTO ???')
      };
    });
    ASSERT.equal(_result.parses, 0);
    ASSERT.equal(_result.formats, 0);
    ASSERT.equal(_result.rows, 20000);
    ASSERT.equal(_result.last, true);
    ASSERT.equal(_result.placeholder, true);
    _test.diagnostic(`5 table-name edits with 20,000 rows: ${_result.elapsed.toFixed(1)} ms`);
  });

  test(`${_name}: R12 copying eventless edits persists both immediate and pending changes`, async (_test) => {
    const _tab = await _page(_test, _name, () => {
      window._pending = [];
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => new Promise((_resolve) => window._pending.push(_resolve)) }
      });
    });
    // コピー時の保存漏れを見逃さないよう、初回のpageshowによる保存が完了するまで待つ。
    await _tab.locator('#input-area').fill('previously saved');
    await _tab.evaluate(() => window._saveSettings());
    await _tab.evaluate(() => {
      document.querySelector('#input-area').value = 'copied without input';
      document.querySelector('[data-copy-target="#output-sql-in"]').click();
    });
    await _tab.waitForFunction(
      (_key) => JSON.parse(localStorage.getItem(_key))?.input === 'copied without input',
      STORAGE_KEY,
      { timeout: 2000 }
    );
    await _tab.evaluate(() => {
      document.querySelector('#input-area').value = 'changed while pending';
      window._pending.shift()();
    });
    await _tab.waitForFunction(
      (_key) => JSON.parse(localStorage.getItem(_key))?.input === 'changed while pending',
      STORAGE_KEY,
      { timeout: 2000 }
    );
    ASSERT.equal(await _tab.locator('.copy-btn.copied').count(), 0);
    await _tab.reload();
    ASSERT.equal(await _tab.locator('#input-area').inputValue(), 'changed while pending');
  });

  test(`${_name}: R13 IME commits and blur recover when compositionstart was not observed`, async (_test) => {
    const _tab = await _page(_test, _name);
    for (const _finish of ['compositionend', 'blur']) {
      await _tab.locator('#input-area').fill('before');
      const _result = await _tab.evaluate((_finish) => {
        const $input = document.querySelector('#input-area');
        const $output = document.querySelector('#output-tsv');
        $input.focus();
        $input.value = '日本語';
        $input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
        const _during = $output.value;
        if (_finish === 'blur') document.querySelector('#pg-table-name').focus();
        else $input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
        return { during: _during, after: $output.value };
      }, _finish);
      ASSERT.deepEqual(_result, { during: 'before', after: '日本語' });
    }
  });

  test(`${_name}: R14 unchanged output state does not rewrite button attributes`, async (_test) => {
    const _tab = await _page(_test, _name);
    for (const _input of ['', 'unchanged']) {
      await _tab.locator('#input-area').fill(_input);
      const _changes = await _tab.evaluate(async () => {
        const _records = [];
        const _observer = new MutationObserver((_changes) => _records.push(..._changes));
        document.querySelectorAll('.copy-btn').forEach(($button) => _observer.observe($button, { attributes: true }));
        for (let _index = 0; _index < 5; _index += 1) window._convertAll();
        await Promise.resolve();
        _observer.disconnect();
        return _records.map((_record) => _record.attributeName);
      });
      ASSERT.deepEqual(_changes, []);
    }
  });

  test(`${_name}: R15 prepared SQL retains only the latest input and recovers from invalid tables`, async (_test) => {
    const _tab = await _page(_test, _name);
    const _result = await _tab.evaluate(() => {
      let _parses = 0;
      const _parse = window._parseTabularInput;
      window._parseTabularInput = (..._args) => {
        _parses += 1;
        return _parse(..._args);
      };
      const _badInput = 'id\tid\n1\t2';
      const _validInput = 'id\nnative value';
      const _outputs = [
        window._convertPostgreSQLBlock(_badInput, 'one'),
        window._convertPostgreSQLBlock(_badInput, 'two')
      ];
      const _invalidParses = _parses;
      _outputs.push(window._convertPostgreSQLBlock(_validInput, 'three'));
      _outputs.push(window._convertPostgreSQLBlock(_badInput, 'four'));
      return { outputs: _outputs, invalidParses: _invalidParses, parses: _parses };
    });
    ASSERT.equal(_result.invalidParses, 1);
    ASSERT.equal(_result.parses, 3);
    ASSERT.deepEqual([_result.outputs[0], _result.outputs[1], _result.outputs[3]], ['', '', '']);
    ASSERT.match(_result.outputs[2], /INSERT INTO "three"/);
    ASSERT.match(_result.outputs[2], /'native value'/);
  });
}
