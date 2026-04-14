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
sql=[select u . id,u.name,case when u.status = ? then '有効' else '無効' end as status_name from users u inner join orders o on u.id=o.user_id where u.id=? and (o.status=? or o.status=?)] parameters=[1=1,2=100,3="OPEN",4="HOLD"]
```

出力:
```sql
SELECT
  u.id
  , u.name
  , CASE
    WHEN u.status = 1
    THEN '有効'
    ELSE '無効'
    END AS status_name
FROM
  users u
  INNER JOIN orders o
    ON u.id = o.user_id
WHERE
  u.id = 100
  AND (o.status = 'OPEN'
    OR o.status = 'HOLD')
```

## 変換仕様
- SQL とバインド変数をリアルタイムでマージ
- A5:SQL Mk-2 風の整形ルールで、句ごとに改行して見やすく配置
- `SELECT` / `GROUP BY` / `ORDER BY` / `SET` のカンマ区切り項目を改行し、2項目目以降は前置カンマで表示
- `JOIN` / `ON` / `AND` / `OR` は階層に応じてインデント付きで改行
- `CASE` / `WHEN` / `THEN` / `ELSE` / `END` を段付きで整形
- 括弧の深さに応じて追加インデント
- 演算子（`=` / `<>` / `<=` / `+` / `*` / `/` / `||` など）とドット記法（`u . id` -> `u.id`）の空白を整形
- バインド値がダブルクォートの場合はシングルクォートへ自動変換
  - 例: `"ACTIVE"` -> `'ACTIVE'`
- `NULL` / `TRUE` / `FALSE` は SQL リテラルとして保持

## 補足
- ツールは単一 HTML で動作します。
- 画面は入力欄・結果欄・コピー操作に絞ったシンプル表示です。
- 入力テキストエリアは初期表示で縦いっぱいに広がるレイアウトです。
- ボタンアイコンは CDN から Material Symbols（Google Fonts）を利用し、ファビコンは同じデータベースモチーフのオレンジSVGです。
