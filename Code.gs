function doGet(e) {
  const sheetId = e.parameter.sheetId
  if (!sheetId) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: '缺少 sheetId 參數' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  try {
    const ss = SpreadsheetApp.openById(sheetId)
    const sheet = ss.getSheets()[0]
    const values = sheet.getDataRange().getValues()

    return ContentService
      .createTextOutput(JSON.stringify({ values }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message || String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}
