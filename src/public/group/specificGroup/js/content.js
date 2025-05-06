const userData = JSON.parse(localStorage.getItem("userData"));

function getGroupIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("groupId");
}

async function loadGroupData() {
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    if (groupId) {
        try {
            const response = await fetch(`/group/specificGroup/${groupId}`);
            if (response.ok) {
                const group = await response.json();
                groupCreatorId = group.createdBy;

                document.title = `${group.groupName} - LearnLoop`;
                document.querySelector(".group-title").textContent = group.groupName;
                document.querySelector(".group-desc").textContent = group.groupDesc;
                document.querySelector(".group-module").textContent = group.module;
                document.querySelector(
                    ".group-creator"
                ).textContent = `Created by: ${group.creator.name}`;
            } else {
                alert("Failed to load group data.");
            }
        } catch (error) {
            console.error("Error fetching group data:", error);
        }
    } else {
        alert("Group ID not found in the URL.");
    }
}

async function loadPolls() {
    const groupId = getGroupIdFromUrl();
    const groupMemberId = userData.id;
    const role = localStorage.getItem("role");
    const sortBy = document.getElementById("sort-polls-dropdown").value;

    try {
        const response = await fetch(`/group/specificGroup/${groupId}/${groupMemberId}/polls?sortBy=${sortBy}`);
        if (response.ok) {
            const polls = await response.json();
            const pollList = document.getElementById("poll-list");
            pollList.innerHTML = ""; // Clear previous polls

            polls.forEach((poll) => {
                // Skip polls that are archived
                if (poll.status === "ARCHIVED") return;

                const userVote = poll.votes[0]; // User's vote if exists
                const winningOption =
                    poll.status === "CLOSED"
                        ? poll.options.reduce((maxOption, option) =>
                              (option._count.votes || 0) > (maxOption?._count.votes || 0)
                                  ? option
                                  : maxOption
                          )
                        : null;

                const isAdminOrModerator = role === "admin" || role === "moderator";

                const pollItem = document.createElement("div");
                pollItem.classList.add("card", "mb-3", "poll-card");

                pollItem.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>${poll.title}</h5>
                        <span class="badge ${poll.status === "ACTIVE" ? "bg-success" : poll.status === "PAUSED" ? "bg-warning" : "bg-secondary"}">
                            ${poll.status === "ACTIVE" ? "Active" : poll.status === "PAUSED" ? "Paused" : "Closed"}
                        </span>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${poll.description}</p>
                        <ul class="list-group mb-3">
                            ${poll.options
                                .sort((a, b) => a.optionId - b.optionId)
                                .map(
                                    (option) => ` 
                                    <li class="list-group-item">
                                        <label>
                                            <input type="radio" name="poll-${poll.pollId}" 
                                                value="${option.optionId}" 
                                                ${userVote?.optionId === option.optionId || poll.status !== "ACTIVE" ? "checked disabled" : poll.status === "PAUSED" ? "disabled" : ""}>
                                            ${option.text}
                                        </label>
                                    </li>`
                                )
                                .join("")}
                        </ul>
                        ${poll.status === "ACTIVE" 
                            ? userVote
                                ? `<p class="text-success">You have already voted: <strong>${userVote.pollOption.text}</strong></p>`
                                : `<button class="btn btn-primary submit-vote" data-poll-id="${poll.pollId}">Submit Vote</button>`
                            : poll.status === "PAUSED"
                                ? `<p class="text-warning">This poll is currently paused.</p>`
                                : winningOption
                                    ? `<p class="text-success">Poll Closed. <strong>${winningOption.text}</strong> won.</p>`
                                    : '<p class="text-danger">This poll is closed.</p>'
                        }
                        ${poll.status === "ACTIVE" && isAdminOrModerator
                            ? `<button class="btn btn-warning pause-poll" data-poll-id="${poll.pollId}">Pause Poll</button>`
                            : ""
                        }
                        ${poll.status === "PAUSED" && isAdminOrModerator
                            ? `<button class="btn btn-success resume-poll" data-poll-id="${poll.pollId}">Resume Poll</button>`
                            : ""
                        }
                    </div>
                `;

                pollList.appendChild(pollItem);
            });

            attachVoteHandlers();  // Attach vote handling
            attachPauseHandlers(); // Attach pause poll handling
            attachResumeHandlers(); // Attach resume poll handling for admins and moderators
        } else {
            alert("Failed to load polls.");
        }
    } catch (error) {
        console.error("Error loading polls:", error);
    }
}

function attachVoteHandlers() {
    document.querySelectorAll(".submit-vote").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const pollId = event.target.dataset.pollId;
            const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);

            if (!selectedOption) {
                alert("Please select an option before submitting your vote.");
                return;
            }

            const optionId = selectedOption.value;
            const groupMemberId = userData.id;

            try {
                const response = await fetch(`/group/specificGroup/${pollId}/castVote`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ pollId, optionId, groupMemberId })
                });

                if (response.ok) {
                    alert("Vote submitted successfully!");
                    loadPolls(); // Reload polls to reflect the updated vote
                } else {
                    alert("Failed to submit vote.");
                }
            } catch (error) {
                console.error("Error submitting vote:", error);
            }
        });
    });
}

function attachPauseHandlers() {
    document.querySelectorAll(".pause-poll").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const pollId = event.target.dataset.pollId;

            try {
                const response = await fetch(`/group/specificGroup/${pollId}/pausePoll`, {
                    method: "PUT"
                });

                if (response.ok) {
                    alert("Poll paused successfully!");
                    loadPolls(); // Reload polls to reflect the new status
                } else {
                    alert("Failed to pause poll.");
                }
            } catch (error) {
                console.error("Error pausing poll:", error);
            }
        });
    });
}

function attachResumeHandlers() {
    document.querySelectorAll(".resume-poll").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const pollId = event.target.dataset.pollId;

            try {
                const response = await fetch(`/group/specificGroup/${pollId}/resumePoll`, {
                    method: "PUT"
                });

                if (response.ok) {
                    alert("Poll resumed successfully!");
                    loadPolls(); // Reload polls to reflect the updated status
                } else {
                    alert("Failed to resume poll.");
                }
            } catch (error) {
                console.error("Error resuming poll:", error);
            }
        });
    });
}

// Ensure DOM elements are available before accessing them
document.addEventListener("DOMContentLoaded", () => {
    loadGroupData();
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    async function fetchMemberRole() {
        try {
            const response = await fetch(`/group/specificGroup/${groupId}/memberRole/${userId}`);
            if (response.ok) {
                const data = await response.json();
                const role = data.role;
                localStorage.setItem("role", role);
                if (role !== "admin" && role !== "moderator") {
                    const settingsTab = document.getElementById("settings-tab");
                    if (settingsTab) {
                        settingsTab.style.display = "none";
                    }
                } else if (role === "admin" || role === "moderator") {
                    document.getElementById("create-poll-btn").style.display = "block";
                    document.getElementById("poll-section").style.display = "block";
                    displayPollAnalysisButton();
                }
            } else {
                console.error("Error fetching member role:", response.statusText);
            }
        } catch (error) {
            console.error("Error during fetch operation:", error);
        }
    }

    function displayPollAnalysisButton() {
        // Create the button and append it to the poll section
        const pollSection = document.getElementById("poll-section");
        const button = document.createElement("button");
        button.id = "showPollAnalysisBtn";
        button.className = "btn btn-primary ms-2";
        button.textContent = "Show Poll Analysis";

        pollSection.appendChild(button);

        button.addEventListener("click", async () => {
            try {
                const response = await fetch(`/group/specificGroup/${groupId}/pollAnalytics`);
                if (response.ok) {
                    const analyticsData = await response.json();

                    if (analyticsData.message) {
                        
                        alert(analyticsData.message); 
                    } else {
                        console.log(analyticsData);
                        displayAnalytics(analyticsData);
                    }
                } else {
                    console.error("Error fetching poll analytics:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching poll analytics:", error);
            }
        });
    }

    function displayAnalytics(data) {
        const modalContent = document.getElementById("pollAnalyticsModalContent");
    
        modalContent.innerHTML = `
            <h4>Poll Analytics</h4>
            <p><strong>Total Votes:</strong> ${data.totalVotes}</p>
            <h5>Most Popular Poll</h5>
            <p>${data.mostPopularPoll.title} - (${data.mostPopularPoll.options[0].text}, ${data.mostPopularPoll.options[1].text}, ${data.mostPopularPoll.options[2].text}) - ${data.mostPopularPoll._count.votes} votes</p>
            <h5>Vote Distribution</h5>
            ${data.analytics
                .map(
                    (poll) => `
                <div>
                    <h6>${poll.title}</h6>
                    <ul>
                        ${poll.options
                            .map((option) => `<li>${option.text}: ${option._count.votes} votes</li>`)
                            .join("")}
                    </ul>
                </div>
            `
                )
                .join("")}
            
            <h5>Most Active Members</h5>
            <ul>
                ${data.mostActiveMembers
                    .map(
                        (member) => `
                    <li>
                        ${member.member.name} (${member.member.email}) - ${member.voteCount} votes
                    </li>
                `
                    )
                    .join("")}
            </ul>
        `;
    
        // Show the modal
        const pollAnalyticsModal = new bootstrap.Modal(document.getElementById("pollAnalyticsModal"));
        pollAnalyticsModal.show();
    }    

    fetchMemberRole();
    loadPolls();
    
    document.getElementById("sort-polls-dropdown").addEventListener("change", loadPolls);

    const createPollModal = new bootstrap.Modal(document.getElementById("createPollModal"));
    const createPollForm = document.getElementById("create-poll-form");

    createPollForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const createdBy = userData.id;
        const title = document.getElementById("poll-title").value;
        const description = document.getElementById("poll-description").value;
        const options = document
            .getElementById("poll-options")
            .value.split(",")
            .map((opt) => opt.trim());

        try {
            const response = await fetch(`/group/specificGroup/${groupId}/createPoll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ createdBy, title, description, options }),
            });

            if (response.ok) {
                alert("Poll created successfully.");
                loadPolls();
                createPollForm.reset();
                createPollModal.hide();
            } else {
                const errorData = await response.json();
                alert("Failed to create poll. Please try again.");
            }
        } catch (error) {
            console.error("Error creating poll:", error);
            alert("An error occurred while creating the poll.");
        }
    });
});