// index.js - Task Management Dashboard
// Beginner-friendly, modular code implementing the assignment requirements.

// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);
const qs = (sel) => document.querySelectorAll(sel);
const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString();
};

// ---------- DOM elements ----------
const taskForm = $('#task-form');
const taskNameInput = $('#task-name');
const taskDateInput = $('#task-date');
const taskListEl = $('#task-list');
const emptyMsg = $('#empty-msg');
const filterAllBtn = $('#filter-all');
const filterPendingBtn = $('#filter-pending');
const filterCompletedBtn = $('#filter-completed');
const sortBtn = $('#sort-btn');
const clearStorageBtn = $('#clear-storage');

const editModal = $('#edit-modal');
const editNameInput = $('#edit-name');
const editDateInput = $('#edit-date');
const cancelEditBtn = $('#cancel-edit');
const saveEditBtn = $('#save-edit');

// ---------- Data model ----------
let tasks = []; // each task: { id, name, dueDate (ISO or ''), status: 'pending'|'completed', createdAt }
let filter = 'all'; // all, pending, completed
let sortAsc = true; // sort by date ascending if true

const STORAGE_KEY = 'task_dashboard_tasks_v1';

// ---------- Initial sample tasks (5 tasks) ----------
const SAMPLE_TASKS = [
  { id: 1, name: 'Finish project report', dueDate: addDaysISO(3), status: 'pending', createdAt: Date.now() - 1000 * 60 * 60 },
  { id: 2, name: 'Buy groceries', dueDate: addDaysISO(1), status: 'pending', createdAt: Date.now() - 1000 * 60 * 50 },
  { id: 3, name: 'Read a chapter of book', dueDate: '', status: 'completed', createdAt: Date.now() - 1000 * 60 * 40 },
  { id: 4, name: 'Plan weekend trip', dueDate: addDaysISO(7), status: 'pending', createdAt: Date.now() - 1000 * 60 * 30 },
  { id: 5, name: 'Call Mom', dueDate: addDaysISO(2), status: 'pending', createdAt: Date.now() - 1000 * 60 * 10 }
];

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Persistence ----------
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      tasks = JSON.parse(raw);
      // ensure createdAt exist
      tasks.forEach(t => { if (!t.createdAt) t.createdAt = Date.now(); });
      return;
    } catch (e) {
      // if parsing fails, fall back to sample tasks
      console.warn('Failed to parse saved tasks, loading samples.');
    }
  }
  tasks = SAMPLE_TASKS.slice();
  saveTasks();
}

// ---------- Task operations ----------
function addTask(name, dueDate) {
  const trimmed = name.trim();
  if (!trimmed) {
    alert('Task name cannot be empty.');
    return false;
  }
  const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  const task = { id, name: trimmed, dueDate: dueDate || '', status: 'pending', createdAt: Date.now() };
  tasks.push(task);
  saveTasks();
  render();
  return true;
}

function updateTask(id, updates) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  Object.assign(t, updates);
  saveTasks();
  render();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleStatus(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.status = t.status === 'pending' ? 'completed' : 'pending';
  saveTasks();
  render();
}

// ---------- Rendering ----------
function applyFilterAndSort(list) {
  let out = list.slice();
  if (filter === 'pending') out = out.filter(t => t.status === 'pending');
  if (filter === 'completed') out = out.filter(t => t.status === 'completed');

  out.sort((a, b) => {
    // tasks without dueDate go to the end
    const ad = a.dueDate || (sortAsc ? '9999-12-31' : '0000-01-01');
    const bd = b.dueDate || (sortAsc ? '9999-12-31' : '0000-01-01');
    if (ad < bd) return sortAsc ? -1 : 1;
    if (ad > bd) return sortAsc ? 1 : -1;
    return a.createdAt - b.createdAt;
  });

  return out;
}

function render() {
  taskListEl.innerHTML = '';

  const visible = applyFilterAndSort(tasks);

  if (!visible.length) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
  }

  visible.forEach(task => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3 border rounded transition-transform bg-white';
    // slightly different style for completed
    if (task.status === 'completed') {
      item.classList.add('bg-green-50');
    }

    // Left: checkbox + info
    const left = document.createElement('div');
    left.className = 'flex items-center gap-3';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'completed';
    checkbox.className = 'w-4 h-4 cursor-pointer';
    checkbox.addEventListener('change', () => toggleStatus(task.id));
    left.appendChild(checkbox);

    const info = document.createElement('div');
    info.className = 'min-w-0';

    const title = document.createElement('div');
    title.className = 'text-sm sm:text-base font-medium truncate';
    title.textContent = task.name;
    if (task.status === 'completed') {
      title.classList.add('line-through', 'text-gray-500');
    }
    info.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'text-xs text-gray-500';
    meta.textContent = task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date';
    info.appendChild(meta);

    left.appendChild(info);

    // Right: actions
    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'px-2 py-1 text-xs border rounded bg-white hover:bg-gray-100';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(task.id));
    right.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'px-2 py-1 text-xs border rounded bg-red-100 text-red-700 hover:bg-red-200';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteTask(task.id));
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);

    // small entrance animation
    item.style.opacity = '0';
    item.style.transform = 'translateY(6px)';
    taskListEl.appendChild(item);
    requestAnimationFrame(() => {
      item.style.transition = 'opacity 180ms ease, transform 180ms ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });
  });

  // update active filter button styles
  qs('.filter-btn').forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
  if (filter === 'all') filterAllBtn.classList.add('bg-blue-600', 'text-white');
  if (filter === 'pending') filterPendingBtn.classList.add('bg-blue-600', 'text-white');
  if (filter === 'completed') filterCompletedBtn.classList.add('bg-blue-600', 'text-white');

  // update sort btn label
  sortBtn.textContent = `Sort: Date ${sortAsc ? '▲' : '▼'}`;
}

// ---------- Edit modal ----------
let editTargetId = null;

function openEditModal(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editTargetId = id;
  editNameInput.value = t.name;
  editDateInput.value = t.dueDate || '';
  editModal.classList.remove('hidden');
  editModal.classList.add('flex');
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editModal.classList.remove('flex');
  editTargetId = null;
}

cancelEditBtn.addEventListener('click', (e) => {
  e.preventDefault();
  closeEditModal();
});

saveEditBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!editTargetId) return;
  const name = editNameInput.value.trim();
  const due = editDateInput.value || '';
  if (!name) {
    alert('Task name cannot be empty.');
    return;
  }
  updateTask(editTargetId, { name, dueDate: due });
  closeEditModal();
});

// close modal when clicking outside modal content
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// ---------- Event listeners ----------
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = taskNameInput.value;
  const date = taskDateInput.value || '';
  const ok = addTask(name, date);
  if (ok) {
    taskForm.reset();
  }
});

filterAllBtn.addEventListener('click', () => { filter = 'all'; render(); });
filterPendingBtn.addEventListener('click', () => { filter = 'pending'; render(); });
filterCompletedBtn.addEventListener('click', () => { filter = 'completed'; render(); });

sortBtn.addEventListener('click', () => { sortAsc = !sortAsc; render(); });

clearStorageBtn.addEventListener('click', () => {
  if (!confirm('This will remove all saved tasks and reset to sample tasks. Continue?')) return;
  localStorage.removeItem(STORAGE_KEY);
  loadTasks();
  render();
});

// ---------- Init ----------
loadTasks();
render();
