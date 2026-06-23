# staff

## Todo App with Google Sheets / Apps Script import

1. 開啟 `index.html`。
2. 在「輸入 Google 試算表 ID 或網址」欄位貼上：
   - Google 試算表網址或 ID
   - 或 Apps Script 部署網址（例如 `https://script.google.com/.../exec`）
3. 按下「匯入試算表」。
4. 若 Apps Script URL 未帶入 `sheetId`，系統會再提示你輸入試算表 ID 或完整網址。

## Apps Script 後端

- `Code.gs` 會讀取 `sheetId` 參數並回傳 JSON 值。
- 回傳資料格式為 `values` 二維陣列，可供 `script.js` 解析成待辦事項。

## 範例

貼入 `https://script.google.com/a/macros/stu.nknush.kh.edu.tw/s/AKfycbwxwutjShXAFzflnM57Fa-xgFOo4SzkVvquNyFUAkx_zZ9llfYRshnn5G8lJixCOhsG/exec`，然後輸入試算表 ID，即可匯入內容。