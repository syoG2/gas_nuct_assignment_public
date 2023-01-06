# 機能
- GASでNUCTから課題,小テストを取得する(お気に入り登録したサイトから)
- 取得した課題,小テストをGoogle Tasks(Todoリスト)に追加する
- 提出完了メールをGmailに転送する設定(プログラム外で設定してもらう必要あり)をすることで自動チェックを行う

# 使い方
1. コードを取り込む
  - main.gs
  - settingUserProp.gs
  
    をGASのエディタに取り込んでください.
    (Chromeの拡張機能に"Google Apps Script GitHub アシスタント"というものもあります)
    (appsscript.jsonというファイルを取り込むと、設定を取り込むことができ、3.の手順にあるTasks APIを追加した状態にできるようです)

2. ログインのための情報と課題を追加したいタスクリストのidを設定
  settingUserProp.gsを使って
  - 名大id
  - パスワード
  - ワンタイムパスワードのシード値
  - 課題を反映したいtasklistのid **(tasklistのidは念の為,このプログラムを使う専用のtasklistを作成して,そのidを利用してください)**
  
    を設定してください.

3. GASのエディタでサービスの欄からTasks APIを追加
  (appsscript.jsonというファイルを取り込むと、設定を取り込むことができ、3.の手順にあるTasks APIを追加した状態にできるようです)
  
4. 提出完了メールをGmailに転送する設定を行う(必須ではない)

5. トリガーの設定
  - tasksApi (タスクを取得してTodoリストに反映する関数)
  - gmailtoTasks (Gmailを利用して課題の完了を反映する関数)
  
    をトリガーをつけて実行
    
# メソッドの説明
- gmailtoTasks()
  <br/>gmailから課題提出メール、小テスト提出メールを取得し、課題を完了したかどうかをgoogle Todoに反映
  <br/>課題提出メールと小テスト提出メールをgmailに転送する必要あり
- tasksApi()
  <br/>課題と小テストをgoogle Todoに追加または更新,ただし既に同じidの課題が存在し,更新日時が前のものは更新しない
- nuctGetAssignmentsAndQuizes()
  <br/>NUCT上でお気に入りのサイトから今日以降が提出締め切りの全ての課題と小テストを取得
- nuctCasGetCookie()
  <br/>認証済みのcookieを返す
- getTotpToken()
  <br/>totpワンタイムパスワードを返す
