import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase, ref as dbRef, set, push, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { getFirestore, collection, doc as fsDoc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- Firebase Init ---
const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const fs = getFirestore(app);

// --- Globals & UI refs ---
const appEl = document.getElementById('app'), spinner = id('spinner');
const loginBtn = id('btn-login-sync');

// Helper to get element
function id(s) { return document.getElementById(s); }

// Swear filter
const blockSwear = text => {
  const bad = ["f\\w+", /* regex for all except allowed: ass|dick|balls|shit|damn */];
  return bad.some(r => new RegExp(r,'i').test(text));
}

// --- Auth Flow ---
loginBtn.onclick = showLogin;

function showLogin(){
  if(id('loginModal')) return;
  const div = document.createElement('div');
  div.id = 'loginModal';
  div.innerHTML = `
    <div class="login-box">
      <input id="ulog" placeholder="Username" />
      <input id="pwd" type="password" placeholder="Password" />
      <button id="btnLogin">Login</button>
      <button id="btnSignup">Sign Up</button>
    </div>`;
  document.body.append(div);
  id('btnLogin').onclick = login;
  id('btnSignup').onclick = signup;
}

function signup(){
  const u = id('ulog').value.trim(), p = id('pwd').value;
  if(!u||!p) return alert('Fill both');
  createUserWithEmailAndPassword(auth, u+"@twister", p)
    .catch(e=>alert(e.message));
}

function login(){
  const u = id('ulog').value.trim(), p = id('pwd').value;
  signInWithEmailAndPassword(auth, u+"@twister", p).catch(e=>alert(e.message));
}

// Session & expiry
onAuthStateChanged(auth, user=>{
  if(user){
    const now = Date.now();
    if(!user.metadata.lastSignInTime || now - Date.parse(user.metadata.lastSignInTime) > 20*24*3600*1000){
      auth.signOut();
      return;
    }
    loadApp();
  } else {
    showLogin();
  }
});

// --- Loading UI & Routes ---
function loadApp(){
  id('loginModal')?.remove();
  spinner.classList.add('hidden');
  // TODO: render default or route
  renderFeed();
}

// --- Example Feed Rendering ---
async function renderFeed(){
  spinner.classList.remove('hidden');
  const listRef = dbRef(db, 'posts');
  appEl.innerHTML = `<button onclick="logout()">Logout</button><div id="feedList"></div>`;
  id('feedList').innerHTML = '';
  onChildAdded(listRef, snap => {
    const p = snap.val();
    const d = document.createElement('div');
    d.className = 'post';
    d.innerHTML = `
      <div class="meta">${p.author} · ${new Date(p.ts).toLocaleString()}</div>
      <div class="content">${p.content}</div>
    `;
    id('feedList').prepend(d);
  });
  spinner.classList.add('hidden');
}

// Logout helper
function logout(){ auth.signOut(); }

// Render placeholders for other pages as stubs...
