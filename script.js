const feed = document.getElementById("feed");
let localUser = {
  username: localStorage.getItem("username") || "@anon",
  displayName: localStorage.getItem("displayName") || "Anonymous",
  bio: localStorage.getItem("bio") || "",
  profilePic: localStorage.getItem("profilePic") || "default-pfp.jpg",
};

// Sidebar navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("section-" + btn.dataset.section).classList.add("active");
    if (btn.dataset.section === "profile") renderProfile();
  };
});

// Post to Firestore
document.getElementById("tweetButton").onclick = async () => {
  const text = document.getElementById("tweetText").value.trim();
  if (!text) return;

  await db.collection("posts").add({
    text,
    likes: 0,
    comments: [],
    replies: [],
    bookmarked: false,
    timestamp: Date.now(),
    author: localUser
  });

  document.getElementById("tweetText").value = "";
};

// Live feed from Firestore
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
      feed.innerHTML += `
        <div class="tweet">
          <strong>${post.author.displayName}</strong> <span style="color:#888;">${post.author.username}</span>
          <p>${post.text}</p>
        </div>
      `;
    });
  });

// Save Profile to localStorage
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

  localUser = { username, displayName, bio, profilePic: localStorage.getItem("profilePic") || "default-pfp.jpg" };
}

// Load profile info
function renderProfile() {
  document.getElementById("username").value = localUser.username;
  document.getElementById("displayName").value = localUser.displayName;
  document.getElementById("bio").value = localUser.bio;
  document.getElementById("profilePic").src = localUser.profilePic;

  db.collection("posts")
    .where("author.username", "==", localUser.username)
    .orderBy("timestamp", "desc")
    .get()
    .then(snapshot => {
      const container = document.getElementById("profilePosts");
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = "<div class='empty'>You haven’t posted yet.</div>";
        return;
      }
      snapshot.forEach(doc => {
        const post = doc.data();
        container.innerHTML += `
          <div class="tweet">
            <p>${post.text}</p>
          </div>
        `;
      });
    });
}
