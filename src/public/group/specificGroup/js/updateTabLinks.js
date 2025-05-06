document.addEventListener("DOMContentLoaded", () => {
    const currentUrl = new URL(window.location.href);
    const groupId = currentUrl.searchParams.get("groupId");

    if (groupId) {
        document.getElementById("content-tab").href = `./content.html?groupId=${groupId}`;
        document.getElementById("people-tab").href = `./people.html?groupId=${groupId}`;
        document.getElementById("settings-tab").href = `./setting.html?groupId=${groupId}`;
        document.getElementById("chat-tab").href = `./chat.html?groupId=${groupId}`;
        document.getElementById("assignment-tab").href = `./assignment.html?groupId=${groupId}`;
    }
});
