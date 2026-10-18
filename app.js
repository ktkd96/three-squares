(function () {
  "use strict";

  var PER_DAY = 3;
  var WORDS_PER_MIN = 200;
  var NUDGE_AFTER_MIN = 10;
  var NEW_SESSION_AFTER_MIN = 5; // away this long and the sit timer starts over

  var PIECES = window.PIECES || [];
  var PICKS = (window.PICKS && window.PICKS.picks) || [];
  var PLATFORM = { youtube: "YouTube", newsletter: "Newsletter", blog: "Blog", podcast: "Podcast", website: "Website", other: "Link" };
  var app = document.getElementById("app");
  var sitEl = document.getElementById("sit");
  var progress = document.getElementById("progress");
  var progressBar = document.getElementById("progress-bar");
  var nudge = document.getElementById("nudge");

  // ---------- storage (best effort; the app works without it) ----------

  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem("3sq:" + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem("3sq:" + key, JSON.stringify(value)); } catch (e) {}
    }
  };

  // ---------- dates ----------

  function dateKey(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function daysBetween(fromKey, toKey) {
    var a = fromKey.split("-").map(Number);
    var b = toKey.split("-").map(Number);
    var ms = Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2]);
    return Math.round(ms / 86400000);
  }

  // Everyone starts at the beginning of the library on their first day.
  var firstDay = store.get("firstDay", null);
  if (!firstDay) {
    firstDay = dateKey();
    store.set("firstDay", firstDay);
  }

  function todaysPieces() {
    var n = dayNumber();
    var out = [];
    for (var i = 0; i < PER_DAY && i < PIECES.length; i++) {
      out.push(PIECES[(n * PER_DAY + i) % PIECES.length]);
    }
    return out;
  }

  // Ids of today's pieces that have been read today.
  function readToday() {
    var all = store.get("read", {});
    var list = all[dateKey()] || [];
    return todaysPieces().map(function (p) { return p.id; }).filter(function (id) {
      return list.indexOf(id) !== -1;
    });
  }

  function markRead(id) {
    var all = store.get("read", {});
    var key = dateKey();
    var list = all[key] || [];
    if (list.indexOf(id) === -1) list.push(id);
    all[key] = list;
    // Keep only the last two weeks of history.
    Object.keys(all).sort().slice(0, -14).forEach(function (k) { delete all[k]; });
    store.set("read", all);
    updateSquares();
  }

  // ---------- helpers ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function words(piece) { return piece.body.trim().split(/\s+/).length; }

  function minutes(piece) { return Math.max(1, Math.round(words(piece) / WORDS_PER_MIN)); }

  function paragraphs(piece) {
    return piece.body.trim().split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p.replace(/\s*\n\s*/g, " ")) + "</p>";
    }).join("");
  }

  function updateSquares() {
    var done = readToday().length;
    document.querySelectorAll(".brand .squares i").forEach(function (sq, i) {
      sq.classList.toggle("on", i < done);
    });
  }

  // ---------- views ----------

  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }

  function renderToday() {
    var pieces = todaysPieces();
    var read = readToday();
    var allDone = pieces.every(function (p) { return read.indexOf(p.id) !== -1; });
    if (allDone) return renderFinished(pieces);

    var total = pieces.reduce(function (s, p) { return s + minutes(p); }, 0);
    var left = pieces.length - read.length;
    var now = new Date();
    var headline = read.length === 0
      ? "Today's three"
      : left === 1 ? "One left" : left + " left";

    app.innerHTML =
      '<p class="date">' + esc(now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })) + "</p>" +
      '<h1 class="headline">' + headline + "</h1>" +
      '<p class="sub">About ' + total + " minutes in all. No feed, no likes, nothing to catch up on.</p>" +
      '<ol class="cards">' +
      pieces.map(function (p, i) {
        var isRead = read.indexOf(p.id) !== -1;
        return '<li><a class="card' + (isRead ? " read" : "") + '" href="#/read/' + p.id + '">' +
          '<div class="num"><span>' + (i + 1) + "</span></div>" +
          "<div>" +
          '<div class="meta">' + esc(p.kicker) + " · " + minutes(p) + " min</div>" +
          "<h2>" + esc(p.title) + "</h2>" +
          "<p>" + esc(p.dek) + "</p>" +
          "</div></a></li>";
      }).join("") +
      "</ol>" +
      '<p class="footnote"><button type="button" id="about-btn">Why only three?</button></p>';

    document.getElementById("about-btn").addEventListener("click", openAbout);
  }

  function renderFinished(pieces) {
    app.innerHTML =
      '<section class="finished">' +
      '<div class="big-squares" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<h1 class="headline">That\'s all three.</h1>' +
      '<p class="sub">Up you get. Wash your hands. New reads in <span class="countdown" id="countdown"></span>.</p>' +
      pickOfTheDay() +
      '<div class="reread"><h3>Read again</h3>' +
      pieces.map(function (p) {
        return '<a href="#/read/' + p.id + '">' + esc(p.title) + "</a>";
      }).join("") +
      "</div></section>";

    var cd = document.getElementById("countdown");
    function tick() {
      var now = new Date();
      var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      var s = Math.max(0, Math.floor((midnight - now) / 1000));
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      cd.textContent = h > 0 ? h + "h " + m + "m" : m + "m " + (s % 60) + "s";
      if (s === 0) route();
    }
    tick();
    var timer = setInterval(tick, 1000);
    onLeave(function () { clearInterval(timer); });
  }

  function dayNumber() { return Math.max(0, daysBetween(firstDay, dateKey())); }

  function pickOfTheDay() {
    if (!PICKS.length) return "";
    var p = PICKS[dayNumber() % PICKS.length];
    return '<a class="potd" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
      '<span class="potd-label">While you\'re up, one worth following</span>' +
      '<span class="potd-name">' + esc(p.name) + ' <span class="plat">' + esc(PLATFORM[p.platform] || "Link") + " ↗</span></span>" +
      '<span class="potd-note">' + esc(p.note) + "</span></a>" +
      '<p class="potd-more"><a href="#/picks">See all picks</a></p>';
  }

  function renderPicks() {
    var cats = [];
    PICKS.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    var updated = window.PICKS && window.PICKS.updated;

    var head =
      '<h1 class="headline">Picks</h1>' +
      '<p class="sub">Creators worth your time, chosen by hand. No algorithm, no sponsors.' +
      (updated ? " Updated " + esc(new Date(updated + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })) + "." : "") +
      "</p>";

    if (!PICKS.length) {
      app.innerHTML = head + '<p class="empty-picks">The first picks are on their way.</p>';
      return;
    }

    app.innerHTML = head +
      (cats.length > 1
        ? '<nav class="chips" aria-label="Categories">' + cats.map(function (c) {
            return '<a href="#cat-' + slug(c) + '">' + esc(c) + "</a>";
          }).join("") + "</nav>"
        : "") +
      cats.map(function (c) {
        return '<section class="pick-group" id="cat-' + slug(c) + '"><h2>' + esc(c) + "</h2>" +
          PICKS.filter(function (p) { return p.category === c; }).map(function (p) {
            return '<a class="pick" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
              '<span class="pick-name">' + esc(p.name) + "</span>" +
              '<span class="plat">' + esc(PLATFORM[p.platform] || "Link") + " ↗</span>" +
              '<span class="pick-note">' + esc(p.note) + "</span></a>";
          }).join("") + "</section>";
      }).join("");

    // In-page category links shouldn't trigger the hash router.
    app.querySelectorAll(".chips a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var el = document.getElementById(a.getAttribute("href").slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function renderReader(id) {
    var pieces = todaysPieces();
    var idx = -1;
    pieces.forEach(function (p, i) { if (p.id === id) idx = i; });
    // Only today's pieces are readable. That's the point.
    if (idx === -1) { location.replace("#/"); return; }
    var piece = pieces[idx];

    app.innerHTML =
      '<article class="article">' +
      '<a class="back" href="#/">← Today</a>' +
      '<div class="meta">' + (idx + 1) + " of " + pieces.length + " · " + esc(piece.kicker) + " · " + minutes(piece) + " min read</div>" +
      "<h1>" + esc(piece.title) + "</h1>" +
      '<p class="dek">' + esc(piece.dek) + "</p>" +
      '<div class="prose">' + paragraphs(piece) + "</div>" +
      '<footer class="end" id="end"></footer>' +
      "</article>";

    window.scrollTo(0, 0);
    progress.hidden = false;

    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, window.scrollY / max) : 1;
      progressBar.style.width = (pct * 100).toFixed(1) + "%";
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    onLeave(function () {
      window.removeEventListener("scroll", onScroll);
      progress.hidden = true;
      progressBar.style.width = "0";
    });

    var end = document.getElementById("end");
    function fillEnd() {
      var read = readToday();
      var unread = [];
      for (var i = 1; i < pieces.length; i++) {
        var p = pieces[(idx + i) % pieces.length];
        if (read.indexOf(p.id) === -1) unread.push(p);
      }
      var next = unread[0];
      end.innerHTML = next
        ? '<p class="fin">Done. ' + unread.length + " to go today.</p>" +
          '<div class="btn-row"><a class="btn" href="#/read/' + next.id + '">Next: ' + esc(next.title) + "</a></div>"
        : '<p class="fin">That was the last one for today.</p>' +
          '<div class="btn-row"><a class="btn" href="#/">Finish</a></div>';
    }

    // Count it as read once the reader reaches the end.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          markRead(piece.id);
          fillEnd();
          io.disconnect();
        }
      });
      io.observe(end);
      onLeave(function () { io.disconnect(); });
    } else {
      markRead(piece.id);
    }
    fillEnd();
  }

  function openAbout() {
    var d = document.createElement("dialog");
    d.innerHTML =
      "<h2>Why only three?</h2>" +
      "<p>Three Squares is reading for the few minutes you're sitting down with nothing else to do. It's not a feed.</p>" +
      "<ul>" +
      "<li>Three short pieces a day, about two minutes each.</li>" +
      "<li>Curious, true and light. Not homework, not junk.</li>" +
      "<li>No infinite scroll, no likes, no notifications.</li>" +
      "<li>When you're done, you're done. Come back tomorrow.</li>" +
      "</ul>" +
      "<p>Also, doctors suggest not sitting on the toilet much longer than ten minutes. We're on their side.</p>" +
      '<div class="btn-row"><button class="btn" type="button">Got it</button></div>';
    document.body.appendChild(d);
    d.querySelector("button").addEventListener("click", function () { d.close(); });
    d.addEventListener("close", function () { d.remove(); });
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }

  // ---------- routing ----------

  var renderedDay = dateKey();

  function route() {
    while (cleanup.length) cleanup.pop()();
    renderedDay = dateKey();
    var hash = location.hash || "#/";
    var m = hash.match(/^#\/read\/([\w-]+)$/);
    if (m) renderReader(m[1]);
    else if (hash === "#/picks") renderPicks();
    else renderToday();
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.setAttribute("aria-current", String(a.getAttribute("href") === (hash === "#/picks" ? "#/picks" : "#/")));
    });
    window.scrollTo(0, 0);
    updateSquares();
  }

  window.addEventListener("hashchange", route);

  // ---------- sit timer ----------

  var sessionStart = Date.now();
  var hiddenAt = null;
  var nudged = false;

  function updateSit() {
    var mins = Math.floor((Date.now() - sessionStart) / 60000);
    sitEl.textContent = mins < 1 ? "Just sat down" : "Sitting " + mins + " min";
    sitEl.classList.toggle("long", mins >= NUDGE_AFTER_MIN);
    if (mins >= NUDGE_AFTER_MIN && !nudged) {
      nudged = true;
      nudge.hidden = false;
    }
  }

  document.getElementById("nudge-ok").addEventListener("click", function () { nudge.hidden = true; });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }
    if (hiddenAt && Date.now() - hiddenAt > NEW_SESSION_AFTER_MIN * 60000) {
      sessionStart = Date.now();
      nudged = false;
      nudge.hidden = true;
    }
    hiddenAt = null;
    // A new day may have started while the app was in the background.
    if (dateKey() !== renderedDay) route();
    updateSit();
  });

  setInterval(updateSit, 15000);
  updateSit();
  route();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
