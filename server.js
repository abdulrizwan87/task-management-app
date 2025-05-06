const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Register
app.post('/api/register', (req, res) => {
    const { email, name, password, phone } = req.body;
    if (!email || !name || !password || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    db.get('SELECT email FROM staff WHERE email = ?', [email], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row) return res.status(400).json({ error: 'Email already exists' });
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run(
            'INSERT INTO staff (email, name, password, role, phone, active) VALUES (?, ?, ?, ?, ?, ?)',
            [email, name, hashedPassword, 'Staff', phone, 1],
            (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true });
            }
        );
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM staff WHERE email = ?', [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.active) {
            return res.status(401).json({ error: 'Account is deactivated' });
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
    db.all('SELECT email, name, role, phone, active FROM staff', (err, staff) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(staff);
    });
});

// Add task
app.post('/api/tasks', (req, res) => {
    const { id, description, assigned_to, due_date, priority } = req.body;
    db.get('SELECT active FROM staff WHERE email = ?', [assigned_to], (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Database error' });
        if (!row.active) return res.status(400).json({ error: 'Cannot assign tasks to deactivated staff' });
        db.run(
            'INSERT INTO tasks (id, description, assigned_to, status, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
            [id, description, assigned_to, 'Pending', due_date, priority],
            (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true });
            }
        );
    });
});

// Update task status
app.put('/api/tasks/:id', (req, res) => {
    const { status } = req.body;
    db.get('SELECT assigned_to FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.get('SELECT active FROM staff WHERE email = ?', [task.assigned_to], (err, staff) => {
            if (err || !staff) return res.status(500).json({ error: 'Database error' });
            if (!staff.active) return res.status(400).json({ error: 'Cannot update tasks for deactivated staff' });
            db.run(
                'UPDATE tasks SET status = ? WHERE id = ?',
                [status, req.params.id],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true });
                }
            );
        });
    });
});

// Reassign task
app.put('/api/tasks/reassign/:id', (req, res) => {
    const { assigned_to } = req.body;
    db.get('SELECT active FROM staff WHERE email = ?', [assigned_to], (err, staff) => {
        if (err || !staff) return res.status(500).json({ error: 'Database error' });
        if (!staff.active) return res.status(400).json({ error: 'Cannot reassign to deactivated staff' });
        db.run(
            'UPDATE tasks SET assigned_to = ? WHERE id = ?',
            [assigned_to, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true });
            }
        );
    });
});

// Add staff (admin-only)
app.post('/api/staff', (req, res) => {
    const { email, name, role, phone, password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(
        'INSERT INTO staff (email, name, password, role, phone, active) VALUES (?, ?, ?, ?, ?, ?)',
        [email, name, hashedPassword, role, phone, 1],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

// Delete staff (admin-only)
app.delete('/api/staff/:email', (req, res) => {
    const email = req.params.email;
    db.run('DELETE FROM tasks WHERE assigned_to = ?', [email], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.run('DELETE FROM staff WHERE email = ?', [email], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        });
    });
});

// Deactivate staff (admin-only)
app.put('/api/staff/deactivate/:email', (req, res) => {
    const email = req.params.email;
    db.run('UPDATE staff SET active = 0 WHERE email = ?', [email], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// Reactivate staff (admin-only)
app.put('/api/staff/reactivate/:email', (req, res) => {
    const email = req.params.email;
    db.run('UPDATE staff SET active = 1 WHERE email = ?', [email], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// Get comments for a task
app.get('/api/comments/:task_id', (req, res) => {
    db.all('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC', [req.params.task_id], (err, comments) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(comments);
    });
});

// Add comment
app.post('/api/comments', (req, res) => {
    const { task_id, comment } = req.body;
    if (!task_id || !comment) {
        return res.status(400).json({ error: 'Task ID and comment are required' });
    }
    const created_at = new Date().toISOString();
    db.run(
        'INSERT INTO comments (task_id, comment, created_at) VALUES (?, ?, ?)',
        [task_id, comment, created_at],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));