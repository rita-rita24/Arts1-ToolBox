# SEOチェッカー.html 詳細設計書（リバース）

## 1. 前提とスコープ

- 対象ファイル: `SEOチェッカー.html`
- 解析日: 2026-04-12
- 実装形態: 単一HTMLファイルのクライアントサイドWebアプリ
- 主目的: URLを入力し、取得したHTMLを静的解析して、SEO・テクニカルSEO・OGP/SNS・構造化データ・MEO・LLMOの簡易診断レポートを生成する。
- 対象外として画面上でも明示されているもの: ページ速度、被リンクなど。実装上はJavaScriptレンダリング後DOM、robots.txt、sitemap.xml、HTTPレスポンスヘッダー、Core Web Vitals、リンク切れ実測も対象外。

## 2. プロダクト概要

このツールは「専門家でなくても、URLだけでSEO上の基本的な抜け漏れを一覧化できる無料診断ツール」として設計されている。

ユーザー価値は以下。

- URL入力だけで主要SEO項目を横断チェックできる。
- OGPプレビュー、alt未設定画像プレビュー、JSON-LD概要など、確認すべき対象を目視しやすい。
- 総合スコアとカテゴリ別スコアで、状況をざっくり把握できる。
- PDF印刷とクリップボードコピーで、診断結果を外部共有しやすい。

## 3. 画面構成

- `<head>`: title、description、robots、canonical、OGP、Twitter Card、WebApplication JSON-LD、Google Analyticsを定義。
- 通常CSS: リセット、基本レイアウト、入力、ウェルカム、ローディング、結果メタ、タブ、広告バナーなどを定義。
- PageSpeed由来と思われるCSS注入: `<noscript class="psa_add_styles">` 内に大量のCSSが重複しており、末尾の `pagespeed.CriticalCssLoader.Run()` が実行時にCSSをDOMへ注入する。
- ヘッダー: ツール名、説明、バージョン `v2.0`。
- 入力エリア: URL入力、診断開始ボタン、サンプルURLリンク、CORSプロキシ利用の注記、静的解析の注記、エラーバナー。
- ウェルカム: 6カテゴリの診断対象をピル表示。
- ローディング: スピナーと進行ステップ文言。
- 結果エリア: 印刷用ヘッダー、診断URL、診断日時、PDF保存、コピー、スコアグリッド、カテゴリタブ、診断項目パネル。
- marginバナー: `margin.corto.jp` への外部リンク。閉じると `localStorage` に24時間保存。

## 4. ユーザーフロー

1. ユーザーがURLを入力する。
2. `診断スタート` または Enter で `startCheck()` を実行する。
3. 未入力なら「URLを入力してください。」を表示する。
4. `http` で始まらない入力には `https://` を補完する。
5. `new URL(url)` でURL形式を検証する。
6. ウェルカムと結果を非表示、ローディングを表示、診断ボタンをdisabledにする。
7. `fetchPage(url)` がCORSプロキシを並列試行し、HTML文字列を取得する。
8. `DOMParser().parseFromString(html, 'text/html')` でDocument化する。
9. 6カテゴリのチェック関数を順番に実行する。
10. `lastData`、`lastUrl`、`lastTime` を更新する。
11. `renderResults(lastData)` でスコア・タブ・パネルを再描画する。
12. 成功時は結果を表示する。失敗時はウェルカムに戻し、エラーバナーを表示する。

## 5. 外部通信

### 診断対象HTML取得

`fetchPage(url)` は以下の3つの公開CORSプロキシを `Promise.any()` で並列試行する。

- `https://api.codetabs.com/v1/proxy?quest=...`
- `https://api.allorigins.win/get?url=...`
- `https://thingproxy.freeboard.io/fetch/...`

各プロキシは10秒タイムアウト。レスポンスがHTTPエラー、100文字未満、または `<html` を含まない場合は無効レスポンスとして扱う。全プロキシが失敗すると「全プロキシへの接続に失敗しました。時間をおいて再試行してください。」を投げる。

### その他の外部通信

- Google Analytics: `https://www.googletagmanager.com/gtag/js?id=G-WRM7PV7BBK`
- OGP画像や診断対象ページ内画像のプレビュー読み込み
- marginバナーリンク: `https://margin.corto.jp/`

## 6. データモデル

診断項目は明示的な型定義はないが、各チェック関数が以下の形のオブジェクト配列を返す。

