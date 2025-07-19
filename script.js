import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const app = document.getElementById('app');
const pages = {
  feed: renderFeed,
  discover: renderDiscover,
  messages: renderMessages,
  pro: renderPro,
  trending: renderTrending,
  settings: renderSettings,
  post: renderPostEditor
};

async function renderFeed() {
  app.innerHTML = `
    <h2>Feed</h2>
    <textarea id="newPost" placeholder="What's happening?"></textarea>
    <button class="primary" id="btnPost">Post</button>
    <div id="postList"></div>`;
  document.getElementById('btnPost').onclick = postPlain;
  await loadPosts('#postList', false);
}

async function renderDiscover() {
  app.innerHTML = `<h2>Discover</h2><div id="discoverGrid" class="grid"></div>`;
  await loadPosts('#discoverGrid', true);
}

function renderMessages() {
  app.innerHTML = `
    <h2>Messages</h2>
    <input id="msgUser" placeholder="Username" />
    <textarea id="msgContent" placeholder="Write a message..."></textarea>
    <button id="btnSend">Send</button>
    <div id="chatBox"></div>`;
  document.getElementById('btnSend').onclick = sendMessage;
}

function renderPro() {
  app.innerHTML = `
    <h2>Go Pro</h2>
    <div class="subscription-option">
      <div><strong>Basic</strong> – $5/month</div>
      <button>Choose Basic</button>
    </div>
    <div class="subscription-option">
      <div><strong>Basic+</strong> – $10/month</div>
      <button>Choose Basic+</button>
    </div>
    <div class="subscription-option">
      <div><strong>Pro</strong> – $20/month</div>
      <button>Choose Pro</button>
    </div>`;
}

async function renderTrending() {
  app.innerHTML = `<h2>Trending</h2><div id="trendingList"></div>`;
  await loadPosts('#trendingList', false, true);
}

function renderSettings() {
  app.innerHTML = `
    <h2>Settings</h2>
    <label>Name:</label><input id="userName" /><br/>
    <label>Profile pic URL:</label><input id="userPic" /><br/>
    <div class="toggle-switch"><input type="checkbox" id="modeToggle"/><label>Light Mode</label></div>`;
  document.getElementById('modeToggle').onchange = toggleMode;
}

function renderPostEditor() {
  app.innerHTML = `
    <h2>New Post</h2>
    <div class="editor-toolbar">
      <button onclick="document.execCommand('bold')"><b>B</b></button>
      <button onclick="document.execCommand('underline')"><u>U</u></button>
      <button onclick="document.execCommand('italic')"><i>I</i></button>
      <button onclick="document.execCommand('foreColor',false,'#e91e63')">Color</button>
      <button onclick="document.execCommand('fontSize',false,'5')">A+</button>
    </div>
    <div id="editor" contenteditable="true" class="surface" style="min-height:150px;"></div>
    <button class="primary" id="btnPublish">Publish</button>`;
  document.getElementById('btnPublish').onclick = postRich;
}

// Shared UI for posts
async function loadPosts(containerSel, threeColumn = false, sortByLikes = false) {
  const posts = await getDocs(query(
    collection(window.db, 'posts'),
    orderBy(sortByLikes ? 'likes' : 'timestamp', sortByLikes ? 'desc' : 'desc')
  ));
  const container = document.querySelector(containerSel);
  container.innerHTML = '';
  posts.forEach(docSnap => {
    const p = docSnap.data();
    const d = document.createElement('div');
    d.className = 'post';
    d.innerHTML = `
      <div class="meta">${new Date(p.timestamp).toLocaleString()}</div>
      <div class="content">${p.content}</div>
      <div class="actions">
        <button onclick="react('${docSnap.id}', 'likes')">👍 ${p.likes||0}</button>
        <button onclick="react('${docSnap.id}', 'dislikes')">👎 ${p.dislikes||0}</button>
      </div>`;
    container.appendChild(d);
  });
}

async function postPlain() {
  const txt = document.getElementById('newPost').value.trim();
  if (!txt) return alert('Please write something.');
  await addDoc(collection(window.db, 'posts'), { content: txt, timestamp: Date.now(), likes: 0, dislikes: 0 });
  renderFeed();
}

async function postRich() {
  const html = document.getElementById('editor').innerHTML.trim();
  if (!html) return alert('Write something first.');
  await addDoc(collection(window.db, 'posts'), { content: html, timestamp: Date.now(), likes: 0, dislikes: 0 });
  location.hash = '#feed';
}

async function react(id, field) {
  const ref = doc(window.db, 'posts', id);
  const snap = await getDocs(query(collection(window.db,'posts'), orderBy('timestamp'))); // simplified
  const delta = (field === 'likes') ? 1 : 1;
  await updateDoc(ref, { [field]: (snap.data()?.[field] ?? 0) + delta });
  renderTrending();
}

function sendMessage() {
  alert('Messaging system coming soon – add Firestore/DB logic here!');
}

function toggleMode(e) {
  document.body.style.background = e.target.checked ? '#fff' : null;
  document.body.style.color = e.target.checked ? '#000' : null;
}

window.onhashchange = () => pages[location.hash.slice(1) || 'feed']();
window.onload = () => pages[location.hash.slice(1) || 'feed']();
