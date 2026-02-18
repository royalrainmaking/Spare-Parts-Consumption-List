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
    
    // Handle Delete Action
    if (data.action === 'delete') {
      var transactionId = data.transactionId;
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var idColumn = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
        for (var i = idColumn.length - 1; i >= 0; i--) {
          if (String(idColumn[i][0]).trim() === String(transactionId).trim()) {
            sheet.deleteRow(i + 2);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({"result": "success", "message": "Deleted"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

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

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  
  if (action === "getIpc") {
    var folderId = "1oXp3Ss5puxcmgCyVEkv6pBUYtom-dOrx";
    try {
      var rootFolder = DriveApp.getFolderById(folderId);
      var content = getFolderContents(rootFolder);
      return ContentService.createTextOutput(JSON.stringify(content))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({error: "Drive Error: " + err.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === "getFileData") {
    var fileId = e.parameter.id;
    try {
      var file = DriveApp.getFileById(fileId);
      var mime = file.getMimeType();
      var fileSize = file.getSize();
      
      // Limit to 30MB for Base64 proxy to avoid GAS limits
      if (fileSize > 30 * 1024 * 1024) {
        return ContentService.createTextOutput(JSON.stringify({
          error: "FILE_TOO_LARGE",
          message: "ไฟล์มีขนาดใหญ่เกินไปสำหรับการแสดงผลในหน้าเว็บ (" + (fileSize / (1024*1024)).toFixed(1) + " MB)",
          driveUrl: file.getUrl()
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Convert Word and Google Docs to PDF on-the-fly
      if (mime === "application/msword" || 
          mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          mime === "application/vnd.google-apps.document") {
        try {
          blob = file.getAs('application/pdf');
        } catch (e) {
          // If direct conversion fails (common for old .doc), we let the user know and provide a fix
          if (mime === "application/msword") {
            return ContentService.createTextOutput(JSON.stringify({
              error: "NEED_CONVERSION",
              message: "ไฟล์ .doc (รุ่นเก่า) ไม่รองรับการแสดงผลโดยตรง กรุณาบันทึกเป็น Google Docs หรือ .docx บน Google Drive ก่อน",
              driveUrl: file.getUrl()
            })).setMimeType(ContentService.MimeType.JSON);
          } else {
            throw e;
          }
        }
      } else {
        blob = file.getBlob();
      }
      
      var base64 = Utilities.base64Encode(blob.getBytes());
      return ContentService.createTextOutput(JSON.stringify({
        data: base64,
        mimeType: blob.getContentType(),
        name: file.getName().replace(/\.(docx|doc|pdf)$/i, '') + ".pdf"
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
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
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet Error: " + err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFolderContents(folder) {
  var folderName = folder.getName();
  var result = {
    name: folderName,
    type: "folder",
    children: []
  };
  
  try {
    var subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      var subfolder = subfolders.next();
      result.children.push(getFolderContents(subfolder));
    }
    
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      var fileName = file.getName();
      var mime = file.getMimeType();
      
      // Support PDF, Word, and Google Docs
      var isPdf = mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
      var isWord = mime.includes("word") || 
                   mime.includes("vnd.google-apps.document") || 
                   fileName.toLowerCase().endsWith(".doc") || 
                   fileName.toLowerCase().endsWith(".docx");
      
      if (isPdf || isWord) {
        result.children.push({
          name: fileName,
          type: "file",
          id: file.getId(),
          isWord: isWord
        });
      }
    }
  } catch (e) {
    Logger.log("Error reading folder " + folderName + ": " + e.toString());
  }
  
  return result;
}
