# EventPort UI Customizer

<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="EventPort UI Customizer Icon">
  <br>
  <strong>EventPort（イベントポート）の一覧画面をより見やすく、快適にするChrome拡張機能</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-orange.svg" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Chrome_Web_Store-Under_Review-yellow.svg" alt="Store Status">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT">
</p>

---

## 📢 お知らせ
現在 **Chrome ウェブストアに申請中（審査待ち）** です。  
審査が通過しストアで公開されるまでの間は、下記の手順で **プレビュー版（ZIPファイル）** を手動インストールしてお使いいただけます。

---

## 📸 スクリーンショット

### 1. ダッシュボード（サークル参加受付中一覧）
申込済みイベントの強調（緑色）、同日他イベントの自動グレーアウト、ボイベまとめ締切警告バッジ、ヘッダーソートに対応。
<p align="center">
  <img src="images/screenshot1.png" alt="ダッシュボードの表示例" width="100%">
</p>

### 2. 参加イベント一覧（サークル）
昨日以前の終了した過去イベントをワンクリックで非表示。これから参加する直近イベントだけをすっきり確認できます。
<p align="center">
  <img src="images/screenshot2.png" alt="参加イベント一覧の表示例" width="100%">
</p>

### 3. ポップアップ設定画面
ブラウザツールバーのアイコンから、過去イベント非表示・グレーアウト・初期並び順・締切警告期間のカスタマイズが手軽に行えます。
<p align="center">
  <img src="images/screenshot3.png" alt="設定ポップアップ画面" width="60%">
</p>

---

## ✨ 主な機能

### 1. テーブルのヘッダークリックソート
- 「イベント名」「開催日」「開催場所」「参加サークル名」などの列見出しをクリックするだけで、昇順・降順に素早く並び替えできます。

### 2. 過去イベントのワンクリック非表示
- 参加イベント一覧（サークル・メンバー・一般）において、昨日以前に終了した過去イベントを非表示にし、直近の参加予定イベントだけをすっきり確認できます。
- ツールバーのトグルスイッチでいつでも表示／非表示を切り替え可能です。

### 3. キーワードリアルタイム検索
- 表の上部に検索ボックスを設置。イベント名や開催場所をインクリメンタルに即座に絞り込み検索できます。

### 4. 申込状況の強調＆同日他イベントのグレーアウト（トップページ）
- トップページ（サークル参加受付中一覧）で、**すでに自分が申し込んでいるイベントをグリーン色で強調表示**します。
- さらに、**申し込んでいるイベントと同日に開催される他の競合イベントを自動的にグレーアウト**し、重複申込やスケジュール競合を視覚的に防ぎます。
- ※外部サーバーへ通信せず、ページ内のボタン表示のみで安全に自己完結判定します。

### 5. 「ボイベまとめ」連携・締切警告バッジ
- 音声合成系イベント情報サイト「[ボイベまとめ](https://vo.nrsy.jp/)」様と正式許諾のもと連携！
- 募集締切や申込変更締切が近づいているイベントに「あと〇日」の警告バッジを表示します。
- 24時間のローカルキャッシュ設計により、サーバーに負荷をかけない低負荷仕様です。

### 6. 厳格なURL制限による安全性
- 意図しない誤動作を防ぐため、指定された以下の4画面でのみ厳格に動作します。申込フォーム入力画面やチケット詳細、決済画面などでは一切動作しません。

| ページ名 | 対象URL |
| :--- | :--- |
| **受付中イベント一覧（トップ）** | `https://event-port.com/dashboard` |
| **参加イベント一覧（サークル）** | `https://event-port.com/circle-participation` |
| **参加イベント一覧（メンバー）** | `https://event-port.com/seller-participation` |
| **参加イベント一覧（一般）** | `https://event-port.com/general-participation` |

---

## 📥 プレビュー版のインストール手順（手動導入）

Chrome ウェブストアの公開までの間、以下の手順ですぐにお使いいただけます（所要時間：約1分）。

### ステップ 1: ZIPファイルのダウンロード
1. [GitHub Releases](https://github.com/himajin0816/EventPort-UI-Customizer/releases) から最新のプレビュー版 ZIP ファイル（`EventPort_Customizer_v1.0.0.zip`）をダウンロードします。
2. ダウンロードした ZIP ファイルを任意のフォルダに **展開（解凍）** します。

### ステップ 2: Chrome への読み込み
1. Google Chrome を開き、アドレスバーに `chrome://extensions` と入力して開きます（または右上のメニュー `⋮` >「拡張機能」>「拡張機能を管理」）。
2. 画面右上にある **「デベロッパー モード」** のスイッチを **ON** にします。
3. 画面左上に表示される **「パッケージ化されていない拡張機能を読み込む」** をクリックします。
4. 先ほど解凍したフォルダ（`manifest.json` が入っているフォルダ）を選択します。
5. 一覧に **「EventPort UI Customizer」** が表示されればインストール完了です！🎉

EventPort（https://event-port.com/dashboard 等）を開くと、自動的にカスタム機能が有効化されます。

---

## 🔒 プライバシーポリシー
当拡張機能は、ユーザーの個人情報（氏名、アカウント情報、決済情報、申込データ等）を収集・外部送信することは一切ありません。  
詳細なプライバシーポリシーは以下をご確認ください：  
👉 [プライバシーポリシー (https://github.hmzn.cloud/EventPort-UI-Customizer/)](https://github.hmzn.cloud/EventPort-UI-Customizer/)

---

## 🙏 謝辞・データ連携
- 本拡張機能の締切警告機能は、音声合成系イベント開催情報まとめサイト「[ボイベまとめ](https://vo.nrsy.jp/)」管理者様より正式にデータ利用の許諾をいただき実装しております。貴重な情報をご提供いただき、心より感謝申し上げます。
- ※本拡張機能は有志による非公式のファンメイドツールであり、EventPort公式様とは関係ありません。

---

## 📄 ライセンス
[MIT License](LICENSE)
