const fs = require('fs');
const html = fs.readFileSync('./マニュアル作成ツール.html', 'utf8');
const js = html.match(/<script>(.*?)<\/script>/s)[1];
try {
  const g = { window: { dataLayer: [] } };
  g.dataLayer = g.window.dataLayer;
  g.document = { addEventListener: () => {} };
  g.localStorage = { getItem: () => {}, setItem: () => {} };
  require('vm').runInNewContext(js, g);
  console.log('Syntax OK');
} catch (e) {
  console.error(e);
}
