/**
 * 佛頂金輪大壇 募資頁 — 前端邏輯
 * 用於 website/golden-wheel/ 的三個頁面：
 *   index.html       → GW.initGrid()
 *   donate.html      → GW.initDonate()
 *   merit-list.html  → GW.initMerit()
 *
 * 部署前：把 GAS_URL 換成部署後的 /exec 網址。
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwPf5yiPPm1U1hYdk660ge_Yc_jhem8pEtqhr09BWhZVt9QoGdrMxDeA3Zdp4Zo4Rjc/exec';
const CACHE_KEY = 'gw_slots_v1';
const CACHE_MS = 10 * 60 * 1000;      // 10 分鐘

const ZONES = ['主壇', '藥師壇', '百字明尊', '大壇'];
const ZONE_GRID = { 主壇: 'g-main', 藥師壇: 'g-mid', 百字明尊: 'g-mid', 大壇: 'g-small' };

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

  // ── 格子牆 ──────────────────────────────────────────
  async function initGrid() {
    const host = document.getElementById('gwGrid');
    if (!host) return;
    host.innerHTML = '<p class="text-muted">格位資料載入中…</p>';
    let d;
    try {
      d = await getSlots();
    } catch (err) {
      host.innerHTML = '<p class="text-muted">格位資料目前無法載入（' + err.message +
        '）。<br>請稍後重新整理，或直接來信詢問可認捐的格位。</p>';
      return;
    }

    host.innerHTML = '';
    ZONES.forEach(zone => {
      const list = d.slots.filter(s => s.zone === zone);
      if (!list.length) return;
      const open = list.filter(s => statusClass(s.status) === '可認捐').length;

      const box = document.createElement('div');
      box.className = 'gw-zone';
      box.innerHTML =
        '<div class="gw-zone-head">' +
        '<h3>' + zone + '</h3>' +
        '<span class="meta">' + list.length + ' 格　·　可認捐 ' + open + ' 格　·　' +
        Math.round((list.length - open) / list.length * 100) + '% 已認捐</span>' +
        '</div>' +
        '<div class="gw-grid ' + (ZONE_GRID[zone] || 'g-mid') + '"></div>';
      const grid = box.querySelector('.gw-grid');
      list.forEach(s => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gw-cell';
        b.dataset.s = statusClass(s.status);
        b.dataset.id = s.id;
        b.dataset.name = s.name;
        b.dataset.price = s.price;
        b.dataset.zone = s.zone;
        b.title = s.id + '　' + s.name + '　NT$' + Number(s.price).toLocaleString();
        b.addEventListener('click', () => pick(s));
        grid.appendChild(b);
      });
      host.appendChild(box);
    });

    const bar = document.getElementById('gwProgress');
    if (bar) {
      const taken = d.total - d.open;
      bar.innerHTML =
        counter(taken, '已認捐格數') +
        counter(d.open, '仍可認捐') +
        counter(d.total, '總格數') +
        counter((taken / d.total * 100).toFixed(1) + '%', '完成比例');
    }
  }

  const counter = (num, lbl) =>
    '<div><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>';

  // ── 選位面板 ────────────────────────────────────────
  let current = null;

  function pick(s) {
    current = s;
    const isOpen = statusClass(s.status) === '可認捐';
    const p = document.getElementById('gwPicker');
    if (!p) { if (isOpen) goDonate(s.id); return; }
    p.querySelector('h4').textContent = s.name;
    p.querySelector('.sid').textContent = '編號 ' + s.id + '　·　' + s.zone;
    p.querySelector('dd.price').textContent = 'NT$ ' + Number(s.price).toLocaleString();
    p.querySelector('dd.status').textContent = s.status;
    p.querySelector('dd.group').textContent = s.group || '　';
    const btn = p.querySelector('a.go');
    btn.href = 'donate.html?slot=' + encodeURIComponent(s.id);
    btn.style.display = isOpen ? '' : 'none';
    const note = p.querySelector('.gw-note');
    if (note) {
      note.style.display = isOpen ? 'none' : 'block';
      note.textContent = isOpen ? '' : '這一格已經被認捐了，可以回格子牆另選一格。';
    }
    p.classList.add('on');
  }

  function initPicker() {
    const p = document.getElementById('gwPicker');
    if (!p) return;
    p.addEventListener('click', e => { if (e.target === p) p.classList.remove('on'); });
    const c = p.querySelector('.close');
    if (c) c.addEventListener('click', () => p.classList.remove('on'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') p.classList.remove('on'); });
  }

  const goDonate = id => { location.href = 'donate.html?slot=' + encodeURIComponent(id); };

  // ── 認捐表單 ────────────────────────────────────────
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
          s.status + '」，已無法認捐，請回上一頁另選一格。';
        return;
      }
      slotInfo.innerHTML = '認捐標的：<strong>' + s.name + '</strong>（編號 ' + s.id +
        '，' + s.zone + '）<br>認捐金額：<strong>NT$ ' +
        Number(s.price).toLocaleString() + '</strong>';
    }

    if (preset && slotInput) { slotInput.value = preset; showSlot(preset); }
    if (slotInput) slotInput.addEventListener('input', e => showSlot(e.target.value.trim()));

    // 若未帶 slot，提供下拉選單
    const sel = document.getElementById('gwSlotSelect');
    if (sel && d) {
      sel.innerHTML = '<option value="">— 請選擇 —</option>' +
        d.slots.filter(s => statusClass(s.status) === '可認捐').map(s =>
          '<option value="' + s.id + '">' + s.id + '　' + s.name +
          '　NT$' + Number(s.price).toLocaleString() + '</option>').join('');
      sel.addEventListener('change', e => {
        if (slotInput) slotInput.value = e.target.value;
        showSlot(e.target.value);
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('gwMsg');
      const btn = form.querySelector('[type=submit]');
      msg.className = '';
      msg.textContent = '';

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
        msg.innerHTML = '認捐已登錄。<br>編號 <strong>' + r.id + '</strong>　' +
          r.name + '　NT$ ' + Number(r.price).toLocaleString() +
          '<br>我們會以 Email 與您聯繫後續收款與收據事宜，並在神像製作完成時寄送實拍照片。';
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
    initPicker();
    const page = document.body.dataset.gwPage;
    if (page === 'index') initGrid();
    if (page === 'donate') initDonate();
    if (page === 'merit') initMerit();
  });

  return { getSlots, initGrid, initDonate, initMerit, pick };
})();
