# 「明日のレビューで使える業務英語」を作る — 単一 HTML で組む新卒研修ツール MustDevEigo v2.0 の設計

> 社内技術ブログ投稿向けドラフト。最終投稿時は「弊社」「弊チーム」等の表記、所属、スクリーンショット、社内 Slack チャンネル名等を埋め込んで仕上げる前提。

## はじめに — 誰向けの記事か

- 新卒・ジュニアエンジニアに**英語語彙**の研修を提供したい育成担当
- 単一 HTML / Vanilla JS で**学習プラットフォーム**を組みたい個人開発者
- React や巨大フレームワークに頼らず**業務知識を伝えるツール**を作りたい人

本記事では、エンジニア必須英単語学習ツール `MustDevEigo` を v2.0 として「研修コンテンツとして社内に出せる」レベルまで引き上げた設計判断と実装の勘所を整理する。

## 1. 課題 — 新卒の「意味は分かるが使えない」問題

新卒メンバーをコードレビューに巻き込むと、頻繁に次のすれ違いが起きる：

- 「`parameter` と `argument` ってどっちがどっちでしたっけ？」
- 「これ `attr` じゃなくて `prop` ですか？」
- 「`deprecated` ってどういう意味でしたっけ？」

意味は知っている、訳もできる。**でも使えない**。これは「どんな場面で使うか」の文脈が結びついていないからだ。

汎用的な英単語アプリでは「`parameter` = 仮引数、`argument` = 実引数」とは教えてくれるが、「コードレビューで `parameter` と書くべき場面と `argument` と書くべき場面」までは教えてくれない。

## 2. 既存ツールでは届かない理由

業務向け英語学習ツールに対して、新卒・ジュニアが本当に欲しいのは：

| 既存ツールが提供 | 本当に欲しいもの |
|---|---|
| 単語 → 意味の対訳 | 単語 → 意味 + 使う場面 + コード例 |
| 一般的な例文 | 業務固有のコードレビュー文脈 |
| 同義語リスト | 混同しやすい類義語の使い分け |
| 受動的な単語カード | 文脈から選び分けるアクティブ演習 |

これら 4 つを一つのツールで提供することが v2.0 の設計目標になった。

## 3. 設計コンセプト — 「明日のレビューで使える」

価値訴求を**「明日のレビューで使える」**に絞った。これは：

- **使用シーン (`useCase`)**: 80 字以内に「いつ・何と区別して使うか」を 1 文で。
- **コード例 (`codeExample`)**: 30 行以内のコピペ実行可能なスニペット。
- **混同しやすい類語 (`confusables`)**: 最大 3 語、双方向に「違いを 40 字以内で」。

この 3 点セットを「解説ペイン」として 4 択クイズの解答後に表示する。

## 4. 技術選択 — なぜ単一 HTML / なぜフレームワーク無し

`MustDevEigo` は親リポジトリ `Arts1-ToolBox` の方針 (`CLAUDE.md`) に従い、次の制約下で実装している：

- **単一 HTML ファイル**（インストール / ビルド不要）
- **Vanilla JavaScript**（React / Vue / Svelte 不使用）
- **外部依存最小化**（CDN は Google Fonts のみ）
- **オフラインファースト**（IndexedDB で永続化）

これは「研修教材」として配布する都合上、特に重要だった：

- 受講者の環境を選ばない（ブラウザがあれば動く）
- 社内 ITS がフレームワークを審査する手間がない
- 5 年後にメンテナが変わっても **ファイル 1 個で完結している** 安心感

トレードオフとして React なら 30 行で済む状態管理を 100 行書く必要があるが、研修教材という性質上、コードリーディング教材としても価値があると判断した。

## 5. 解説ペインの設計詳解

### 5.1 データモデル

既存形式 (`{word, meaning}` / `{word, full}`) を破壊しない後方互換拡張：

```js
{
  word: "parameter",
  meaning: "仮引数",
  // v2.0 追加（すべて任意）
  useCase: "関数定義側で受け取る変数の名前。「この関数は何を引数に取りますか？」と聞かれたらこちら。",
  codeExample: {
    lang: "js",
    code: "function greet(name) {\n  console.log('Hello, ' + name);\n}\n\ngreet('Yamada'); // 'Yamada' は argument",
    caption: "name が parameter（仮引数）"
  },
  confusables: [
    { word: "argument",  diff: "呼び出し側で実際に渡す値（実引数）" },
    { word: "attribute", diff: "オブジェクトやHTML要素が持つ属性。関数の引数とは別物" }
  ]
}
```

ポイント：
- 既存 642 語に手を入れずに段階的拡張できる
- 解説データを持たない語ではペイン自体を出さず、現行の短文フィードバックにフォールバック

### 5.2 自前シンタックスハイライタ

外部 CDN 禁止のため自前で実装。9 言語対応 (js / ts / py / java / go / rb / sh / sql / html) で約 120 行。

実装の核：

```js
// 言語ごとにマスター正規表現で comment / string / number / identifier をトークン化
function highlightCode(code, lang) {
  const lex = SYNTAX_LEXERS[lang];
  if (!lex) return htmlEscape(code);
  let out = "", last = 0, m;
  lex.master.lastIndex = 0;
  while ((m = lex.master.exec(code)) !== null) {
    out += htmlEscape(code.slice(last, m.index));
    if (m[1])      out += `<span class="tok-cmt">${htmlEscape(m[1])}</span>`;
    else if (m[2]) out += `<span class="tok-str">${htmlEscape(m[2])}</span>`;
    else if (m[3]) out += `<span class="tok-num">${htmlEscape(m[3])}</span>`;
    else if (m[4]) {
      const id = m[4];
      if (lex.kw.has(id))      out += `<span class="tok-kw">${id}</span>`;
      else if (lex.ty.has(id)) out += `<span class="tok-ty">${id}</span>`;
      else if (lex.bi.has(id)) out += `<span class="tok-bi">${id}</span>`;
      else out += htmlEscape(id);
    }
    last = lex.master.lastIndex;
  }
  return out + htmlEscape(code.slice(last));
}
```

