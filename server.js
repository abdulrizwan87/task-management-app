const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM staff WHERE email = ?', [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ email: user.email, name: user.name, role: user.role });
    });
});

// Get tasks for a user
app.get('/api/tasks/:email', (req, res) => {
    db.all('SELECT * FROM tasks WHERE assigned_to = ?', [req.params.email], (err, tasks) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(tasks);
    });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', (err, tasks) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(tasks);
    });
});

// Get all staff
app.get('/api/staff', (req, res) => {
    db.all('SELECT email, name, role, phone FROM staff', (err, staff) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(staff);
    });
});

// Add task
app.post('/api/tasks', (req, res) => {
    const { id, description, assigned_to, due_date } = req.body;
    db.run(
        'INSERT INTO tasks (id, description, assigned_to, status, due_date) VALUES (?, ?, ?, ?, ?)',
        [id, description, assigned_to, 'Pending', due_date],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

// Update task status
app.put('/api/tasks/:id', (req, res) => {
    const { status } = req.body;
    db.run(
        'UPDATE tasks SET status = ? WHERE id = ?',
        [status, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

// Add staff
app.post('/api/staff', (req, res) => {
    const { email, name, role, phone } = req.body;
    const password = bcrypt.hashSync('password123', 10);
    db.run(
        'INSERT INTO staff (email, name, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        [email, name, password, role, phone],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));