/* Shared behaviour for every page: top bar, lesson order, progress,
   stand-ins for pictures and recordings that do not exist yet. */
(function () {
    'use strict';

    var SORANI = ['abc.html', 'secondabc.html', 'kurdish_greetings.html', 'kurdish_numbers.html',
        'kurdish_colors.html', 'kurdish_weekdays.html', 'kurdish_months.html', 'kurdish_times_of_day.html',
        'kurdish_weather.html', 'kurdish_fruits.html', 'kurdish_trees.html', 'kurdish_places.html',
        'kurdish_cities.html', 'kurdish_professions.html', 'kurdish_grammar_focus.html',
        'kurdish_sentence_builder.html', 'kurdish_story_sequencer.html', 'kurdish_word_drawer.html', 'sorani_3d.html'];
    var KURMANJI = ['kurmanji_alphabet.html', 'kurmanji_basic_sentences.html', 'kurmanji_phrases.html',
        'kurmanji_numbers.html', 'kurmanji_colors.html', 'kurmanji_family.html', 'kurmanji_bodyparts.html',
        'kurmanji_time.html', 'kurmanji_cities.html', 'kurmanji_3d.html'];

    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page.indexOf('.html') < 0) page = 'index.html';
    var isKmr = page.indexOf('kurmanji') === 0;
    var list = isKmr ? KURMANJI : SORANI;
    var hub = isKmr ? 'kurmanji_index.html' : 'sorani.html';
    var pos = list.indexOf(page);
    var isHub = page === hub;
    var T = isKmr
        ? { home: 'Destpêk', hub: 'Wane', prev: 'Paş', next: 'Pêş', done: 'wane qediyan', noAudio: 'Li ser vê amûrê deng tune ye.' }
        : { home: 'سەرەتا', hub: 'وانەکان', prev: 'پێشوو', next: 'دواتر', done: 'وانە تەواو کراوە', noAudio: 'لەم ئامێرەدا دەنگ بەردەست نییە.' };

    /* ---------- storage (may be unavailable) ---------- */
    function load() { try { return JSON.parse(localStorage.getItem('ku_seen') || '{}') || {}; } catch (e) { return {}; } }
    function save(o) { try { localStorage.setItem('ku_seen', JSON.stringify(o)); } catch (e) { } }
    var seen = load();
    if (pos >= 0) { seen[page] = 1; save(seen); }

    /* ---------- toast instead of alert() ---------- */
    var toastEl, toastTimer;
    function toast(msg) {
        if (!document.body) return;
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'ku-toast'; toastEl.setAttribute('role', 'status'); }
        toastEl.textContent = String(msg).trim();
        toastEl.dir = 'auto';
        document.body.appendChild(toastEl);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.remove(); }, 3200);
    }
    window.alert = toast;

    /* ---------- speech ---------- */
    var MAP = { 'ئ': '', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'c', 'چ': 'ç', 'ح': 'h', 'خ': 'h', 'د': 'd',
        'ر': 'r', 'ڕ': 'r', 'ز': 'z', 'ژ': 'j', 'س': 's', 'ش': 'ş', 'ع': '', 'غ': 'g', 'ف': 'f', 'ڤ': 'v', 'ق': 'k',
        'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'ڵ': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ھ': 'h', 'ە': 'e', 'ۆ': 'o',
        'ێ': 'e', 'ي': 'y', '،': ',', '؟': '?', '؛': ';', '‌': '' };
    var VOW = 'aeiouıüö';
    function isV(c) { return c && VOW.indexOf(c) >= 0; }
    function isC(c) { return c && /[a-zçşğ]/.test(c) && !isV(c); }
    function word(w) {
        var o = [], i, c;
        w = w.replace(/وو/g, 'U');
        for (i = 0; i < w.length; i++) {
            c = w[i];
            if (c === 'U') o.push('u');
            else if (c === 'و' || c === 'ی' || c === 'ى') {
                var p = o[o.length - 1], n = w[i + 1], nv = n && 'اەۆێ'.indexOf(n) >= 0;
                var cons = i === 0 ? (w.length > 1) : (nv || (isV(p) && p !== (c === 'و' ? 'u' : 'i')));
                if (i === 0 && n && !nv && 'وی'.indexOf(n) < 0 && c === 'و') cons = true;
                o.push(c === 'و' ? (cons ? 'v' : 'u') : (cons ? 'y' : 'i'));
            } else o.push(MAP.hasOwnProperty(c) ? MAP[c] : c);
        }
        // Sorani leaves the short vowel unwritten: rebuild syllables right to left and
        // put it back wherever consonants would otherwise pile up.
        var s = o.join(''), CON = 'bcçdfgğhjklmnprsştvyz', out = '', i2 = s.length;
        function con(ch) { return ch && CON.indexOf(ch) >= 0; }
        function falls(a, b) { return 'rlnmyv'.indexOf(a) >= 0 || ('sşzfh'.indexOf(a) >= 0 && 'tdkgbpçc'.indexOf(b) >= 0); }
        while (i2 > 0) {
            var e = i2; while (i2 > 0 && !con(s[i2 - 1])) i2--;
            out = s.slice(i2, e) + out;
            if (i2 === 0) break;
            var e2 = i2; while (i2 > 0 && con(s[i2 - 1])) i2--;
            var run = s.slice(i2, e2), hasR = /[aeiouıüö]/.test(s[e2] || ''), hasL = i2 > 0 && /[aeiouıüö]/.test(s[i2 - 1]), res = '';
            if (hasR) { res = run.slice(-1); run = run.slice(0, -1); }
            while (run.length) {
                if (hasL && (run.length === 1 || (run.length === 2 && falls(run[0], run[1])))) { res = run + res; run = ''; }
                else if (run.length === 1) { res = run + 'ı' + res; run = ''; }
                else if (!hasL && !hasR && run.length === 3 && falls(run[1], run[2])) { res = run[0] + 'ı' + run.slice(1) + res; run = ''; }
                else { res = run.slice(-2, -1) + 'ı' + run.slice(-1) + res; run = run.slice(0, -2); }
            }
            out = res + out;
        }
        s = out;
        return s;
    }
    function toLatin(text) {
        if (!/[؀-ۿ]/.test(text)) return text;
        return text.replace(/[ً-ْـ]/g, '').split(/(\s+)/).map(function (w) { return /\s/.test(w) ? w : word(w); }).join('');
    }
    var VOICE = false;   // set true to bring back the approximate machine voice
    if (!VOICE) {
        document.documentElement.classList.add('ku-novoice');
        try { if (window.SpeechSynthesis) SpeechSynthesis.prototype.speak = function (u) { var f = u && u.onend; if (typeof f === 'function') setTimeout(function () { f.call(u, {}); }, 0); }; } catch (e) { }
    }
    var voice = null, synth = window.speechSynthesis;
    function pick() {
        if (!synth) return;
        var v = synth.getVoices() || [];
        voice = v.filter(function (x) { return /^(ku|ckb|kmr)/i.test(x.lang); })[0] || v.filter(function (x) { return /^tr/i.test(x.lang); })[0] || null;
    }
    if (synth) { pick(); try { synth.addEventListener('voiceschanged', pick); } catch (e) { } }
    var warned = false;
    function speak(text, onend) {
        if (!VOICE) { if (onend) onend(); return; }   // synthetic voice is off until real recordings exist
        if (!synth || !text) { if (!warned) { warned = true; toast(T.noAudio); } if (onend) onend(); return; }
        try {
            synth.cancel();
            var native = voice && /^(ku|ckb|kmr)/i.test(voice.lang);
            var u = new SpeechSynthesisUtterance(native ? text : toLatin(text));
            if (voice) u.voice = voice;
            u.lang = voice ? voice.lang : 'tr-TR';
            u.rate = 0.85;
            u.onend = u.onerror = function () { if (onend) { var f = onend; onend = null; f(); } };
            synth.speak(u);
        } catch (e) { if (onend) onend(); }
    }

    /* short tones for right / wrong when no sound file exists */
    var ctx;
    function tone(ok) {
        try {
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            (ok ? [660, 880] : [220, 180]).forEach(function (f, i) {
                var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.12;
                o.frequency.value = f; o.type = ok ? 'sine' : 'triangle';
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
                o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
            });
        } catch (e) { }
    }

    /* Audio(): real file when it was published, spoken stand-in otherwise */
    var RealAudio = window.Audio, AMAP = window.KU_AUDIO || {}, OK = window.KU_AUDIO_OK || [];
    function Stand(src) {
        var self = this, L = {};
        this.src = src; this.currentTime = 0; this.paused = true; this.volume = 1; this.playbackRate = 1;
        this.addEventListener = function (t, f) { (L[t] = L[t] || []).push(f); };
        this.removeEventListener = function () { };
        this.load = function () { };
        this.pause = function () { this.paused = true; if (synth) try { synth.cancel(); } catch (e) { } };
        function fire(t) { var h = self['on' + t]; if (typeof h === 'function') h.call(self, { type: t, target: self }); (L[t] || []).forEach(function (f) { f.call(self, { type: t, target: self }); }); }
        this.play = function () {
            this.paused = false;
            var end = function () { self.paused = true; fire('ended'); };
            if (/incorrect|wrong|error|fail/i.test(src)) { tone(false); setTimeout(end, 350); }
            else if (/correct|success|win|right/i.test(src)) { tone(true); setTimeout(end, 350); }
            else if (AMAP[src]) speak(AMAP[src], end);
            else setTimeout(end, 50);
            return Promise.resolve();
        };
        setTimeout(function () { fire('loadeddata'); fire('canplay'); fire('canplaythrough'); }, 0);
    }
    window.Audio = function (src) {
        var key = String(src || '').replace(/^\.\//, '');
        if (!src || OK.indexOf(key) < 0) return new Stand(key);
        return new RealAudio(src);
    };

    /* ---------- pictures that do not exist yet: emoji tile ---------- */
    var EMO = [['watermelon', '🍉'], ['pomegranate', '🌺'], ['pineapple', '🍍'], ['apple', '🍎'], ['banana', '🍌'], ['grapes', '🍇'], ['orange', '🍊'],
        ['peach', '🍑'], ['pear', '🍐'], ['basket', '🧺'], ['hat', '👒'], ['pants', '👖'], ['shirt', '👕'], ['shoes', '👟'],
        ['airport', '✈️'], ['hospital', '🏥'], ['house', '🏠'], ['library', '📚'], ['market', '🛒'], ['bazar', '🛍️'], ['mosque', '🕌'],
        ['park_play', '🛝'], ['park', '🌳'], ['restaurant', '🍽️'], ['schoolbus', '🚌'], ['gotoschool', '🎒'], ['school', '🏫'], ['shop', '🏪'],
        ['baker', '🥖'], ['carpenter', '🪚'], ['doctor', '🩺'], ['driver', '🚗'], ['engineer', '📐'], ['farmer', '🚜'], ['lawyer', '⚖️'],
        ['nurse', '💉'], ['police', '👮'], ['teacher', '👩‍🏫'], ['rabbit_sleep', '😴'], ['turtle_wins', '🏆'], ['rabbit_turtle_1', '🐇'], ['rabbit', '🐢'], ['turtle', '🐢'],
        ['breakfast', '🍳'], ['class', '🏫'], ['student_home', '🏠'], ['wakeup', '⏰'], ['dinner', '🍲'], ['homework', '📝'], ['lunch', '🍛'],
        ['reading', '📖'], ['sleeping', '😴'], ['stars', '✨'], ['sun_high', '☀️'], ['sunrise', '🌅'], ['sunset', '🌇'], ['tea', '🍵'], ['tv', '📺'],
        ['work', '💼'], ['afternoon', '🌤️'], ['evening', '🌆'], ['morning', '🌅'], ['night', '🌙'], ['noon', '☀️'], ['citadel', '🏰'], ['qela', '🏰'],
        ['erbil', '🏙️'], ['food', '🍽️'], ['fig', '🍈'], ['mulberry', '🫐'], ['acorn', '🌰'], ['oak', '🌳'], ['pine', '🌲'], ['plane', '🍁'],
        ['poplar', '🌿'], ['walnut', '🌰'], ['leaf', '🍃'], ['tree', '🌳'], ['cloudy', '☁️'], ['cold', '🥶'], ['cool', '🍃'], ['foggy', '🌫️'],
        ['hot', '🥵'], ['lightning', '⚡'], ['rainy', '🌧️'], ['snowy', '❄️'], ['sunny', '☀️'], ['windy', '💨'], ['walls', '🧱'], ['dam', '🌊'],
        ['taqwasan', '🗿'], ['kobane', '✌️'], ['chwar_chra', '🕯️'], ['street', '🏘️'], ['lake', '🏞️'], ['amna_suraka', '🏛️'], ['fruit', '🍎'], ['time', '🕒']];
    function emojiFor(src) {
        var n = src.split('/').pop().toLowerCase();
        for (var i = 0; i < EMO.length; i++) if (n.indexOf(EMO[i][0]) >= 0) return EMO[i][1];
        return '🖼️';
    }
    document.addEventListener('error', function (e) {
        var el = e.target;
        if (!el || el.tagName !== 'IMG' || el.dataset.kuFallback) return;
        el.dataset.kuFallback = '1';
        el.classList.add('ku-emoji-img');
        el.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="#eaf1ec"/>' +
            '<text x="60" y="64" font-size="68" text-anchor="middle" dominant-baseline="central">' + emojiFor(el.getAttribute('src') || '') + '</text></svg>');
    }, true);

    /* ---------- top bar + hub progress ---------- */
    var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#f0b323"><circle cx="12" cy="12" r="5.2"/>' +
        Array.apply(null, Array(21)).map(function (_, i) { return '<path transform="rotate(' + (i * 360 / 21) + ' 12 12)" d="M12 1.2l1.1 5.2h-2.2z"/>'; }).join('') + '</g></svg>';
    function link(href, cls, inner, label) {
        return href ? '<a class="' + cls + '" href="' + href + '" aria-label="' + label + '">' + inner + '</a>'
            : '<span class="ku-off ' + cls + '" aria-hidden="true">' + inner + '</span>';
    }
    function bar() {
        var b = document.createElement('nav');
        b.className = 'ku-bar'; b.dir = isKmr ? 'ltr' : 'rtl'; b.lang = isKmr ? 'kmr' : 'ckb';
        var back = isKmr ? 'fa-chevron-left' : 'fa-chevron-right', fwd = isKmr ? 'fa-chevron-right' : 'fa-chevron-left';
        var h = '<a class="ku-brand" href="index.html" aria-label="' + T.home + '">' + SUN + '<span class="ku-label">' + T.home + '</span></a>';
        if (!isHub) h += '<a href="' + hub + '"><i class="fa-solid fa-table-cells-large"></i><span>' + T.hub + '</span></a>';
        h += '<span class="ku-grow"></span>';
        if (pos >= 0) {
            h += link(pos > 0 ? list[pos - 1] : '', 'ku-step', '<i class="fa-solid ' + back + '"></i><span class="ku-label">' + T.prev + '</span>', T.prev);
            h += '<span class="ku-count" dir="ltr">' + (pos + 1) + ' / ' + list.length + '</span>';
            h += link(pos < list.length - 1 ? list[pos + 1] : hub, 'ku-step ku-next', '<span>' + T.next + '</span><i class="fa-solid ' + fwd + '"></i>', T.next);
        } else {
            h += '<a href="' + (isKmr ? 'sorani.html' : 'kurmanji_index.html') + '" lang="' + (isKmr ? 'ckb' : 'kmr') + '">' + (isKmr ? 'سۆرانی' : 'Kurmancî') + '</a>';
        }
        b.innerHTML = h;
        document.body.insertBefore(b, document.body.firstChild);
    }
    function num(n) { return isKmr ? String(n) : String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
    function chip() {
        var h = document.querySelector('header h1'); if (!h || pos < 0) return;
        var c = document.createElement('div'); c.className = 'ku-chip';
        c.textContent = isKmr ? 'Wane ' + (pos + 1) + ' ji ' + list.length : 'وانەی ' + num(pos + 1) + ' لە ' + num(list.length);
        h.parentNode.insertBefore(c, h);
    }
    function hubProgress() {
        [].forEach.call(document.querySelectorAll('.module-card:not(a), .nav-card:not(a)'), function (x) { x.remove(); });
        var first = document.querySelector('a.nav-card, a.module-card');
        if (first) {
            var c3 = first.cloneNode(true), h = c3.querySelector('h2, h3'), d = c3.querySelector('p'), ic = c3.querySelector('i');
            c3.setAttribute('href', isKmr ? 'kurmanji_3d.html' : 'sorani_3d.html');
            if (ic) ic.className = 'fa-solid fa-cube';
            if (h) h.textContent = isKmr ? 'Cîhana 3D' : 'جیهانی سێ‌ڕەهەندی';
            if (d) d.textContent = isKmr ? 'Tîp, reng û hejmaran bi lîstikên sêalî biceribîne.' : 'پیت، ڕەنگ و ژمارەکان بە یاریی سێ‌ڕەهەندی تاقی بکەرەوە.';
            first.parentNode.appendChild(c3);
        }
        var cards = [].slice.call(document.querySelectorAll('a.nav-card, a.module-card'));
        if (!cards.length) return;
        var parent = cards[0].parentNode, done = 0;
        cards.sort(function (a, b) { return list.indexOf(a.getAttribute('href')) - list.indexOf(b.getAttribute('href')); });
        cards.forEach(function (c, i) {
            parent.appendChild(c);
            var isDone = !!seen[c.getAttribute('href')], n = document.createElement('span');
            n.className = 'ku-num' + (isDone ? ' ku-num-done' : '');
            n.innerHTML = (isDone ? '<i class="fa-solid fa-check"></i>' : '') + '<span>' + num(i + 1) + '</span>';
            c.appendChild(n); if (isDone) done++;
        });
        var p = document.createElement('div'); p.className = 'ku-progress'; p.dir = isKmr ? 'ltr' : 'rtl';
        p.innerHTML = '<span dir="ltr">' + num(done) + ' / ' + num(cards.length) + '</span> ' + T.done +
            '<div class="ku-progress-track"><div class="ku-progress-fill" style="width:' + Math.round(done / cards.length * 100) + '%"></div></div>';
        parent.parentNode.insertBefore(p, parent);
    }
    function start() {
        if (page === 'index.html') return;
        bar(); if (isHub) hubProgress(); chip();
        var f = document.querySelector('footer p');
        if (f) f.textContent = '© ' + new Date().getFullYear() + (isKmr ? ' Hîngeha Zimanê Kurdî' : ' فێرگەی زمانی کوردی');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

    window.KU = { speak: speak, toast: toast, toLatin: toLatin, seen: seen, SORANI: SORANI, KURMANJI: KURMANJI };
})();
