let currentUser = null;

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function logout() {
    currentUser = null;
    showTab('login');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-message').style.display = 'none';
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'none';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.style.display = 'block';
            return;
        }
        currentUser = data;
        showTab(data.role.toLowerCase());
        if (data.role === 'Staff') {
            loadStaffTasks();
            loadStaffProfile();
        } else if (data.role === 'Manager') {
            loadManagerTasks();
            loadStaffList();
        } else if (data.role === 'Admin') {
            loadAdminStaff();
            loadAdminTasks();
        }
    } catch (err) {
        console.error('Login error:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.style.display = 'block';
    }
}

async function loadStaffTasks() {
    try {
        const response = await fetch(`/api/tasks/${currentUser.email}`);
        const tasks = await response.json();
        const tasksDiv = document.getElementById('staff-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task">
                ${task.description} (${task.status}, Priority: ${task.priority})
                <button onclick="updateTask('${task.id}', 'Completed')">Complete</button>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading staff tasks:', err);
    }
}

async function loadStaffProfile() {
    const profileDiv = document.getElementById('staff-profile');
    profileDiv.innerHTML = `
        <p>Name: ${currentUser.name}</p>
        <p>Role: ${currentUser.role}</p>
        <p>Email: ${currentUser.email}</p>
    `;
}

async function loadManagerTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const tasksDiv = document.getElementById('manager-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task">${task.description} - ${task.assigned_to} (${task.status}, Priority: ${task.priority})</div>
        `).join('');
    } catch (err) {
        console.error('Error loading manager tasks:', err);
    }
}

async function loadStaffList() {
    try {
        const response = await fetch('/api/staff');
        const staff = await response.json();
        const select = document.getElementById('staff-select');
        select.innerHTML = staff.map(s => `<option value="${s.email}">${s.name}</option>`).join('');
    } catch (err) {
        console.error('Error loading staff list:', err);
    }
}

async function assignTask() {
    const id = document.getElementById('task-id').value;
    const description = document.getElementById('task-desc').value;
    const assigned_to = document.getElementById('staff-select').value;
    const due_date = document.getElementById('due-date').value;
    const priority = document.getElementById('task-priority').value;
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, description, assigned_to, due_date, priority })
        });
        const data = await response.json();
        if (data.success) {
            loadManagerTasks();
            alert('Task assigned!');
        }
    } catch (err) {
        console.error('Error assigning task:', err);
    }
}

async function updateTask(id, status) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (data.success) {
            loadStaffTasks();
            alert('Task updated!');
        }
    } catch (err) {
        console.error('Error updating task:', err);
    }
}

async function loadAdminStaff() {
    try {
        const response = await fetch('/api/staff');
        const staff = await response.json();
        const staffDiv = document.getElementById('admin-staff');
        staffDiv.innerHTML = staff.map(s => `
            <div class="staff">${s.name} - ${s.role} - ${s.email} - ${s.phone}</div>
        `).join('');
    } catch (err) {
        console.error('Error loading admin staff:', err);
    }
}

async function loadAdminTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const tasksDiv = document.getElementById('admin-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task">${task.description} - ${task.assigned_to} (${task.status}, Priority: ${task.priority})</div>
        `).join('');
    } catch (err) {
        console.error('Error loading admin tasks:', err);
    }
}

async function addStaff() {
    const email = document.getElementById('staff-email').value;
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('role-select').value;
    const phone = document.getElementById('staff-phone').value;
    const password = document.getElementById('staff-password').value;
    const errorMessage = document.getElementById('staff-error');
    errorMessage.style.display = 'none';

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, role, phone, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.style.display = 'block';
            return;
        }
        loadAdminStaff();
        alert('Staff added!');
        document.getElementById('staff-email').value = '';
        document.getElementById('staff-name').value = '';
        document.getElementById('staff-phone').value = '';
        document.getElementById('staff-password').value = '';
    } catch (err) {
        console.error('Error adding staff:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.style.display = 'block';
    }
}

// Ensure login tab is shown on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    showTab('login');
});