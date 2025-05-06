let currentUser = null;

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
}

function logout() {
    currentUser = null;
    showTab('login');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-message').classList.add('hidden');
}

async function register() {
    const email = document.getElementById('reg-email').value;
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const errorMessage = document.getElementById('reg-error');
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('hidden');
            return;
        }
        alert('Registration successful! Please login.');
        showTab('login');
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-phone').value = '';
        document.getElementById('reg-password').value = '';
    } catch (err) {
        console.error('Registration error:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.classList.remove('hidden');
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('hidden');
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
        errorMessage.classList.remove('hidden');
    }
}

async function loadStaffTasks() {
    try {
        const response = await fetch(`/api/tasks/${currentUser.email}`);
        const tasks = await response.json();
        const tasksDiv = document.getElementById('staff-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span>${task.description} (${task.status}, Priority: ${task.priority})</span>
                <button onclick="updateTask('${task.id}', 'Completed')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Complete</button>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading staff tasks:', err);
    }
}

async function loadStaffProfile() {
    const profileDiv = document.getElementById('staff-profile');
    profileDiv.innerHTML = `
        <p class="text-gray-700"><strong>Name:</strong> ${currentUser.name}</p>
        <p class="text-gray-700"><strong>Role:</strong> ${currentUser.role}</p>
        <p class="text-gray-700"><strong>Email:</strong> ${currentUser.email}</p>
    `;
}

async function loadManagerTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const tasksDiv = document.getElementById('manager-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task bg-gray-50 p-4 rounded-lg">
                ${task.description} - ${task.assigned_to} (${task.status}, Priority: ${task.priority})
            </div>
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
        select.innerHTML = staff
            .filter(s => s.active)
            .map(s => `<option value="${s.email}">${s.name}</option>`).join('');
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
            document.getElementById('task-id').value = '';
            document.getElementById('task-desc').value = '';
            document.getElementById('due-date').value = '';
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error assigning task:', err);
        alert('Network error. Please try again.');
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
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error updating task:', err);
        alert('Network error. Please try again.');
    }
}

async function loadAdminStaff() {
    try {
        const response = await fetch('/api/staff');
        const staff = await response.json();
        const staffDiv = document.getElementById('admin-staff');
        staffDiv.innerHTML = staff.map(s => `
            <div class="staff bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span>${s.name} - ${s.role} - ${s.email} - ${s.phone} (${s.active ? 'Active' : 'Inactive'})</span>
                <div>
                    ${s.active ?
                        `<button onclick="deactivateStaff('${s.email}')" class="deactivate-btn bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition">Deactivate</button>` :
                        `<button onclick="reactivateStaff('${s.email}')" class="reactivate-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Reactivate</button>`}
                    <button onclick="deleteStaff('${s.email}')" class="delete-btn bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading admin staff:', err);
    }
}

async function deactivateStaff(email) {
    if (!confirm(`Are you sure you want to deactivate ${email}? They will not be able to log in or complete tasks.`)) {
        return;
    }
    try {
        const response = await fetch(`/api/staff/deactivate/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            loadAdminStaff();
            alert('Staff deactivated successfully.');
        } else {
            alert('Error deactivating staff.');
        }
    } catch (err) {
        console.error('Error deactivating staff:', err);
        alert('Network error. Please try again.');
    }
}

async function reactivateStaff(email) {
    if (!confirm(`Are you sure you want to reactivate ${email}? They will regain access to the app.`)) {
        return;
    }
    try {
        const response = await fetch(`/api/staff/reactivate/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            loadAdminStaff();
            alert('Staff reactivated successfully.');
        } else {
            alert('Error reactivating staff.');
        }
    } catch (err) {
        console.error('Error reactivating staff:', err);
        alert('Network error. Please try again.');
    }
}

async function deleteStaff(email) {
    if (!confirm(`Are you sure you want to delete ${email}? This will also delete their assigned tasks.`)) {
        return;
    }
    try {
        const response = await fetch(`/api/staff/${email}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            loadAdminStaff();
            loadAdminTasks();
            alert('Staff deleted successfully.');
        } else {
            alert('Error deleting staff.');
        }
    } catch (err) {
        console.error('Error deleting staff:', err);
        alert('Network error. Please try again.');
    }
}

async function loadAdminTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const tasksDiv = document.getElementById('admin-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task bg-gray-50 p-4 rounded-lg">
                ${task.description} - ${task.assigned_to} (${task.status}, Priority: ${task.priority})
            </div>
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
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, role, phone, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('hidden');
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
        errorMessage.classList.remove('hidden');
    }
}

// Ensure login tab is shown on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    showTab('login');
});