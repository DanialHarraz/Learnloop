const userData = JSON.parse(localStorage.getItem("userData"));
const userId = userData.id;
const authorId = userId;
const urlParams = new URLSearchParams(window.location.search);
const forumId = Number(urlParams.get("forumId"));
const darkModeToggle = document.getElementById("darkModeToggle");
const darkModeIcon = document.getElementById("darkModeIcon");
const notificationList = document.getElementById("notification-list");
console.log("user ID: ", userId);
console.log("Forum ID: ", forumId);

// Check for saved dark mode preference in localStorage
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  applyDarkModeToElements(); // Apply dark mode to all elements
}

// Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  const darkModeIcon = document.getElementById("darkModeIcon");

  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "disabled");
    darkModeIcon.textContent = "☀️"; // Moon icon for light mode
  } else {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "enabled");
    darkModeIcon.textContent = "🌙"; // Sun icon for dark mode
  }

  applyDarkModeToElements(); // Reapply dark mode styles
});

function applyDarkModeToElements() {
  const darkModeCards = document.querySelectorAll(".dark-mode-card");
  const modal = document.querySelector(".modal-content");
  const postList = document.getElementById("postList");

  // Apply dark mode to cards
  darkModeCards.forEach((card) => {
    card.classList.toggle(
      "dark-mode",
      document.body.classList.contains("dark-mode")
    );
  });

  // Apply dark mode to modal
  if (modal) {
    modal.classList.toggle(
      "dark-mode",
      document.body.classList.contains("dark-mode")
    );
  }

  // Apply dark mode to post list
  if (postList) {
    postList.classList.toggle(
      "dark-mode",
      document.body.classList.contains("dark-mode")
    );
  }
}

let allPosts = []; // Store all posts globally
let currentSearchTerm = "";
// Define functions in global scope (window object)
function renderPosts(posts) {
  const postList = document.getElementById("postList");
  postList.innerHTML = posts
    .map((post) => {
      const createdAtDate = new Date(post.createdAt).toLocaleDateString();
      const totalVotes = post.votes.reduce(
        (total, vote) => total + vote.value,
        0
      );

      const highlightedTitle = highlightText(post.title, currentSearchTerm);
      const highlightedContent = highlightText(post.content, currentSearchTerm);

      return `
                <ul data-post-id="${post.postId}" class="post-card">
                    <div class="card mb-4 dark-mode-card">
                        <div class="card-body">
                            <h5 class="card-title">${highlightedTitle}</h5>
                            <p class="card-text">${highlightedContent}</p>
                            <small class="text-muted">Post ID: ${post.postId}, Created At: ${createdAtDate}</small>
                        </div>
                        <div class="card-footer">
                            <div id="vote-section-${post.postId}" class="d-flex justify-content-between align-items-center">
                                <div>
                                    <button class="upvote-btn" data-post-id="${post.postId}">
                                        <i class="fas fa-arrow-up"></i>
                                    </button>
                                    <button class="downvote-btn" data-post-id="${post.postId}">
                                        <i class="fas fa-arrow-down"></i>
                                    </button>
                                </div>
                                <span id="vote-count-${post.postId}">Cred: ${totalVotes}</span>
                            </div>
                        </div>
                         <div class="card-footer">
                             <button class="btn btn-link show-comments-btn" 
                                    onclick="toggleComments(${post.postId})" 
                                    data-post-id="${post.postId}">
                                Show Comments
                            </button>
                            <div class="comments-list" id="comments-${post.postId}" style="display: none;">
                                <!-- Comments will be loaded here -->
                            </div>
                            <form class="comment-form" id="comment-form-${post.postId}" onsubmit="postComment(event)">
                                <textarea class="form-control" id="comment-content-${post.postId}" 
                                    rows="2" placeholder="Write a comment" required></textarea>
                                <button type="submit" class="btn btn-primary mt-2" 
                                    data-post-id="${post.postId}">Comment</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
    })
    .join("");
  attachVoteEventListeners();
}

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

async function fetchPosts() {
  try {
    const response = await fetch(`/forum/${forumId}/post`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const posts = await response.json();
    allPosts = posts; // Store posts globally
    renderPosts(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
}

function filterPosts(searchTerm) {
  currentSearchTerm = searchTerm; // Update current search term
  const filteredPosts = allPosts.filter((post) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.content.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });
  renderPosts(filteredPosts);
}

// Event listener for search bar input
document.getElementById("searchBar").addEventListener("input", (event) => {
  const searchTerm = event.target.value;
  filterPosts(searchTerm);
});

// Initial fetch of posts
fetchPosts();

window.applyFilter = function () {
  const filterDropdown = document.getElementById("filterDropdown");
  const selectedFilter = filterDropdown.value;
  console.log("Selected filter:", selectedFilter);

  let filteredPosts = [...allPosts];
  console.log("Posts before filtering:", filteredPosts);

  switch (selectedFilter) {
    case "newest":
      filteredPosts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      break;
    case "oldest":
      filteredPosts.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      break;
    case "highestVotes":
      filteredPosts.sort((a, b) => {
        const votesA = a.votes.reduce((total, vote) => total + vote.value, 0);
        const votesB = b.votes.reduce((total, vote) => total + vote.value, 0);
        return votesB - votesA;
      });
      break;
    case "lowestVotes":
      filteredPosts.sort((a, b) => {
        const votesA = a.votes.reduce((total, vote) => total + vote.value, 0);
        const votesB = b.votes.reduce((total, vote) => total + vote.value, 0);
        return votesA - votesB;
      });
      break;
  }

  console.log("Posts after filtering:", filteredPosts);
  renderPosts(filteredPosts);
};

function attachVoteEventListeners() {
  document.querySelectorAll(".upvote-btn, .downvote-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const postElement = event.target.closest("ul[data-post-id]");
      if (!postElement) {
        console.error("Post element not found");
        return;
      }

      const postId = parseInt(postElement.dataset.postId, 10);
      const isUpvote = button.classList.contains("upvote-btn");
      const voteValue = isUpvote ? 1 : -1;

      // Log the vote value for debugging
      console.log(`Vote Value: ${voteValue}`);
      console.log(`Type of Vote Value: ${typeof voteValue}`);

      // Find the vote count element in the UI
      const voteCountSpan = document.getElementById(`vote-count-${postId}`);

      // Debugging: Check if the voteCountSpan is being selected correctly
      console.log(`Post ID: ${postId}`);
      console.log(`Vote Count Span:`, voteCountSpan);

      const requestBody = { userId, value: voteValue };
      console.log("Request Body:", requestBody);

      try {
        const response = await fetch(`/forum/${forumId}/post/${postId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log("Response Status:", response.status);
        const data = await response.json();
        console.log("Response Data:", data);

        if (response.ok) {
          // Update the UI with the new vote count after the response is received
          if (voteCountSpan) {
            voteCountSpan.textContent = `Cred: ${data.voteCount}`;
          }
        } else {
          alert(`Error voting: ${data.error}`);
        }
      } catch (error) {
        console.error("Error during voting:", error);
      }
    });
  });
}

