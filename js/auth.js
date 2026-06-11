/**
 * 聖輪宗網站 — Firebase Auth 模組
 * 所有頁面 include 此檔即可使用 firebaseAuth
 */

// Firebase SDK (v9 compat 模式，CDN 直接載入)
firebase.initializeApp({
  apiKey: "AIzaSyDpmCMLtHDuvTWFCKSNBDLFMmdGdQfA17I",
  authDomain: "studio-4305054348-a6a5f.firebaseapp.com",
  projectId: "studio-4305054348-a6a5f",
  storageBucket: "studio-4305054348-a6a5f.firebasestorage.app",
  messagingSenderId: "278667343750",
  appId: "1:278667343750:web:71e2da24e2a1ece6f39e07"
});

const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

/**
 * 彈出 Gmail 登入視窗
 */
function signInWithGoogle() {
  auth.signInWithPopup(googleProvider).catch(err => {
    console.error("登入失敗：", err);
    alert("登入失敗，請稍後再試。");
  });
}

/**
 * 登出
 */
function signOut() {
  auth.signOut().then(() => {
    // 移除 localStorage 會員資料
    localStorage.removeItem("holyChakra_member");
  });
}

/**
 * 取得目前登入會員資料（同步）
 * 回傳 null 表示未登入
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * 訂閱登入狀態變化
 * callback(user) — user 為 Firebase User 物件或 null
 */
function onAuthStateChanged(callback) {
  auth.onAuthStateChanged(callback);
}

/**
 * 儲存會員補充資料到 localStorage
 * （Phase 2 再改為 Apps Script API）
 */
function saveMemberData(data) {
  const user = auth.currentUser;
  if (!user) return Promise.reject("未登入");
  const record = {
    uid: user.uid,
    name: data.name || user.displayName || "",
    email: data.email || user.email || "",
    phone: data.phone || "",
    wish: data.wish || "",
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("holyChakra_member", JSON.stringify(record));
  return Promise.resolve(record);
}

/**
 * 讀取本地會員資料
 */
function getMemberData() {
  const raw = localStorage.getItem("holyChakra_member");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * 檢查是否已填寫過皈依資料
 */
function hasMemberData() {
  return getMemberData() !== null;
}

// 對外暴露
window.firebaseAuth = {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  saveMemberData,
  getMemberData,
  hasMemberData
};