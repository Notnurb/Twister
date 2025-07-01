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
  
  // ----- SUPABASE CONFIG -----
  const SUPABASE_URL = "https://iajztbvoyugbbcrouppm.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhanp0YnZveXVnYmJjcm91cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTA4NjIsImV4cCI6MjA2Njg2Njg2Mn0.0DdBIpNFIUsAH1-M9NcfmKHnwv2XOc0TEk0flrq7H0I";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // ----- FIRESTORE CONFIG -----
  const app = getApp();
  const db = getFirestore(app);
  
  const feed = document.getElementById("feed");
  let localUser = {
    username: localStorage.getItem("username") || "@anon",
    displayName: localStorage.getItem("displayName") || "Anonymous",
    bio: localStorage.getItem("bio") || "",
    profilePic: localStorage.getItem("profilePic") || "https://via.placeholder.com/80",
  };
  let bookmarkedIDs = JSON.parse(localStorage.getItem("bookmarkedIDs") || "[]");
  
  const mediaInput = document.getElementById("mediaInput");
  const mediaPreview = document.getElementById("mediaPreview");
  let selectedMediaFile = null;
  
  mediaInput.addEventListener("change", () => {
    mediaPreview.innerHTML = "";
    selectedMediaFile = null;
    if (mediaInput.files && mediaInput.files[0]) {
      selectedMediaFile = mediaInput.files[0];
      const file = selectedMediaFile;
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        mediaPreview.innerHTML = `<img src="${url}" alt="preview" />`;
      } else if (file.type.startsWith("video/")) {
        mediaPreview.innerHTML = `<video src="${url}" controls />`;
      }
    }
  });
  
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
  
  document.getElementById("tweetButton").onclick = async () => {
    const text = document.getElementById("tweetText").value.trim();
    if (!text && !selectedMediaFile) return;
    let mediaURL = null;
    let mediaType = null;
  
    if (selectedMediaFile) {
      const postId = "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8);
      const ext = selectedMediaFile.name.split('.').pop();
      const filePath = `media/${postId}.${ext}`;
  
      const { data, error } = await supabase.storage.from('media').upload(filePath, selectedMediaFile, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) {
        alert("Upload failed: " + error.message);
        return;
      }
      mediaURL = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
      mediaType = selectedMediaFile.type.startsWith("image/") ? "image" : "video";
    }
  
    await addDoc(collection(db, "posts"), {
      text,
      likes: 0,
      dislikes: 0,
      comments: [],
      replies: [],
      timestamp: Date.now(),
      author: localUser,
      mediaURL,
      mediaType
    });
  
    document.getElementById("tweetText").value = "";
    mediaPreview.innerHTML = "";
    mediaInput.value = "";
    selectedMediaFile = null;
  };
  
  function renderFeed() {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      feed.innerHTML = "";
      if (snapshot.empty) {
        feed.innerHTML = "<div class='empty'>No posts yet.</div>";
        return;
      }
      snapshot.forEach(docSnap => {
        const post = docSnap.data();
        const id = docSnap.id;
        feed.innerHTML += renderPostHTML(post, id);
      });
    });
  }
  
  function renderPostHTML(post, id) {
    const isBookmarked = bookmarkedIDs.includes(id);
    let mediaHTML = "";
    if (post.mediaURL && post.mediaType === "image") {
      mediaHTML = `<img src="${post.mediaURL}" alt="media" style="max-width:100%; max-height:280px; border-radius:12px; margin-top:8px;" />`;
    } else if (post.mediaURL && post.mediaType === "video") {
      mediaHTML = `<video src="${post.mediaURL}" controls style="max-width:100%; max-height:280px; border-radius:12px; margin-top:8px;" ></video>`;
    }
    return `
      <div class="tweet">
        <strong>${post.author.displayName}</strong> <span style="color:#888;">${post.author.username}</span>
        <p>${post.text || ""}</p>
        ${mediaHTML}
        <div class="tweet-footer">
          <button onclick="like('${id}')">❤️ ${post.likes}</button>
          <button onclick="dislike('${id}')">👎 ${post.dislikes}</button>
          <button onclick="commentPrompt('${id}')">💬 ${post.comments.length}</button>
          <button onclick="replyPrompt('${id}')">↩️ ${post.replies.length}</button>
          <button onclick="toggleBookmark('${id}')">${isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</button>
        </div>
        ${post.comments.map(c => `<div class="comment">💬 ${c}</div>`).join('')}
        ${post.replies.map(r => `<div class="reply">↩️ ${r}</div>`).join('')}
      </div>
    `;
  }
  
  // --- Modular like/dislike/comments ---
  window.like = async (id) => {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, { likes: increment(1) });
  };
  window.dislike = async (id) => {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, { dislikes: increment(1) });
  };
  window.commentPrompt = async (id) => {
    const text = prompt("Enter a comment:");
    if (!text) return;
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, { comments: arrayUnion(text) });
  };
  window.replyPrompt = async (id) => {
    const text = prompt("Enter a reply:");
    if (!text) return;
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, { replies: arrayUnion(text) });
  };
  
  window.toggleBookmark = (id) => {
    if (bookmarkedIDs.includes(id)) {
      bookmarkedIDs = bookmarkedIDs.filter(x => x !== id);
    } else {
      bookmarkedIDs.push(id);
    }
    localStorage.setItem("bookmarkedIDs", JSON.stringify(bookmarkedIDs));
    renderFeed();
  };
  
  function renderBookmarks() {
    const el = document.getElementById("section-bookmarks");
    el.innerHTML = "<div class='feed'></div>";
    const container = el.querySelector(".feed");
    if (bookmarkedIDs.length === 0) {
      container.innerHTML = "<div class='empty'>No bookmarks saved.</div>";
      return;
    }
    bookmarkedIDs.forEach(async (id) => {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        container.innerHTML += renderPostHTML(postSnap.data(), id);
      }
    });
  }
  
  // -------- Profile save/render --------
  window.saveProfile = function() {
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
  };
  
  function renderProfile() {
    document.getElementById("username").value = localUser.username;
    document.getElementById("displayName").value = localUser.displayName;
    document.getElementById("bio").value = localUser.bio;
    document.getElementById("profilePic").src = localUser.profilePic;
  
    const container = document.getElementById("profilePosts");
    container.innerHTML = "";
  
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("author.username", "==", localUser.username), orderBy("timestamp", "desc"));
    getDocs(q).then(snapshot => {
      if (snapshot.empty) {
        container.innerHTML = "<div class='empty'>You haven’t posted yet.</div>";
        return;
      }
      snapshot.forEach(docSnap => {
        container.innerHTML += renderPostHTML(docSnap.data(), docSnap.id);
      });
    });
  }
  
  renderFeed();
