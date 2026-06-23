const STORAGE_KEY = 'todos-v1'

let todos = []

function loadTodos(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    todos = raw ? JSON.parse(raw) : []
  }catch(e){ todos = [] }
}

function saveTodos(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function createTodoElement(todo){
  const li = document.createElement('li')
  li.className = 'todo-item'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = !!todo.done
  checkbox.addEventListener('change', ()=>{
    todo.done = checkbox.checked
    saveTodos()
    renderTodos()
  })

  const span = document.createElement('span')
  span.className = 'text' + (todo.done? ' done':'')
  span.textContent = todo.text
  span.title = '雙擊編輯'
  span.addEventListener('dblclick', ()=>{
    const newText = prompt('編輯待辦事項', todo.text)
    if(newText!==null){
      todo.text = newText.trim()||todo.text
      saveTodos()
      renderTodos()
    }
  })

  const editBtn = document.createElement('button')
  editBtn.className = 'btn-inline'
  editBtn.textContent = '編輯'
  editBtn.addEventListener('click', ()=>{
    const newText = prompt('編輯待辦事項', todo.text)
    if(newText!==null){ todo.text = newText.trim()||todo.text; saveTodos(); renderTodos() }
  })

  const delBtn = document.createElement('button')
  delBtn.className = 'btn-inline'
  delBtn.textContent = '刪除'
  delBtn.addEventListener('click', ()=>{
    todos = todos.filter(t=>t.id !== todo.id)
    saveTodos(); renderTodos()
  })

  li.appendChild(checkbox)
  li.appendChild(span)
  li.appendChild(editBtn)
  li.appendChild(delBtn)

  return li
}

function renderTodos(){
  const ul = document.getElementById('todo-list')
  ul.innerHTML = ''
  if(!todos.length){
    const p = document.createElement('p')
    p.className = 'small'
    p.textContent = '目前沒有待辦事項，趕快新增一個！'
    ul.appendChild(p)
    return
  }
  todos.forEach(t=> ul.appendChild(createTodoElement(t)))
}

function addTodo(text){
  const trimmed = text.trim()
  if(!trimmed) return
  todos.push({id: Date.now(), text: trimmed, done:false})
  saveTodos(); renderTodos()
}

function parseSheetId(value){
  if(!value) return null
  const trimmed = value.trim()
  const urlMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if(urlMatch) return urlMatch[1]
  const idMatch = trimmed.match(/^[a-zA-Z0-9-_]{20,}$/)
  return idMatch ? trimmed : null
}

function isAppsScriptUrl(value){
  return /script\.google\.com\/macros\/s\//.test(value)
}

function buildAppScriptUrl(baseUrl, sheetId){
  const url = new URL(baseUrl)
  if(!url.searchParams.has('sheetId')){
    url.searchParams.set('sheetId', sheetId)
  }
  return url.toString()
}

async function fetchGoogleSheetValues(sheetId){
  const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  const response = await fetch(endpoint)
  if(!response.ok) throw new Error('無法取得試算表資料')

  const text = await response.text()
  const jsonText = text.replace(/^\/\/.*\n/, '').replace(/^google\.visualization\.Query\.setResponse\(/, '').replace(/\);\s*$/, '')
  const data = JSON.parse(jsonText)
  return data.table || null
}

async function fetchAppScriptValues(deployUrl){
  const response = await fetch(deployUrl)
  if(!response.ok) throw new Error('無法取得 Apps Script 資料')
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return data
}

function normalizeRow(row){
  if (!row) return {text:'', done:false}
  if (Array.isArray(row)){
    const text = String(row[0] || '').trim()
    const done = String(row[1] || '').toLowerCase() !== 'false' && String(row[1] || '') !== '0'
    return {text, done}
  }

  if (row.title || row.text || row.name){
    return {
      text: String(row.title || row.text || row.name || '').trim(),
      done: !!row.done
    }
  }

  const textCell = row.c ? row.c[0] : null
  const doneCell = row.c ? row.c[1] : null
  const text = textCell && textCell.v ? String(textCell.v).trim() : String(textCell || '').trim()
  const done = doneCell && doneCell.v != null ? String(doneCell.v).toLowerCase() !== 'false' && String(doneCell.v) !== '0' : false
  return {text, done}
}

async function loadFromApi(url){
  const response = await fetch(url)
  if(!response.ok) throw new Error(`API 讀取失敗：${response.status}`)
  const data = await response.json()
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.results)) return data.results
  throw new Error('API 回傳內容必須為 JSON 陣列或包含 data/results 陣列')
}

