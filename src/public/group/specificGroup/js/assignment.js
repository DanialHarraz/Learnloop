const userData = JSON.parse(localStorage.getItem("userData"));
let allSubmissions = [];

function getGroupIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("groupId");
}

async function loadGroupData() {
    const groupId = getGroupIdFromUrl();

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

async function fetchAssignments() {
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;
    const sortOrder = document.getElementById("sort-order-dropdown").value;

    try {
        const role = localStorage.getItem("role");
        const response = await fetch(
            `/group/specificGroup/assignment/${groupId}/user/${userId}?sortOrder=${sortOrder}`
        );
        if (response.ok) {
            const assignments = await response.json();
            console.log("assignments: ", assignments);
            displayAssignments(assignments, userId, role);
        } else {
            alert("Failed to fetch assignments.");
        }
    } catch (error) {
        console.error("Error fetching assignments:", error);
    }
}

function displayAssignments(assignments, userId, role) {
    const assignmentsContainer = document.getElementById("assignments-container");
    const sortOrderDropdownContainer = document.getElementById("sort-order-dropdown-container");
    assignmentsContainer.innerHTML = "";

    if (assignments.length === 0) {
        const noAssignmentsElement = document.createElement("div");
        noAssignmentsElement.classList.add("no-assignments");
        noAssignmentsElement.textContent = "No assignments yet. You can still enjoy the life!";
        assignmentsContainer.appendChild(noAssignmentsElement);

        if (sortOrderDropdownContainer) {
            sortOrderDropdownContainer.remove();
        }
    } else {
        if (sortOrderDropdownContainer) {
            sortOrderDropdownContainer.style.display = "flex";
        }

        assignments.forEach((assignment) => {
            console.log("assignment: ", assignment);
            const assignmentElement = document.createElement("div");
            assignmentElement.classList.add("card", "mb-3");
            
            const formattedDueDate = new Date(assignment.dueDate).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            });

            let content = `
                <div class="card-body">
                    <h5 class="card-title">${assignment.title}</h5>
                    <p class="card-text">${assignment.description}</p>
                    <p class="card-text"><small class="text-muted">Due: ${formattedDueDate}</small></p>
                    <p class="card-text"><small class="text-muted">Status: ${assignment.status}</small></p>
            `;

            if (role === 'admin') {
                if (assignment.status === 'CLOSED') {
                    content += `
                        <button class="btn btn-secondary" onclick="viewSubmissions('${assignment.id}')">View Submissions</button>
                        <button class="btn btn-info" onclick="viewAssignmentAnalysis('${assignment.id}')">View Analysis</button>
                    `;
                }
            } else {
                let submitButton = '';
                if (assignment.submissions.length > 0) {
                    submitButton = `<p class="text-success">You have already submitted this assignment.</p>`;
                    submitButton += `<button class="btn btn-primary" onclick="openSubmitModal('${assignment.id}')">Update Submission</button>`;
                } else {
                    submitButton = `<button class="btn btn-primary" onclick="openSubmitModal('${assignment.id}')">Submit</button>`;
                }
                content += submitButton;
            }

            content += `</div>`;
            assignmentElement.innerHTML = content;
            assignmentsContainer.appendChild(assignmentElement);
        });
    }
}

async function fetchAssignmentStats() {
    const groupId = getGroupIdFromUrl();
    try {
        const response = await fetch(
            `/group/specificGroup/assignment/${groupId}/statistics`
        );
        if (response.ok) {
            const stats = await response.json();
            console.log("stats: ", stats);
            displayAssignmentStats(stats);
        } else {
            alert("Failed to fetch assignments statistics.");
        }
    } catch (error) {
        console.error("Error fetching assignments statistics:", error);
    }
}

function displayAssignmentStats(stats) {
    const statsContainer = document.createElement("div");
    statsContainer.classList.add("assignment-stats");

    const statusDistributionString = Object.entries(stats.statusDistribution)
        .map(([status, count]) => `${status}: ${count}`)
        .join(", ");

    const mostActiveAssignmentsList = stats.mostActiveAssignments
        .map((assignment) => `<li>${assignment.title}: ${assignment.submissions} submissions</li>`)
        .join("");

    statsContainer.innerHTML = `
        <h3>Assignment Statistics</h3>
        <p>Total Assignments: ${stats.totalAssignments}</p>
        <p>Total Students: ${stats.totalStudents - 1}</p>
        <h4>Status Distribution:</h4>
        
        <p>${statusDistributionString}</p>
        <h4>Engagement Metrics <span style="font-size: 0.9em; color: gray;">(Based on CLOSED & ARCHIVED assignments)</span></h4>
        <p><strong>Average Submissions per Assignment:</strong> ${stats.avgSubmissionsPerAssignment}</p>
        <p><strong>Percentage of Fully Submitted Assignments:</strong> ${stats.fullySubmittedPercentage}</p>
        <p><strong>Assignments with No Submissions:</strong> ${stats.noSubmissionAssignments}</p>
        <h4>Most Active Assignments:</h4>
        <ul>
            ${mostActiveAssignmentsList}
        </ul>
    `;

    const statsElement = document.getElementById("assignment-statistics");
    statsElement.innerHTML = ''; 
    statsElement.appendChild(statsContainer);
}

