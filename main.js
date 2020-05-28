var service = getService();

/**
 * Authorizes and makes a request to the Zaim API.
 */
function run() {
  
  if (service.hasAccess()) {
    //スプレッドシート
    var sheet = SpreadsheetApp.getActiveSheet();
    //スプレッドシートの最終列+1
    var input_column = sheet.getLastColumn();

    //今月分の開始・終了日
    var startDate = sheet.getRange(1,input_column).getValue();
    var endDate = sheet.getRange(2,input_column).getValue();
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
      
    sheet.getRange(20,input_column).setValue(settlement(grocery_cat_arr,dateParam,true));
    sheet.getRange(21,input_column).setValue(settlement(living_cat_arr,dateParam,true));
    sheet.getRange(22,input_column).setValue(settlement(util_cat_arr,dateParam,true));
    sheet.getRange(25,input_column).setValue(settlement(wife_payment_arr,dateParam,false));

    slackInform(sheet.getRange(27,input_column).getValue());
    
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('次のURLを開いてZaimで認証したあと、再度スクリプトを実行してください。: %s',
        authorizationUrl);
  }
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
    var param =  catNum + dateParam;
    var urlp = url+param;
    var response = service.fetch(urlp, {
      method: 'get'
    });
  
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
  //夫婦Slackの#generalに算出金額を送る
  var slackToken = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  var slackApp = SlackApp.create(slackToken);
  var channelId = '#general';
  var message = '今月の精算： `¥'+amount+'` です！よろしくね！';

  var response = slackApp.postMessage(channelId,message);
}