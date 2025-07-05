const db = window.db;

// Simple local profile
function getUser() {
  let user = JSON.parse(localStorage.getItem('twisterUser'));
  if (!user) {
    user = {
      username: '@anon' + Math.floor(Math.random() * 10000),
      displayName: 'Anonymous',
      profilePic: 'https://placehold.co/74x74',
      bio: ''
    };
    localStorage.setItem('twisterUser', JSON.stringify(user));
  }
  return user;
}
function setUser(user) {
  localStorage.setItem('twisterUser', JSON.stringify(user));
}

// ===== Posting Handler =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tweetButton').onclick = async () => {
    const tweetText = document.getElementById('tweetText').value.trim();
    if (!tweetText) return;
    const me = getUser();
    const post = {
      user: me.username,
      content: tweetText,
      created_at: new Date(),
      likes: [],
      comments: []
    };
    await db.collection('posts').add(post);
    document.getElementById('tweetText').value = '';
    loadFeed();
    renderExplore();
    renderProfile(me.username);
  };

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const section = btn.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + section).classList.add('active');
      if (section === "profile") renderProfile(getUser().username);
      if (section === "home") loadFeed();
      if (section === "explore") renderExplore();
    };
  });

  loadFeed();
  renderProfile(getUser().username);
  renderExplore();
});

// ===== Load Feed =====
async function loadFeed() {
  const snap = await db.collection('posts').orderBy('created_at', 'desc').get();
  const feed = document.getElementById('feed');
  if (snap.empty) {
    feed.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  feed.innerHTML = '';
  snap.forEach(doc => feed.appendChild(createPostElement(doc)));
}

// ===== Explore (Trending by interactions) =====
async function renderExplore() {
  const snap = await db.collection('posts').get();
  const posts = [];
  snap.forEach(doc => posts.push({ ...doc.data(), id: doc.id }));
  const sorted = posts.sort((a, b) =>
    ((b.likes?.length || 0) + (b.comments?.length || 0)) -
    ((a.likes?.length || 0) + (a.comments?.length || 0))
  ).slice(0, 10);
  const exploreFeed = document.getElementById('exploreFeed');
  exploreFeed.innerHTML = (!sorted || sorted.length === 0) ? `<div class="empty">Nothing trending yet.</div>` : '';
  sorted.forEach(post => exploreFeed.appendChild(createPostElement({ data: () => post, id: post.id })));
}

// ===== Profile Rendering =====
function renderProfile(username) {
  db.collection('posts').where('user', '==', username).limit(1).get().then(snap => {
    let user;
    if (!snap.empty) {
      const doc = snap.docs[0];
      user = {
        username: doc.data().user,
        displayName: doc.data().user,
        profilePic: 'https://placehold.co/74x74',
        bio: ''
      };
    } else {
      user = getUser();
    }
    const isSelf = (user.username === getUser().username);
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <img class="profile-pic" src="${user.profilePic}" />
      <div style="font-size:1.1rem;font-weight:700;color:#fff;margin:4px 0">${user.displayName}</div>
      <div style="color:#1da1f2;margin-bottom:4px;">${user.username}</div>
      <div style="font-size:.97rem;color:#aab4c1;margin-bottom:7px">${user.bio || ''}</div>
      ${isSelf ? `
        <input type="text" id="editDisplayName" placeholder="Display Name" value="${user.displayName}"/>
        <input type="text" id="editUsername" placeholder="@username" value="${user.username}"/>
        <input type="file" id="editPfp" accept="image/*" />
        <button class="tweet-btn" id="saveProfileBtn">Save Profile</button>
      ` : ``}
    `;
    const detail = document.getElementById('profileDetail');
    detail.innerHTML = '';
    detail.appendChild(card);
    document.getElementById('profilePostsTitle').innerText = isSelf ? 'Your Posts' : `${user.displayName}'s Posts`;
    renderProfilePosts(user.username);

    if (isSelf) {
      card.querySelector('#saveProfileBtn').onclick = function() {
        let u = getUser();
        u.displayName = card.querySelector('#editDisplayName').value.trim() || 'Anonymous';
        u.username = card.querySelector('#editUsername').value.trim() || '@anon';
        if (card.querySelector('#editPfp').files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
            u.profilePic = e.target.result;
            setUser(u);
            renderProfile(u.username);
          };
          reader.readAsDataURL(card.querySelector('#editPfp').files[0]);
          return;
        }
        setUser(u); renderProfile(u.username);
      };
    }
  });
}

// ===== Profile Posts =====
async function renderProfilePosts(username) {
  const snap = await db.collection('posts').where('user', '==', username).orderBy('created_at', 'desc').get();
  const profilePosts = document.getElementById('profilePosts');
  if (snap.empty) {
    profilePosts.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  profilePosts.innerHTML = '';
  snap.forEach(doc => profilePosts.appendChild(createPostElement(doc)));
}

// ====== Helpers: Post Element =====
function createPostElement(doc) {
  const post = doc.data();
  const postId = doc.id;
  const div = document.createElement('div');
  div.className = 'tweet';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="https://placehold.co/38x38" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.user}" style="font-weight:700;text-decoration:underline dotted #1976d2;cursor:pointer">${post.user}</span>
    </div>
    <div style="white-space:pre-line;margin-bottom:7px;">${post.content || ''}</div>
    <div class="tweet-footer">
      <button class="like-btn${post.likes && post.likes.includes(getUser().username) ? ' liked' : ''}" data-id="${postId}">❤️ ${post.likes ? post.likes.length : 0}</button>
      <button class="comment-btn" data-id="${postId}">💬 ${post.comments ? post.comments.length : 0}</button>
      <span style="color:#7a7;">${post.created_at ? new Date(post.created_at.seconds*1000).toLocaleString() : ''}</span>
    </div>
    <div class="comment-section" style="display:none"></div>
  `;
  // Profile click
  div.querySelector('.profile-link').onclick = function() {
    renderProfile(post.user);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-profile').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  };

  // Like button
  div.querySelector('.like-btn').onclick = async function() {
    const docRef = db.collection('posts').doc(postId);
    const docSnap = await docRef.get();
    let likes = docSnap.data().likes || [];
    const me = getUser().username;
    if (likes.includes(me)) likes = likes.filter(u => u !== me);
    else likes.push(me);
    await docRef.update({ likes });
    loadFeed();
    renderExplore();
  };

  // Comment button
  div.querySelector('.comment-btn').onclick = function() {
    const cmtSec = div.querySelector('.comment-section');
    cmtSec.style.display = cmtSec.style.display === 'block' ? 'none' : 'block';
    renderComments(postId, cmtSec);
  };
  return div;
}

// ===== Comments =====
function renderComments(postId, cmtSec) {
  db.collection('posts').doc(postId).get().then(docSnap => {
    const post = docSnap.data();
    cmtSec.innerHTML = '';
    (post.comments || []).forEach(cmt => {
      cmtSec.innerHTML += `<div class="comment"><b>${cmt.user}</b>: ${cmt.text}</div>`;
    });
    cmtSec.innerHTML += `
      <div class="add-comment">
        <input type="text" placeholder="Add a comment..." />
        <button>Post</button>
      </div>
    `;
    cmtSec.querySelector('button').onclick = async function() {
      const input = cmtSec.querySelector('input');
      if (input.value.trim() === '') return;
      const me = getUser();
      const cmt = { user: me.username, text: input.value.trim() };
      let comments = post.comments || [];
      comments.push(cmt);
      await db.collection('posts').doc(postId).update({ comments });
      renderComments(postId, cmtSec);
      loadFeed();
      renderExplore();
    };
  });
}
