/**
 * Google Apps Script for Aircraft Parts Management System (Updated)
 */

/**
 * ฟังก์ชันสร้างหัวตารางใหม่ (Header Setup)
 * ให้เลือกฟังก์ชันนี้แล้วกด Run เพื่อเตรียมความพร้อมของ Spreadsheet
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
  sheet.clear(); // ล้างข้อมูลเดิมทั้งหมดเพื่อจัดระเบียบใหม่
  
  var headers = [
    "Timestamp", 
    "TransactionID", 
    "Location", 
    "Date", 
    "Aircraft", 
    "KasetNo", 
    "Ref", 
    "RepairType", 
    "Operator", 
    "OpRank", 
    "Supervisor", 
    "SvRank", 
    "Item", 
    "PN", 
    "SN", 
    "Qty", 
    "Note"
  ];
  
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
       .setBackground("#2563eb")
       .setFontColor("white")
       .setFontWeight("bold");
  
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, headers.length, 120);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
  
  // Create Header if sheet is empty
  if (sheet.getLastRow() == 0) {
    sheet.appendRow([
      "Timestamp", 
      "TransactionID", 
      "Location", 
      "Date", 
      "Aircraft", 
      "KasetNo", 
      "Ref", 
      "RepairType", 
      "Operator", 
      "OpRank", 
      "Supervisor", 
      "SvRank", 
      "Item", 
      "PN", 
      "SN", 
      "Qty", 
      "Note"
    ]);
  }
  
  try {
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();
    var transactionId = data.transactionId || ("TX-" + timestamp.getTime());
    
    // Edit Mode: Remove existing rows with the same TransactionID before re-adding
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var idColumn = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      var targetId = String(transactionId).trim();
      for (var i = idColumn.length - 1; i >= 0; i--) {
        var rowId = String(idColumn[i][0]).trim();
        if (rowId === targetId) {
          sheet.deleteRow(i + 2);
        }
      }
    }
    
    // Log each item as a separate row
    data.items.forEach(function(item) {
      sheet.appendRow([
        timestamp,
        transactionId,
        data.location,
        data.date,
        data.aircraft,
        data.kasetNo,
        data.ref,
        data.repairType,
        data.opName,
        data.opRank,
        data.svName,
        data.svRank,
        item.name,
        item.pn,
        item.sn,
        item.qty,
        item.note || data.note || ""
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  var json = data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      obj[h] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
