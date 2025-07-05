const { collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, where, updateDoc, arrayUnion } = window.firestore;

// --- Navigation ---
function switchSection(sectionName) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-section="${sectionName}"]`);
  const section = document.getElementById('section-' + sectionName);
  if (btn) btn.classList.add('active');
  if (section) section.classList.add('active');
}

// --- User ---
function getUser() {
  return JSON.parse(localStorage.getItem('twisterUser')) || {
    username: "",
    display_name: "",
    bio: ""
  };
}
function setUser(u) { localStorage.setItem('twisterUser', JSON.stringify(u)); }

// --- Main nav setup ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      switchSection(btn.dataset.section);
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

// --- Create Post ---
async function createPost() {
  const text = document.getElementById('tweetText').value.trim();
  if (!text) return;
  const me = getUser();
  await addDoc(collection(db, "posts"), {
    user: me.username,
    content: text,
    likes: [],
    comments: [],
    created_at: new Date()
  });
  document.getElementById('tweetText').value = "";
  loadFeed();
  renderProfile(me.username);
  renderExplore();
}

// --- Feed/Explore/Profile ---
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
  snap.forEach(docSnap => posts.push({ ...docSnap.data(), id: docSnap.id }));
  posts.sort((a, b) => ((b.likes?.length || 0) + (b.comments?.length || 0)) - ((a.likes?.length || 0) + (a.comments?.length || 0)));
  const exploreFeed = document.getElementById('exploreFeed');
  exploreFeed.innerHTML = posts.length === 0 ? `<div class="empty">Nothing trending yet.</div>` : '';
  posts.slice(0, 10).forEach(post => exploreFeed.appendChild(createPostElement(post, post.id)));
}

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
      userData = { username, display_name: username, bio: "" };
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
    card.querySelector('#saveProfileBtn').onclick = function () {
      userData.display_name = card.querySelector('#editDisplayName').value.trim() || "Anonymous";
      userData.username = card.querySelector('#editUsername').value.trim() || "anon";
      setUser(userData);
      setDoc(doc(db, "users", userData.username), {
        display_name: userData.display_name,
        bio: userData.bio || ""
      }, { merge: true });
      renderProfile(userData.username);
    };
  } else {
    card.querySelector('#msgUserBtn').onclick = function () {
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
    profilePosts.appendChild(createPostElement({ ...docSnap.data(), id: docSnap.id }, docSnap.id));
  });
}

// --- Likes/Comments ---
function createPostElement(post, id) {
  const me = getUser();
  const div = document.createElement('div');
  div.className = 'tweet';

  // Likes/comments count
  const liked = post.likes && post.likes.includes(me.username);
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="https://placehold.co/38x38" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.user}" style="font-weight:700;text-decoration:underline dotted #1976d2;cursor:pointer">${post.user}</span>
    </div>
    <div style="white-space:pre-line;margin-bottom:7px;">${post.content || ''}</div>
    <div class="tweet-footer" style="display:flex;gap:22px;align-items:center;">
      <button class="like-btn" style="border:none;background:none;cursor:pointer;font-size:1.14em;color:${liked ? '#1da1f2' : '#8baecf'};font-weight:700;display:flex;align-items:center;gap:4px;">
        <span style="font-size:1.21em;">&#x2764;</span> <span class="like-count">${likeCount}</span>
      </button>
      <button class="comment-btn" style="border:none;background:none;cursor:pointer;font-size:1.12em;color:#7e93b5;display:flex;align-items:center;gap:4px;">
        💬 <span class="comment-count">${commentCount}</span>
      </button>
      <span style="color:#7a7;flex:1;text-align:right;font-size:0.96em;">
        ${post.created_at ? new Date(post.created_at.toDate ? post.created_at.toDate() : post.created_at).toLocaleString() : ''}
      </span>
    </div>
    <div class="comments-list" style="margin-top:10px;display:none;"></div>
    <div class="add-comment" style="margin-top:10px;display:none;">
      <input type="text" class="comment-input" placeholder="Add a comment..." style="width:73%;background:#23262c;color:#fff;padding:7px 12px;border-radius:12px;border:none;">
      <button class="submit-comment" style="background:#1da1f2;color:#fff;padding:7px 18px;border:none;border-radius:12px;font-weight:700;cursor:pointer;margin-left:8px;">Send</button>
    </div>
  `;

  div.querySelector('.profile-link').onclick = () => {
    renderProfile(post.user);
    switchSection("profile");
  };

  // Like
  div.querySelector('.like-btn').onclick = async () => {
    const docRef = doc(db, "posts", id);
    let newLikes = Array.isArray(post.likes) ? [...post.likes] : [];
    if (liked) {
      newLikes = newLikes.filter(u => u !== me.username);
    } else {
      newLikes.push(me.username);
    }
    await updateDoc(docRef, { likes: newLikes });
    post.likes = newLikes;
    div.querySelector('.like-count').innerText = newLikes.length;
    div.querySelector('.like-btn').style.color = newLikes.includes(me.username) ? '#1da1f2' : '#8baecf';
    renderExplore();
    renderProfilePosts(post.user);
    loadFeed();
  };

  // Show/hide comments
  div.querySelector('.comment-btn').onclick = () => {
    const list = div.querySelector('.comments-list');
    const box = div.querySelector('.add-comment');
    const visible = list.style.display === 'block';
    list.style.display = box.style.display = visible ? 'none' : 'block';
    if (!visible) renderComments(div, post, id);
  };

  // Submit comment
  div.querySelector('.submit-comment').onclick = async () => {
    const input = div.querySelector('.comment-input');
    const val = input.value.trim();
    if (!val) return;
    const docRef = doc(db, "posts", id);
    const snap = await getDoc(docRef);
    const prevComments = (snap.data().comments) || [];
    const comment = {
      user: me.username,
      text: val,
      time: Date.now()
    };
    prevComments.push(comment);
    await updateDoc(docRef, { comments: prevComments });
    input.value = '';
    renderComments(div, { ...post, comments: prevComments }, id);
    renderExplore();
    renderProfilePosts(post.user);
    loadFeed();
  };

  return div;
}

