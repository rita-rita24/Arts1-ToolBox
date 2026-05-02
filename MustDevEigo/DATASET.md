# DATASET — データセット仕様書

`MustDevEigo.html` 内の語彙データ (`DATA.prereq` / `DATA.basic` / `DATA.advanced` / `DATA.abbr` / `DATA.acronym`) の仕様、追加・修正のルール、品質保証フローをまとめたドキュメントです。

## 1. 全体構成と現状規模 (2026-05-02 時点)

| カテゴリ | キー | 件数 | 種別 | 出題形式 |
|---|---|---|---|---|
| 前提 | `prereq` | 83 | meaning | 単語 → 意味 |
| ベーシック | `basic` | 231 | meaning | 単語 → 意味 |
| アドバンスト | `advanced` | 262 | meaning | 単語 → 意味 |
| 略語 | `abbr` | 69 | abbr | 略語 → 元の英単語 |
| 頭字語 | `acronym` | 29 | acronym | 頭字語 → 正式名称 |
| **合計** | — | **674** | — | — |

「全分野」モード (`all`) は上記 5 カテゴリを統合して出題します。

## 2. 各レコードの必須・任意フィールド

### 共通

| フィールド | 必須 | 型 | 備考 |
|---|---|---|---|
| `word` | ✓ | string | 英単語そのもの。完全一致で検索キーに使う |
| `useCase` | 任意 | string | 80 字以内。使い分け文を必ず 1 文含むこと |
| `codeExample` | 任意 | object | `{lang, code, caption}` (詳細は §5) |
| `confusables` | 任意 | array | 最大 3 件。各要素は `{word, diff, linkKind?}` |
| `tags` | 任意 | array | ファセット検索の布石。v2.0 では UI 非表示 |
| `reading` | 任意 | string | カナ読み（将来用、v2.0 では未使用） |

### `meaning` 種別 (prereq / basic / advanced)

| フィールド | 必須 | 型 | 備考 |
|---|---|---|---|
| `meaning` | ✓ | string | 漢字・ひらがな中心。純カタカナのみは不採用 |

### `abbr` / `acronym` 種別

| フィールド | 必須 | 型 | 備考 |
|---|---|---|---|
| `full` | ✓ | string | 英語の正式名称・元の英単語 |

## 3. カテゴリ判断基準

| カテゴリ | 該当する語の特徴 |
|---|---|
| `prereq` | エンジニアでない人にも通じる入門語彙。`add` / `delete` / `value` / `error` 等 |
| `basic` | 仕事で日常的に使う頻出語。`function` / `parameter` / `module` / `dependency` 等 |
| `advanced` | 専門度が高い、特定文脈でしか出てこない語。`parameter`（仮引数の意味で）/ `polymorphism` / `idempotent` 等 |
| `abbr` | 何かの略形（例: `attr`、`param`、`util`）。元の英単語が `full` 側 |
| `acronym` | 頭字語（例: `API`、`HTTP`）。正式名称が `full` 側 |

カテゴリ移動を検討する場合は、`getCategorySource()` の挙動と既存ユーザーの `wordStats` への影響を確認してから行うこと。

## 4. 文字種・表記ルール

- **`meaning`**: 漢字・ひらがな中心。カタカナ語は採用しない（例: 「インターフェース」ではなく「接点・境界」）。
- **`useCase`**: 敬体（です・ます調）統一を強く推奨せず、簡潔な文末（〜する / 〜の意 / 〜と覚える）を許容。文頭は意味の核から始める。
- **使い分け文の必須化**: `useCase` には「`A` ではなく `B` の意味」「定義側ではなく呼び出し側」のように 1 文の対比を必ず含めること。
- **`full`**: 英語表記。固有名詞は大文字、普通名詞は小文字混在を許可。

## 5. `codeExample` 規約

- **対応言語** (8 言語 + HTML): `js` / `ts` / `py` / `java` / `go` / `rb` / `sh` / `sql` / `html`
- **未対応言語**: `lang` を空にするか不明値を入れると等幅プレーン表示にフォールバック（崩れない）。
- **行数制限**: 30 行以内。超過は `validateDataset()` が警告。
- **依存禁止**: 外部ライブラリのセットアップを必要とせず、コピペでブラウザ DevTools / 標準環境で動かせる最小例にする。
- **`caption`**: 任意。「どこに注目すべきか」を 1 行で添える。
- **JSON のような構造**: `lang: "js"` を使い、JS オブジェクトリテラルとして表現することで JS ハイライタの恩恵を受けられる。
- **HTML**: タグ名 / 属性名 / 属性値 / コメントを専用ハイライタで色付け。
- **SQL**: 大文字小文字を区別せず大文字キーワードを認識。
- **shell**: コマンド名と典型的な組み込みは builtins として色付け。

