const { test } = require('node:test');
const ASSERT = require('node:assert/strict');
const { _call, _plain, _tsv, _samples } = require('./helpers.cjs');

test('ordinary conversion and blank input remain compatible', () => {
  const _lines = _call('_getLines', ' apple \r\n\nbanana\n cherry ');
  ASSERT.equal(_call('_convertA5m2', _lines), '--*Captions apple,banana,cherry');
  ASSERT.equal(_call('_convertTsv', _lines), 'apple\tbanana\tcherry');
  ASSERT.equal(_call('_convertSqlIn', _lines), "in ('apple','banana','cherry');");
  for (const _name of ['_convertA5m2', '_convertTsv', '_convertSqlIn']) {
    ASSERT.equal(_call(_name, []), '');
  }
});

test('line conversion handles LF, CRLF and CR', () => {
  ASSERT.deepEqual(_plain(_call('_getLines', 'a\rb\r\nc\nd')), ['a', 'b', 'c', 'd']);
});

test('SQL IN keeps apostrophes inside their literal', () => {
  ASSERT.equal(
    _call('_convertSqlIn', ["O'Reilly", "x'); DROP TABLE t;--"]),
    "in ('O''Reilly','x''); DROP TABLE t;--');"
  );
});

test('Excel TSV preserves embedded tabs and quotes as one cell', () => {
  ASSERT.equal(_call('_convertTsv', ['a\tb', 'say "yes"', 'plain']), '"a\tb"\t"say ""yes"""\tplain');
});

test('tabular parser reads quoted multiline cells, escaped quotes and CRLF', () => {
  ASSERT.deepEqual(_plain(_call('_parseTabularInput', 'id\tnote\r\n1\t"first\r\nsecond\t""quoted"""\r\n')), {
    headers: ['id', 'note'],
    rows: [['1', 'first\nsecond\t"quoted"']]
  });
});

test('one malformed row invalidates the whole table instead of silently dropping it', () => {
  for (const _input of [
    'id\tname\n1\tone\n2',
    'id\tname\n1\tone\n2\ttwo\textra',
    'id\tname\n1\tone\n2\t"unclosed',
    'id\tname\n1\t"a"junk'
  ]) {
    ASSERT.equal(_call('_convertPostgreSQLBlock', _input, 'records'), '');
  }
});

test('duplicate, empty, NUL and overlong PostgreSQL column identifiers are rejected', () => {
  for (const _input of ['id\tid\n1\t2', 'id\t\n1\t2', 'id\0\n1', `${'あ'.repeat(22)}\n1`]) {
    ASSERT.equal(_call('_convertPostgreSQLBlock', _input, 'records'), '');
  }
});

test('blank records are skipped but tab-delimited empty cells are retained', () => {
  const _sql = _call('_convertPostgreSQLBlock', '\nid\tnote\n\t\n\n', 'records');
  ASSERT.match(_sql, /\(' ', ' '\)/);
  ASSERT.equal((_sql.match(/WHERE 1 = 0/g) || []).length, 2);
});

test('PostgreSQL literals preserve meaningful whitespace and backslashes', () => {
  const _sql = _call('_convertPostgreSQLBlock', "id\tnote\n1\t  O'Reilly\\docs  ", 'records');
  ASSERT.ok(_sql.includes("E'  O''Reilly\\\\docs  '"));
  ASSERT.equal(_call('_convertPostgreSQLBlock', 'id\nnul\0value', 'records'), '');
});

test('only supported NULL tokens become NULL; empty cells keep their existing semantics', () => {
  for (const _token of ['NULL', 'null', '<< NULL >>', '< NULL >', '« NULL »']) {
    const _sql = _call('_convertPostgreSQLBlock', `id\tnote\n1\t${_token}`, 'records');
    ASSERT.match(_sql, /\('1', NULL\)/);
    ASSERT.doesNotMatch(_sql, /"note" =|"note" IS NULL/);
  }
  ASSERT.equal(_call('_isPgNullToken', '<NULL»'), false);
  ASSERT.equal(_call('_normalizePgInsertValue', ' \t '), ' ');
});

