/**
 * 佛頂金輪大壇 募資頁 — 前端邏輯
 * 用於 website/golden-wheel/ 的三個頁面：
 *   index.html       → GW.initGrid()
 *   donate.html      → GW.initDonate()
 *   merit-list.html  → GW.initMerit()
 *
 * 格子牆為「卡片 ＋ 分頁（tab）」：第一層分區，第二層群組；卡片直接顯示編號／尊名／
 * 金額／群組，可認造的卡片自帶「認造此尊」按鈕，不再使用彈窗選位面板。
 * （2026-10-19 依使用者指示改版，原小格＋彈窗設計見 00_網站架構與內容規劃.md §2 修訂註記。）
 *
 * 部署前：把 GAS_URL 換成部署後的 /exec 網址。
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwPf5yiPPm1U1hYdk660ge_Yc_jhem8pEtqhr09BWhZVt9QoGdrMxDeA3Zdp4Zo4Rjc/exec';
const CACHE_KEY = 'gw_slots_v1';
const CACHE_MS = 10 * 60 * 1000;      // 10 分鐘

const ZONES = ['主壇', '藥師壇', '百字明尊', '大壇'];

/**
 * 分區格數超過此數就不提供「全部」分頁，直接以群組細分。
 * 大壇 529 格因此不會整坨出現；主壇 35／藥師壇 19／百字明尊 21 仍可切「全部」。
 */
const WHOLE_TAB_MAX = 60;