```js
{
  name: string,
  status: 'pass' | 'warn' | 'fail' | 'info' | 'na',
  desc: string,
  value?: string,
  tip?: string,
  imgPreview?: Array<{ src: string, rawSrc: string }>,
  ogPreview?: { title?: string, description?: string, image?: string, url?: string },
  schemas?: object[]
}
```

`renderItem()` は `value`、画像プレビュー、OGPプレビュー、スキーマカード、改善tipを任意表示する。`esc()` でHTMLエスケープしており、診断対象HTML由来の文字列を直接HTML注入しにくくしている。

## 7. チェックカテゴリ詳細

### 7.1 SEO基本

実装: `checkSEO(doc, url)`

- タイトルタグ: 未設定は `fail`。`TextEncoder` のバイト長が20未満または70超なら `warn`、それ以外は `pass`。表示上は「文字」と表現している。
- メタディスクリプション: 未設定は `fail`。バイト長60未満または160超なら `warn`、それ以外は `pass`。
- H1タグ: 0個は `fail`、2個以上は `warn`、1個は `pass`。
- 見出し構造: `h1` から `h6` の合計が2未満なら `warn`、それ以外は `pass`。最大20件まで見出しテキストを表示する。
- 画像alt属性: 画像なしは `info`。alt未設定0枚は `pass`。未設定が画像総数の50%超なら `fail`、それ以下なら `warn`。未設定画像は最大12件プレビューする。
- HTML lang属性: 未設定は `warn`、設定ありは `pass`。
- リンク構造: `a[href]` が0本なら `warn`、それ以外は `pass`。同一originを内部リンク、別originを外部リンクとして概算する。

### 7.2 テクニカルSEO

実装: `checkTechnical(doc, url)`

- HTTPS: 入力URLのprotocolが `https:` なら `pass`、それ以外は `fail`。
- canonicalタグ: `link[rel="canonical"]` のhrefがあれば `pass`、なければ `warn`。
- robots metaタグ: `noindex` を含めば `fail`。robots metaありなら `pass`。未設定は `info`。
- viewport metaタグ: 未設定は `fail`。`width=device-width` を含めば `pass`、含まなければ `warn`。
- charset: 未指定は `warn`。`utf-8` なら `pass`、それ以外は `warn`。
- hreflang: 1件以上あれば `pass`、なければ `info`。
- PWA Manifest: `link[rel="manifest"]` があれば `pass`、なければ `info`。

### 7.3 OGP/SNS

実装: `checkOGP(doc, url)`

- OGPプレビュー: `og:title` または `og:image` がある場合だけ先頭に追加。両方あれば `pass`、片方なら `warn`。
- 必須扱いOGP: `og:title`、`og:description`、`og:image`、`og:url`、`og:type`。未設定は `fail`。
- 任意扱いOGP: `og:site_name`、`og:locale`。未設定は `warn`。
- Twitter Card: `twitter:card` は未設定で `warn`。`twitter:title`、`twitter:description`、`twitter:image`、`twitter:site` は未設定で `info`。
- `twitter:image` はURL解決後に画像プレビューを出す。

### 7.4 構造化データ

実装: `checkStructuredData(doc)`

- `script[type="application/ld+json"]` を全取得し、JSONとしてparseする。
- JSON-LD配列と `@graph` を平坦化して `flat` に格納する。
- JSON parseエラーは `JSON-LD 解析エラー` として `fail`。
- JSON-LD総数: スクリプト0件なら `fail`、1件以上なら `pass`。
- 検出されたスキーマタイプ: `flat` に要素があれば `info` として最大4件のスキーマカードを描画する。
- 個別スキーマ検出: WebSite、SearchAction、BreadcrumbList、FAQPage、Article/BlogPosting/NewsArticle、Productをチェック。検出ありは `pass`、なしは `info`。
- 注意点: SearchAction判定は実装上 `/website/i` を見ており、`potentialAction` の `SearchAction` そのものは検証していない。

### 7.5 MEO

実装: `checkMEO(doc)`

- `extractSchemas(doc)` でJSON-LDを平坦化する。
- `LocalBusiness` 系、`Restaurant`、`Hotel`、`Store`、`Organization`、`Place` などの `@type` をMEO対象スキーマとして検出する。
- 該当スキーマなしは `LocalBusiness 構造化データ` を `warn`。
- 該当スキーマありの場合、以下を追加チェックする。
  - `name`: あり `pass`、なし `fail`
  - `address`: あり `pass`、なし `fail`
  - `telephone`: あり `pass`、なし `warn`
  - `openingHours` または `openingHoursSpecification`: あり `pass`、なし `warn`
  - `geo`: あり `pass`、なし `warn`
  - `hasMap`: あり `pass`、なし `info`
  - `aggregateRating`: あり `pass`、なし `info`