async function postComment(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector('button[type="submit"]');
  const postId = parseInt(submitButton.getAttribute("data-post-id"), 10); // Convert to integer
  const content = document.getElementById(`comment-content-${postId}`).value;

  try {
    const response = await fetch(`/forum/${forumId}/post/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content,
        postId: postId, // Make sure to send postId
        userId: userId, // This should be defined globally from your userData
      }),
    });

    if (response.ok) {
      // Clear the form
      document.getElementById(`comment-content-${postId}`).value = "";
      // Reload comments to show the new comment
      loadComments(postId);
    } else {
      const errorData = await response.json();
      alert(`Error posting comment: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Error posting comment:", error);
  }
}

function toggleComments(postId) {
  // Convert postId to an integer when toggling the comments
  const postIdInt = parseInt(postId, 10); // Convert to integer

  // Check if postId is a valid number
  if (isNaN(postIdInt)) {
    console.error("Invalid postId");
    return;
  }

  const commentsSection = document.getElementById(`comments-${postIdInt}`);
  const button = document.querySelector(
    `button[data-post-id="${postIdInt}"].show-comments-btn`
  );

  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
    button.textContent = "Hide Comments";
    loadComments(postIdInt); // Pass the integer postId to loadComments
  } else {
    commentsSection.style.display = "none";
    button.textContent = "Show Comments";
  }
}

