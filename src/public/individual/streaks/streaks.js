const userData = JSON.parse(localStorage.getItem('userData'));

if (!userData || !userData.id) {
    console.error('No userId found in localStorage');
} 
const userId = userData.id;

const notificationList = document.getElementById("notificationList");
const markAllReadButton = document.getElementById("markAllReadButton");

async function fetchNotifications() {
    try {
        const response = await fetch(`/streak/streak-notifications/${userId}`);
        const notifications = await response.json();

        notificationList.innerHTML = ""; 

        if (notifications.length === 0) {
            notificationList.innerHTML = "<p class='text-center text-muted'>No new notifications.</p>";
            return;
        }

        notifications.forEach((notification) => {
            const notificationItem = document.createElement("div");
            notificationItem.classList.add("notification-item", "list-group-item");
            if (!notification.isRead) {
                notificationItem.classList.add("unread");
            }

            let icon;
            if (notification.type === "FREEZE_POWERUP_EARNED") {
                icon = '<i class="fas fa-snowflake text-primary icon"></i>';
            } else if (notification.type === "STREAK_MAINTAINED") {
                icon = '<i class="fas fa-fire text-danger icon"></i>';
            } else {
                icon = '<i class="fas fa-bell text-warning icon"></i>';
            }

            // Add the status to the notification message
            let statusMessage = '';
            if (notification.status === 'PENDING') {
                statusMessage = `<span class="badge badge-warning">Pending</span>`;
            } else if (notification.status === 'COMPLETED') {
                statusMessage = `<span class="badge badge-success">Completed</span>`;
            }

            notificationItem.innerHTML = `
                ${icon}
                <div class="message">
                    <strong>${notification.message}</strong>
                    <div class="timestamp">${new Date(notification.createdAt).toLocaleString()}</div>
                    <div class="status">${statusMessage}</div> <!-- Show status here -->
                </div>
                ${!notification.isRead ? `<span class="mark-read" data-id="${notification.id}">✔ Mark Read</span>` : ""}
            `;

            notificationList.appendChild(notificationItem);
        });

        attachMarkReadListeners();
    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
}

function attachMarkReadListeners() {
    document.querySelectorAll(".mark-read").forEach((btn) => {
        btn.addEventListener("click", async function () {
            const notificationId = this.getAttribute("data-id");
            await markNotificationAsRead(notificationId);
        });
    });
}

async function markNotificationAsRead(notificationId) {
    try {
        await fetch("/streak/streak-notifications/mark-as-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId }),
        });

        fetchNotifications();
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

markAllReadButton.addEventListener("click", async function () {
    document.querySelectorAll(".mark-read").forEach(async (btn) => {
        await markNotificationAsRead(btn.getAttribute("data-id"));
    });
});

  
async function getStreak() {
    try {
        const response = await fetch(`/streak/retrieve/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch streak data");

        const streak = await response.json();
        document.getElementById('currentStreak').textContent = streak.currentStreak || 0;
        document.getElementById('longestStreak').textContent = streak.longestStreak || 0;
        document.getElementById('freezeCount').textContent = streak.freezeCount || 0;
        document.getElementById('Status').textContent = streak.status;

       
        const freezeButton = document.getElementById('freezeButton');
        if (streak.status === 'FROZEN' || streak.freezeCount <= 0) {
            freezeButton.disabled = true;
        } else {
            freezeButton.disabled = false;
        } 

    } catch (error) {
        console.error('Error fetching streak:', error);
    }
}

async function useFreezePowerUp() {
    const freezeCount = parseInt(document.getElementById('freezeCount').textContent);
    
    if (freezeCount <= 0) {
        alert("You don't have any freeze power-ups available.");
        return;
    }

    try {
        
        const response = await fetch('/streak/freeze/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) throw new Error("Failed to use freeze power-up");

        
        document.getElementById('freezeCount').textContent = freezeCount - 1;
        alert("Your streak has been frozen!");

       
        document.getElementById('freezePowerUpButton').disabled = true;

    } catch (error) {
        console.error('Error using freeze power-up:', error);
    }
}

document.getElementById('freezeButton').addEventListener('click', useFreezePowerUp);

async function loadUsers() {
    try {
        const response = await fetch('/streak/users/list');
        if (!response.ok) throw new Error("Failed to fetch users");

        const users = await response.json();
        const select = document.getElementById('partnerSelect');
        select.innerHTML = '<option value="">Select a user</option>';

        users.forEach(user => {
            if (user.id !== userId) { 
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

document.getElementById('setPartnerButton').addEventListener('click', setPartner);

async function setPartner() {
    const partnerId = document.getElementById('partnerSelect').value;
    if (!partnerId) {
        alert("Please select a partner!");
        return;
    }

    try {
        console.log("Sending partner request to:", partnerId);
        const response = await fetch('/streak/accountability/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, partnerId }),
        });

        if (!response.ok) throw new Error("Failed to send partner request");

        alert("Partner request sent successfully!");
        location.reload();
        checkRequestStatus();
    } catch (error) {
        console.error('Error sending partner request:', error);
    }
}


async function loadRequests() {
    try {
        await loadReceivedRequests(); 
        await loadSentRequests(); 
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}


async function loadReceivedRequests() {
    try {
        const response = await fetch(`/streak/accountability/requests/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch received requests");

        const receivedRequests = await response.json();
        console.log("Received requests:", receivedRequests);
        const requestList = document.getElementById('receivedRequestList');
        requestList.innerHTML = '';

        
        if (receivedRequests.length === 0) {
            requestList.innerHTML = '<li class="list-group-item">No requests received.</li>';
            return;
        }

      
        receivedRequests.forEach(request => {
            const requestItem = document.createElement('li');
            requestItem.classList.add('request-item');

            const userName = request.user ? request.user.name : 'Unknown';
            const userAvatar = request.user ? request.user.avatarUrl : '/default-avatar.jpg';

            
            let statusClass = '';
            if (request.status === 'PENDING') statusClass = 'status-pending';
            else if (request.status === 'ACCEPTED') statusClass = 'status-accepted';
            else if (request.status === 'REJECTED') statusClass = 'status-rejected';

            requestItem.innerHTML = `
                <div class="user-info">
                    <img src="${userAvatar}" alt="Avatar" class="rounded-circle" />
                    <div>
                        <strong class="user-name">${userName}</strong>
                        <div class="status ${statusClass}">${request.status}</div>
                    </div>
                </div>
                <div class="buttons">
                    ${request.status === 'PENDING' ? ` 
                        <button class="btn btn-accept" onclick="acceptRequest(${request.id})">Accept</button>
                        <button class="btn btn-reject" onclick="rejectRequest(${request.id})">Reject</button>
                    ` : ''}
                </div>
            `;

            requestList.appendChild(requestItem);
        });
    } catch (error) {
        console.error('Error loading received requests:', error);
    }
}


async function loadSentRequests() {
    try {
        const response = await fetch(`/streak/accountability/requests/sent/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch sent requests");

        const sentRequests = await response.json();
        const requestList = document.getElementById('sentRequestList');
        requestList.innerHTML = '';

        if (sentRequests.length === 0) {
            requestList.innerHTML = '<li class="list-group-item text-muted">No sent requests.</li>';
            return;
        }

        sentRequests.forEach(request => {
            const requestItem = document.createElement('li');
            requestItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            const userName = request.partner ? request.partner.name : 'Unknown';
            const userAvatar = request.partner ? request.partner.avatar : '/default-avatar.jpg';

            let statusBadge = '';
            if (request.status === 'PENDING') {
                statusBadge = `<span class="badge badge-warning">🕒 Pending</span>`;
            } else if (request.status === 'ACCEPTED') {
                statusBadge = `<span class="badge badge-success">✅ Accepted</span>`;
            } else if (request.status === 'REJECTED') {
                statusBadge = `<span class="badge badge-danger">❌ Rejected</span>`;
            }

            requestItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${userAvatar}" alt="Avatar" class="rounded-circle" width="40" height="40" />
                    <strong class="ms-3">${userName}</strong>
                </div>
                <div class="mt-2">
                    ${statusBadge}
                </div>
            `;

            if (request.status === 'PENDING') {
                const cancelButton = document.createElement('button');
                cancelButton.classList.add('btn', 'btn-danger', 'btn-sm', 'float-end', 'ml-2');
                cancelButton.textContent = 'Cancel Request';
                cancelButton.addEventListener('click', () => cancelRequest(request.id));
                requestItem.appendChild(cancelButton);
            }

            requestList.appendChild(requestItem);
        });

    } catch (error) {
        console.error('Error loading sent requests:', error);
    }
}



async function acceptRequest(requestId) {
    try {
        const response = await fetch(`/streak/accountability/accept`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId }),
        });

        if (!response.ok) throw new Error("Failed to accept request");

        alert('Request accepted!');
        location.reload();
    } catch (error) {
        console.error('Error accepting request:', error);
    }
}

