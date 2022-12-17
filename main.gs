// gmailから課題提出メール、小テスト提出メールを取得し、課題を完了したかどうかをgoogle Todoに反映
// 課題提出メールと小テスト提出メールをgmailに転送する必要あり
const gmailtoTasks = () => {
  const userProperties = PropertiesService.getUserProperties();
  const taskListId = userProperties.getProperty("assignmentTaskListId");
  const options = {
    "maxResults":"100",
  }
  const taskList = Tasks.Tasks.list(taskListId,options)["items"];
  const assignmentThreads = GmailApp.search('subject:"課題提出のメールによる通知"',0,30);
  assignmentThreads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      // 課題提出メールから授業名と課題名を取得
      const siteTitle = message.getBody().match(/サイトタイトル:([\s\S]*?)<br/g)[0].slice(9,-3);
      const title = message.getBody().match(/課題：([\s\S]*?)<br/g)[0].slice(4,-3);

      // 授業名と課題名が一致しているタスクを消去
      taskList.forEach(task => {
        if((task["title"] == siteTitle + "\n" + title) && (task["notes"].includes("autoCheck:true"))){
          Tasks.Tasks.patch({
            "status":"completed",
          },taskListId,task["id"]);
        }
      });
    });
  });
  const quizThreads = GmailApp.search('subject:"Notification for assessment submission"',0,30);
  quizThreads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      // 小テスト提出メールから授業名と小テスト名を取得
      const siteTitle = message.getBody().match(/Site Title          :([\s\S]*?)\n/g)[0].slice(22,-2);
      const title = message.getBody().match(/Assessment          :([\s\S]*?)\n/g)[0].slice(22,-2);
      
      // 授業名と小テスト名が一致しているタスクを消去
      taskList.forEach(task => {
        if((task["title"] == siteTitle + "\n" + title) && (task["notes"].includes("autoCheck:true"))){
          Tasks.Tasks.patch({
            "status":"completed",
          },taskListId,task["id"]);
        }
      });
    });
  });
}

// 課題と小テストをgoogle Todoに追加または更新,ただし既に同じidの課題が存在し,更新日時が前のものは更新しない
const tasksApi = () => {
  // assignmentTaskListIdを登録済み　課題のtasklist
  const userProperties = PropertiesService.getUserProperties();
  const taskListId = userProperties.getProperty("assignmentTaskListId");
  const taskList = Tasks.Tasks.list(taskListId,{"showHidden":true,"maxResults":100});
  taskList["items"].forEach(value => {
    // タスクが完了した日から2週間経過したタスクを消去する
    const dt = new Date();
    dt.setDate(dt.getDate() - 14);
    if(dt > new Date(value["completed"])){
      Tasks.Tasks.remove(taskListId,value["id"]);
    }
  });

  // apiを利用してお気に入りに登録したサイトの,提出期限を過ぎていない課題一覧と小テスト一覧を取得する
  const {assignments,quizes} = nuctGetAssignmentsAndQuizes();
  
  // 取得した課題を追加,もしくは更新
  for(assignment of assignments){
    let exist = false;
    for(task of taskList["items"]){
      if(task["notes"] ? task["notes"].includes(assignment["id"].toString()) : false){
        exist = true;
        if(assignment["updated"] > task["updated"]){
          Tasks.Tasks.patch({
            "status":"needsAction",
            "title":`${assignment["siteTitle"]}\n${assignment["title"]}`,
            "due":assignment["due"] ? assignment["due"] : null,
            "notes":`{url:${assignment["url"]},\nnotes:${assignment["notes"]},\nautoCheck:true,\nid:${assignment["id"]}}`,
          },taskListId,task["id"]);
        }
      }
    }
    if(!exist){
      Tasks.Tasks.insert({
        "status":"needsAction",
        "title":`${assignment["siteTitle"]}\n${assignment["title"]}`,
        "due":assignment["due"] ? assignment["due"] : null,
        "notes":`{url:${assignment["url"]},\nnotes:${assignment["notes"]},\nautoCheck:true,\nid:${assignment["id"]}}`,
      },taskListId);
    }
  }

  // 取得した小テストを追加,もしくは更新
  for(quiz of quizes){
    let exist = false;
    for(task of taskList["items"]){
      if(task["notes"] ? task["notes"].includes(quiz["id"].toString()) : false){
        exist = true;
        if(quiz["updated"] > task["updated"]){
          Tasks.Tasks.patch({
            "status":"needsAction",
            "title":`${quiz["siteTitle"]}\n${quiz["title"]}`,
            "due":quiz["due"] ? quiz["due"] : null,
            "notes":`{url:${quiz["url"]},\nnotes:${quiz["notes"]},\nautoCheck:true,\nid:${quiz["id"]}}`,
          },taskListId,task["id"]);
        }
      }
    }
    if(!exist){
      Tasks.Tasks.insert({
        "status":"needsAction",
        "title":`${quiz["siteTitle"]}\n${quiz["title"]}`,
        "due":quiz["due"] ? quiz["due"] : null,
        "notes":`{url:${quiz["url"]},\nnotes:${quiz["notes"]},\nautoCheck:true,\nid:${quiz["id"]}}`,
      },taskListId);
    }
  }
}

