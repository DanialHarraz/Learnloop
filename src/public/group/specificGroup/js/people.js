const userData = JSON.parse(localStorage.getItem("userData"));
let groupCreatorId = null;

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
                groupCreatorId = group.createdBy; // Set before calling members

                document.title = `${group.groupName} - LearnLoop`;
                document.querySelector(".group-title").textContent = group.groupName;
                document.querySelector(".group-desc").textContent = group.groupDesc;
                document.querySelector(".group-module").textContent = group.module;
                document.querySelector(
                    ".group-creator"
                ).textContent = `Created by: ${group.creator.name}`;

                loadGroupMembers(); // Call members after creator ID is set
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


async function loadGroupMembers() {
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    if (groupId) {
        try {
            const response = await fetch(`/group/specificGroup/${groupId}/members`);
            if (response.ok) {
                const members = await response.json();
                console.log("members: ", members);
                const groupMembersContainer = document.getElementById("group-members");
                groupMembersContainer.innerHTML = ""; // Clear previous content
                let userRole = null;

                members.forEach((member) => {
                    if (member.userId == userId) {
                        userRole = member.role;
                    }
                    const memberItem = document.createElement("div");
                    memberItem.classList.add("list-group-item");
                    memberItem.innerHTML = `
                        <img src="${member.member.avatar}" alt="${member.member.name}'s Avatar" class="avatar">
                        <span class="member-name">${member.member.name}</span>
                        <span class="member-role">${member.role}</span>
                        ${userId === groupCreatorId &&
                            member.role !== "moderator" &&
                            member.role !== "admin"
                            ? `<button class="make-moderator-btn btn btn-sm btn-outline-primary" data-user-id="${member.userId}">Make Moderator</button>`
                            : ""
                        }
                        ${userId === groupCreatorId && member.role !== "admin"
                            ? `<button class="kick-member-btn btn btn-sm btn-outline-danger" data-user-id="${member.userId}" data-user-name="${member.member.name}">Kick</button>`
                            : ""
                        }
                    `;
                    groupMembersContainer.appendChild(memberItem);
                });

                document.querySelectorAll(".make-moderator-btn").forEach((button) => {
                    button.addEventListener("click", async (event) => {
                        const userIdToMakeModerator = button.getAttribute("data-user-id");
                        try {
                            const response = await fetch(
                                `/group/specificGroup/${groupId}/makeModerator`,
                                {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        memberId: userIdToMakeModerator,
                                        userId: userId,
                                    }),
                                }
                            );
                            if (response.ok) {
                                alert("User has been promoted to moderator");
                                loadGroupMembers(); // Reload to show updated roles
                            } else {
                                alert("Failed to make user a moderator.");
                            }
                        } catch (error) {
                            console.error("Error making user a moderator:", error);
                        }
                    });
                });
                document.querySelectorAll(".kick-member-btn").forEach((button) => {
                    button.addEventListener("click", async () => {
                        const userIdToKick = button.getAttribute("data-user-id");
                        const userNameToKick = button.getAttribute("data-user-name");
                        console.log(userNameToKick);
                        const confirmation = confirm(
                            `Are you sure you want to remove ${userNameToKick} from the group?`
                        );

                        if (confirmation) {
                            try {
                                const response = await fetch(
                                    `/group/specificGroup/${groupId}/kickMember`,
                                    {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            memberId: userIdToKick,
                                            userId: userId,
                                        }),
                                    }
                                );

                                if (response.ok) {
                                    alert("Member removed from the group.");
                                    loadGroupMembers(); // Refresh the member list
                                } else {
                                    alert("Failed to remove member from the group.");
                                }
                            } catch (error) {
                                console.error("Error removing member:", error);
                            }
                        }
                    });
                });
            } else {
                alert("Failed to load group members.");
            }
        } catch (error) {
            console.error("Error fetching group members:", error);
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
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
                }
            } else {
                console.error("Error fetching member role:", response.statusText);
            }
        } catch (error) {
            console.error("Error during fetch operation:", error);
        }
    }   
     
    await loadGroupData();
    await fetchMemberRole();
    loadGroupMembers();
});