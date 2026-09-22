# Trustimer 仕様書 (Requirements & Technical Specification)

## 1. 概要
**Trustimer** は、Linux および Windows をメインターゲットとした、競技用スピードキュービング（ルービックキューブ）向けのデスクトップタイマーアプリケーションです。
WCA（World Cube Association）公式ルールに準拠したスクランブル生成やインスペクション計測、厳密な統計計算を提供しつつ、計測中は思考を妨げないミニマルで高レスポンスなUI/UXを実現します。

---

## 2. 技術スタック

| レイヤー | 技術選定 | 選定理由・役割 |
| :--- | :--- | :--- |
| **デスクトップ基盤** | Tauri (Rust) | 軽量・高速、ネイティブウィンドウ制御、クロスプラットフォーム (Linux / Windows) |
| **フロントエンド** | React (TypeScript) + Vite | 高速な開発サイクル、型安全性、リアクティブな状態管理 |
| **スタイリング** | Tailwind CSS + shadcn/ui | 高いカスタマイズ性とアクセシビリティ。ShiUIライクなミニマル・フラットインク調デザインを再現 |
| **スクランブル生成** | `cubing.js` | WCA公式準拠のRandom State Scrambleをフロントエンドで完結 |
| **データ永続化** | SQLite (Tauri側: `rusqlite` / `tauri-plugin-sql`) | 数万件の記録でも高速な検索・集計、ローカル完結の堅牢なデータストレージ |
| **音声・刻時** | Web Audio API / `performance.now()` | 低遅延・高精度の時間計測、ミリ秒単位の正確性担保 |

---

## 3. UI/UX・デザイン仕様

### 3.1 ビジュアルデザイン（ShiUIインスパイア・フラットインク調）
* **配色**:
  * 背景: 生成り/オフホワイト（Light）または 墨色/チャコール（Dark）
  * テキスト: 墨色（Light）または オフホワイト（Dark）
  * アクセント: 朱色（Vermilion / 鮮やかな赤）
  * 状態表示: ホールド中＝赤、準備完了（Ready）＝緑
* **スタイル特性**:
  * ドロップシャドウを完全に排除したフラットデザイン
  * 1.5pxのシャープで繊細なボーダー
  * 余計な装飾を削ぎ落とし、タイマー数値とスクランブル文字の可読性を最優先
* **レイアウト**:
  * ウィンドウサイズ変更に完全対応するレスポンシブデザイン
  * 画面上部: スクランブル表示、種目セレクタ、セッションセレクタ
  * 画面中央: メインタイマー表示（特大フォント）
  * 画面下部/サイドバー: タイム一覧、統計サマリー（ベスト、Current/Best ao5, ao12等）

### 3.2 計測中の画面表示（Zenモード）
設定画面にて、計測中のタイマー表示を以下の3通りから切り替え可能：
1. **リアルタイム（ミリ秒）**: 通常表示
2. **秒単位のみ**: 集中力を乱さないよう、1秒単位の更新に抑制
3. **非表示（完全Zenモード）**: 計測中は数値を隠し、タイマー停止時に確定タイムを表示

---

## 4. 機能要件

### 4.1 タイマー機能
* **操作仕様**:
  1. `Space` キー押下 $\rightarrow$ ホールド状態（文字色が赤に変化）
  2. 規定時間（設定値: 0.3s〜0.5s）経過 $\rightarrow$ レディ状態（文字色が緑に変化）
  3. `Space` キーを離す $\rightarrow$ 計測開始
  4. 任意のキー押下 $\rightarrow$ 計測停止
  5. 停止後、誤操作防止のためのクールダウン時間（300ms）を設け、次のキー入力を一時的にブロック
* **入力・精度制御**:
  * OSのキーリピート（`event.repeat === true`）を完全に無視
  * スペースキーによるブラウザ既定動作（スクロール等）の無効化（`e.preventDefault()`）
  * `performance.now()` を用いた開始・停止時刻の差分計算（描画フレームレートに依存しない精度）

### 4.2 WCAインスペクション機能（オン/オフ切替）
* **インスペクション有効時の動作フロー**:
  1. `Space` キー長押し $\rightarrow$ 離すと15秒カウントダウン開始
  2. 画面に残り秒数を大きくカウントダウン表示
  3. 8秒経過時: 画面フラッシュ / 警告音（"8 seconds"）
  4. 12秒経過時: 画面フラッシュ / 警告音（"12 seconds"）
  5. 15秒〜17秒以内のスタート: 記録に自動で `+2` ペナルティ付与
  6. 17秒超過: 自動で `DNF`（Did Not Finish）判定
  7. カウントダウン中に再度 `Space` キー長押し（Ready状態） $\rightarrow$ 離して本番計測開始

### 4.3 スクランブル生成
* **対応種目（WCA準拠）**:
  * 3x3x3 (Random State), 2x2x2, 4x4x4, 5x5x5, 6x6x6, 7x7x7
  * 3x3 OH (One-Handed)
  * Pyraminx, Skewb, Megaminx, Square-1, Clock