// --- Render comments for a post ---
function renderComments(div, post, id) {
  const list = div.querySelector('.comments-list');
  list.innerHTML = "";
  const comments = post.comments || [];
  if (!comments.length) {
    list.innerHTML = `<div style="color:#6b7788;font-size:0.98em;">No comments yet.</div>`;
    return;
  }
  comments.forEach(com => {
    list.innerHTML += `
      <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:7px;">
        <span style="color:#1da1f2;font-weight:700;">${com.user}</span>
        <span style="background:#212733;border-radius:10px;padding:5px 11px;color:#eee;">${com.text}</span>
        <span style="color:#859aad;font-size:0.95em;margin-left:6px;">${com.time ? new Date(com.time).toLocaleString() : ""}</span>
      </div>
    `;
  });
}

// --- Messaging (unorganized, as before) ---
async function renderMessagesList() {
  const me = getUser();
  const q = query(
    collection(db, "messages"),
    where("participants", "array-contains", me.username)
  );
  const snap = await getDocs(q);

  // Group by other user
  const chatUsers = {};
  snap.forEach(docSnap => {
    const m = docSnap.data();
    const other = m.from === me.username ? m.to : m.from;
    if (!chatUsers[other]) chatUsers[other] = [];
    chatUsers[other].push(m);
  });

  const list = document.getElementById('messagesList');
  list.innerHTML = `<h3 style="margin:0 0 14px 0;">Your Chats</h3>`;
  const users = Object.keys(chatUsers);
  if (users.length === 0) {
    list.innerHTML += `<div class="empty">No chats yet.</div>`;
    return;
  }
  users.forEach(otherUser => {
    const lastMsg = chatUsers[otherUser][chatUsers[otherUser].length - 1];
    const preview = document.createElement('div');
    preview.className = 'tweet';
    preview.style.cursor = 'pointer';
    preview.innerHTML = `
      <strong>${otherUser}</strong>
      <div style="font-size:0.97rem;color:#c5d6ff;">${lastMsg.text.slice(0, 30)}</div>
    `;
    preview.onclick = () => startChatWithUser(otherUser, otherUser);
    list.appendChild(preview);
  });
}

async function startNewMessage() {
  const to = prompt("Enter the username you want to message:");
  if (!to) return;
  startChatWithUser(to, to);
}

async function startChatWithUser(username, displayName) {
  const me = getUser();
  // Get all messages between me and them
  const q = query(
    collection(db, "messages"),
    where("participants", "array-contains", me.username)
  );
  const snap = await getDocs(q);
  // Only those between the two
  const threadMsgs = [];
  snap.forEach(docSnap => {
    const m = docSnap.data();
    if (
      (m.from === me.username && m.to === username) ||
      (m.from === username && m.to === me.username)
    ) {
      threadMsgs.push(m);
    }
  });
  threadMsgs.sort((a, b) => (a.time || 0) - (b.time || 0));

  document.getElementById('messagesList').style.display = 'none';
  document.getElementById('messageWindow').style.display = 'block';
  document.getElementById('messageHeader').innerHTML = `<h3>Chat with ${displayName}</h3>`;
  const thread = document.getElementById('messageThread');
  thread.innerHTML = '';
  threadMsgs.forEach(msg => {
    const side = msg.from === me.username ? "right" : "left";
    thread.innerHTML += `
      <div style="text-align:${side};margin:6px 0;">
        <span style="display:inline-block;max-width:66%;background:${side=="right"?"#1da1f2":"#23262c"};color:#fff;padding:7px 13px;border-radius:14px;">
          <b style="font-weight:600;">${msg.from}</b>: ${msg.text}
        </span>
      </div>`;
  });
  thread.scrollTop = thread.scrollHeight;

  document.getElementById('sendMessageBtn').onclick = async () => {
    const val = document.getElementById('newMessageInput').value.trim();
    if (!val) return;
    await addDoc(collection(db, "messages"), {
      from: me.username,
      to: username,
      participants: [me.username, username],
      text: val,
      time: Date.now()
    });
    document.getElementById('newMessageInput').value = '';
    startChatWithUser(username, displayName); // reload chat
  };
}

function closeMessageWindow() {
  document.getElementById('messagesList').style.display = '';
  document.getElementById('messageWindow').style.display = 'none';
  renderMessagesList();
}
