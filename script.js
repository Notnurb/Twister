window.addEventListener('DOMContentLoaded', () => {
  // Show modal when entering the site
  const modal = document.getElementById('setUserModal');
  modal.style.display = 'flex';

  document.getElementById('modalYes').onclick = () => {
    modal.style.display = 'none';
    // Go to profile section
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelector('.nav-btn[data-section="profile"]').classList.add('active');
    document.getElementById('section-profile').classList.add('active');
    if (typeof renderProfile === 'function') renderProfile();
  };
  document.getElementById('modalNo').onclick = () => {
    modal.style.display = 'none';
  };
});

// === SUPABASE AUTH CONFIG ===
const SUPABASE_URL = "https://iajztbvoyugbbcrouppm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhanp0YnZveXVnYmJjcm91cHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTA4NjIsImV4cCI6MjA2Njg2Njg2Mn0.0DdBIpNFIUsAH1-M9NcfmKHnwv2XOc0TEk0flrq7H0I";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Hide/Show elements
function showApp(loggedIn) {
  document.getElementById("auth-container").style.display = loggedIn ? "none" : "flex";
  document.getElementById("app-container").style.display = loggedIn ? "flex" : "none";
}

// ==== AUTH FLOW ====

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showLogin = document.getElementById('show-login');
const showSignup = document.getElementById('show-signup');
const authError = document.getElementById('auth-error');

// Tab switching
showLogin.onclick = () => {
  showLogin.classList.add('active');
  showSignup.classList.remove('active');
  loginForm.style.display = 'flex';
  signupForm.style.display = 'none';
  authError.textContent = '';
};
showSignup.onclick = () => {
  showSignup.classList.add('active');
  showLogin.classList.remove('active');
  signupForm.style.display = 'flex';
  loginForm.style.display = 'none';
  authError.textContent = '';
};

// Handle signup
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  if (!email || !password || !username) return;
  authError.textContent = "Signing up...";

  // Supabase sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "Check your email to confirm!";
  }
};

// Handle login
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  authError.textContent = "Logging in...";
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "";
    showApp(true);
    loadUserProfile();
    renderFeed();
  }
};

// Handle logout
document.getElementById("logout-btn").onclick = async () => {
  await supabase.auth.signOut();
  showApp(false);
};

// Check session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  showApp(!!session);
  if (session) {
    loadUserProfile();
    renderFeed();
  }
});

// Listen for auth state changes (in case of new tab or refresh)
supabase.auth.onAuthStateChange((event, session) => {
  showApp(!!session);
  if (session) {
    loadUserProfile();
    renderFeed();
  }
});

// ==== USER PROFILE ====
// Store/display profile info in localStorage for demo (could also use Supabase user_metadata)
function loadUserProfile() {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      localStorage.setItem("username", user.user_metadata?.username || ("@" + user.email.split('@')[0]));
      localStorage.setItem("displayName", user.user_metadata?.username || ("@" + user.email.split('@')[0]));
      localStorage.setItem("bio", "");
      localStorage.setItem("profilePic", "https://via.placeholder.com/80");
      localUser = {
        username: localStorage.getItem("username"),
        displayName: localStorage.getItem("displayName"),
        bio: localStorage.getItem("bio"),
        profilePic: localStorage.getItem("profilePic")
      };
    }
  });
}

let localUser = {
  username: "",
  displayName: "",
  bio: "",
  profilePic: "https://via.placeholder.com/80"
};
let bookmarkedIDs = JSON.parse(localStorage.getItem("bookmarkedIDs") || "[]");

const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");
let selectedMediaFile = null;

if (mediaInput) {
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
}

// The rest of your Twister post/feed/profile logic goes here
// (Use your existing script.js after this point!)

// ... paste your Twister post/feed/profile code here ...
