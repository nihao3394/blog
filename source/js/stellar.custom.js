/* ============================================================
   custom.js —— 立即执行 + Swup 无刷新切换
   ============================================================ */
console.log('[custom.js] 脚本已加载');

window.addEventListener('error', function (e) {
  console.error('[custom.js] 错误：', e.message, '位置', e.filename, ':', e.lineno);
});

(function () {
  if (!document.body) { console.warn('[custom.js] document.body 未就绪'); return; }
  initFlip();
  initThemeButton();
  initMusicPlayer();
  initSwup();
})();

/* ============================================================
   副标题翻转动画
   ============================================================ */
function initFlip() {
  try {
    var subtitleEl = document.querySelector('.sub.cap');
    if (!subtitleEl) return;
    if (subtitleEl.__flipBound) return;
    subtitleEl.__flipBound = true;
    var currentText = '欢迎来访';
    var originalText = '欢迎来访';
    var hoverText = '祝您愉快';
    var isAnimating = false;
    subtitleEl.addEventListener('mouseenter', function () {
      if (isAnimating) return;
      isAnimating = true;
      subtitleEl.classList.remove('flip-animation');
      void subtitleEl.offsetWidth;
      subtitleEl.classList.add('flip-animation');
      setTimeout(function () {
        currentText = currentText === originalText ? hoverText : originalText;
        subtitleEl.textContent = currentText;
      }, 300);
      setTimeout(function () {
        subtitleEl.classList.remove('flip-animation');
        isAnimating = false;
      }, 600);
    });
  } catch (err) { console.error('[custom.js] 翻转动画失败：', err); }
}

/* ============================================================
   明暗切换按钮
   ============================================================ */
function initThemeButton() {
  try {
    var old = document.querySelector('#ctl-theme');
    if (old && old.closest('.control-buttons')) old.closest('.control-buttons').remove();

    var header = document.querySelector('.l_left .leftbar-container .header')
      || document.querySelector('.l_left .header')
      || document.querySelector('.leftbar-container .header');
    if (!header) return;

    var wrap = document.createElement('div');
    wrap.className = 'control-buttons';
    wrap.innerHTML = '<button id="ctl-theme" type="button"></button>';
    header.appendChild(wrap);
    var btn = wrap.querySelector('#ctl-theme');

    var ICON_SUN = '<svg viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>';
    var ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>';
    var ICON_AUTO = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><circle cx="12" cy="12" r="5"/></svg>';

    function render(t) {
      if (t === 'dark') btn.innerHTML = ICON_MOON + '<span>暗色</span>';
      else if (t === 'light') btn.innerHTML = ICON_SUN + '<span>亮色</span>';
      else btn.innerHTML = ICON_AUTO + '<span>跟随系统</span>';
    }
    function currentTheme() { return document.documentElement.getAttribute('data-theme') || 'auto'; }
    btn.addEventListener('click', function () {
      var cur = currentTheme();
      var next = ['light', 'dark', 'auto'][(['light', 'dark', 'auto'].indexOf(cur) + 1) % 3];
      if (next === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('Stellar.theme', next); } catch (e) {}
      render(next);
    });
    render(currentTheme());
  } catch (err) { console.error('[custom.js] 明暗按钮失败：', err); }
}

/* ============================================================
   音乐播放器（完整版）
   ============================================================ */
