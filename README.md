# Daily Task CLI - Command Line Task Manager

##  Problem Statement
As a developer, I frequently forget daily tasks amidst coding sessions. Switching between terminal and other applications breaks my workflow. Existing task managers require GUI interfaces or browser tabs. I needed a lightweight, keyboard-only solution that lives in my terminal.

##  Solution
A feature-rich CLI task manager built with Node.js using only standard libraries. It provides:
- Quick task management without leaving terminal
- Persistent storage in JSON format
- Colorful, readable output
- Full CRUD operations with filtering
- Statistics and progress tracking

##  Features
-  **Add tasks** with priority levels (low/medium/high)
-  **List tasks** with filters (all/pending/completed/high/today)
-  **Mark tasks complete** with timestamp
-  **Delete tasks** with confirmation
-  **Search tasks** by keyword
-  **Task statistics** with progress visualization
-  **Clear all tasks** with safety confirmation
-  **Color-coded output** using ANSI codes
-  **Persistent JSON storage**
-  **Comprehensive error handling**
-  **User-friendly help system**

##  Design Decisions
### 1. **Technology Choice**
- **Node.js with standard libraries only** - Uses only built-in modules (`fs`, `path`, `readline`)
- **No external dependencies** - As per assignment requirements
- **Cross-platform** - Works on Linux, macOS, Windows

### 2. **Architecture**
- **Separation of concerns**: `TaskManager` class handles business logic, `cli.js` handles user interface
- **Singleton pattern**: One TaskManager instance for consistency
- **Modular design**: Easy to extend with new features

### 3. **Data Storage**
- **JSON file format** for simplicity and human readability
- **Automatic file creation** if doesn't exist
- **Error handling** for corrupted/missing files

### 4. **User Experience**
- **ANSI color codes** for readable output without external libraries
- **Confirmation prompts** for destructive operations (delete, clear)
- **Clear error messages** with usage examples
- **Timestamp-based IDs** using `Date.now()` for unique task identification

### 5. **Error Handling**
- **Input validation** for all commands
- **Graceful file operations** with try-catch blocks
- **Task existence checks** before operations
- **User-friendly error messages** with suggestions


##  Quick Start

```bash
# Clone/download the project
cd daily-task-cli

# Run directly
node src/cli.js help

# Or make executable and use
chmod +x src/cli.js
./src/cli.js add "First task" high