async function rejectRequest(requestId) {
    try {
        const response = await fetch(`/streak/accountability/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId }),
        });

        if (!response.ok) throw new Error("Failed to reject request");

        alert('Request rejected!');
        location.reload();
    } catch (error) {
        console.error('Error rejecting request:', error);
    }
}

async function cancelRequest(requestId) {
    try {
        const response = await fetch(`/streak/accountability/cancel/${requestId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error("Failed to cancel request");

        alert('Request cancelled!');
        location.reload();
    } catch (error) {
        console.error('Error cancelling request:', error);
    }
}

async function getPartnerData() {
    try {
        const response = await fetch(`/streak/accountability/progress/${userId}`);

        if (!response.ok) throw new Error("Failed to fetch partner data");

        const responseText = await response.text();
        console.log("Raw Response:", responseText);

        if (!responseText.trim()) {
            console.log("No partner data found.");
            document.getElementById('partnerList').innerHTML = '<p>No partners found.</p>';
            return;
        }

        const partners = JSON.parse(responseText);
        console.log("Fetched partner data:", partners);

        const partnerList = document.getElementById('partnerList');
        if (!partnerList) {
            console.error('Element with ID "partnerList" not found');
            return;
        }

        partnerList.innerHTML = ''; 

        if (Array.isArray(partners) && partners.length > 0) {
            partners.forEach(partner => {
                const partnerItem = document.createElement('div');
                partnerItem.classList.add('partner-item');

                // Partner's name, streak info, and avatar
                const avatar = partner.partnerDetails?.avatar || 'default-avatar.png';
                const name = partner.partnerDetails?.name || 'Unknown';
                const currentStreak = partner.partnerStreakData?.currentStreak ?? 0;
                const longestStreak = partner.partnerStreakData?.longestStreak ?? 0;
                const partnerStreak = partner.partnerStreak;

                const partnerInfo = document.createElement('div');
                partnerInfo.classList.add('partner-info');
                partnerInfo.innerHTML = `
                    <img src="${avatar}" alt="Avatar" width="70" height="70" />
                    <h3>${name}</h3>
                    <p>Current Streak: ${currentStreak}</p>
                    <p>Longest Streak: ${longestStreak}</p>
                    <p>Duo Streak: ${partnerStreak}</p>
                `;
                partnerItem.appendChild(partnerInfo);

                // Streak Info
                const streakInfo = document.createElement('div');
                streakInfo.classList.add('streak-info');
                streakInfo.innerHTML = `
                    <span>Current: ${currentStreak}</span>
                    <span>Longest: ${longestStreak}</span>
                `;
                partnerItem.appendChild(streakInfo);

                // Task List
                const taskList = document.createElement('ul');
                taskList.classList.add('task-list');
                if (!partner.completedTasks || partner.completedTasks.length === 0) {
                    const noTasksItem = document.createElement('li');
                    noTasksItem.classList.add('task-item');
                    noTasksItem.textContent = 'No completed tasks';
                    taskList.appendChild(noTasksItem);
                } else {
                    partner.completedTasks.forEach(task => {
                        const taskItem = document.createElement('li');
                        taskItem.classList.add('task-item');
                        taskItem.textContent = `${task.title} (Completed: ${new Date(task.completedAt).toLocaleString()})`;
                        taskList.appendChild(taskItem);
                    });
                }
                partnerItem.appendChild(taskList);

                
                const nudgeBtn = document.createElement('button');
                nudgeBtn.classList.add('nudge-btn');
                nudgeBtn.textContent = 'Send Nudge';
                nudgeBtn.addEventListener('click', () => sendNudge(partner.partnerDetails.id)); 
                partnerItem.appendChild(nudgeBtn);

                
                partnerList.appendChild(partnerItem);
            });
        } else {
            partnerList.innerHTML = '<p>No partners found.</p>';
        }

    } catch (error) {
        console.error('Error fetching partner data:', error);
        document.getElementById('partnerList').innerHTML = '<p>No partners found.</p>';
    }
}

// Send Nudge to Partner
async function sendNudge(partnerId) {
    try {
        const response = await fetch(`/streak/streak-nudge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                senderId: userId,
                partnerId: partnerId,
            }),
        });

        const data = await response.json();
        if (data.success) {
            alert('Nudge sent successfully!');
        } else {
            alert('Failed to send nudge.');
        }
    } catch (error) {
        console.error('Error sending nudge:', error);
        alert('Error sending nudge');
    }
}



// Initialize on page load
window.onload = function () {
    getStreak();
    loadUsers();
    loadRequests();
    getPartnerData();
    fetchNotifications();
};
