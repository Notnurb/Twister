// ---------- Supabase client setup ----------
const supabase = window.supabase.createClient(
  'https://YOUR-PROJECT.supabase.co',  // Replace with your Supabase project URL
  'YOUR-ANON-KEY' // Replace with your anon key
);

// ---------- User local profile (for demo only) ----------
function getUser() {
  let user = JSON.parse(localStorage.getItem('twisterUser'));
  if (!user) {
    user = {
      username: '@anon' + Math.floor(Math.random() * 10000),
      display_name: 'Anonymous',
      bio: '',
    };
    localStorage.setItem('twisterUser', JSON.stringify(user));
  }
  return user;
}
function setUser(user) {
  localStorage.setItem('twisterUser', JSON.stringify(user));
}

// ---------- Posting Handler ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tweetButton').onclick = async () => {
    const tweetText = document.getElementById('tweetText').value.trim();
    if (!tweetText) return;
    const me = getUser();
    const { error } = await supabase.from('posts').insert({
      user: me.username,
      content: tweetText,
    });
    if (!error) {
      document.getElementById('tweetText').value = '';
      loadFeed();
      renderExplore();
      renderProfile(me.username);
    }
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
      if (section === "messages") showMessagesSection();
    };
  });

  loadFeed();
  renderProfile(getUser().username);
  renderExplore();

  document.getElementById('createGroupBtn').onclick = () => createGroupChat();
});

// ---------- Load Feed ----------
async function loadFeed() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  const feed = document.getElementById('feed');
  if (!posts || posts.length === 0) {
    feed.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  feed.innerHTML = '';
  posts.forEach(post => feed.appendChild(createPostElement(post)));
}

// ---------- Explore (Trending by interactions) ----------
async function renderExplore() {
  const { data: posts } = await supabase.from('posts').select('*');
  if (!posts) return;
  const sorted = posts
    .sort((a, b) =>
      ((b.likes || 0) + (b.comments ? b.comments.length : 0)) -
      ((a.likes || 0) + (a.comments ? a.comments.length : 0))
    )
    .slice(0, 10);
  const exploreFeed = document.getElementById('exploreFeed');
  exploreFeed.innerHTML = (!sorted || sorted.length === 0)
    ? `<div class="empty">Nothing trending yet.</div>` : '';
  sorted.forEach(post => exploreFeed.appendChild(createPostElement(post)));
}

// ---------- Profile Rendering ----------
function renderProfile(username) {
  // For demo: just use local profile for self, else minimal info
  let user = getUser();
  const isSelf = (username === user.username);

  const card = document.createElement('div');
  card.className = 'profile-card';
  card.innerHTML = `
    <img class="profile-pic" src="https://placehold.co/80x80" />
    <div style="font-size:1.1rem;font-weight:700;color:#fff;margin:4px 0">${user.display_name}</div>
    <div style="color:#1da1f2;margin-bottom:4px;">${user.username}</div>
    <div style="font-size:.97rem;color:#aab4c1;margin-bottom:7px">${user.bio || ''}</div>
    ${isSelf ? `
      <input type="text" id="editDisplayName" placeholder="Display Name" value="${user.display_name}"/>
      <input type="text" id="editUsername" placeholder="@username" value="${user.username}"/>
      <button class="tweet-btn" id="saveProfileBtn">Save Profile</button>
    ` : `<button id="msgUserBtn" class="tweet-btn" style="margin-top:12px;">Message</button>`}
  `;
  const detail = document.getElementById('profileDetail');
  detail.innerHTML = '';
  detail.appendChild(card);
  document.getElementById('profilePostsTitle').innerText = isSelf ? 'Your Posts' : `${user.display_name}'s Posts`;
  renderProfilePosts(user.username);

  if (isSelf) {
    card.querySelector('#saveProfileBtn').onclick = function() {
      user.display_name = card.querySelector('#editDisplayName').value.trim() || 'Anonymous';
      user.username = card.querySelector('#editUsername').value.trim() || '@anon';
      setUser(user); renderProfile(user.username);
    };
  } else {
    card.querySelector('#msgUserBtn').onclick = async function() {
      await openOrCreateDM(getUser().username, username);
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-messages').classList.add('active');
      showMessagesSection();
    };
  }
}

// ---------- Profile Posts ----------
async function renderProfilePosts(username) {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user', username)
    .order('created_at', { ascending: false });
  const profilePosts = document.getElementById('profilePosts');
  if (!posts || posts.length === 0) {
    profilePosts.innerHTML = `<div class="empty">No posts yet.</div>`;
    return;
  }
  profilePosts.innerHTML = '';
  posts.forEach(post => profilePosts.appendChild(createPostElement(post)));
}

