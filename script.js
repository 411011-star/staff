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

async function fetchGoogleSheetValues(sheetId){
  const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  const response = await fetch(endpoint)
  if(!response.ok) throw new Error('無法取得試算表資料')

  const text = await response.text()
  const jsonText = text.replace(/^\/\/.*\n/, '').replace(/^google\.visualization\.Query\.setResponse\(/, '').replace(/\);\s*$/, '')
  const data = JSON.parse(jsonText)
  return data.table || null
}

function normalizeRow(row){
  const textCell = row.c[0]
  const doneCell = row.c[1]
  const text = textCell && textCell.v ? String(textCell.v).trim() : ''
  const done = doneCell && doneCell.v != null && String(doneCell.v).toLowerCase() !== 'false' && String(doneCell.v) !== '0'
  return {text, done}
}

async function importFromGoogleSheet(value){
  const sheetId = parseSheetId(value)
  if(!sheetId){
    alert('請輸入有效的 Google 試算表 ID 或網址。')
    return
  }

  try{
    const table = await fetchGoogleSheetValues(sheetId)
    if(!table || !table.rows || table.rows.length === 0){
      alert('試算表內容為空，請檢查是否公開或有資料。')
      return
    }

    const imported = table.rows.map(normalizeRow).filter(row => row.text)
    if(imported.length === 0){
      alert('未找到有效的待辦事項文字欄位。請確認試算表第一欄為待辦內容。')
      return
    }

    imported.forEach(({text, done}) => todos.push({id: Date.now() + Math.random(), text, done}))
    saveTodos(); renderTodos()
    alert(`已匯入 ${imported.length} 筆待辦事項。`)
  }catch(err){
    console.error(err)
    alert('匯入失敗，請確認試算表是否已公開並可存取。')
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
})
