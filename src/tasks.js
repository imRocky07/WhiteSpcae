/* ==========================================================================
   WhiteSpace — Task Queue Manager
   ========================================================================== */

export class TaskManager {
  constructor(options = {}) {
    this.tasks = this.loadTasks();
    this.activeTaskId = this.tasks.find(t => t.isActive)?.id || (this.tasks[0]?.id || null);
    if (this.activeTaskId) {
      this.setActiveTask(this.activeTaskId);
    }
    
    this.onTasksChange = options.onTasksChange || null;
    this.onActiveTaskChange = options.onActiveTaskChange || null;
  }

  loadTasks() {
    const saved = localStorage.getItem('whitespace_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default starter tasks for instant polish
    return [
      { id: '1', title: 'Deep Work: Core Logic Architecture', estPomos: 3, completedPomos: 1, completed: false, isActive: true },
      { id: '2', title: 'Review PRs & Code Polish', estPomos: 1, completedPomos: 0, completed: false, isActive: false }
    ];
  }

  saveTasks() {
    localStorage.setItem('whitespace_tasks', JSON.stringify(this.tasks));
    if (this.onTasksChange) this.onTasksChange(this.tasks);
  }

  addTask(title, estPomos = 1) {
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      estPomos: parseInt(estPomos) || 1,
      completedPomos: 0,
      completed: false,
      isActive: false
    };

    this.tasks.push(newTask);
    if (this.tasks.length === 1 || !this.activeTaskId) {
      this.setActiveTask(newTask.id);
    }
    this.saveTasks();
    return newTask;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      const nextTask = this.tasks.find(t => !t.completed) || this.tasks[0] || null;
      this.setActiveTask(nextTask ? nextTask.id : null);
    }
    this.saveTasks();
  }

  toggleTaskCompletion(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      if (task.completed && this.activeTaskId === id) {
        const nextTask = this.tasks.find(t => !t.completed && t.id !== id);
        this.setActiveTask(nextTask ? nextTask.id : null);
      }
      this.saveTasks();
    }
  }

  setActiveTask(id) {
    this.tasks.forEach(t => {
      t.isActive = (t.id === id);
    });
    this.activeTaskId = id;
    this.saveTasks();
    if (this.onActiveTaskChange) {
      const activeTask = this.getActiveTask();
      this.onActiveTaskChange(activeTask);
    }
  }

  getActiveTask() {
    return this.tasks.find(t => t.id === this.activeTaskId) || null;
  }

  incrementActiveTaskPomo() {
    const active = this.getActiveTask();
    if (active) {
      active.completedPomos += 1;
      this.saveTasks();
    }
  }
}
