// Use the global supabase client (set in index.html)
const supabase = window.supabaseClient;

// Simple user profile (feel free to expand)
function getUser() {
  let user = JSON.parse(localStorage.getItem('twisterUser'));
  if (!user) {
    user = {
      username: '@anon' + Math.floor(Math.random() * 10000),
      displayName: 'Anonymous',
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

// ===== Posting Handler =====
document.addEventListener('DOMContentLoaded', () => {
  // Home Posting
  document.getElementById('tweetButton').onclick = async () => {
    const tweetText = document.getElementById('tweetText').value.trim();
    if (!tweetText) return;
    const me = getUser();
    const post = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      username: me.username,
      displayName: me.displayName,
      profilePic: me.profilePic,
      text: tweetText,
      created: new Date().toISOString(),
      likes: [],
      comments: []
    };
    await supabase.from('posts').insert([post]);
    document.getElementById('tweetText').value = '';
    loadFeed();
    renderExplore();
    renderProfile(me.username);
  };

  // Nav
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

  // On start
  loadFeed();
  renderProfile(getUser().username);
  renderExplore();
});

// ===== Load Feed from Supabase =====
async function loadFeed() {
  const { data, error } = await supabase.from('posts').select('*').order('created', { ascending: false });
  const feed = document.getElementById('feed');
  if (error) {
    feed.innerHTML = `<div class="empty">Error loading posts.</div>`;
    return;
  }
  feed.innerHTML = data.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  for (const post of data) feed.appendChild(createPostElement(post));
}

// ===== Explore (Trending by interactions) =====
async function renderExplore() {
  const { data } = await supabase.from('posts').select('*');
  const sorted = (data || []).slice().sort((a, b) =>
    ((b.likes?.length || 0) + (b.comments?.length || 0)) -
    ((a.likes?.length || 0) + (a.comments?.length || 0))
  ).slice(0, 10);
  const exploreFeed = document.getElementById('exploreFeed');
  exploreFeed.innerHTML = sorted.length === 0 ? `<div class="empty">Nothing trending yet.</div>` : '';
  sorted.forEach(post => exploreFeed.appendChild(createPostElement(post)));
}

// ===== Profile Rendering =====
function renderProfile(username) {
  // Find user by username from posts (for demo, normally you'd have a users table)
  supabase.from('posts').select('*').eq('username', username).limit(1).then(({ data }) => {
    let user;
    if (data && data.length > 0) {
      user = {
        username: data[0].username,
        displayName: data[0].displayName,
        profilePic: data[0].profilePic,
        bio: '', // can add bio support later
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
  const { data } = await supabase.from('posts').select('*').eq('username', username).order('created', { ascending: false });
  const profilePosts = document.getElementById('profilePosts');
  profilePosts.innerHTML = data.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  data.forEach(post => profilePosts.appendChild(createPostElement(post)));
}

// ====== Helpers: Post Element =====
function createPostElement(post) {
  const div = document.createElement('div');
  div.className = 'tweet';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="${post.profilePic}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.username}" style="font-weight:700;text-decoration:underline dotted #1976d2;cursor:pointer">${post.displayName}</span>
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
    renderProfile(post.username);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-profile').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  };

  // Like button
  div.querySelector('.like-btn').onclick = async function() {
    let { data: curr } = await supabase.from('posts').select('*').eq('id', post.id).single();
    if (!curr) return;
    let likes = curr.likes || [];
    const me = getUser().username;
    if (likes.includes(me)) likes = likes.filter(u => u !== me);
    else likes.push(me);
    await supabase.from('posts').update({ likes }).eq('id', post.id);
    loadFeed();
    renderExplore();
  };

  // Comment button
  div.querySelector('.comment-btn').onclick = function() {
    const cmtSec = div.querySelector('.comment-section');
    cmtSec.style.display = cmtSec.style.display === 'block' ? 'none' : 'block';
    renderComments(post.id, cmtSec);
  };
  return div;
}

// ===== Comments =====
function renderComments(postId, cmtSec) {
  supabase.from('posts').select('*').eq('id', postId).single().then(({ data }) => {
    cmtSec.innerHTML = '';
    (data.comments || []).forEach(cmt => {
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
      const cmt = { user: getUser().username, text: input.value.trim() };
      const postResp = await supabase.from('posts').select('*').eq('id', postId).single();
      let comments = postResp.data.comments || [];
      comments.push(cmt);
      await supabase.from('posts').update({ comments }).eq('id', postId);
      renderComments(postId, cmtSec);
      loadFeed();
      renderExplore();
    };
  });
}
