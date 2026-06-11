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

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3Plb0dcAJ-FFUV9bhltfvd-hluckM1vD_muRzWGLr4W4St0Rjpzk-K2IjtUNL2K5wrw/exec';

/**
 * 初始化後處理 redirect 結果（頁面載入時呼叫）
 * 讓 Firebase 解析 OAuth redirect 回調並恢復 session
 */
auth.getRedirectResult().catch(err => {
  // 忽略 "no redirect result" 之類的非錯誤
  if (err.code !== 'auth/no-auth-event') {
    console.warn('Redirect result error:', err.code, err.message);
  }
});

/**
 * 彈出 Gmail 登入視窗
 */
function signInWithGoogle() {
  auth.signInWithRedirect(googleProvider);
}

/**
 * 登出
 */
function signOut() {
  auth.signOut().then(() => {
    localStorage.removeItem("holyChakra_member");
  });
}

/**
 * 取得目前登入會員資料（同步）
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
 * 儲存會員資料到 Google Sheet
 * data = { name, gender, birthday, address, phone, facebook, referrer, zipcode, note }
 */
async function saveMemberData(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("未登入");

  const payload = new URLSearchParams({
    ...data,
    email: user.email
  });

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: payload
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error('儲存失敗，請稍後再試');
  }
}

/**
 * 讀取本地會員資料（舊相容用，仍然讀 localStorage）
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