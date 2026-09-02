/**
 * 참석 의사 수집 — Google Apps Script 웹앱
 *
 * 배포 절차는 저장소 README 의 "참석 의사 전달" 절을 본다.
 * 요약 = 스프레드시트 → 확장 프로그램 → Apps Script → 이 코드 붙여넣기 →
 *        배포 → 웹 앱 · 실행 계정 "나" · 액세스 권한 "모든 사용자"
 *
 * 응답은 같은 스프레드시트의 SHEET_NAME 시트에 쌓인다.
 * 방문자 ID 가 같으면 새 줄을 만들지 않고 그 줄을 고쳐 쓴다 (하객이 잘못 눌렀을 때 다시 보낼 수 있게).
 */

// 열 구성이 바뀌면 뒤 버전을 올린다 (v1 → v2). 옛 회신은 옛 시트에 그대로 남는다
var SHEET_NAME = '모청 참석 회신 v1';
var HEADERS = ['방문자ID', '구분', '참석여부', '식사인원', '성함', '전달말씀', '최초접수', '최종수정', '수정횟수'];
var COL = { id: 1, side: 2, attend: 3, meal: 4, name: 5, msg: 6, first: 7, last: 8, edits: 9 };

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
      Number(d.meal) || 0,
      String(d.name || '').slice(0, 20),
      String(d.msg || '').slice(0, 200)
    ];

    if (row) {
      var edits = Number(sh.getRange(row, COL.edits).getValue()) || 0;
      sh.getRange(row, COL.last).setValue(now);
      sh.getRange(row, COL.edits).setValue(edits + 1);
      sh.getRange(row, COL.side, 1, 5).setValues([values]);
      return json_({ ok: true, mode: 'update', edits: edits + 1 });
    }

    sh.appendRow([id].concat(values, [now, now, 0]));
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

  var v = sh.getRange(row, COL.side, 1, 5).getValues()[0];
  return json_({
    ok: true, found: true,
    side: v[0], attend: v[1], meal: v[2], name: v[3], msg: v[4],
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
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
