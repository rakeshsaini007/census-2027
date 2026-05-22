/**
 * Google Apps Script for Census Data Google Sheet ("Data")
 * 
 * Instructions:
 * 1. Open your Google Sheet containing the "Data" sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this code.
 * 4. Create a sheet named "Data" if it doesn't exist, and add the following headers in row 1:
 *    लाइन क्रमांक | प्लॉट क्रमांक | भवन नंबर | जनगणना मकान नंबर | जनगणना मकान का उपयोग | परिवार क्रमांक | परिवार के मुखिया का नाम | मोबाइल नंबर | लिंग | SC/ST/अन्य | मकान के स्वामित्व की स्थिति | परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या | परिवार में रहने वालों की कुल संख्या | विवाहित जोड़ों की संख्या | पेयजल का मुख्य स्रोत | पेयजल स्रोत की उपलब्धता | LPG/PNG | LAPTOP/ COMPUTER | साइकिल/ स्कूटर | कार/ जीप/ वैन
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Select Type: "Web app".
 * 7. Set "Execute as": "Me".
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy", authorize the script, and COPY the Web App URL.
 * 10. Paste this URL in the web application's Apps Script Web App URL input.
 */

const SHEET_NAME = "Data";

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write headers
    const headers = [
      "लाइन क्रमांक",
      "प्लॉट क्रमांक",
      "भवन नंबर",
      "जनगणना मकान नंबर",
      "जनगणना मकान का उपयोग",
      "परिवार क्रमांक",
      "परिवार के मुखिया का नाम",
      "मोबाइल नंबर",
      "लिंग",
      "SC/ST/अन्य",
      "मकान के स्वामित्व की स्थिति",
      "परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या",
      "परिवार में रहने वालों की कुल संख्या",
      "विवाहित जोड़ों की संख्या",
      "पेयजल का मुख्य स्रोत",
      "पेयजल स्रोत की उपलब्धता",
      "LPG/PNG",
      "LAPTOP/ COMPUTER",
      "साइकिल/ स्कूटर",
      "कार/ जीप/ वैन"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return createJsonResponse({ status: "success", data: [] });
    }
    
    const headers = values[0];
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index];
      });
      data.push(record);
    }
    
    return createJsonResponse({ status: "success", data: data });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action; // "save" or "delete"
    const sheet = getSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    if (action === "save") {
      const recordsToSave = postData.records; // Array of household records
      const updatedRecords = [];
      
      recordsToSave.forEach(record => {
        let lineNo = record["लाइन क्रमांक"];
        let familyNo = record["परिवार क्रमांक"] ? String(record["परिवार क्रमांक"]).trim().toUpperCase() : "";
        let rowIndex = -1;
        
        // Find if line number exists
        if (lineNo) {
          for (let i = 1; i < values.length; i++) {
            if (String(values[i][0]) === String(lineNo)) {
              rowIndex = i + 1; // 1-based index in sheet
              break;
            }
          }
        }
        
        // If not found by lineNo, find if another row already has the same family number (preventing duplicates)
        if (rowIndex === -1 && familyNo !== "") {
          const famColIndex = headers.indexOf("परिवार क्रमांक");
          if (famColIndex !== -1) {
            for (let i = 1; i < values.length; i++) {
              if (String(values[i][famColIndex]).trim().toUpperCase() === familyNo) {
                rowIndex = i + 1; // 1-based index in sheet
                lineNo = values[i][0];
                record["लाइन क्रमांक"] = lineNo;
                break;
              }
            }
          }
        }
        
        // Create row data array ordered by headers
        const rowData = headers.map(header => {
          if (header === "लाइन क्रमांक" && !lineNo && rowIndex === -1) {
            // Generate standard unique line number if it's a new row
            // We find the max line number in sheet currently and add 1
            let maxLine = 0;
            for (let i = 1; i < values.length; i++) {
              const val = parseInt(values[i][0], 10);
              if (!isNaN(val) && val > maxLine) maxLine = val;
            }
            lineNo = maxLine + 1;
            record["लाइन क्रमांक"] = lineNo;
            return lineNo;
          }
          return record[header] !== undefined ? record[header] : "";
        });
        
        if (rowIndex !== -1) {
          // Update existing row
          sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
        } else {
          // Append new row
          sheet.appendRow(rowData);
          // Update values list so subsequent appends in the same call compute line number correctly
          values.push(rowData);
        }
        updatedRecords.push(record);
      });
      
      // Auto-sort and re-index the sheet to maintain hierarchical integrity
      sortAndReindexSheet(sheet);
      
      return createJsonResponse({ status: "success", message: "Saved successfully", records: updatedRecords });
    } else if (action === "delete") {
      const lineNo = postData["लाइन क्रमांक"];
      if (!lineNo) {
        return createJsonResponse({ status: "error", message: "Line number required for deletion" });
      }
      
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(lineNo)) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        sheet.deleteRow(rowIndex);
        // Re-number and auto-sort the sheet after record deletion
        sortAndReindexSheet(sheet);
        return createJsonResponse({ status: "success", message: "Deleted successfully" });
      } else {
        return createJsonResponse({ status: "error", message: "Record not found to delete" });
      }
    }
    
    return createJsonResponse({ status: "error", message: "Invalid action" });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Automatically sorts and re-indexes the sheet on the Google Sheets server side.
 * Keeps data grouped by: House No -> Family No.
 * Re-numbers the 'लाइन क्रमांक' column dynamically based on the final sorted sequence.
 */