async function viewAssignmentAnalysis(assignmentId) {
    try {
        const response = await fetch(`/group/specificGroup/assignment/${assignmentId}/analysis`);
        if (response.ok) {
            const analysis = await response.json();
            console.log("analysis: ", analysis);    
            displayAssignmentAnalysis(analysis);
        } else {
            alert('Failed to fetch assignment analysis.');
        }
    } catch (error) {
        console.error('Error fetching assignment analysis:', error);
    }
}

function displayAssignmentAnalysis(analysis) {
    const analysisModalBody = document.getElementById("analysis-modal-body");
    analysisModalBody.innerHTML = `
        <h4>Assignment Analysis</h4>
        <p><strong>Total Submissions:</strong> ${analysis.totalSubmissions}</p>
        <p><strong>Late Submissions:</strong> ${analysis.lateSubmissions}</p>
        <p><strong>On-Time Submission Rate:</strong> ${analysis.onTimeSubmissionRate}%</p>
        <p><strong>Participation Rate:</strong> ${analysis.participationRate}%</p>
        <p><strong>Percentage of Missing Assignments:</strong> ${analysis.missingAssignmentPercentage}%</p>
        <p><strong>Average Submission Time (hours before/after due date):</strong> ${analysis.avgSubmissionTime}</p>
        <p><strong>Earliest Submission:</strong> ${analysis.earliestSubmission}</p>
        <p><strong>Latest Submission:</strong> ${analysis.latestSubmission}</p>
        <p><strong>Peak Submission Hour:</strong> ${analysis.peakSubmissionHour}:00</p>
        <h5>Members Who Did Not Submit:</h5>
        <ul>
            ${analysis.membersWhoDidNotSubmit.length > 0 
                ? analysis.membersWhoDidNotSubmit.map(name => `<li>${name}</li>`).join('') 
                : "<li>All members submitted.</li>"}
        </ul>
    `;

    const analysisModal = new bootstrap.Modal(document.getElementById("analysisModal"));
    analysisModal.show();
}

async function viewSubmissions(assignmentId) {
    try {
        const response = await fetch(`/group/specificGroup/assignment/${assignmentId}/submissions`);
        if (response.ok) {
            const submissions = await response.json();
            allSubmissions = submissions;
            populateDropdown(submissions);
            displaySubmissions(submissions);
        } else {
            alert('Failed to fetch submissions.');
        }
    } catch (error) {
        console.error('Error fetching submissions:', error);
    }
}

function populateDropdown(submissions) {
    const dropdown = document.getElementById("submitter-dropdown");
    const submitterNames = [...new Set(submissions.map(sub => sub.submitter.name))];

    submitterNames.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
}

function displaySubmissions(submissions) {
    document.getElementById('submissions-list').style.display = 'block';
    const submissionsContainer = document.getElementById("submissions-container");
    submissionsContainer.innerHTML = "";

    if (submissions.length === 0) {
        submissionsContainer.innerHTML = "<p>No submissions found.</p>";
    } else {
        submissions.forEach(submission => {
            console.log("submission: ", submission);
            const card = document.createElement("div");
            card.classList.add("card", "mb-3");

            const cardBody = document.createElement("div");
            cardBody.classList.add("card-body");

            const fileName = submission.fileSubmitted.split('\\').pop();
            const fileType = fileName.split('.').pop();

            cardBody.innerHTML = `
                <h5 class="card-title">Submitted by: ${submission.submitter.name}</h5>
                <p class="card-text"><strong>Submitted on:</strong> ${new Date(submission.submittedAt).toLocaleString()} ( <strong>${submission.status}</strong> )</p>
                <p class="card-text">
                    <strong>File:</strong> ${fileName} (${fileType.toUpperCase()})
                    <a href="/group/specificGroup/assignment/download/${submission.id}" target="_blank" class="btn btn-primary">Download</a>
                </p>
            `;

            card.appendChild(cardBody);
            submissionsContainer.appendChild(card);
        });
    }
}

