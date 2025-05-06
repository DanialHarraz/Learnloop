const userId = localStorage.getItem('userId');
console.log(userId);

document.addEventListener('DOMContentLoaded', () => {
    const forumList = document.getElementById('forumList');
    const archiveButton = document.getElementById('viewArchivedBtn');
    let showArchived = false;
    let allForums = [];
    const modal = document.getElementById('createForumModal');
    const openModalBtn = document.getElementById('openCreateForumModal');
    const closeModalBtn = document.querySelector('.close');
    const createForumBtn = document.getElementById('createForumBtn');

    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    createForumBtn.addEventListener('click', async () => {
        const forumName = document.getElementById('forumName').value.trim();
        const forumTopic = document.getElementById('forumTopic').value.trim();

        if (!forumName || !forumTopic) {
            alert('Please enter both forum name and topic.');
            return;
        }

        try {
            const response = await fetch('/forum/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forumName, forumTopic })
            });

            if (response.ok) {
                alert('Forum created successfully!');
                modal.style.display = 'none';
                document.getElementById('forumName').value = '';
                document.getElementById('forumTopic').value = '';
                await loadForums(); // Reload the forum list
            } else {
                alert('Failed to create forum.');
            }
        } catch (error) {
            console.error('Error creating forum:', error);
        }
    });

    // Add click handler to the existing button
    archiveButton.addEventListener('click', () => {
        showArchived = !showArchived;
        archiveButton.textContent = showArchived ? 'View Active Forums' : 'View Archived Forums';
        renderForums(allForums);
    });

    async function loadForums() {
        try {
            const response = await fetch('/forum/all', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                allForums = await response.json();
                renderForums(allForums);
                console.log(allForums);
            } else {
                console.error('Failed to fetch forums');
            }
        } catch (error) {
            console.error('Error fetching forums:', error);
        }
    }

    async function toggleForumStatus(forumId, newStatus) {
        try {
            const response = await fetch(`/forum/status/${forumId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                await loadForums();
            } else {
                console.error('Failed to update forum status');
            }
        } catch (error) {
            console.error('Error updating forum status:', error);
        }
    }

    function renderForums(forums) {
        // Filter forums based on showArchived flag
        const filteredForums = forums.filter(forum => 
            showArchived ? 
            forum.status === 'archived' : 
            forum.status === 'open' || forum.status === 'closed'
        );

        forumList.innerHTML = filteredForums
            .map(forum => {
                if (forum.status === 'archived') {
                    return `
                        <ul class="forum-card forum-archived" data-forum-id="${forum.forumId}" data-status="${forum.status}">
                            <div class="card-content">
                                <h3 class="forum-title">${forum.forumName}</h3>
                                <p class="forum-topic">${forum.forumTopic || 'No topic available'}</p>
                                
                                <div class="forum-status-controls">
                                    <button class="btn-restore-forum" data-forum-id="${forum.forumId}">
                                        Restore Forum
                                    </button>
                                </div>
                                
                                <p class="archived-label">This forum is archived</p>
                            </div>
                        </ul>
                    `;
                } else {
                    return `
                        <ul class="forum-card ${forum.status === 'closed' ? 'forum-closed' : ''}" 
                            data-forum-id="${forum.forumId}" 
                            data-status="${forum.status}">
                            <div class="card-content">
                                <h3 class="forum-title">${forum.forumName}</h3>
                                <p class="forum-topic">${forum.forumTopic || 'No topic available'}</p>
                                
                                <div class="forum-status-controls">
                                    <button class="btn-open-forum" data-forum-id="${forum.forumId}" ${forum.status === 'open' ? 'disabled' : ''}>
                                        Open Forum
                                    </button>
                                    <button class="btn-close-forum" data-forum-id="${forum.forumId}" ${forum.status === 'closed' ? 'disabled' : ''}>
                                        Close Forum
                                    </button>
                                </div>
                                
                                ${forum.status === 'closed' ? '<p class="closed-label">This forum is closed</p>' : ''}
                            </div>
                        </ul>
                    `;
                }
            })
            .join('');

        attachCardEventListeners();
    }

    function attachCardEventListeners() {
    document.querySelectorAll('.btn-open-forum, .btn-close-forum, .btn-restore-forum, .forum-card')
        .forEach(button => {
            button.replaceWith(button.cloneNode(true)); // Remove old listeners
        });

    document.querySelectorAll('.btn-open-forum').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const forumId = button.dataset.forumId;
            toggleForumStatus(forumId, 'open');
        });
    });

    document.querySelectorAll('.btn-close-forum').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const forumId = button.dataset.forumId;
            toggleForumStatus(forumId, 'closed');
        });
    });

    document.querySelectorAll('.btn-restore-forum').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const forumId = button.dataset.forumId;
            toggleForumStatus(forumId, 'open');
        });
    });

    document.querySelectorAll('.forum-card').forEach(card => {
        card.addEventListener('click', () => {
            const forumId = card.dataset.forumId;
            const status = card.dataset.status;
            if (status === 'open') {
                window.location.href = `forum.html?forumId=${forumId}`;
            } else {
                alert('This forum is currently closed or archived.');
            }
        });
    });
}


    // Load forums when the page loads
    loadForums();
});