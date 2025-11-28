let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = null;

// Load theme from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
});

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (users[username] && users[username].password === password) {
        currentUser = username;
        document.getElementById('current-user').textContent = username;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-section').style.display = 'flex';
        loadPosts();
        loadFriends();
        loadMyProfile();
    } else {
        alert('Invalid credentials');
    }
}

function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!username || !password) {
        alert('Username and password are required');
        return;
    }
    if (users[username]) {
        alert('Username already exists');
    } else {
        users[username] = { password, posts: [], friends: [], dp: '', bio: '', pendingRequests: [] };
        localStorage.setItem('users', JSON.stringify(users));
        alert('Registered successfully! Please login to Buzzworld.');
        showLogin();
    }
}

function logout() {
    currentUser = null;
    showLogin();
}

function createPost() {
    const content = document.getElementById('post-content').value;
    const imageInput = document.getElementById('post-image');
    const file = imageInput.files[0];
    let imageData = '';

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imageData = e.target.result;
            savePost(content, imageData);
            imageInput.value = '';
        };
        reader.readAsDataURL(file);
    } else {
        savePost(content, imageData);
    }
}

function savePost(content, imageData, originalPoster = null) {
    const post = {
        content,
        image: imageData,
        timestamp: new Date().toLocaleString(),
        likes: [],
        comments: [],
        originalPoster: originalPoster || null
    };
    users[currentUser].posts.push(post);
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('post-content').value = '';
    loadPosts();
}

function likePost(username, postIndex) {
    const post = users[username].posts[postIndex];
    if (!post.likes.includes(currentUser)) {
        post.likes.push(currentUser);
    } else {
        post.likes = post.likes.filter(user => user !== currentUser);
    }
    localStorage.setItem('users', JSON.stringify(users));
    loadPosts();
}

function commentPost(username, postIndex) {
    const commentInput = document.getElementById(`comment-${username}-${postIndex}`);
    const commentText = commentInput.value.trim();
    if (commentText) {
        users[username].posts[postIndex].comments.push({
            user: currentUser,
            text: commentText,
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('users', JSON.stringify(users));
        commentInput.value = '';
        loadPosts();
    }
}

function repost(username, postIndex) {
    const originalPost = users[username].posts[postIndex];
    const repostContent = originalPost.content ? `Reposted from ${username}: ${originalPost.content}` : `Reposted from ${username}`;
    savePost(repostContent, originalPost.image, username);
}

function loadPosts() {
    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';
    const allPosts = [];
    allPosts.push(...users[currentUser].posts.map((post, index) => ({ username: currentUser, post, index })));
    users[currentUser].friends.forEach(friend => {
        if (users[friend]) {
            allPosts.push(...users[friend].posts.map((post, index) => ({ username: friend, post, index })));
        }
    });
    allPosts.sort((a, b) => new Date(b.post.timestamp) - new Date(a.post.timestamp));
    allPosts.forEach(({ username, post, index }) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        const isLiked = post.likes.includes(currentUser);
        postElement.innerHTML = `
            <strong>${username}</strong>${post.originalPoster ? ` (Reposted from ${post.originalPoster})` : ''}<br>
            ${post.content || ''}${post.image ? `<br><img src="${post.image}" alt="Post Image">` : ''}<br>
            <small>${post.timestamp}</small>
            <div class="post-actions">
                <button onclick="likePost('${username}', ${index})" class="${isLiked ? 'liked' : ''}"><i class="fas fa-heart"></i> ${post.likes.length} Like${post.likes.length === 1 ? '' : 's'}</button>
                <button onclick="document.getElementById('comment-${username}-${index}').focus()"><i class="fas fa-comment"></i> ${post.comments.length} Comment${post.comments.length === 1 ? '' : 's'}</button>
                <button onclick="repost('${username}', ${index})"><i class="fas fa-retweet"></i> Repost</button>
            </div>
            <div class="comment-section">
                <input type="text" id="comment-${username}-${index}" placeholder="Add a comment..." class="input-field">
                <button onclick="commentPost('${username}', ${index})" class="btn"><i class="fas fa-paper-plane"></i> Comment</button>
            </div>
            <div class="comments-list">
                ${post.comments.map(comment => `<p><strong>${comment.user}</strong>: ${comment.text} <small>${comment.timestamp}</small></p>`).join('')}
            </div>
        `;
        postsDiv.appendChild(postElement);
    });
}

function sendFriendRequest(usernameToRequest) {
    if (!usernameToRequest) {
        usernameToRequest = document.getElementById('friend-username').value.trim();
    }
    if (!users[usernameToRequest]) {
        alert('User does not exist');
        return;
    }
    if (usernameToRequest === currentUser) {
        alert('You cannot send a request to yourself');
        return;
    }
    if (users[currentUser].friends.includes(usernameToRequest)) {
        alert('You are already friends');
        return;
    }
    if (users[usernameToRequest].pendingRequests.includes(currentUser)) {
        alert('Request already pending');
        return;
    }
    users[usernameToRequest].pendingRequests.push(currentUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert(`Friend request sent to ${usernameToRequest}`);
    if (document.getElementById('friend-username').value) {
        document.getElementById('friend-username').value = '';
    }
    if (document.getElementById('profile-section').style.display === 'block') {
        viewProfile();
    }
}

function acceptFriendRequest(username) {
    const requestIndex = users[currentUser].pendingRequests.indexOf(username);
    if (requestIndex !== -1) {
        users[currentUser].pendingRequests.splice(requestIndex, 1);
        users[currentUser].friends.push(username);
        users[username].friends.push(currentUser);
        localStorage.setItem('users', JSON.stringify(users));
        loadFriends();
        loadMyProfile();
        loadPosts();
    }
}

function rejectFriendRequest(username) {
    const requestIndex = users[currentUser].pendingRequests.indexOf(username);
    if (requestIndex !== -1) {
        users[currentUser].pendingRequests.splice(requestIndex, 1);
        localStorage.setItem('users', JSON.stringify(users));
        loadMyProfile();
    }
}

function loadFriends() {
    const friendsList = document.getElementById('friends-list');
    friendsList.innerHTML = '';
    users[currentUser].friends.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend;
        friendsList.appendChild(li);
    });
}

