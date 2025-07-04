// ===== Data Management =====
function getUser() {
  let user = JSON.parse(localStorage.getItem('twisterUser'));
  if (!user) {
    user = {
      username: '@anon',
      displayName: 'I can change my name in the profile tab!',
      profilePic: 'https://placehold.co/74x74',
      bio: '',
      following: []
    };
    localStorage.setItem('twisterUser', JSON.stringify(user));
  }
  return user;
}

function setUser(user) {
  localStorage.setItem('twisterUser', JSON.stringify(user));
}

function getAllUsers() {
  return JSON.parse(localStorage.getItem('twisterAllUsers') || '[]');
}
function setAllUsers(users) {
  localStorage.setItem('twisterAllUsers', JSON.stringify(users));
}
function saveOrUpdateUser(user) {
  let all = getAllUsers();
  const idx = all.findIndex(u => u.username === user.username);
  if (idx >= 0) all[idx] = user;
  else all.push(user);
  setAllUsers(all);
}

// ===== Page Navigation =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const section = btn.dataset.section;
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + section).classList.add('active');
      if (section === "profile") renderProfile(getUser().username);
      if (section === "home") renderFeed();
      if (section === "explore") renderExplore();
    });
  });

  // ===== Posting Logic (Text Only) =====
  const tweetButton = document.getElementById('tweetButton');
  const tweetText = document.getElementById('tweetText');
  tweetButton.addEventListener('click', () => {
    const text = tweetText.value.trim();
    if (!text) return;
    const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
    posts.unshift({
      id: Date.now(),
      username: getUser().username,
      displayName: getUser().displayName,
      profilePic: getUser().profilePic,
      text,
      likes: [],
      comments: [],
      created: new Date().toISOString(),
    });
    localStorage.setItem('twisterPosts', JSON.stringify(posts));
    tweetText.value = '';
    renderFeed();
    renderExplore();
  });

  // ===== Initial User/Feed Setup =====
  let me = getUser();
  let all = getAllUsers();
  if (!all.some(u => u.username === me.username)) all.push(me), setAllUsers(all);
  renderFeed();
  renderProfile(me.username);
  renderExplore();
});