### お手本

```js
{
  word: "argument", meaning: "引数・実引数",
  useCase: "関数を呼び出すときに実際に渡す値。「この関数を呼ぶときの引数は？」と聞かれたらこちら。",
  codeExample: {
    lang: "js",
    code: "function greet(name) {\n  console.log('Hello, ' + name);\n}\n\ngreet('Yamada'); // 'Yamada' が argument",
    caption: "'Yamada' が argument（実引数）"
  },
  confusables: [
    { word: "parameter", diff: "関数定義側で受け取る変数の名前（仮引数）", linkKind: "meaning" },
    { word: "attribute", diff: "オブジェクトやHTML要素が持つ属性。関数呼び出しとは別物", linkKind: "meaning" }
  ]
}
```

## 6. `useCase` 規約

- **80 字以内**。超過は `validateDataset()` が警告。
- **使い分け文を 1 文含むこと**: 単に意味を書くだけでなく「どんな場面で使うか / 何と区別するか」を明示する。
- 句点で終わる完結した文を 1〜2 文。長すぎる場合はコード例側に情報を移す。

## 7. `confusables` 規約

- **最大 3 件**。4 件以上は `validateDataset()` が警告。
- **`word` は DATA に存在する語**: 参照切れは `validateDataset()` で検出。
- **`diff` は 40 字以内**。
- **双方向リンクが望ましい**: A → B を書いたら B → A も書く。`validateDataset()` は v2.0 時点で双方向性をチェックしないが、Wave 2 着手前に拡張予定 (REPORT.md Issue 20260502-05)。
- **`linkKind`**: 任意のメタデータ。現状コードで未使用だが、将来の絞り込みやフィルタ用に予約。

## 8. 追加 PR チェックリスト

新しい解説データを追加する PR では、以下をすべて満たすこと：

- [ ] 必須フィールド（`word`、種別に応じた `meaning` / `full`）が揃っている
- [ ] `useCase` が 80 字以内、使い分け文を含む
- [ ] `codeExample.code` が 30 行以内、コピペで動くこと
- [ ] `codeExample.lang` が対応言語のいずれか（または空）
- [ ] `confusables[].word` が DATA 内に存在する
- [ ] `confusables[].diff` が 40 字以内
- [ ] confusables の双方向リンクを書いた（A → B / B → A）
- [ ] 既存語との重複がない
- [ ] 表記ゆれがない（「設定する / 指定する / 定義する」の選択根拠を本人が説明できる）
- [ ] ブラウザで実際に開き、解説ペインの表示を目視確認した
- [ ] DevTools コンソールで `MustDevEigo.Data.validateDataset()` が空配列を返す

## 9. 既存 642 語の再精査タスク

v2.0 では既存 674 語のうち 32 語のみに解説を付与しました。残り 642 語の解説執筆は別タスクとして Wave 2 / 3 で進めます。

優先度判定の基準：

1. **コードレビューで頻出**（function / module / dependency 系）
2. **混同ペアが多い**（parameter ↔ argument / attribute ↔ property 等）
3. **設定・構成系**（configuration / environment / context）
4. **略語の正式名称が誤認されやすい**（attr / param / prop / util）

執筆ペース目安: 1 語 8〜12 分。Wave 2 (60 語) で 9〜12 時間、Wave 3 (100 語) で 15〜20 時間。

## 10. `validateDataset()` の警告条件

`MustDevEigo.html` 起動時に DevTools コンソールへ警告を出します（`console.warn`）。検査項目：

| 警告内容 | 検出条件 | しきい値 |
|---|---|---|
| `useCase が 80 字超` | `item.useCase.length > 80` | 80 字 |
| `codeExample.code が 30 行超` | `code.split("\n").length > 30` | 30 行 |
| `confusables が 3 件超` | `item.confusables.length > 3` | 3 件 |
| `confusable 参照先が DATA に存在しない` | `!allWords.has(c.word)` | — |
| `diff が 40 字超` | `c.diff.length > 40` | 40 字 |

DevTools で手動実行する場合は `MustDevEigo.Data.validateDataset()` を呼ぶと警告対象の配列が返ります（空配列なら問題なし）。

## 11. データ追加・修正フロー

1. 対象語の現状を `MustDevEigo.html` 内の DATA で確認
2. このドキュメントの規約に従って `useCase` / `codeExample` / `confusables` を執筆
3. ブラウザでファイルを開き、解説ペインの表示を確認
4. DevTools コンソールで `MustDevEigo.Data.validateDataset()` が空配列を返すことを確認
5. PR チェックリスト (§8) をすべてクリア
6. コミットメッセージは `MustDevEigo/MustDevEigo.html: <カテゴリ> <語数> 語に解説追加` の形式