function renderCommentsAndReplies(comments, postId) {
  const commentsList = document.getElementById(`comments-${postId}`);
  if (!commentsList) {
    console.error(`Comments list not found for post ID: ${postId}`);
    return;
  }
  commentsList.innerHTML = ""; // Clear existing comments/replies
  comments.forEach((comment) => {
    renderComment(comment, postId, commentsList);
  });
}
function renderComment(comment, postId, commentsList) {
  console.log(
    `Rendering comment ID: ${comment.id}, Parent ID: ${comment.parentId}`
  );
  const commentElement = document.createElement("li");
  commentElement.classList.add("list-group-item");
  commentElement.id = `comment-${comment.id}`;
  const commentDate = new Date(comment.createdAt).toLocaleDateString();
  commentElement.innerHTML = `
      <div class="comment-content">
          <div class="text">
              <strong>${comment.user.name}</strong> - ${commentDate}
              <p>${comment.content}</p>
          </div>
          ${
            comment.userId === userId
              ? `<i class="fas fa-trash-alt text-danger delete-icon" data-comment-id="${comment.id}" title="Delete"></i>`
              : ""
          }
      </div>
      <ul class="replies list-group" id="replies-${
        comment.id
      }" data-post-id="${postId}"></ul>
  `;

  // Append to the correct parent element
  if (comment.parentId === null) {
    commentsList.appendChild(commentElement);
  } else {
    const parentRepliesList = document.getElementById(
      `replies-${comment.parentId}`
    );
    if (parentRepliesList) {
      // Check if the comment is already rendered
      const existingComment = parentRepliesList.querySelector(
        `#comment-${comment.id}`
      );
      if (!existingComment) {
        parentRepliesList.appendChild(commentElement);
      }
    }
  }

  // Add reply button and form
  const replyButton = createReplyButton(comment.id);
  const replyForm = createReplyForm(comment.id);
  commentElement.appendChild(replyButton);
  commentElement.appendChild(replyForm);

  // Add event listener to the delete icon for comments
  const deleteIcon = commentElement.querySelector(".delete-icon");
  if (deleteIcon) {
    deleteIcon.addEventListener("click", async () => {
      const commentId = parseInt(
        deleteIcon.getAttribute("data-comment-id"),
        10
      );
      console.log("Delete button clicked for comment ID:", commentId);
      if (commentId && postId) {
        try {
          await deleteComment(commentId, postId);
        } catch (error) {
          console.error("Error in delete event handler:", error);
        }
      }
    });
  }

  // Add event listener to the reply button
  replyButton.addEventListener("click", () => {
    const replyForm = document.getElementById(`reply-form-${comment.id}`);
    replyForm.style.display =
      replyForm.style.display === "none" ? "block" : "none";
  });

  // Add event listener to the reply form
  replyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = replyForm.querySelector(".reply-content").value;
    try {
      await postReply(postId, comment.id, content);
      replyForm.style.display = "none";
      replyForm.querySelector(".reply-content").value = "";
      loadComments(postId); // Reload comments to show the new reply
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  });

  // Render nested replies
  if (comment.replies && comment.replies.length > 0) {
    const repliesList = document.getElementById(`replies-${comment.id}`);
    comment.replies.forEach((reply) => {
      renderComment(reply, postId, repliesList);
    });
  }
}

function createReplyButton(commentId) {
  const replyButton = document.createElement("button");
  replyButton.classList.add("btn", "btn-link", "reply-btn");
  replyButton.setAttribute("data-comment-id", commentId);
  replyButton.textContent = "Reply";
  return replyButton;
}

