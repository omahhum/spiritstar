/**
 * 聖輪宗 — 共用頂部導航列
 * 所有頁面 include 此檔即可自動渲染完整 nav（含 auth 狀態）
 *
 * 使用方式：在 HTML 的 <body> 開頭放置
 *   <nav id="top-nav"></nav>
 *   <script src="js/auth.js" defer></script>
 *   <script src="js/top-menu.js" defer></script>
 */

const NAV_ITEMS = [
  { href: 'about.html',   label: '認識聖輪宗' },
  { href: 'gospel.html',  label: '聖輪福音' },
  { href: 'methods.html', label: '修行法門' },
  { href: 'refuge.html',  label: '皈依專區' },
  { href: 'contact.html', label: '聯絡我們' },
];

function renderNav(user) {
  const navEl = document.getElementById('top-nav');
  if (!navEl) return;

  const name = user
    ? (user.displayName || (user.email ? user.email.split('@')[0] : '會員'))
    : null;

  navEl.innerHTML = `
<nav class="nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">聖輪宗</a>
    <ul class="nav-links" id="navLinks">
      ${NAV_ITEMS.map(item =>
        `<li><a href="${item.href}">${item.label}</a></li>`
      ).join('')}
    </ul>
    <button class="nav-mobile-btn" id="mobileBtn" aria-label="選單">☰</button>
  </div>
</nav>`;

  // Mobile toggle
  document.getElementById('mobileBtn').onclick = () => {
    document.getElementById('navLinks').classList.toggle('open');
  };

  // Auth nav item
  const nav = document.getElementById('navLinks');
  const li = document.createElement('li');
  if (name) {
    li.innerHTML =
      `<span style="color:var(--gold);font-size:.85rem;">${name}</span>` +
      `<span style="color:rgba(168,164,216,.4);margin:0 .4rem;">|</span>` +
      `<a href="member.html" style="font-size:.85rem;">會員專區</a>` +
      `<span style="color:rgba(168,164,216,.4);margin:0 .4rem;">|</span>` +
      `<a href="#" onclick="firebaseAuth.signOut();location.reload();" style="font-size:.85rem;">登出</a>`;
  } else {
    li.innerHTML =
      `<a href="#" onclick="firebaseAuth.signInWithGoogle()" style="font-size:.85rem;">Gmail 登入</a>`;
  }
  nav.appendChild(li);
}

// Init when DOM ready
function initTopNav() {
  if (window.firebaseAuth) {
    window.firebaseAuth.onAuthStateChanged(renderNav);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.firebaseAuth) window.firebaseAuth.onAuthStateChanged(renderNav);
    });
  }
}

initTopNav();