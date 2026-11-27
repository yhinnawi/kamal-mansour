/* نماذج المحامي — تعريف النماذج
   كل نموذج = أسئلة (fields) + دالة render تُرجع فقرات الورقة (blocks).
   أنواع الفقرات: p (فقرة) · h (عنوان) · t (عنوان رئيسي) · li (بند مرقّم) · tbl (جدول بلا حدود) · sp (سطر فارغ) */
(function () {
  'use strict';

  /* ---------- أدوات النص العربي ---------- */
  const BL = '……………';                       // فراغ يُملأ باليد
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً', 'ثامناً', 'تاسعاً', 'عاشراً',
    'حادي عشر', 'ثاني عشر', 'ثالث عشر', 'رابع عشر', 'خامس عشر', 'سادس عشر', 'سابع عشر', 'ثامن عشر', 'تاسع عشر', 'عشرون'];
  const CL = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
    'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون'];

  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر',
    'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUND = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function u1000(n) {
    const p = [], h = Math.floor(n / 100), r = n % 100;
    if (h) p.push(HUND[h]);
    if (r) {
      if (r < 20) p.push(ONES[r]);
      else { const o = r % 10, t = Math.floor(r / 10); p.push(o ? ONES[o] + ' و' + TENS[t] : TENS[t]); }
    }
    return p.join(' و');
  }
  function scale(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return u1000(n) + ' ' + few;
    return u1000(n) + ' ' + many;
  }
  function tafqit(num) {
    let n = Math.floor(Math.abs(Number(num) || 0));
    if (!n) return 'صفر';
    const b = Math.floor(n / 1e9), m = Math.floor((n % 1e9) / 1e6), t = Math.floor((n % 1e6) / 1e3), r = n % 1e3, p = [];
    if (b) p.push(scale(b, 'مليار', 'ملياران', 'مليارات', 'مليار'));
    if (m) p.push(scale(m, 'مليون', 'مليونان', 'ملايين', 'مليون'));
    if (t) p.push(scale(t, 'ألف', 'ألفان', 'آلاف', 'ألف'));
    if (r) p.push(u1000(r));
    return p.join(' و');
  }

  const H = {
    BL,
    v: (x, len) => (x && String(x).trim()) ? String(x).trim() : (len ? '…'.repeat(len) : BL),
    has: x => !!(x && String(x).trim()),
    date(x) { if (!x) return ''; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x); return m ? (+m[3]) + '/' + (+m[2]) + '/' + m[1] : x; },
    dateOr(x) { return H.date(x) || '……/……/……'; },
    wday(x) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x || ''); if (!m) return ''; return DAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()]; },
    year: () => new Date().getFullYear(),
    num: n => String(n || '').replace(/[^\d.]/g, ''),
    tafqit,
    money(n) { const x = H.num(n); if (!x) return BL + ' جنيه'; return x + ' جنيه (فقط ' + tafqit(x) + ' جنيه مصري لا غير)'; },
    ord: i => ORD[i] || (i + 1) + '-',
    cl: i => CL[i] || String(i + 1),
    /* الجنس والعدد من اللقب */
    g(list) {
      list = (list || []).filter(p => p && H.has(p.name));
      if (list.length > 1) return 'pl';
      const p = list[0] || {}, t = p.title || '';
      if (t === 'السادة' || /^ورثة/.test(p.name || '')) return 'pl';
      if (t === 'السيدة' || t === 'الشركة') return 'f';
      return 'm';
    },
    pick: (g, m, f, pl) => g === 'pl' ? pl : g === 'f' ? f : m,
    sfx: g => H.pick(g, 'ه', 'ها', 'هم'),
    one(p) {                                         // سطر طرف واحد
      if (!p) return '';
      const t = p.title && p.title !== 'بدون لقب' ? p.title + ' / ' : '';
      const g = H.g([p]);
      let s = t + H.v(p.name);
      if (H.has(p.cap)) s += ' – ' + p.cap.trim();
      if (H.has(p.addr)) { const a = p.addr.trim(); s += ' – ' + (/^(و|ي|ب)/.test(a) ? a : H.pick(g, 'المقيم', 'المقيمة', 'المقيمون') + ' ' + a); }
      if (H.has(p.nid)) s += ' – ' + H.pick(g, 'ويحمل', 'وتحمل', 'ويحملون') + ' رقم قومي ' + p.nid.trim();
      return s;
    },
    names(list) { return (list || []).filter(p => H.has(p.name)).map(p => (p.title && p.title !== 'بدون لقب' ? p.title + ' / ' : '') + p.name.trim()).join(' و') || BL; },
    paras(text, src, a) {                            // نص طويل → فقرات
      const out = [];
      String(text || '').split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(x => out.push({ t: 'p', x, a: a || 'j', src }));
      return out;
    },
    items(list) { return (list || []).map(s => String(s || '').trim()).filter(Boolean); },
    numbered(list, src, style) {                     // أولاً: … ثانياً: …
      return H.items(list).map((x, i) => ({ t: 'li', n: style === 'n' ? (i + 1) + '- ' : H.ord(i) + ': ', x, src }));
    },
    office: () => (window.APP && window.APP.office()) || {}
  };

  /* ---------- قوائم الاختيار ---------- */
  const COURTS = ['محكمة الإسكندرية الابتدائية', 'محكمة شرق الإسكندرية الابتدائية', 'محكمة غرب الإسكندرية الابتدائية',
    'محكمة استئناف الإسكندرية', 'محكمة سيدي جابر المدنية الجزئية', 'محكمة الرمل المدنية الجزئية', 'محكمة المنتزه المدنية الجزئية',
    'محكمة محرم بك المدنية الجزئية', 'محكمة اللبان المدنية الجزئية', 'محكمة العطارين المدنية الجزئية', 'محكمة الجمرك المدنية الجزئية',
    'محكمة كرموز المدنية الجزئية', 'محكمة الرمل لشئون الأسرة', 'محكمة تنفيذ شرق الإسكندرية', 'محكمة القضاء الإداري بالإسكندرية'];
  const CTYPES = ['مدني كلي', 'مدني جزئي', 'صحة توقيع', 'تعويضات', 'مستعجل', 'إيجارات', 'تنفيذ', 'أسرة', 'عمال', 'ضرائب', 'م.ك'];
  const SEATS = ['بمجمع المحاكم الجديد بالمنشية – الإسكندرية', 'بالمحكمة البحرية – المنشية – الإسكندرية'];
  const TITLES = ['السيد', 'السيدة', 'السادة', 'السيد الأستاذ', 'السيد المستشار', 'الشركة', 'بدون لقب'];
  const ROLES = ['مدعي', 'مدعى عليه', 'مستأنف', 'مستأنف ضده', 'طاعن', 'مطعون ضده', 'متهم', 'مدعي بالحق المدني', 'متدخل هجومياً', 'مستشكل', 'سلطة الاتهام'];

  /* ---------- منشئات الأسئلة ---------- */
  const F = {
    text: (k, label, o) => Object.assign({ k, type: 'text', label }, o),
    long: (k, label, o) => Object.assign({ k, type: 'long', label }, o),
    date: (k, label, o) => Object.assign({ k, type: 'date', label }, o),
    num: (k, label, o) => Object.assign({ k, type: 'num', label }, o),
    money: (k, label, o) => Object.assign({ k, type: 'money', label }, o),
    choice: (k, label, opts, o) => Object.assign({ k, type: 'choice', label, opts }, o),
    yesno: (k, label, def, o) => Object.assign({ k, type: 'yesno', label, def: !!def }, o),
    group: (k, label, item, fields, o) => Object.assign({ k, type: 'group', label, item, fields, min: 1 }, o),
    list: (k, label, item, o) => Object.assign({ k, type: 'list', label, item, min: 1 }, o)
  };
  const party = (o = {}) => [
    F.choice('title', 'اللقب', TITLES, { def: 'السيد' }),
    F.text('name', 'الاسم بالكامل', { hint: 'يمكنك الضغط على الميكروفون في لوحة المفاتيح وقول الاسم' }),
    F.text('cap', 'الصفة (إن وجدت)', { opt: true, hint: 'مثال: بصفته الممثل القانوني لشركة … / أحد ورثة المرحوم …' }),
    ...(o.noAddr ? [] : [F.text('addr', 'العنوان', { opt: !!o.addrOpt, hint: 'رقم العقار – الشارع – القسم – المحافظة. أو اكتب: ويعلن بهيئة قضايا الدولة …' })]),
    ...(o.nid ? [F.text('nid', 'الرقم القومي', { opt: true, numeric: true, hint: '14 رقماً — اتركه فارغاً إن لم يكن متاحاً' })] : [])
  ];
  const REQ = (label = 'الطالب', o = {}) => F.group('req', 'الموكِّل', 'الموكِّل', party({ nid: true, ...o }), { hint: 'يُكتب في الورقة بصفة: ' + label });
  const SRV = (label = 'المعلن إليه', o = {}) => F.group('srv', label, label, party(o));
  const CASE = (p = '', o = {}) => [
    F.text(p + 'cno', o.noLabel || 'رقم الدعوى', { numeric: true }),
    F.text(p + 'cyr', 'لسنة', { numeric: true, def: String(new Date().getFullYear()) }),
    F.choice(p + 'ctype', 'نوع الدعوى', CTYPES, { free: true, opt: true }),
    F.choice(p + 'court', o.courtLabel || 'المحكمة', COURTS, { free: true }),
    F.text(p + 'circ', 'رقم الدائرة', { opt: true, numeric: true })
  ];
  const SUMMON = (o = {}) => [
    ...(o.noCourt ? [] : [F.choice('scourt', o.courtLabel || 'المحكمة المطلوب الحضور أمامها', o.courts || COURTS, { free: true }),
      F.text('scirc', 'رقم الدائرة', { opt: true, numeric: true }),
      F.choice('sctype', 'نوع الدائرة', CTYPES, { free: true, opt: true })]),
    F.choice('seat', 'مقر المحكمة', SEATS, { free: true, opt: true }),
    F.date('hdate', 'تاريخ الجلسة', { opt: true, hint: 'اتركه فارغاً إذا أردت كتابته باليد' })
  ];
  const FEES = [
    F.yesno('fees', 'إلزام الخصم بالمصروفات ومقابل أتعاب المحاماة؟', true),
    F.yesno('nafaz', 'طلب شمول الحكم بالنفاذ المعجل بلا كفالة؟', false)
  ];
  const EXTRA = F.long('extra', 'فقرات إضافية (اختياري)', { opt: true, hint: 'أي نص تريد إضافته للوقائع. كل سطر = فقرة' });

  /* ---------- هيكل أوراق المحضرين (مشترك) ---------- */
  function bailiff(d, o) {
    const off = H.office(), out = [];
    const req = (d.req || []).filter(p => H.has(p.name)), srv = (d.srv || []).filter(p => H.has(p.name));
    const gr = H.g(req), gs = H.g(srv), S = H.sfx(gs);
    const doc = o.doc || 'هذه الصحيفة';
    out.push({ t: 'p', x: 'أنه في يوم ' + (H.wday(d.pdate) || BL) + ' الموافق ' + (H.date(d.pdate) || '……/……/' + H.year()) + ' الساعة ' + BL });
    if (req.length > 1) {
      out.push({ t: 'p', x: 'بناءً على طلب كلٍّ من:', src: 'req' });
      req.forEach((p, i) => out.push({ t: 'li', n: (i + 1) + '- ', x: H.one(p), src: 'req' }));
      out.push({ t: 'p', x: 'ومحلهم المختار مكتب الأستاذ / ' + off.name + ' – ' + off.title + ' – بمكتبه الكائن ' + off.addr + '.', src: 'req' });
    } else {
      out.push({ t: 'p', a: 'j', x: 'بناءً على طلب ' + H.one(req[0] || { name: '' }) + ' – ومحل' + H.sfx(gr) + ' المختار مكتب الأستاذ / ' + off.name + ' – ' + off.title + ' – بمكتبه الكائن ' + off.addr + '.', src: 'req' });
    }
    out.push({ t: 'p', x: 'أنا ' + BL + ' محضر محكمة ' + BL + ' قد انتقلت إلى حيث إقامة:' });
    const sl = srv.length ? srv : [{ name: '' }], bare = p => !H.has(p.addr) && !H.has(p.cap) && !H.has(p.nid);
    for (let i = 0; i < sl.length; i++) {
      const n = j => (sl.length > 1 ? (j + 1) + '- ' : '');
      if (bare(sl[i]) && sl[i + 1] && bare(sl[i + 1])) {         // اسمان في سطر واحد كما في أوراق المكتب
        out.push({ t: 'tbl', rows: [[n(i) + H.one(sl[i]), n(i + 1) + H.one(sl[i + 1])]], c: ['r', 'r'], src: 'srv' }); i++;
      } else out.push({ t: 'li', n: n(i), x: H.one(sl[i]), src: 'srv' });
    }
    if (o.khataba !== false && off.khataba !== false) out.push({ t: 'p', x: 'مخاطباً مع: ' + BL });
    out.push({ t: 'p', b: 1, a: 'c', x: (o.verb || 'وأعلنت') + S + ' بالآتي' });
    o.facts.forEach(b => out.push(b));
    out.side = true;
    if (o.end) { o.end.forEach(b => out.push(b)); return out; }
    out.push({ t: 'h', x: 'بنـاء عليــه' });
    let s = 'أنا المحضر سالف الذكر قد انتقلت إلى حيث إقامة المعلن إلي' + S + ' وأعلنت' + S + ' وسلمت' +
      H.pick(gs, 'ه', 'ها', ' كلاً منهم') + ' صورة من ' + doc + ' وكلفت' + S + ' بالحضور أمام ' + H.v(d.scourt);
    if (H.has(d.scirc) || H.has(d.sctype)) s += ' الدائرة (' + H.v(d.scirc, 4) + ')' + (H.has(d.sctype) ? ' ' + d.sctype : '');
    s += (H.has(d.seat) ? ' والكائن مقرها ' + d.seat : '') + ' وذلك بجلستها المنعقدة علناً يوم ' +
      (H.wday(d.hdate) || BL) + ' الموافق ' + H.dateOr(d.hdate) + ' من الساعة التاسعة صباحاً وما بعدها ' +
      (H.has(d.sumEnd) && !/^ليسمع/.test(d.sumEnd) ? d.sumEnd.trim() + (H.items(o.reqs || d.reqs).length ? ':' : '.') : H.pick(gs, 'ليسمع', 'لتسمع', 'ليسمعوا') + ' الحكم:');
    out.push({ t: 'p', a: 'j', x: s, src: 'scourt' });
    const reqs = H.items(o.reqs || d.reqs);
    if (reqs.length === 1) out.push({ t: 'p', a: 'j', x: reqs[0], src: 'reqs' });
    else out.push(...H.numbered(reqs, 'reqs'));
    let tail = '';
    if (d.fees) tail += 'مع إلزام ' + H.pick(gs, 'المعلن إليه', 'المعلن إليها', 'المعلن إليهم') + ' بالمصروفات ومقابل أتعاب المحاماة' + (o.twoDegrees ? ' عن درجتي التقاضي' : '');
    if (d.nafaz) tail += (tail ? ' ' : '') + 'وشمول الحكم بالنفاذ المعجل وبلا كفالة';
    if (tail) out.push({ t: 'p', a: 'j', x: tail + '.', src: 'fees' });
    out.push({ t: 'p', a: 'c', b: 1, x: 'ولأجل العلم ،،،' });
    return out;
  }
  const caseRef = (d, p = '') => 'الدعوى رقم ' + H.v(d[p + 'cno'], 6) + ' لسنة ' + H.v(d[p + 'cyr'], 4) + (H.has(d[p + 'ctype']) ? ' ' + d[p + 'ctype'] : '');
  const courtRef = (d, p = '') => H.v(d[p + 'court']) + (H.has(d[p + 'circ']) ? ' الدائرة (' + d[p + 'circ'] + ')' : '');

  /* ---------- النماذج ---------- */
  const T = {};

  T.ilan_asl = {
    name: 'إعلان بأصل الصحيفة', desc: 'إعلان الخصم بالدعوى أو بقرار المحكمة',
    fields: [REQ(), SRV(), F.long('facts', 'موضوع الإعلان (الوقائع)', { hint: 'مثال: أقام الطالب الدعوى رقم … لسنة … أمام … وتحدد لنظرها جلسة … ولما كان يهم الطالب …' }),
      ...SUMMON(), F.choice('sumEnd', 'الغرض من الحضور', ['ليسمع الحكم', 'لتنفيذ حكم التحقيق', 'لسماع أقوال الشهود'], { free: true, def: 'ليسمع الحكم' }),
      F.list('reqs', 'الطلبات', 'طلب', { min: 0 }), ...FEES],
    render: d => bailiff(d, { facts: H.paras(d.facts, 'facts') })
  };

  T.reilan = {
    name: 'إعادة إعلان', desc: 'تنفيذ قرار المحكمة بإعادة إعلان الخصم',
    fields: [REQ(), SRV(), ...CASE(), F.date('last', 'تاريخ الجلسة التي تقرر فيها إعادة الإعلان'),
      F.date('hdate', 'تاريخ الجلسة الجديدة (المؤجل إليها)', { opt: true }),
      F.choice('seat', 'مقر المحكمة', SEATS, { free: true, opt: true }),
      F.list('reqs', 'الطلبات الأصلية في الدعوى (ليسمع الحكم بـ)', 'طلب'), EXTRA, ...FEES],
    render(d) {
      const gs = H.g(d.srv), gr = H.g(d.req), S = H.sfx(gs);
      const facts = [{ t: 'p', a: 'j', src: 'cno', x: H.pick(gr, 'أقام الطالب', 'أقامت الطالبة', 'أقام الطالبون') + ' ' + caseRef(d) + ' أمام ' + courtRef(d) +
        ' ضد المعلن إلي' + S + ' وتحدد لنظرها جلسة ' + H.dateOr(d.last) + ' وبتلك الجلسة لم ' + H.pick(gs, 'يحضر المعلن إليه', 'تحضر المعلن إليها', 'يحضر المعلن إليهم') +
        ' أو من ينوب عن' + S + ' قانوناً فقررت عدالة المحكمة تأجيل نظر الدعوى لجلسة ' + H.dateOr(d.hdate) + ' لإعادة الإعلان.' },
      { t: 'p', a: 'j', x: 'ولما كان ' + H.pick(gr, 'يهم الطالب', 'يهم الطالبة', 'يهم الطالبين') + ' تنفيذ قرار عدالة المحكمة بإعادة الإعلان.' }, ...H.paras(d.extra, 'extra')];
      return bailiff(Object.assign({}, d, { scourt: d.court, scirc: d.circ, sctype: d.ctype }), { facts, doc: 'هذا الإعلان' });
    }
  };

  T.tanfiz = {
    name: 'إعلان بالصيغة التنفيذية', desc: 'إعلان الخصم بالصورة التنفيذية للحكم',
    fields: [REQ(), SRV(), ...CASE(), F.date('jdate', 'تاريخ صدور الحكم (الجلسة)'),
      F.long('mantuq', 'منطوق الحكم', { hint: 'انسخ أو أملِ منطوق الحكم كما ورد: حكمت المحكمة …' })],
    render(d) {
      const S = H.sfx(H.g(d.srv));
      return bailiff(d, {
        verb: 'وأعلنت', facts: [
          { t: 'p', a: 'j', src: 'cno', x: 'بالصورة التنفيذية من الحكم الصادر في ' + caseRef(d) + ' من ' + courtRef(d) + ' بجلسة ' + H.dateOr(d.jdate) + ' والقاضي منطوقه:' },
          { t: 'p', b: 1, x: 'حكمت المحكمة:' }, ...H.paras(String(d.mantuq || '').replace(/^\s*حكمت المحكمة\s*:?/, ''), 'mantuq')],
        end: [{ t: 'p', a: 'j', x: 'وأعلنت' + S + ' بالصورة المرفقة باطنه للعلم بما جاء به ونفاذ مفعوله قانوناً.' },
          { t: 'p', a: 'c', b: 1, x: 'ولأجل العلم ،،،' }]
      });
    }
  };

  T.shawahed = {
    name: 'إعلان بشواهد التزوير', desc: 'إعلان شواهد التزوير في دعوى قائمة',
    fields: [REQ(), SRV(), ...CASE(), F.text('doc', 'المحرر المطعون عليه بالتزوير', { hint: 'مثال: عقد البيع المؤرخ 1/1/2020' }),
      F.long('facts', 'الوقائع', { opt: true }), F.list('shw', 'شواهد التزوير', 'شاهد'),
      ...SUMMON({ noCourt: true }), F.list('reqs', 'الطلبات', 'طلب', { def: ['بقبول شواهد التزوير شكلاً.', 'وفي الموضوع برد وبطلان المحرر المطعون عليه.'] }), ...FEES],
    render(d) {
      const facts = [{ t: 'p', a: 'j', src: 'cno', x: 'في ' + caseRef(d) + ' المنظورة أمام ' + courtRef(d) + ' طعن ' + H.pick(H.g(d.req), 'الطالب', 'الطالبة', 'الطالبون') + ' بالتزوير على ' + H.v(d.doc) + ' وفيما يلي شواهد التزوير:' },
        ...H.paras(d.facts, 'facts'), ...H.numbered(d.shw, 'shw')];
      return bailiff(Object.assign({}, d, { scourt: d.court, scirc: d.circ, sctype: d.ctype }), { facts, doc: 'هذا الإعلان' });
    }
  };

  T.sihha_new = {
    name: 'صحيفة دعوى صحة توقيع', desc: 'دعوى جديدة لإثبات صحة التوقيع على عقد',
    fields: [REQ(), SRV(), F.choice('ctr', 'نوع المحرر', ['عقد البيع الابتدائي', 'عقد البيع', 'عقد الإيجار', 'عقد التنازل', 'الإقرار'], { free: true, def: 'عقد البيع الابتدائي' }),
      F.date('cdate', 'تاريخ المحرر'), F.long('subj', 'موضوع المحرر (المبيع)', { hint: 'مثال: الشقة الكائنة بالعقار رقم … الدور … شقة رقم … قسم … وما يخصها من حصة شائعة في الأرض والمباني' }),
      F.money('price', 'الثمن (بالأرقام)', { opt: true }), F.yesno('paid', 'هل تم سداد الثمن بالكامل؟', true),
      ...SUMMON(), EXTRA, ...FEES],
    render(d) {
      const gs = H.g(d.srv), gr = H.g(d.req), S = H.sfx(gs);
      const sale = /بيع/.test(d.ctr || '');
      const facts = [{ t: 'p', a: 'j', src: 'subj', x: 'بموجب ' + H.v(d.ctr) + ' المؤرخ ' + H.dateOr(d.cdate) + ' ' +
        (sale ? H.pick(gs, 'باع المعلن إليه', 'باعت المعلن إليها', 'باع المعلن إليهم') + ' ' + H.pick(gr, 'للطالب', 'للطالبة', 'للطالبين') + ' ما هو ' : 'بشأن ') + H.v(d.subj) +
        (H.has(d.price) ? ' وذلك نظير مبلغ ' + H.money(d.price) : '') + '.' }];
      if (sale && d.paid) facts.push({ t: 'p', a: 'j', x: 'وقد تم سداد الثمن بالكامل ويعتبر توقيع المعلن إلي' + S + ' على هذا العقد بمثابة مخالصة نهائية باستلام' + S + ' كامل الثمن.' });
      facts.push(...H.paras(d.extra, 'extra'));
      facts.push({ t: 'p', a: 'j', x: 'وحيث ' + H.pick(gr, 'يهم الطالب', 'يهم الطالبة', 'يهم الطالبين') + ' إثبات صحة توقيع المعلن إلي' + S + ' على ' + H.v(d.ctr) + ' سند هذه الدعوى.' });
      return bailiff(d, { facts, reqs: ['بصحة توقيع' + S + ' على ' + H.v(d.ctr) + ' المؤرخ ' + H.dateOr(d.cdate) + '.'] });
    }
  };

  T.sihha_ta3jil = {
    name: 'تعجيل دعوى صحة توقيع', desc: 'تعجيل الدعوى من الوقف أو الشطب',
    fields: [REQ(), SRV(), ...CASE('', {}).map(f => f.k === 'ctype' ? Object.assign({}, f, { def: 'صحة توقيع' }) : f),
      F.date('sdate', 'تاريخ الجلسة التي صدر فيها قرار الوقف/الشطب', { opt: true }),
      F.choice('stop', 'قرار المحكمة', ['وقف الدعوى جزائياً', 'وقف الدعوى', 'شطب الدعوى'], { free: true, def: 'وقف الدعوى جزائياً' }),
      F.date('cdate', 'تاريخ العقد المطلوب صحة التوقيع عليه', { opt: true }),
      F.choice('seat', 'مقر المحكمة', SEATS, { free: true, opt: true }), F.date('hdate', 'تاريخ الجلسة الجديدة', { opt: true }), EXTRA, ...FEES],
    render(d) {
      const gs = H.g(d.srv), gr = H.g(d.req), S = H.sfx(gs);
      const facts = [{ t: 'p', a: 'j', src: 'cno', x: H.pick(gr, 'أقام الطالب', 'أقامت الطالبة', 'أقام الطالبون') + ' ' + caseRef(d) + ' أمام ' + courtRef(d) + ' ضد المعلن إلي' + S +
        ' وتداولت بالجلسات' + (H.has(d.sdate) ? ' وبجلسة ' + H.date(d.sdate) : '') + ' قررت عدالة المحكمة ' + H.v(d.stop) + '.' },
      ...H.paras(d.extra, 'extra'),
      { t: 'p', a: 'j', x: 'ولما كان ' + H.pick(gr, 'يهم الطالب', 'يهم الطالبة', 'يهم الطالبين') + ' تعجيل الدعوى من ' + (/شطب/.test(d.stop || '') ? 'الشطب' : 'الوقف') + '.' }];
      return bailiff(Object.assign({}, d, { scourt: d.court, scirc: d.circ, sctype: d.ctype }), {
        facts, reqs: ['بصحة توقيع' + S + ' على العقد المؤرخ ' + H.dateOr(d.cdate) + '.']
      });
    }
  };

  T.inzar_rent = {
    name: 'إنذار عرض أجرة', desc: 'عرض الأجرة على المالك الممتنع عن استلامها',
    fields: [REQ('المنذر'), SRV('المنذر إليه'), F.text('unit', 'العين المؤجرة', { hint: 'مثال: الشقة رقم 1 الكائنة بالعقار رقم 19 شارع … قسم …' }),
      F.date('cdate', 'تاريخ عقد الإيجار', { opt: true }), F.money('rent', 'الأجرة الشهرية'),
      F.date('from', 'الفترة من'), F.date('to', 'الفترة حتى'), F.money('amt', 'المبلغ المعروض'), EXTRA,
      F.text('keep', 'جملة الختام', { def: 'مع حفظ كافة حقوق المنذر الأخرى', opt: true })],
    render(d) {
      const gs = H.g(d.srv), S = H.sfx(gs);
      const facts = [{ t: 'p', a: 'j', src: 'unit', x: H.pick(H.g(d.req), 'المنذر', 'المنذرة', 'المنذرون') + ' ' + H.pick(H.g(d.req), 'يستأجر', 'تستأجر', 'يستأجرون') + ' ' + H.v(d.unit) +
        (H.has(d.cdate) ? ' بموجب عقد إيجار مؤرخ ' + H.date(d.cdate) : '') + ' نظير إيجار شهري قدره ' + H.money(d.rent) + '.' },
      { t: 'p', a: 'j', x: 'وحيث إن ' + H.pick(gs, 'المنذر إليه امتنع', 'المنذر إليها امتنعت', 'المنذر إليهم امتنعوا') + ' دون وجه حق عن استلام الأجرة وتحرير إيصالات بها، مما حدا بالمنذر إلى عرض مبلغ وقدره ' +
        H.money(d.amt) + ' عن الفترة من ' + H.dateOr(d.from) + ' وحتى ' + H.dateOr(d.to) + ' وذلك بالعرض القانوني بموجب هذا الإنذار.' }, ...H.paras(d.extra, 'extra')];
      return bailiff(d, {
        verb: 'وأنذرت', facts, end: [{ t: 'h', x: 'بنـاء عليــه' },
          { t: 'p', a: 'j', x: 'أنا المحضر سالف الذكر قد انتقلت إلى حيث إقامة المنذر إلي' + S + ' وسلمت' + H.pick(gs, 'ه', 'ها', ' كلاً منهم') + ' صورة من هذا الإنذار وعرضت علي' + S + ' مبلغ ' +
            H.money(d.amt) + ' عن الفترة من ' + H.dateOr(d.from) + ' وحتى ' + H.dateOr(d.to) + ' عن ' + H.v(d.unit) + '.' },
          ...(H.has(d.keep) ? [{ t: 'p', x: d.keep.trim() }] : []), { t: 'p', a: 'c', b: 1, x: 'ولأجل العلم ،،،' }]
      });
    }
  };

  T.inzar_gen = {
    name: 'إنذار عام', desc: 'إنذار رسمي على يد محضر',
    fields: [REQ('المنذر'), SRV('المنذر إليه'), F.long('facts', 'وقائع الإنذار'),
      F.long('demand', 'المطلوب من المنذر إليه (نبهت عليه بـ)', { hint: 'مثال: سداد مبلغ … خلال خمسة عشر يوماً من تاريخ استلامه هذا الإنذار' }),
      F.text('keep', 'جملة الختام', { def: 'مع حفظ كافة حقوق المنذر الأخرى', opt: true })],
    render(d) {
      const gs = H.g(d.srv), S = H.sfx(gs);
      return bailiff(d, {
        verb: 'وأنذرت', facts: H.paras(d.facts, 'facts'), end: [{ t: 'h', x: 'بنـاء عليــه' },
          { t: 'p', a: 'j', src: 'demand', x: 'أنا المحضر سالف الذكر قد انتقلت إلى حيث إقامة المنذر إلي' + S + ' وأنذرت' + S + ' وسلمت' + H.pick(gs, 'ه', 'ها', ' كلاً منهم') + ' صورة من هذا الإنذار ونبهت علي' + S + ' ب' + H.v(d.demand) },
          ...(H.has(d.keep) ? [{ t: 'p', x: '- ' + d.keep.trim() + ' ،' }] : []), { t: 'p', a: 'c', b: 1, x: 'ولأجل العلم ،،،' }]
      });
    }
  };

  const APPEAL_COURTS = ['محكمة استئناف الإسكندرية', 'محكمة الإسكندرية الابتدائية (بهيئة استئنافية)', 'محكمة استئناف القاهرة'];
  T.istinaf = {
    name: 'صحيفة استئناف', desc: 'استئناف حكم أول درجة',
    fields: [REQ('المستأنف'), SRV('المستأنف ضده'), ...CASE('j', { courtLabel: 'المحكمة التي أصدرت الحكم' }), F.date('jdate', 'تاريخ صدور الحكم المستأنف'),
      F.long('mantuq', 'منطوق الحكم المستأنف'), F.long('facts', 'واقعات الاستئناف'), F.list('grounds', 'أسباب الاستئناف', 'سبب'),
      ...SUMMON({ courts: APPEAL_COURTS, courtLabel: 'محكمة الاستئناف' }),
      F.list('reqs', 'الطلبات', 'طلب', { def: ['بقبول الاستئناف شكلاً.', 'وفي الموضوع بإلغاء الحكم المستأنف والقضاء مجدداً بـ…'] }), ...FEES],
    render(d) {
      const gr = H.g(d.req);
      const ap = H.pick(gr, 'المستأنف', 'المستأنفة', 'المستأنفين');
      const facts = [{ t: 'p', a: 'j', src: 'jcno', x: 'بموجب هذه الصحيفة ' + H.pick(gr, 'يستأنف الطالب', 'تستأنف الطالبة', 'يستأنف الطالبون') + ' الحكم الصادر في ' + caseRef(d, 'j') + ' من ' + courtRef(d, 'j') + ' بتاريخ ' + H.dateOr(d.jdate) + ' والقاضي منطوقه:' },
        ...H.paras(d.mantuq ? '(( ' + String(d.mantuq).trim() + ' ))' : '', 'mantuq'),
        { t: 'h', x: 'واقعـات الاستئنـاف' }, ...H.paras(d.facts, 'facts'),
        { t: 'p', a: 'j', x: 'ولما كان هذا الحكم قد جاء مجحفاً بحقوق ' + ap + ' ' + H.pick(gr, 'فإنه يطعن', 'فإنها تطعن', 'فإنهم يطعنون') + ' عليه بالاستئناف للأسباب الآتية:' },
        { t: 'h', x: 'أسبـاب الاستئنـاف' }, ...H.numbered(d.grounds, 'grounds'),
        { t: 'p', a: 'j', x: 'لهذه الأسباب والأسباب الأخرى التي ' + H.pick(gr, 'سيبديها المستأنف', 'ستبديها المستأنفة', 'سيبديها المستأنفون') + ' بجلسات المرافعة.' }];
      return bailiff(d, { facts, twoDegrees: true });
    }
  };

  T.ishkal = {
    name: 'صحيفة إشكال في التنفيذ', desc: 'إشكال لوقف تنفيذ حكم',
    fields: [REQ('المستشكل'), SRV('المستشكل ضده'), ...CASE('j', { noLabel: 'رقم الحكم المستشكل فيه (رقم الدعوى)', courtLabel: 'المحكمة التي أصدرت الحكم' }),
      F.date('jdate', 'تاريخ صدور الحكم', { opt: true }), F.long('mantuq', 'منطوق الحكم', { opt: true }), F.long('facts', 'الوقائع'),
      F.list('grounds', 'أسباب الإشكال', 'سبب'),
      ...SUMMON({ courts: ['محكمة تنفيذ شرق الإسكندرية', 'محكمة شرق الإسكندرية الابتدائية', 'محكمة غرب الإسكندرية الابتدائية'], courtLabel: 'محكمة التنفيذ' }),
      F.list('reqs', 'الطلبات', 'طلب', { def: ['بقبول الإشكال شكلاً.', 'وفي الموضوع بوقف تنفيذ الحكم المستشكل في تنفيذه.'] }), ...FEES],
    render(d) {
      const gr = H.g(d.req);
      const facts = [{ t: 'p', a: 'j', src: 'jcno', x: 'صدر الحكم في ' + caseRef(d, 'j') + ' من ' + courtRef(d, 'j') + (H.has(d.jdate) ? ' بتاريخ ' + H.date(d.jdate) : '') + (H.has(d.mantuq) ? ' والقاضي منطوقه:' : '.') },
        ...H.paras(d.mantuq ? '(( ' + String(d.mantuq).trim() + ' ))' : '', 'mantuq'), ...H.paras(d.facts, 'facts'),
        { t: 'p', a: 'j', x: H.pick(gr, 'ولما كان المستشكل يستشكل', 'ولما كانت المستشكلة تستشكل', 'ولما كان المستشكلون يستشكلون') + ' في تنفيذ هذا الحكم للأسباب الآتية:' },
        ...H.numbered(d.grounds, 'grounds'),
        { t: 'p', a: 'j', x: 'لهذه الأسباب والأسباب الأخرى التي ' + H.pick(gr, 'سيبديها المستشكل', 'ستبديها المستشكلة', 'سيبديها المستشكلون') + ' بالجلسات والمذكرات.' }];
      return bailiff(d, { facts, doc: 'هذا الإشكال' });
    }
  };

  T.tadakhul = {
    name: 'صحيفة تدخل هجومي', desc: 'التدخل الهجومي في دعوى قائمة',
    fields: [REQ('المتدخل'), SRV(), ...CASE('', { courtLabel: 'المحكمة المنظورة أمامها الدعوى' }), F.long('facts', 'الوقائع وسند التدخل'),
      F.choice('seat', 'مقر المحكمة', SEATS, { free: true, opt: true }), F.date('hdate', 'تاريخ الجلسة', { opt: true }),
      F.list('reqs', 'الطلبات', 'طلب', { def: ['بقبول التدخل الهجومي شكلاً.', 'وفي الموضوع: …'] }), ...FEES],
    render(d) {
      const gr = H.g(d.req);
      const facts = [{ t: 'p', a: 'j', src: 'cno', x: 'أقيمت ' + caseRef(d) + ' أمام ' + courtRef(d) + '.' }, ...H.paras(d.facts, 'facts'),
        { t: 'p', a: 'j', x: 'وحيث إن ' + H.pick(gr, 'للطالب', 'للطالبة', 'للطالبين') + ' مصلحة في التدخل في الدعوى سالفة الذكر، ' + H.pick(gr, 'فإنه يتدخل', 'فإنها تتدخل', 'فإنهم يتدخلون') + ' فيها هجومياً طبقاً لنص المادة 126 من قانون المرافعات.' }];
      return bailiff(Object.assign({}, d, { scourt: d.court, scirc: d.circ, sctype: d.ctype }), { facts, doc: 'هذا الإعلان' });
    }
  };

  T.da3wa = {
    name: 'صحيفة دعوى', desc: 'دعوى جديدة (إعادة الحال وغيرها)',
    fields: [REQ(), SRV(), F.long('facts', 'وقائع الدعوى'), F.long('law', 'السند القانوني (اختياري)', { opt: true }),
      ...SUMMON(), F.list('reqs', 'الطلبات (ليسمع الحكم بـ)', 'طلب'), ...FEES],
    render: d => bailiff(d, { facts: [...H.paras(d.facts, 'facts'), ...H.paras(d.law, 'law')] })
  };

  /* ---------- الطعون ---------- */
  const tawkil = [F.text('tno', 'رقم التوكيل', { opt: true, numeric: true }), F.text('tyr', 'سنة التوكيل', { opt: true, numeric: true }), F.text('toff', 'مكتب التوثيق', { opt: true, hint: 'مثال: توثيق سيدي جابر' })];
  const tawkilTxt = d => 'بموجب توكيل رقم ' + H.v(d.tno, 6) + ' لسنة ' + H.v(d.tyr, 4) + ' ' + (H.has(d.toff) ? (/توثيق/.test(d.toff) ? d.toff : 'توثيق ' + d.toff) : 'توثيق ' + BL);

  T.naqd = {
    name: 'صحيفة طعن بالنقض', desc: 'طعن أمام محكمة النقض',
    fields: [REQ('الطاعن'), ...tawkil, SRV('المطعون ضده'),
      F.choice('acourt', 'المحكمة التي أصدرت الحكم المطعون فيه', ['محكمة استئناف الإسكندرية', 'محكمة استئناف القاهرة'], { free: true }),
      F.date('adate', 'تاريخ الحكم المطعون فيه'), F.text('ano', 'رقم الاستئناف', { numeric: true }), F.text('ayr', 'لسنة (ق)', { numeric: true }),
      F.text('asfx', 'وصف الاستئناف', { opt: true, def: 'ق عالي الإسكندرية' }), F.long('amantuq', 'منطوق الحكم المطعون فيه'),
      F.yesno('hasFirst', 'هل تريد ذكر حكم أول درجة؟', true),
      ...CASE('f', { courtLabel: 'محكمة أول درجة' }).map(f => Object.assign({}, f, { when: d => d.hasFirst })),
      F.date('fdate', 'تاريخ حكم أول درجة', { opt: true, when: d => d.hasFirst }), F.long('fmantuq', 'منطوق حكم أول درجة', { opt: true, when: d => d.hasFirst }),
      F.long('facts', 'واقعات الطعن'), F.list('grounds', 'أسباب الطعن بالنقض', 'سبب', { hint: 'ابدأ كل سبب بعنوانه، مثال: الخطأ في تطبيق القانون …' }),
      F.list('reqs', 'الطلبات', 'طلب', { def: ['بقبول الطعن شكلاً.', 'وفي الموضوع بنقض الحكم المطعون فيه.'] })],
    render(d) {
      const off = H.office(), req = (d.req || []).filter(p => H.has(p.name)), srv = (d.srv || []).filter(p => H.has(p.name));
      const gr = H.g(req), out = [{ t: 't', x: 'صحيفة طعن بطريق النقض' },
        { t: 'p', x: 'أودعت هذه الصحيفة قلم كتاب محكمة ' + BL },
        { t: 'p', x: 'أنه في يوم ' + (H.wday(d.pdate) || BL) + ' الموافق ' + (H.date(d.pdate) || '……/……/' + H.year()) },
        { t: 'p', a: 'j', src: 'req', x: 'حضر السيد الأستاذ / ' + off.name + ' المحامي بالنقض بمكتبه الكائن ' + off.addr + ' – بصفته وكيلاً عن ' + req.map(H.one).join('، و') + ' ' + tawkilTxt(d) }];
      out.push({ t: 'tbl', rows: [['', '( ' + H.pick(gr, 'طاعن', 'طاعنة', 'طاعنون') + ' )']], c: ['r', 'c'] });
      out.push({ t: 'h', x: 'ضـــــــد' });
      srv.forEach((p, i) => out.push({ t: 'li', n: (i + 1) + '- ', x: H.one(p), src: 'srv' }));
      out.push({ t: 'tbl', rows: [['', '( ' + H.pick(H.g(srv), 'مطعون ضده', 'مطعون ضدها', 'مطعون ضدهم') + ' )']], c: ['r', 'c'] });
      out.push({ t: 'p', a: 'j', src: 'acourt', x: 'وقرر الحاضر بأنه يطعن بطريق النقض على الحكم الصادر من ' + H.v(d.acourt) + ' بتاريخ ' + H.dateOr(d.adate) + ' في الاستئناف رقم ' + H.v(d.ano, 6) + ' لسنة ' + H.v(d.ayr, 3) + ' ' + (d.asfx || 'ق') + ' والقاضي منطوقه:' });
      out.push(...H.paras(d.amantuq ? '(( حكمت المحكمة: ' + String(d.amantuq).replace(/^\s*حكمت المحكمة\s*:?/, '').trim() + ' ))' : '', 'amantuq'));
      if (d.hasFirst) {
        out.push({ t: 'p', a: 'j', src: 'fcno', x: 'وهذا الحكم صادر في الاستئناف المرفوع عن الحكم الصادر في ' + caseRef(d, 'f') + ' من ' + courtRef(d, 'f') + (H.has(d.fdate) ? ' بتاريخ ' + H.date(d.fdate) : '') + (H.has(d.fmantuq) ? ' والقاضي منطوقه:' : '.') });
        out.push(...H.paras(d.fmantuq ? '(( ' + String(d.fmantuq).trim() + ' ))' : '', 'fmantuq'));
      }
      out.push({ t: 'h', x: '(( واقعـات الطعـن ))' }, ...H.paras(d.facts, 'facts'));
      out.push({ t: 'h', x: 'أسبـاب الطعـن بالنقـض' }, ...H.items(d.grounds).map((x, i) => ({ t: 'li', n: 'السبب ' + H.cl(i) + ': ', x, src: 'grounds' })));
      out.push({ t: 'h', x: 'بنـاء عليــه' }, { t: 'p', a: 'j', x: H.pick(gr, 'يلتمس الطاعن', 'تلتمس الطاعنة', 'يلتمس الطاعنون') + ' من عدالة المحكمة الحكم:' }, ...H.numbered(d.reqs, 'reqs'));
      out.push({ t: 'sp' }, { t: 'tbl', rows: [['', 'وكيل ' + H.pick(gr, 'الطاعن', 'الطاعنة', 'الطاعنين')], ['', 'المحامي'], ['', 'المقبول لدى محكمة النقض']], c: ['r', 'c'] });
      return out;
    }
  };

  T.idari = {
    name: 'تقرير طعن – الإدارية العليا', desc: 'طعن أمام المحكمة الإدارية العليا',
    fields: [REQ('الطاعن', { addrOpt: true }), SRV('المطعون ضده'),
      F.choice('jcourt', 'المحكمة التي أصدرت الحكم', ['محكمة القضاء الإداري بالإسكندرية', 'المحكمة الإدارية بالإسكندرية'], { free: true }),
      F.text('jno', 'رقم الدعوى', { numeric: true }), F.text('jyr', 'لسنة (ق)', { numeric: true }), F.date('jdate', 'تاريخ الحكم (الجلسة)', { opt: true }),
      F.long('mantuq', 'منطوق الحكم المطعون فيه'), F.long('facts', 'واقعات الطعن'), F.list('grounds', 'أسباب الطعن', 'سبب'),
      F.list('reqs', 'الطلبات', 'طلب', { def: ['بصفة مستعجلة: بوقف تنفيذ الحكم المطعون فيه.', 'وفي الموضوع: بإلغاء الحكم المطعون فيه وما يترتب على ذلك من آثار وإلزام المطعون ضدهم بصفتهم بالمصروفات والأتعاب عن درجتي التقاضي.'] }),
      F.yesno('withIlan', 'إضافة محضر إعلان المطعون ضدهم في نهاية الورقة؟', true)],
    render(d) {
      const off = H.office(), req = (d.req || []).filter(p => H.has(p.name)), srv = (d.srv || []).filter(p => H.has(p.name)), gs = H.g(srv);
      const out = [{ t: 't', x: 'تقرير طعــن' },
        { t: 'p', x: 'أنه في يوم ' + (H.wday(d.pdate) || BL) + ' الموافق ' + (H.date(d.pdate) || '……/……/' + H.year()) + ' الساعة ' + BL },
        { t: 'p', x: 'أمامي أنا ' + BL + ' مراقب شئون المحكمة الإدارية العليا' },
        { t: 'p', a: 'j', src: 'req', x: 'حضر الأستاذ / ' + off.name + ' المحامي المقبول أمام محكمة النقض والإدارية العليا بصفته وكيلاً عن ' + req.map(H.one).join('، و') },
        { t: 'h', x: 'ضـــــــد' }];
      srv.forEach((p, i) => out.push({ t: 'li', n: (i + 1) + '- ', x: H.one(p), src: 'srv' }));
      out.push({ t: 'tbl', rows: [['', '( ' + H.pick(gs, 'مطعون ضده', 'مطعون ضدها', 'مطعون ضدهم') + ' )']], c: ['r', 'c'] });
      out.push({ t: 'p', a: 'j', src: 'jcourt', x: 'وقرر الطاعن أنه يطعن على الحكم الصادر من ' + H.v(d.jcourt) + ' في الدعوى رقم ' + H.v(d.jno, 6) + ' لسنة ' + H.v(d.jyr, 3) + ' ق' + (H.has(d.jdate) ? ' بجلسة ' + H.date(d.jdate) : '') + ' والقاضي منطوقه:' });
      out.push(...H.paras(d.mantuq ? '"' + String(d.mantuq).trim() + '"' : '', 'mantuq'));
      out.push({ t: 'h', x: 'واقعـات الطعـن' }, ...H.paras(d.facts, 'facts'), { t: 'h', x: 'أسبـاب الطعـن' }, ...H.numbered(d.grounds, 'grounds'));
      out.push({ t: 'h', x: 'بنـاء عليــه' }, { t: 'p', a: 'j', x: 'يلتمس الطاعن من عدالة الهيئة الموقرة تحديد أقرب جلسة للحكم بقبول الطعن شكلاً لرفعه في الميعاد بعد إضافة مواعيد المسافة المنصوص عليها قانوناً:' }, ...H.numbered(d.reqs, 'reqs'));
      out.push({ t: 'p', a: 'j', x: 'وبما ذكر تحرر هذا الطعن وتوقع عليه منا ومن الأستاذ / ' + off.name + ' المحامي بالنقض والإدارية العليا وقيد برقم / ' + BL + ' قضائية عليا.' });
      out.push({ t: 'sp' }, { t: 'tbl', rows: [['مراقب المحكمة الإدارية', 'عن الطاعن'], ['', 'المحامي بالنقض']], c: ['c', 'c'] });
      if (d.withIlan) {
        out.push({ t: 'pb' }, { t: 't', x: 'محضر إعلان' });
        out.push(...bailiff(d, { facts: [], khataba: false, verb: 'وأعلنت', end: [] }).slice(0, -1));
        out.push({ t: 'h', x: 'لذلــك' }, { t: 'p', a: 'j', x: 'أنا المحضر سالف الذكر قد انتقلت إلى حيث إقامة المعلن إلي' + H.sfx(gs) + ' وسلمت' + H.pick(gs, 'ه', 'ها', ' كلاً منهم') + ' صورة من هذا الطعن للعلم بما اشتمل عليه ونفاذ أثره قانوناً.' },
          { t: 'p', a: 'c', b: 1, x: 'ولأجل العلم ،،،' });
      }
      return out;
    }
  };

  /* ---------- المذكرات والشكاوى ---------- */
  T.mozakra = {
    name: 'مذكرة دفاع', desc: 'مدني – جنح – نقض – لجان طعن',
    fields: [F.choice('court', 'مقدمة إلى', ['محكمة الإسكندرية الابتدائية', 'محكمة استئناف الإسكندرية', 'محكمة النقض – الدائرة المدنية والتجارية', 'محكمة جنح', 'لجنة الطعن الضريبي', ...COURTS.slice(4)], { free: true }),
      F.text('circ', 'رقم الدائرة / اللجنة', { opt: true }), F.choice('ctype', 'نوع الدائرة', CTYPES, { free: true, opt: true }),
      F.text('cno', 'رقم الدعوى / الطعن', { numeric: true }), F.text('cyr', 'لسنة', { numeric: true, def: String(new Date().getFullYear()) }),
      F.text('csfx', 'وصف الرقم (اختياري)', { opt: true, hint: 'مثال: مدني كلي / ق / جنح المنتزه ثان' }),
      F.date('hdate', 'تاريخ الجلسة المحددة لنظرها', { opt: true }),
      F.text('client', 'اسم الموكِّل'), F.choice('crole', 'صفة الموكِّل', ROLES, { free: true }),
      F.text('opp', 'اسم الخصم', { hint: 'إن كانوا أكثر من خصم اكتبهم مفصولين بفاصلة' }), F.choice('orole', 'صفة الخصم', ROLES, { free: true }),
      F.long('subj', 'الموضوع', { opt: true, hint: 'اتركه فارغاً لاستخدام العبارة المعتادة: يحيل … إلى أوراق الدعوى ومستنداتها' }),
      F.list('defs', 'أوجه الدفاع', 'وجه دفاع'), F.list('reqs', 'الطلبات (لذلك نلتمس)', 'طلب')],
    render(d) {
      const role = H.v(d.crole);
      const out = [{ t: 'box' }, { t: 't', x: 'مذكـرة دفـاع' },
        { t: 'p', a: 'c', b: 1, src: 'court', x: 'مقدمة إلى ' + H.v(d.court) + (H.has(d.circ) ? ' الدائرة (' + d.circ + ')' : '') + (H.has(d.ctype) ? ' ' + d.ctype : '') },
        { t: 'p', a: 'c', src: 'cno', x: 'في الدعوى رقم ' + H.v(d.cno, 6) + ' لسنة ' + H.v(d.cyr, 4) + (H.has(d.csfx) ? ' ' + d.csfx : '') + (H.has(d.hdate) ? ' والمحدد لنظرها جلسة ' + H.date(d.hdate) : '') },
        { t: 'tbl', rows: [['بدفاع / ' + H.v(d.client), '( ' + role + ' )']], c: ['r', 'c'], src: 'client' },
        { t: 'h', x: 'ضــــــد' },
        { t: 'tbl', rows: String(d.opp || BL).split(/[،,]\s*/).filter(Boolean).map((n, i, a) => [(a.length > 1 ? (i + 1) + '- ' : '') + n.trim(), i === a.length - 1 ? '( ' + H.v(d.orole) + ' )' : '']), c: ['r', 'c'], src: 'opp' },
        { t: 'h', x: 'الموضــــوع' },
        ...(H.has(d.subj) ? H.paras(d.subj, 'subj') : [{ t: 'p', a: 'j', src: 'subj', x: 'يحيل ال' + role.replace(/^ال/, '') + ' بشأنه إلى أوراق الدعوى ومستنداتها وذلك حرصاً على وقت الهيئة الموقرة الثمين.' }]),
        { t: 'h', x: 'الدفـــــاع' },
        { t: 'p', a: 'j', x: 'يتناول ال' + role.replace(/^ال/, '') + ' دفاعه ودفوعه على النحو التالي:' },
        ...H.numbered(d.defs, 'defs'),
        { t: 'h', x: '(( لـــــذلك ))' }, { t: 'p', a: 'j', x: 'نلتمس من عدالتكم الحكم:' }, ...H.numbered(d.reqs, 'reqs'),
        { t: 'sp' }, { t: 'tbl', rows: [['', 'وكيل ال' + role.replace(/^ال/, '')], ['', 'المحامي']], c: ['r', 'c'] }];
      return out;
    }
  };

  T.shakwa = {
    name: 'شكوى للنيابة العامة', desc: 'شكوى / بلاغ مقدم للنيابة',
    fields: [F.text('to', 'موجهة إلى', { def: 'السيد المستشار / رئيس نيابة ' }), F.text('client', 'اسم الموكِّل'), ...tawkil,
      F.long('subj', 'الموضوع (الوقائع)'), F.long('ask', 'الطلب (لذلك نلتمس)'), F.list('att', 'المرفقات', 'مرفق', { min: 0, def: ['صورة التوكيل'] })],
    render(d) {
      const off = H.office();
      return [{ t: 'h', src: 'to', x: H.v(d.to) }, { t: 'h', x: 'بعد وافر الاحترام' },
        { t: 'p', a: 'j', src: 'client', x: 'مقدمه لعدالتكم / ' + off.name + ' – المحامي – بصفته وكيلاً عن السيد / ' + H.v(d.client) + ' – ' + tawkilTxt(d) },
        { t: 'h', x: 'الموضــوع' }, ...H.paras(d.subj, 'subj'), { t: 'h', x: 'لذلــك' }, ...H.paras('نلتمس من عدالتكم ' + String(d.ask || BL).replace(/^\s*نلتمس من عدالتكم\s*/, ''), 'ask'),
        ...(H.items(d.att).length ? [{ t: 'p', b: 1, x: 'مرفق لعدالتكم:' }, ...H.items(d.att).map((x, i) => ({ t: 'li', n: (i + 1) + '- ', x, src: 'att' }))] : []),
        { t: 'p', a: 'c', x: 'وتفضلوا بقبول وافر الاحترام ،،،' }, { t: 'sp' },
        { t: 'tbl', rows: [['', 'مقدمه لعدالتكم'], ['', off.name], ['', 'المحامي']], c: ['r', 'c'] }];
    }
  };

  /* ---------- العقود ---------- */
  const STD_CLAUSES = [
    'يقر الطرف الثاني المشتري بأنه قد عاين المبيع المعاينة التامة النافية للجهالة وقبله بحالته التي هو عليها وقت التعاقد، ولا يحق له الرجوع على الطرف الأول البائع مستقبلاً بسبب ذلك.',
    'يتعهد الطرف الأول البائع بتسليم الطرف الثاني المشتري كافة المستندات الدالة على ملكيته للمبيع.',
    'يضمن الطرف الأول البائع عدم تعرض الغير للطرف الثاني المشتري في المبيع، كما يقر بعدم وجود مستحقات عليه، وفي حالة وجود أية مستحقات للضرائب العقارية يتحملها الطرف الأول البائع حتى تاريخ تحرير هذا العقد، ومن هذا التاريخ يتحمل الطرف الثاني المشتري الالتزامات المالية.',
    'يتعهد الطرف الأول البائع بالحضور إلى مأمورية الشهر العقاري المختصة عند طلبه للتوقيع على عقد البيع النهائي واستيفاء الإجراءات، وفي حالة امتناعه يحق للطرف الثاني المشتري اتخاذ الإجراءات القانونية المناسبة ومنها إقامة دعوى صحة ونفاذ هذا العقد.',
    'يقر الطرف الأول البائع بأنه لم يسبق له التصرف في المبيع بأي نوع من أنواع التصرفات سواء بالبيع أو الهبة أو الرهن أو الحكر أو الامتياز، وأن المبيع خالٍ من كافة الحقوق العينية أياً كانت، وأنه ضامن لصحة هذا البيع.',
    'اتخذ كل من الطرفين عنوانه الموضح بصدر هذا العقد موطناً مختاراً له يصح إعلانه فيه بكافة الإعلانات والأوراق القضائية، وعلى كل طرف إخطار الطرف الآخر بخطاب موصى عليه بعلم الوصول بأي تغيير يطرأ على عنوانه.',
    'تختص محاكم الإسكندرية بكافة أنواعها ودرجاتها بالنظر في أي نزاع قد ينشأ بين الطرفين عن تطبيق أو تفسير أو تنفيذ هذا العقد.'
  ];
  const sigTable = (a, b, wit) => {
    const rows = [[a, b], ['الاسم: ' + BL, 'الاسم: ' + BL], ['التوقيع: ' + BL, 'التوقيع: ' + BL], ['بطاقة رقم: ' + BL, 'بطاقة رقم: ' + BL]];
    const out = [{ t: 'sp' }, { t: 'tbl', rows, c: ['c', 'c'] }];
    if (wit) out.push({ t: 'p', a: 'c', b: 1, x: 'الشهـــود' }, { t: 'tbl', rows: [['الشاهد الأول', 'الشاهد الثاني'], ...rows.slice(1)], c: ['c', 'c'] });
    return out;
  };
  const contractParty = (p, i, role) => ({ t: 'p', a: 'j', src: role.k, x: H.ord(i) + ': ' + H.one(p) });

  T.bay3 = {
    name: 'عقد بيع ابتدائي', desc: 'شقة – محل – جراج – أرض (نقداً أو بالتقسيط)',
    fields: [F.date('cdate', 'تاريخ تحرير العقد', { opt: true }),
      F.group('sel', 'الطرف الأول (البائع)', 'البائع', party({ nid: true })), F.group('buy', 'الطرف الثاني (المشتري)', 'المشتري', party({ nid: true })),
      F.long('prop', 'وصف المبيع', { hint: 'مثال: الشقة رقم 5 بالدور الثالث بالعقار رقم 22 شارع … قسم … الإسكندرية' }),
      F.text('area', 'المساحة (اختياري)', { opt: true, hint: 'مثال: 120 م² تحت العجز والزيادة' }),
      F.text('bN', 'الحد البحري', { opt: true }), F.text('bS', 'الحد القبلي', { opt: true }), F.text('bE', 'الحد الشرقي', { opt: true }), F.text('bW', 'الحد الغربي', { opt: true }),
      F.long('src', 'سند ملكية البائع (اختياري)', { opt: true, hint: 'مثال: بالشراء من السيد / … بموجب عقد مؤرخ …' }),
      F.money('price', 'الثمن الإجمالي'), F.choice('pay', 'طريقة السداد', ['نقداً بمجلس العقد', 'بالتقسيط'], { def: 'نقداً بمجلس العقد' }),
      F.money('down', 'المقدم المدفوع عند التوقيع (اختياري)', { opt: true, when: d => d.pay === 'بالتقسيط' }),
      F.list('inst', 'الأقساط', 'قسط', { when: d => d.pay === 'بالتقسيط', hint: 'مثال: 15/7/2026 بواقع 25000 جنيه (خمسة وعشرون ألف جنيه)' }),
      F.list('clauses', 'البنود (يمكنك تعديل أي بند أو حذفه)', 'بند', { def: STD_CLAUSES }),
      F.choice('copies', 'عدد النسخ', ['نسختين', 'ثلاث نسخ'], { def: 'نسختين' }), F.yesno('wit', 'إضافة توقيع الشهود؟', false)],
    render(d) {
      const sel = (d.sel || []).filter(p => H.has(p.name)), buy = (d.buy || []).filter(p => H.has(p.name));
      const out = [{ t: 't', x: 'عقد بيع ابتدائي' },
        { t: 'p', b: 1, src: 'cdate', x: 'بتاريخ ' + H.dateOr(d.cdate) + ' حُرر بين كلٍّ من:' }];
      sel.forEach((p, i) => out.push(contractParty(p, i, { k: 'sel' })));
      out.push({ t: 'p', b: 1, x: '(طرف أول بائع ومتنازل)' });
      buy.forEach((p, i) => out.push(contractParty(p, sel.length + i, { k: 'buy' })));
      out.push({ t: 'p', b: 1, x: '(طرف ثانٍ مشترٍ ومتنازل إليه)' });
      out.push({ t: 'p', a: 'j', x: 'وبعد أن أقر الطرفان بأهليتهما للتعاقد والتصرف فقد اتفقا على ما يأتي:' });
      out.push({ t: 'h', x: '( البنـد التمهيـدي )' });
      out.push({ t: 'p', a: 'j', src: 'prop', x: 'يمتلك الطرف الأول البائع ما هو ' + H.v(d.prop) + (H.has(d.area) ? ' والبالغ مساحته ' + d.area : '') + (H.has(d.bN) || H.has(d.bS) || H.has(d.bE) || H.has(d.bW) ? ' وحدوده كالآتي:' : '.') });
      [['الحد البحري', d.bN], ['الحد القبلي', d.bS], ['الحد الشرقي', d.bE], ['الحد الغربي', d.bW]].forEach(([n, v]) => { if (H.has(v)) out.push({ t: 'p', src: 'bN', x: n + ': ' + v.trim() }); });
      if (H.has(d.src)) out.push(...H.paras('وقد آلت الملكية إلى الطرف الأول البائع ' + String(d.src).trim().replace(/^وقد آلت الملكية إلى الطرف الأول البائع\s*/, ''), 'src'));
      out.push({ t: 'p', a: 'j', x: 'ورغبةً من الطرف الأول البائع في بيع ما هو سالف الذكر والتي لاقت قبول الطرف الثاني المشتري فقد اتفقا على البنود الآتية:' });
      const cl = [], money = H.money(d.price);
      cl.push([{ t: 'p', a: 'j', x: 'يعتبر البند التمهيدي السابق جزءاً لا يتجزأ من هذا العقد ومتمماً ومكملاً له.' }]);
      cl.push([{ t: 'p', a: 'j', src: 'prop', x: 'باع وأسقط وتنازل بكافة الضمانات الفعلية والقانونية الطرف الأول البائع إلى الطرف الثاني المشتري القابل لذلك ما هو ' + H.v(d.prop) + ' المبين بالبند التمهيدي من هذا العقد.' }]);
      if (d.pay === 'بالتقسيط') {
        cl.push([{ t: 'p', a: 'j', src: 'price', x: 'تم هذا البيع وقبل نظير ثمن إجمالي وقدره ' + money + (H.has(d.down) ? '، دفع منه الطرف الثاني المشتري مقدماً مبلغ ' + H.money(d.down) + ' بمجلس العقد' : '') + '، ويقوم الطرف الثاني المشتري بسداد ' + (H.has(d.down) ? 'الباقي' : 'الثمن') + ' على النحو التالي:' },
          ...H.items(d.inst).map((x, i) => ({ t: 'li', n: (i + 1) + '- ', x, src: 'inst' })),
          { t: 'p', a: 'j', x: 'وفي حالة عدم سداد أي قسط في الموعد المحدد يعتبر العقد مفسوخاً من تلقاء نفسه دون حاجة إلى اتخاذ أي إجراءات قانونية فضلاً عن التعويض القضائي.' }]);
      } else {
        cl.push([{ t: 'p', a: 'j', src: 'price', x: 'تم هذا البيع نظير ثمن إجمالي وقدره ' + money + ' تم دفعه بمجلس العقد، ويعتبر توقيع الطرف الأول البائع على هذا العقد بمثابة مخالصة نهائية باستلامه كامل الثمن.' }]);
      }
      H.items(d.clauses).forEach(x => cl.push([{ t: 'p', a: 'j', x, src: 'clauses' }]));
      cl.push([{ t: 'p', a: 'j', src: 'copies', x: 'تحرر هذا العقد من ' + (d.copies || 'نسختين') + ' بيد كل طرف نسخة للعمل بها عند اللزوم.' }]);
      cl.forEach((bs, i) => { out.push({ t: 'h', x: '( البنـد ' + H.cl(i) + ' )' }); out.push(...bs); });
      out.push(...sigTable('الطرف الأول (البائع)', 'الطرف الثاني (المشتري)', d.wit));
      return out;
    }
  };

  T.fasakh = {
    name: 'عقد فسخ شركة تضامن', desc: 'حل وفسخ وتصفية شركة تضامن',
    fields: [F.date('cdate', 'تاريخ تحرير العقد', { opt: true }), F.group('ptn', 'الشركاء', 'الشريك', party({ nid: true }), { min: 2 }),
      F.date('fdate', 'تاريخ عقد تأسيس الشركة'), F.text('rno', 'رقم قيد/شهر ملخص عقد الشركة', { opt: true }), F.text('ryr', 'لسنة', { opt: true, numeric: true }),
      F.text('rcourt', 'جهة الشهر', { opt: true, def: 'بمحكمة الإسكندرية الابتدائية' }),
      F.text('tname', 'الاسم التجاري', { opt: true }), F.text('tsima', 'السمة التجارية', { opt: true }), F.text('hq', 'مركز الشركة', { opt: true }),
      F.text('purpose', 'غرض الشركة', { opt: true }), F.text('mgmt', 'الإدارة والتوقيع', { opt: true }), F.text('capital', 'رأس المال', { opt: true }),
      F.text('profit', 'توزيع الأرباح', { opt: true }), F.text('dur', 'مدة الشركة', { opt: true }),
      F.long('settle', 'بند التصفية', { def: 'اتفق الشركاء على حل الشركة وفسخها وتصفيتها نهائياً، وقد أقر كل شريك بحصوله على نصيبه في رأس المال بالكامل ولا يطالب الشركة بأية مستحقات.' }),
      F.list('more', 'بنود إضافية (اختياري)', 'بند', { min: 0 })],
    render(d) {
      const p = (d.ptn || []).filter(x => H.has(x.name));
      const out = [{ t: 't', x: 'عقد فسخ شركة تضامن' },
        { t: 'p', src: 'cdate', x: 'أنه في يوم ' + (H.wday(d.cdate) || BL) + ' الموافق ' + H.dateOr(d.cdate) + ' فيما بين كلٍّ من:' }];
      p.forEach((x, i) => { out.push({ t: 'p', a: 'j', src: 'ptn', x: (i + 1) + '- ' + H.one(x) }); out.push({ t: 'tbl', rows: [['', '( طرف ' + (H.cl(i).replace(/^ال/, '')) + ' متضامن )']], c: ['r', 'c'] }); });
      out.push({ t: 'h', x: 'بنـد تمهيـدي' });
      out.push({ t: 'p', a: 'j', src: 'fdate', x: 'بموجب عقد عرفي مؤرخ ' + H.dateOr(d.fdate) + (H.has(d.rno) ? ' ملخصه مسجل ومشهر عنه تحت رقم ' + d.rno + (H.has(d.ryr) ? ' لسنة ' + d.ryr : '') + (H.has(d.rcourt) ? ' ' + d.rcourt : '') : '') + ' تكونت شركة تضامن فيما بين الشركاء المذكورين وكانت أهم بنود الشركة:' });
      [['الاسم التجاري', d.tname], ['السمة التجارية', d.tsima], ['مركز الشركة', d.hq], ['غرض الشركة', d.purpose], ['الإدارة والتوقيع', d.mgmt], ['رأس المال', d.capital], ['توزيع الأرباح', d.profit], ['مدة الشركة', d.dur]]
        .forEach(([n, v]) => { if (H.has(v)) out.push({ t: 'p', src: 'tname', x: n + ': ' + v.trim() }); });
      out.push({ t: 'p', a: 'j', x: 'إلى جانب باقي بنود عقد الشركة. وقد أقر الشركاء بأهليتهم للتصرف والتعاقد واتفقوا على ما يلي:' });
      const cl = ['البند التمهيدي جزء لا يتجزأ من هذا العقد ومتمم له.', H.v(d.settle), ...H.items(d.more),
        'تحرر هذا العقد من ' + (p.length + 1 === 3 ? 'ثلاث' : (p.length + 1)) + ' نسخ بيد كل شريك نسخة ونسخة للعمل بموجبها لدى الجهات الرسمية.'];
      cl.forEach((x, i) => out.push({ t: 'h', x: 'البنـد ' + H.cl(i) }, { t: 'p', a: 'j', x, src: i === 1 ? 'settle' : i > 1 && i < cl.length - 1 ? 'more' : undefined }));
      out.push({ t: 'sp' });
      const rows = []; for (let i = 0; i < p.length; i += 2) rows.push(['الشريك ' + H.cl(i), p[i + 1] ? 'الشريك ' + H.cl(i + 1) : ''], ['التوقيع: ' + BL, p[i + 1] ? 'التوقيع: ' + BL : ''], ['', '']);
      out.push({ t: 'tbl', rows, c: ['c', 'c'] });
      return out;
    }
  };


  /* ---------- شكل كل نموذج كما في ملفات المكتب ---------- */
  const cref = (d, p = '') => H.has(d[p + 'cno']) ? ' في الدعوى رقم ' + d[p + 'cno'] + (H.has(d[p + 'cyr']) ? ' لسنة ' + d[p + 'cyr'] : '') + (H.has(d[p + 'ctype']) ? ' ' + d[p + 'ctype'] : '') : '';
  const hdt = d => H.has(d.hdate) ? ' لجلسة ' + H.date(d.hdate) : '';
  const SUBJ = {
    ilan_asl: d => 'إعلان' + hdt(d),
    reilan: d => 'إعادة إعلان' + cref(d) + hdt(d),
    tanfiz: d => 'إعلان بالصيغة التنفيذية للحكم الصادر' + cref(d),
    shawahed: d => 'إعلان بشواهد التزوير' + cref(d) + hdt(d),
    sihha_new: d => 'صحة توقيع على ' + H.v(d.ctr) + (H.has(d.cdate) ? ' المؤرخ ' + H.date(d.cdate) : ''),
    sihha_ta3jil: d => 'تعجيل من ' + (/شطب/.test(d.stop || '') ? 'الشطب' : 'الوقف') + cref(d),
    inzar_rent: d => 'إنذار بعرض أجرة بمبلغ ' + H.v(H.num(d.amt), 4) + ' جنيه عن المدة من ' + H.dateOr(d.from) + ' وحتى ' + H.dateOr(d.to),
    inzar_gen: d => 'إنذار',
    istinaf: d => 'استئناف الحكم الصادر' + cref(d, 'j'),
    ishkal: d => 'إشكال في تنفيذ الحكم الصادر' + cref(d, 'j'),
    tadakhul: d => 'إعلان بالتدخل الهجومي' + cref(d) + (H.has(d.hdate) ? ' والمحدد لنظرها جلسة ' + H.date(d.hdate) : ''),
    da3wa: d => 'صحيفة دعوى' + hdt(d)
  };
  const SIDE_F = F.text('sideSubj', 'موضوع الورقة (يظهر في العمود الجانبي)', { opt: true, hint: 'اتركه فارغاً ليُكتب تلقائياً حسب البيانات' });
  Object.keys(SUBJ).forEach(id => { T[id].subject = d => H.has(d.sideSubj) ? d.sideSubj.trim() : SUBJ[id](d); T[id].fields.push(SIDE_F); });
  ['naqd', 'idari', 'shakwa'].forEach(id => { T[id].lh = 'small'; T[id].bold = false; });
  T.mozakra.lh = 'center'; T.mozakra.bold = false;
  T.bay3.lh = 'none'; T.fasakh.lh = 'none'; T.fasakh.bold = false;
  T.mozakra.fs = 18; T.shakwa.fs = 18; T.naqd.fs = 16; T.bay3.fs = 16;
  ['naqd', 'idari', 'mozakra'].forEach(id => { T[id].tu = false; });
  ['mozakra', 'shakwa', 'naqd'].forEach(id => { T[id].loose = true; });
  const PDATE = F.date('pdate', 'تاريخ الورقة', { opt: true, hint: 'اختر التاريخ، أو اضغط «مسح التاريخ» ليتركه فارغاً للمحضر' });
  Object.keys(T).forEach(id => { if (!['mozakra', 'shakwa', 'bay3', 'fasakh'].includes(id)) T[id].fields.unshift(PDATE); });

  /* ---------- مجموعات الشاشة الرئيسية ---------- */
  const GROUPS = [
    { id: 'ilan', name: 'إعلانات', ic: '📨', items: ['ilan_asl', 'reilan', 'tanfiz', 'shawahed'] },
    { id: 'sihha', name: 'صحة توقيع', ic: '✍', items: ['sihha_new', 'sihha_ta3jil'] },
    { id: 'inzar', name: 'إنذارات', ic: '⚠', items: ['inzar_rent', 'inzar_gen'] },
    { id: 'istinaf', name: 'استئناف وإشكال', ic: '⚖', items: ['istinaf', 'ishkal'] },
    { id: 'tadakhul', name: 'تدخل هجومي', ic: '↩', items: ['tadakhul'] },
    { id: 'da3wa', name: 'صحيفة دعوى', ic: '📄', items: ['da3wa'] },
    { id: 'ta3n', name: 'طعون (نقض – إدارية عليا)', ic: '🏛', items: ['naqd', 'idari'] },
    { id: 'mozakra', name: 'مذكرة دفاع', ic: '📝', items: ['mozakra'] },
    { id: 'shakwa', name: 'شكوى للنيابة', ic: '📮', items: ['shakwa'] },
    { id: 'uqud', name: 'عقود', ic: '🤝', items: ['bay3', 'fasakh'] }
  ];

  window.TPL = { T, GROUPS, H, F };
})();
