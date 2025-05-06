window.addEventListener('DOMContentLoaded', function () {

    const userData = JSON.parse(localStorage.getItem('userData')); 
    
    if (!userData || !userData.id) {
        console.error('No userId found in localStorage');
        return; 
    }
    
    const userId = userData.id;
    
    // Fetch overall progress data
    fetch(`/progress-tracker/aggregated/user/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Aggregated Data:", data); 
            if (Array.isArray(data) && data.length > 0) {
                renderOverallProgressChart(data); 
            } else {
                console.error('Data format is incorrect or empty:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching overall progress data:', error);
        });

    
    fetch(`/progress-tracker/task-completion/user/${userId}`)  
        .then(response => response.json())
        .then(data => {
            console.log("Task Completion Data:", data); 
            renderTaskCompletionChart(data); 
        })
        .catch(error => {
            console.error('Error fetching task completion data:', error);
        });

    const form = document.querySelector('#progressTrackerForm');
    const errorMessage = document.querySelector('#error-message');

    
   // Toggle manual duration input based on user selection
document.querySelectorAll('input[name="durationAllocation"]').forEach((radio) => {
    radio.addEventListener('change', function () {
        const manualDurationInput = document.getElementById('manualDurationInput');
        if (this.value === 'manual') {
            manualDurationInput.classList.remove('d-none');
        } else {
            manualDurationInput.classList.add('d-none');
        }
    });
});

document.querySelector('.add-task-duration').addEventListener('click', function () {
    const taskDurationContainer = document.getElementById('task-duration-container');
    const taskInputs = document.querySelectorAll('.task-field');

    const taskIndex = taskDurationContainer.querySelectorAll('.d-flex').length;
    const taskName = taskInputs[taskIndex]?.value || `Task ${taskIndex + 1}`;

    if (!taskName) {
        alert("No task available to allocate time. Please add a task first.");
        return;
    }

    const durationDiv = document.createElement('div');
    durationDiv.className = 'd-flex align-items-center mt-2';
    durationDiv.innerHTML = `
        <span class="me-2 fw-bold task-name">${taskName}</span>
        <input type="number" class="form-control me-2" placeholder="Days" min="0">
        <input type="number" class="form-control me-2" placeholder="Hours" min="0" max="23">
        <input type="number" class="form-control me-2" placeholder="Minutes" min="0" step="0.01">
        <button type="button" class="btn btn-danger btn-sm remove-duration">Remove</button>
    `;

    taskDurationContainer.appendChild(durationDiv);

    // Add remove functionality
    durationDiv.querySelector('.remove-duration').addEventListener('click', () => durationDiv.remove());
});



form.onsubmit = function (e) {
    e.preventDefault();

    const title = form.querySelector('input[name=title]').value.trim();
    const startDate = new Date(form.querySelector('input[name=startDate]').value.trim());
    const dueDate = new Date(form.querySelector('input[name=dueDate]').value.trim());
    const notes = form.querySelector('textarea[name=notes]').value.trim();

    const tasks = Array.from(document.querySelectorAll('.task-input')).map(taskInput => ({
        title: taskInput.querySelector('.task-field').value.trim(),
        dependencyIndex: taskInput.querySelector('.dependency-field').value || null,
    }));

    const isManualAllocation = document.querySelector('input[name="durationAllocation"]:checked')?.value === 'manual';

    let taskDurations = isManualAllocation ? Array.from(document.querySelectorAll('#task-duration-container .d-flex')).map(durationInput => {
        const taskName = durationInput.querySelector('.task-name').textContent.trim();
        const days = parseInt(durationInput.querySelector('input[placeholder="Days"]').value) || null;
        const hours = parseInt(durationInput.querySelector('input[placeholder="Hours"]').value) || null;
        const minutes = parseFloat(durationInput.querySelector('input[placeholder="Minutes"]').value) || null;  // Use parseFloat here
    
        if (days === null && hours === null && minutes === null) {
            errorMessage.textContent = 'Please provide duration (Days, Hours, or Minutes) for each task.';
            return null; 
        }
    
        if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
            errorMessage.textContent = 'Please provide valid task durations (Days, Hours, or Minutes).';
            return null; 
        }
    
        const totalHours = (days || 0) * 24 + (hours || 0) + (minutes || 0) / 60;
    
        return {
            taskName,
            duration: totalHours, 
        };
    }).filter(duration => duration !== null) : [];
    


    if (isManualAllocation && taskDurations.length === 0) {
        errorMessage.textContent = 'Please allocate duration for at least one task.';
        return;
    }

    if (!isManualAllocation) {
        const totalDuration = (dueDate - startDate) / (1000 * 60 * 60); 
        const equalDuration = totalDuration / tasks.length;
        taskDurations = tasks.map(() => ({ duration: equalDuration }));
    }
    
    


    const taskDependencies = tasks.map((task) => {
        const dependencyTitle = task.dependencyIndex 
            ? tasks[parseInt(task.dependencyIndex, 10)].title  
            : null;
    
        return {
            title: task.title,
            dependsOn: dependencyTitle,  
        };
    });

    console.log("Task Durations:", taskDurations);
    console.log("Task Depends:", taskDependencies); 

    if (!title || !startDate || !dueDate || !tasks.length) {
        errorMessage.textContent = 'Please provide valid details and at least one task.';
        return;
    }

    if (dueDate < startDate) {
        errorMessage.textContent = "Due date cannot be earlier than the start date.";
        return;
    }

    const taskErrors = tasks.filter(task => !task.title).map((_, index) => `Task ${index + 1} is missing a 'title'`);
    if (taskErrors.length > 0) {
        errorMessage.textContent = taskErrors.join(", ");
        return;
    }

    const token = localStorage.getItem('token');

    fetch(`/progress-tracker/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            title,
            startDate,
            dueDate,
            notes,
            tasks: taskDependencies,
            taskDurations,
            userId,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            errorMessage.textContent = data.error;
        } else {
            alert('Tracker created successfully!');
            form.reset();
            location.reload();
        }
    })
    .catch(error => {
        console.error(error);
        errorMessage.textContent = `Error: ${error.message}`;
    });
};

 




    // Add new task logic
    document.getElementById('task-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('add-task')) {
            const taskContainer = document.getElementById('task-container');
            const taskInput = document.createElement('div');
            taskInput.className = 'task-input';
            const taskIndex = taskContainer.querySelectorAll('.task-input').length;  
            taskInput.innerHTML = `
                <input type="text" class="form-control mb-2 task-field" placeholder="Task name" required>
                <select class="form-select dependency-field">
                    <option value="">No Dependency</option>
                    ${Array.from(taskContainer.querySelectorAll('.task-field'))
                        .map((taskField, index) => `<option value="${index}">${taskField.value || `Task ${index + 1}`}</option>`)
                        .join('')}
                </select>
                <button type="button" class="btn btn-danger btn-sm remove-task">Remove</button>
            `;
            taskContainer.appendChild(taskInput);
            
            // Add event listener to the newly created "Remove" button
            taskInput.querySelector('.remove-task').addEventListener('click', function () {
                taskInput.remove();
            });
        }
    });




