import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  increment,
  where,
  getDocs,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

// ======= SETUP =======
const SUPABASE_URL = "https://iajztbvoyugbbcrouppm.supabase.co";
const SUPABASE_ANON_KEY = "your_key_here"; // insert your key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = getApp();
const db = getFirestore(app);

let localUser = {
  username: localStorage.getItem("username") || "@anon",
  displayName: localStorage.getItem("displayName") || "Anonymous",
  bio: localStorage.getItem("bio") || "",
  profilePic: localStorage.getItem("profilePic") || "https://via.placeholder.com/80",
};

let bookmarkedIDs = JSON.parse(localStorage.getItem("bookmarkedIDs") || "[]");

let selectedMediaFile = null;
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");

mediaInput?.addEventListener("change", () => {
  mediaPreview.innerHTML = "";
  selectedMediaFile = null;
  if (mediaInput.files && mediaInput.files[0]) {
    selectedMediaFile = mediaInput.files[0];
    const url = URL.createObjectURL(selectedMediaFile);
    if (selectedMediaFile.type.startsWith("image/")) {
      mediaPreview.innerHTML = `<img src="${url}" alt="preview" />`;
    } else if (selectedMediaFile.type.startsWith("video/")) {
      mediaPreview.innerHTML = `<video src="${url}" controls />`;
    }
  }
});

// ======= NAVIGATION =======
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    const section = document.getElementById("section-" + btn.dataset.section);
    section?.classList.add("active");

    if (btn.dataset.section === "profile") renderProfile();
    if (btn.dataset.section === "bookmarks") renderBookmarks();
    if (btn.dataset.section === "explore") renderExplore();
  };
});

