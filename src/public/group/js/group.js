const userData = JSON.parse(localStorage.getItem("userData"));
console.log(userData);

document.getElementById('create-group-btn').addEventListener('click', () => {
    const createGroupModal = new bootstrap.Modal(document.getElementById('createGroupModal'));
    document.getElementById('invite-code').value = generateInviteCode(); 
    createGroupModal.show();
});

document.getElementById('join-group-btn').addEventListener('click', () => {
    const joinGroupModal = new bootstrap.Modal(document.getElementById('joinGroupModal'));
    joinGroupModal.show();
});

document.getElementById('save-group-btn').addEventListener('click', async () => {
    const groupName = document.getElementById('group-name').value;
    const inviteCode = document.getElementById('invite-code').value;
    const groupDesc = document.getElementById('group-desc').value;
    const module = document.getElementById('module').value;
    const createdBy = userData.id;

    if (groupName && inviteCode && groupDesc && module && createdBy) {
        try {
            // Send a POST request to the createGroup endpoint
            const response = await fetch('/group/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    groupName,
                    inviteCode,
                    groupDesc,
                    module,
                    createdBy,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert('Group created successfully!');
                loadJoinedGroups();

                // Optionally, add the new group to the UI without refreshing
                const joinedGroups = document.getElementById('joined-groups');
                const newGroup = document.createElement('div');
                newGroup.classList.add('group-item');
                newGroup.textContent = `${groupName} - ${module}`;
                joinedGroups.appendChild(newGroup);

                // Hide the modal after saving
                const createGroupModal = bootstrap.Modal.getInstance(document.getElementById('createGroupModal'));
                createGroupModal.hide();
            } else {
                alert('Failed to create group. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    } else {
        alert('Please fill out all fields.');
    }
});

function generateInviteCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
        inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return inviteCode;
}

document.addEventListener('DOMContentLoaded', () => {
    loadJoinedGroups();
});

async function loadJoinedGroups() {
    try {
        const userId = userData.id;
        const response = await fetch(`/group?userId=${userId}`);
        if (response.ok) {
            const data = await response.json();
            const joinedGroupsContainer = document.getElementById('joined-groups');
            joinedGroupsContainer.innerHTML = ''; // Clear existing content

            const row = document.createElement('div');
            row.classList.add('row', 'g-3');
            console.log(data);

            data.groups.forEach(member => {
                const group = member.group;
                const creatorName = group.creator.name; // Now this will have the creator's name

                const col = document.createElement('div');
                col.classList.add('col-md-4');

                const groupCard = document.createElement('div');
                groupCard.classList.add('card', 'h-100');
                groupCard.style.cursor = 'pointer';

                groupCard.addEventListener('click', () => {
                    window.location.href = `/group/specificGroup/content.html?groupId=${group.groupId}`;
                });

                groupCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title"><b>${group.groupName}</b></h5>
                        <p class="card-text"><strong>Module:</strong> ${group.module}</p>
                        <p class="card-text"><strong>Created by:</strong> ${creatorName}</p>
                    </div>
                `;

                col.appendChild(groupCard);
                row.appendChild(col);
            });

            joinedGroupsContainer.appendChild(row);
        } else {
            console.error('Failed to load joined groups');
        }
    } catch (error) {
        console.error('Error fetching joined groups:', error);
    }
}

document.getElementById('joinGroupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const inviteCode = document.getElementById('inviteCodeInput').value;
    const userId = userData.id;

    try {
        const response = await fetch('/group/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Fixed typo here
            },
            body: JSON.stringify({ inviteCode, userId }),
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            const joinGroupModal = bootstrap.Modal.getInstance(document.getElementById('joinGroupModal'));
            joinGroupModal.hide();
            loadJoinedGroups();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Error joining group');
    }
});
