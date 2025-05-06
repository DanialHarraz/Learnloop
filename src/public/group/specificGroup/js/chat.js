const userData = JSON.parse(localStorage.getItem("userData"));

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

function initializeSocket() {
    const socket = io();
    const groupId = getGroupIdFromUrl();
    const userId = userData.id; // Get userId from userData

    // Emit joinGroup with both groupId and userId
    socket.emit("joinGroup", groupId, userId);

    socket.on("newMessage", (message) => {
        displayMessages([message], true);
        socket.emit("updateMessageStatus", { messageId: message.messageId, status: "DELIVERED" });
    });

    return socket;
}

async function loadChatMessages() {
    const groupId = getGroupIdFromUrl();
  
    if (groupId) {
      try {
        const response = await fetch(`/group/specificGroup/chat/${groupId}`);
        if (response.ok) {
          const messages = await response.json();
          displayMessages(messages);
  
          const unseenMessages = messages.filter(
            (m) => m.status !== "SEEN" && m.userId !== userData.id
          );
          if (unseenMessages.length > 0) {
            socket.emit("updateSeenStatus", { groupId, userId: userData.id });
          }
        } else {
          alert("Failed to load chat messages.");
        }
      } catch (error) {
        console.error("Error fetching chat messages:", error);
      }
    } else {
      alert("Group ID not found in the URL.");
    }
  }

function displayMessages(messages, append = false) {
    const chatContainer = document.getElementById("chat-messages");
    if (!append) chatContainer.innerHTML = "";

    messages.forEach((message) => {
        const messageElement = document.createElement("div");
        const isUserMessage = message.userId === userData.id;
        const messageClass = isUserMessage ? "user-message" : "other-message";

        messageElement.classList.add("chat-message-container");
        messageElement.innerHTML = `
            <div class="chat-message ${messageClass}">
                <div class="chat-message-header">
                    <span class="chat-user">${message.sender.name}</span>
                    <span class="chat-time">${new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="chat-message-content">${message.content}</div>
            </div>
            ${isUserMessage ? `<div class="chat-status">${message.status}</div>` : ''}
        `;

        chatContainer.appendChild(messageElement);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const groupId = getGroupIdFromUrl();
    const userId = userData.id;

    loadGroupData();
    loadChatMessages();
    fetchMemberRole();

    const socket = initializeSocket();

    // Emit 'markAsSeen' when user visits chat page
    socket.emit("markAsSeen", { groupId, userId });

    socket.on("updateMessageStatus", ({ groupId, status }) => {
        console.log(`Messages in group ${groupId} updated to ${status}`);
        loadChatMessages(); // Reload chat messages to reflect status changes
      });

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

    const chatForm = document.getElementById("send-message-form");
    if (chatForm) {
        chatForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent form from submitting and reloading the page

            const messageInput = document.getElementById("message-content");
            const content = messageInput.value.trim();

            if (content) {
                try {
                    socket.emit("sendMessage", { groupId, userId, content });
                    messageInput.value = "";
                } catch (error) {
                    console.error("Error sending message via WebSocket:", error);
                }
            }
        });
    } else {
        console.warn("Element with ID 'send-message-form' not found.");
    }
});