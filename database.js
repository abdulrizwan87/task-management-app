const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('tasks.db');

db.serialize(() => {
    // Staff table
    db.run(`
        CREATE TABLE IF NOT EXISTS staff (
            email TEXT PRIMARY KEY,
            name TEXT,
            password TEXT,
            role TEXT,
            phone TEXT
        )
    `);

    // Tasks table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            description TEXT,
            assigned_to TEXT,
            status TEXT,
            due_date TEXT,
            FOREIGN KEY (assigned_to) REFERENCES staff(email)
        )
    `);

    // Insert sample data
    const password = bcrypt.hashSync('password123', 10);
    db.run(
        'INSERT OR IGNORE INTO staff (email, name, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['john@example.com', 'John Doe', password, 'Staff', '123-456-7890']
    );
    db.run(
        'INSERT OR IGNORE INTO staff (email, name, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['jane@example.com', 'Jane Smith', password, 'Manager', '098-765-4321']
    );
    db.run(
        'INSERT OR IGNORE INTO staff (email, name, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['admin@example.com', 'Admin User', password, 'Admin', '555-555-5555']
    );

    db.run(
        'INSERT OR IGNORE INTO tasks (id, description, assigned_to, status, due_date) VALUES (?, ?, ?, ?, ?)',
        ['T001', 'Clean Room 101', 'john@example.com', 'Pending', '2025-05-10']
    );
    db.run(
        'INSERT OR IGNORE INTO tasks (id, description, assigned_to, status, due_date) VALUES (?, ?, ?, ?, ?)',
        ['T002', 'Restock Supplies', 'jane@example.com', 'Completed', '2025-05-08']
    );
});

module.exports = db;