const GW = (() => {

  // ── 取資料 ──────────────────────────────────────────
  async function getSlots(force) {
    if (!force) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (Date.now() - c.t < CACHE_MS) return c.d;
        }
      } catch (e) { /* 快取壞掉就重抓 */ }
    }
    const res = await fetch(GAS_URL + '?action=getSlots', { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || '讀取失敗');
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { }
    return d;
  }

  const statusClass = s => (s || '可認捐').trim();
  const money = v => 'NT$' + Number(v || 0).toLocaleString();
  const esc = v => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const counter = (num, lbl) =>
    '<div><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>';

  // ── 格子牆：分頁 ＋ 卡片 ─────────────────────────────
  async function initGrid() {
    const host = document.getElementById('gwGrid');
    if (!host) return;
    host.innerHTML = '<p class="text-muted">格位資料載入中…</p>';

    let d;
    try {
      d = await getSlots();
    } catch (err) {
      host.innerHTML = '<p class="text-muted">格位資料目前無法載入（' + err.message +
        '）。<br>請稍後重新整理，或直接來信詢問可認造的格位。</p>';
      return;
    }

    const slots = d.slots || [];
    if (!slots.length) { host.innerHTML = '<p class="text-muted">目前沒有格位資料。</p>'; return; }

    // 分區與群組順序：依試算表實際出現順序
    const zoneOrder = ZONES.filter(z => slots.some(s => s.zone === z));
    slots.forEach(s => { if (zoneOrder.indexOf(s.zone) < 0) zoneOrder.push(s.zone); });
    const inZone = z => slots.filter(s => s.zone === z);
    const groupsOf = z => {
      const out = [];
      slots.forEach(s => { if (s.zone === z && out.indexOf(s.group) < 0) out.push(s.group); });
      return out;
    };
    const inGroup = (z, g) => slots.filter(s => s.zone === z && s.group === g);

    // 總進度（全部 604 格）
    const bar = document.getElementById('gwProgress');
    if (bar) {
      const taken = d.total - d.open;
      bar.innerHTML = counter(taken, '已認造格數') + counter(d.open, '仍可認造') +
        counter(d.total, '總格數') + counter((taken / d.total * 100).toFixed(1) + '%', '認造比例');
    }

    host.innerHTML =
      '<div class="gw-tabs" id="gwZoneTabs"></div>' +
      '<div class="gw-tabs gw-tabs-sub" id="gwGroupTabs"></div>' +
      '<input type="search" id="gwFilter" class="gw-filter" placeholder="搜尋編號或尊名（例如 0604、太歲、柏鑑）">' +
      '<p class="gw-tab-summary" id="gwSummary"></p>' +
      '<div class="gw-cards" id="gwCards"></div>';

    const zoneTabs = document.getElementById('gwZoneTabs');
    const groupTabs = document.getElementById('gwGroupTabs');
    const filterEl = document.getElementById('gwFilter');
    const summary = document.getElementById('gwSummary');
    const cardsHost = document.getElementById('gwCards');

    let curZone = zoneOrder[0];
    let curGroup = defaultGroup(curZone);
    let curKw = '';

    /** 太大就不給「全部」，預設落在第一個群組 */
    function defaultGroup(z) {
      return inZone(z).length <= WHOLE_TAB_MAX ? null : (groupsOf(z)[0] || null);
    }

    function listNow() {
      const k = curKw.trim();
      return slots.filter(s => s.zone === curZone && (!curGroup || s.group === curGroup) &&
        (!k || s.id.indexOf(k) >= 0 || (s.name || '').indexOf(k) >= 0 || (s.group || '').indexOf(k) >= 0));
    }

    /** 換分頁就把搜尋字清掉，避免換過去看到一片空白 */
    function resetKeyword() {
      curKw = '';
      if (filterEl) filterEl.value = '';
    }

    function renderTabs() {
      zoneTabs.innerHTML = zoneOrder.map(z =>
        '<button type="button" class="gw-tab' + (z === curZone ? ' on' : '') +
        '" data-zone="' + esc(z) + '">' + esc(z) +
        '<span class="n">' + inZone(z).length + '</span></button>').join('');

      const chips = [];
      if (inZone(curZone).length <= WHOLE_TAB_MAX) {
        chips.push({ g: '', label: '全部', n: inZone(curZone).length });
      }
      const gs = groupsOf(curZone);
      if (gs.length > 1) {
        gs.forEach(g => chips.push({ g: g, label: g, n: inGroup(curZone, g).length }));
      }
      groupTabs.style.display = chips.length > 1 ? '' : 'none';
      groupTabs.innerHTML = chips.map(c => {
        const on = (c.g === '' && !curGroup) || (c.g !== '' && c.g === curGroup);
        return '<button type="button" class="gw-tab gw-tab-sm' + (on ? ' on' : '') +
          '" data-group="' + esc(c.g) + '">' + esc(c.label) +
          '<span class="n">' + c.n + '</span></button>';
      }).join('');
    }

    function renderCards() {
      const list = listNow();
      const cnt = st => list.filter(s => statusClass(s.status) === st).length;
      const open = cnt('可認捐');
      const taken = list.length - open;   // 已認造＝所有非「可認造」格（含製作中／已完成，全頁不顯示其標註）
      const k = curKw.trim();
      summary.textContent =
        (k ? '搜尋「' + k + '」· ' : '') +
        (curGroup ? curZone + ' · ' + curGroup : curZone) + '　共 ' + list.length + ' 格' +
        '　可認造 ' + open + '　已認造 ' + taken;

      if (!list.length) {
        cardsHost.innerHTML = '<p class="text-muted">沒有符合的格位。可換一個關鍵字（編號或尊名），或換分頁。</p>';
        return;
      }

      cardsHost.innerHTML = list.map(s => {
        const st = statusClass(s.status);
        const openSlot = st === '可認捐';
        // 顯示用標籤：把狀態值的「認捐」顯示成「認造」；data-s 仍用原始值 drive CSS 上色
        const stLabel = st === '已認捐' ? '已認造' : (st === '可認捐' ? '可認造' : st);
        // 卡片底部內容（依優先序）：
        //  可認造          → 「認造此尊」按鈕
        //  非可認造＋有認造者 → 「感謝 X 認造」感謝列（公開全名／未公開姓OO，均帶稱謂）
        //  非可認造＋無資料   → 僅「已認造」保底顯示「已認造」；「製作中／已完成」暫態取消標註（留白）
        const footContent = openSlot
          ? '<a class="gw-card-btn" href="donate.html?slot=' + encodeURIComponent(s.id) + '">認造此尊</a>'
          : (s.donorDisplay
              ? '<div class="gw-card-thanks">感謝 ' + esc(s.donorDisplay) +
                ((s.donorSalutation || '').trim() ? esc(s.donorSalutation.trim()) : '師兄師姊') +
                ' 認造</div>'
              : (st === '已認捐' ? '<span class="gw-card-state">' + esc(stLabel) + '</span>' : ''));
        return '<article class="gw-card" data-s="' + esc(st) + '" data-id="' + esc(s.id) + '">' +
          '<div class="gw-card-top"><span class="gw-card-id">' + esc(s.id) + '</span>' +
          '<span class="gw-card-price">' + money(s.price) + '</span></div>' +
          '<h4 class="gw-card-name">' + esc(s.name || '（待補）') + '</h4>' +
          '<div class="gw-card-meta">' + esc(s.zone) + ' · ' + esc(s.group) +
          (s.level ? ' · ' + esc(s.level) + ' 級' : '') + '</div>' +
          (footContent ? '<div class="gw-card-foot">' + footContent + '</div>' : '') +
          '</article>';
      }).join('');
    }

    zoneTabs.addEventListener('click', e => {
      const b = e.target.closest('.gw-tab');
      if (!b || !b.dataset.zone) return;
      curZone = b.dataset.zone;
      curGroup = defaultGroup(curZone);
      resetKeyword();
      renderTabs(); renderCards();
    });

    groupTabs.addEventListener('click', e => {
      const b = e.target.closest('.gw-tab');
      if (!b) return;
      curGroup = b.dataset.group || null;
      resetKeyword();
      renderTabs(); renderCards();
    });

    if (filterEl) {
      filterEl.addEventListener('input', e => {
        curKw = e.target.value || '';
        renderCards();
      });
    }

    renderTabs();
    renderCards();
  }

  // ── 認造表單 ────────────────────────────────────────
  async function initDonate() {
    const form = document.getElementById('gwForm');
    if (!form) return;

    const qs = new URLSearchParams(location.search);
    const preset = qs.get('slot') || '';

    let d = null;
    const slotInput = form.querySelector('[name=slot]');
    const slotInfo = document.getElementById('gwSlotInfo');
    try {
      d = await getSlots();
    } catch (err) {
      slotInfo.textContent = '格位資料目前無法載入（' + err.message + '）。請稍後再試。';
    }

    function showSlot(id) {
      if (!d) return;
      const s = d.slots.find(x => x.id === id);
      if (!s) { slotInfo.textContent = '查無編號 ' + id + '，請確認後再填。'; return; }
      if (statusClass(s.status) !== '可認捐') {
        slotInfo.innerHTML = '<strong>' + s.name + '</strong>（' + s.id + '）目前狀態為「' +
          s.status + '」，已無法認造，請回上一頁另選一格。';
        return;
      }
      slotInfo.innerHTML = '認造標的：<strong>' + s.name + '</strong>（編號 ' + s.id +
        '，' + s.zone + '）<br>認造金額：<strong>NT$ ' +
        Number(s.price).toLocaleString() + '</strong>';
    }

    if (preset && slotInput) { slotInput.value = preset; showSlot(preset); }
    if (slotInput) slotInput.addEventListener('input', e => showSlot(e.target.value.trim()));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('gwMsg');
      const btn = form.querySelector('[type=submit]');
      msg.className = '';
      msg.textContent = '';

      // 必選：未勾「我已了解」不得送出（表單為 novalidate，瀏覽器不擋，需手動檢查）
      const agreeTerms = form.querySelector('[name=agreeTerms]');
      if (agreeTerms && !agreeTerms.checked) {
        msg.className = 'err';
        msg.textContent = '請先勾選「我已了解」，才能送出認造登記。';
        agreeTerms.focus();
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const fd = new FormData(form);
      const body = new URLSearchParams();
      fd.forEach((v, k) => {
        body.append(k, k === 'agreeMerit' || k === 'agreeTerms' ? 'true' : String(v).trim());
      });
      body.set('action', 'createDonation');
      if (!fd.get('agreeTerms')) body.set('agreeTerms', 'false');
      if (!fd.get('agreeMerit')) body.set('agreeMerit', 'false');

      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = '送出中…';
      try {
        const res = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString(),
        });
        const r = await res.json();
        if (!r.ok) throw new Error(r.error || '送出失敗');
        sessionStorage.removeItem(CACHE_KEY);
        msg.className = 'ok';
        msg.innerHTML = '認造已登錄。<br>編號 <strong>' + r.id + '</strong>　' +
          r.name + '　NT$ ' + Number(r.price).toLocaleString() +
          '<br>為防止詐騙利用，請私訊香海師姊確認並索取帳號或其它付款方式。我們也會以 Email 與您聯繫付款與感謝函事宜，並在神像製作完成時寄送實拍照片。';
        form.reset();
        document.getElementById('gwSlotInfo').textContent = '';
      } catch (err) {
        msg.className = 'err';
        msg.textContent = '送出失敗：' + err.message + '（若持續失敗，請直接與我們聯繫）';
      } finally {
        btn.disabled = false;
        btn.textContent = old;
      }
    });
  }

  // ── 功德芳名錄 ──────────────────────────────────────
  async function initMerit() {
    const host = document.getElementById('gwMerit');
    if (!host) return;
    host.innerHTML = '<p class="text-muted">名錄載入中…</p>';
    let d;
    try {
      const res = await fetch(GAS_URL + '?action=getMeritList');
      d = await res.json();
      if (!d.ok) throw new Error(d.error || '讀取失敗');
    } catch (err) {
      host.innerHTML = '<p class="text-muted">名錄目前無法載入（' + err.message + '）。</p>';
      return;
    }

    const kw = document.getElementById('gwMeritKw');
    const zf = document.getElementById('gwMeritZone');
    const cnt = document.getElementById('gwMeritCount');

    function render() {
      const k = (kw && kw.value.trim()) || '';
      const z = (zf && zf.value) || '';
      // 名錄分頁的「編號」欄被 Sheets 轉成數字（0604 → 604），顯示時補回四位
      const pad4 = v => {
        const s = String(v == null ? '' : v).trim();
        return /^\d+$/.test(s) ? s.padStart(4, '0') : s;
      };
      const list = d.items.filter(it =>
        (!z || it.zone === z) && (!k || it.name.indexOf(k) >= 0 || it.hon.indexOf(k) >= 0));
      if (cnt) cnt.textContent = '顯示 ' + list.length + ' / ' + d.items.length + ' 筆';
      if (!list.length) { host.innerHTML = '<p class="text-muted">沒有符合的紀錄。</p>'; return; }
      host.innerHTML = '<div class="gw-merit-list">' + list.map(it =>
        '<div class="gw-merit-item"><div class="n">' + it.name + it.salutation + '</div>' +
        '<div class="s">' + pad4(it.id) + '　' + it.hon + '</div></div>').join('') + '</div>';
    }
    if (kw) kw.addEventListener('input', render);
    if (zf) zf.addEventListener('change', render);
    render();
  }

  // ── 捲動淡入（本站 .fade-in 初始 opacity:0，需補 .visible）──
  function initFadeIn() {
    const els = document.querySelectorAll('.fade-in');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: .1 });
    els.forEach(el => observer.observe(el));
  }

  // ── 啟動 ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initFadeIn();
    const page = document.body.dataset.gwPage;
    if (page === 'index') initGrid();
    if (page === 'donate') initDonate();
    if (page === 'merit') initMerit();
  });

  return { getSlots, initGrid, initDonate, initMerit };
})();
