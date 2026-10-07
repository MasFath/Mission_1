/* COMPUTER LAB CLUB — Digital Mission System (vanilla JS, tanpa library). */
(function () {
  'use strict';

  var MAX_VIOLATIONS = 3;
  var VIOLATION_MERGE_MS = 1500; // kejadian beruntun dalam jendela ini dihitung satu pelanggaran
  var LETTERS = ['A', 'B', 'C', 'D'];

  /* ---------- Daftar Mission (mudah ditambah) ---------- */
  var MISSION_LIST = [
    { id: 'mission-01', num: '01', icon: '🖥️', title: 'KENALI MESINMU', points: ['Hardware', 'Software', 'Komponen komputer', 'Fungsi dasar'], requires: null,
      data: typeof mission01 !== 'undefined' ? mission01 : null },
    { id: 'mission-02', num: '02', requires: 'mission-01', data: typeof mission02 !== 'undefined' ? mission02 : null },
    { id: 'mission-03', num: '03', requires: 'mission-02', data: typeof mission03 !== 'undefined' ? mission03 : null },
    { id: 'mission-04', num: '04', requires: 'mission-03', data: typeof mission04 !== 'undefined' ? mission04 : null }
  ];

  /* ---------- State ---------- */
  var state;
  function freshState(mission) {
    return {
      mission: mission || null,
      currentQuestion: 0,
      answers: mission ? mission.questions.map(function () { return null; }) : [],
      score: 0,
      violations: 0,
      timeRemaining: mission ? mission.timeLimit : 900,
      missionStarted: false,
      missionFinished: false,
      deadline: 0,
      timerId: null,
      fsEntered: false,
      editable: false,
      lastViolationAt: 0,
      pendingTabWarn: false
    };
  }
  state = freshState(null);
  function isActive() { return state.missionStarted && !state.missionFinished; }

  /* ---------- Util ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(sec) { return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }
  function key(id, suffix) { return 'mission' + id.split('-')[1] + '_' + suffix; }
  function store(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* abaikan */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function isDone(id) { return load(key(id, 'completed')) === 'true'; }
  function bestScore(id) { var s = load(key(id, 'score')); return s === null ? null : Number(s); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, ms || 4000);
  }

  function show(view) {
    ['dashboard', 'briefing', 'mission', 'result'].forEach(function (v) { $('view-' + v).hidden = v !== view; });
    window.scrollTo(0, 0);
  }

  /* ---------- Modal ---------- */
  var modalAction = null;
  var modalAction2 = null;
  function showModal(title, body, btnText, action, hard, btn2Text, action2) {
    $('modal-title').textContent = title;
    $('modal-body').textContent = body;
    $('modal-btn').textContent = btnText;
    $('modal-box').className = 'modal-box' + (hard ? ' hard' : '');
    modalAction = action || null;
    modalAction2 = action2 || null;
    $('modal-btn2').hidden = !btn2Text;
    if (btn2Text) $('modal-btn2').textContent = btn2Text;
    $('modal').hidden = false;
    $('modal-btn').focus();
  }
  function hideModal() { $('modal').hidden = true; modalAction = null; modalAction2 = null; }
  function modalOpen() { return !$('modal').hidden; }

  /* ---------- Efek peringatan (bunyi + judul tab berkedip) ---------- */
  var flashId = null, audioCtx = null, origTitle = document.title;
  function primeAudio() {
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) { audioCtx = audioCtx || new AC(); if (audioCtx.resume) audioCtx.resume(); } } catch (e) { /* abaikan */ }
  }
  function beep() {
    try {
      if (!audioCtx) return;
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = 660; g.gain.value = 0.08;
      o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.4);
    } catch (e) { /* abaikan */ }
  }
  function startFlash() {
    stopFlash(); var on = false;
    flashId = setInterval(function () { on = !on; document.title = on ? '⚠️ KEMBALI KE MISSION!' : origTitle; }, 800);
  }
  function stopFlash() { if (flashId) { clearInterval(flashId); flashId = null; } document.title = origTitle; }

  /* ---------- Dashboard ---------- */
  function missionStatus(m) {
    if (!m.data) return 'LOCKED';
    if (isDone(m.id)) return 'COMPLETED';
    if (m.requires && !isDone(m.requires)) return 'LOCKED';
    return 'AVAILABLE';
  }

  function renderDashboard() {
    var done = MISSION_LIST.filter(function (m) { return isDone(m.id); }).length;
    var total = MISSION_LIST.length;
    $('level-bar').style.width = (done / total * 100) + '%';
    var blocks = '';
    for (var i = 0; i < total; i++) blocks += i < done ? '█' : '░';
    $('level-text').textContent = blocks + '  ' + done + ' / ' + total + ' MISSION';

    var wrap = $('cards'); wrap.innerHTML = '';
    MISSION_LIST.forEach(function (m) {
      var st = missionStatus(m);
      var card = el('article', 'card ' + (st === 'COMPLETED' ? 'done' : st === 'AVAILABLE' ? 'avail' : 'locked'));
      card.appendChild(el('div', 'icon', st === 'LOCKED' ? '🔒' : (m.icon || '🎮')));
      card.appendChild(el('div', 'num', 'MISSION ' + m.num));
      if (m.data || m.title) {
        card.appendChild(el('h3', '', m.title || m.data.title.toUpperCase()));
        var ul = el('ul');
        (m.points || []).forEach(function (p) { ul.appendChild(el('li', '', '✓ ' + p)); });
        card.appendChild(ul);
      } else {
        card.appendChild(el('h3', '', 'SEGERA HADIR'));
      }
      if (st === 'COMPLETED') {
        card.appendChild(el('div', 'badge done', '✓ COMPLETED — Score: ' + bestScore(m.id)));
      } else if (st === 'AVAILABLE') {
        card.appendChild(el('div', 'badge avail', 'STATUS: AVAILABLE'));
      } else {
        card.appendChild(el('div', 'badge locked', '🔒 LOCKED'));
      }
      if (st === 'AVAILABLE' || st === 'COMPLETED') {
        var b = el('button', 'btn ' + (st === 'AVAILABLE' ? 'primary' : ''), st === 'AVAILABLE' ? 'MULAI MISSION' : 'ULANGI MISSION');
        b.addEventListener('click', function () { openBriefing(m); });
        card.appendChild(b);
      }
      wrap.appendChild(card);
    });
  }

  /* ---------- Briefing ---------- */
  function openBriefing(m) {
    if (isActive()) return;
    state = freshState(m.data);
    state.missionRef = m;
    $('brief-head').textContent = '🚀 MISSION ' + m.num;
    $('brief-title').textContent = m.data.title.toUpperCase();
    $('brief-task').textContent = m.data.task;
    var r = $('brief-rules'); r.innerHTML = '';
    [['⏱️ Waktu', Math.round(m.data.timeLimit / 60) + ' menit'],
     ['📝 Soal', m.data.questions.length],
     ['🎯 Target', m.data.passingScore],
     ['⚠️ Pelanggaran', 'maksimal ' + MAX_VIOLATIONS]].forEach(function (x) {
      r.appendChild(el('li', '', x[0] + ' : ' + x[1]));
    });
    show('briefing');
  }

  /* ---------- Mulai Mission ---------- */
  function startMission() {
    if (!state.mission || state.missionStarted) return; // cegah klik ganda
    var m = state.mission;
    var ref = state.missionRef;
    state = freshState(m); state.missionRef = ref;
    state.missionStarted = true;
    state.deadline = Date.now() + m.timeLimit * 1000;
    state.startedAt = Date.now();
    primeAudio();
    $('hud-mission').textContent = 'MISSION ' + ref.num + ' — ' + m.title.toUpperCase();
    show('mission');
    renderQuestion();
    updateHud();
    startTimer();
    try { history.pushState({ mission: true }, '', location.href); } catch (e) { /* abaikan */ }
    tryFullscreen();
  }

  function tryFullscreen() {
    var de = document.documentElement;
    var fail = function () { toast('Fullscreen tidak tersedia di browser ini. Mission tetap berjalan.', 6000); };
    try {
      if (de.requestFullscreen) {
        var p = de.requestFullscreen();
        if (p && p.catch) p.catch(fail);
      } else { fail(); }
    } catch (e) { fail(); }
  }

  /* ---------- Timer (satu interval, berbasis waktu nyata) ---------- */
  function startTimer() {
    if (state.timerId) clearInterval(state.timerId);
    tick();
    state.timerId = setInterval(tick, 250);
  }
  function tick() {
    if (!isActive()) return;
    var rem = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    if (rem !== state.timeRemaining || $('hud-time').textContent === '') {
      state.timeRemaining = rem;
      $('hud-time').textContent = fmt(rem);
      $('hud-time').className = 'mono' + (rem <= 60 ? ' low' : '');
    }
    if (rem <= 0) finish('timeout');
  }

  /* ---------- HUD ---------- */
  function updateHud() {
    $('hud-viol').textContent = state.violations + ' / ' + MAX_VIOLATIONS;
    $('hud-viol-box').className = 'hud-box v' + state.violations;
    $('hud-time').textContent = fmt(state.timeRemaining);
  }

  /* ---------- Soal ---------- */
  function renderQuestion() {
    var m = state.mission, i = state.currentQuestion, q = m.questions[i], n = m.questions.length;
    var picked = state.answers[i];
    $('q-count').textContent = 'SOAL ' + (i + 1) + ' / ' + n;
    var filled = Math.round((i + 1) / n * 12), bt = '';
    for (var k = 0; k < 12; k++) bt += k < filled ? '█' : '░';
    $('q-bar-text').textContent = bt;
    $('q-bar').style.width = ((i + 1) / n * 100) + '%';
    $('q-text').textContent = q.text;
    var box = $('q-options'); box.innerHTML = '';
    q.options.forEach(function (t, idx) {
      var b = el('button', 'opt' + (picked === idx ? ' sel' : ''));
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', picked === idx ? 'true' : 'false');
      b.appendChild(el('span', 'let', LETTERS[idx]));
      b.appendChild(el('span', 'opt-text', t));
      b.addEventListener('click', function () { choose(idx); });
      box.appendChild(b);
    });
    var nav = $('q-nav'); nav.innerHTML = '';
    m.questions.forEach(function (_, j) {
      var c = el('button', 'chip' + (j === i ? ' cur' : '') + (state.answers[j] !== null ? ' ans' : ''), String(j + 1));
      c.type = 'button'; c.setAttribute('aria-label', 'Buka soal ' + (j + 1));
      c.addEventListener('click', function () { goTo(j); });
      nav.appendChild(c);
    });
    $('q-answered').textContent = answeredCount() + ' / ' + n + ' sudah dijawab';
    $('btn-prev').disabled = i === 0;
    $('btn-next').disabled = false;
    $('btn-next').textContent = i === n - 1 ? '🏁 SELESAIKAN MISSION' : 'LANJUT ➜';
  }
  function answeredCount() { return state.answers.filter(function (a) { return a !== null; }).length; }
  function choose(idx) {
    if (!isActive()) return;
    state.answers[state.currentQuestion] = idx; // boleh diganti kapan saja
    renderQuestion();
  }
  function goTo(j) {
    if (!isActive() || j < 0 || j >= state.mission.questions.length) return;
    state.currentQuestion = j;
    renderQuestion();
  }
  function next() {
    if (!isActive()) return;
    if (state.currentQuestion === state.mission.questions.length - 1) { attemptFinish(); return; }
    goTo(state.currentQuestion + 1);
  }
  function prev() { goTo(state.currentQuestion - 1); }
  function attemptFinish() {
    var left = state.mission.questions.length - answeredCount();
    if (left === 0) { finish('submit'); return; }
    showModal('🤔 MASIH ADA YANG KOSONG', 'Ada ' + left + ' soal yang belum dijawab.\nSoal kosong dihitung salah.\n\nMau periksa lagi dulu?',
      'PERIKSA LAGI', null, false, 'TETAP SELESAIKAN', function () { finish('submit'); });
  }

  /* ---------- Pelanggaran ---------- */
  function registerViolation(kind) {
    if (!isActive()) return;
    var now = Date.now();
    if (now - state.lastViolationAt < VIOLATION_MERGE_MS) return; // kejadian yang sama
    state.lastViolationAt = now;
    state.violations++;
    updateHud();
    if (state.violations >= MAX_VIOLATIONS) { finish('violation'); return; }
    beep();
    var level = state.violations + ' / ' + MAX_VIOLATIONS;
    var hard = state.violations >= 2;
    if (kind === 'fullscreen') {
      showModal('⚠️ FULLSCREEN TERHENTI',
        'Silakan kembali ke mode fullscreen\nuntuk melanjutkan Mission.\n\nPelanggaran: ' + level,
        'KEMBALI KE FULLSCREEN', function () { tryFullscreen(); }, hard);
    } else {
      state.pendingTabWarn = { level: level, hard: hard };
      startFlash();
      if (!document.hidden) showTabWarning();
    }
  }
  function showTabWarning() {
    var w = state.pendingTabWarn; if (!w || !isActive()) return;
    state.pendingTabWarn = false;
    showModal('⚠️ PERINGATAN',
      'Kamu meninggalkan halaman Mission.\n\nTetap berada di halaman sampai\ncheckpoint selesai.\n\nPelanggaran: ' + w.level,
      'MENGERTI, LANJUTKAN', null, w.hard);
  }

  /* ---------- Selesai & hasil ---------- */
  function finish(reason) {
    if (!isActive()) return;
    state.missionFinished = true;
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    var rem = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    if (reason === 'timeout') rem = 0;
    state.timeRemaining = rem;
    var m = state.mission, correct = 0;
    m.questions.forEach(function (q, i) { if (state.answers[i] === q.answer) correct++; });
    state.score = Math.round(correct * 100 / m.questions.length);
    var passed = reason === 'submit' && state.score >= m.passingScore;
    hideModal(); stopFlash();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* abaikan */ }
    if (passed) {
      var id = state.missionRef.id;
      store(key(id, 'completed'), 'true');
      var old = bestScore(id);
      if (old === null || state.score > old) store(key(id, 'score'), state.score);
    }
    renderResult(reason, passed, correct);
  }

  function renderResult(reason, passed, correct) {
    var m = state.mission, ref = state.missionRef;
    var r = $('result'); r.innerHTML = '';
    r.className = 'panel narrow result ' + (passed ? 'ok' : 'bad');
    var title = passed ? '🎉 MISSION COMPLETE!' : reason === 'timeout' ? '⏰ TIME OUT' : '🛑 MISSION FAILED';
    r.appendChild(el('h2', '', title));
    r.appendChild(el('div', 'panel-head', 'MISSION ' + ref.num + ' — ' + m.title.toUpperCase()));
    var msg = passed ? 'Kamu berhasil menyelesaikan Mission ' + ref.num + '.'
      : reason === 'timeout' ? 'Waktu Mission telah habis.'
      : reason === 'violation' ? 'Batas pelanggaran telah tercapai.\nCheckpoint dihentikan. Mission dihentikan.'
      : 'Pelajari kembali materi dan coba lagi.';
    var p = el('p', '', msg); p.style.whiteSpace = 'pre-line'; r.appendChild(p);
    var stats = el('div', 'stats');
    [['SKOR', state.score + ' / 100'], ['BENAR', correct + ' / ' + m.questions.length],
     ['PELANGGARAN', state.violations + ' / ' + MAX_VIOLATIONS], ['SISA WAKTU', fmt(state.timeRemaining)]].forEach(function (s) {
      var d = el('div', 'stat'); d.appendChild(el('div', 'k', s[0])); d.appendChild(el('div', 'v', s[1])); stats.appendChild(d);
    });
    r.appendChild(stats);
    r.appendChild(el('div', 'status', passed ? '✓ MISSION BERHASIL' : reason === 'timeout' || reason === 'violation' ? 'MISSION FAILED' : 'BELUM BERHASIL'));
    if (passed) r.appendChild(el('div', 'status', '🎖️ ' + m.level.toUpperCase()));
    var acts = el('div', 'actions');
    var b1 = el('button', 'btn ghost', '🏠 KEMBALI KE DASHBOARD');
    var b2 = el('button', 'btn primary', passed ? '🔄 ULANGI MISSION' : '🔄 COBA LAGI');
    b1.addEventListener('click', goDashboard);
    b2.addEventListener('click', function () { openBriefing(ref); });
    acts.appendChild(b1); acts.appendChild(b2); r.appendChild(acts);
    show('result');
    b2.focus();
  }

  function goDashboard() {
    if (isActive()) return;
    state = freshState(null);
    renderDashboard();
    show('dashboard');
  }

  /* ---------- Event browser ---------- */
  document.addEventListener('visibilitychange', function () {
    if (!isActive()) return;
    if (document.hidden) registerViolation('tab');
    else { stopFlash(); if (state.pendingTabWarn) showTabWarning(); }
  });

  document.addEventListener('fullscreenchange', function () {
    if (!isActive()) return;
    if (document.fullscreenElement) {
      state.fsEntered = true;
      if (modalOpen() && $('modal-title').textContent.indexOf('FULLSCREEN') !== -1) hideModal();
    } else if (state.fsEntered) {
      state.fsEntered = false;
      registerViolation('fullscreen');
    }
  });

  // Pindah ke jendela/aplikasi lain tanpa mengganti tab juga terdeteksi
  window.addEventListener('blur', function () {
    if (!isActive()) return;
    setTimeout(function () {
      if (isActive() && !document.hasFocus() && Date.now() - state.startedAt > 2500) registerViolation('tab');
    }, 400);
  });
  window.addEventListener('focus', function () { stopFlash(); if (isActive() && state.pendingTabWarn) showTabWarning(); });

  window.addEventListener('beforeunload', function (e) {
    if (!isActive()) return;
    e.preventDefault();
    e.returnValue = 'Mission sedang berlangsung. Yakin ingin meninggalkan halaman?';
    return e.returnValue;
  });

  window.addEventListener('popstate', function () {
    if (!isActive()) return;
    try { history.pushState({ mission: true }, '', location.href); } catch (e) { /* abaikan */ }
    toast('Tombol Back/Forward browser dinonaktifkan selama Mission.');
  });

  document.addEventListener('contextmenu', function (e) { if (isActive()) e.preventDefault(); });
  ['copy', 'cut', 'paste'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (isActive()) e.preventDefault(); });
  });

  document.addEventListener('keydown', function (e) {
    if (!isActive()) return;
    var k = (e.key || '').toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || (ctrl && ['u', 'c', 'v', 'x', 's', 'p'].indexOf(k) !== -1) ||
        (ctrl && e.shiftKey && ['i', 'j', 'c'].indexOf(k) !== -1)) {
      e.preventDefault(); return;
    }
    if (modalOpen() || ctrl || e.altKey) return;
    var qi = state.mission.questions[state.currentQuestion];
    if (['a', 'b', 'c', 'd'].indexOf(k) !== -1 && k.charCodeAt(0) - 97 < qi.options.length) { choose(k.charCodeAt(0) - 97); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON' && e.key === 'Enter') return; // biarkan tombol fokus bekerja
      next();
    } else if (e.key === 'ArrowLeft') { prev(); }
  });

  /* ---------- Inisialisasi ---------- */
  $('btn-start').addEventListener('click', startMission);
  $('btn-back-dash').addEventListener('click', goDashboard);
  $('btn-next').addEventListener('click', next);
  $('btn-prev').addEventListener('click', prev);
  $('modal-btn').addEventListener('click', function () {
    var act = modalAction; hideModal(); stopFlash();
    if (act) act();
  });
  $('modal-btn2').addEventListener('click', function () {
    var act = modalAction2; hideModal();
    if (act) act();
  });
  renderDashboard();
  show('dashboard');
})();
