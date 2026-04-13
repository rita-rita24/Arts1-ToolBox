# SQLBindMerge

Eclipse などのデバッグ表示で分離される「SQL」と「バインド変数」を、SQL クライアントでそのまま実行できる SQL に変換するローカルツールです。

## 使い方
1. 左側の1つの入力欄に、デバッグのウォッチ内容（SQL + バインド変数）をまとめて貼り付けます。
2. ツールがバインド行を自動判定して SQL にマージします。
3. 右側にリアルタイムで実行可能 SQL が表示されます。
4. `コピー` ボタンで結果をクリップボードへコピーできます。

## 入力形式
- SQL 本文とバインド変数を同じ入力欄に混在で貼り付け可能
- 名前付きバインド: `:id = 4529`
- 名前付きバインド（クォート文字列）: `:status = "ACTIVE"`
- 位置バインド（`?` 用）: `[1] = 100` または `1 = 100`
- 1行ログ形式: `sql=[SELECT ... WHERE id = ?] parameters=[1=4529]`

## 変換例
入力:
```text
sql=[SELECT userId FROM User WHERE 1 = 1 AND TO_CHAR(YUKOFROM_YMD, 'YYYYMMDD') <= ? AND TO_CHAR(YUKOTO_YMD, 'YYYYMMDD') >= ?] parameters=[1=2025-12-12,2=2025-12-12]
```

出力:
```sql
SELECT userId
FROM User
WHERE 1 = 1
  AND TO_CHAR(YUKOFROM_YMD, 'YYYYMMDD') <= '2025-12-12'
  AND TO_CHAR(YUKOTO_YMD, 'YYYYMMDD') >= '2025-12-12'
```

## 変換仕様
- SQL とバインド変数をリアルタイムでマージ
- `SELECT` / `FROM` / `WHERE` / `JOIN` / `ORDER BY` など主要キーワードで自動改行
- `AND` / `OR` / `ON` はインデント付きで改行
- バインド値がダブルクォートの場合はシングルクォートへ自動変換
  - 例: `"ACTIVE"` -> `'ACTIVE'`
- `NULL` / `TRUE` / `FALSE` は SQL リテラルとして保持

## 補足
- ツールは単一 HTML で動作します。
- 画面は入力欄・結果欄・コピー操作に絞ったシンプル表示です。
- 入力テキストエリアは初期表示で縦いっぱいに広がるレイアウトです。
- ボタンアイコンは CDN から Material Symbols（Google Fonts）を利用し、ファビコンは同じデータベースモチーフのオレンジSVGです。
