# 機能
- GASでNUCTから課題,小テストを取得する
- 取得した課題,小テストをGoogle Tasks(Todoリスト)に追加する
- 提出完了メールをGmailに転送する設定(プログラム外で設定してもらう必要あり)をすることで自動チェックを行う

# 使い方
1. コードを取り込む
  - main.gs
  - settingUserProp.gs
    
    をGASのエディタに取り込んでください.

2. ログインのための情報と課題を追加したいタスクリストのidを設定
  settingUserProp.gsを使って
  - 名大id
  - パスワード
  - ワンタイムパスワードのシード値
  - 課題を反映したいtasklistのid **(tasklistのidは念の為,このプログラムを使う専用のtasklistを作成して,そのidを利用してください)**
  
    を設定してください.

3. GASのエディタでサービスの欄からTasks APIを追加
4. 提出完了メールをGmailに転送する設定を行う(必須ではない)
5. トリガーの設定
  - tasksApi (タスクを取得してTodoリストに反映する関数)
  - gmailtoTasks (Gmailを利用して課題の完了を反映する関数)
  
    をトリガーをつけて実行
