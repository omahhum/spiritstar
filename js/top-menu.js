/**
 * 聖輪宗 — 純靜態頂部導航列
 * 只負責渲染 NAV_ITEMS，不含任何 auth邏輯
 *
 * 使用方式：在 HTML 的 <body> 放置
 *   <nav id="top-nav"></nav>
 *   <script src="js/auth.js"></script>
 *   <script src="js/top-menu.js"></script>
 *   （各 HTML 的 inline script 在 DOMContentLoaded 中追加 auth nav）
 *
 * 子資料夾頁面（如 golden-wheel/）請在 <body> 加 data-base="../"，
 * 導覽連結會自動加上該前綴；根目錄頁面不必加。
 */

const NAV_ITEMS = [
  { href: 'about.html',   label: '認識聖輪宗' },
  { href: 'gospel.html',  label: '聖輪福音' },
  { href: 'methods.html', label: '修行法門' },
  { href: 'golden-wheel/index.html', label: '佛頂金輪大壇' },
  { href: 'refuge.html',  label: '皈依福利' },
  { href: 'contact.html', label: '聯絡我們' },
];

/** 子頁面連結前綴：<body data-base="../"> → '../'；根目錄 → '' */
function navBase() {
  const b = (document.body && document.body.dataset) ? document.body.dataset.base : '';
  return b || '';
}

function renderTopNav() {
  const navEl = document.getElementById('top-nav');
  if (!navEl) return;

  const B = navBase();

  navEl.innerHTML =
`<nav class="nav">
  <div class="nav-inner">
    <a href="${B}index.html" class="nav-logo">聖輪宗</a>
    <ul class="nav-links" id="navLinks">
      ${NAV_ITEMS.map(item =>
        `<li><a href="${B}${item.href}">${item.label}</a></li>`
      ).join('')}
    </ul>
    <button class="nav-mobile-btn" id="mobileBtn" aria-label="選單">☰</button>
  </div>
</nav>`;

  const btn = document.getElementById('mobileBtn');
  if (btn) btn.onclick = () => document.getElementById('navLinks').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', renderTopNav);
