let currentUser = null;
let currentAdminView = 'users';
let currentManagerView = 'assign';
let tasks = [];
let managerTasks = [];
let sortDirection = {};
let managerSortDirection = {};

function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.add('d-none'));
    const tab = document.getElementById(tabId);
    if (!tab) {
        console.error(`Tab with ID ${tabId} not found`);
        return;
    }
    tab.classList.remove('d-none');
    if (tabId === 'admin') {
        showAdminView(currentAdminView);
    } else if (tabId === 'manager') {
        showManagerView(currentManagerView);
    }
}

function showAdminView(view) {
    currentAdminView = view;
    const adminViews = document.querySelectorAll('.admin-view');
    adminViews.forEach(view => view.classList.add('d-none'));
    const adminView = document.getElementById(`admin-${view}`);
    if (!adminView) {
        console.error(`Admin view admin-${view} not found`);
        return;
    }
    adminView.classList.remove('d-none');
    if (view === 'users') {
        loadAdminStaff();
    } else if (view === 'tasks') {
        loadAdminTasks();
    }
}

function showManagerView(view) {
    currentManagerView = view;
    const managerViews = document.querySelectorAll('.manager-view');
    managerViews.forEach(view => view.classList.add('d-none'));
    const managerView = document.getElementById(`manager-${view}`);
    if (!managerView) {
        console.error(`Manager view manager-${view} not found`);
        return;
    }
    managerView.classList.remove('d-none');
    if (view === 'tasks') {
        loadManagerTasks();
    } else if (view === 'assign') {
        loadStaffList();
    }
}

function toggleSidebar(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    if (!sidebar) {
        console.error(`Sidebar with ID ${sidebarId} not found`);
        return;
    }
    sidebar.classList.toggle('d-none');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.querySelector(`#${inputId} + .password-toggle .password-icon use`);
    if (!input || !icon) {
        console.error(`Input or icon for ${inputId} not found`);
        return;
    }
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('xlink:href', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css#eye-slash');
    } else {
        input.type = 'password';
        icon.setAttribute('xlink:href', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css#eye');
    }
}

function logout() {
    currentUser = null;
    showTab('login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorMessage) errorMessage.classList.add('d-none');
}

async function register() {
    const emailInput = document.getElementById('reg-email');
    const nameInput = document.getElementById('reg-name');
    const phoneInput = document.getElementById('reg-phone');
    const departmentSelect = document.getElementById('reg-department');
    const passwordInput = document.getElementById('reg-password');
    const errorMessage = document.getElementById('reg-error');

    if (!emailInput || !nameInput || !phoneInput || !departmentSelect || !passwordInput || !errorMessage) {
        console.error('Registration form elements not found');
        alert('Registration form is broken. Please contact support.');
        return;
    }

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const department = departmentSelect.value;
    const password = passwordInput.value;
    errorMessage.classList.add('d-none');

    if (!email || !name || !phone || !department || !password) {
        errorMessage.textContent = 'All fields are required';
        errorMessage.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone, department, password })
        });
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = data.error;
            errorMessage.classList.remove('d-none');
            return;
        }
        alert('Registration successful! Please login.');
        showTab('login');
        emailInput.value = '';
        nameInput.value = '';
        phoneInput.value = '';
        departmentSelect.value = '';
        passwordInput.value = '';
    } catch (err) {
        console.error('Registration error:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.classList.remove('d-none');
    }
}

async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    if (!emailInput || !passwordInput || !errorMessage) {
        console.error('Login form elements not found');
        alert('Login form is broken. Please contact support.');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    errorMessage.classList.add('d-none');

    if (!email || !password) {
        errorMessage.textContent = 'Email and password are required';
        errorMessage.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
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
        errorMessage.textContent = 'Network error or server unreachable. Please try again.';
        errorMessage.classList.remove('d-none');
    }
}

