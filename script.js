const feed = document.getElementById("feed");
let localUser = {
  username: localStorage.getItem("username") || "@anon",
  displayName: localStorage.getItem("displayName") || "Anonymous",
  bio: localStorage.getItem("bio") || "",
  profilePic: localStorage.getItem("profilePic") || "https://via.placeholder.com/80",
};
let bookmarkedIDs = JSON.parse(localStorage.getItem("bookmarkedIDs") || "[]");

// Sidebar navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("section-" + btn.dataset.section).classList.add("active");
    if (btn.dataset.section === "profile") renderProfile();
    if (btn.dataset.section === "bookmarks") renderBookmarks();
  };
});

// Posting
document.getElementById("tweetButton").onclick = async () => {
  const text = document.getElementById("tweetText").value.trim();
  if (!text) return;
  await db.collection("posts").add({
    text,
    likes: 0,
    dislikes: 0,
    comments: [],
    replies: [],
    timestamp: Date.now(),
    author: localUser
  });
  document.getElementById("tweetText").value = "";
};

// Real-time post feed
function renderFeed() {
  db.collection("posts")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      feed.innerHTML = "";
      if (snapshot.empty) {
        feed.innerHTML = "<div class='empty'>No posts yet.</div>";
        return;
      }
      snapshot.forEach(doc => {
        const post = doc.data();
        const id = doc.id;
        feed.innerHTML += renderPostHTML(post, id);
      });
    });
}

// Create post HTML
function renderPostHTML(post, id) {
  const isBookmarked = bookmarkedIDs.includes(id);
  return `
    <div class="tweet">
      <strong>${post.author.displayName}</strong> <span style="color:#888;">${post.author.username}</span>
      <p>${post.text}</p>
      <div class="tweet-footer">
        <button onclick="like('${id}')">❤️ ${post.likes}</button>
        <button onclick="dislike('${id}')">👎 ${post.dislikes}</button>
        <button onclick="comment('${id}')">💬 ${post.comments.length}</button>
        <button onclick="reply('${id}')">↩️ ${post.replies.length}</button>
        <button onclick="toggleBookmark('${id}')">${isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</button>
      </div>
      ${post.comments.map(c => `<div class="comment">💬 ${c}</div>`).join('')}
      ${post.replies.map(r => `<div class="reply">↩️ ${r}</div>`).join('')}
    </div>
  `;
}

// Interaction handlers
async function like(id) {
  const ref = db.collection("posts").doc(id);
  await ref.update({ likes: firebase.firestore.FieldValue.increment(1) });
}
async function dislike(id) {
  const ref = db.collection("posts").doc(id);
  await ref.update({ dislikes: firebase.firestore.FieldValue.increment(1) });
}
async function comment(id) {
  const text = prompt("Enter a comment:");
  if (!text) return;
  const ref = db.collection("posts").doc(id);
  await ref.update({ comments: firebase.firestore.FieldValue.arrayUnion(text) });
}
async function reply(id) {
  const text = prompt("Enter a reply:");
  if (!text) return;
  const ref = db.collection("posts").doc(id);
  await ref.update({ replies: firebase.firestore.FieldValue.arrayUnion(text) });
}

// Bookmarks
function toggleBookmark(id) {
  if (bookmarkedIDs.includes(id)) {
    bookmarkedIDs = bookmarkedIDs.filter(x => x !== id);
  } else {
    bookmarkedIDs.push(id);
  }
  localStorage.setItem("bookmarkedIDs", JSON.stringify(bookmarkedIDs));
  renderFeed();
}

function renderBookmarks() {
  const el = document.getElementById("section-bookmarks");
  el.innerHTML = "<div class='feed'></div>";
  const container = el.querySelector(".feed");
  if (bookmarkedIDs.length === 0) {
    container.innerHTML = "<div class='empty'>No bookmarks saved.</div>";
    return;
  }
  bookmarkedIDs.forEach(id => {
    db.collection("posts").doc(id).get().then(doc => {
      if (doc.exists) {
        container.innerHTML += renderPostHTML(doc.data(), id);
      }
    });
  });
}

// Profile management
function saveProfile() {
  const username = document.getElementById("username").value || "@anon";
  const displayName = document.getElementById("displayName").value || "Anonymous";
  const bio = document.getElementById("bio").value;
  const pfpFile = document.getElementById("newPfp").files[0];

  localStorage.setItem("username", username);
  localStorage.setItem("displayName", displayName);
  localStorage.setItem("bio", bio);

  if (pfpFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("profilePic", e.target.result);
      document.getElementById("profilePic").src = e.target.result;
    };
    reader.readAsDataURL(pfpFile);
  }

  localUser = {
    username,
    displayName,
    bio,
    profilePic: localStorage.getItem("profilePic") || "https://via.placeholder.com/80"
  };
}

function renderProfile() {
  document.getElementById("username").value = localUser.username;
  document.getElementById("displayName").value = localUser.displayName;
  document.getElementById("bio").value = localUser.bio;
  document.getElementById("profilePic").src = localUser.profilePic;

  const container = document.getElementById("profilePosts");
  container.innerHTML = "";

  db.collection("posts")
    .where("author.username", "==", localUser.username)
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        container.innerHTML = "<div class='empty'>You haven’t posted yet.</div>";
        return;
      }
      snapshot.forEach(doc => {
        container.innerHTML += renderPostHTML(doc.data(), doc.id);
      });
    });
}

renderFeed();