// お気に入りのサイトから今日以降が提出締め切りの全ての課題と小テストを取得
const nuctGetAssignmentsAndQuizes = () => {

  headers = {
    "cookie": nuctCasGetCookie(),
  }
  options = {
    "method":"get",
    "headers":headers,
    "followRedirects":false,
  }

  // お気に入りのサイトidを取得
  url = "https://ct.nagoya-u.ac.jp/portal/favorites/list.json";
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  let favoriteSiteIds = JSON.parse(response)["favoriteSiteIds"];

  // 全てのサイトidからお気に入りのサイトのサイトidとタイトルのみ取得
  url = "https://ct.nagoya-u.ac.jp/direct/site.json?_limit=500";
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  let sitesJson  = JSON.parse(response);
  let favoriteSites = sitesJson["site_collection"]
    .filter(x => favoriteSiteIds.includes(x["entityId"]))
    .map(x => {return {
        "id": x["entityId"],
        "title": x["entityTitle"]
      }
    });

  // お気に入りサイトの提出期限を過ぎていない課題を取得
  let assignments = [];
  for(favoriteSite of favoriteSites){
    url = `https://ct.nagoya-u.ac.jp/direct/assignment/site/${favoriteSite["id"]}.json`;
    Utilities.sleep(500);
    response = UrlFetchApp.fetch(url,options);
    let assignmentsJson = JSON.parse(response);
    assignments = assignments.concat(assignmentsJson["assignment_collection"]
      .filter(x => x["dueTime"]["epochSecond"] ? x["dueTime"]["epochSecond"] * 1000 > new Date().getTime() : true)
      .map(x => {return {
          "title":x["entityTitle"],
          "notes":x["instructions"].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,''),
          "id":x["entityId"],
          "due":x["dueTimeString"],
          "siteTitle":favoriteSite["title"],
          "updated":Utilities.formatDate(new Date(x["timeLastModified"]["epochSecond"] * 1000),"JST","yyyy-MM-dd") + "T00:00:00Z",
          "url":`https://ct.nagoya-u.ac.jp/portal/site/${favoriteSite["id"]}`,
        }
      }));
  }

  // お気に入りサイトの提出期限を過ぎていない小テストを取得
  let quizes = [];
  for(favoriteSite of favoriteSites){
    url = `https://ct.nagoya-u.ac.jp/direct/sam_pub/context/${favoriteSite["id"]}.json`;
    Utilities.sleep(500);
    response = UrlFetchApp.fetch(url,options);
    let quizesJson = JSON.parse(response);
    quizes = quizes.concat(quizesJson["sam_pub_collection"]
      .filter(x => x["dueDate"] ? x["dueDate"] > new Date().getTime() : true)
      .map(x => {return {
        "title":x["entityTitle"],
        "notes":null,
        "id":x["publishedAssessmentId"],
        "due":x["dueDate"] ? Utilities.formatDate(new Date(parseInt(x["dueDate"])),"JST","yyyy-MM-dd") + "T00:00:00Z" : null,
        "siteTitle":favoriteSite["title"],
        "updated":Utilities.formatDate(new Date(x["lastModifiedDate"]),"JST","yyyy-MM-dd") + "T00:00:00Z",
        "url":`https://ct.nagoya-u.ac.jp/portal/site/${favoriteSite["id"]}`,
      }
    }))
  }

  return {"assignments":assignments,"quizes":quizes};
}

