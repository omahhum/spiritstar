/**
 * 聖輪宗 — 純靜態 footer
 * 只負責渲染頁底版權區，不含任何 auth/logic
 *
 * 使用方式：在 HTML 的 </body> 前放置
 *   <div id="footer-placeholder"></div>
 *   <script src="js/footer.js"></script>
 *
 * 子資料夾頁面（如 golden-wheel/）請在 <body> 加 data-base="../"，
 * 頁尾連結會自動加上該前綴；根目錄頁面不必加。
 *
 * 包成 IIFE：避免與 top-menu.js 的全域常數互相覆蓋。
 */

(function () {
  const host = document.getElementById('footer-placeholder');
  if (!host) return;

  const B = (document.body && document.body.dataset) ? (document.body.dataset.base || '') : '';

  const FOOTER_LINKS = [
    { href: 'about.html',   label: '認識聖輪宗' },
    { href: 'gospel.html',  label: '聖輪福音' },
    { href: 'methods.html', label: '修行法門' },
    { href: 'golden-wheel/index.html', label: '佛頂金輪大壇' },
    { href: 'refuge.html',  label: '皈依專區' },
    { href: 'contact.html', label: '聯絡我們' },
  ];

  host.outerHTML =
`<footer class="footer">
  <div class="footer-logo">聖輪宗</div>
  <div class="footer-links">
    ${FOOTER_LINKS.map(l => `<a href="${B}${l.href}">${l.label}</a>`).join('\n    ')}
  </div>
  <p class="footer-copy">© 2026 聖輪宗 HolyChakra Spiritstar.</p>
</footer>`;
})();
