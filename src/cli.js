#!/usr/bin/env node

const TaskManager = require('./taskManager');

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
};

const symbols = {
    check: '✓',
    pending: '◻',
    bullet: '•',
    progressFull: '█',
    progressEmpty: '░',
    stats: '📊',
    warning: '⚠️ ',
    success: '🎉'
};


async function main() {
    try {
        const manager = new TaskManager();
        await manager.loadTasks();
        
        const args = process.argv.slice(2);
        const command = args[0];
        
        if (!command) {
            showHelp();
            process.exit(0);
        }
        
        switch(command.toLowerCase()) {
            case 'add':
                await handleAdd(manager, args);
                break;
            case 'list':
            case 'ls':
                await handleList(manager, args);
                break;
            case 'complete':
            case 'done':
                await handleComplete(manager, args);
                break;
            case 'delete':
            case 'del':
            case 'remove':
                await handleDelete(manager, args);
                break;
            case 'stats':
            case 'status':
                handleStats(manager);
                break;
            case 'clear':
            case 'clean':
                await handleClear(manager);
                break;
            case 'search':
                await handleSearch(manager, args);
                break;
            case 'help':
            case '--help':
            case '-h':
                showHelp();
                break;
            case 'version':
            case '--version':
            case '-v':
                showVersion();
                break;
            default:
                console.log(`${colors.red}Error: Unknown command '${command}'${colors.reset}`);
                console.log(`Use ${colors.cyan}task help${colors.reset} to see available commands`);
                process.exit(1);
        }
        
    } catch (error) {
        console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}


async function handleAdd(manager, args) {
    if (args.length < 2) {
        console.log(`${colors.red}Error: Please provide a task description${colors.reset}`);
        console.log(`Usage: task add "Your task description" [priority]`);
        console.log(`Example: ${colors.cyan}task add "Buy groceries" high${colors.reset}`);
        return;
    }
    
    const description = args[1];
    const priority = args[2] || 'medium';
    
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority.toLowerCase())) {
        console.log(`${colors.yellow}Warning: Invalid priority '${priority}'. Using 'medium'.${colors.reset}`);
        console.log(`Valid priorities: ${validPriorities.join(', ')}`);
    }
    
    const task = await manager.addTask(description, priority);
    
    if (task) {
        console.log(`\n${colors.green}${symbols.check} Task added successfully!${colors.reset}`);
        console.log(`${colors.gray}└─${colors.reset} ID: ${colors.cyan}${task.id}${colors.reset}`);
        console.log(`${colors.gray}└─${colors.reset} Description: "${task.description}"`);
        console.log(`${colors.gray}└─${colors.reset} Priority: ${getPriorityColor(task.priority)}${task.priority}${colors.reset}`);
        console.log(`${colors.gray}└─${colors.reset} Status: ${colors.yellow}pending${colors.reset}`);
    } else {
        console.log(`${colors.red}Error: Failed to save task${colors.reset}`);
    }
}