function sortAndReindexSheet(sheet) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  if (values.length <= 1) return;
  
  const headers = values[0];
  const rows = values.slice(1);
  
  const houseColIndex = headers.indexOf("जनगणना मकान नंबर");
  const famColIndex = headers.indexOf("परिवार क्रमांक");
  
  if (houseColIndex === -1 && famColIndex === -1) return;
  
  // Custom natural comparative sorting helper that works bulletproof in Google Apps Script
  function naturalCompare(as, bs) {
    var a = String(as).toUpperCase().trim();
    var b = String(bs).toUpperCase().trim();
    var re = /(\d+)|(\D+)/g;
    var aParts = a.match(re) || [];
    var bParts = b.match(re) || [];
    var l = Math.min(aParts.length, bParts.length);
    for (var i = 0; i < l; i++) {
      var aPart = aParts[i];
      var bPart = bParts[i];
      var aNum = parseInt(aPart, 10);
      var bNum = parseInt(bPart, 10);
      var isANum = !isNaN(aNum);
      var isBNum = !isNaN(bNum);
      if (isANum && isBNum) {
        if (aNum !== bNum) return aNum - bNum;
      } else {
        if (aPart !== bPart) return aPart < bPart ? -1 : 1;
      }
    }
    return aParts.length - bParts.length;
  }
  
  rows.sort(function(rowA, rowB) {
    const hA = houseColIndex !== -1 ? String(rowA[houseColIndex]).trim().toUpperCase() : "";
    const hB = houseColIndex !== -1 ? String(rowB[houseColIndex]).trim().toUpperCase() : "";
    
    // If one house number is empty, push to bottom
    if (hA !== "" && hB === "") return -1;
    if (hA === "" && hB !== "") return 1;
    if (hA !== hB) {
      return naturalCompare(hA, hB);
    }
    
    // If house numbers are identical, sort by family number
    if (famColIndex !== -1) {
      const fA = String(rowA[famColIndex]).trim().toUpperCase();
      const fB = String(rowB[famColIndex]).trim().toUpperCase();
      
      if (fA !== "" && fB === "") return -1;
      if (fA === "" && fB !== "") return 1;
      if (fA !== fB) {
        return naturalCompare(fA, fB);
      }
    }
    
    // Default fallback to line sequence
    return Number(rowA[0]) - Number(rowB[0]);
  });
  
  // Recompute 'लाइन क्रमांक' to be purely 1-based sequential
  for (let i = 0; i < rows.length; i++) {
    rows[i][0] = i + 1;
  }
  
  // Write the sorted and re-indexed rows back structure-intact
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Creates a custom helper menu inside the Google Sheets interface
 * so the user can easily trigger a sort and re-index of their sheet in 1 click.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("📋 जनगणना टूल्स")
    .addItem("🔄 रिकॉर्ड्स क्रमानुसार सॉर्ट करें (Sort Records)", "manualSortAndReindex")
    .addToUi();
}

/**
 * Function called from the Google Sheets custom menu
 */
function manualSortAndReindex() {
  try {
    const sheet = getSheet();
    sortAndReindexSheet(sheet);
    SpreadsheetApp.getUi().alert("सफलता: सभी रिकॉर्ड्स सफलतापूर्वक जनगणना मकान संख्या के आधार पर क्रमानुसार सॉर्ट और पुन: व्यवस्थित कर दिए गए हैं!");
  } catch (error) {
    SpreadsheetApp.getUi().alert("त्रुटि: " + error.toString());
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