function initMusicPlayer() {
  if (document.querySelector('.music-orb')) return;
  try {
    var APIS = [
      'https://meting.spr-aachen.com/api',
      'https://api.injahow.cn/meting/',
      'https://meting.qjqq.cn/api'
    ];
    var CFG = { server: 'netease', type: 'playlist', id: '2161912966' };
    var K = {
      song: 'player_song_id', progress: 'player_progress', playlist: 'player_playlist_cache',
      expanded: 'player_expanded', wasPlaying: 'player_was_playing',
      mode: 'player_mode', volume: 'player_volume', muted: 'player_muted', lyrics: 'player_show_lyrics'
    };
    var FALLBACK = [
      { id: 'fb1', name: 'SoundHelix Song 1', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', pic: '', lrc: '' },
      { id: 'fb2', name: 'SoundHelix Song 2', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', pic: '', lrc: '' },
      { id: 'fb3', name: 'SoundHelix Song 3', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', pic: '', lrc: '' }
    ];

    /* ---- 图标 ---- */
    var I_REPEAT = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
    var I_REPEAT_ONE = '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>';
    var I_SHUFFLE = '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>';
    var I_LYRICS = '<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1v5h5"/><path d="M9 16.5v-4.2l6-1.6v4.3"/><circle cx="8" cy="16.5" r="1.4"/><circle cx="14" cy="15" r="1.4"/></svg>';
    var I_VOL_ON = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
    var I_VOL_OFF = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    var I_PLAYLIST = '<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zm14 1.5v-10l6-1v10.5c0 1.1-.9 2-2 2s-2-.9-2-2zm3-3.3l3-1v3.8c0 .55-.45 1-1 1s-1-.45-1-1v-2.8z"/></svg>';
    var I_COLLAPSE = '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>';

    /* ---- DOM ---- */
    var orb = document.createElement('button');
    orb.className = 'music-orb'; orb.type = 'button'; orb.textContent = '♪';
    document.body.appendChild(orb);

    var panel = document.createElement('div');
    panel.className = 'music-panel';
    panel.innerHTML =
      '<div class="mp-head">' +
        '<div class="mp-cover"><img src="" alt=""></div>' +
        '<div class="mp-info">' +
          '<div class="mp-title">加载中...</div>' +
          '<div class="mp-artist">-</div>' +
        '</div>' +
        '<button type="button" class="btn-playlist" title="播放列表"></button>' +
      '</div>' +
      '<div class="mp-playlist"><div class="pl-head"><span>播放列表</span><button type="button" class="pl-close" title="关闭">×</button></div><div class="pl-list"></div></div>' +
      '<div class="mp-lyrics"></div>' +
      '<div class="mp-progress"><div class="bar"></div></div>' +
      '<div class="mp-time"><span class="t-cur">0:00</span><span class="t-total">0:00</span></div>' +
      '<div class="mp-controls">' +
        '<button type="button" class="btn-mode" title="播放模式"></button>' +
        '<button type="button" class="btn-prev" title="上一首">«</button>' +
        '<button type="button" class="btn-play" title="播放/暂停">▶</button>' +
        '<button type="button" class="btn-next" title="下一首">»</button>' +
        '<button type="button" class="btn-lyrics" title="歌词开关"></button>' +
      '</div>' +
      '<div class="mp-volume">' +
        '<button type="button" class="btn-vol" title="静音"></button>' +
        '<input type="range" min="0" max="100" step="1" value="50">' +
        '<button type="button" class="btn-collapse" title="收起"></button>' +
      '</div>' +
      '<div class="mp-error"></div>';
    document.body.appendChild(panel);

    var coverEl = panel.querySelector('.mp-cover');
    var coverImg = coverEl.querySelector('img');
    var titleEl = panel.querySelector('.mp-title');
    var artistEl = panel.querySelector('.mp-artist');
    var lyricsEl = panel.querySelector('.mp-lyrics');
    var playlistEl = panel.querySelector('.mp-playlist');
    var progressBar = panel.querySelector('.mp-progress .bar');
    var progressWrap = panel.querySelector('.mp-progress');
    var timeCur = panel.querySelector('.t-cur');
    var timeTotal = panel.querySelector('.t-total');
    var btnMode = panel.querySelector('.btn-mode');
    var btnPrev = panel.querySelector('.btn-prev');
    var btnPlay = panel.querySelector('.btn-play');
    var btnNext = panel.querySelector('.btn-next');
    var btnLyrics = panel.querySelector('.btn-lyrics');
    var btnPlaylist = panel.querySelector('.btn-playlist');
    var btnVol = panel.querySelector('.btn-vol');
    var btnCollapse = panel.querySelector('.btn-collapse');
    var volRange = panel.querySelector('.mp-volume input');
    var errEl = panel.querySelector('.mp-error');
    btnLyrics.innerHTML = I_LYRICS;
    btnPlaylist.innerHTML = I_PLAYLIST;
    btnCollapse.innerHTML = I_COLLAPSE;

    var audio = new Audio();
    audio.preload = 'metadata';
    var playlist = [], index = 0, playing = false, pendingPlay = false;
    var curLrc = [], curLrcIndex = -1, lastSave = 0;
    var mode = 0, volume = 0.5, muted = false, showLyrics = true;
    var userScrolling = false, scrollTimer = null;

    function fmt(s) {
      s = Math.floor(s || 0);
      return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function showErr(m) { errEl.textContent = m; }
    function clearErr() { errEl.textContent = ''; }
    function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }

    function setPlaying(p) {
      playing = p;
      btnPlay.textContent = p ? 'Ⅱ' : '▶';
      orb.classList.toggle('playing', p);
      coverEl.classList.toggle('spinning', p);
      save(K.wasPlaying, p ? '1' : '0');
    }

    /* ---- 模式 ---- */
    function applyMode() {
      var icons = [I_REPEAT, I_REPEAT_ONE, I_SHUFFLE];
      var tips = ['顺序播放', '单曲循环', '随机播放'];
      btnMode.innerHTML = icons[mode];
      btnMode.title = tips[mode];
      btnMode.classList.toggle('on', mode !== 0);
      save(K.mode, String(mode));
    }
    function nextIndex() {
      if (mode === 1) return index;
      if (mode === 2) { if (playlist.length <= 1) return index; var r; do { r = Math.floor(Math.random() * playlist.length); } while (r === index); return r; }
      return (index + 1) % playlist.length;
    }
    function prevIndex() {
      if (mode === 1) return index;
      if (mode === 2) { if (playlist.length <= 1) return index; var r; do { r = Math.floor(Math.random() * playlist.length); } while (r === index); return r; }
      return (index - 1 + playlist.length) % playlist.length;
    }

    /* ---- 歌单 ---- */
    function renderPlaylist() {
      var list = playlistEl.querySelector('.pl-list');
      list.innerHTML = playlist.map(function (song, i) {
        var title = song.title || song.name || '未知';
        return '<div class="pl-item' + (i === index ? ' active' : '') + '" data-i="' + i + '">' +
          '<span class="pl-idx">' + (i + 1) + '</span>' +
          '<span class="pl-title">' + title + '</span>' +
        '</div>';
      }).join('');
    }
    function togglePlaylist() {
      playlistEl.classList.toggle('open');
      btnPlaylist.classList.toggle('on', playlistEl.classList.contains('open'));
      if (playlistEl.classList.contains('open')) renderPlaylist();
    }

    /* ---- 歌词 ---- */
    function parseLRC(lrc) {
      var result = [];
      if (!lrc) return result;
      var re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
      lrc.split('\n').forEach(function (line) {
        var text = line.replace(re, '').trim();
        var matches = [], m, re2 = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
        while ((m = re2.exec(line)) !== null) matches.push(m);
        matches.forEach(function (mm) {
          var min = parseInt(mm[1]), sec = parseInt(mm[2]), ms = mm[3] ? parseInt(mm[3]) : 0;
          if (mm[3] && mm[3].length === 2) ms *= 10;
          result.push({ time: min * 60 + sec + ms / 1000, text: text });
        });
      });
      result.sort(function (a, b) { return a.time - b.time; });
      return result;
    }
    function renderAllLyrics() {
      lyricsEl.innerHTML = curLrc.map(function (l, i) {
        return '<div class="lrc-line" data-i="' + i + '">' + l.text + '</div>';
      }).join('');
    }
    function updateLyrics(t) {
      if (!curLrc.length) return;
      var idx = -1;
      for (var i = 0; i < curLrc.length; i++) { if (t >= curLrc[i].time) idx = i; else break; }
      if (idx !== curLrcIndex) {
        curLrcIndex = idx;
        var lines = lyricsEl.querySelectorAll('.lrc-line');
        lines.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
        if (lines[idx]) {
          var cRect = lyricsEl.getBoundingClientRect();
          var lRect = lines[idx].getBoundingClientRect();
          var top = lyricsEl.scrollTop + (lRect.top - cRect.top) - (cRect.height / 2) + (lRect.height / 2);
          lyricsEl.scrollTo({ top: top, behavior: 'smooth' });
        }
      }
    }
    function loadLyrics(song) {
      curLrc = []; curLrcIndex = -1;
      lyricsEl.innerHTML = '<div class="lrc-line">加载歌词中...</div>';
      var src = song.lrc || '';
      if (!src) { lyricsEl.innerHTML = '<div class="lrc-line">暂无歌词</div>'; return; }
      var p = /^https?:\/\//.test(src) ? fetch(src).then(function (r) { return r.text(); }) : Promise.resolve(src);
      p.then(function (text) {
        curLrc = parseLRC(text);
        if (curLrc.length === 0) lyricsEl.innerHTML = '<div class="lrc-line">暂无歌词</div>';
        else renderAllLyrics();
      }).catch(function () { lyricsEl.innerHTML = '<div class="lrc-line">暂无歌词</div>'; });
    }

    /* ---- 标题轮播 ---- */
    function setTitle(text) {
      titleEl.textContent = text;
      requestAnimationFrame(function () {
        if (titleEl.scrollWidth > titleEl.clientWidth) {
          titleEl.innerHTML = '<span class="scroll-inner">' + text + '&nbsp;&nbsp;&nbsp;&nbsp;' + text + '</span>';
        }
      });
    }

    /* ---- 歌曲加载 ---- */
    function loadSong(i, autoplay) {
      var song = playlist[i];
      if (!song) return;
      index = i;
      setTitle(song.title || song.name || '未知');
      var an = song.artist;
      if (Array.isArray(an)) an = an.join(',');
      artistEl.textContent = an || song.author || '-';
      coverImg.src = song.pic || song.cover || '';
      coverImg.onerror = function () { coverImg.src = ''; };
      audio.src = song.url || '';
      pendingPlay = !!autoplay;
      setPlaying(false);
      save(K.song, String(song.id || i));
      save(K.progress, '0');
      loadLyrics(song);
      if (playlistEl.classList.contains('open')) renderPlaylist();
    }

    audio.addEventListener('canplay', function () {
      if (pendingPlay) { pendingPlay = false; audio.play().then(function () { setPlaying(true); }).catch(function () {}); }
    });
    audio.addEventListener('playing', function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
        timeCur.textContent = fmt(audio.currentTime);
        timeTotal.textContent = fmt(audio.duration);
      }
      updateLyrics(audio.currentTime);
      var now = Date.now();
      if (now - lastSave > 2000) { lastSave = now; save(K.progress, String(audio.currentTime || 0)); }
    });
    audio.addEventListener('ended', function () { loadSong(nextIndex(), true); });

    /* ---- 歌单获取 ---- */
    function restoreSong() {
      var savedId = load(K.song, null), savedProgress = parseFloat(load(K.progress, '0')) || 0;
      var targetIndex = 0;
      if (savedId) {
        for (var i = 0; i < playlist.length; i++) {
          if (String(playlist[i].id || i) === String(savedId)) { targetIndex = i; break; }
        }
      }
      index = targetIndex;
      loadSong(index, false);
      var wasPlaying = load(K.wasPlaying, '0') === '1';
      if (wasPlaying) pendingPlay = true;
      var saved = savedProgress;
      audio.addEventListener('loadedmetadata', function once() {
        if (saved > 0 && audio.duration) audio.currentTime = Math.min(saved, audio.duration);
        audio.removeEventListener('loadedmetadata', once);
      });
    }
    function fetchPlaylist() {
      clearErr();
      try {
        var cached = load(K.playlist, null);
        if (cached) {
          var list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) { playlist = list; restoreSong(); return; }
        }
      } catch (e) {}
      setTitle('加载中...');
      var tryApi = function (k) {
        if (k >= APIS.length) {
          playlist = FALLBACK;
          showErr('在线歌单加载失败，已切到本地示例歌单');
          setTimeout(clearErr, 4000);
          restoreSong();
          return;
        }
        var q = new URLSearchParams({ server: CFG.server, type: CFG.type, id: CFG.id, r: Math.random() });
        var sep = APIS[k].indexOf('?') >= 0 ? '&' : '?';
        fetch(APIS[k] + sep + q.toString())
          .then(function (res) { return res.json(); })
          .then(function (list) {
            if (!Array.isArray(list) || list.length === 0) throw new Error('empty');
            playlist = list;
            save(K.playlist, JSON.stringify(list));
            restoreSong();
          })
          .catch(function () { tryApi(k + 1); });
      };
      tryApi(0);
    }

    /* ---- 事件 ---- */
    function togglePanel(open) {
      panel.classList.toggle('open', open);
      orb.classList.toggle('hidden', open);
      save(K.expanded, open ? '1' : '0');
    }
    orb.addEventListener('click', function () { togglePanel(!panel.classList.contains('open')); });
    btnCollapse.addEventListener('click', function () { togglePanel(false); });
    if (load(K.expanded, '0') === '1') togglePanel(true);

    btnPlay.addEventListener('click', function () {
      if (!audio.src) { fetchPlaylist(); return; }
      if (playing) audio.pause();
      else audio.play().then(function () { setPlaying(true); }).catch(function () {});
    });
    btnPrev.addEventListener('click', function () { loadSong(prevIndex(), true); });
    btnNext.addEventListener('click', function () { loadSong(nextIndex(), true); });
    btnMode.addEventListener('click', function () { mode = (mode + 1) % 3; applyMode(); });
    btnLyrics.addEventListener('click', function () {
      showLyrics = !showLyrics;
      lyricsEl.classList.toggle('collapsed', !showLyrics);
      btnLyrics.classList.toggle('on', showLyrics);
      save(K.lyrics, showLyrics ? '1' : '0');
    });
    btnPlaylist.addEventListener('click', togglePlaylist);
    panel.querySelector('.pl-close').addEventListener('click', function () {
      playlistEl.classList.remove('open');
      btnPlaylist.classList.remove('on');
    });
    playlistEl.addEventListener('click', function (e) {
      var item = e.target.closest('.pl-item');
      if (!item) return;
      var i = parseInt(item.dataset.i);
      loadSong(i, true);
      togglePlaylist();
    });

    /* 音量 */
    function updateVolUI() {
      var pct = Math.round((muted ? 0 : volume) * 100);
      volRange.style.background = 'linear-gradient(to right, var(--theme) 0%, var(--theme) ' + pct + '%, var(--block) ' + pct + '%, var(--block) 100%)';
      volRange.value = String(pct);
      btnVol.innerHTML = muted ? I_VOL_OFF : I_VOL_ON;
      save(K.volume, String(volume));
      save(K.muted, muted ? '1' : '0');
    }
    btnVol.addEventListener('click', function () { muted = !muted; updateVolUI(); audio.volume = muted ? 0 : volume; });
    volRange.addEventListener('input', function () {
      volume = parseInt(volRange.value) / 100;
      muted = volume === 0;
      audio.volume = muted ? 0 : volume;
      updateVolUI();
    });

    // 进度条：支持点击和拖拽，拖拽时即时跟手
    var progressDragging = false;
    function seekTo(e) {
      var rect = progressWrap.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      if (audio.duration) {
        var targetTime = pct * audio.duration;
        audio.currentTime = targetTime;
        progressBar.style.transition = 'none';   // 拖拽时禁用过渡，立即跟手
        progressBar.style.width = (pct * 100) + '%';
        timeCur.textContent = fmt(targetTime);
      }
    }
    function endProgressDrag() {
      progressDragging = false;
      progressBar.style.transition = 'width 0.1s linear';  // 松手后恢复过渡
    }
    progressWrap.addEventListener('mousedown', function (e) { progressDragging = true; seekTo(e); });
    document.addEventListener('mousemove', function (e) { if (progressDragging) seekTo(e); });
    document.addEventListener('mouseup', endProgressDrag);
    progressWrap.addEventListener('touchstart', function (e) { progressDragging = true; seekTo(e.touches[0]); }, { passive: true });
    document.addEventListener('touchmove', function (e) { if (progressDragging && e.touches.length) seekTo(e.touches[0]); }, { passive: true });
    document.addEventListener('touchend', endProgressDrag);

    /* ---- 初始化状态 ---- */
    mode = parseInt(load(K.mode, '0')) || 0;
    applyMode();
    volume = parseFloat(load(K.volume, '0.5')) || 0.5;
    muted = load(K.muted, '0') === '1';
    showLyrics = load(K.lyrics, '1') === '1';
    lyricsEl.classList.toggle('collapsed', !showLyrics);
    btnLyrics.classList.toggle('on', showLyrics);
    updateVolUI();
    audio.volume = muted ? 0 : volume;

    fetchPlaylist();
    console.log('[custom.js] 音乐播放器已初始化');
  } catch (err) {
    console.error('[custom.js] 音乐播放器初始化失败：', err);
  }
}

