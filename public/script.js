let currentUser = null;
let currentAdminView = 'users';
let currentManagerView = 'assign';
let tasks = [];
let managerTasks = [];
let sortDirection = {};
let managerSortDirection = {};

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    document.querySelectorAll('.tab').forEach(tab => tab.classList.add('d-none'));
    document.getElementById(tabId).classList.remove('d-none');
    if (tabId === 'admin') {
        showAdminView(currentAdminView);
    } else if (tabId === 'manager') {
        showManagerView(currentManagerView);
    }
}

function showAdminView(view) {
    currentAdminView = view;
    document.querySelectorAll('.admin-view').forEach(view => view.classList.add('d-none'));
    document.getElementById(`admin-${view}`).classList.remove('d-none');
    if (view === 'users') {
        loadAdminStaff();
    } else if (view === 'tasks') {
        loadAdminTasks();
    }
}

function showManagerView(view) {
    currentManagerView = view;
    document.querySelectorAll('.manager-view').forEach(view => view.classList.add('d-none'));
    document.getElementById(`manager-${view}`).classList.remove('d-none');
    if (view === 'tasks') {
        loadManagerTasks();
    } else if (view === 'assign') {
        loadStaffList();
    }
}

function toggleSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    sidebar.classList.toggle('d-none');
}

function logout() {
    currentUser = null;
    showTab('login');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-message').classList.add('d-none');
}

async function register() {
    const email = document.getElementById('reg-email').value;
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const errorMessage = document.getElementById('reg-error');
    errorMessage.classList.add('d-none');

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('d-none');
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
        errorMessage.classList.remove('d-none');
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('d-none');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('d-none');
            return;
        }
        currentUser = data;
        showTab(data.role.toLowerCase());
        if (data.role === 'Staff') {
            loadStaffTasks();
            loadStaffProfile();
        } else if (data.role === 'Manager') {
            showManagerView('assign');
            loadStaffList();
        } else if (data.role === 'Admin') {
            loadAdminStaff();
        }
    } catch (err) {
        console.error('Login error:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.classList.remove('d-none');
    }
}

