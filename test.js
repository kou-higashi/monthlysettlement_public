function test(){
  //今月分の開始・終了日
  var startDate = SHEET.getRange(1,INPUT_COLUMN).getValue();
  var endDate = SHEET.getRange(2,INPUT_COLUMN).getValue();
  //API投入用のパラメータ文字列
  var dateParam = '&start_date='+ startDate + '&end_date=' + endDate + '&mode=payment';

  Logger.log(getGroceryPayment(dateParam));
}

function test2(){
    var startDate = SHEET.getRange(1,INPUT_COLUMN).getValue();
  var endDate = SHEET.getRange(2,INPUT_COLUMN).getValue();
  //API投入用のパラメータ文字列
  var dateParam = '&start_date='+ startDate + '&end_date=' + endDate;

  
  var url = 'https://api.zaim.net/v2/home/money?mapping=1';
  //var url = 'https://api.zaim.net/v2/home/money';

  //カテゴリかジャンルかの判別
  /*
  if(flag){
    url = url + '&category_id=';
  }else{
    url = url + '&genre_id=';
  }
  */

  //カテゴリごとに算出
  //Logger.log('========'+catNum+'========');
  //var param =  catNum + dateParam;
  var param = dateParam
  var urlp = url+param;
  
  Logger.log(urlp);
  var response = service.fetch(url, {
    method: 'get'
  });
    
  console.log(response.getContentText());
}

function test3(){
  slackInform(150000);
}
function testInputDate(){
  inputDate();
}

function testCopyCells (){
  SHEET.getRange(INPUT_COLUMN-1).copyTo(SHEET.getRange(INPUT_COLUMN));
}