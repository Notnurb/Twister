let posts = [];
let bookmarks = [];
let notifications = [];

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('section-' + btn.dataset.section).classList.add('active');
    renderSection(btn.dataset.section);
  });
});

document.getElementById('tweetButton').addEventListener('click', () => {
  const text = document.getElementById('tweetText').value.trim();
  if (!text) return;
  const post = {
    id: Date.now(),
    text,
    likes: 0,
    comments: [],
    replies: [],
    bookmarked: false
  };
  posts.unshift(post);
  notifications.push(`🔔 New post: "${text.slice(0, 30)}..."`);
  document.getElementById('tweetText').value = '';
  renderFeed();
});

function renderFeed() {
  const feed = document.getElementById('feed');
  feed.innerHTML = posts.length ? '' : '<div class="empty">No posts yet.</div>';
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'tweet';
    div.innerHTML = `
      <p>${p.text}</p>
      <div class="tweet-footer">
        <button onclick="like(${p.id})">❤️ ${p.likes}</button>
        <button onclick="comment(${p.id})">💬 ${p.comments.length}</button>
        <button onclick="reply(${p.id})">↩️ ${p.replies.length}</button>
        <button onclick="bookmark(${p.id})">${p.bookmarked ? '🔖 Saved' : '🔖 Save'}</button>
      </div>
      ${p.comments.map(c => `<div class="comment">💬 ${c}</div>`).join('')}
      ${p.replies.map(r => `<div class="reply">↩️ ${r}</div>`).join('')}
    `;
    feed.appendChild(div);
  });
}

function like(id) {
  const p = posts.find(x => x.id === id);
  if (p) {
    p.likes++;
    notifications.push(`❤️ Someone liked your post.`);
    renderFeed();
  }
}
function comment(id) {
  const text = prompt("Enter a comment:");
  if (!text) return;
  const p = posts.find(x => x.id === id);
  p.comments.push(text);
  notifications.push(`💬 Someone commented: "${text}"`);
  renderFeed();
}
function reply(id) {
  const text = prompt("Enter a reply:");
  if (!text) return;
  const p = posts.find(x => x.id === id);
  p.replies.push(text);
  notifications.push(`↩️ Someone replied: "${text}"`);
  renderFeed();
}
function bookmark(id) {
  const p = posts.find(x => x.id === id);
  p.bookmarked = !p.bookmarked;
  if (p.bookmarked) bookmarks.push(p);
  else bookmarks = bookmarks.filter(b => b.id !== id);
  renderFeed();
}

function renderSection(section) {
  if (section === 'notifications') {
    const el = document.getElementById('section-notifications');
    el.innerHTML = notifications.length
      ? notifications.map(n => `<p>${n}</p>`).join('')
      : '<div class="empty">No notifications yet.</div>';
  } else if (section === 'bookmarks') {
    const el = document.getElementById('section-bookmarks');
    el.innerHTML = bookmarks.length
      ? bookmarks.map(b => `<div class="tweet"><p>${b.text}</p></div>`).join('')
      : '<div class="empty">No bookmarks saved.</div>';
  } else if (section === 'profile') {
    loadProfile();
    renderProfilePosts();
  } else if (section === 'explore') {
    const el = document.getElementById('section-explore');
    const tags = Array.from(new Set(posts.flatMap(p => p.text.match(/#\\w+/g) || [])));
    el.innerHTML = tags.length
      ? tags.map(t => `<p>🔍 ${t}</p>`).join('')
      : '<div class="empty">No trending hashtags yet.</div>';
  }
}

function saveProfile() {
  const username = document.getElementById('username').value.trim();
  const displayName = document.getElementById('displayName').value.trim();
  const bio = document.getElementById('bio').value.trim();
  const newPfp = document.getElementById('newPfp').files[0];

  localStorage.setItem('username', username);
  localStorage.setItem('displayName', displayName);
  localStorage.setItem('bio', bio);

  if (newPfp) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('profilePic').src = e.target.result;
      localStorage.setItem('profilePic', e.target.result);
    };
    reader.readAsDataURL(newPfp);
  }
}

function loadProfile() {
  document.getElementById('username').value = localStorage.getItem('username') || '';
  document.getElementById('displayName').value = localStorage.getItem('displayName') || '';
  document.getElementById('bio').value = localStorage.getItem('bio') || '';
  document.getElementById('profilePic').src = localStorage.getItem('profilePic') || 'default-pfp.jpg';
}

function renderProfilePosts() {
  const el = document.getElementById('profilePosts');
  el.innerHTML = posts.length
    ? posts.map(p => `<div class="tweet"><p>${p.text}</p></div>`).join('')
    : '<div class="empty">You haven’t posted yet.</div>';
}

renderFeed();
