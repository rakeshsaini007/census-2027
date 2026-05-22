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
 * Keeps data grouped by: Plot No -> Building No -> House No -> Family No.
 * Re-numbers the 'लाइन क्रमांक' column dynamically based on the final sorted sequence.
 */
function sortAndReindexSheet(sheet) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  if (values.length <= 1) return;
  
  const headers = values[0];
  const rows = values.slice(1);
  const famColIndex = headers.indexOf("परिवार क्रमांक");
  
  if (famColIndex === -1) return;
  
  // Natural comparative sorting helper for Apps Script
  function naturalCompare(a, b) {
    const strA = String(a).trim();
    const strB = String(b).trim();
    return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
  }
  
  rows.sort(function(rowA, rowB) {
    const fA = String(rowA[famColIndex]).trim().toUpperCase();
    const fB = String(rowB[famColIndex]).trim().toUpperCase();
    
    // If one is empty, push to bottom
    if (fA !== "" && fB === "") return -1;
    if (fA === "" && fB !== "") return 1;
    if (fA === "" && fB === "") {
      // Sort by line sequence if both are empty
      return Number(rowA[0]) - Number(rowB[0]);
    }
    
    // Ignore 'F' prefix and extract digits
    let codeA = fA.indexOf("F") === 0 ? fA.substring(1).trim() : fA;
    let codeB = fB.indexOf("F") === 0 ? fB.substring(1).trim() : fB;
    
    let numA = parseInt(codeA, 10);
    let numB = parseInt(codeB, 10);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return fA.localeCompare(fB, undefined, { numeric: true, sensitivity: 'base' });
  });
  
  // Recompute 'लाइन क्रमांक' to be purely 1-based sequential
  for (let i = 0; i < rows.length; i++) {
    rows[i][0] = i + 1;
  }
  
  // Write the sorted and re-indexed rows back structure-intact
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
