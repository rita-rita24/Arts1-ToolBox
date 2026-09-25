const { test } = require('node:test');
const ASSERT = require('node:assert/strict');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const { _call, _tsv, _samples } = require('./helpers.cjs');

function _statements(_input, _table) {
  const _block = _call('_convertPostgreSQLBlock', _input, _table);
  ASSERT.notEqual(_block, '', 'fixture must produce SQL');
  const _insert = _block.indexOf('\n-- INSERT文\n');
  const _delete = _block.lastIndexOf('\n-- DELETE文\n');
  return { block: _block, select: _block.slice(0, _insert), insert: _block.slice(_insert, _delete), delete: _block.slice(_delete) };
}

test('generated SQL executes on PostgreSQL, in an isolated in-memory database', async _suite => {
  const _db = new PGlite();
  _suite.after(() => _db.close());
  _suite.diagnostic((await _db.query('SELECT version()')).rows[0].version);

  for (const _mode of ['on', 'off']) {
    await _suite.test(`600 literals round-trip with standard_conforming_strings=${_mode}`, async () => {
      await _db.exec(`SET standard_conforming_strings=${_mode};`);
      const _values = ['', "O'Reilly", "\\'; DROP TABLE important;--", '\\n', '\n', '\t', '  padded  ', ..._samples(593)];
      const _query = 'SELECT n, value FROM (VALUES ' + _values.map((_value, _index) => `(${_index}, ${_call('_formatPgValue', _value)})`).join(',') + ') AS data(n, value) ORDER BY n';
      ASSERT.deepEqual((await _db.query(_query)).rows.map(_row => _row.value), _values);
    });
  }
  await _db.exec('SET standard_conforming_strings=on;');

  await _suite.test('INSERT, SELECT and DELETE preserve 1,000 generated TSV rows and spare unrelated rows', async () => {
    await _db.exec('CREATE TABLE records (id text, value text); INSERT INTO records VALUES (\'unrelated\', \'keep\');');
    const _rows = _samples(1000).map((_value, _index) => [String(_index), `value:${_value}`]);
    const _sql = _statements(_tsv([['id', 'value'], ..._rows]), 'records');
    ASSERT.equal((await _db.query(_sql.select)).rows.length, 0);
    await _db.exec(_sql.insert);
    const _selected = (await _db.query(_sql.select)).rows;
    ASSERT.deepEqual(_selected.map(_row => [_row.id, _row.value]), _rows);
    await _db.exec(_sql.delete);
    ASSERT.deepEqual((await _db.query('SELECT * FROM records')).rows, [{ id: 'unrelated', value: 'keep' }]);
  });

  await _suite.test('typed columns accept exact large numbers, dates, booleans and UUIDs', async () => {
    await _db.exec('CREATE TABLE typed (id bigint, amount numeric(40, 3), day date, active boolean, token uuid);');
    const _sql = _statements('id\tamount\tday\tactive\ttoken\n9007199254740993\t123456789012345678901.125\t2024-02-29\ttrue\t550e8400-e29b-41d4-a716-446655440000', 'typed');
    await _db.exec(_sql.insert);
    const _result = await _db.query('SELECT id::text, amount::text, day::text, active, token::text FROM typed');
    ASSERT.deepEqual(_result.rows, [{ id: '9007199254740993', amount: '123456789012345678901.125', day: '2024-02-29', active: true, token: '550e8400-e29b-41d4-a716-446655440000' }]);
    ASSERT.equal((await _db.query(_sql.select)).rows.length, 1);
    await _db.exec(_sql.delete);
    ASSERT.equal((await _db.query('SELECT * FROM typed')).rows.length, 0);
  });

  await _suite.test('quoted schema, table and column names cannot inject statements', async () => {
    await _db.exec('CREATE TABLE important (value text); INSERT INTO important VALUES (\'intact\'); CREATE SCHEMA "Mixed.Schema"; CREATE TABLE "Mixed.Schema"."order;--" ("a""b" text, "日本語😀" text);');
    const _sql = _statements(_tsv([['a"b', '日本語😀'], ["x'); DROP TABLE important;--", "\\'; DROP TABLE important;--"]]), '"Mixed.Schema"."order;--"');
    await _db.exec(_sql.insert);
    ASSERT.equal((await _db.query(_sql.select)).rows.length, 1);
    await _db.exec(_sql.delete);
    ASSERT.deepEqual((await _db.query('SELECT * FROM important')).rows, [{ value: 'intact' }]);
  });

  await _suite.test('unquoted uppercase names follow PostgreSQL folding and reserved words work', async () => {
    await _db.exec('CREATE TABLE "order" (id text);');
    const _sql = _statements('id\n1', 'Public.ORDER');
    await _db.exec(_sql.insert);
    ASSERT.deepEqual((await _db.query(_sql.select)).rows, [{ id: '1' }]);
    await _db.exec(_sql.delete);
  });

  await _suite.test('all-NULL and all-empty conditions never select or delete existing data', async () => {
    await _db.exec('CREATE TABLE nulls (a text, b text); INSERT INTO nulls VALUES (\'keep\', \'me\');');
    for (const _row of ['NULL\t<< NULL >>', '\t']) {
      const _sql = _statements(`a\tb\n${_row}`, 'nulls');
      ASSERT.equal((await _db.query(_sql.select)).rows.length, 0);
      await _db.exec(_sql.insert);
      await _db.exec(_sql.delete);
    }
    ASSERT.deepEqual((await _db.query('SELECT * FROM nulls')).rows, [{ a: 'keep', b: 'me' }, { a: null, b: null }, { a: ' ', b: ' ' }]);
  });

  await _suite.test('mixed NULL markers preserve the documented omitted-condition behavior', async () => {
    await _db.exec("CREATE TABLE mixed (id text, note text); INSERT INTO mixed VALUES ('1', 'old'), ('2', 'keep');");
    const _sql = _statements('id\tnote\n1\t« NULL »', 'mixed');
    ASSERT.deepEqual((await _db.query(_sql.select)).rows, [{ id: '1', note: 'old' }]);
    await _db.exec(_sql.delete);
    ASSERT.deepEqual((await _db.query('SELECT * FROM mixed')).rows, [{ id: '2', note: 'keep' }]);
  });

  await _suite.test('duplicate source rows remain duplicated on INSERT, with equivalent matching', async () => {
    await _db.exec('CREATE TABLE duplicates (id text, note text);');
    const _sql = _statements('id\tnote\n1\tx\n1\tx', 'duplicates');
    await _db.exec(_sql.insert);
    ASSERT.equal((await _db.query(_sql.select)).rows.length, 2);
    await _db.exec(_sql.delete);
    ASSERT.equal((await _db.query('SELECT * FROM duplicates')).rows.length, 0);
  });

  await _suite.test('SQL IN values are interpreted as data in PostgreSQL standard string mode', async () => {
    const _values = ["O'Reilly", "x'); DROP TABLE important;--", '日本語😀', 'back\\slash'];
    const _suffix = _call('_convertSqlIn', _values);
    for (const _value of _values) {
      ASSERT.equal((await _db.query(`SELECT $1::text ${_suffix}`, [_value])).rows[0]['?column?'], true);
    }
    ASSERT.deepEqual((await _db.query('SELECT * FROM important')).rows, [{ value: 'intact' }]);
  });

  await _suite.test('the entire generated block is syntactically valid and transactionally usable', async () => {
    await _db.exec('CREATE TABLE complete (id text, note text);');
    const _sql = _statements('id\tnote\n1\tvalue', 'complete');
    await _db.exec(_sql.block);
    ASSERT.equal((await _db.query('SELECT * FROM complete')).rows.length, 0);
    ASSERT.equal((await _db.query('SELECT 1 AS alive')).rows[0].alive, 1);
  });

  await _suite.test('retargeting cached SQL preserves literal table names and independent data', async () => {
    await _db.exec('CREATE TABLE cached_a (id text, note text); CREATE TABLE "cached.b" (id text, note text);');
    const _input = _tsv([['id', 'note'], ['1', 'cached_a "cached.b" ???'], ['2', "O'Reilly\\cached_a"]]);
    const _first = _statements(_input, 'cached_a');
    const _second = _statements(_input, '"cached.b"');
    await _db.exec(_first.insert);
    await _db.exec(_second.insert);
    const _expected = [{ id: '1', note: 'cached_a "cached.b" ???' }, { id: '2', note: "O'Reilly\\cached_a" }];
    ASSERT.deepEqual((await _db.query(_first.select)).rows, _expected);
    ASSERT.deepEqual((await _db.query(_second.select)).rows, _expected);
    await _db.exec(_first.delete);
    ASSERT.deepEqual((await _db.query(_first.select)).rows, []);
    ASSERT.deepEqual((await _db.query(_second.select)).rows, _expected);
    await _db.exec(_second.delete);
    ASSERT.deepEqual((await _db.query(_second.select)).rows, []);
  });
});
