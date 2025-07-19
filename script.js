const mainContent = document.getElementById("main-content");
const navButtons = document.querySelectorAll("nav button");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    loadPage(btn.dataset.page);
  });
});

async function loadPage(page) {
  switch (page) {
    case "feed":
      renderFeed();
      break;
    case "discover":
      renderDiscover();
      break;
    case "messages":
      renderMessages();
      break;
    case "pro":
      renderPro();
      break;
    case "trending":
      renderTrending();
      break;
    case "settings":
      renderSettings();
      break;
    case "post":
      renderPost();
      break;
  }
}

async function renderFeed() {
  mainContent.innerHTML = `
    <h1>Feed</h1>
    <textarea id="new-post" placeholder="What's happening?"></textarea>
    <button onclick="createPost()">Post</button>
    <div id="posts"></div>
  `;

  const db = window.db;
  const { collection, getDocs, addDoc, serverTimestamp, query, orderBy } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const postsContainer = document.getElementById("posts");

  querySnapshot.forEach(doc => {
    const data = doc.data();
    const postEl = document.createElement("div");
    postEl.className = "post";
    postEl.innerHTML = `<p>${data.content}</p><small>${new Date(data.timestamp?.seconds * 1000).toLocaleString()}</small>`;
    postsContainer.appendChild(postEl);
  });
}

async function createPost() {
  const content = document.getElementById("new-post").value;
  if (!content) return;

  const db = window.db;
  const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");

  await addDoc(collection(db, "posts"), {
    content,
    timestamp: serverTimestamp()
  });

  loadPage("feed");
}

function renderDiscover() {
  mainContent.innerHTML = `<h1>Discover</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;"></div>`;
  // Use same logic as feed to show posts in 3-column format.
}

function renderMessages() {
  mainContent.innerHTML = `
    <h1>Messages</h1>
    <input placeholder="Type a username to message..." />
    <div id="message-area">Messages will appear here.</div>
  `;
}

function renderPro() {
  mainContent.innerHTML = `
    <h1>Pro</h1>
    <div class="pro-tier">
      <button>Basic</button>
      <button>Basic+</button>
      <button>Pro</button>
    </div>
  `;
}

function renderTrending() {
  mainContent.innerHTML = `<h1>Trending</h1>`;
  // Same logic as feed, but sort by like count (to be implemented)
}

function renderSettings() {
  mainContent.innerHTML = `
    <h1>Settings</h1>
    <label>Change Name: <input type="text" /></label><br/><br/>
    <label>Change Profile Picture: <input type="file" /></label><br/><br/>
    <button onclick="toggleDarkMode()">Toggle Light Mode</button>
  `;
}

function renderPost() {
  mainContent.innerHTML = `
    <h1>Post</h1>
    <textarea style="height:200px;"></textarea><br/>
    <button>Bold</button>
    <button>Underline</button>
    <button>Color</button>
    <button>Size</button>
    <button>Highlight</button>
  `;
}

function toggleDarkMode() {
  const body = document.body;
  const isDark = body.style.backgroundColor === "black" || !body.style.backgroundColor;
  body.style.backgroundColor = isDark ? "white" : "black";
  body.style.color = isDark ? "black" : "white";
}
