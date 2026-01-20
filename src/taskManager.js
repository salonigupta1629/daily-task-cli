const fs = require('fs').promises;
const path = require('path');


class TaskManager {
    constructor() {
        this.filePath = path.join(__dirname, '../data/tasks.json');
        this.tasks = [];
    }


    async loadTasks() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            this.tasks = JSON.parse(data);
        } catch (error) {
            this.tasks = [];
        }
        return this.tasks;
    }

  
    async saveTasks() {
        try {
            await fs.writeFile(this.filePath, JSON.stringify(this.tasks, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error.message);
            return false;
        }
    }

    /**
     * Add a new task
     * @param {string} description - Task description
     * @param {string} priority - low/medium/high (default: medium)
     * @returns {object} The created task object
     */
    async addTask(description, priority = 'medium') {
        const validPriorities = ['low', 'medium', 'high'];
        const normalizedPriority = validPriorities.includes(priority.toLowerCase()) 
            ? priority.toLowerCase() 
            : 'medium';

        const task = {
            id: Date.now(), 
            description: description.trim(),
            priority: normalizedPriority,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.push(task);
        const saved = await this.saveTasks();
        return saved ? task : null;
    }

    /**
     * Mark a task as completed
     * @param {string|number} taskId - Task ID to complete
     * @returns {boolean} Success status
     */
    async markComplete(taskId) {
        const id = Number(taskId);
        const task = this.tasks.find(t => t.id === id);
        
        if (!task) {
            return false; 
        }
        
        if (task.status === 'completed') {
            console.log('Task is already completed');
            return true;
        }
        
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        return await this.saveTasks();
    }

    /**
     * Delete a task by ID
     * @param {string|number} taskId - Task ID to delete
     * @returns {boolean} Success status
     */
    async deleteTask(taskId) {
        const id = Number(taskId);
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== id);
        
        if (this.tasks.length < initialLength) {
            return await this.saveTasks();
        }
        return false; 
    }

    /**
     * Get tasks with optional filtering
     * @param {string} filter - all/pending/completed/high/today
     * @returns {Array} Filtered tasks array
     */
    getTasks(filter = 'all') {
        const now = new Date();
        const today = now.toDateString();
        
        switch(filter.toLowerCase()) {
            case 'pending':
                return this.tasks.filter(t => t.status === 'pending');
            case 'completed':
                return this.tasks.filter(t => t.status === 'completed');
            case 'high':
                return this.tasks.filter(t => t.priority === 'high');
            case 'today':
                return this.tasks.filter(t => 
                    new Date(t.createdAt).toDateString() === today
                );
            case 'all':
            default:
                return [...this.tasks]; 
        }
    }

    /**
     * Get task by ID
     * @param {string|number} taskId - Task ID to find
     * @returns {object|null} Task object or null
     */
    getTaskById(taskId) {
        const id = Number(taskId);
        return this.tasks.find(t => t.id === id) || null;
    }

    /**
     * Get task statistics
     * @returns {object} Statistics object
     */
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        
        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            highPriority: this.tasks.filter(t => t.priority === 'high').length,
            today: this.tasks.filter(t => 
                new Date(t.createdAt).toDateString() === new Date().toDateString()
            ).length
        };
    }

    /**
     * Clear all tasks (with external confirmation)
     * @returns {boolean} Success status
     */
    async clearAllTasks() {
        this.tasks = [];
        return await this.saveTasks();
    }

    /**
     * Search tasks by keyword in description
     * @param {string} keyword - Search term
     * @returns {Array} Matching tasks
     */
    searchTasks(keyword) {
        const searchTerm = keyword.toLowerCase();
        return this.tasks.filter(task => 
            task.description.toLowerCase().includes(searchTerm)
        );
    }
}

module.exports = TaskManager;