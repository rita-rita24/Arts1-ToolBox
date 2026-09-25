const FS = require('node:fs');
const PATH = require('node:path');
const VM = require('node:vm');
const HTML_PATH = process.env.TEXTCHANGER_HTML || PATH.join(__dirname, '..', 'text-changer.html');
const HTML = FS.readFileSync(HTML_PATH, 'utf8');
const SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
const CONTEXT = VM.createContext({ document: { querySelector: () => null }, TextEncoder });
// 配布用HTMLの実装を読み込み、DOMイベントを登録する直前まで実行する。
VM.runInContext(SCRIPT.slice(0, SCRIPT.indexOf('  $inputArea.addEventListener(')), CONTEXT);
const _call = (_name, ..._args) => CONTEXT[_name](..._args);
const _plain = (_value) => JSON.parse(JSON.stringify(_value));
const _tsv = (_rows) =>
  _rows.map((_row) => _row.map((_value) => `"${_value.replaceAll('"', '""')}"`).join('\t')).join('\n');

// 乱数シードを固定し、エスケープ・Unicode・区切り文字の検証を再現可能にする。
function _samples(_count) {
  const TOKENS = ['a', "'", '"', '\\', '\t', '\n', ' ', '日本語', '😀', ';--', '$tag$', '/*x*/', '\u2028', '\u00a0'];
  let _seed = 193;
  const _next = () => {
    _seed = (_seed * 1664525 + 1013904223) >>> 0;
    return _seed;
  };
  return Array.from({ length: _count }, () =>
    Array.from({ length: (_next() % 12) + 1 }, () => TOKENS[_next() % TOKENS.length]).join('')
  );
}
module.exports = { _call, _plain, _tsv, _samples, HTML };
