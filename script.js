import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const appEl = document.getElementById('app');

const pages = {
  feed: async () => {
    const postsRef = collection(window.firebaseDB, "posts");
    const q = query(postsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    appEl.innerHTML = `
      <div>
        <h2>Feed</h2>
        <textarea id="postContent" placeholder="What's on your mind?"></textarea>
        <button onclick="createPost()">Post</button>
        <div id="feedList"></div>
      </div>
    `;

    const feedList = document.getElementById('feedList');
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postEl = document.createElement("div");
      postEl.className = "post";
      postEl.innerHTML = `
        <p>${post.content}</p>
        <small>${new Date(post.timestamp).toLocaleString()}</small><br>
        <button>Like</button> <button>Dislike</button> <button>Comment</button> <button onclick="copyLink('${doc.id}')">Share</button>
      `;
      feedList.appendChild(postEl);
    });
  },

  discover: async () => {
    const postsRef = collection(window.firebaseDB, "posts");
    const q = query(postsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    appEl.innerHTML = `<h2>Discover</h2><div class="grid"></div>`;
    const grid = appEl.querySelector('.grid');

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `<p>${post.content}</p>`;
      grid.appendChild(div);
    });
  },

  messages: () => {
    appEl.innerHTML = `
      <h2>Messages</h2>
      <input type="text" placeholder="Enter username to message">
      <textarea placeholder="Type your message here..."></textarea>
      <button>Send</button>
    `;
  },

  pro: () => {
    appEl.innerHTML = `
      <h2>Pro</h2>
      <button class="pro-button">Basic</button>
      <button class="pro-button">Basic+</button>
      <button class="pro-button">Pro</button>
    `;
  },

  trending: async () => {
    const postsRef = collection(window.firebaseDB, "posts");
    const q = query(postsRef); // Modify this to order by "likes" once available
    const querySnapshot = await getDocs(q);

    appEl.innerHTML = `<h2>Trending</h2>`;
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `<p>${post.content}</p><small>Likes: ${post.likes || 0}</small>`;
      appEl.appendChild(div);
    });
  },

  settings: () => {
    appEl.innerHTML = `
      <h2>Settings</h2>
      <label>Change Name:</label><br><input type="text"><br>
      <label>Change Profile Picture URL:</label><br><input type="text"><br>
      <label><input type="checkbox" id="toggleMode"> Toggle Light Mode</label>
    `;

    document.getElementById("toggleMode").addEventListener("change", (e) => {
      document.body.style.background = e.target.checked ? "#fff" : "#000";
      document.body.style.color = e.target.checked ? "#000" : "#fff";
    });
  },

  post: () => {
    appEl.innerHTML = `
      <h2>Create a Post</h2>
      <div contenteditable="true" id="richPost" style="border:1px solid #333; padding:10px; min-height:100px;"></div>
      <div>
        <button onclick="document.execCommand('bold')">Bold</button>
        <button onclick="document.execCommand('underline')">Underline</button>
        <button onclick="document.execCommand('foreColor', false, 'red')">Red</button>
        <button onclick="document.execCommand('fontSize', false, '5')">Big</button>
        <button onclick="saveRichPost()">Post</button>
      </div>
    `;
  }
};

window.createPost = async () => {
  const content = document.getElementById('postContent').value;
  if (!content.trim()) return alert("Empty post!");

  const postsRef = collection(window.firebaseDB, "posts");
  await addDoc(postsRef, {
    content,
    timestamp: Date.now(),
    likes: 0
  });
 // Starter script
  location.hash = "#feed"; // refresh
};

window.copyLink = (id) => {
  const url = `${location.origin}/#post-${id}`;
  navigator.clipboard.writeText(url);
  alert("Link copied!");
};

window.saveRichPost = () => {
  const content = document.getElementById("richPost").innerHTML;
  document.getElementById("postContent").value = content;
  window.createPost();
};

window.onhashchange = () => {
  const page = location.hash.replace('#', '') || 'feed';
  if (pages[page]) pages[page]();
};

window.onload = () => {
  const page = location.hash.replace('#', '') || 'feed';
  if (pages[page]) pages[page]();
};