### 7.6 LLMO

実装: `checkLLMO(doc)`

- コンテンツ構造の明確さ: H2が2個以上かつ段落3個以上なら `pass`。H2が1個以上なら `warn`。H2なしは `fail`。H2/H3/段落数/推定文字数を表示する。
- FAQPageスキーマ: あり `pass`、なし `warn`。
- HowToスキーマ: あり `pass`、なし `info`。
- 著者情報: `Person`/`Author` 系スキーマあり `pass`。`meta author` のみは `warn`。どちらもなしは `fail`。
- 公開日・更新日: 公開日と更新日があれば `pass`。公開日のみ、または未設定は `warn`。
- Organizationスキーマ: あり `pass`、なし `warn`。
- E-E-A-Tリンク: hrefに `about`、`company`、`profile`、`contact` を含むリンクがあれば `pass`、なければ `warn`。
- sameAs: あり `pass`、なし `info`。
- 定義リスト・用語説明: `dl` または `dfn` があれば `pass`、なければ `info`。

## 8. スコアリング

実装: `calcScore(items)`

- `pass`: 100点相当
- `warn`: 50点相当
- `fail`: 0点相当
- `info` と `na`: スコア計算から除外
- 計算対象が0件の場合は100点
- 式: `Math.round((passCount * 100 + warnCount * 50) / targetCount)`
- 色: 80点以上は緑、50点以上は黄、50点未満は赤。
- 総合スコアは6カテゴリの全項目を平坦化して同じ関数で算出する。

## 9. 出力・エクスポート

- 画面表示: `renderResults()` がカテゴリ別スコアカード、総合スコアカード、タブ、パネルを生成する。
- タブ切替: `switchTab(id)` が `.active` クラスを付け替える。
- PDF保存: `exportPdf()` が全パネルを一時表示し、印刷用メタ情報を入れて `window.print()` を実行する。保存自体はブラウザの印刷ダイアログ依存。
- クリップボードコピー: `copyReport()` がテキストレポートを組み立て、`navigator.clipboard.writeText()` でコピーする。成功時はボタン文言を2秒間変更する。

## 10. 現状の制約・リスク

- CORSプロキシ依存のため、取得成功率・速度・プライバシー・利用上限が外部サービスに左右される。
- 静的HTML解析なので、SPAやクライアントレンダリング後に生成されるmeta/JSON-LD/本文は正しく評価できない。
- HTTPステータス、リダイレクト履歴、レスポンスヘッダー、robots.txt、sitemap.xml、canonicalの自己参照・URL正規化までは見ていない。
- タイトル/descriptionは `TextEncoder` のバイト長で判定しているが、画面表示では「文字」と表現しており、日本語では実感とズレる可能性がある。
- CSSは `@layer` を使っておらず、色も `oklch` ではないため、現行リポジトリルールとは未整合。
- DOM helperの `qs/qsa`、DOM変数の `$` prefix、内部変数の `_` prefix、定数の `UPPER_SNAKE_CASE` は未採用。
- URL入力に明示的な `<label>` がなく、エラー表示も `aria-live` や `aria-describedby` とは紐づいていない。
- タブUIはbutton表示だが、`role="tablist"`、`role="tab"`、`aria-selected`、キーボード矢印操作などは未実装。
- インライン `onclick` が多く、イベント委譲/静的コントロールへの直接bindingというルールに寄せきれていない。
- 通常CSSとPageSpeed注入CSSが分断・重複しており、保守性と初期表示安定性にリスクがある。
- Google Analyticsが入っており、ローカルファースト/テレメトリなしの方針とは思想的に衝突しやすい。

## 11. プロダクトを格段に上げる改善アイデア

### A. 診断の信頼性を上げる

- 「URL取得」と「HTML貼り付け」の2モード化。プロキシ失敗時でも、ユーザーがHTMLを貼れば診断できる。
- プロキシごとの失敗理由・所要時間を内部的に記録し、UIでは「取得失敗」「対象がHTMLではない」「タイムアウト」を切り分ける。
- 診断対象URLの最終URL、リダイレクト有無、取得元プロキシをレポートに表示する。
- 直近の診断結果を `localStorage` に保存し、再読み込み後も結果を復元できるようにする。

### B. SEO監査として深くする

