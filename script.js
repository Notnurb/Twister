// ========== BASIC TWISTER SINGLE-PAGE LOGIC (NO AUTH, LOCAL STORAGE) ==========

// Navigation: Switch sections on sidebar click
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const section = btn.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + section).classList.add('active');
    if (section === "profile") renderProfile();
    if (section === "home") renderFeed();
  });
});

// ------------- PROFILE LOGIC -------------
function saveProfile() {
  const displayName = document.getElementById('displayName').value.trim();
  const username = document.getElementById('username').value.trim();
  const bio = document.getElementById('bio').value.trim();
  const profilePicFile = document.getElementById('newPfp').files[0];
  let profilePicUrl = localStorage.getItem('profilePic') || 'https://placehold.co/80x80';

  if (profilePicFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      localStorage.setItem('profilePic', e.target.result);
      document.getElementById('profilePic').src = e.target.result;
    };
    reader.readAsDataURL(profilePicFile);
    profilePicUrl = ""; // Will be set when loaded
  }

  localStorage.setItem('displayName', displayName || 'Anonymous');
  localStorage.setItem('username', username || '@anon');
  localStorage.setItem('bio', bio);

  alert('Profile saved!');
  renderProfile();
}

// Render Profile Page Data
function renderProfile() {
  document.getElementById('profilePic').src = localStorage.getItem('profilePic') || 'https://placehold.co/80x80';
  document.getElementById('displayName').value = localStorage.getItem('displayName') || '';
  document.getElementById('username').value = localStorage.getItem('username') || '';
  document.getElementById('bio').value = localStorage.getItem('bio') || '';
  renderUserPosts();
}

// ------------- POSTING LOGIC -------------
const tweetButton = document.getElementById('tweetButton');
const tweetText = document.getElementById('tweetText');
const mediaInput = document.getElementById('mediaInput');
const mediaPreview = document.getElementById('mediaPreview');
let selectedMediaFile = null;

mediaInput.addEventListener('change', () => {
  mediaPreview.innerHTML = '';
  selectedMediaFile = null;
  if (mediaInput.files && mediaInput.files[0]) {
    selectedMediaFile = mediaInput.files[0];
    const file = selectedMediaFile;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      mediaPreview.innerHTML = `<img src="${url}" alt="preview" style="max-width:140px;max-height:90px;">`;
    } else if (file.type.startsWith('video/')) {
      mediaPreview.innerHTML = `<video src="${url}" controls style="max-width:140px;max-height:90px;"></video>`;
    }
  }
});

// On Post button click, add post to localStorage & re-render feed
tweetButton.addEventListener('click', () => {
  const text = tweetText.value.trim();
  if (!text && !selectedMediaFile) return;

  // Save media as Data URL in localStorage (for demo, not for real apps!)
  let mediaDataUrl = null, mediaType = null;
  if (selectedMediaFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      mediaDataUrl = e.target.result;
      mediaType = selectedMediaFile.type;
      savePost(text, mediaDataUrl, mediaType);
      tweetText.value = '';
      mediaPreview.innerHTML = '';
      mediaInput.value = '';
      selectedMediaFile = null;
    };
    reader.readAsDataURL(selectedMediaFile);
    return; // Wait for async read
  } else {
    savePost(text, null, null);
    tweetText.value = '';
    mediaPreview.innerHTML = '';
    mediaInput.value = '';
    selectedMediaFile = null;
  }
});

function savePost(text, mediaUrl, mediaType) {
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  posts.unshift({
    id: Date.now(),
    displayName: localStorage.getItem('displayName') || 'Anonymous',
    username: localStorage.getItem('username') || '@anon',
    profilePic: localStorage.getItem('profilePic') || 'https://placehold.co/80x80',
    text,
    mediaUrl,
    mediaType,
    created: new Date().toISOString()
  });
  localStorage.setItem('twisterPosts', JSON.stringify(posts));
  renderFeed();
}

// ------------- FEED LOGIC -------------

function renderFeed() {
  const feed = document.getElementById('feed');
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  feed.innerHTML = posts.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  for (const post of posts) {
    let mediaHtml = '';
    if (post.mediaUrl && post.mediaType) {
      if (post.mediaType.startsWith('image/')) {
        mediaHtml = `<img src="${post.mediaUrl}" alt="media" style="max-width:320px;max-height:180px;border-radius:9px;margin-top:9px;">`;
      } else if (post.mediaType.startsWith('video/')) {
        mediaHtml = `<video src="${post.mediaUrl}" controls style="max-width:320px;max-height:180px;border-radius:9px;margin-top:9px;"></video>`;
      }
    }
    feed.innerHTML += `
      <div class="tweet">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">
          <img src="${post.profilePic}" alt="pfp" style="width:38px;height:38px;border-radius:50%;object-fit:cover;">
          <strong>${post.displayName || 'Anonymous'}</strong>
          <span style="color:#5ad;">${post.username || '@anon'}</span>
        </div>
        <div style="white-space:pre-line;">${post.text || ''}</div>
        ${mediaHtml}
        <div class="tweet-footer">
          <span style="color:#7a7;">${new Date(post.created).toLocaleString()}</span>
        </div>
      </div>
    `;
  }
}

// ------------- PROFILE POSTS -------------
function renderUserPosts() {
  const profilePosts = document.getElementById('profilePosts');
  const posts = JSON.parse(localStorage.getItem('twisterPosts') || '[]');
  const userName = localStorage.getItem('username') || '@anon';
  const userPosts = posts.filter(p => p.username === userName);
  profilePosts.innerHTML = userPosts.length === 0 ? `<div class="empty">No posts yet.</div>` : '';
  for (const post of userPosts) {
    let mediaHtml = '';
    if (post.mediaUrl && post.mediaType) {
      if (post.mediaType.startsWith('image/')) {
        mediaHtml = `<img src="${post.mediaUrl}" alt="media" style="max-width:320px;max-height:180px;border-radius:9px;margin-top:9px;">`;
      } else if (post.mediaType.startsWith('video/')) {
        mediaHtml = `<video src="${post.mediaUrl}" controls style="max-width:320px;max-height:180px;border-radius:9px;margin-top:9px;"></video>`;
      }
    }
    profilePosts.innerHTML += `
      <div class="tweet">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">
          <img src="${post.profilePic}" alt="pfp" style="width:38px;height:38px;border-radius:50%;object-fit:cover;">
          <strong>${post.displayName || 'Anonymous'}</strong>
          <span style="color:#5ad;">${post.username || '@anon'}</span>
        </div>
        <div style="white-space:pre-line;">${post.text || ''}</div>
        ${mediaHtml}
        <div class="tweet-footer">
          <span style="color:#7a7;">${new Date(post.created).toLocaleString()}</span>
        </div>
      </div>
    `;
  }
}

// -------- INITIAL LOAD ---------
window.addEventListener('DOMContentLoaded', () => {
  renderFeed();
  renderProfile();
});

