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

document.addEventListener('DOMContentLoaded', ()=>{
  loadTodos(); renderTodos()

  const input = document.getElementById('todo-input')
  const addBtn = document.getElementById('add-btn')

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
})
