const todo=['make dinner', 'make noenite'];
 renderTodos();
function renderTodos() {
  let todoHTML='';

for (let i=0; i<todo.length; i++) {
  const toone=todo[i];
  const html=`<p>${toone}</p>`;
  todoHTML+=html;
}
console.log(todoHTML);

document.querySelector('.js-total-list').innerHTML=todoHTML;}

function addTodo() {
  const todoInput=document.querySelector('.js-todo-input');
  const name=todoInput.value;
  todo.push(name);
  console.log(todo);
   
  todoInput.value='';
  renderTodos();
}
