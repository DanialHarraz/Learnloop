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

                if (userId === groupCreatorId) {
                    // User is the creator, show edit form and delete button
                    populateEditForm(group);
                    document.getElementById("edit-group-form").style.display = "block";
                    document.getElementById("delete-group-btn").style.display = "block";
                    document.getElementById("settings-tab").style.display = "block";
                } else {
                    // User is not the creator, hide delete button and settings tab
                    document.getElementById("delete-group-btn").style.display = "none";
                    document.getElementById("settings-tab").style.display = "none";
                }
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

function populateEditForm(group) {
    document.getElementById("groupName").value = group.groupName;
    document.getElementById("groupDesc").value = group.groupDesc;
    document.getElementById("module").value = group.module;
}

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
            } else {
                console.error("Error fetching member role:", response.statusText);
            }
        } catch (error) {
            console.error("Error during fetch operation:", error);
        }
    }

    fetchMemberRole();

    const editGroupForm = document.getElementById("edit-group-form");
    if (editGroupForm) {
        editGroupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const groupId = getGroupIdFromUrl();
            const userId = userData.id;
            const updatedData = {
                groupName: document.getElementById("groupName").value,
                groupDesc: document.getElementById("groupDesc").value,
                module: document.getElementById("module").value,
                userId: userId,
            };

            try {
                const response = await fetch(`/group/specificGroup/${groupId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedData),
                });

                if (response.ok) {
                    alert("Group information updated successfully.");
                    loadGroupData(); // Refresh the page data
                } else {
                    alert("Failed to update group information.");
                }
            } catch (error) {
                console.error("Error updating group information:", error);
            }
        });
    } else {
        console.warn("Element with ID 'edit-group-form' not found.");
    }

    const deleteGroupButton = document.getElementById("delete-group-btn");
    if (deleteGroupButton) {
        deleteGroupButton.addEventListener("click", async () => {
            const groupId = getGroupIdFromUrl();
            const userId = userData.id;

            const confirmation = confirm(
                "Are you sure you want to delete this group?"
            );
            if (confirmation) {
                try {
                    const response = await fetch(`/group/specificGroup/${groupId}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ userId: userId }),
                    });

                    if (response.ok) {
                        alert("Group deleted successfully.");
                        window.location.href = "/group/group.html"; // Redirect to the groups page after deletion
                    } else {
                        alert("Failed to delete group.");
                    }
                } catch (error) {
                    console.error("Error deleting group:", error);
                }
            }
        });
    }
});