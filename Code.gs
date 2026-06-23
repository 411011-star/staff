function extractSheetId(url) {
  if (!url) return null
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function doGet(e) {
  const sheetId = e.parameter.sheetId || e.parameter.id || extractSheetId(e.parameter.url)
  if (!sheetId) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: '缺少 sheetId 參數或有效的試算表網址' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
  }

  try {
    const ss = SpreadsheetApp.openById(sheetId)
    const sheet = ss.getSheets()[0]
    const values = sheet.getDataRange().getValues()

    return ContentService
      .createTextOutput(JSON.stringify({ values }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message || String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const todos = data.todos
    const sheetId = e.parameter.sheetId || e.parameter.id || extractSheetId(e.parameter.url)
    if (!sheetId) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: '缺少 sheetId 參數或有效的試算表網址' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
    }

    if (!Array.isArray(todos)) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'POST 資料必須包含 todos 陣列' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
    }

    const ss = SpreadsheetApp.openById(sheetId)
    const sheet = ss.getSheets()[0]
    const rows = todos.map(item => [item.text || '', item.done ? 'TRUE' : 'FALSE'])

    sheet.clearContents()
    if (rows.length > 0) {
      sheet.getRange(1, 1, rows.length, 2).setValues(rows)
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', saved: rows.length }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message || String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
  }
}