async function handleList(manager, args) {
    const filter = args[1] || 'all';
    
    const validFilters = ['all', 'pending', 'completed', 'high', 'today'];
    if (!validFilters.includes(filter.toLowerCase())) {
        console.log(`${colors.red}Invalid filter: '${filter}'${colors.reset}`);
        console.log(`Valid filters: ${validFilters.join(', ')}`);
        return;
    }
    
    const tasks = manager.getTasks(filter);
    
    if (tasks.length === 0) {
        const filterText = filter === 'all' ? '' : ` (${filter})`;
        console.log(`${colors.yellow}No tasks found${filterText}${colors.reset}`);
        return;
    }
    
    const filterDisplay = filter === 'all' ? 'All' : 
                         filter.charAt(0).toUpperCase() + filter.slice(1);
    console.log(`\n${colors.blue}${filterDisplay} Tasks (${tasks.length})${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    
    tasks.forEach((task, index) => {
        const statusIcon = task.status === 'completed' 
            ? `${colors.green}${symbols.check}${colors.reset}` 
            : `${colors.yellow}${symbols.pending}${colors.reset}`;
        
        const priorityColor = getPriorityColor(task.priority);
        
        console.log(`${colors.white}${index + 1}.${colors.reset} ${statusIcon} ${task.description}`);
        
        console.log(`   ${colors.gray}ID:${colors.reset} ${colors.cyan}${task.id}${colors.reset}`);
        console.log(`   ${colors.gray}Priority:${colors.reset} ${priorityColor}${task.priority}${colors.reset}`);
        console.log(`   ${colors.gray}Status:${colors.reset} ${task.status === 'completed' ? colors.green : colors.yellow}${task.status}${colors.reset}`);
        console.log(`   ${colors.gray}Created:${colors.reset} ${new Date(task.createdAt).toLocaleString()}`);
        
        if (task.status === 'completed' && task.completedAt) {
            console.log(`   ${colors.gray}Completed:${colors.reset} ${new Date(task.completedAt).toLocaleString()}`);
        }
        
        if (index < tasks.length - 1) {
            console.log(`   ${colors.gray}${'─'.repeat(40)}${colors.reset}`);
        }
    });
}


async function handleComplete(manager, args) {
    if (args.length < 2) {
        console.log(`${colors.red}Error: Please provide task ID${colors.reset}`);
        console.log(`Usage: ${colors.cyan}task complete <task-id>${colors.reset}`);
        console.log(`\nTo get task IDs, use: ${colors.cyan}task list${colors.reset}`);
        return;
    }
    
    const taskId = args[1];
    const task = manager.getTaskById(taskId);
    
    if (!task) {
        console.log(`${colors.red}Error: Task with ID '${taskId}' not found${colors.reset}`);
        console.log(`Use ${colors.cyan}task list${colors.reset} to see available tasks`);
        return;
    }
    
    if (task.status === 'completed') {
        console.log(`${colors.yellow}Task '${task.description}' is already completed${colors.reset}`);
        return;
    }
    
    const success = await manager.markComplete(taskId);
    
    if (success) {
        console.log(`\n${colors.green}${symbols.check} Task marked as completed!${colors.reset}`);
        console.log(`"${task.description}"`);
        console.log(`${colors.gray}Completed at: ${new Date().toLocaleString()}${colors.reset}`);
    } else {
        console.log(`${colors.red}Error updating task${colors.reset}`);
    }
}


async function handleDelete(manager, args) {
    if (args.length < 2) {
        console.log(`${colors.red}Error: Please provide task ID${colors.reset}`);
        console.log(`Usage: ${colors.cyan}task delete <task-id>${colors.reset}`);
        console.log(`\nTo get task IDs, use: ${colors.cyan}task list${colors.reset}`);
        return;
    }
    
    const taskId = args[1];
    const task = manager.getTaskById(taskId);
    
    if (!task) {
        console.log(`${colors.red}Error: Task with ID '${taskId}' not found${colors.reset}`);
        console.log(`Use ${colors.cyan}task list${colors.reset} to see available tasks`);
        return;
    }
    
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question(`${colors.yellow}${symbols.warning} Delete task "${task.description}"? (yes/no): ${colors.reset}`, async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            const success = await manager.deleteTask(taskId);
            if (success) {
                console.log(`${colors.green}${symbols.check} Task deleted successfully!${colors.reset}`);
            } else {
                console.log(`${colors.red}Error deleting task${colors.reset}`);
            }
        } else {
            console.log(`${colors.yellow}Deletion cancelled${colors.reset}`);
        }
        readline.close();
    });
}


function handleStats(manager) {
    const stats = manager.getStats();
    
    console.log(`\n${colors.cyan}${symbols.stats} Task Statistics${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(30)}${colors.reset}`);
    
    console.log(`${colors.white}Total tasks:${colors.reset}    ${stats.total}`);
    console.log(`${colors.white}Completed:${colors.reset}      ${colors.green}${stats.completed}${colors.reset}`);
    console.log(`${colors.white}Pending:${colors.reset}        ${colors.yellow}${stats.pending}${colors.reset}`);
    console.log(`${colors.white}High priority:${colors.reset}  ${colors.red}${stats.highPriority}${colors.reset}`);
    console.log(`${colors.white}Created today:${colors.reset}  ${stats.today}`);
    
    if (stats.total > 0) {
        const barLength = 25;
        const completedBars = Math.round((stats.completed / stats.total) * barLength);
        const progressBar = 
            `${colors.green}${symbols.progressFull.repeat(completedBars)}${colors.reset}` +
            `${colors.gray}${symbols.progressEmpty.repeat(barLength - completedBars)}${colors.reset}`;
        
        console.log(`\n${colors.white}Completion:${colors.reset} ${progressBar} ${stats.completionRate}%`);
    }
    
    if (stats.pending === 0 && stats.total > 0) {
        console.log(`\n${colors.green}${symbols.success} All tasks completed! Excellent work!${colors.reset}`);
    } else if (stats.completionRate >= 75) {
        console.log(`\n${colors.green}Great progress! Keep going!${colors.reset}`);
    } else if (stats.pending > 0) {
        console.log(`\n${colors.yellow}You have ${stats.pending} task(s) pending. Let's get to work!${colors.reset}`);
    }
}