// ---------- Post Element Helper ----------
function createPostElement(post) {
  const div = document.createElement('div');
  div.className = 'tweet';
  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
      <img src="https://placehold.co/38x38" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
      <span class="profile-link" data-username="${post.user}" style="font-weight:700;text-decoration:underline dotted #1976d2;cursor:pointer">${post.user}</span>
    </div>
    <div style="white-space:pre-line;margin-bottom:7px;">${post.content || ''}</div>
    <div class="tweet-footer">
      <button class="like-btn" data-id="${post.id}">❤️ ${post.likes || 0}</button>
      <button class="comment-btn" data-id="${post.id}">💬 ${(post.comments || []).length}</button>
      <span style="color:#7a7;">${post.created_at ? new Date(post.created_at).toLocaleString() : ''}</span>
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
    // Very basic like logic: just +1 (no deduplication)
    await supabase
      .from('posts')
      .update({ likes: (post.likes || 0) + 1 })
      .eq('id', post.id);
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

// ---------- Comments ----------
function renderComments(postId, cmtSec) {
  supabase.from('posts').select('*').eq('id', postId).single().then(({ data: post }) => {
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
      let comments = post.comments || [];
      comments.push({ user: me.username, text: input.value.trim() });
      await supabase.from('posts').update({ comments }).eq('id', postId);
      renderComments(postId, cmtSec);
      loadFeed();
      renderExplore();
    };
  });
}

// ---------- MESSAGING SYSTEM ----------

async function showMessagesSection() {
  // List of your conversations
  const me = getUser().username;
  let { data: convos } = await supabase
    .from('conversations')
    .select('*')
    .contains('participants', [me]);
  const convoList = document.getElementById('convoList');
  convoList.innerHTML = '<h2>Chats</h2>';
  if (!convos || convos.length === 0) {
    convoList.innerHTML += '<div class="empty">No chats yet.</div>';
    return;
  }
  convos.forEach(convo => {
    const otherNames = (convo.participants.filter(u => u !== me)).join(', ');
    const name = convo.is_group ? (convo.name || 'Group Chat') : otherNames;
    const btn = document.createElement('button');
    btn.className = "tweet-btn";
    btn.style.margin = "6px 0";
    btn.textContent = name;
    btn.onclick = () => openConversation(convo.id, name);
    convoList.appendChild(btn);
  });
}

async function openOrCreateDM(me, otherUser) {
  // Look for existing DM
  let { data: convo, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participants', [me, otherUser])
    .eq('is_group', false)
    .maybeSingle();

  if (!convo) {
    // Create new
    const { data: newConvo } = await supabase
      .from('conversations')
      .insert([{ is_group: false, participants: [me, otherUser] }])
      .select()
      .maybeSingle();
    convo = newConvo;
  }
  openConversation(convo.id, otherUser);
}

async function openConversation(convoId, name) {
  document.getElementById('convoList').style.display = 'none';
  document.getElementById('chatWindow').style.display = 'block';
  document.getElementById('chatHeader').innerHTML = `<h3>${name || 'Chat'}</h3>`;
  // Load messages
  let { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', convoId)
    .order('sent_at', { ascending: true });

  const list = document.getElementById('messageList');
  list.innerHTML = '';
  (msgs || []).forEach(msg => {
    const div = document.createElement('div');
    div.style.margin = '6px 0';
    div.style.textAlign = msg.sender === getUser().username ? 'right' : 'left';
    div.innerHTML = `
      <span style="display:inline-block;max-width:66%;background:${msg.sender === getUser().username ? '#1da1f2' : '#252d38'};color:#fff;padding:7px 13px;border-radius:14px;">
        <b style="font-size:.93em;color:#b6eaff">${msg.sender !== getUser().username ? msg.sender : ''}</b>
        <span>${msg.content}</span>
      </span>
    `;
    list.appendChild(div);
  });

  document.getElementById('sendMsgBtn').onclick = async function() {
    const input = document.getElementById('msgInput');
    if (!input.value.trim()) return;
    await supabase.from('messages').insert([{
      conversation_id: convoId,
      sender: getUser().username,
      content: input.value.trim()
    }]);
    input.value = '';
    openConversation(convoId, name);
  };
}

function backToConvoList() {
  document.getElementById('convoList').style.display = '';
  document.getElementById('chatWindow').style.display = 'none';
  showMessagesSection();
}

// ---------- Group Chat ----------
async function createGroupChat() {
  const usernames = prompt('Enter usernames to add to group, separated by commas:');
  if (!usernames) return;
  const arr = usernames.split(',').map(u => u.trim()).filter(Boolean);
  if (arr.length < 2) return alert('Need at least 2 usernames for group chat!');
  const name = prompt('Enter group name:');
  const { data: convo } = await supabase
    .from('conversations')
    .insert([{ is_group: true, name, participants: [getUser().username, ...arr] }])
    .select()
    .single();
  openConversation(convo.id, name);
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-messages').classList.add('active');
  showMessagesSection();
}
