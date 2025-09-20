let tasks = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSort = 'created';
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateStats();
    renderTasks();

    const now = new Date();
    const dateString = now.toISOString().slice(0, 16);
    document.getElementById('taskDueDate').min = dateString;
    document.getElementById('editTaskDueDate').min = dateString;
});
class Task {
    constructor(title, description, priority, category, dueDate) {
        this.id = Date.now() + Math.random();
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.category = category;
        this.dueDate = dueDate;
        this.completed = false;
        this.createdAt = new Date();
        this.completedAt = null;
    }
    isOverdue() {
        if (!this.dueDate || this.completed) return false;
        return new Date(this.dueDate) < new Date();
    }
    isDueToday() {
        if (!this.dueDate || this.completed) return false;
        const today = new Date();
        const due = new Date(this.dueDate);
        return today.toDateString() === due.toDateString();
    }   
    getDaysUntilDue() {
        if (!this.dueDate) return null;
        const today = new Date();
        const due = new Date(this.dueDate);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) {
        alert('Please enter a task title!');
        return;
    }
    
    const task = new Task(title, description, priority, category, dueDate);
    tasks.push(task);

    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskCategory').value = 'work';
    document.getElementById('taskDueDate').value = '';
    
    saveTasks();
    updateStats();
    renderTasks();
    showNotification('Task added successfully!', 'success');
}
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        
        saveTasks();
        updateStats();
        renderTasks();
        
        const message = task.completed ? 'Task completed!' : 'Task marked as pending';
        showNotification(message, task.completed ? 'success' : 'info');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        updateStats();
        renderTasks();
        showNotification('Task deleted successfully!', 'success');
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        editingTaskId = taskId;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        document.getElementById('editModal').style.display = 'block';
    }
}

function saveEditedTask() {
    if (!editingTaskId) return;
    
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        const title = document.getElementById('editTaskTitle').value.trim();
        
        if (!title) {
            alert('Please enter a task title!');
            return;
        }
        
        task.title = title;
        task.description = document.getElementById('editTaskDescription').value.trim();
        task.priority = document.getElementById('editTaskPriority').value;
        task.category = document.getElementById('editTaskCategory').value;
        task.dueDate = document.getElementById('editTaskDueDate').value;
        
        saveTasks();
        updateStats();
        renderTasks();
        closeEditModal();
        showNotification('Task updated successfully!', 'success');
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingTaskId = null;
}

function filterTasks(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    renderTasks();
}

function filterByCategory() {
    currentCategory = document.getElementById('categoryFilter').value;
    renderTasks();
}

function sortTasks() {
    currentSort = document.getElementById('sortBy').value;
    renderTasks();
}

function getFilteredTasks() {
    let filteredTasks = [...tasks];
    
    switch (currentFilter) {
        case 'pending':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        case 'overdue':
            filteredTasks = filteredTasks.filter(task => task.isOverdue());
            break;
    }
    
    if (currentCategory !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
    }
    
    filteredTasks.sort((a, b) => {
        switch (currentSort) {
            case 'priority':
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'title':
                return a.title.localeCompare(b.title);
            case 'created':
            default:
                return b.createdAt - a.createdAt;
        }
    });
    
    return filteredTasks;
}

function renderTasks() {
    const tasksContainer = document.getElementById('tasksList');
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Try adjusting your filters or add a new task.</p>
            </div>
        `;
        return;
    }
    
    tasksContainer.innerHTML = filteredTasks.map(task => {
        const dueBadgeText = formatDueDate(task);
        const dueBadgeClass = getDueBadgeClass(task);
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority} ${task.isOverdue() ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            <span class="priority-badge ${task.priority}">${task.priority}</span>
                            <span class="category-badge">${task.category}</span>
                            ${task.dueDate ? `<span class="due-badge ${dueBadgeClass}">${dueBadgeText}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-actions">
                    <button class="btn ${task.completed ? 'btn-undo' : 'btn-complete'}" 
                            onclick="toggleTask(${task.id})">
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn btn-edit" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-delete" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}


