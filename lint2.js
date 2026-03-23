const fs = require('fs');
const html = fs.readFileSync('./マニュアル作成ツール.html', 'utf8');
const js = html.match(/<script>(.*?)<\/script>/s)[1];
try {
  global.window = { dataLayer: [] };
  global.document = { addEventListener: () => {} };
  global.localStorage = { getItem: () => {}, setItem: () => {} };
  require('vm').runInNewContext(js, global);
  console.log('Syntax OK');
} catch (e) {
  console.error(e);
}