* **仕様**:
  * 種目切り替え時に該当種目の公式スクランブルを自動生成
  * 計測完了時に次のスクランブルを即時バックグラウンド生成
  * 手動でのスキップ・再生成（ショートカットまたはクリック）に対応
  * 展開図プレビューは初期スコープから除外（非表示）

### 4.4 記録管理・セッション機能
* **セッション管理**:
  * セッションの新規作成、名前変更、削除
  * セッションごとに対象種目が紐づき、切り替え時にそのセッションの履歴と統計を表示
* **記録（Solve）の操作**:
  * 直前または過去の記録の削除
  * ペナルティ（`None`, `+2`, `DNF`）の付与・トグル解除
* **クリップボードコピー**:
  * 最新のソルブタイムのみをクリップボードにコピー（外部大会・チャット貼り付け用）
  * 形式: `12.34`（ペナルティ時は `14.34+` または `DNF`）

### 4.5 統計計算仕様（WCA公式ルール準拠）
* **計算指標**:
  * 単発ベスト / ワースト
  * **mo3** (Mean of 3): 直近3回の相加平均（1つでもDNFがあれば結果はDNF）
  * **ao5** (Average of 5): 直近5回中、最速と最遅を除いた3回の相加平均
    * DNFが1つの場合: 最遅扱いとして除外
    * DNFが2つ以上の場合: 結果はDNF
  * **ao12 / ao50 / ao100**: 上位5%および下位5%を除外したトリム平均
* 各指標について、Current（現在値）と Best（セッション内最高値）を常時算出

### 4.6 キーボードショートカット一覧

| キー | 動作 |
| :--- | :--- |
| `Space` (長押し $\rightarrow$ 離す) | タイマースタート（またはインスペクション開始） |
| `Any Key` (計測中) | タイマーストップ |
| `2` | 直前の記録に `+2` ペナルティをトグル付与/解除 |
| `d` / `D` | 直前の記録に `DNF` ペナルティをトグル付与/解除 |
| `Ctrl + C` | 最新のタイム数値をクリップボードにコピー |
| `Alt + N` / スクランブル部クリック | 次のスクランブルを再生成（スキップ） |

---

## 5. データモデル設計（SQLite）

### `sessions` テーブル
```sql
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,           -- UUID
    name TEXT NOT NULL,           -- セッション名 (例: "Main", "3x3 Warmup")
    event TEXT NOT NULL,          -- 種目コード (例: "333", "222", "444", "pyram")
    created_at INTEGER NOT NULL,  -- UNIXタイムスタンプ (ミリ秒)
    updated_at INTEGER NOT NULL
);
```

### `solves` テーブル
```sql
CREATE TABLE IF NOT EXISTS solves (
    id TEXT PRIMARY KEY,           -- UUID
    session_id TEXT NOT NULL,     -- sessions.id への外部キー
    time_ms INTEGER NOT NULL,      -- 最終タイム（+2の場合は raw_time_ms + 2000）
    raw_time_ms INTEGER NOT NULL,  -- ペナルティ前の生計測タイム
    penalty TEXT NOT NULL,         -- 'NONE' | 'PLUS_TWO' | 'DNF'
    scramble TEXT NOT NULL,        -- 使用したスクランブル文字列
    comment TEXT DEFAULT '',       -- メモ・備考
    created_at INTEGER NOT NULL,   -- UNIXタイムスタンプ (ミリ秒)
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_solves_session ON solves(session_id, created_at DESC);
```

### `settings` テーブル
```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```
主な設定値:
* `inspection_enabled`: boolean ("true" / "false")
* `timer_update_mode`: string ("all" | "seconds" | "none")
* `hold_duration_ms`: number (300〜500)
* `theme_mode`: string ("dark" | "light" | "system")
* `current_session_id`: string

---

## 6. タイマー状態遷移図 (State Machine)

```text
[IDLE]
  │
  │ (Space KeyDown)
  ▼
[HOLDING] (赤色表示) ──(Space KeyUp < HoldTime)──▶ [IDLE] (キャンセル)
  │
  │ (HoldTime経過: 約0.3秒)
  ▼
[READY] (緑色表示)
  │
  │ (Space KeyUp)
  ├───────────────────────────────────────────┐
  │ (Inspection OFF)                          │ (Inspection ON)
  ▼                                           ▼
[RUNNING]                                  [INSPECTION] (15秒カウントダウン)
  │                                           │
  │ (Any KeyDown)                             │ (Space KeyDown -> HoldTime -> KeyUp)
  ▼                                           ▼
[STOPPED] ◀───────────────────────────────── [RUNNING]
  │
  │ (Cooldown経過: 300ms)
  ▼
[IDLE] (DB保存 & 統計再計算 & クリップボードコピー可能)
```

---

## 7. 今後の拡張ロードマップ（v2以降の検討事項）
* csTimer / CubeDesk からのデータインポート・エクスポート (CSV / JSON)
* スクランブルの2D/3Dプレビュー表示
* Stackmat タイマー等の外部ハードウェア連携
* ソルブ履歴のグラフ可視化（トレンドチャート）