HTML だけは特殊で、`&lt;` 化済みのソースに対してプレースホルダ経由でタグ名・属性名・属性値・コメントを別経路で色付けしている。

### 5.3 類語カードの導線

混同しやすい類語は「カード」として表示し、二段の導線を用意した：

- **カードタップ** → トーストで意味を即時表示（流れを切らない）
- **「単語帳で見る」ボタン** → 単語帳画面に遷移し検索フィルタを設定（じっくり読みたい時）

これは「学習中の流れ」と「深掘り」の両方をひとつの UI で扱うための判断。深掘りのために画面遷移するのは集中切れを生むので、最小情報はその場で。

## 6. データセットの育て方 — Wave 戦略

全 674 語に解説を一気に書くのは現実的ではない（執筆 1 語 8〜12 分で計 90〜130 時間）。3 波に分割した：

| Wave | 規模 | 対象 | 完了基準 |
|---|---|---|---|
| Wave 1 (v2.0 同梱) | 32 語 | basic 17 + abbr 7 + acronym 7 + advanced 1 | 研修核となる頻出語を網羅 |
| Wave 2 | +60 語 | basic 残り頻出 + advanced 30 | 解説カバー率 50% 超 |
| Wave 3 | +100 語 | 全カテゴリ均等 | 実質「全問解説あり」の体感 |

各 Wave は **データ追加だけのコミット** で完結する設計。コードを触らないので差分レビューが軽い。

## 7. IndexedDB v2 マイグレーション設計

v2.0 で `DB_VERSION` を 1 → 2 に上げた。実体スキーマは未変更（解説フィールド追加は前方互換）だが、版マーカーだけは書き込んでおく：

```js
req.onupgradeneeded = (event) => {
  const db = req.result;
  const oldVersion = (event && event.oldVersion) || 0;
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { keyPath: "key" });
  }
  if (oldVersion < 2) {
    const tx = req.transaction;
    if (tx) {
      tx.objectStore(STORE_NAME).put({ key: "appSchemaVersion", value: 2 });
    }
  }
};
```

理由：将来本格的なマイグレーションが必要になった時、`oldVersion < 2` 判定の起点が必要。今やっておかないと将来「v1 のままのユーザー」と「v2 から始めたユーザー」の区別がつかなくなる。

既存ユーザーへの影響はゼロ（履歴 / 苦手 / ユーザー名すべて引き継がれる）。

## 8. 起動時データ検証

データ拡張を分業する前提で、整合性チェックを起動時に走らせる：

```js
function validateDataset() {
  const issues = [];
  const allWords = new Set();
  ["prereq","basic","advanced","abbr","acronym"].forEach(cat => {
    if (Array.isArray(DATA[cat])) DATA[cat].forEach(item => allWords.add(item.word));
  });
  // useCase 80字超 / codeExample 30行超 / confusables 4件以上 /
  // confusable 参照切れ / diff 40字超 を検出
  // ...
  return issues;
}
```

DevTools コンソールに `console.warn` で警告を出す。空配列なら問題なし。`MustDevEigo.Data.validateDataset()` で手動実行も可能。

## 9. 研修への組み込み方

研修担当者が即運用できるように、配布時に同梱するドキュメントを用意した：

- `README.md`: ツール概要・操作・保存仕様
- `TRAINING_GUIDE.md`: 5 日間カリキュラム例 / KPI / ピットフォール / 質問が出やすい混同ペア Top10
- `DATASET.md`: 解説執筆規約 / PR チェックリスト
- `REPORT.md`: 既知課題と改善ロードマップ

研修導入手順は `TRAINING_GUIDE.md` 参照。Day 1 (prereq 全 83 問) → Day 5 (苦手復習 + 解説熟読) で計 3 時間というカリキュラムを組んだ。

## 10. 今後

- **Wave 2 / 3**: 残り 642 語の解説執筆を順次。利用者フィードバックで優先順位を決める
- **類語識別モード正式採用**: v2.0 では β として CTA で控えめに公開。利用ログをもとに UX を見直す
- **社内独自語彙集**: チーム固有のドメイン用語（例: 自社 API 名 / 略語）を追加するパスを検討
- **`validateDataset()` 双方向チェック**: 現状は参照切れのみ検出。A→B / B→A の対称性を警告化する

## 11. 試し方

1. リポジトリから `MustDevEigo.html` 1 ファイルを取得
2. ブラウザでダブルクリック
3. ホーム → 演習を始める

リポジトリ: `Arts1-ToolBox/MustDevEigo/`

---

> **編集メモ（投稿前に削除）**:
> - 「弊社」「弊チーム」等の表記を埋める
> - スクリーンショット差し込み箇所:
>   - 解説ペイン（コード例 + 類語カード）
>   - 単語帳の `<details>` 行展開
>   - 類語識別モード CTA
>   - 結果画面の「解説」モーダル
> - Slack チャンネル / 連絡先を末尾に追加
> - 社内研修制度との関連付けを追加
