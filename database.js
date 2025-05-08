const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('tasks.db');

db.serialize(() => {
    // Create staff table with department column
    db.run(`CREATE TABLE IF NOT EXISTS staff (
        email TEXT PRIMARY KEY,
        name TEXT,
        password TEXT,
        role TEXT,
        phone TEXT,
        department TEXT,
        active INTEGER DEFAULT 1
    )`);

    // Create tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        description TEXT,
        assigned_to TEXT,
        status TEXT,
        due_date TEXT,
        priority TEXT,
        FOREIGN KEY(assigned_to) REFERENCES staff(email)
    )`);

    // Create comments table with user_email
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT,
        comment TEXT,
        user_email TEXT,
        created_at TEXT,
        FOREIGN KEY(task_id) REFERENCES tasks(id),
        FOREIGN KEY(user_email) REFERENCES staff(email)
    )`);

    // Insert sample data if tables are empty
    db.get('SELECT COUNT(*) as count FROM staff', (err, row) => {
        if (row.count === 0) {
            const users = [
                { email: 'admin1@example.com', name: 'Admin One', password: 'password123', role: 'Admin', phone: '123-456-7890', department: 'Administration' },
                { email: 'admin2@example.com', name: 'Admin Two', password: 'password123', role: 'Admin', phone: '123-456-7891', department: 'Administration' },
                { email: 'jane@example.com', name: 'Jane Manager', password: 'password123', role: 'Manager', phone: '123-456-7892', department: 'Housekeeping' },
                { email: 'john@example.com', name: 'John Staff', password: 'password123', role: 'Staff', phone: '123-456-7893', department: 'Electrical' },
                { email: 'bob@example.com', name: 'Bob Staff', password: 'password123', role: 'Staff', phone: '123-456-7894', department: 'Plumbing' }
            ];
            users.forEach(user => {
                const hashedPassword = bcrypt.hashSync(user.password, 10);
                db.run(
                    'INSERT INTO staff (email, name, password, role, phone, department, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [user.email, user.name, hashedPassword, user.role, user.phone, user.department, 1]
                );
            });

            const tasks = [
                { id: 'T001', description: 'Clean Room 101', assigned_to: 'john@example.com', status: 'Pending', due_date: '2025-05-10', priority: 'High' },
                { id: 'T002', description: 'Organize Files', assigned_to: 'john@example.com', status: 'Pending', due_date: '2025-05-12', priority: 'Medium' },
                { id: 'T003', description: 'Fix Sink', assigned_to: 'bob@example.com', status: 'Pending', due_date: '2025-05-11', priority: 'High' }
            ];
            tasks.forEach(task => {
                db.run(
                    'INSERT INTO tasks (id, description, assigned_to, status, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
                    [task.id, task.description, task.assigned_to, task.status, task.due_date, task.priority]
                );
            });

            const comments = [
                { task_id: 'T001', comment: 'Please prioritize this task.', user_email: 'jane@example.com', created_at: '2025-05-07T10:00:00' },
                { task_id: 'T001', comment: 'Started cleaning, need more supplies.', user_email: 'john@example.com', created_at: '2025-05-07T11:00:00' }
            ];
            comments.forEach(comment => {
                db.run(
                    'INSERT INTO comments (task_id, comment, user_email, created_at) VALUES (?, ?, ?, ?)',
                    [comment.task_id, comment.comment, comment.user_email, comment.created_at]
                );
            });
        }
    });
});

module.exports = db;