async function handleClear(manager) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question(`${colors.red}${symbols.warning} Delete ALL ${manager.getTasks().length} tasks? This cannot be undone. (yes/no): ${colors.reset}`, async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            const success = await manager.clearAllTasks();
            if (success) {
                console.log(`${colors.green}${symbols.check} All tasks have been cleared!${colors.reset}`);
            } else {
                console.log(`${colors.red}Error clearing tasks${colors.reset}`);
            }
        } else {
            console.log(`${colors.yellow}Operation cancelled. No tasks were deleted.${colors.reset}`);
        }
        readline.close();
    });
}


async function handleSearch(manager, args) {
    if (args.length < 2) {
        console.log(`${colors.red}Error: Please provide search term${colors.reset}`);
        console.log(`Usage: ${colors.cyan}task search "keyword"${colors.reset}`);
        return;
    }
    
    const keyword = args.slice(1).join(' ');
    const tasks = manager.searchTasks(keyword);
    
    if (tasks.length === 0) {
        console.log(`${colors.yellow}No tasks found matching "${keyword}"${colors.reset}`);
        return;
    }
    
    console.log(`\n${colors.blue}Search results for "${keyword}" (${tasks.length})${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    
    tasks.forEach((task, index) => {
        const statusIcon = task.status === 'completed' 
            ? `${colors.green}${symbols.check}${colors.reset}` 
            : `${colors.yellow}${symbols.pending}${colors.reset}`;
        
        console.log(`${colors.white}${index + 1}.${colors.reset} ${statusIcon} ${highlightText(task.description, keyword)}`);
        console.log(`   ${colors.gray}ID: ${task.id} | Priority: ${task.priority} | Status: ${task.status}${colors.reset}`);
    });
}


function showHelp() {
    console.log(`\n${colors.blue}Daily Task CLI - Command Line Task Manager${colors.reset}`);
    console.log(`${colors.gray}A simple tool to manage your daily tasks from terminal${colors.reset}\n`);
    
    console.log(`${colors.white}USAGE:${colors.reset}`);
    console.log(`  ${colors.cyan}task <command> [options]${colors.reset}\n`);
    
    console.log(`${colors.white}COMMANDS:${colors.reset}`);
    console.log(`  ${colors.green}add${colors.reset} "description" [priority]    Add a new task`);
    console.log(`  ${colors.green}list${colors.reset} [filter]                  List tasks (all/pending/completed/high/today)`);
    console.log(`  ${colors.green}complete${colors.reset} <id>                  Mark task as completed`);
    console.log(`  ${colors.green}delete${colors.reset} <id>                    Delete a task (with confirmation)`);
    console.log(`  ${colors.green}stats${colors.reset}                         Show task statistics`);
    console.log(`  ${colors.green}clear${colors.reset}                         Clear all tasks (with confirmation)`);
    console.log(`  ${colors.green}search${colors.reset} "keyword"              Search tasks by keyword`);
    console.log(`  ${colors.green}help${colors.reset}                          Show this help message`);
    console.log(`  ${colors.green}version${colors.reset}                       Show version information\n`);
    
    console.log(`${colors.white}EXAMPLES:${colors.reset}`);
    console.log(`  ${colors.gray}# Add tasks${colors.reset}`);
    console.log(`  ${colors.cyan}task add "Buy groceries"${colors.reset}`);
    console.log(`  ${colors.cyan}task add "Finish report" high${colors.reset}`);
    
    console.log(`\n  ${colors.gray}# List tasks${colors.reset}`);
    console.log(`  ${colors.cyan}task list${colors.reset}`);
    console.log(`  ${colors.cyan}task list pending${colors.reset}`);
    
    console.log(`\n  ${colors.gray}# Manage tasks${colors.reset}`);
    console.log(`  ${colors.cyan}task complete 1234567890${colors.reset}`);
    console.log(`  ${colors.cyan}task delete 1234567890${colors.reset}`);
    console.log(`  ${colors.cyan}task search "meeting"${colors.reset}`);
    
    console.log(`\n  ${colors.gray}# Get overview${colors.reset}`);
    console.log(`  ${colors.cyan}task stats${colors.reset}`);
    console.log(`  ${colors.cyan}task clear${colors.reset}`);
    
    console.log(`\n${colors.gray}Priority: low/medium/high (default: medium)${colors.reset}`);
}


function showVersion() {
    const packageJson = require('../package.json');
    console.log(`${colors.blue}Daily Task CLI v${packageJson.version}${colors.reset}`);
    console.log(`${colors.gray}Node.js ${process.version}${colors.reset}`);
}


function getPriorityColor(priority) {
    switch(priority.toLowerCase()) {
        case 'high': return colors.red;
        case 'medium': return colors.yellow;
        case 'low': return colors.green;
        default: return colors.white;
    }
}


function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, `${colors.cyan}$1${colors.reset}`);
}

main();