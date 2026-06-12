/**
 * 聖輪宗 — 純靜態 footer
 * 只負責渲染頁底版權區，不含任何 auth/logic
 *
 * 使用方式：在 HTML 的 </body> 前放置
 *   <div id="footer-placeholder"></div>
 *   <script src="js/footer.js"></script>
 */

document.getElementById('footer-placeholder').outerHTML =
`<footer class="footer">
  <div class="footer-logo">聖輪宗甘露王院</div>
  <div class="footer-links">
    <a href="about.html">認識聖輪宗</a>
    <a href="gospel.html">聖輪福音</a>
    <a href="methods.html">修行法門</a>
    <a href="refuge.html">皈依專區</a>
    <a href="contact.html">聯絡我們</a>
  </div>
  <p class="footer-copy">© 2026 聖輪宗 HolyChakra Spiritstar.</p>
</footer>`;