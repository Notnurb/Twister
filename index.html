const { collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, where } = window.firestore;

// Demo: Simple local user (replace with Firebase Auth for real use)
function getUser() {
  return JSON.parse(localStorage.getItem('twisterUser')) || {
    username: "alexdafirst",
    display_name: "Alex",
    bio: ""
  };
}
function setUser(u) { localStorage.setItem('twisterUser', JSON.stringify(u)); }

// Navigation
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + btn.dataset.section).classList.add('active');
      if (btn.dataset.section === "home") loadFeed();
      if (btn.dataset.section === "profile") renderProfile(getUser().username);
      if (btn.dataset.section === "explore") renderExplore();
      if (btn.dataset.section === "messages") renderMessagesList();
    };
  });
  document.getElementById('tweetButton').onclick = createPost;
  document.getElementById('newMessageBtn').onclick = startNewMessage;
  loadFeed();
  renderExplore();
  renderProfile(getUser().username);
});

// Posts
async function createPost() {
  const text = document.getElementById('tweetText').value.trim();
  if (!text) return;
  const me = getUser();
  await addDoc(collection(db, "posts"), {
    user: me.username,
    content: text,
    created_at: new Date()
  });
  document.getElementById('tweetText').value = "";
  loadFeed();
  renderProfile(me.username);
  renderExplore();
}

async function loadFeed() {
  const postsCol = collection(db, "posts");
  const q = query(postsCol, orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  const feed = document.getElementById('feed');
  feed.innerHTML = "";
  if (snap.empty) return feed.innerHTML = `<div class="empty">No posts yet.</div>`;
  snap.forEach(docSnap => {
    feed.appendChild(createPostElement(docSnap.data(), docSnap.id));
  });
}

async function renderExplore() {
  const postsCol = collection(db, "posts");
  const q = query(postsCol, orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  let posts = [];
  snap.forEach(docSnap => posts.push(docSnap.data()));
  posts.sort((a, b) => ((b.likes || 0) + ((b.comments && b.comments.length) || 0)) - ((a.likes || 0) + ((a.comments && a.comments.length) || 0)));
  const exploreFeed = document.getElementById('exploreFeed');
  exploreFeed.innerHTML = posts.length === 0 ? `<div class="empty">Nothing trending yet.</div>` : '';
  posts.slice(0, 10).forEach(post => exploreFeed.appendChild(createPostElement(post)));
}

// Profiles
async function renderProfile(username) {
  const currentUser = getUser().username;
  let userData;
  if (username === currentUser) {
    userData = getUser();
  } else {
    const userDoc = await getDoc(doc(db, "users", username));
    if (userDoc.exists()) {
      userData = userDoc.data();
      userData.username = username;
    } else {
      userData = {username, display_name: username, bio: ""};
    }
  }
  const isSelf = (username === currentUser);
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.innerHTML = `
    <img class="profile-pic" src="https://placehold.co/80x80" />
    <div style="font-size:1.1rem;font-weight:700;color:#fff;margin:4px 0">${userData.display_name}</div>
    <div style="color:#1da1f2;margin-bottom:4px;">${userData.username}</div>
    <div style="font-size:.97rem;color:#aab4c1;margin-bottom:7px">${userData.bio || ''}</div>
    ${isSelf ? `
      <input type="text" id="editDisplayName" placeholder="Display Name" value="${userData.display_name}"/>
      <input type="text" id="editUsername" placeholder="@username" value="${userData.username}"/>
      <button class="tweet-btn" id="saveProfileBtn">Save Profile</button>
    ` : `<button id="msgUserBtn" class="tweet-btn" style="margin-top:12px;">Message</button>`}
  `;
  const detail = document.getElementById('profileDetail');
  detail.innerHTML = '';
  detail.appendChild(card);
  document.getElementById('profilePostsTitle').innerText =
    isSelf ? 'Your Posts' : `${userData.display_name}'s Posts`;
  renderProfilePosts(username);
  if (isSelf) {
    card.querySelector('#saveProfileBtn').onclick = function() {
      userData.display_name = card.querySelector('#editDisplayName').value.trim() || "Anonymous";
      userData.username = card.querySelector('#editUsername').value.trim() || "anon";
      setUser(userData);
      setDoc(doc(db, "users", userData.username), {
        display_name: userData.display_name,
        bio: userData.bio || ""
      }, {merge: true});
      renderProfile(userData.username);
    };
  } else {
    card.querySelector('#msgUserBtn').onclick = function() {
      startChatWithUser(userData.username, userData.display_name);
    };
  }
}

async function renderProfilePosts(username) {
  const postsCol = collection(db, "posts");
  const q = query(postsCol, where("user", "==", username), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  const profilePosts = document.getElementById('profilePosts');
  if (snap.empty) {
    profilePosts.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  profilePosts.innerHTML = '';
  snap.forEach(docSnap => {
    profilePosts.appendChild(createPostElement(docSnap.data(), docSnap.id));
  });
}

function createPostElement(post, id) {
  const div = document.createElement('div');
  div.className = 'tweet';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="https://placehold.co/38x38" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.user}" style="font-weight:700;text-decoration:underline dotted #1976d2;cursor:pointer">${post.user}</span>
    </div>
    <div style="white-space:pre-line;margin-bottom:7px;">${post.content || ''}</div>
    <div class="tweet-footer">
      <span style="color:#7a7;">${post.created_at ? new Date(post.created_at.toDate ? post.created_at.toDate() : post.created_at).toLocaleString() : ''}</span>
    </div>
  `;
  div.querySelector('.profile-link').onclick = () => {
    renderProfile(post.user);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-profile').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  };
  return div;
}

// Messaging (demo only, not persistent)
async function renderMessagesList() {
  document.getElementById('messagesList').innerHTML = `<div class="empty">No chats yet.</div>`;
}
function startNewMessage() {
  const to = prompt("Enter the username you want to message:");
  if (!to) return;
  startChatWithUser(to, to);
}
function startChatWithUser(username, displayName) {
  document.getElementById('messagesList').style.display = 'none';
  document.getElementById('messageWindow').style.display = 'block';
  document.getElementById('messageHeader').innerHTML = `<h3>Chat with ${displayName}</h3>`;
  const thread = document.getElementById('messageThread');
  thread.innerHTML = '';
  document.getElementById('sendMessageBtn').onclick = () => {
    const val = document.getElementById('newMessageInput').value.trim();
    if (!val) return;
    thread.innerHTML += `<div style="text-align:right;margin:6px 0;">
      <span style="display:inline-block;max-width:66%;background:#1da1f2;color:#fff;padding:7px 13px;border-radius:14px;">${val}</span>
    </div>`;
    document.getElementById('newMessageInput').value = '';
    thread.scrollTop = thread.scrollHeight;
  };
}
function closeMessageWindow() {
  document.getElementById('messagesList').style.display = '';
  document.getElementById('messageWindow').style.display = 'none';
}
