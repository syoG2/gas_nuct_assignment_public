// userPropertiesに必要な情報を設定する関数
// 該当箇所に情報を入力し、実行したら消去可
// 入力するのは名大id,パスワード,ワンタイムパスワードのシード値

// tasklistのidは
// console.log(Tasks.Tasklists.list());
// を実行することで,titleとidを確認できます.
// プログラムに問題はないと思いますが,万が一のために,大学の課題専用のタスクリストを作成してそのtasklistのidを利用してください.

const setUserProp = () => {
  const userProperties = PropertiesService.getUserProperties();
  // google tasksのtasklistのidを"google tasksのtasklistのid"に設定
  userProperties.setProperty("assignmentTaskListId","google tasksのtasklistのid");
  // usernameとして名大idを"名大id"に設定
  userProperties.setProperty("username","名大id");
  // passwordとしてログイン時のパスワードを"パスワード"に設定
  userProperties.setProperty("password","パスワード");

  // シード値を"シード値"に設定
  const seed = "シード値"
  // decodedSeedとしてワンタイムパスワードのシード値をBase32デコードした値を設定
  userProperties.setProperty("decodeSeed",base32decode(seed));

}

const base32decode = (seed) => {
  const base32DecodeMap = {
    "A":0,"B":1,"C":2,"D":3,"E":4,"F":5,"G":6,"H":7,"I":8,"J":9,"K":10,
    "L":11,"M":12,"N":13,"O":14,"P":15,"Q":16,"R":17,"S":18,"T":19,"U":20,
    "V":21,"W":22,"X":23,"Y":24,"Z":25,"2":26,"3":27,"4":28,"5":29,"6":30,
    "7":31,
  }
  let decodeSeed = "";
  let binary = "";
  for(let i=0;i<seed.length;i++){
    binary += base32DecodeMap[seed[i]].toString(2).padStart(5,"0");
  }
  for(let i=0;i<binary.length;i += 8){
    decodeSeed += String.fromCharCode(parseInt(binary.slice(i,i+8),2));
  }

  return decodeSeed;
}


