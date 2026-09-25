const FS = require('node:fs');
const PATH = require('node:path');
const VM = require('node:vm');
const HTML_PATH = process.env.TEXTCHANGER_HTML || PATH.join(__dirname, '..', 'text-changer.html');
const HTML = FS.readFileSync(HTML_PATH, 'utf8');
const SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
const CONTEXT = VM.createContext({ document: { querySelector: () => null }, TextEncoder });
// Read the actual shipped implementation, stopping before DOM event registration.
VM.runInContext(SCRIPT.slice(0, SCRIPT.indexOf("  $inputArea.addEventListener(")), CONTEXT);
const _call = (_name, ..._args) => CONTEXT[_name](..._args);
const _plain = (_value) => JSON.parse(JSON.stringify(_value));
const _tsv = (_rows) => _rows.map(_row => _row.map(_value => `"${_value.replaceAll('"', '""')}"`).join('\t')).join('\n');

// Fixed-seed data: repeatable coverage of escaping, Unicode and delimiters.
function _samples(_count) {
  const TOKENS = ['a', "'", '"', '\\', '\t', '\n', ' ', '日本語', '😀', ';--', '$tag$', '/*x*/', '\u2028', '\u00a0'];
  let _seed = 193;
  const _next = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed; };
  return Array.from({ length: _count }, () => Array.from({ length: _next() % 12 + 1 }, () => TOKENS[_next() % TOKENS.length]).join(''));
}
module.exports = { _call, _plain, _tsv, _samples, HTML };
