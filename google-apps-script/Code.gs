/**
 * Thiệp cưới Vân Anh & Trung Kiên
 * Google Sheet + Apps Script: nhận xác nhận tham dự và lời chúc.
 *
 * Cài đặt:
 * 1. Tạo Google Sheet mới.
 * 2. Extensions > Apps Script > dán toàn bộ file này vào Code.gs > Save.
 * 3. Chạy hàm setup() một lần (Authorize khi Google hỏi).
 * 4. Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Deploy, copy "Web app URL".
 * 5. Dán URL đó vào assets/js/config.js:
 *    rsvp: "URL",
 *    guestbook: "URL"
 */

var RSVP_SHEET = "RSVP";
var WISH_SHEET = "Wishes";
var SUMMARY_SHEET = "Tổng hợp";

function doPost(e) {
  var params = (e && e.parameter) || {};
  var action = String(params.action || "rsvp");
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000);
    if (action === "wish") {
      return appendWish_(params);
    }
    return appendRsvp_(params);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {
      // ignore
    }
  }
}

function doGet() {
  return json_({ ok: true, service: "wedding-rsvp" });
}

function setup() {
  getRsvpSheet_();
  getWishSheet_();
  ensureSummary_();
}

function appendRsvp_(params) {
  var name = clean_(params.name, 80);
  var attendRaw = String(params.attend || "").toLowerCase();
  var guest = clean_(params.guest, 80);

  if (!name) {
    return json_({ ok: false, error: "missing name" });
  }

  var attendLabels = {
    yes: "Có",
    maybe: "Có thể",
    no: "Không"
  };
  var attend = attendLabels[attendRaw] || "Khác";

  var count = parseInt(params.count, 10);
  if (isNaN(count) || count < 0) {
    count = attend === "Không" ? 0 : 1;
  }
  count = Math.min(20, count);
  if (attend === "Không") {
    count = 0;
  }
  if ((attend === "Có" || attend === "Có thể") && count < 1) {
    count = 1;
  }

  var sheet = getRsvpSheet_();
  sheet.appendRow([new Date(), name, attend, count, guest]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy HH:mm");
  ensureSummary_();

  return json_({ ok: true });
}

function appendWish_(params) {
  var name = clean_(params.name, 80);
  var wish = clean_(params.wish, 300);
  var guest = clean_(params.guest, 80);

  if (!name || !wish) {
    return json_({ ok: false, error: "missing name or wish" });
  }

  var sheet = getWishSheet_();
  sheet.appendRow([new Date(), name, wish, guest]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy HH:mm");
  ensureSummary_();

  return json_({ ok: true });
}

function getRsvpSheet_() {
  return getSheet_(RSVP_SHEET, [
    "Thời gian",
    "Tên khách",
    "Tham dự",
    "Số người",
    "Thiệp mời"
  ]);
}

function getWishSheet_() {
  return getSheet_(WISH_SHEET, [
    "Thời gian",
    "Tên",
    "Lời chúc",
    "Thiệp mời"
  ]);
}

function getSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function ensureSummary_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUMMARY_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET);
  }

  sheet.getRange(1, 1).setValue("Tổng hợp xác nhận").setFontSize(14).setFontWeight("bold");
  sheet.getRange(3, 1, 1, 2).setValues([["Chỉ số", "Giá trị"]]).setFontWeight("bold");

  var labels = [
    ["Tổng số phản hồi"],
    ["Số người tham dự"],
    ["Số phản hồi Có"],
    ["Số phản hồi Có thể"],
    ["Số phản hồi Không"],
    ["Số lời chúc"]
  ];

  var formulas = [
    ["=COUNTA(RSVP!B2:B)"],
    ["=SUM(RSVP!D2:D)"],
    ['=SUMPRODUCT(--(RSVP!C2:C="Có"))'],
    ['=SUMPRODUCT(--(RSVP!C2:C="Có thể"))'],
    ['=SUMPRODUCT(--(RSVP!C2:C="Không"))'],
    ["=COUNTA(Wishes!B2:B)"]
  ];

  sheet.getRange(4, 1, labels.length, 1).setValues(labels);
  sheet.getRange(4, 2, formulas.length, 1).setFormulas(formulas);
  sheet.getRange(4, 2, formulas.length, 1).setNumberFormat("0");
  sheet.autoResizeColumns(1, 2);

  return sheet;
}

function clean_(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function json_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