async function saveToAppsScript(deployUrl){
  let url = deployUrl.trim()
  let sheetId = null
  if(!/sheetId=/.test(url)){
    const sheetSource = prompt('請輸入要儲存到的 Google 試算表 ID 或完整網址')
    sheetId = parseSheetId(sheetSource)
    if(!sheetId) throw new Error('未輸入有效的試算表 ID 或網址。')
    url = buildAppScriptUrl(url, sheetId)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ todos })
  })
  if(!response.ok) throw new Error(`儲存失敗：${response.status}`)
  const data = await response.json()
  if(data.error) throw new Error(data.error)
  return data
}

async function importFromGoogleSheet(value){
  const trimmed = value.trim()
  if(!trimmed){
    alert('請輸入有效的 Google 試算表 ID、網址，或 Apps Script 部署網址。')
    return
  }

  try{
    let imported = []

    if(isAppsScriptUrl(trimmed)){
      let deployUrl = trimmed
      let sheetId = null
      if(!/sheetId=/.test(deployUrl)){
        const sheetSource = prompt('請輸入要匯入的 Google 試算表 ID 或完整網址')
        sheetId = parseSheetId(sheetSource)
        if(!sheetId){
          alert('未輸入有效的試算表 ID 或網址。')
          return
        }
        deployUrl = buildAppScriptUrl(deployUrl, sheetId)
      } else {
        const url = new URL(deployUrl)
        sheetId = url.searchParams.get('sheetId')
      }

      if(!sheetId){
        alert('無法從 Apps Script 部署網址中解析 sheetId。請確認網址是否正確或手動輸入試算表 ID。')
        return
      }

      const data = await fetchAppScriptValues(deployUrl)
      if(!Array.isArray(data.values) || data.values.length === 0){
        alert('Apps Script 回傳的試算表資料為空。')
        return
      }

      imported = data.values.map(normalizeRow).filter(row => row.text)
    } else {
      const sheetId = parseSheetId(trimmed)
      if(!sheetId){
        alert('請輸入有效的 Google 試算表 ID 或網址。')
        return
      }

      const table = await fetchGoogleSheetValues(sheetId)
      if(!table || !table.rows || table.rows.length === 0){
        alert('試算表內容為空，請檢查是否公開或有資料。')
        return
      }

      imported = table.rows.map(normalizeRow).filter(row => row.text)
    }

    if(imported.length === 0){
      alert('未找到有效的待辦事項文字欄位。請確認試算表第一欄為待辦內容。')
      return
    }

    imported.forEach(({text, done}) => todos.push({id: Date.now() + Math.random(), text, done}))
    saveTodos(); renderTodos()
    alert(`已匯入 ${imported.length} 筆待辦事項。`)
  }catch(err){
    console.error(err)
    alert(`匯入失敗：${err.message || '請確認試算表或 Apps Script 部署可存取。'}`)
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadTodos(); renderTodos()

  const input = document.getElementById('todo-input')
  const addBtn = document.getElementById('add-btn')
  const importInput = document.getElementById('import-input')
  const importBtn = document.getElementById('import-btn')

  addBtn.addEventListener('click', ()=>{
    addTodo(input.value)
    input.value = ''
    input.focus()
  })

  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      addTodo(input.value)
      input.value = ''
    }
  })

  importBtn.addEventListener('click', ()=>{
    importFromGoogleSheet(importInput.value)
    importInput.value = ''
  })

  importInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      importFromGoogleSheet(importInput.value)
      importInput.value = ''
    }
  })

    const apiInput = document.getElementById('api-input')
    const apiBtn = document.getElementById('api-btn')
    const saveUrlInput = document.getElementById('save-url-input')
    const saveBtn = document.getElementById('save-btn')

    apiBtn.addEventListener('click', async ()=>{
      try{
        const data = await loadFromApi(apiInput.value)
        const imported = data.map(normalizeRow).filter(row => row.text)
        if(imported.length === 0){
          alert('API 回傳資料中沒有可匯入的待辦文字。')
          return
        }
        imported.forEach(({text, done}) => todos.push({id: Date.now() + Math.random(), text, done}))
        saveTodos(); renderTodos()
        alert(`已從 API 匯入 ${imported.length} 筆資料。`)
      }catch(err){
        console.error(err)
        alert(err.message || 'API 匯入失敗。')
      }
    })

    saveBtn.addEventListener('click', async ()=>{
      try{
        await saveToAppsScript(saveUrlInput.value)
        alert('已將目前待辦清單儲存到 Google 試算表。')
      }catch(err){
        console.error(err)
        alert(err.message || '儲存失敗。')
      }
    })