function filterSubmissionsByDropdown() {
    const selectedSubmitter = document.getElementById("submitter-dropdown").value;
    const filteredSubmissions = selectedSubmitter
        ? allSubmissions.filter(submission => submission.submitter.name === selectedSubmitter)
        : allSubmissions;
    displaySubmissions(filteredSubmissions);
}

function openSubmitModal(assignmentId) {
    document.getElementById("assignment-id").value = assignmentId;
    const submitModal = new bootstrap.Modal(
        document.getElementById("submit-assignment-modal")
    );
    submitModal.show();
}

document.addEventListener("DOMContentLoaded", () => {
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    loadGroupData();
    fetchAssignments();
    fetchAssignmentStats();
    fetchMemberRole();

    const showStatsButton = document.getElementById("show-stats-button");
    if (showStatsButton) {
        showStatsButton.addEventListener("click", async () => {
            await fetchAssignmentStats();
            const statsModal = new bootstrap.Modal(document.getElementById("statsModal"));
            statsModal.show();
            document.querySelector('#statsModal .btn-close').addEventListener('click', () => {
                statsModal.hide();
                document.querySelector('.modal-backdrop').remove();
            });
        
            document.querySelector('#statsModal .btn-secondary').addEventListener('click', () => {
                statsModal.hide();
                document.querySelector('.modal-backdrop').remove();
            });
        });
    }

    async function fetchMemberRole() {
        try {
            const response = await fetch(
                `/group/specificGroup/${groupId}/memberRole/${userId}`
            );
            if (response.ok) {
                const data = await response.json();
                const role = data.role;
                localStorage.setItem("role", role);

                if (role !== "admin" && role !== "moderator") {
                    const settingsTab = document.getElementById("settings-tab");
                    if (settingsTab) {
                        settingsTab.style.display = "none";
                    }
                }
                if (role !== "admin") {
                    const createAssignmentBtn = document.getElementById("create-assignment-btn");
                    if (createAssignmentBtn) {
                        createAssignmentBtn.style.display = "none";
                    }
                    const showStatsButton = document.getElementById("show-stats-button");
                    if (showStatsButton) {
                        showStatsButton.style.display = "none";
                    }
                } else {
                    const createAssignmentBtn = document.getElementById("create-assignment-btn");
                    if (createAssignmentBtn) {
                        createAssignmentBtn.style.display = "block";
                    }
                    const showStatsButton = document.getElementById("show-stats-button");
                    if (showStatsButton) {
                        showStatsButton.style.display = "block";
                    }
                }
            } else {
                console.error("Error fetching member role:", response.statusText);
            }
        } catch (error) {
            console.error("Error during fetch operation:", error);
        }
    }

    document
        .getElementById("submit-create-assignment-modal")
        .addEventListener("click", async (event) => {
            event.preventDefault();
            await createAssignment();
        });

    document
        .getElementById("submit-assignment-form")
        .addEventListener("submit", async function (event) {
            event.preventDefault();
            await submitAssignment();
        });
});

async function createAssignment() {
    const title = document.getElementById("assignment-title").value;
    const description = document.getElementById("assignment-description").value;
    const dueDate = document.getElementById("assignment-due-date").value;
    const groupId = getGroupIdFromUrl();
    const createdBy = userData.id;

    try {
        const response = await fetch(`/group/specificGroup/assignment/${groupId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ groupId, createdBy, title, description, dueDate }),
        });
        if (response.ok) {
            alert("Assignment created successfully!");
            const submitCreateModal = bootstrap.Modal.getInstance(
                document.getElementById("create-assignment-modal")
            );
            submitCreateModal.hide();
            window.location.reload();
            await fetchAssignments();
        } else {
            alert("Failed to create assignment.");
        }
    } catch (error) {
        console.error("Error creating assignment:", error);
    }
}

async function submitAssignment() {
    const assignmentId = document.getElementById("assignment-id").value;
    const fileInput = document.getElementById("submit-assignment-files");
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    if (fileInput.files.length === 0) {
        alert("Please upload a file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("userId", userId);

    try {
        const response = await fetch(
            `/group/specificGroup/assignment/${groupId}/submit/${assignmentId}`,
            {
                method: "POST",
                body: formData,
            }
        );
        if (response.ok) {
            alert("Assignment submitted successfully!");
            await fetchAssignments();
            const submitModal = bootstrap.Modal.getInstance(
                document.getElementById("submit-assignment-modal")
            );
            submitModal.hide();
        } else {
            alert("Failed to submit assignment.");
        }
    } catch (error) {
        console.error("Error submitting assignment:", error);
    }
}