async function loadStaffTasks() {
    try {
        const response = await fetch(`/api/tasks/${currentUser.email}`);
        const tasks = await response.json();
        const tasksDiv = document.getElementById('staff-tasks');
        tasksDiv.innerHTML = tasks.map(task => `
            <div class="task card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${task.description} (${task.status}, Priority: ${task.priority})</span>
                    <button onclick="updateTask('${task.id}', 'Completed')" class="btn btn-success btn-sm">Complete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading staff tasks:', err);
    }
}

async function loadStaffProfile() {
    const profileDiv = document.getElementById('staff-profile');
    profileDiv.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
    `;
}

async function loadStaffList() {
    try {
        const response = await fetch('/api/staff');
        const staff = await response.json();
        const select = document.getElementById('staff-select');
        select.innerHTML = staff
            .filter(s => s.active && s.role === 'Staff')
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
            alert('Task assigned!');
            document.getElementById('task-id').value = '';
            document.getElementById('task-desc').value = '';
            document.getElementById('due-date').value = '';
            showManagerView('tasks');
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

async function reopenTask(id) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Pending' })
        });
        const data = await response.json();
        if (data.success) {
            loadManagerTasks();
            alert('Task reopened!');
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error reopening task:', err);
        alert('Network error. Please try again.');
    }
}

async function reassignTask(id) {
    const select = document.getElementById(`reassign-${id}`);
    const assigned_to = select.value;
    try {
        const response = await fetch(`/api/tasks/reassign/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to })
        });
        const data = await response.json();
        if (data.success) {
            loadManagerTasks();
            alert('Task reassigned!');
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error reassigning task:', err);
        alert('Network error. Please try again.');
    }
}

async function addComment(taskId) {
    const commentInput = document.getElementById(`comment-${taskId}`);
    const comment = commentInput.value.trim();
    if (!comment) {
        alert('Comment cannot be empty.');
        return;
    }

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, comment })
        });
        const data = await response.json();
        if (data.success) {
            commentInput.value = '';
            loadManagerTasks();
            alert('Comment added!');
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error adding comment:', err);
        alert('Network error. Please try again.');
    }
}

async function loadManagerTasks() {
    try {
        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks');
        const tasksData = await tasksResponse.json();
        // Fetch staff for names
        const staffResponse = await fetch('/api/staff');
        const staffData = await staffResponse.json();
        // Fetch comments
        const commentsPromises = tasksData.map(task => 
            fetch(`/api/comments/${task.id}`).then(res => res.json())
        );
        const commentsData = await Promise.all(commentsPromises);

        // Map email to name
        const staffMap = {};
        staffData.forEach(s => {
            staffMap[s.email] = s.name;
        });

        // Combine tasks with user names and comments
        managerTasks = tasksData.map((task, index) => ({
            ...task,
            name: staffMap[task.assigned_to] || task.assigned_to,
            comments: commentsData[index]
        }));

        renderManagerTasks();

        // Populate reassign dropdowns
        const staffOptions = staffData
            .filter(s => s.active && s.role === 'Staff')
            .map(s => `<option value="${s.email}">${s.name}</option>`).join('');
        document.querySelectorAll('.reassign-select').forEach(select => {
            select.innerHTML = staffOptions;
        });
    } catch (err) {
        console.error('Error loading manager tasks:', err);
    }
}

function sortManagerTasks(key) {
    managerSortDirection[key] = !managerSortDirection[key] ? 'asc' : managerSortDirection[key] === 'asc' ? 'desc' : 'asc';
    
    managerTasks.sort((a, b) => {
        const valA = a[key] || '';
        const valB = b[key] || '';
        if (key === 'due_date') {
            return managerSortDirection[key] === 'asc' 
                ? new Date(valA) - new Date(valB) 
                : new Date(valB) - new Date(valA);
        }
        return managerSortDirection[key] === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
    });

    renderManagerTasks();
}

function renderManagerTasks() {
    const tasksDiv = document.getElementById('manager-tasks-list');
    tasksDiv.innerHTML = managerTasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${task.description}</td>
            <td>${task.due_date}</td>
            <td>${task.status}</td>
            <td>
                <div class="comment-list">
                    ${task.comments.map(c => `
                        <div class="comment-item">${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
                    `).join('')}
                </div>
                <div class="input-group">
                    <input type="text" id="comment-${task.id}" class="form-control comment-input" placeholder="Add comment">
                    <button onclick="addComment('${task.id}')" class="btn btn-outline-primary">Add</button>
                </div>
            </td>
            <td>
                ${task.status === 'Completed' ? `
                    <button onclick="reopenTask('${task.id}')" class="reopen-btn btn btn-info btn-sm me-1">Reopen</button>
                ` : ''}
                <div class="input-group input-group-sm">
                    <select id="reassign-${task.id}" class="form-select reassign-select"></select>
                    <button onclick="reassignTask('${task.id}')" class="reassign-btn btn btn-warning">Reassign</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadAdminStaff() {
    try {
        const response = await fetch('/api/staff');
        const staff = await response.json();
        const staffDiv = document.getElementById('admin-staff');
        staffDiv.innerHTML = staff.map(s => `
            <div class="staff card p-3 mb-3 d-flex justify-content-between align-items-center">
                <span>${s.name} - ${s.role} - ${s.email} - ${s.phone} (${s.active ? 'Active' : 'Inactive'})</span>
                <div>
                    ${s.active ?
                        `<button onclick="deactivateStaff('${s.email}')" class="deactivate-btn btn btn-warning btn-sm me-1">Deactivate</button>` :
                        `<button onclick="reactivateStaff('${s.email}')" class="reactivate-btn btn btn-success btn-sm me-1">Reactivate</button>`}
                    <button onclick="deleteStaff('${s.email}')" class="delete-btn btn btn-danger btn-sm">Delete</button>
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
        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks');
        const tasksData = await tasksResponse.json();
        // Fetch staff for names
        const staffResponse = await fetch('/api/staff');
        const staffData = await staffResponse.json();
        // Fetch comments
        const commentsPromises = tasksData.map(task => 
            fetch(`/api/comments/${task.id}`).then(res => res.json())
        );
        const commentsData = await Promise.all(commentsPromises);

        // Map email to name
        const staffMap = {};
        staffData.forEach(s => {
            staffMap[s.email] = s.name;
        });

        // Combine tasks with user names and comments
        tasks = tasksData.map((task, index) => ({
            ...task,
            name: staffMap[task.assigned_to] || task.assigned_to,
            comments: commentsData[index]
        }));

        renderTasks();
    } catch (err) {
        console.error('Error loading admin tasks:', err);
    }
}

function sortTasks(key) {
    sortDirection[key] = !sortDirection[key] ? 'asc' : sortDirection[key] === 'asc' ? 'desc' : 'asc';
    
    tasks.sort((a, b) => {
        const valA = a[key] || '';
        const valB = b[key] || '';
        if (key === 'due_date') {
            return sortDirection[key] === 'asc' 
                ? new Date(valA) - new Date(valB) 
                : new Date(valB) - new Date(valA);
        }
        return sortDirection[key] === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
    });

    renderTasks();
}

function renderTasks() {
    const tasksDiv = document.getElementById('admin-tasks-list');
    tasksDiv.innerHTML = tasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${task.description}</td>
            <td>${task.due_date}</td>
            <td>${task.status}</td>
            <td>
                <div class="comment-list">
                    ${task.comments.map(c => `
                        <div class="comment-item">${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
                    `).join('')}
                </div>
                <div class="input-group">
                    <input type="text" id="comment-${task.id}" class="form-control comment-input" placeholder="Add comment">
                    <button onclick="addComment('${task.id}')" class="btn btn-outline-primary">Add</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function addStaff() {
    const email = document.getElementById('staff-email').value;
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('role-select').value;
    const phone = document.getElementById('staff-phone').value;
    const password = document.getElementById('staff-password').value;
    const errorMessage = document.getElementById('staff-error');
    errorMessage.classList.add('d-none');

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, role, phone, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('d-none');
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
        errorMessage.classList.remove('d-none');
    }
}

// Sidebar toggles
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    showTab('login');

    const adminSidebarToggle = document.getElementById('sidebar-toggle');
    const adminMobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const managerSidebarToggle = document.getElementById('manager-sidebar-toggle');
    const managerMobileSidebarToggle = document.getElementById('manager-mobile-sidebar-toggle');

    if (adminSidebarToggle && adminMobileSidebarToggle) {
        adminSidebarToggle.addEventListener('click', () => toggleSidebar('sidebar'));
        adminMobileSidebarToggle.addEventListener('click', () => toggleSidebar('sidebar'));
    }

    if (managerSidebarToggle && managerMobileSidebarToggle) {
        managerSidebarToggle.addEventListener('click', () => toggleSidebar('manager-sidebar'));
        managerMobileSidebarToggle.addEventListener('click', () => toggleSidebar('manager-sidebar'));
    }
});