function formatDueDate(task) {
    if (!task.dueDate) return '';
    
    const due = new Date(task.dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
        return 'Due today';
    } else if (diffDays === 1) {
        return 'Due tomorrow';
    } else if (diffDays <= 7) {
        return `Due in ${diffDays} days`;
    } else {
        return due.toLocaleDateString();
    }
}

function getDueBadgeClass(task) {
    if (!task.dueDate) return '';
    
    if (task.isOverdue()) return 'overdue';
    if (task.isDueToday()) return 'today';
    return '';
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(task => task.isOverdue()).length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('overdueTasks').textContent = overdueTasks;
    
    updateProgressBar();
}

function updateProgressBar() {
    const progressContainer = document.querySelector('.progress-container');
    if (!progressContainer) {
        const headerStats = document.querySelector('.stats');
        const progressHTML = `
            <div class="progress-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.9rem; font-weight: 500;">Overall Progress</span>
                    <span id="progressPercentage" style="font-size: 0.9rem; font-weight: 600;">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
            </div>
        `;
        headerStats.insertAdjacentHTML('afterend', progressHTML);
    }
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressFill && progressPercentage) {
        progressFill.style.width = percentage + '%';
        progressPercentage.textContent = percentage + '%';
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function saveTasks() {
    try {
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('taskManagerTasks', JSON.stringify(tasks));
        }
    } catch (error) {
        console.warn('Could not save tasks to localStorage:', error);
    }
}

function loadTasks() {
    try {
        if (typeof Storage !== 'undefined') {
            const savedTasks = localStorage.getItem('taskManagerTasks');
            if (savedTasks) {
                const parsedTasks = JSON.parse(savedTasks);
                tasks = parsedTasks.map(taskData => {
                    const task = new Task(
                        taskData.title,
                        taskData.description,
                        taskData.priority,
                        taskData.category,
                        taskData.dueDate
                    );
                    task.id = taskData.id;
                    task.completed = taskData.completed;
                    task.createdAt = new Date(taskData.createdAt);
                    task.completedAt = taskData.completedAt ? new Date(taskData.completedAt) : null;
                    return task;
                });
            }
        }
    } catch (error) {
        console.warn('Could not load tasks from localStorage:', error);
        tasks = [];
    }
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks-export.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Tasks exported successfully!', 'success');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            if (confirm('This will replace all existing tasks. Continue?')) {
                tasks = importedTasks.map(taskData => {
                    const task = new Task(
                        taskData.title,
                        taskData.description,
                        taskData.priority,
                        taskData.category,
                        taskData.dueDate
                    );
                    task.id = taskData.id;
                    task.completed = taskData.completed;
                    task.createdAt = new Date(taskData.createdAt);
                    task.completedAt = taskData.completedAt ? new Date(taskData.completedAt) : null;
                    return task;
                });
                saveTasks();
                updateStats();
                renderTasks();
                showNotification('Tasks imported successfully!', 'success');
            }
        } catch (error) {
            showNotification('Error importing tasks. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllTasks() {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
        tasks = [];
        saveTasks();
        updateStats();
        renderTasks();
        showNotification('All tasks cleared!', 'success');
    }
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    if (completedCount === 0) {
        showNotification('No completed tasks to clear.', 'info');
        return;
    }
    
    if (confirm(`Delete ${completedCount} completed task${completedCount === 1 ? '' : 's'}?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        updateStats();
        renderTasks();
        showNotification('Completed tasks cleared!', 'success');
    }
}

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement.id === 'taskTitle') {
            addTask();
        }
    }
    
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

document.getElementById('taskTitle').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
});

function checkOverdueTasks() {
    const overdueTasks = tasks.filter(task => task.isOverdue());
    if (overdueTasks.length > 0) {
        setTimeout(() => {
            showNotification(`You have ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}!`, 'error');
        }, 1000);
    }
}

setTimeout(checkOverdueTasks, 2000);