test('table names are identifiers, including schema, reserved words and quoted dots', () => {
  ASSERT.equal(_call('_getResolvedPgTableName', ''), '???');
  ASSERT.equal(_call('_getResolvedPgTableName', 'Public.Order'), '"public"."order"');
  ASSERT.equal(_call('_getResolvedPgTableName', '"My.Schema"."a""b"'), '"My.Schema"."a""b"');
  ASSERT.equal(_call('_getResolvedPgTableName', '売上'), '"売上"');
  for (const _table of [
    'records; DELETE FROM other;--',
    'records WHERE true--',
    'a..b',
    '"unclosed',
    '""',
    'x'.repeat(64)
  ]) {
    ASSERT.equal(_call('_convertPostgreSQLBlock', 'id\n1', _table), '');
  }
});

test('SELECT and DELETE always share bounded conditions', () => {
  const _sql = _call('_convertPostgreSQLBlock', 'id\tnote\n1\tone\n2\tNULL', 'records');
  const _conditions = [..._sql.matchAll(/WHERE ([\s\S]*?)\n;/g)].map((_match) => _match[1]);
  ASSERT.equal(_conditions.length, 2);
  ASSERT.equal(_conditions[0], _conditions[1]);
  ASSERT.equal((_sql.match(/BEGIN;/g) || []).length, 2);
  ASSERT.equal((_sql.match(/COMMIT;/g) || []).length, 2);
});

test('integer adjustment is exact beyond Number.MAX_SAFE_INTEGER', () => {
  ASSERT.equal(
    _call('_convertNumberAdjustment', 'ID9007199254740992\nID99999999999999999999', '1'),
    'ID9007199254740993\nID100000000000000000000'
  );
  ASSERT.equal(_call('_convertNumberAdjustment', 'ID1', '9007199254740993'), 'ID9007199254740994');
  ASSERT.equal(_call('_convertNumberAdjustment', `ID${'9'.repeat(400)}`, '1'), `ID1${'0'.repeat(400)}`);
});

test('invalid offsets are never partially parsed', () => {
  for (const _offset of ['', '0', '1.5', '1e3', '2tail', 'Infinity', '--1']) {
    ASSERT.equal(_call('_convertNumberAdjustment', 'No.001\r\n\nNo.2', _offset), 'No.001\r\n\nNo.2');
  }
  ASSERT.equal(_call('_convertNumberAdjustment', 'No.1\n\nNo.2', '-2'), 'No.-1\n\nNo.0');
});

test('BOM before a quoted TSV header is a file marker, not cell data', () => {
  ASSERT.deepEqual(_plain(_call('_parseTabularInput', '\ufeff"id"\t"value"\r\n"1"\t"text"')), {
    headers: ['id', 'value'],
    rows: [['1', 'text']]
  });
});

test('SQL rejects NUL and unpaired surrogates instead of silently corrupting values', () => {
  for (const _invalid of ['\0', '\ud800', '\udfff', 'a\ud800z']) {
    ASSERT.equal(_call('_convertSqlIn', ['normal', _invalid]), '');
    ASSERT.equal(_call('_convertPostgreSQLBlock', `id\tvalue\n1\t${_invalid}`, 'records'), '');
    ASSERT.equal(_call('_convertPostgreSQLBlock', 'id\n1', `"${_invalid}"`), '');
  }
  ASSERT.notEqual(_call('_convertPostgreSQLBlock', 'id\n😀', 'records'), '');
});

test('1,000 generated TSV records round-trip without changing cells or row counts', () => {
  const _rows = _samples(1000).map((_value, _index) => [String(_index), _value, '']);
  ASSERT.deepEqual(_plain(_call('_parseTsvRecords', _tsv(_rows))), _rows);
  ASSERT.deepEqual(_plain(_call('_parseTabularInput', _tsv([['id', 'value', 'empty'], ..._rows]))).rows, _rows);
});