- canonicalの自己参照、一致/不一致、末尾スラッシュ、http/https、wwwありなしを判定する。
- meta robotsだけでなく、可能なら `X-Robots-Tag`、robots.txt、sitemap.xmlも確認する。
- title/descriptionの重複、空白、ブランド名過多、検索意図との対応をチェックする。
- 見出し階層のスキップ、H1とtitleの過度な重複、空見出しを検出する。
- 画像のaltだけでなく、空altが装飾画像として妥当か、幅高さ、遅延読み込み、巨大画像の可能性も見る。
- リンクは本数だけでなく、空リンクテキスト、`javascript:`、外部リンクの `rel="noopener"`、アンカーテキスト品質を診断する。

### C. 構造化データを実務レベルにする

- `@id` 参照と `@graph` の関係を解決して、Organization、WebSite、WebPage、BreadcrumbList、Articleのつながりを可視化する。
- Schema.orgタイプごとの必須/推奨プロパティをルール化し、不足項目を具体的に提示する。
- SearchActionはWebSite検出ではなく `potentialAction.@type === "SearchAction"` と `target`、`query-input` を検証する。
- JSON-LDの重複、壊れたURL、日付形式、画像URLの絶対URL化をチェックする。

### D. LLMOを「引用されやすさ」診断へ進化させる

- ページ本文からエンティティ候補、FAQ候補、定義候補を抽出し、「AI回答に引用されやすい形になっているか」を要約する。
- 著者、運営者、実績、更新日、引用元リンクをまとめたE-E-A-Tスコアを作る。
- 専門用語の未定義、結論の位置、箇条書き/表の不足など、生成AIが回答に使いやすい構造を提案する。
- 「このページに追加すべきFAQ案」をローカルルールベースで生成する。外部AI APIを使う場合は明示的なオプションにする。

### E. MEO専用モードを作る

- LocalBusinessのサブタイプ適合性、NAP（Name/Address/Phone）完全性、営業時間形式、geo/hasMap、sameAs、areaServedをまとめて評価する。
- 店舗ページか否かをユーザーに選ばせ、店舗でないページにはMEO減点をかけない。
- Review/AggregateRatingはガイドライン違反になりやすいので、「実在レビューか」「ページ上に表示されているか」の注意を出す。

### F. レポートを意思決定ツールにする

- 単なる項目一覧ではなく「優先度」「影響度」「修正工数」「担当者向けTODO」を出す。
- 総合スコアとは別に、致命的な問題だけを集めた「今すぐ直す5件」を表示する。
- JSON/CSV/Markdown形式のエクスポートを追加し、制作チームやクライアント提出に使いやすくする。
- 前回診断との比較を保存し、改善差分を見せる。

### G. UI/アクセシビリティ/保守性を上げる

- URL入力にlabelを付け、エラーを `aria-describedby` と `aria-live` で関連付ける。
- タブをWAI-ARIAパターンに寄せ、左右キー操作と `aria-selected` を実装する。
- CSSを `@layer reset, base, component, utility` に整理し、色を `oklch` トークンへ移行する。
- PageSpeed注入CSSを通常CSSへ統合し、重複を削除する。
- インライン `onclick` を外し、静的コントロールは直接binding、結果内の動的要素はイベント委譲に寄せる。
- `qs/qsa` helper、`$` DOM変数prefix、`UPPER_SNAKE_CASE` 定数を導入して、リポジトリ規約へ合わせる。
- ローディングアニメーションは `prefers-reduced-motion` に対応する。

### H. プライバシーと商品力を両立する

- 「外部プロキシを使う」「対象URLが第三者サービスに送られる」ことを入力欄近くで明示する。
- テレメトリなし版を基本にし、必要なら同意制の計測だけにする。
- 将来的にプロダクト化する場合は、ユーザー管理より先に「監査品質」「レポート品質」「履歴比較」に投資するのがよい。
- 有料化するなら、まずは「複数URL一括診断」「定期診断」「ブランド入りPDF」「改善TODO管理」が自然な拡張になる。

## 12. 推奨ロードマップ

1. 短期: CSS重複解消、アクセシビリティ修正、`SearchAction` 判定修正、文字数/バイト数表記の整合、HTML貼り付けモード追加。
2. 中期: canonical/robots/sitemap/リンク品質/構造化データ必須プロパティの追加、優先度付きTODOレポート化。
3. 長期: 複数URL診断、履歴比較、ブランド付きPDF、LLMO/MEO専用深掘りモード、同意制のオプションAI診断。

