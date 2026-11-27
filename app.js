/* نماذج المحامي — المحرك: الشاشات، المعالج خطوة بخطوة، المسودات، المعاينة، التصدير */
(function () {
  'use strict';
  const { T, GROUPS, H } = window.TPL;
  const $app = document.getElementById('app');
  const VERSION = '1.5.1';

  /* ---------- التخزين ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('تعذر الحفظ على الهاتف'); return false; } }
  };
  const OFFICE_DEF = { name: 'كمال إبراهيم منصور', title: 'المحامي بالنقض والإدارية العليا', addr: 'برقم 26 شارع الأقصر – سبورتنج – شقة 9 – قسم سيدي جابر – الإسكندرية', phone: '01227594107', sub: '', khataba: true, lh: true, side: true, pfs: 'auto', pbold: 'auto', logo: 1 };
  const office = () => Object.assign({}, OFFICE_DEF, LS.get('lw.office', {}));
  const prefs = () => Object.assign({ fs: 20, dark: false }, LS.get('lw.prefs', {}));
  const drafts = () => LS.get('lw.drafts', {});
  function saveDraft(dr) { dr.updated = Date.now(); const all = drafts(); all[dr.id] = dr; LS.set('lw.drafts', all); }
  function delDraft(id) { const all = drafts(); delete all[id]; LS.set('lw.drafts', all); }
  window.APP = { office };

  function applyPrefs() {
    const p = prefs();
    document.documentElement.style.setProperty('--fs', p.fs + 'px');
    document.documentElement.classList.toggle('dark', !!p.dark);
  }
  applyPrefs();
  /* وضع مضغوط عند ظهور لوحة المفاتيح */
  let fullH = window.innerHeight;
  function fitApp() {                                        // ارتفاع الشاشة المرئية فعلاً (بدون شريط التنقل)
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--appH', Math.round(Math.min(vh, window.innerHeight)) + 'px');
  }
  fitApp(); window.addEventListener('resize', fitApp); window.addEventListener('orientationchange', () => setTimeout(fitApp, 300));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitApp);
  function kbCheck() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (h > fullH) fullH = h;
    const t = document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && document.activeElement.type !== 'file';
    document.documentElement.classList.toggle('kb', !!t && h < fullH * 0.8);
  }
  (window.visualViewport || window).addEventListener('resize', kbCheck);
  document.addEventListener('focusin', () => setTimeout(kbCheck, 300));
  window.addEventListener('load', kbCheck); kbCheck();
  document.addEventListener('focusout', () => setTimeout(kbCheck, 300));
  document.addEventListener('touchstart', () => { }, { passive: true }); // يفعّل تأثير الضغط على كل الأجهزة

  /* ---------- أدوات ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  let toastT;
  function toast(msg, ms) {
    document.querySelectorAll('.toast').forEach(e => e.remove());
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d);
    clearTimeout(toastT); toastT = setTimeout(() => d.remove(), ms || 2600);
  }
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; }
  function screen(title, body, foot, headBtns) {
    $app.innerHTML = '';
    $app.appendChild(el(`<header class="bar">${headBtns && headBtns.right || ''}<h1>${esc(title)}</h1>${headBtns && headBtns.left || ''}</header><main id="main"></main>${foot ? '<footer class="nav" id="foot"></footer>' : ''}`));
    const m = document.getElementById('main'); if (typeof body === 'string') m.innerHTML = body; else m.appendChild(body);
    if (foot) { const f = document.getElementById('foot'); if (typeof foot === 'string') f.innerHTML = foot; else f.appendChild(foot); }
    m.scrollTop = 0;
    return m;
  }
  const on = (sel, ev, fn) => document.querySelectorAll(sel).forEach(e => e.addEventListener(ev, fn));

  /* ---------- التنقل وزر الرجوع في أندرويد ---------- */
  let cur = null; // {draft, key}
  let view = 'home';
  function go(v, push = true) { view = v; if (push) history.pushState({ v }, ''); }
  window.addEventListener('popstate', () => {
    if (view === 'wizard') { const i = stepIndex(); if (i > 0) { history.pushState({ v: 'wizard' }, ''); moveStep(-1); } else home(false); }
    else if (view === 'preview') wizard(cur.draft.id, cur.key, false);
    else if (view === 'group' || view === 'drafts' || view === 'settings') home(false);
  });

  /* ---------- الشاشة الرئيسية ---------- */
  function home(push = true) {
    go('home', push);
    const ds = Object.values(drafts()).sort((a, b) => b.updated - a.updated);
    let html = '';
    if (ds.length) {
      html += `<button class="tile" id="toDrafts"><span class="ic">🗂</span><span>المسودات المحفوظة<small>${ds.length} ورقة – آخرها: ${esc(ds[0].title)}</small></span></button>`;
    }
    html += `<div class="sec">اختر نوع الورقة</div><div class="tiles">`;
    GROUPS.forEach(g => {
      html += `<button class="tile" data-g="${g.id}"><span class="ic">${g.ic}</span><span>${esc(g.name)}${g.items.length > 1 ? `<small>${g.items.map(i => T[i].name).join(' · ')}</small>` : `<small>${esc(T[g.items[0]].desc)}</small>`}</span></button>`;
    });
    html += `</div>`;
    screen('النماذج المتوفرة', html, null, { left: '<button id="toSet" aria-label="الإعدادات">الإعدادات</button>' });
    on('[data-g]', 'click', e => { const g = GROUPS.find(x => x.id === e.currentTarget.dataset.g); g.items.length === 1 ? startNew(g.items[0]) : group(g); });
    on('#toDrafts', 'click', () => draftsView());
    on('#toSet', 'click', () => settings());
  }

  function group(g) {
    go('group');
    let html = `<div class="tiles">`;
    g.items.forEach(id => { html += `<button class="tile" data-t="${id}"><span class="ic">${g.ic}</span><span>${esc(T[id].name)}<small>${esc(T[id].desc)}</small></span></button>`; });
    html += `</div>`;
    screen(g.name, html, `<button class="btn" id="back">رجوع</button>`);
    on('[data-t]', 'click', e => startNew(e.currentTarget.dataset.t));
    on('#back', 'click', () => history.back());
  }

  /* ---------- المسودات ---------- */
  function initData(tpl) {
    const d = {};
    tpl.fields.forEach(f => {
      if (f.type === 'group') d[f.k] = Array.from({ length: f.min }, () => initItem(f));
      else if (f.type === 'list') d[f.k] = f.def ? clone(f.def) : (f.min ? [''] : []);
      else if (f.def !== undefined) d[f.k] = typeof f.def === 'function' ? f.def() : f.def;
    });
    return d;
  }
  function initItem(f) { const it = {}; f.fields.forEach(s => { if (s.def !== undefined) it[s.k] = s.def; }); return it; }
  function titleOf(dr) {
    const t = T[dr.tpl], d = dr.data;
    const p = (d.req && d.req[0] && d.req[0].name) || (d.srv && d.srv[0] && d.srv[0].name) || (d.sel && d.sel[0] && d.sel[0].name) || (d.ptn && d.ptn[0] && d.ptn[0].name) || d.client || '';
    return t.name + (p ? ' – ' + p.trim() : '');
  }
  function startNew(id) {
    const dr = { id: 'd' + Date.now().toString(36), tpl: id, data: initData(T[id]), created: Date.now(), done: false };
    dr.title = titleOf(dr); saveDraft(dr);
    wizard(dr.id, null);
  }
  function draftsView() {
    go('drafts');
    const ds = Object.values(drafts()).sort((a, b) => b.updated - a.updated);
    let html = ds.length ? '' : '<div class="empty">لا توجد أوراق محفوظة بعد</div>';
    ds.forEach(d => {
      const dt = new Date(d.updated);
      html += `<div class="note"><div style="font-weight:700;font-size:20px">${esc(d.title)}</div>
      <div style="color:var(--muted);font-size:16px;margin-bottom:10px">${d.done ? 'مكتملة' : 'مسودة'} – ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}</div>
      <div class="row"><button class="btn small pri" data-open="${d.id}">${d.done ? 'فتح' : 'متابعة'}</button><button class="btn small" data-dup="${d.id}">نسخة جديدة</button><button class="btn small danger" data-del="${d.id}">حذف</button></div></div>`;
    });
    screen('المسودات المحفوظة', html, `<button class="btn" id="back">رجوع</button>`);
    on('#back', 'click', () => history.back());
    on('[data-open]', 'click', e => { const d = drafts()[e.currentTarget.dataset.open]; d.done ? preview(d.id) : wizard(d.id, d.key); });
    on('[data-dup]', 'click', e => {
      const s = drafts()[e.currentTarget.dataset.dup], n = clone(s);
      n.id = 'd' + Date.now().toString(36); n.done = false; n.created = Date.now(); n.key = null; n.title = s.title + ' (نسخة)';
      saveDraft(n); toast('تم إنشاء نسخة جديدة'); wizard(n.id, null);
    });
    on('[data-del]', 'click', e => {
      const b = e.currentTarget;
      if (b.dataset.sure) { delDraft(b.dataset.del); toast('تم الحذف'); draftsView(); return; }
      b.dataset.sure = 1; b.textContent = 'اضغط للتأكيد'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'حذف'; } }, 4000);
    });
  }

  /* ---------- بناء الخطوات ---------- */
  function buildSteps(tpl, d) {
    const out = [];
    tpl.fields.forEach(f => {
      if (f.when && !f.when(d)) return;
      if (f.type === 'group') {
        if (!Array.isArray(d[f.k])) d[f.k] = [];
        while (d[f.k].length < f.min) d[f.k].push(initItem(f));
        d[f.k].forEach((it, i) => f.fields.forEach(s => out.push({ key: `${f.k}.${i}.${s.k}`, f: s, path: [f.k, i, s.k], grp: `${f.item} (${i + 1})`, parent: f })));
        out.push({ key: `${f.k}.more`, kind: 'more', f, path: [f.k] });
      } else if (f.type === 'list') {
        if (!Array.isArray(d[f.k])) d[f.k] = [];
        if (d[f.k].length < f.min) d[f.k].push('');
        d[f.k].forEach((x, i) => out.push({ key: `${f.k}.${i}`, f: { type: 'long', label: f.label, hint: f.hint, small: true, opt: f.min === 0 }, path: [f.k, i], grp: `${f.item} (${i + 1})`, parent: f }));
        out.push({ key: `${f.k}.more`, kind: 'more', f, path: [f.k] });
      } else out.push({ key: f.k, f, path: [f.k] });
    });
    return out;
  }
  const getP = (d, p) => p.reduce((o, k) => (o == null ? undefined : o[k]), d);
  function setP(d, p, v) { let o = d; for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }

  /* ---------- المعالج ---------- */
  let steps = [];
  function stepIndex() { const i = steps.findIndex(s => s.key === cur.key); return i < 0 ? 0 : i; }
  function persist() { const dr = cur.draft; dr.key = cur.key; dr.title = titleOf(dr); saveDraft(dr); }
  function moveStep(dir) {
    readInput();
    steps = buildSteps(T[cur.draft.tpl], cur.draft.data);
    const i = stepIndex() + dir;
    if (i >= steps.length) { persist(); preview(cur.draft.id); return; }
    if (i < 0) return;
    cur.key = steps[i].key; persist(); renderStep();
  }
  function wizard(id, key, push = true) {
    go('wizard', push);
    const dr = drafts()[id]; if (!dr) return home();
    cur = { draft: dr, key };
    steps = buildSteps(T[dr.tpl], dr.data);
    if (!key || !steps.find(s => s.key === key)) cur.key = steps[0].key;
    renderStep();
  }
  let readInput = () => {};

  function renderStep() {
    const tpl = T[cur.draft.tpl], d = cur.draft.data;
    steps = buildSteps(tpl, d);
    const i = stepIndex(), st = steps[i], f = st.f;
    const last = i === steps.length - 1;
    let body = `<div class="progress">الخطوة ${i + 1} من ${steps.length}</div><div class="pbar"><div style="width:${Math.round((i + 1) / steps.length * 100)}%"></div></div>`;
    readInput = () => {};

    if (st.kind === 'more') {
      const pf = st.f, arr = d[pf.k] || [];
      const many = arr.length > 0, ind = pf.item.replace(/^ال/, '').replace(/^موكِّل$/, 'موكِّل');
      body += `<p class="q">${many ? 'هل يوجد ' + esc(ind) + ' آخر؟' : esc(pf.label)}</p>`;
      body += `<p class="hint">${many ? 'المضاف حتى الآن: ' + arr.length + '. إن لم يوجد غير ذلك اضغط «لا، التالي».' : 'لا يوجد شيء مضاف. يمكنك الإضافة أو التخطي.'}</p><div class="items">`;
      arr.forEach((it, j) => {
        const lbl = pf.type === 'group' ? (H.has(it.name) ? it.name : '(بدون اسم)') : (String(it || '').trim() || '(فارغ)');
        body += `<div class="item"><span>${j + 1}- ${esc(lbl)}</span><button data-ed="${j}">تعديل</button>${arr.length > (pf.min || 0) ? `<button class="del" data-rm="${j}">حذف</button>` : ''}</div>`;
      });
      body += `</div>`;
      screen(tpl.name, body, `<button class="btn pri" id="next">${many ? 'لا، التالي' : 'تخطي'}</button><button class="btn" id="add">${many ? 'نعم، إضافة ' + esc(ind) + ' آخر' : '＋ إضافة ' + esc(pf.item)}</button><div class="row"><button class="btn small" id="prev">السابق</button></div>`, headBtns());
      on('#add', 'click', () => {
        if (pf.type === 'group') d[pf.k].push(initItem(pf)); else d[pf.k].push('');
        const n = d[pf.k].length - 1;
        cur.key = pf.type === 'group' ? `${pf.k}.${n}.${pf.fields[0].k}` : `${pf.k}.${n}`; persist(); renderStep();
      });
      on('[data-ed]', 'click', e => { const j = +e.currentTarget.dataset.ed; cur.key = pf.type === 'group' ? `${pf.k}.${j}.${pf.fields[0].k}` : `${pf.k}.${j}`; renderStep(); });
      on('[data-rm]', 'click', e => { d[pf.k].splice(+e.currentTarget.dataset.rm, 1); persist(); renderStep(); toast('تم الحذف'); });
    } else {
      const val = getP(d, st.path);
      body += st.grp ? `<div class="grp">${esc(st.grp)}${st.parent && st.parent.type === 'group' && st.parent.hint ? ` <span style="font-weight:400;color:var(--muted);font-size:16px">– ${esc(st.parent.hint)}</span>` : ''}</div>` : '';
      body += `<p class="q">${esc(st.grp && st.parent && st.parent.type === 'list' ? st.parent.item + ' رقم ' + (st.path[1] + 1) : f.label)}${f.opt ? ' <span style="font-weight:400;font-size:17px;color:var(--muted)">(اختياري)</span>' : ''}</p>`;
      const hintAbove = f.type === 'choice' || f.type === 'date' || f.type === 'yesno';
      if (f.hint && hintAbove) body += `<p class="hint">${esc(f.hint)}</p>`;
      body += inputHtml(f, val);
      if (f.hint && !hintAbove) body += `<p class="hint hint-under">${esc(f.hint)}</p>`;
      screen(tpl.name, body, `<div class="navrow"><button class="btn pri" id="next">${last ? 'معاينة الورقة' : 'التالي'}</button><button class="btn small" id="prev">السابق</button></div>`, headBtns());
      wireInput(f, st);
    }
    on('#next', 'click', () => moveStep(1));
    on('#prev', 'click', () => { if (i === 0) home(); else moveStep(-1); });
    on('#hPrev', 'click', () => { readInput(); persist(); preview(cur.draft.id); });
    on('#hHome', 'click', () => { readInput(); persist(); toast('تم الحفظ في المسودات المحفوظة'); home(); });
  }
  const headBtns = () => ({ right: '<button id="hHome">حفظ وخروج</button>', left: '<button id="hPrev">معاينة</button>' });

  function inputHtml(f, v) {
    switch (f.type) {
      case 'long': return `<textarea class="f" id="inp" dir="rtl" ${f.small ? 'style="min-height:30vh"' : ''}>${esc(v || '')}</textarea>`;
      case 'date': return `<div id="cal"></div>`;
      case 'money': return `<input class="f" id="inp" inputmode="numeric" dir="ltr" style="text-align:right" value="${esc(v || '')}"><p class="hint" id="mshow" style="margin-top:12px">${v ? esc(H.money(v)) : ''}</p>`;
      case 'yesno': return `<div class="chips"><button class="chip ${v ? 'on' : ''}" data-yn="1">نعم</button><button class="chip ${!v ? 'on' : ''}" data-yn="0">لا</button></div>`;
      case 'choice': {
        const inList = f.opts.includes(v);
        return `<div class="chips">${f.opts.map(o => `<button class="chip ${o === v ? 'on' : ''}" data-ch="${esc(o)}">${esc(o)}</button>`).join('')}</div>` +
          (f.free ? `<p class="hint" style="margin-top:8px">أو اكتب:</p><input class="f" id="inp" value="${esc(inList ? '' : (v || ''))}">` : '');
      }
      default: return `<input class="f" id="inp" ${f.numeric ? 'inputmode="numeric"' : ''} value="${esc(v || '')}" enterkeyhint="next">`;
    }
  }
  function wireInput(f, st) {
    const d = cur.draft.data, inp = document.getElementById('inp');
    const set = v => setP(d, st.path, v);
    if (f.type === 'yesno') {
      on('[data-yn]', 'click', e => { set(e.currentTarget.dataset.yn === '1'); persist(); setTimeout(() => moveStep(1), 150); renderChips('[data-yn]', e.currentTarget); });
      return;
    }
    if (f.type === 'choice') {
      on('[data-ch]', 'click', e => { set(e.currentTarget.dataset.ch); if (inp) inp.value = ''; renderChips('[data-ch]', e.currentTarget); persist(); setTimeout(() => moveStep(1), 150); });
      if (inp) readInput = () => { if (inp.value.trim()) set(inp.value.trim()); };
      return;
    }
    readInput = () => { if (inp) set(inp.value); };
    if (f.type === 'date') { calendar(getP(d, st.path) || '', v => { set(v); persist(); }); return; }
    if (f.type === 'money') inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^\d٠-٩]/g, '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)); document.getElementById('mshow').textContent = inp.value ? H.money(inp.value) : ''; });
    if (f.type !== 'long') inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); moveStep(1); } });
    setTimeout(() => { try { inp.focus({ preventScroll: true }); keepVisible(inp); if (inp.setSelectionRange && inp.type !== 'date' && inp.type !== 'number') { const n = inp.value.length; inp.setSelectionRange(n, n); } } catch (e) { } }, 60);
  }
  function keepVisible(inp) {
    const go = () => { try { inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } };
    inp.addEventListener('focus', () => setTimeout(go, 350));
    inp.addEventListener('input', () => { if (inp.tagName === 'TEXTAREA') { const r = inp.getBoundingClientRect(), m = document.getElementById('main'); if (m && r.bottom > m.getBoundingClientRect().bottom) go(); } });
  }
  function renderChips(sel, onEl) { document.querySelectorAll(sel).forEach(c => c.classList.toggle('on', c === onEl)); }


  /* ---------- تقويم عربي ---------- */
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const WD = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
  const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  function calendar(val, onPick) {
    const box = document.getElementById('cal'), now = new Date();
    let sel = val, vy, vm;
    const m0 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val || '');
    if (m0) { vy = +m0[1]; vm = +m0[2] - 1; } else { vy = now.getFullYear(); vm = now.getMonth(); }
    const today = iso(now.getFullYear(), now.getMonth(), now.getDate());
    function draw() {
      const first = new Date(vy, vm, 1).getDay();           // 0=الأحد
      const lead = (first + 1) % 7;                          // الأسبوع يبدأ السبت
      const days = new Date(vy, vm + 1, 0).getDate();
      let yrs = ''; for (let y = now.getFullYear() + 3; y >= 1950; y--) yrs += `<option value="${y}" ${y === vy ? 'selected' : ''}>${y}</option>`;
      let h = `<div class="calsel"><button class="calnav" id="cprev" aria-label="الشهر السابق">›</button>
        <select class="f calm" id="cm">${MONTHS.map((n, i) => `<option value="${i}" ${i === vm ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select class="f caly" id="cy">${yrs}</select>
        <button class="calnav" id="cnext" aria-label="الشهر التالي">‹</button></div><div class="calgrid">`;
      WD.forEach(w => { h += `<div class="calwd">${w}</div>`; });
      for (let i = 0; i < lead; i++) h += '<div></div>';
      for (let dd = 1; dd <= days; dd++) {
        const k = iso(vy, vm, dd);
        h += `<button class="calday${k === sel ? ' on' : ''}${k === today ? ' today' : ''}" data-day="${k}">${dd}</button>`;
      }
      h += `</div><div class="calout" id="cout">${sel ? 'التاريخ المختار: <b>' + esc(H.wday(sel) + ' ' + H.date(sel)) + '</b>' : 'لم يتم اختيار تاريخ — سيُترك فارغاً للكتابة باليد'}</div>
        <div class="row"><button class="btn small" id="ctoday">اليوم</button><button class="btn small" id="cclr">مسح التاريخ</button></div>`;
      box.innerHTML = h;
      box.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => { sel = b.dataset.day; onPick(sel); draw(); }));
      box.querySelector('#cprev').onclick = () => { vm--; if (vm < 0) { vm = 11; vy--; } draw(); };
      box.querySelector('#cnext').onclick = () => { vm++; if (vm > 11) { vm = 0; vy++; } draw(); };
      box.querySelector('#cm').onchange = e => { vm = +e.target.value; draw(); };
      box.querySelector('#cy').onchange = e => { vy = +e.target.value; draw(); };
      box.querySelector('#ctoday').onclick = () => { sel = today; vy = now.getFullYear(); vm = now.getMonth(); onPick(sel); draw(); };
      box.querySelector('#cclr').onclick = () => { sel = ''; onPick(''); draw(); };
    }
    draw();
  }

  /* ---------- الورقة: HTML ---------- */
  function sideInfo(dr) {
    const t = T[dr.tpl], d = dr.data, g = t.fields.find(f => f.k === 'req');
    const base = g && g.hint ? g.hint.replace(/^.*:\s*/, '') : 'الطالب', gg = H.g(d.req);
    const role = gg === 'f' ? base + 'ة' : gg === 'pl' ? base + 'ين' : base;
    let subj = t.subject ? t.subject(d) : t.name;
    if (!t.subject && H.has(d.cno)) subj += ' في الدعوى رقم ' + d.cno + (H.has(d.cyr) ? ' لسنة ' + d.cyr : '');
    return { subj, role, own: 'وتحت مسئوليت' + H.sfx(gg) };
  }
  const fsOf = (o, tp) => o.pfs === 'auto' || !o.pfs ? (tp.fs || 14) : +o.pfs;
  const isBold = (o, tp) => o.pbold === 'auto' || o.pbold === undefined ? tp.bold !== false : (o.pbold === true || o.pbold === '1');
  const lhAddr = a => String(a || '').replace(/^برقم\s*/, '');
  function blocksToHtml(bs, dr) {
    const o = office(), tp = dr ? T[dr.tpl] : {}, lhs = tp.lh || 'full', bold = isBold(o, tp);
    let h = `<div class="page${tp.tu === false ? ' notu' : ''}${tp.loose ? ' loose' : ''}" style="font-size:${fsOf(o, tp)}pt;${bold ? 'font-weight:700' : ''}">`;
    if (o.lh && lhs === 'small') h += `<div class="lhs"><div class="lhn">${esc(o.name)}</div><div>المحامي</div><div>${esc(o.title.replace(/^المحامي\s*/, ''))}</div></div>`;
    else if (o.lh && lhs === 'center') h += `<div class="lhc"><div class="lhn">${esc(o.name)}</div><div>المحامي</div><div>${esc(o.title.replace(/^المحامي\s*/, ''))}</div><div>${esc(lhAddr(o.addr))}</div>${o.phone ? `<div>ت / ${esc(o.phone)}</div>` : ''}</div>`;
    else if (o.lh && lhs === 'full') h += `<table class="lh"><tr><td class="lht"><div class="lhn">${esc(o.name)}</div><div>${esc(o.title)}</div>${o.sub ? `<div>${esc(o.sub)}</div>` : ''}<div>${esc(lhAddr(o.addr))}</div>${o.phone ? `<div>ت / ${esc(o.phone)}</div>` : ''}</td><td class="lhl"><img src="${+o.logo === 2 ? 'logo2.png' : 'logo.png'}" alt=""></td></tr></table>`;
    let inner = '';
    bs.forEach(b => {
      const src = b.src ? ` data-src="${esc(b.src)}"` : '';
      if (b.t === 'p') inner += `<p class="${b.a || 'r'}${b.b ? ' b' : ''}"${src}>${esc(b.x)}</p>`;
      else if (b.t === 'h') inner += `<p class="h"${src}>${esc(b.x)}</p>`;
      else if (b.t === 't') inner += `<p class="t"${src}>${esc(b.x)}</p>`;
      else if (b.t === 'li') inner += `<p class="li"${src}><span class="b">${esc(b.n || '')}</span>${esc(b.x)}</p>`;
      else if (b.t === 'sp') inner += `<p>&nbsp;</p>`;
      else if (b.t === 'box') inner += `<div class="box"></div>`;
      else if (b.t === 'pb') inner += `<div style="page-break-before:always;height:18pt"></div>`;
      else if (b.t === 'tbl') inner += `<table${src}>` + b.rows.map(r => '<tr>' + r.map((c, i) => `<td class="${(b.c && b.c[i]) || 'r'}" style="width:${100 / r.length}%">${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
    });
    if (bs.side && o.side && dr) {
      const si = sideInfo(dr);
      h += `<table class="sw"><tr><td class="sidec"><p class="c b">الموضوع</p><p class="c">${esc(si.subj)}</p><p>&nbsp;</p><p class="c">بناءً على طلب ${esc(si.role)} ${esc(si.own)}</p><p>&nbsp;</p><p class="c b">وكيل ${esc(si.role)}</p><p class="c b">المحامي</p></td><td class="mainc">${inner}</td></tr></table>`;
    } else h += inner;
    return h + '</div>';
  }
  function withDefaults(tpl, d) {
    const x = Object.assign({}, d);
    tpl.fields.forEach(f => {
      if (f.type === 'group' || x[f.k] !== undefined && !(Array.isArray(x[f.k]) && !x[f.k].length && f.def)) return;
      if (f.def !== undefined) x[f.k] = typeof f.def === 'function' ? f.def() : clone(f.def);
    });
    return x;
  }
  function renderDoc(dr) { try { return T[dr.tpl].render(withDefaults(T[dr.tpl], dr.data)); } catch (e) { console.error(e); return [{ t: 'p', x: 'حدث خطأ أثناء تكوين الورقة: ' + e.message }]; } }

  /* ---------- المعاينة والتصدير ---------- */
  function fileName(dr) { const d = new Date(); return (dr.title || T[dr.tpl].name).replace(/[\\/:*?"<>|]/g, '').slice(0, 80) + ' - ' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function preview(id, push = true) {
    go('preview', push);
    const dr = drafts()[id]; cur = cur && cur.draft.id === id ? cur : { draft: dr, key: dr.key }; cur.draft = dr;
    dr.done = true; saveDraft(dr);
    const html = `<div class="note" style="font-size:17px">اضغط على أي فقرة في الورقة للرجوع إليها وتعديلها.</div><div class="pvwrap" id="pvw"><div class="pvscale" id="pvs">${blocksToHtml(renderDoc(dr), dr)}</div></div>`;
    screen('معاينة الورقة', html,
      `<div class="row"><button class="btn pri" id="pdf">حفظ PDF</button><button class="btn pri" id="word">حفظ Word</button></div>
       <div class="row"><button class="btn small" id="share">مشاركة Word</button><button class="btn small" id="prn">طباعة</button><button class="btn small" id="edit">تعديل</button></div>`,
      { right: '<button id="hHome">الرئيسية</button>' });
    fit(); window.addEventListener('resize', fit);
    on('[data-src]', 'click', e => {
      const src = e.currentTarget.dataset.src; steps = buildSteps(T[dr.tpl], dr.data);
      const s = steps.find(x => x.key === src || x.key.startsWith(src + '.')) || steps.find(x => x.path[0] === src);
      wizard(dr.id, s ? s.key : null);
    });
    on('#edit', 'click', () => wizard(dr.id, dr.key));
    on('#hHome', 'click', () => home());
    on('#word', 'click', () => saveWordDialog(dr));
    on('#pdf', 'click', () => askName(dr, 'حفظ PDF', [['pdf', 'متابعة إلى حفظ PDF', 'pri']], (act, name) => printDoc(dr, true, name)));
    on('#prn', 'click', () => printDoc(dr, false));
    on('#share', 'click', () => shareDoc(dr));
  }
  function fit() {
    const w = document.getElementById('pvw'), s = document.getElementById('pvs'); if (!w || !s) return;
    const page = s.querySelector('.page'), pw = page.offsetWidth, avail = w.clientWidth - 20, k = Math.min(1, avail / pw);
    s.style.transform = `scale(${k})`; s.style.width = pw + 'px'; w.style.height = (s.scrollHeight * k + 20) + 'px';
    s.style.marginRight = '0';
  }
  function err(e) { console.error(e); toast('حدث خطأ: ' + (e && e.message || e), 5000); }
  function saveBlob(blob, name, quiet) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    if (!quiet) toast('تم الحفظ ✔\nالاسم: ' + name + '\nالمكان: تطبيق «الملفات» ← التنزيلات (Downloads)', 7000);
  }
  /* نافذة اسم الملف */
  function askName(dr, title, actions, cb) {
    document.querySelectorAll('.sheet-bg').forEach(e => e.remove());
    const bg = document.createElement('div'); bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(title)}"><p class="q" style="font-size:22px">${esc(title)}</p>
      <p class="hint" style="margin-bottom:8px">اسم الملف (يمكنك تغييره):</p>
      <textarea class="f" id="fname" style="min-height:90px;font-size:19px">${esc(fileName(dr))}</textarea>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">${actions.map(([k, t, c]) => `<button class="btn ${c || ''}" data-act="${k}">${esc(t)}</button>`).join('')}
      <button class="btn small" data-act="cancel">إلغاء</button></div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b && e.target !== bg) return;
      const act = b ? b.dataset.act : 'cancel';
      const name = (bg.querySelector('#fname').value || '').replace(/[\\/:*?"<>|\n]/g, ' ').trim() || fileName(dr);
      bg.remove(); if (act !== 'cancel') cb(act, name);
    });
  }
  function saveWordDialog(dr) {
    const acts = [['dl', 'حفظ في التنزيلات (Downloads)', 'pri']];
    if (navigator.share) acts.push(['other', 'حفظ في مكان آخر (Drive / الملفات / واتساب)', '']);
    askName(dr, 'حفظ ملف Word', acts, async (act, name) => {
      try {
        const b = await makeDocx(dr), fn = name + '.docx';
        if (act === 'other') return shareFile(b, fn, dr.title);
        if (window.showSaveFilePicker) {                       // على الكمبيوتر: نافذة «حفظ باسم» حقيقية
          try {
            const h = await window.showSaveFilePicker({ suggestedName: fn, types: [{ description: 'Word', accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] } }] });
            const w = await h.createWritable(); await w.write(b); await w.close(); toast('تم الحفظ: ' + h.name, 4000); return;
          } catch (e) { if (e && e.name === 'AbortError') return; }
        }
        saveBlob(b, fn, true); savedSheet(b, fn, dr.title);
      } catch (e) { err(e); }
    });
  }
  function savedSheet(b, fn, title) {
    document.querySelectorAll('.sheet-bg').forEach(e => e.remove());
    const bg = document.createElement('div'); bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog"><p class="q" style="font-size:23px;color:var(--ok)">✔ تم حفظ الملف</p>
      <div class="note"><div><b>الاسم:</b> ${esc(fn)}</div><div><b>المكان:</b> تطبيق «الملفات» ← التنزيلات (Downloads)</div></div>
      <div style="display:flex;flex-direction:column;gap:10px">
      ${navigator.share ? '<button class="btn pri" data-act="share">مشاركة الملف الآن (واتساب / بريد / Drive)</button>' : ''}
      <button class="btn small" data-act="close">تم</button></div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => {
      const btn = e.target.closest('[data-act]'); if (!btn && e.target !== bg) return;
      bg.remove(); if (btn && btn.dataset.act === 'share') shareFile(b, fn, title);
    });
  }
  async function shareFile(b, fn, title) {
    const f = new File([b], fn, { type: b.type });
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title });
      else { saveBlob(b, fn); toast('المشاركة غير متاحة على هذا الجهاز — تم الحفظ في التنزيلات', 4000); }
    } catch (e) { if (e && e.name !== 'AbortError') err(e); }
  }
  function printDoc(dr, asPdf, name) {
    const p = document.getElementById('print'); p.innerHTML = blocksToHtml(renderDoc(dr), dr);
    const old = document.title; document.title = name || fileName(dr);
    if (asPdf) toast('في شاشة الطباعة اختر الطابعة: «حفظ بتنسيق PDF» ثم اضغط زر التنزيل', 6000);
    setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 1000); }, asPdf ? 1600 : 100);
  }
  async function shareDoc(dr) {
    try { const b = await makeDocx(dr); await shareFile(b, fileName(dr) + '.docx', dr.title); } catch (e) { err(e); }
  }

  /* ---------- Word (.docx) ---------- */
  function loadDocx() {
    if (window.docx) return Promise.resolve(window.docx);
    return new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'docx.js'; sc.onload = () => ok(window.docx); sc.onerror = () => no(new Error('تعذر تحميل مكتبة Word')); document.head.appendChild(sc); });
  }
  function makeDocx(dr) { return loadDocx().then(() => buildDocx(dr)); }
  async function buildDocx(dr) {
    const X = window.docx;
    const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber, PageBreak } = X;
    const FONT = 'Arial', o = office(), TP = T[dr.tpl], FS = fsOf(o, TP), LHS = TP.lh || 'full', BOLD = isBold(o, TP);
    const { ImageRun } = X;
    const run = (text, p = {}) => { const b = p.b != null ? !!p.b : BOLD; return new TextRun({ text, bold: b, boldComplexScript: b, size: (p.s || FS) * 2, sizeComplexScript: (p.s || FS) * 2, font: { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT }, rightToLeft: true, underline: p.u ? {} : undefined }); };
    const AL = { c: AlignmentType.CENTER, j: AlignmentType.BOTH };
    const LO = !!TP.loose, para = (children, al, p = {}) => new Paragraph({ bidirectional: true, alignment: AL[al], spacing: { after: p.after == null ? (LO ? 180 : 60) : p.after, before: p.before || 0, line: LO ? 400 : 320 }, children });
    const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const borders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
    const blocks = renderDoc(dr), kids = [];
    blocks.forEach(b => {
      if (b.t === 'p') kids.push(para([run(b.x, { b: b.b ? 1 : undefined })], b.a));
      else if (b.t === 'h') kids.push(para([run(b.x, { b: 1, s: FS + 2 })], 'c', { before: 120, after: 100 }));
      else if (b.t === 't') kids.push(para([run(b.x, { b: 1, s: FS + 4, u: TP.tu !== false })], 'c', { after: 160 }));
      else if (b.t === 'box') { const L = { style: BorderStyle.SINGLE, size: 8, color: '000000' }; kids.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: L, bottom: L, left: L, right: L, insideHorizontal: NB, insideVertical: NB }, rows: [new TableRow({ children: [new TableCell({ children: [para([run('', { s: 6 })], undefined, { after: 0 })] })] })] }), para([run('')], undefined, { after: 0 })); }
      else if (b.t === 'li') kids.push(para([run(b.n || '', { b: 1 }), run(b.x)], 'j'));
      else if (b.t === 'sp') kids.push(para([run('')]));
      else if (b.t === 'pb') kids.push(new Paragraph({ children: [new PageBreak()] }));
      else if (b.t === 'tbl') {
        const n = Math.max(...b.rows.map(r => r.length));
        kids.push(new Table({
          visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, borders,
          rows: b.rows.map(r => new TableRow({
            children: r.map((c, i) => new TableCell({ borders, width: { size: Math.floor(100 / n), type: WidthType.PERCENTAGE }, children: [para([run(c)], (b.c && b.c[i]) || 'r', { after: 20 })] }))
          }))
        }));
      }
    });
    let body = kids;
    if (blocks.side && o.side) {
      const si = sideInfo(dr), LINE = { style: BorderStyle.SINGLE, size: 18, color: '000000' };
      const sp = (t, b) => para([run(t, { b: b ? 1 : undefined, s: FS - 2 })], 'c', { after: 40 });
      body = [new Table({
        visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, borders,
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: NB, bottom: NB, right: NB, left: LINE }, margins: { left: 120 },
            children: [sp('الموضوع', 1), sp(si.subj), sp(''), sp('بناءً على طلب ' + si.role + ' ' + si.own), sp(''), sp('وكيل ' + si.role, 1), sp('المحامي', 1)] }),
          new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: NB, bottom: NB, left: NB, right: NB }, margins: { right: 160 }, children: kids.length ? kids : [para([run('')])] })
        ] })]
      })];
    }
    if (o.lh && (LHS === 'small' || LHS === 'center')) {
      const al = LHS === 'center' ? 'c' : 'r';
      const lp = (t, s, b) => para([run(t, { b, s })], al === 'c' ? 'c' : undefined, { after: 0 });
      const rows = [lp(o.name, FS + 4, 1), lp('المحامي', FS - 3, 1), lp(o.title.replace(/^المحامي\s*/, ''), FS - 3, 1)];
      if (LHS === 'center') { rows.push(lp(lhAddr(o.addr), FS - 3, 0)); if (o.phone) rows.push(lp('ت / ' + o.phone, FS - 3, 0)); }
      if (LHS === 'small') body = [new Table({ visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: [new TableRow({ children: [new TableCell({ borders, width: { size: 35, type: WidthType.PERCENTAGE }, children: rows }), new TableCell({ borders, width: { size: 65, type: WidthType.PERCENTAGE }, children: [para([run('')])] })] })] }), para([run('')], undefined, { after: 0 }), ...body];
      else body = [...rows, para([run('')], undefined, { after: 120 }), ...body];
    }
    if (o.lh && LHS === 'full') {
      let logo = null;
      try { logo = await (await fetch(+o.logo === 2 ? 'logo2.png' : 'logo.png')).arrayBuffer(); } catch (e) { }
      const lp = (t, s, b) => para([run(t, { b, s })], 'c', { after: 0 });
      const txt = [lp(o.name, FS + 6, 1), lp(o.title, FS - 2, 1)];
      if (o.sub) txt.push(lp(o.sub, FS - 2, 1));
      txt.push(lp(lhAddr(o.addr), FS - 2, 1)); if (o.phone) txt.push(lp('ت / ' + o.phone, FS - 2, 1));
      const BOT = { style: BorderStyle.SINGLE, size: 18, color: '000000' };
      body = [new Table({
        visuallyRightToLeft: true, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB, bottom: BOT },
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: { top: NB, left: NB, right: NB, bottom: BOT }, children: txt }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: { top: NB, left: NB, right: NB, bottom: BOT }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: logo ? [new ImageRun({ type: 'png', data: logo, transformation: { width: 70, height: 70 } })] : [] })] })
        ] })]
      }), para([run('')], 'r', { after: 0 }), ...body];
    }
    const doc = new Document({
      creator: o.name, title: dr.title,
      styles: { default: { document: { run: { font: FONT, size: FS * 2, sizeComplexScript: FS * 2, rightToLeft: true } } } },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, right: 1134, left: 1000 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] }) },
        children: body
      }]
    });
    return Packer.toBlob(doc);
  }

  /* ---------- الإعدادات ---------- */
  function settings() {
    go('settings');
    const o = office(), p = prefs();
    const html = `
      <div class="sec">بيانات المكتب (تُكتب تلقائياً في كل ورقة)</div>
      <p class="q" style="font-size:20px">اسم المحامي</p><input class="f" id="s_name" value="${esc(o.name)}">
      <p class="q" style="font-size:20px;margin-top:14px">الصفة</p><input class="f" id="s_title" value="${esc(o.title)}">
      <p class="q" style="font-size:20px;margin-top:14px">عنوان المكتب</p><p class="hint">يُكتب في رأس الورقة وداخل الورقة (بمكتبه الكائن …)</p><textarea class="f" id="s_addr" style="min-height:110px">${esc(o.addr)}</textarea>
      <p class="q" style="font-size:20px;margin-top:14px">رقم الهاتف (في رأس الورقة)</p><input class="f" id="s_phone" inputmode="tel" dir="ltr" style="text-align:right" value="${esc(o.phone || '')}">
      <p class="q" style="font-size:20px;margin-top:14px">سطر إضافي تحت الاسم (اختياري)</p><input class="f" id="s_sub" value="${esc(o.sub || '')}" placeholder="مثال: للمحاماة والاستشارات الضريبية">
      <div class="sec">شكل الورقة</div>
      <div class="chips"><button class="chip ${o.lh ? 'on' : ''}" data-o="lh:1">إظهار رأس الورقة</button><button class="chip ${!o.lh ? 'on' : ''}" data-o="lh:0">بدون رأس</button></div>
      <p class="hint">الشعار</p><div class="chips"><button class="chip ${+o.logo !== 2 ? 'on' : ''}" data-o="logo:1"><img src="logo.png" alt="الميزان" style="height:56px;vertical-align:middle"></button><button class="chip ${+o.logo === 2 ? 'on' : ''}" data-o="logo:2"><img src="logo2.png" alt="اليد والميزان" style="height:56px;vertical-align:middle"></button></div>
      <div class="chips"><button class="chip ${o.side ? 'on' : ''}" data-o="side:1">العمود الجانبي (الموضوع)</button><button class="chip ${!o.side ? 'on' : ''}" data-o="side:0">بدون عمود</button></div>
      <p class="hint">حجم خط الورقة</p><div class="chips"><button class="chip ${o.pfs === 'auto' || !o.pfs ? 'on' : ''}" data-o="pfs:auto">حسب النموذج</button>${[14, 16, 18].map(v => `<button class="chip ${+o.pfs === v ? 'on' : ''}" data-o="pfs:${v}">${v}</button>`).join('')}</div>
      <p class="hint">سُمك الخط</p><div class="chips"><button class="chip ${o.pbold === 'auto' || o.pbold === undefined ? 'on' : ''}" data-o="pbold:auto">حسب النموذج</button><button class="chip ${o.pbold === true || o.pbold === '1' ? 'on' : ''}" data-o="pbold:1">عريض دائماً</button><button class="chip ${o.pbold === false || o.pbold === '0' ? 'on' : ''}" data-o="pbold:0">عادي دائماً</button></div>
      <div class="sec">العرض</div>
      <p class="q" style="font-size:20px">حجم الخط</p>
      <div class="chips">${[[18, 'عادي'], [20, 'كبير'], [23, 'كبير جداً']].map(([v, n]) => `<button class="chip ${p.fs === v ? 'on' : ''}" data-fs="${v}">${n}</button>`).join('')}</div>
      <div class="chips"><button class="chip ${!p.dark ? 'on' : ''}" data-dk="0">وضع فاتح</button><button class="chip ${p.dark ? 'on' : ''}" data-dk="1">وضع داكن</button></div>
      <div class="sec">أوراق المحضرين</div>
      <div class="chips"><button class="chip ${o.khataba ? 'on' : ''}" data-kh="1">إضافة سطر «مخاطباً مع»</button><button class="chip ${!o.khataba ? 'on' : ''}" data-kh="0">بدون</button></div>
      <div class="sec">نسخة احتياطية</div>
      <div class="row"><button class="btn small" id="bk">حفظ نسخة احتياطية</button><button class="btn small" id="rs">استرجاع نسخة</button></div>
      <input type="file" id="rsf" accept=".json,application/json" style="display:none">
      <p class="hint" style="margin-top:20px">الإصدار ${VERSION} – كل البيانات محفوظة على هذا الهاتف فقط.</p>`;
    screen('الإعدادات', html, `<button class="btn pri" id="save">حفظ</button><button class="btn small" id="back">رجوع</button>`);
    const gv = id => document.getElementById(id).value.trim();
    const sv = () => { LS.set('lw.office', Object.assign(LS.get('lw.office', {}), { name: gv('s_name'), title: gv('s_title'), addr: gv('s_addr'), phone: gv('s_phone'), sub: gv('s_sub') })); };
    on('#save', 'click', () => { sv(); toast('تم الحفظ'); home(); });
    on('#back', 'click', () => history.back());
    on('[data-fs]', 'click', e => { LS.set('lw.prefs', Object.assign(prefs(), { fs: +e.currentTarget.dataset.fs })); applyPrefs(); sv(); settings(); });
    on('[data-dk]', 'click', e => { LS.set('lw.prefs', Object.assign(prefs(), { dark: e.currentTarget.dataset.dk === '1' })); applyPrefs(); sv(); settings(); });
    on('[data-kh]', 'click', e => { sv(); LS.set('lw.office', Object.assign(LS.get('lw.office', {}), { khataba: e.currentTarget.dataset.kh === '1' })); settings(); });
    on('[data-o]', 'click', e => { sv(); const [k, v] = e.currentTarget.dataset.o.split(':'); LS.set('lw.office', Object.assign(LS.get('lw.office', {}), { [k]: k === 'logo' ? +v : k === 'pfs' ? (v === 'auto' ? 'auto' : +v) : k === 'pbold' ? v : v === '1' })); settings(); });
    on('#bk', 'click', () => saveBlob(new Blob([JSON.stringify({ v: VERSION, office: LS.get('lw.office', {}), drafts: drafts() })], { type: 'application/json' }), 'نسخة احتياطية - نماذج المحامي.json'));
    on('#rs', 'click', () => document.getElementById('rsf').click());
    on('#rsf', 'change', e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { const j = JSON.parse(t); if (j.office) LS.set('lw.office', j.office); if (j.drafts) LS.set('lw.drafts', Object.assign(drafts(), j.drafts)); toast('تم الاسترجاع'); home(); }).catch(() => toast('الملف غير صالح'));
    });
  }

  /* ---------- تشغيل ---------- */
  history.replaceState({ v: 'home' }, '');
  home(false);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
  window.__test = { drafts, preview, wizard, makeDocx, blocksToHtml, renderDoc, T };
})();