function createReplyForm(commentId) {
  const replyForm = document.createElement("form");
  replyForm.classList.add("reply-form");
  replyForm.id = `reply-form-${commentId}`;
  replyForm.style.display = "none";

  const textarea = document.createElement("textarea");
  textarea.classList.add("form-control", "reply-content");
  textarea.rows = 2;
  textarea.placeholder = "Write a reply";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.classList.add("btn", "btn-primary", "mt-2");
  submitButton.textContent = "Reply";

  replyForm.appendChild(textarea);
  replyForm.appendChild(submitButton);

  return replyForm;
}
async function deleteComment(commentId, postId) {
  try {
    const response = await fetch(
      `/forum/${forumId}/post/${postId}/comment/${commentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete comment");
    }

    // Recursive function to remove a comment and its replies from the DOM
    const removeCommentAndAllReplies = (commentId) => {
      const commentElement = document.getElementById(`comment-${commentId}`);
      if (commentElement) {
        // Find all nested replies at any level using a more comprehensive selector
        const allNestedReplies = commentElement.querySelectorAll(".replies li");
        allNestedReplies.forEach((replyElement) => {
          const replyId = replyElement.id.replace("comment-", "");
          removeCommentAndAllReplies(replyId); // Recursive call to remove nested replies
        });
        // Remove the parent comment itself
        commentElement.remove();
      } else {
        console.warn(`Comment element with ID comment-${commentId} not found`);
      }
    };

    // Remove the comment and ALL its nested replies from the DOM
    removeCommentAndAllReplies(commentId);

    console.log("Comment and all nested replies deleted successfully");

    // Fetch and render updated comments
    await loadComments(postId);
  } catch (error) {
    console.error("Error deleting comment:", error);
    alert("Failed to delete the comment. Please try again.");
  }
}

async function loadComments(postId) {
  try {
    const response = await fetch(`/forum/${forumId}/post/${postId}/comment`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const comments = await response.json();
      renderCommentsAndReplies(comments, postId);
      console.log("comments", comments);
    } else {
      console.error("Failed to load comments");
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

function renderCommentsAndReplies(comments, postId) {
  const commentsList = document.getElementById(`comments-${postId}`);
  if (!commentsList) {
    console.error(`Comments list not found for post ID: ${postId}`);
    return;
  }

  commentsList.innerHTML = ""; // Clear existing comments/replies

  comments.forEach((comment) => {
    renderComment(comment, postId, commentsList);
  });
}

async function postReply(postId, parentId, content) {
  try {
    const userResponse = await fetch(`/forum/${forumId}/user/${userId}`);
    if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
    }
    const userData = await userResponse.json();
    const username = userData.username;

    const response = await fetch(`/forum/${forumId}/post/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId, userId, content, parentId }),
    });

    if (!response.ok) {
      throw new Error("Failed to post reply");
    }

    const newReply = await response.json();
    console.log("New reply created:", newReply);


    // Clear the reply form
    const replyForm = document.getElementById(`reply-form-${parentId}`);
    replyForm.style.display = "none";
    replyForm.querySelector(".reply-content").value = "";

    // Reload comments to show the new reply
    loadComments(postId);
  } catch (error) {
    console.error("Error posting reply:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.loadComments = async function (postId) {
    try {
      const response = await fetch(`/forum/${forumId}/post/${postId}/comment`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const comments = await response.json();
        renderCommentsAndReplies(comments, postId);
        console.log("comments", comments);
      } else {
        console.error("Failed to load comments");
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Add event listeners for showing comments, posting comments, and deleting comments
  document.querySelectorAll(".show-comments-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const postId = event.target.dataset.postId;
      loadComments(postId); // Load the comments for this post
    });
  });

  document.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", postComment);
  });

  const createPostBtn = document.getElementById("createPostBtn");
  const createPostForm = document.getElementById("createPostForm");
  const updatePostForm = document.getElementById("updatePostForm");
  const deletePostForm = document.getElementById("deletePostForm");

  const createPostModal = document.getElementById("createPostModal");
  const modalCloseBtn = createPostModal.querySelector(".btn-close");

  function showModal() {
    createPostModal.classList.add("show");
    createPostModal.style.display = "block";
    document.body.classList.add("modal-open");
    createPostModal.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    createPostModal.classList.remove("show");
    createPostModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }

  createPostBtn.addEventListener("click", showModal);
  modalCloseBtn.addEventListener("click", hideModal);
  createPostModal.addEventListener("click", (e) => {
    if (e.target === createPostModal) {
      hideModal();
    }
  });

  // Initial fetch to display posts
  loadPosts();

  async function loadPosts() {
    try {
      const response = await fetch(`/forum/${forumId}/post`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        allPosts = await response.json();
        console.log("Posts loaded:", allPosts);
        applyFilter();
      } else {
        console.error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  createPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("postTitle").value;
    const content = document.getElementById("postContent").value;

    try {
      const response = await fetch(`/forum/${forumId}/post/${authorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        alert(`Post created successfully`);
        loadPosts();
        createPostForm.reset();
        hideModal();
      } else {
        const errorData = await response.json();
        alert(`Error creating post: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  });

  updatePostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const postId = parseInt(document.getElementById("updatePostId").value, 10);
    const title = document.getElementById("updatePostTitle").value;
    const content = document.getElementById("updatePostContent").value;

    try {
      const response = await fetch(`/forum/${forumId}/post/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        alert(`Post updated successfully`);
        loadPosts();
      } else {
        const errorData = await response.json();
        alert(`Error updating post: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  });

  deletePostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const postId = parseInt(document.getElementById("deletePostId").value, 10);

    try {
      const response = await fetch(`/forum/${forumId}/post/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        alert(`Post deleted`);
        loadPosts();
      } else {
        const errorData = await response.json();
        alert(`Error deleting post: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  });
});

let notificationSystemInstance = null;

class NotificationSystem {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.startPeriodicRefresh();
  }

  initializeElements() {
    // Create and insert bell icon
    const bellContainer = document.getElementById(
      "notification-bell-container"
    );
    bellContainer.innerHTML = `
            <button class="notification-bell">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notification-count" style="display: none;">0</span>
            </button>
        `;

    this.modal = document.getElementById("notification-modal");
    this.bellIcon = document.querySelector(".notification-bell");
    this.closeBtn = document.getElementById("close-modal");
    this.container = document.getElementById("notification-container");
    this.countElement = document.querySelector(".notification-count");
    this.updateNotificationCount();
  }
  async updateNotificationCount() {
    try {
      // Fetch all notifications for the user and the current forum
      const response = await fetch(`/forum/${forumId}/notifications/user/${userId}`);
      const data = await response.json();
      const notifications = data.notifications || [];

      const count = notifications.filter(notification => !notification.read).length; // Count the total notifications

      // Update the notification count on the bell icon
      this.countElement.textContent = count;
      this.countElement.style.display = count > 0 ? "flex" : "none";
      
      // Add a visual indication when count changes
      if (count > 0) {
        this.bellIcon.classList.add("has-notifications");
      } else {
        this.bellIcon.classList.remove("has-notifications");
      }
    } catch (error) {
      console.error("Error updating notification count:", error);
    }
  }

  // Other methods here (fetching notifications, opening/closing modal, etc.)



  setupEventListeners() {
    this.bellIcon.addEventListener("click", () => this.openModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  openModal() {
    this.modal.classList.add("visible");
    this.fetchAndRenderNotifications();
  }

  closeModal() {
    this.modal.classList.remove("visible");
  }

  async createNotification(userId, postId, message) {
    try {
      const response = await fetch(`/forum/${forumId}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, postId, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to create notification");
      }

      await this.updateNotificationCount();
      console.log("Notification created successfully");
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(
        `/forum/${forumId}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        const notificationElement = document.querySelector(
          `#notification-${notificationId}`
        );
        if (notificationElement) {
          notificationElement.classList.add("read");
          const readBtn = notificationElement.querySelector(".btn.read");
          if (readBtn) readBtn.remove();
        }
        await this.updateNotificationCount();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await fetch(
        `/forum/${forumId}/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const notificationElement = document.querySelector(
          `#notification-${notificationId}`
        );
        if (notificationElement) {
          notificationElement.remove();
        }
        await this.updateNotificationCount();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  async fetchAndRenderNotifications() {
    try {
      const response = await fetch(
        `/forum/${forumId}/notifications/user/${userId}`
      );
      const data = await response.json();
      const notifications = data.notifications || [];

      this.container.innerHTML = notifications.length
        ? ""
        : '<p class="text-center" style="color: #666;">No notifications</p>';

      notifications.forEach((notification) => {
        const element = this.createNotificationElement(notification);
        this.container.appendChild(element);
      });

      await this.updateNotificationCount();
    } catch (error) {
      console.error("Error fetching or rendering notifications:", error);
      this.container.innerHTML =
        '<p class="text-center" style="color: #dc2626;">Error loading notifications</p>';
    }
  }

  createNotificationElement(notification) {
    const element = document.createElement("div");
    element.id = `notification-${notification.id}`;
    element.classList.add("notification");
    if (notification.read) element.classList.add("read");

    element.innerHTML = `
            <div class="notification-content">
                ${notification.message}
            </div>
            <div class="notification-actions">
                ${
                  !notification.read
                    ? `
                    <button class="btn read">Mark as Read</button>
                `
                    : ""
                }
                <button class="btn delete">Delete</button>
            </div>
        `;

    const readBtn = element.querySelector(".btn.read");
    if (readBtn) {
      readBtn.addEventListener("click", () =>
        this.markNotificationAsRead(notification.id)
      );
    }

    element
      .querySelector(".btn.delete")
      .addEventListener("click", () =>
        this.deleteNotification(notification.id)
      );

    return element;
  }

  startPeriodicRefresh() {
    setInterval(() => {
      if (this.modal.classList.contains("visible")) {
        this.fetchAndRenderNotifications();
      } else {
        this.updateNotificationCount();
      }
    }, 10000);
  }
}

function getNotificationSystem() {
  return notificationSystemInstance;
}

// Initialize the notification system when the DOM is loaded
function initNotificationSystem() {
  if (
    !notificationSystemInstance &&
    typeof userId !== "undefined" &&
    typeof forumId !== "undefined"
  ) {
    notificationSystemInstance = new NotificationSystem();
  }
  return notificationSystemInstance;
}

document.addEventListener("DOMContentLoaded", () => {
  initNotificationSystem();
});
