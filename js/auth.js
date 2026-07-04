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

//const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3Plb0dcAJ-FFUV9bhltfvd-hluckM1vD_muRzWGLr4W4St0Rjpzk-K2IjtUNL2K5wrw/exec';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby26_AoYInWRWLAfY-tQ8qo7UF8xWCwnE2BNBKgqDW4kf3RktIe0zINC2pRTm5yJ_NqLg/exec';

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
  auth.signInWithPopup(googleProvider).catch(err => {
    console.error('登入失敗:', err);
    alert('登入失敗：' + err.message + '\n(若是 unauthorized-domain，請至 Firebase 後台加入此網域)');
  });
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
 * 取得 Firebase ID Token（用于 GAS 驗證）
 */
async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('未登入');
  try {
    // 強迫刷新 token，確保是最新的
    return await user.getIdToken(true);
  } catch (e) {
    console.error('無法取得 Firebase token:', e);
    throw new Error('無法取得驗證 token，請重新登入');
  }
}

/**
 * 儲存會員資料到 Google Sheet（新增）
 * data = { name, gender, birthday, address, phone, facebook, referrer, zipcode, note }
 */
async function saveMemberData(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("未登入");
  
  const token = await getFirebaseToken();
  const payload = new URLSearchParams({
    ...data,
    token: token  // 改用 token，不直接傳 email
  });

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: payload,
    redirect: 'follow'
  });

  const text = await response.text();
  if (!text.includes('ok')) {
    throw new Error('儲存失敗，請稍後再試');
  }
}

/**
 * 更新會員資料（修改既有皈依資料，取代新增一列）
 * data = { name, gender, birthday, address, phone, facebook, referrer, zipcode, note }
 */
async function updateMemberData(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("未登入");
  
  const token = await getFirebaseToken();
  const payload = new URLSearchParams({
    ...data,
    token: token,  // 改用 token
    action: 'update'
  });

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: payload,
    redirect: 'follow'
  });

  const text = await response.text();
  if (!text.includes('ok')) {
    throw new Error('更新失敗，請稍後再試');
  }
}

/**
 * 讀取會員的現有皈依資料（根據 Firebase token 驗證）
 * @returns {Promise<{found: boolean, name?: string, gender?: string, ...}>}
 */
async function getMemberData() {
  const user = auth.currentUser;
  if (!user) return { found: false };
  
  try {
    const token = await getFirebaseToken();
    
    // 改用 POST 避免 token 在 URL 中被截斷
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        action: 'getMemberData',
        token: token
      })
    });
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { found: false };
    }
  } catch (e) {
    console.error('getMemberData 錯誤:', e);
    return { found: false };
  }
}

/**
 * 讀取本地會員資料（舊相容用，仍然讀 localStorage）
 * @deprecated 改用 firebaseAuth.getMemberDataFromSheet()
 */
function getMemberDataLocal() {
  const raw = localStorage.getItem("holyChakra_member");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * 檢查是否已填寫過皈依資料（本地檢查，已棄用）
 * @deprecated 改用 checkRefugeeStatus
 */
function hasMemberData() {
  return getMemberDataLocal() !== null;
}

/**
 * 查詢這個 email 是否在 Google Sheets 的白名單（皈依學員）中
 * @param {string} email
 * @returns {Promise<{found: boolean, name?: string}>}
 */
async function checkRefugeeStatus(email) {
  try {
    // 用 GET 方式帶參數（避開 POST redirect body 遺失問題）
    const url = APPS_SCRIPT_URL + '?action=checkRefugee&email=' + encodeURIComponent(email);
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return { found: data.found === true, name: data.name || '' };
    } catch {
      return { found: false };
    }
  } catch {
    return { found: false };
  }
}

// 對外暴露
window.firebaseAuth = {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
  saveMemberData,
  updateMemberData,
  getMemberData,
  hasMemberData,
  checkRefugeeStatus
};