function viewProfile() {
    const username = document.getElementById('profile-username').value.trim();
    const profileDiv = document.getElementById('profile-view');
    profileDiv.innerHTML = '';

    if (!username) {
        profileDiv.innerHTML = '<p>Please enter a username</p>';
        return;
    }
    if (!users[username]) {
        profileDiv.innerHTML = '<p>User not found</p>';
        return;
    }

    const isFriend = users[currentUser].friends.includes(username);
    const hasPendingRequest = users[username].pendingRequests.includes(currentUser);

    const profileHTML = `
        <div class="profile-display">
            <img src="${users[username].dp || 'https://via.placeholder.com/100'}" alt="DP" class="dp">
            <div>
                <h3>${username}</h3>
                <p>${users[username].bio || 'No bio yet'}</p>
                ${username !== currentUser ? `<button onclick="sendFriendRequest('${username}')" class="btn" ${isFriend || hasPendingRequest ? 'disabled' : ''}><i class="fas fa-user-plus"></i> ${isFriend ? 'Friends' : hasPendingRequest ? 'Request Pending' : 'Send Request'}</button>` : ''}
            </div>
        </div>
        <h4>Posts:</h4>
        ${users[username].posts.length ? users[username].posts.map(post => `<p><strong>${username}</strong>${post.originalPoster ? ` (Reposted from ${post.originalPoster})` : ''}<br>${post.content || ''}${post.image ? `<br><img src="${post.image}" alt="Post Image">` : ''}<br><small>${post.timestamp}</small></p>`).join('') : '<p>No posts yet</p>'}
        <h4>Friends:</h4>
        <ul>${users[username].friends.length ? users[username].friends.map(f => `<li>${f}</li>`).join('') : '<li>No friends yet</li>'}</ul>
    `;
    profileDiv.innerHTML = profileHTML;
}

function loadMyProfile() {
    document.getElementById('my-username').textContent = currentUser;
    document.getElementById('my-dp').src = users[currentUser].dp || 'https://via.placeholder.com/100';
    document.getElementById('my-bio').textContent = users[currentUser].bio || 'No bio yet';
    document.getElementById('bio').value = users[currentUser].bio || '';

    const pendingList = document.getElementById('pending-requests');
    pendingList.innerHTML = '';
    users[currentUser].pendingRequests.forEach(requester => {
        const li = document.createElement('li');
        li.innerHTML = `${requester} <div><button onclick="acceptFriendRequest('${requester}')" class="btn accept"><i class="fas fa-check"></i> Accept</button> <button onclick="rejectFriendRequest('${requester}')" class="btn reject"><i class="fas fa-times"></i> Reject</button></div>`;
        pendingList.appendChild(li);
    });
}

function updateProfile() {
    const fileInput = document.getElementById('dp-upload');
    const bio = document.getElementById('bio').value;
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            users[currentUser].dp = e.target.result;
            users[currentUser].bio = bio;
            localStorage.setItem('users', JSON.stringify(users));
            loadMyProfile();
            fileInput.value = '';
        };
        reader.readAsDataURL(file);
    } else {
        users[currentUser].bio = bio;
        localStorage.setItem('users', JSON.stringify(users));
        loadMyProfile();
    }
}

function deactivateAccount() {
    const confirmation = confirm(`Are you sure you want to deactivate your Buzzworld account? This will permanently delete all your data (posts, friends, profile) and cannot be undone.`);
    if (confirmation) {
        // Remove user from all friends' lists
        users[currentUser].friends.forEach(friend => {
            if (users[friend]) {
                users[friend].friends = users[friend].friends.filter(f => f !== currentUser);
            }
        });
        // Remove user from all pending requests
        Object.keys(users).forEach(username => {
            if (users[username].pendingRequests) {
                users[username].pendingRequests = users[username].pendingRequests.filter(requester => requester !== currentUser);
            }
        });
        // Delete user's data
        delete users[currentUser];
        localStorage.setItem('users', JSON.stringify(users));
        alert('Your account has been deactivated.');
        logout();
    }
}

function toggleTheme() {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.card').forEach(card => card.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'my-profile-section') loadMyProfile();
    if (sectionId === 'post-section') loadPosts();
}

function sendFriendRequestFromInput() {
    const friendUsername = document.getElementById('friend-username').value.trim();
    sendFriendRequest(friendUsername);
}

// Initial setup
showLogin();