/**
 * 참석 의사 수집 — Google Apps Script 웹앱
 *
 * 배포 절차
 *  1. https://sheets.new 로 새 스프레드시트 생성 → 이름 아무거나
 *  2. 확장 프로그램 → Apps Script → 기본 코드 전체 지우고 이 파일 내용 붙여넣기
 *  3. 배포 → 새 배포 → 유형 "웹 앱"
 *       - 실행 계정 = 나
 *       - 액세스 권한이 있는 사용자 = **모든 사용자**   ← 이걸 안 바꾸면 하객이 못 보냄
 *  4. 배포 후 나오는 웹앱 URL(https://script.google.com/macros/s/.../exec) 을 전달
 *
 * 응답은 같은 스프레드시트의 rsvp 시트에 한 줄씩 쌓인다.
 */

var SHEET_NAME = 'rsvp';
var HEADERS = ['접수시각', '성함', '구분', '참석여부', '식사인원', '전달말씀'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    sh.appendRow([
      new Date(),
      String(d.name || '').slice(0, 20),
      String(d.side || ''),
      String(d.attend || ''),
      Number(d.meal) || 0,
      String(d.msg || '').slice(0, 200)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// 브라우저에서 주소를 직접 열었을 때 확인용
function doGet() {
  return json_({ ok: true, sheet: SHEET_NAME, count: getSheet_().getLastRow() - 1 });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