// ===== Profile Logic =====
function renderProfile(username) {
  const user = username ? getAllUsers().find(u => u.username === username) || getUser() : getUser();
  const isSelf = user.username === getUser().username;
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.innerHTML = `
    <img class="profile-pic" src="${user.profilePic || 'https://placehold.co/74x74'}" />
    <div style="font-size:1.1rem;font-weight:700;color:#fff;margin:4px 0">${user.displayName || 'Anonymous'}</div>
    <div style="color:#1da1f2;margin-bottom:4px;">${user.username}</div>
    <div style="font-size:.97rem;color:#aab4c1;margin-bottom:7px">${user.bio || ''}</div>
    ${isSelf ? `
      <input type="text" id="editDisplayName" placeholder="Display Name" value="${user.displayName || ''}"/>
      <input type="text" id="editUsername" placeholder="@username" value="${user.username || ''}"/>
      <textarea id="editBio" placeholder="Bio">${user.bio || ''}</textarea>
      <input type="file" id="editPfp" accept="image/*" />
      <button class="tweet-btn" id="saveProfileBtn">Save Profile</button>
    ` : `
      <div class="profile-actions">
        <button id="followBtn" class="${getUser().following?.includes(user.username) ? 'following' : ''}">
          ${getUser().following?.includes(user.username) ? 'Following' : 'Follow'}
        </button>
      </div>
    `}
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
      u.bio = card.querySelector('#editBio').value.trim();
      if (card.querySelector('#editPfp').files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          u.profilePic = e.target.result;
          setUser(u); saveOrUpdateUser(u);
          renderProfile(u.username);
        };
        reader.readAsDataURL(card.querySelector('#editPfp').files[0]);
        return;
      }
      setUser(u); saveOrUpdateUser(u); renderProfile(u.username);
    };
  } else {
    card.querySelector('#followBtn').onclick = function() {
      let me = getUser();
      if (!me.following) me.following = [];
      if (me.following.includes(user.username)) {
        me.following = me.following.filter(f => f !== user.username);
      } else {
        me.following.push(user.username);
      }
      setUser(me);
      renderProfile(user.username);
    };
  }
}

// ===== Feed Logic with Likes, Comments, Profile Link =====
function renderFeed() {
  const feed = document.getElementById('feed');
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  feed.innerHTML = posts.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  for (const post of posts) {
    feed.appendChild(createPostElement(post));
  }
}

function createPostElement(post) {
  const div = document.createElement('div');
  div.className = 'tweet';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="${post.profilePic || 'https://placehold.co/38x38'}" alt="pfp" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.username}">${post.displayName}</span>
      <span style="color:#5ad;">${post.username}</span>
    </div>
    <div style="white-space:pre-line;margin-bottom:7px;">${post.text || ''}</div>
    <div class="tweet-footer">
      <button class="like-btn${post.likes && post.likes.includes(getUser().username) ? ' liked' : ''}" data-id="${post.id}">❤️ ${post.likes ? post.likes.length : 0}</button>
      <button class="comment-btn" data-id="${post.id}">💬 ${post.comments ? post.comments.length : 0}</button>
      <span style="color:#7a7;">${new Date(post.created).toLocaleString()}</span>
    </div>
    <div class="comment-section" style="display:none"></div>
  `;
  // Profile click
  div.querySelector('.profile-link').onclick = function() {
    showProfile(post.username);
  };

  // Like button
  div.querySelector('.like-btn').onclick = function() {
    let posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
    let idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      let likes = posts[idx].likes || [];
      const me = getUser().username;
      if (likes.includes(me)) likes = likes.filter(u => u !== me);
      else likes.push(me);
      posts[idx].likes = likes;
      localStorage.setItem('twisterPosts', JSON.stringify(posts));
      renderFeed();
      renderExplore();
    }
  };

  // Comment button
  div.querySelector('.comment-btn').onclick = function() {
    const cmtSec = div.querySelector('.comment-section');
    cmtSec.style.display = cmtSec.style.display === 'block' ? 'none' : 'block';
    renderComments(post.id, cmtSec);
  };
  return div;
}

function renderComments(postId, cmtSec) {
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  const idx = posts.findIndex(p => p.id === postId);
  if (idx < 0) return;
  cmtSec.innerHTML = '';
  (posts[idx].comments || []).forEach(cmt => {
    cmtSec.innerHTML += `<div class="comment"><b>${cmt.user}</b>: ${cmt.text}</div>`;
  });
  cmtSec.innerHTML += `
    <div class="add-comment">
      <input type="text" placeholder="Add a comment..." />
      <button>Post</button>
    </div>
  `;
  cmtSec.querySelector('button').onclick = function() {
    const input = cmtSec.querySelector('input');
    if (input.value.trim() === '') return;
    posts[idx].comments = posts[idx].comments || [];
    posts[idx].comments.push({ user: getUser().username, text: input.value.trim() });
    localStorage.setItem('twisterPosts', JSON.stringify(posts));
    renderComments(postId, cmtSec);
    renderFeed();
    renderExplore();
  };
}

// ===== Profile Posts =====
function renderProfilePosts(username) {
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  const userPosts = posts.filter(p => p.username === username);
  const profilePosts = document.getElementById('profilePosts');
  profilePosts.innerHTML = userPosts.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  userPosts.forEach(post => profilePosts.appendChild(createPostElement(post)));
}

// ===== Explore Logic (Trending by likes+comments) =====
function renderExplore() {
  const exploreFeed = document.getElementById('exploreFeed');
  let posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  posts = posts.slice().sort((a, b) =>
    ((b.likes ? b.likes.length : 0) + (b.comments ? b.comments.length : 0)) -
    ((a.likes ? a.likes.length : 0) + (a.comments ? a.comments.length : 0))
  ).slice(0, 10); // Top 10 trending
  exploreFeed.innerHTML = posts.length === 0 ? `<div class="empty">Nothing trending yet.</div>` : '';
  posts.forEach(post => exploreFeed.appendChild(createPostElement(post)));
}

// ===== View Any User Profile =====
function showProfile(username) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-profile').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  renderProfile(username);
}
