//スプレッドシート
var SHEET = SpreadsheetApp.getActiveSheet();
//スプレッドシートの最終列+1
var INPUT_COLUMN = SHEET.getLastColumn();

var service = getService();

/**
 * Authorizes and makes a request to the Zaim API.
 */
function run() {
  
  if (service.hasAccess()) {
    //今月分の開始・終了日
    var startDate = SHEET.getRange(1,INPUT_COLUMN).getValue();
    var endDate = SHEET.getRange(2,INPUT_COLUMN).getValue();
    //API投入用のパラメータ文字列
    var dateParam = '&start_date='+ startDate + '&end_date=' + endDate + '&mode=payment';

    /**
     * カテゴリ番号の配列化
     */
    //食料品
    var grocery_cat_arr = ['101'];
    //食料品と光熱費以外の生活費で、ヒガシ家が計上しているもの
    var living_cat_arr = ['102','103','104','106','107','108','109','110','111','199'];
    //光熱費
    var util_cat_arr = ['105'];
    //妻支出のジャンル番号
    var wife_payment_arr = ['2512219'];
      
    SHEET.getRange(20,INPUT_COLUMN).setValue(settlement(grocery_cat_arr,dateParam,true));
    SHEET.getRange(21,INPUT_COLUMN).setValue(settlement(living_cat_arr,dateParam,true));
    SHEET.getRange(22,INPUT_COLUMN).setValue(settlement(util_cat_arr,dateParam,true));
    SHEET.getRange(25,INPUT_COLUMN).setValue(settlement(wife_payment_arr,dateParam,false));

    slackInform(SHEET.getRange(27,INPUT_COLUMN).getValue());
    
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('次のURLを開いてZaimで認証したあと、再度スクリプトを実行してください。: %s',
        authorizationUrl);
  }
} 

/**
 * 日付の自動入力
 */
function inputDate(){
  var firstDate = new Date();
  firstDate.setMonth(firstDate.getMonth()-1);
  firstDate.setDate(1);
  SHEET.getRange(1,INPUT_COLUMN).setValue(firstDate);

  var lastDate = new Date();
  lastDate.setDate(0);
  SHEET.getRange(2,INPUT_COLUMN).setValue(lastDate);
}

/**
 * Zaim APIから支払いデータを取ってくる関数
 * @param String dateparam 
 */
function settlement(catArr,dateParam,cat_flag){
  //そのセグメントの合計金額
  var total = 0;

  //ZaimAPIのURL
  var url = 'https://api.zaim.net/v2/home/money?mapping=1';

  //カテゴリかジャンルかの判別
  if(cat_flag){
    url = url + '&category_id=';
  }else{
    url = url + '&genre_id=';
  }
  

catArr.forEach(function (catNum) {
  //カテゴリごとに算出
  Logger.log('========'+catNum+'========');
  var param =  catNum + dateParam;
  var urlp = url+param;
  Logger.log(urlp);
  var response = service.fetch(urlp, {
    method: 'get'
  });
    
  Logger.log(response.getContentText());
  Logger.log('=====================')
  
  var result = JSON.parse(response.getContentText());
  total += getTotalPay(result);
  });

  return total;
}

/**
 * 合計金額を取得する関数
 * @param JsonObject result 
 */
function getTotalPay(result){
  var sum = 0;
  //Logger.log(result);

  for(var i = 0; i< result.money.length; i++){
    var num = result.money[i].amount;
    sum += num;
  }

  return sum;
}

/**
 * 合計金額をSlackに流す
 * @param {*} amount 
 */
function slackInform(amount){
  amount = Math.round(amount);
  //夫婦Slackのgeneralに算出金額を送る
  var slackToken = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  var slackApp = SlackApp.create(slackToken);
  var channelId = '#general';
  var message = '今月の精算： `¥'+amount+'` です！よろしくね！';

  var response = slackApp.postMessage(channelId,message);
  Logger.log(response);
}