// Detect equal duration radio button change
document.querySelector('#equalDuration').addEventListener('change', function () {
    document.getElementById('manualDurationInput').classList.add('d-none');
});




        let overallProgressChart; 
    let taskCompletionChart; 
    
    function renderOverallProgressChart(data) {
        const ctx = document.getElementById('overall-progress-chart').getContext('2d');
        const progressNames = data.map(item => item.title || 'Unnamed Progress');
        const progressPercentages = data.map(item => item.progressPercentage || 0);
    
        // Destroy existing chart if it exists
        if (overallProgressChart) {
            overallProgressChart.destroy();
        }
    
        overallProgressChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: progressNames,
                datasets: [{
                    label: 'Progress Percentage',
                    data: progressPercentages,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderTaskCompletionChart(data) {
        const ctx = document.getElementById('task-completion-chart').getContext('2d');
        const statusCounts = {
            COMPLETED: data.COMPLETED || 0,
            ONGOING: data.ONGOING || 0,
            NOT_BEGUN: data.NOT_BEGUN || 0,
            OVERDUE: data.OVERDUE || 0,
            PENDING: data.PENDING || 0
        };
    
        // Destroy existing chart if it exists
        if (taskCompletionChart) {
            taskCompletionChart.destroy();
        }
    
        taskCompletionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'Ongoing', 'Not Begun', 'Overdue', 'Pending'],
                datasets: [{
                    data: [statusCounts.COMPLETED, statusCounts.ONGOING, statusCounts.NOT_BEGUN, statusCounts.OVERDUE,statusCounts.PENDING],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',    // Completed - greenish
                        'rgba(255, 206, 86, 0.6)',    // Ongoing - yellow
                        'rgba(255, 99, 132, 0.6)',    // Not Begun - reddish
                        'rgba(255, 0, 0, 0.6)',
                        'rgba(200, 200, 200, 0.6)'
    
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 0, 0, 1)',
                        'rgba(200, 200, 200, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    function renderTable(data) {
        const tableBody = document.getElementById('progress-table');
        tableBody.innerHTML = ''; 
    
        data.forEach(progressTracker => {
            const row = document.createElement('tr');
            
            // Check if the tracker is closed and apply the locked class
            const isClosed = progressTracker.isClosed;
            const rowClass = isClosed ? 'locked' : ''; 
    
            // Handle status formatting
            if(progressTracker.status === 'NOT_BEGUN'){
                progressTracker.status = 'NOT BEGUN';
            }
    
            row.className = rowClass;
    
            // Format the forecast status
            let forecastClass = '';
            let forecastMessage = progressTracker.forecastStatus || 'On Schedule';
            if (forecastMessage === 'Ahead of Schedule') {
                forecastClass = 'text-success'; // Green for ahead of schedule
            } else if (forecastMessage === 'Behind Schedule') {
                forecastClass = 'text-danger'; // Red for behind schedule
            }
    
            // Format the expected completion date
            const formattedExpectedCompletionDate = progressTracker.expectedCompletionDate ? 
                new Date(progressTracker.expectedCompletionDate).toLocaleString() : 'N/A';
    
            row.innerHTML = `
                <td>${progressTracker.title || 'No Title'}</td>
                <td>${statusEmoji(progressTracker.status)} ${progressTracker.status}</td>
                <td>${formatDeadline(progressTracker.startDate)}</td>
                <td>${formatDeadline(progressTracker.deadline)}</td>
                <td>${progressTracker.notes || 'No Notes'}</td>
                <td>${progressTracker.progressPercentage || 0}%</td>
                <td class="${forecastClass}">${forecastMessage}</td>
                <td>${formattedExpectedCompletionDate}</td>
                <td>
                    <button class="btn btn-primary view-tasks" data-id="${progressTracker.id}">View Tasks</button>
                    <button class="btn btn-danger delete-progress" data-id="${progressTracker.id}">Delete</button>
                </td>
            `;
    
            tableBody.appendChild(row);
    
            // Add event listener for viewing tasks
            row.querySelector('.view-tasks').addEventListener('click', function () {
                fetch(`/progress-tracker/tasks/${progressTracker.id}`)
                    .then(response => response.json())
                    .then(updatedTasks => {
                        const modal = document.getElementById('task-modal');
                        if (modal) {
                            modal.remove();
                        }
                        displayTasksModal(progressTracker, updatedTasks);
                    });
            });
    
            // Add event listener for the delete button
            row.querySelector('.delete-progress').addEventListener('click', function () {
                const trackerId = progressTracker.id;
    
                // Show the custom confirmation modal
                const modal = document.getElementById('confirm-modal');
                modal.style.display = 'block';  // Show the modal
    
                // Handle delete confirmation
                document.getElementById('confirm-delete-btn').onclick = function () {
                    deleteProgressTracker(trackerId);
                    modal.style.display = 'none'; // Hide the modal
                };
    
                // Handle cancel button
                document.getElementById('cancel-delete-btn').onclick = function () {
                    modal.style.display = 'none'; // Just close the modal if canceled
                };
            });
        });
    }
    
    function deleteProgressTracker(trackerId) {
        const token = localStorage.getItem('token');
        fetch(`/progress-tracker/delete/${trackerId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status === 200) {
                alert('Progress tracker deleted successfully!');
                location.reload(); 
            } else {
                throw new Error('Failed to delete tracker');
            }
        })
        .catch(error => {
            console.error('Error deleting tracker:', error);
            alert('Failed to delete tracker');
        });
    }
    
    
    function statusEmoji(status) {
        if (status === 'COMPLETED') return '✅';
        if (status === 'ONGOING') return '⏳';
        if (status === 'OVERDUE') return '⏰'; 
        if (status === 'PENDING') return '🔜'
        return '❌'; 
    }
    
    
    function formatDeadline(deadline) {
        const date = new Date(deadline);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function displayTasksModal(progressTracker, tasks) {
        if (!progressTracker || !tasks) {
            console.error('Invalid tracker or tasks data');
            return;
        }
    
        let modal = document.getElementById('task-modal');
    
        if (!modal) {
            const modalContent = `
                <div class="modal fade" id="task-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"></h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <ul id="task-list" class="list-group"></ul>
                            </div>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalContent);
            modal = document.getElementById('task-modal');
    
            modal.addEventListener('hidden.bs.modal', function () {
                fetch(`/progress-tracker/user/${progressTracker.userId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            renderTable(data);
                        } else {
                            console.error('Fetched data is not an array:', data);
                        }
                    })
                    .catch(error => console.error('Error fetching updated progress trackers:', error));
            });
        }
    
        modal.querySelector('.modal-title').textContent = progressTracker.title || 'Unnamed Progress Tracker';
    
        const taskList = modal.querySelector('#task-list');
        taskList.innerHTML = tasks
            .map(task => {
                // Function to check task dependencies status
                function isTaskDependencyCompleted(taskId, tasks) {
                    const task = tasks.find(t => t.id === taskId);
                    if (!task || !task.dependsOn) return true; 
                    const dependentTask = tasks.find(t => t.id === task.dependsOn);
                    return dependentTask?.isCompleted && isTaskDependencyCompleted(dependentTask.id, tasks);
                }
    
                return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <input type="checkbox" 
                            data-id="${task.id}" 
                            ${task.isCompleted ? 'checked' : ''} 
                            ${!isTaskDependencyCompleted(task.id, tasks) || progressTracker.isClosed ? 'disabled' : ''}>
                        ${task.title || 'Untitled Task'}
                        <div class="d-flex align-items-center">
                            <span class="task-status badge ${getStatusClass(task.status)}">${task.status}</span>
                            <span class="schedule-status ${getScheduleClass(task.scheduleStatus)} ms-2">${task.scheduleStatus || 'On schedule'}</span>
                        </div>
                        ${task.completedAt ? `<span class="completed-time">Completed at: ${new Date(task.completedAt).toLocaleString()}</span>` : ''}
                        ${!isTaskDependencyCompleted(task.id, tasks) && !task.isCompleted ? `<small class="text-danger"> (Dependency not completed)</small>` : ''}
                    </div>
                </li>`;
            })
            .join('');
    
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    
        // Event listener for task checkboxes (update task completion)
        if (!progressTracker.isClosed) {
            taskList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const taskId = this.dataset.id;
                    const completed = this.checked;
                    const userData = JSON.parse(localStorage.getItem('userData')); 
    
                    if (!userData || !userData.id) {
                        console.error('No userId found in localStorage');
                        return; 
                    }
    
                    const userId = userData.id;
    
                    // Directly update the task completion status without checking dependencies
                    fetch(`/progress-tracker/task/complete/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed, userId })
                    })
                        .then(response => response.json())
                        .then(updatedTask => {
                            console.log('Task status updated successfully');
    
                            // Update UI directly without refreshing
                            const taskItem = this.closest('li');
                            const statusBadge = taskItem.querySelector('.task-status');
                            const scheduleBadge = taskItem.querySelector('.schedule-status');
    
                            if (updatedTask.completedAt) {
                                let completedTimeElement = taskItem.querySelector('.completed-time');
                                if (!completedTimeElement) {
                                    completedTimeElement = document.createElement('span');
                                    completedTimeElement.className = 'completed-time';
                                    taskItem.appendChild(completedTimeElement);
                                }
                                completedTimeElement.textContent = `Completed at: ${new Date(updatedTask.completedAt).toLocaleString()}`;
                            }
    
                            this.checked = updatedTask.isCompleted;
                            statusBadge.textContent = updatedTask.status;
                            statusBadge.className = `task-status badge ${getStatusClass(updatedTask.status)}`;
                            scheduleBadge.textContent = updatedTask.scheduleStatus;
                            scheduleBadge.className = `schedule-status ${getScheduleClass(updatedTask.scheduleStatus)}`;
                        })
                        .catch(error => console.error('Error updating task:', error));
                });
            });
        }
    }
    
    function getStatusClass(status) {
        switch (status) {
            case 'COMPLETED':
                return 'bg-success';  
            case 'LOCKED':
                return 'bg-danger';  
            case 'INCOMPLETE':
                return 'bg-warning'; 
            default:
                return 'bg-primary';  
        }
    }
    
    function getScheduleClass(scheduleStatus) {
        switch (scheduleStatus) {
            case 'On Schedule':
                return 'bg-success';  
            case 'Behind Schedule':
                return 'bg-danger';   
            case 'Ahead Of Schedule':
                return 'bg-info';    
            default:
                return 'bg-secondary';  
        }
    }
    

    
    
    

    
    
    
    
    
    
    
    
    
    
       
        let progressData = []; 
    
        fetch(`/progress-tracker/user/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    progressData = data; 
                    renderTable(data);
                } else {
                    console.error('Fetched data is not an array:', data);
                }
            });
    
            document.getElementById('filter-button').addEventListener('click', function() {
                // Get filter values
                const status = document.getElementById('status-filter').value;
                const dueDateStart = document.getElementById('dueDate-start').value;
                const dueDateEnd = document.getElementById('dueDate-end').value;
                const progressMin = parseInt(document.getElementById('progress-min').value, 10);
                const progressMax = parseInt(document.getElementById('progress-max').value, 10);
            
                // Fetch the data again (you could have cached it, but let's keep it simple)
                fetch(`/progress-tracker/user/${userId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            // Apply filters to the data
                            const filteredData = data.filter(tracker => {
                                let matches = true;
            
                                // Status filter
                                if (status && tracker.status !== status) {
                                    matches = false;
                                }
            
                                // Due date filters
                                if (dueDateStart && new Date(tracker.deadline) < new Date(dueDateStart)) {
                                    matches = false;
                                }
                                if (dueDateEnd && new Date(tracker.deadline) > new Date(dueDateEnd)) {
                                    matches = false;
                                }
            
                                // Progress percentage filters
                                if (!isNaN(progressMin) && tracker.progressPercentage < progressMin) {
                                    matches = false;
                                }
                                if (!isNaN(progressMax) && tracker.progressPercentage > progressMax) {
                                    matches = false;
                                }
            
                                return matches;
                            });
            
                            // Render filtered data in the table
                            renderTable(filteredData);
                        } else {
                            console.error('Fetched data is not an array:', data);
                        }
                    })
                    .catch(error => console.error('Error fetching progress trackers:', error));
            });
            
    });
    

    