// 認証済みのcookieを返す
const nuctCasGetCookie = () => {
  //username,password,decodedSeedを登録済み
  const userProperties = PropertiesService.getUserProperties();

  // ログイン画面にアクセス　cookieを入手
  let url = "https://ct.nagoya-u.ac.jp/portal/login";
  let options = {
    "method": "get",
    "followRedirects": false,
  }
  let response = UrlFetchApp.fetch(url,options);
  let location = response.getAllHeaders()["Location"];
  let cookie = response.getAllHeaders()["Set-Cookie"].join(";");

  // リダイレクトでhttps://ct.nagoya-u.ac.jp/sakai-login-tool/containerにアクセス
  url = location;
  let headers = {
    "cookie":cookie,
  }
  options = {
    "method":"get",
    "headers":headers,
    "followRedirects":false,
  }
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  location = response.getHeaders()["Location"];
  cookie += ";" + response.getAllHeaders()["Set-Cookie"];

  // リダイレクトでhttps://auth-mfa.nagoya-u.ac.jp/cas/login?service=https://ct.nagoya-u.ac.jp/sakai-login-tool/containerにアクセス
  url = location;
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  location = response.getHeaders()["Location"] ? response.getHeaders()["Location"] : location;
  let html = response.getContentText();

  // usernameとpasswordをpost
  let inputTags = html.match(/<input([\s\S]*?)\/>/g);
  let payload = {};
  for(const inputTag of inputTags){
    payload[inputTag.match(/name="(.)*?"/)[0].slice(6,-1)] = inputTag.match(/value="(.)*?"/) ? inputTag.match(/value="(.)*?"/)[0].slice(7,-1) : "";
  }
  payload["username"] = userProperties.getProperty("username");
  payload["password"] = userProperties.getProperty("password");
  options = {
    "method": "post",
    "headers": headers,
    "payload": payload,
    "followRedirects": false,
  }
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  html = response.getContentText();

  // otpをpost TGCをうけとる(?)
  inputTags = html.match(/<input([\s\S]*?)\/>/g);
  pyload = {};
  for(const inputTag of inputTags){
    payload[inputTag.match(/name="(.)*?"/)[0].slice(6,-1)] = inputTag.match(/value="(.)*?"/) ? inputTag.match(/value="(.)*?"/)[0].slice(7,-1) : "";
  }
  payload["token"] = getTotpToken();
  options = {
    "method": "post",
    "headers": headers,
    "payload": payload,
    "followRedirects": false,
  }
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  location = response.getHeaders()["Location"] ? response.getHeaders()["Location"] : location;
  html = response.getHeaders();
  cookie += ";" + response.getAllHeaders()["Set-Cookie"];
  
  // ログイン完了後 ticket付きurlにアクセス
  url = location;
  options = {
    "method": "get",
    "headers": headers,
    "payload": payload,
    "followRedirects": false,
  }

  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  location = response.getHeaders()["Location"];
  html = response.getHeaders();
  cookie += ";" + response.getAllHeaders()["Set-Cookie"];

  url = location;
  headers = {
    "cookie":cookie,
  }
  options = {
    "method": "get",
    "headers": headers,
    "followRedirects": false,
  }
  Utilities.sleep(500);
  response = UrlFetchApp.fetch(url,options);
  location = response.getHeaders()["Location"] ? response.getHeaders()["Location"] : location;
  html = response.getHeaders();
  cookie += ";" + response.getAllHeaders()["Set-Cookie"];

  return cookie;
}

// totpワンタイムパスワードを返す
const getTotpToken = () => {
  const userProperties = PropertiesService.getUserProperties();
  const decodedSeed = Utilities.newBlob(userProperties.getProperty("decodedSeed")).getBytes();
  const timeStep = 30;
  const counter = Math.floor(new Date().getTime() / 1000 / timeStep).toString(16).padStart(16,"0");
  const counterBytes = [];
  for(let i=0;i<counter.length;i += 2){
    counterBytes.push(parseInt(counter.slice(i,i+2),16));
  }
  const signature = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1,counterBytes,decodedSeed).map(x => x<0 ? x + 256 : x);
  const offset = signature[19] & 15;
  const hash = signature.slice(offset,offset+4).reduce((x1,x2)=>x1.toString(2).padStart(8,"0") + x2.toString(2).padStart(8,"0")).slice(1,32);
  let token = (parseInt(hash,2)%10**6).toString(10);
  while(token.length != 6){
    token = "0" + token;
  }

  return token;
}