test('identifier byte boundaries preserve valid Unicode and reject truncation', () => {
  for (const [_name, _valid] of [
    ['x'.repeat(63), true],
    ['x'.repeat(64), false],
    ['あ'.repeat(21), true],
    ['あ'.repeat(22), false],
    ['😀'.repeat(15) + 'abc', true],
    ['😀'.repeat(16), false]
  ]) {
    ASSERT.equal(_call('_getResolvedPgTableName', `"${_name}"`) !== '', _valid);
  }
  ASSERT.equal(_call('_getResolvedPgTableName', '"a.b" . "c;--"'), '"a.b"."c;--"');
  for (const _name of ['a.', 'a . ', '.a', 'a.b.c.d', 'a"b', '"a";--'])
    ASSERT.equal(_call('_getResolvedPgTableName', _name), '');
});

test('incomplete quoted records fail as a whole, including after valid rows', () => {
  for (const _tail of ['"', '"abc', '"a"b', '"a" ', '"a""']) {
    ASSERT.equal(_call('_convertPostgreSQLBlock', `id\tvalue\n1\tok\n2\t${_tail}`, 'records'), '');
  }
});

test('duplicate predicates are compacted while every INSERT row is preserved', () => {
  const _sql = _call('_convertPostgreSQLBlock', 'id\tvalue\n1\tx\n1\tx\nNULL\tNULL', 'records');
  ASSERT.equal((_sql.match(/^  \(/gm) || []).length, 3);
  ASSERT.equal((_sql.match(/"id" = '1'/g) || []).length, 2);
  ASSERT.doesNotMatch(_sql, /\n   OR /);
});

test('integer arithmetic satisfies an independent long-decimal carry case', () => {
  for (let _width = 1; _width <= 1000; _width += 37) {
    ASSERT.equal(_call('_convertNumberAdjustment', '9'.repeat(_width), '1'), '1' + '0'.repeat(_width));
    ASSERT.equal(_call('_convertNumberAdjustment', '1' + '0'.repeat(_width), '-1'), '9'.repeat(_width));
  }
});

test('A5M2 uses the documented pseudo-command syntax and rejects ambiguous captions', () => {
  ASSERT.equal(_call('_convertA5m2', ['列A', '列B']), '--*Captions 列A,列B');
  for (const _value of ['姓,名', 'a\nb', '\0', '\ud800']) {
    ASSERT.equal(_call('_convertA5m2', [_value, 'other']), '');
  }
});

test('long TSV cells retain every character across quotes, delimiters and record boundaries', () => {
  const _long = '日本語abcdefghij'.repeat(100000);
  const _rows = [
    ['id', 'note'],
    ['1', _long],
    ['2', `${_long}"\t\n"${_long}`],
    ['3', ''],
    ['4', 'last']
  ];
  ASSERT.deepEqual(_plain(_call('_parseTsvRecords', _tsv(_rows))), _rows);
  ASSERT.deepEqual(_plain(_call('_parseTsvRecords', `id\tnote\n1\t${_long}\n2\ta"b\n`)), [
    ['id', 'note'],
    ['1', _long],
    ['2', 'a"b']
  ]);
  ASSERT.equal(_call('_parseTsvRecords', `id\tnote\n1\t"${_long}"trailing`), null);
});

test('identifier token limits count escaped quotes correctly and reject oversized pastes', () => {
  for (const _identifier of ['"'.repeat(63), 'a'.repeat(63), 'あ'.repeat(21)]) {
    const _quoted = `"${_identifier.replaceAll('"', '""')}"`;
    ASSERT.equal(_call('_getResolvedPgTableName', _quoted), _quoted);
  }
  for (const _identifier of ['"'.repeat(64), 'a'.repeat(64), 'あ'.repeat(22), '"'.repeat(1000000)]) {
    ASSERT.equal(_call('_getResolvedPgTableName', `"${_identifier.replaceAll('"', '""')}"`), '');
  }
  const _longSpace = ' '.repeat(10000);
  ASSERT.equal(_call('_getResolvedPgTableName', `public${_longSpace}.${_longSpace}records`), '"public"."records"');
});