/* ============================================================
   搜索重绑（Swup 切换后搜索框被重建，需重新绑定）
   ============================================================ */
function rebindSearch() {
  try {
    if (!window.searchFunc) return;
    var input = document.querySelector('#search-input');
    if (!input) return;
    var filter = input.getAttribute('data-filter') || '';
    window.searchFunc('/search.json', filter, 'search-wrapper', 'search-input', 'search-result');
  } catch (e) { console.error('[custom.js] 搜索重绑失败：', e); }
}

/* ============================================================
   Swup 无刷新切换
   ============================================================ */
function initSwup() {
  try {
    var CDNS = [
      'https://cdn.jsdelivr.net/npm/swup@2/dist/swup.min.js',
      'https://unpkg.com/swup@2/dist/swup.min.js',
      'https://gcore.jsdelivr.net/npm/swup@2/dist/swup.min.js'
    ];
    var loadSwup = function (k) {
      if (k >= CDNS.length) { console.warn('[custom.js] Swup 所有 CDN 均加载失败（网络受限）'); return; }
      var s = document.createElement('script');
      s.src = CDNS[k];
      s.onload = function () {
        if (!window.Swup) { loadSwup(k + 1); return; }
        try {
          var swup = new Swup({
            containers: ['#start'],
            cache: true,
            linkSelector: 'a[href^="/"]:not([target="_blank"]):not([data-no-swup])',
            animationSelector: '[class*="transition-"]'
          });
          swup.on('contentReplaced', function () {
            initFlip();
            initThemeButton();
            rebindSearch();
          });
          console.log('[custom.js] Swup 已启用（v2）');
        } catch (e) { console.error('[custom.js] Swup 初始化失败：', e); }
      };
      s.onerror = function () { loadSwup(k + 1); };
      document.head.appendChild(s);
    };
    loadSwup(0);
  } catch (e) { console.error('[custom.js] Swup 异常：', e); }
}
