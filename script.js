// Wrap everything so DOM is ready
document.addEventListener('DOMContentLoaded', () => {

  // DOM Elements
  const projectList = document.getElementById('project-list');
  const projectNameInput = document.getElementById('project-name');
  const addProjectBtn = document.getElementById('add-project');

  const taskTitle = document.getElementById('task-title');
  const taskDesc = document.getElementById('task-desc');
  const taskStatus = document.getElementById('task-status');
  const addTaskBtn = document.getElementById('add-task');
  const updateTaskBtn = document.getElementById('update-task');
  const cancelEditBtn = document.getElementById('cancel-edit');

  const columns = {
    'pending': document.querySelector('#pending .task-list'),
    'in-progress': document.querySelector('#in-progress .task-list'),
    'completed': document.querySelector('#completed .task-list')
  };

  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');

  const notesModal = document.getElementById('notes-modal');
  const notesList = document.getElementById('notes-list');
  const noteText = document.getElementById('note-text');
  const addNoteBtn = document.getElementById('add-note');
  const closeModalBtn = document.querySelector('.close');

  // state
  let projects = JSON.parse(localStorage.getItem('projects')) || [];
  let currentProjectId = projects.length ? projects[0].id : null;
  let editTaskId = null;
  let currentTaskForNotes = null;

  // -------------------- Helpers --------------------
  function saveProjects() { localStorage.setItem('projects', JSON.stringify(projects)); }

  // simple HTML escape to avoid accidental injection from user input
  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // -------------------- Projects --------------------
  function renderProjects() {
    projectList.innerHTML = '';
    projects.forEach(project => {
      const li = document.createElement('li');
      li.textContent = project.name;
      li.dataset.id = project.id;
      if (project.id === currentProjectId) li.classList.add('active');

      // delete button for project
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑';
      delBtn.title = 'Delete project';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(project.id);
      });

      li.appendChild(delBtn);
      li.addEventListener('click', () => {
        currentProjectId = project.id;
        renderProjects();
        renderTasks();
      });

      projectList.appendChild(li);
    });
  }

  function deleteProject(projectId) {
    projects = projects.filter(p => p.id !== projectId);
    if (currentProjectId === projectId) currentProjectId = projects.length ? projects[0].id : null;
    saveProjects();
    renderProjects();
    renderTasks();
  }

  addProjectBtn.addEventListener('click', () => {
    const name = projectNameInput.value.trim();
    if (!name) return alert('Project name required!');
    const project = { id: Date.now(), name, tasks: [] };
    projects.push(project);
    currentProjectId = project.id;
    saveProjects();
    renderProjects();
    renderTasks();
    projectNameInput.value = '';
  });

  // -------------------- Tasks --------------------
  addTaskBtn.addEventListener('click', addTask);
  updateTaskBtn.addEventListener('click', updateTask);
  cancelEditBtn.addEventListener('click', resetForm);

  function addTask() {
    if (!currentProjectId) return alert('Create/select a project first!');
    const title = taskTitle.value.trim();
    const desc = taskDesc.value.trim();
    const status = taskStatus.value;
    if (!title) return alert('Task title required!');
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return alert('Project not found (try refreshing).');
    const task = { id: Date.now(), title, desc, status, notes: [] };
    project.tasks.push(task);
    saveProjects();
    renderTasks();
    resetForm();
  }

  function updateTask() {
    if (!currentProjectId) return alert('No project selected.');
    const title = taskTitle.value.trim();
    const desc = taskDesc.value.trim();
    const status = taskStatus.value;
    if (!title) return alert('Task title required!');
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return alert('Project not found (try refreshing).');
    const task = project.tasks.find(t => t.id === editTaskId);
    if (!task) return alert('Task not found.');
    task.title = title; task.desc = desc; task.status = status;
    saveProjects(); renderTasks(); resetForm();
  }

  function resetForm() {
    taskTitle.value = '';
    taskDesc.value = '';
    taskStatus.value = 'pending';
    editTaskId = null;
    addTaskBtn.style.display = 'inline-block';
    updateTaskBtn.style.display = 'none';
    cancelEditBtn.style.display = 'none';
  }

  // Attach drag & drop listeners once to avoid duplicates on re-render
  function setupDragDrop() {
    Object.entries(columns).forEach(([status, col]) => {
      if (!col) return;
      col.addEventListener('dragover', e => e.preventDefault());
      col.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return;
        const task = project.tasks.find(t => String(t.id) === String(id));
        if (!task) return;
        task.status = status;
        saveProjects();
        renderTasks();
      });
    });
  }

  function renderTasks() {
    // clear columns
    Object.values(columns).forEach(col => { if(col) col.innerHTML = ''; });

    if (!currentProjectId) {
      updateProgress();
      return;
    }
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) { updateProgress(); return; }

    project.tasks.forEach(task => {
      const div = document.createElement('div');
      div.className = `task ${task.status}`;
      div.draggable = true;
      div.dataset.id = task.id;
      div.innerHTML = `
        <strong>${escapeHtml(task.title)}</strong>
        <p>${escapeHtml(task.desc)}</p>
        <div class="task-actions">
          <button class="edit" title="Edit">✎</button>
          <button class="delete" title="Delete">🗑</button>
          <button class="notes" title="Notes">📝</button>
        </div>
      `;
      const col = columns[task.status];
      if (col) col.appendChild(div);

      // Edit
      const editBtn = div.querySelector('.edit');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        taskTitle.value = task.title;
        taskDesc.value = task.desc;
        taskStatus.value = task.status;
        editTaskId = task.id;
        addTaskBtn.style.display = 'none';
        updateTaskBtn.style.display = 'inline-block';
        cancelEditBtn.style.display = 'inline-block';
      });

      // Delete
      const deleteBtn = div.querySelector('.delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        project.tasks = project.tasks.filter(t => t.id !== task.id);
        // if the task was open in notes modal, close it
        if (currentTaskForNotes && currentTaskForNotes.id === task.id) {
          currentTaskForNotes = null;
          notesModal.style.display = 'none';
        }
        saveProjects(); renderTasks();
      });

      // Notes
      const notesBtn = div.querySelector('.notes');
      notesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTaskForNotes = task;
        renderNotes();
        notesModal.style.display = 'block';
      });

      // Drag & Drop start
      div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', String(task.id));
      });
    });

    updateProgress();
  }

  // -------------------- Progress --------------------
  function updateProgress() {
    if (!currentProjectId) {
      progressFill.style.width = `0%`;
      progressText.textContent = `0% Completed`;
      return;
    }
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) {
      progressFill.style.width = `0%`;
      progressText.textContent = `0% Completed`;
      return;
    }
    const total = project.tasks.length;
    const completed = project.tasks.filter(t => t.status === 'completed').length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Completed`;
  }

  // -------------------- Notes --------------------
  function renderNotes() {
    notesList.innerHTML = '';
    if (!currentTaskForNotes) {
      notesList.innerHTML = '<li>No task selected.</li>';
      return;
    }
    currentTaskForNotes.notes.forEach((note, idx) => {
      const li = document.createElement('li');
      li.textContent = note;
      const del = document.createElement('button');
      del.textContent = '🗑';
      del.addEventListener('click', () => {
        currentTaskForNotes.notes.splice(idx, 1);
        saveProjects(); renderNotes();
      });
      li.appendChild(del);
      notesList.appendChild(li);
    });
  }

  addNoteBtn.addEventListener('click', () => {
    const text = noteText.value.trim();
    if (!text) return alert('Note cannot be empty!');
    if (!currentTaskForNotes) return alert('No task selected for notes!');
    currentTaskForNotes.notes.push(text);
    noteText.value = '';
    saveProjects(); renderNotes();
  });

  closeModalBtn.addEventListener('click', () => {
    notesModal.style.display = 'none';
    currentTaskForNotes = null;
  });
  window.addEventListener('click', e => { if (e.target === notesModal) { notesModal.style.display = 'none'; currentTaskForNotes = null; } });

  // -------------------- Init --------------------
  renderProjects();
  setupDragDrop();
  renderTasks();

});
