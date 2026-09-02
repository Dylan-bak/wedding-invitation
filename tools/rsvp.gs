/**
 * 참석 의사 수집 — Google Apps Script 웹앱
 *
 * 배포 절차는 저장소 README 의 "참석 의사 전달" 절을 본다.
 * 요약 = 스프레드시트 → 확장 프로그램 → Apps Script → 이 코드 붙여넣기 →
 *        배포 → 웹 앱 · 실행 계정 "나" · 액세스 권한 "모든 사용자"
 *
 * 응답은 같은 스프레드시트의 rsvp 시트에 쌓인다.
 * 방문자 ID 가 같으면 새 줄을 만들지 않고 그 줄을 고쳐 쓴다 (하객이 잘못 눌렀을 때 다시 보낼 수 있게).
 */

var SHEET_NAME = 'rsvp';
var HEADERS = ['최초접수', '최종수정', '수정횟수', '방문자ID', '구분', '참석여부', '식사인원'];
var COL = { first: 1, last: 2, edits: 3, id: 4, side: 5, attend: 6, meal: 7 };

function doPost(e) {
  var lock = LockService.getScriptLock();       // 동시에 여러 명이 보낼 때 줄이 섞이지 않게
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var id = String(d.id || '').slice(0, 60);
    if (!id) return json_({ ok: false, error: 'no id' });

    var sh = getSheet_();
    var now = new Date();
    var row = findRowById_(sh, id);

    var values = [
      String(d.side || ''),
      String(d.attend || ''),
      Number(d.meal) || 0
    ];

    if (row) {
      var edits = Number(sh.getRange(row, COL.edits).getValue()) || 0;
      sh.getRange(row, COL.last).setValue(now);
      sh.getRange(row, COL.edits).setValue(edits + 1);
      sh.getRange(row, COL.side, 1, 3).setValues([values]);
      return json_({ ok: true, mode: 'update', edits: edits + 1 });
    }

    sh.appendRow([now, now, 0, id].concat(values));
    return json_({ ok: true, mode: 'insert' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** 방문자 ID 로 이전 응답을 되돌려준다. 다시 열었을 때 지난 선택을 채워 보여주는 데 쓴다 */
function doGet(e) {
  var id = e && e.parameter ? String(e.parameter.id || '') : '';
  var sh = getSheet_();
  if (!id) return json_({ ok: true, count: Math.max(0, sh.getLastRow() - 1) });

  var row = findRowById_(sh, id);
  if (!row) return json_({ ok: true, found: false });

  var v = sh.getRange(row, COL.side, 1, 3).getValues()[0];
  return json_({
    ok: true, found: true,
    side: v[0], attend: v[1], meal: v[2],
    edits: Number(sh.getRange(row, COL.edits).getValue()) || 0
  });
}

function findRowById_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, COL.id, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return 0;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    return sh;
  }
  // 예전 양식(성함 기준)으로 만들어진 시트면 새 양식으로 갈아둔다
  var head = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|');
  if (head !== HEADERS.join('|') && sh.getLastRow() <= 1) {
    sh.clear();
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