async function loadStaffTasks() {
    try {
        const tasksResponse = await fetch(`/api/tasks/${currentUser.email}`);
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasks = await tasksResponse.json();
        const commentsPromises = tasks.map(task => 
            fetch(`/api/comments/${task.id}`).then(res => res.json()).catch(() => [])
        );
        const commentsData = await Promise.all(commentsPromises);

        const tasksDiv = document.getElementById('staff-tasks');
        if (!tasksDiv) {
            console.error('Staff tasks div not found');
            return;
        }
        tasksDiv.innerHTML = tasks.length ? tasks.map((task, index) => `
            <div class="task card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>${task.description} (${task.status}, Priority: ${task.priority})</span>
                    <button onclick="updateTask('${task.id}', 'Completed')" class="btn btn-success btn-sm">Complete</button>
                </div>
                <div class="comment-list mb-2">
                    ${commentsData[index].map(c => `
                        <div class="comment-item">${c.user_name}: ${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
                    `).join('')}
                </div>
                <div class="input-group">
                    <input type="text" id="comment-${task.id}" class="form-control comment-input" placeholder="Add task update">
                    <button onclick="addComment('${task.id}')" class="btn btn-outline-primary">Add</button>
                </div>
            </div>
        `).join('') : '<p>No tasks assigned.</p>';
    } catch (err) {
        console.error('Error loading staff tasks:', err);
        const tasksDiv = document.getElementById('staff-tasks');
        if (tasksDiv) tasksDiv.innerHTML = '<p>Error loading tasks. Please try again.</p>';
    }
}

async function loadStaffProfile() {
    const profileDiv = document.getElementById('staff-profile');
    if (!profileDiv) {
        console.error('Staff profile div not found');
        return;
    }
    profileDiv.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
    `;
}

async function loadStaffList() {
    try {
        const response = await fetch('/api/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        const staff = await response.json();
        const select = document.getElementById('staff-select');
        if (!select) {
            console.error('Staff select element not found');
            return;
        }
        select.innerHTML = staff
            .filter(s => s.active && s.role === 'Staff')
            .map(s => `<option value="${s.email}">${s.name} (${s.department})</option>`).join('');
    } catch (err) {
        console.error('Error loading staff list:', err);
        const select = document.getElementById('staff-select');
        if (select) select.innerHTML = '<option>Error loading staff</option>';
    }
}

async function assignTask() {
    const idInput = document.getElementById('task-id');
    const descInput = document.getElementById('task-desc');
    const staffSelect = document.getElementById('staff-select');
    const dueDateInput = document.getElementById('due-date');
    const prioritySelect = document.getElementById('task-priority');

    if (!idInput || !descInput || !staffSelect || !dueDateInput || !prioritySelect) {
        console.error('Assign task form elements not found');
        alert('Task form is broken. Please contact support.');
        return;
    }

    const id = idInput.value.trim();
    const description = descInput.value.trim();
    const assigned_to = staffSelect.value;
    const due_date = dueDateInput.value;
    const priority = prioritySelect.value;

    if (!id || !description || !assigned_to || !due_date || !priority) {
        alert('All fields are required');
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, description, assigned_to, due_date, priority })
        });
        const data = await response.json();
        if (data.success) {
            alert('Task assigned!');
            idInput.value = '';
            descInput.value = '';
            dueDateInput.value = '';
            showManagerView('tasks');
        } else {
            alert(data.error || 'Error assigning task');
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
            alert(data.error || 'Error updating task');
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
            alert(data.error || 'Error reopening task');
        }
    } catch (err) {
        console.error('Error reopening task:', err);
        alert('Network error. Please try again.');
    }
}

async function reassignTask(id) {
    const select = document.getElementById(`reassign-${id}`);
    if (!select) {
        console.error(`Reassign select for task ${id} not found`);
        alert('Reassign form is broken. Please contact support.');
        return;
    }
    const assigned_to = select.value;
    if (!assigned_to) {
        alert('Please select a staff member');
        return;
    }
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
            alert(data.error || 'Error reassigning task');
        }
    } catch (err) {
        console.error('Error reassigning task:', err);
        alert('Network error. Please try again.');
    }
}

async function addComment(taskId) {
    const commentInput = document.getElementById(`comment-${taskId}`);
    if (!commentInput) {
        console.error(`Comment input for task ${taskId} not found`);
        alert('Comment form is broken. Please contact support.');
        return;
    }
    const comment = commentInput.value.trim();
    if (!comment) {
        alert('Comment cannot be empty.');
        return;
    }

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, comment, user_email: currentUser.email })
        });
        const data = await response.json();
        if (data.success) {
            commentInput.value = '';
            if (currentUser.role === 'Staff') {
                loadStaffTasks();
            } else if (currentUser.role === 'Manager') {
                loadManagerTasks();
            } else if (currentUser.role === 'Admin') {
                loadAdminTasks();
            }
            alert('Comment added!');
        } else {
            alert(data.error || 'Error adding comment');
        }
    } catch (err) {
        console.error('Error adding comment:', err);
        alert('Network error. Please try again.');
    }
}

async function loadManagerTasks() {
    try {
        const tasksResponse = await fetch('/api/tasks');
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await tasksResponse.json();
        const staffResponse = await fetch('/api/staff');
        if (!staffResponse.ok) throw new Error('Failed to fetch staff');
        const staffData = await staffResponse.json();
        const commentsPromises = tasksData.map(task => 
            fetch(`/api/comments/${task.id}`).then(res => res.json()).catch(() => [])
        );
        const commentsData = await Promise.all(commentsPromises);

        const staffMap = {};
        staffData.forEach(s => {
            staffMap[s.email] = { name: s.name, department: s.department || 'Unknown' };
        });

        managerTasks = tasksData.map((task, index) => ({
            ...task,
            name: staffMap[task.assigned_to]?.name || task.assigned_to,
            department: staffMap[task.assigned_to]?.department || 'Unknown',
            comments: commentsData[index]
        }));

        renderManagerTasks();

        const staffOptions = staffData
            .filter(s => s.active && s.role === 'Staff')
            .map(s => `<option value="${s.email}">${s.name} (${s.department || 'Unknown'})</option>`).join('');
        document.querySelectorAll('.reassign-select').forEach(select => {
            if (select) select.innerHTML = staffOptions;
        });
    } catch (err) {
        console.error('Error loading manager tasks:', err);
        const tasksDiv = document.getElementById('manager-tasks-list');
        if (tasksDiv) tasksDiv.innerHTML = '<tr><td colspan="7">Error loading tasks. Please try again.</td></tr>';
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
    if (!tasksDiv) {
        console.error('Manager tasks list div not found');
        return;
    }
    tasksDiv.innerHTML = managerTasks.length ? managerTasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${task.department}</td>
            <td>${task.description}</td>
            <td>${task.due_date}</td>
            <td>${task.status}</td>
            <td>
                <div class="comment-list">
                    ${task.comments.map(c => `
                        <div class="comment-item">${c.user_name}: ${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
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
    `).join('') : '<tr><td colspan="7">No tasks available.</td></tr>';
}

async function loadAdminStaff() {
    try {
        const response = await fetch('/api/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        const staff = await response.json();
        const staffDiv = document.getElementById('admin-staff');
        if (!staffDiv) {
            console.error('Admin staff div not found');
            return;
        }
        staffDiv.innerHTML = staff.length ? staff.map(s => `
            <div class="staff card p-3 mb-3 d-flex justify-content-between align-items-center">
                <span>${s.name} - ${s.role} - ${s.email} - ${s.phone} - ${s.department} (${s.active ? 'Active' : 'Inactive'})</span>
                <div>
                    ${s.active ?
                        `<button onclick="deactivateStaff('${s.email}')" class="deactivate-btn btn btn-warning btn-sm me-1">Deactivate</button>` :
                        `<button onclick="reactivateStaff('${s.email}')" class="reactivate-btn btn btn-success btn-sm me-1">Reactivate</button>`}
                    <button onclick="resetPassword('${s.email}')" class="reset-password-btn btn btn-primary btn-sm me-1">Reset Password</button>
                    <button onclick="deleteStaff('${s.email}')" class="delete-btn btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('') : '<p>No staff available.</p>';
    } catch (err) {
        console.error('Error loading admin staff:', err);
        const staffDiv = document.getElementById('admin-staff');
        if (staffDiv) staffDiv.innerHTML = '<p>Error loading staff. Please try again.</p>';
    }
}

async function loadAdminTasks() {
    try {
        const tasksResponse = await fetch('/api/tasks');
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasksData = await tasksResponse.json();
        const staffResponse = await fetch('/api/staff');
        if (!staffResponse.ok) throw new Error('Failed to fetch staff');
        const staffData = await staffResponse.json();
        const commentsPromises = tasksData.map(task => 
            fetch(`/api/comments/${task.id}`).then(res => res.json()).catch(() => [])
        );
        const commentsData = await Promise.all(commentsPromises);

        const staffMap = {};
        staffData.forEach(s => {
            staffMap[s.email] = { name: s.name, department: s.department || 'Unknown' };
        });

        tasks = tasksData.map((task, index) => ({
            ...task,
            name: staffMap[task.assigned_to]?.name || task.assigned_to,
            department: staffMap[task.assigned_to]?.department || 'Unknown',
            comments: commentsData[index]
        }));

        const tasksDiv = document.getElementById('admin-tasks-list');
        if (!tasksDiv) {
            console.error('Admin tasks list div not found');
            return;
        }
        tasksDiv.innerHTML = tasks.length ? tasks.map(task => `
            <tr>
                <td>${task.name}</td>
                <td>${task.department}</td>
                <td>${task.description}</td>
                <td>${task.due_date}</td>
                <td>${task.status}</td>
                <td>
                    <div class="comment-list">
                        ${task.comments.map(c => `
                            <div class="comment-item">${c.user_name}: ${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
                        `).join('')}
                    </div>
                    <div class="input-group">
                        <input type="text" id="comment-${task.id}" class="form-control comment-input" placeholder="Add comment">
                        <button onclick="addComment('${task.id}')" class="btn btn-outline-primary">Add</button>
                    </div>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6">No tasks available.</td></tr>';
    } catch (err) {
        console.error('Error loading admin tasks:', err);
        const tasksDiv = document.getElementById('admin-tasks-list');
        if (tasksDiv) tasksDiv.innerHTML = '<tr><td colspan="6">Error loading tasks. Please try again.</td></tr>';
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

    const tasksDiv = document.getElementById('admin-tasks-list');
    if (!tasksDiv) {
        console.error('Admin tasks list div not found');
        return;
    }
    tasksDiv.innerHTML = tasks.length ? tasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${task.department}</td>
            <td>${task.description}</td>
            <td>${task.due_date}</td>
            <td>${task.status}</td>
            <td>
                <div class="comment-list">
                    ${task.comments.map(c => `
                        <div class="comment-item">${c.user_name}: ${c.comment} <small>(${new Date(c.created_at).toLocaleString()})</small></div>
                    `).join('')}
                </div>
                <div class="input-group">
                    <input type="text" id="comment-${task.id}" class="form-control comment-input" placeholder "Add comment">
                    <button onclick="addComment('${task.id}')" class="btn btn-outline-primary">Add</button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="6">No tasks available.</td></tr>';
}

async function addStaff() {
    const emailInput = document.getElementById('staff-email');
    const nameInput = document.getElementById('staff-name');
    const roleSelect = document.getElementById('role-select');
    const phoneInput = document.getElementById('staff-phone');
    const departmentSelect = document.getElementById('staff-department');
    const passwordInput = document.getElementById('staff-password');
    const errorMessage = document.getElementById('staff-error');

    if (!emailInput || !nameInput || !roleSelect || !phoneInput || !departmentSelect || !passwordInput || !errorMessage) {
        console.error('Add staff form elements not found');
        alert('Staff form is broken. Please contact support.');
        return;
    }

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const role = roleSelect.value;
    const phone = phoneInput.value.trim();
    const department = departmentSelect.value;
    const password = passwordInput.value;
    errorMessage.classList.add('d-none');

    if (!email || !name || !role || !phone || !department || !password) {
        errorMessage.textContent = 'All fields are required';
        errorMessage.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, role, phone, department, password })
        });
        const data = await response.json();
        if (data.success) {
            alert('Staff added!');
            loadAdminStaff();
            emailInput.value = '';
            nameInput.value = '';
            roleSelect.value = 'Staff';
            phoneInput.value = '';
            departmentSelect.value = '';
            passwordInput.value = '';
        } else {
            errorMessage.textContent = data.error || 'Error adding staff';
            errorMessage.classList.remove('d-none');
        }
    } catch (err) {
        console.error('Error adding staff:', err);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.classList.remove('d-none');
    }
}

async function deleteStaff(email) {
    if (!confirm(`Are you sure you want to delete ${email}? This will also delete all their tasks.`)) {
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
            alert('Staff deleted successfully.');
        } else {
            alert(data.error || 'Error deleting staff');
        }
    } catch (err) {
        console.error('Error deleting staff:', err);
        alert('Network error. Please try again.');
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
            alert(data.error || 'Error deactivating staff');
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
            alert(data.error || 'Error reactivating staff');
        }
    } catch (err) {
        console.error('Error reactivating staff:', err);
        alert('Network error. Please try again.');
    }
}

async function resetPassword(email) {
    if (!confirm(`Are you sure you want to reset the password for ${email}?`)) {
        return;
    }
    try {
        const response = await fetch(`/api/staff/reset-password/${email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            alert(`Password reset successfully. New password: ${data.tempPassword}`);
        } else {
            alert(data.error || 'Error resetting password');
        }
    } catch (err) {
        console.error('Error resetting password:', err);
        alert('Network error. Please try again.');
    }
}

// Sidebar toggle events
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const managerSidebarToggle = document.getElementById('manager-sidebar-toggle');
    const managerMobileSidebarToggle = document.getElementById('manager-mobile-sidebar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => toggleSidebar('sidebar'));
    }
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', () => toggleSidebar('sidebar'));
    }
    if (managerSidebarToggle) {
        managerSidebarToggle.addEventListener('click', () => toggleSidebar('manager-sidebar'));
    }
    if (managerMobileSidebarToggle) {
        managerMobileSidebarToggle.addEventListener('click', () => toggleSidebar('manager-sidebar'));
    }
});