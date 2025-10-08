class TaskFlow {
  constructor() {
    this.tasks = this.loadTasks()
    this.currentFilter = "all"
    this.init()
  }

  init() {
    this.bindEvents()
    this.render()
    this.updateStats()
  }

  bindEvents() {
    // Task input events
    const taskInput = document.getElementById("taskInput")
    const addBtn = document.getElementById("addBtn")

    addBtn.addEventListener("click", () => this.addTask())
    taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTask()
      }
    })

    // Filter events
    const filterBtns = document.querySelectorAll(".filter-btn")
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter)
      })
    })

    // Task list events (using event delegation)
    const taskList = document.getElementById("taskList")
    taskList.addEventListener("click", (e) => {
      const taskItem = e.target.closest(".task-item")
      if (!taskItem) return

      const taskId = Number.parseInt(taskItem.dataset.id)

      if (e.target.classList.contains("task-checkbox")) {
        this.toggleTask(taskId)
      } else if (e.target.classList.contains("delete-btn")) {
        this.deleteTask(taskId)
      }
    })
  }

  addTask() {
    const taskInput = document.getElementById("taskInput")
    const text = taskInput.value.trim()

    if (!text) return

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    this.tasks.unshift(task)
    this.saveTasks()
    this.render()
    this.updateStats()

    taskInput.value = ""
    taskInput.focus()
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      this.saveTasks()
      this.render()
      this.updateStats()
    }
  }

  deleteTask(id) {
    const taskItem = document.querySelector(`[data-id="${id}"]`)
    if (taskItem) {
      taskItem.classList.add("removing")

      setTimeout(() => {
        this.tasks = this.tasks.filter((t) => t.id !== id)
        this.saveTasks()
        this.render()
        this.updateStats()
      }, 300)
    }
  }

  setFilter(filter) {
    this.currentFilter = filter

    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-filter="${filter}"]`).classList.add("active")

    this.render()
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "active":
        return this.tasks.filter((task) => !task.completed)
      case "completed":
        return this.tasks.filter((task) => task.completed)
      default:
        return this.tasks
    }
  }

  render() {
    const taskList = document.getElementById("taskList")
    const emptyState = document.getElementById("emptyState")
    const filteredTasks = this.getFilteredTasks()

    if (filteredTasks.length === 0) {
      taskList.innerHTML = ""
      emptyState.classList.add("show")
      return
    }

    emptyState.classList.remove("show")

    const tasksHTML = filteredTasks
      .map(
        (task) => `
            <li class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}" role="listitem">
                <div class="task-checkbox ${task.completed ? "checked" : ""}" 
                     role="checkbox" 
                     aria-checked="${task.completed}"
                     tabindex="0"
                     aria-label="${task.completed ? "Mark as incomplete" : "Mark as complete"}">
                </div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="delete-btn" aria-label="Delete task" tabindex="0">×</button>
            </li>
        `,
      )
      .join("")

    taskList.innerHTML = tasksHTML

    // Add keyboard support for checkboxes
    taskList.querySelectorAll(".task-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          checkbox.click()
        }
      })
    })

    // Add keyboard support for delete buttons
    taskList.querySelectorAll(".delete-btn").forEach((deleteBtn) => {
      deleteBtn.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          deleteBtn.click()
        }
      })
    })
  }

  updateStats() {
    const activeTasks = this.tasks.filter((task) => !task.completed)
    const completedTasks = this.tasks.filter((task) => task.completed)

    document.getElementById("activeCount").textContent = activeTasks.length
    document.getElementById("completedCount").textContent = completedTasks.length
  }

  saveTasks() {
    try {
      localStorage.setItem("taskflow-tasks", JSON.stringify(this.tasks))
    } catch (error) {
      console.error("Failed to save tasks to localStorage:", error)
    }
  }

  loadTasks() {
    try {
      const saved = localStorage.getItem("taskflow-tasks")
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Failed to load tasks from localStorage:", error)
      return []
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TaskFlow()
})