// ======= POSTING =======
document.getElementById("tweetButton")?.addEventListener("click", async () => {
  const text = document.getElementById("tweetText").value.trim();
  if (!text && !selectedMediaFile) return;

  let mediaURL = null;
  let mediaType = null;

  if (selectedMediaFile) {
    const postId = "post_" + Date.now();
    const ext = selectedMediaFile.name.split('.').pop();
    const filePath = `media/${postId}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(filePath, selectedMediaFile);
    if (error) return alert("Upload failed: " + error.message);

    mediaURL = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
    mediaType = selectedMediaFile.type.startsWith("image/") ? "image" : "video";
  }

  await addDoc(collection(db, "posts"), {
    text,
    timestamp: Date.now(),
    likes: 0,
    dislikes: 0,
    comments: [],
    replies: [],
    mediaURL,
    mediaType,
    author: localUser
  });

  document.getElementById("tweetText").value = "";
  mediaInput.value = "";
  mediaPreview.innerHTML = "";
  selectedMediaFile = null;
});

// ======= POST RENDERING =======
function renderFeed() {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    const feed = document.getElementById("feed");
    feed.innerHTML = snapshot.empty ? "<div class='empty'>No posts yet.</div>" : "";
    snapshot.forEach(doc => feed.innerHTML += renderPostHTML(doc.data(), doc.id));
  });
}

function renderPostHTML(post, id) {
  const isBookmarked = bookmarkedIDs.includes(id);
  const media =
    post.mediaURL && post.mediaType === "image" ? `<img src="${post.mediaURL}" style="max-width:100%; border-radius:12px; margin-top:8px;" />` :
    post.mediaURL && post.mediaType === "video" ? `<video src="${post.mediaURL}" controls style="max-width:100%; border-radius:12px; margin-top:8px;"></video>` : "";

  return `
    <div class="tweet">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <img src="${post.author.profilePic}" class="profile-pic" style="width:40px; height:40px;" />
        <div>
          <strong>${post.author.displayName}</strong><br/>
          <span style="color:#888;">${post.author.username}</span>
        </div>
      </div>
      <p>${post.text || ""}</p>
      ${media}
      <div class="tweet-footer">
        <button onclick="like('${id}')">❤️ ${post.likes}</button>
        <button onclick="dislike('${id}')">👎 ${post.dislikes}</button>
        <button onclick="commentPrompt('${id}')">💬 ${post.comments.length}</button>
        <button onclick="replyPrompt('${id}')">↩️ ${post.replies.length}</button>
        <button onclick="toggleBookmark('${id}')">${isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</button>
      </div>
    </div>
  `;
}

// ======= EXPLORE PAGE =======
function renderExplore() {
  document.getElementById("exploreUsername").innerText = localUser.username;
  document.getElementById("exploreProfilePic").src = localUser.profilePic;

  const forYou = document.getElementById("exploreForYou");
  const trending = document.getElementById("exploreTrending");
  const news = document.getElementById("exploreNews");
  const yourPosts = document.getElementById("exploreYourPosts");

  forYou.innerHTML = trending.innerHTML = news.innerHTML = yourPosts.innerHTML = "<span>Loading...</span>";

  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  getDocs(q).then(snapshot => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    forYou.innerHTML = posts.slice(0, 3).map(p => renderPostHTML(p, p.id)).join("");
    trending.innerHTML = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3).map(p => renderPostHTML(p, p.id)).join("");
    news.innerHTML = posts.slice(0, 3).map(p => renderPostHTML(p, p.id)).join("");

    const mine = posts.filter(p => p.author.username === localUser.username);
    yourPosts.innerHTML = mine.length ? mine.map(p => renderPostHTML(p, p.id)).join("") : "<div class='empty'>You haven’t posted yet.</div>";
  });
}

// ======= PROFILE + SAVE =======
window.saveProfile = () => {
  const username = document.getElementById("username").value || "@anon";
  const displayName = document.getElementById("displayName").value || "Anonymous";
  const bio = document.getElementById("bio").value;
  const file = document.getElementById("newPfp").files[0];

  localStorage.setItem("username", username);
  localStorage.setItem("displayName", displayName);
  localStorage.setItem("bio", bio);

  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      localStorage.setItem("profilePic", e.target.result);
      document.getElementById("profilePic").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  localUser = {
    username,
    displayName,
    bio,
    profilePic: localStorage.getItem("profilePic") || "https://via.placeholder.com/80"
  };
};

function renderProfile() {
  document.getElementById("username").value = localUser.username;
  document.getElementById("displayName").value = localUser.displayName;
  document.getElementById("bio").value = localUser.bio;
  document.getElementById("profilePic").src = localUser.profilePic;

  const container = document.getElementById("profilePosts");
  container.innerHTML = "";

  const q = query(collection(db, "posts"), where("author.username", "==", localUser.username), orderBy("timestamp", "desc"));
  getDocs(q).then(snapshot => {
    if (snapshot.empty) {
      container.innerHTML = "<div class='empty'>You haven’t posted yet.</div>";
    } else {
      snapshot.forEach(doc => container.innerHTML += renderPostHTML(doc.data(), doc.id));
    }
  });
}

// ======= BOOKMARKS =======
window.toggleBookmark = id => {
  if (bookmarkedIDs.includes(id)) {
    bookmarkedIDs = bookmarkedIDs.filter(x => x !== id);
  } else {
    bookmarkedIDs.push(id);
  }
  localStorage.setItem("bookmarkedIDs", JSON.stringify(bookmarkedIDs));
  renderFeed();
};

function renderBookmarks() {
  const container = document.getElementById("section-bookmarks");
  container.innerHTML = "<div class='feed'></div>";
  const feed = container.querySelector(".feed");

  if (!bookmarkedIDs.length) {
    feed.innerHTML = "<div class='empty'>No bookmarks saved.</div>";
    return;
  }

  bookmarkedIDs.forEach(async id => {
    const snap = await getDoc(doc(db, "posts", id));
    if (snap.exists()) {
      feed.innerHTML += renderPostHTML(snap.data(), id);
    }
  });
}

// ======= LIKE / COMMENT / REPLY =======
window.like = async id => await updateDoc(doc(db, "posts", id), { likes: increment(1) });
window.dislike = async id => await updateDoc(doc(db, "posts", id), { dislikes: increment(1) });

window.commentPrompt = async id => {
  const text = prompt("Comment:");
  if (text) await updateDoc(doc(db, "posts", id), { comments: arrayUnion(text) });
};

window.replyPrompt = async id => {
  const text = prompt("Reply:");
  if (text) await updateDoc(doc(db, "posts", id), { replies: arrayUnion(text) });
};

// Start
renderFeed();
