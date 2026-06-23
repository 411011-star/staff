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
- `doPost()` 可接收 `todos` 陣列並將清單儲存到指定 Google 試算表。
- 若要使用儲存功能，請將 Apps Script 部署為網頁應用程式（`exec` URL），並在 `save-url-input` 中貼上該部署網址。

## 功能說明

1. 前端網頁效果：
   - `index.html` 已新增 `API URL` 與 `儲存到試算表` 輸入區塊。
2. 呼叫 API 自動填入資料：
   - 前端可透過 `api-input` 貼上 JSON 陣列 API，並自動匯入 `title` / `text` / `name` 欄位。
3. 系統資料存入 Google 試算表：
   - 前端 `saveToAppsScript()` 會把目前 `todos` 用 POST 傳給 Apps Script deploy URL。
   - `Code.gs` 的 `doPost()` 會把資料寫入試算表第一、二欄。

## 範例

貼入 `https://script.google.com/a/macros/stu.nknush.kh.edu.tw/s/AKfycbwxwutjShXAFzflnM57Fa-xgFOo4SzkVvquNyFUAkx_zZ9llfYRshnn5G8lJixCOhsG/exec`，然後輸入試算表 ID，即可匯入內容。