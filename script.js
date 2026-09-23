/* shanmugaraj.dev — interactions
   One file, no dependencies. Everything is IntersectionObserver- or
   rAF-driven; nothing runs while it is off screen. */
(function () {
  "use strict";

  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- load sequence: wait for fonts so the headline never reflows ---------- */
  var ready = function () { root.classList.add("is-ready"); };
  if (doc.fonts && doc.fonts.ready) {
    Promise.race([doc.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
      requestAnimationFrame(ready);
    });
  } else { ready(); }

  /* ---------- split headings into masked words ---------- */
  var splitCount = 0;
  function split(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = doc.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(" ")); return; }
          var w = doc.createElement("span"); w.className = "w";
          var inner = doc.createElement("span"); inner.textContent = p;
          inner.style.setProperty("--i", splitCount++);
          w.appendChild(inner); frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        split(node);
      }
    });
  }
  $$(".split").forEach(function (el) { splitCount = 0; split(el); });

  /* ---------- reveal ---------- */
  var revealTargets = $$("[data-reveal], .split, .sec-index, .flagship, .c-bot");
  if (reduce || !hasIO) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    // stagger siblings that enter together
    $$(".bento > *").forEach(function (el, i) { el.style.setProperty("--delay", (i % 2) * 0.08 + "s"); });
    $$(".cap-list > *, .journal > *").forEach(function (el, i) { el.style.setProperty("--delay", Math.min(i, 3) * 0.05 + "s"); });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        rio.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- run decorative loops only while visible ---------- */
  if (hasIO && !reduce) {
    var playIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.style.setProperty("--play", e.isIntersecting ? "running" : "paused");
      });
    }, { threshold: 0 });
    $$(".hero, .flagship, .card").forEach(function (el) { playIO.observe(el); });
  } else if (!reduce) {
    $$(".flagship, .card").forEach(function (el) { el.style.setProperty("--play", "running"); });
  }

  /* ---------- navigation ---------- */
  var topbar = $("#topbar"), nav = $("#nav"), toggle = $("#navToggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    topbar.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    root.style.overflow = open ? "hidden" : "";
    if (open) { var first = $("a", nav); if (first) first.focus({ preventScroll: true }); }
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { if (nav.classList.contains("is-open")) setMenu(false); }); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  if (hasIO) {
    // solid bar once the hero headline has scrolled away
    var sentinel = $(".hero-title");
    new IntersectionObserver(function (entries) {
      topbar.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }, { rootMargin: "-64px 0px 0px 0px" }).observe(sentinel);

    // step aside while reading down, return on any upward scroll
    var lastY = window.scrollY, hRaf = 0;
    window.addEventListener("scroll", function () {
      if (hRaf) return;
      hRaf = requestAnimationFrame(function () {
        hRaf = 0;
        var y = window.scrollY, d = y - lastY;
        if (Math.abs(d) < 6) return;
        topbar.classList.toggle("is-hidden", d > 0 && y > 480 && !nav.classList.contains("is-open"));
        lastY = y;
      });
    }, { passive: true });
    topbar.addEventListener("focusin", function () { topbar.classList.remove("is-hidden"); });

    // active section in nav
    var links = {};
    $$(".nav a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (!a || !e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); links[k].removeAttribute("aria-current"); });
        a.classList.add("is-active"); a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var el = doc.getElementById(id); if (el) navIO.observe(el); });
    // clear the highlight when back in the hero
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); links[k].removeAttribute("aria-current"); });
    }, { rootMargin: "-45% 0px -50% 0px" }).observe($(".hero"));
  }

  /* ---------- hero: light source + parallax fragments (desktop only) ---------- */
  var hero = $(".hero"), light = $("#heroLight");
  if (fine && !reduce && hero && light) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, rect = null, active = false;
    var measure = function () { rect = hero.getBoundingClientRect(); };
    var tick = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      light.style.setProperty("--lx", cx + "px");
      light.style.setProperty("--ly", cy + "px");
      hero.style.setProperty("--px", ((cx / rect.width) - 0.5).toFixed(4));
      hero.style.setProperty("--py", ((cy / rect.height) - 0.5).toFixed(4));
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(tick); else raf = 0;
    };
    measure();
    cx = tx = rect.width * 0.72; cy = ty = rect.height * 0.3;
    hero.addEventListener("pointerenter", function () { measure(); active = true; });
    hero.addEventListener("pointerleave", function () { active = false; tx = rect.width * 0.72; ty = rect.height * 0.3; if (!raf) raf = requestAnimationFrame(tick); });
    hero.addEventListener("pointermove", function (e) {
      if (!active) { measure(); active = true; }
      tx = e.clientX - rect.left; ty = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
  }

  /* ---------- card spotlight + magnetic buttons (desktop only) ---------- */
  if (fine && !reduce) {
    $$(".card-lit").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });

    $$(".magnetic").forEach(function (btn) {
      var raf = 0, x = 0, y = 0;
      var apply = function () { btn.style.transform = "translate3d(" + x + "px," + y + "px,0)"; raf = 0; };
      btn.style.transition += ",transform .6s cubic-bezier(.2,.75,.15,1)";
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width - 0.5) * 12;
        y = ((e.clientY - r.top) / r.height - 0.5) * 10;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      btn.addEventListener("pointerleave", function () { x = 0; y = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }

  /* ---------- story: scroll-linked statement ---------- */
  var statement = $("#statement");
  if (statement && !reduce && hasIO) {
    var words = [];
    var hot = { systems: 1, "products": 1, experiments: 1 };
    statement.innerHTML = statement.textContent.split(/\s+/).map(function (w) {
      var key = w.replace(/[^a-z]/gi, "").toLowerCase();
      return '<span class="sw' + (hot[key] ? " hl" : "") + '">' + w + "</span>";
    }).join(" ");
    words = $$(".sw", statement);
    var sRaf = 0, sOn = false, lastN = -1;
    var sTick = function () {
      sRaf = 0;
      var r = statement.getBoundingClientRect(), vh = window.innerHeight;
      // 0 when the block's top hits 85% of viewport, 1 when its bottom reaches 45%
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      if (n === lastN) return;
      lastN = n;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
    };
    var onScroll = function () { if (!sRaf) sRaf = requestAnimationFrame(sTick); };
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !sOn) { window.addEventListener("scroll", onScroll, { passive: true }); sOn = true; onScroll(); }
      else if (!vis && sOn) { window.removeEventListener("scroll", onScroll); sOn = false; sTick(); }
    }, { rootMargin: "20% 0px 20% 0px" }).observe(statement);
  }

  /* ---------- story: chapters + rail ---------- */
  var chapters = $$(".chapter"), railItems = $$(".rail li");
  if (hasIO && chapters.length) {
    var chapterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var step = +e.target.getAttribute("data-step");
        chapters.forEach(function (c, i) { c.classList.toggle("is-on", i <= step); });
        railItems.forEach(function (li, i) { li.classList.toggle("is-on", i <= step); });
      });
    }, { rootMargin: "-35% 0px -45% 0px" });
    chapters.forEach(function (c) { chapterIO.observe(c); });
  } else {
    chapters.forEach(function (c) { c.classList.add("is-on"); });
  }

  /* ---------- Abacus Buddy: beads work through real sums ---------- */
  var abacus = $("#abacus");
  if (abacus && hasIO && !reduce) {
    var abv = abacus.parentNode;
    var rods = $$(".ab-rod", abacus).map(function (rod) {
      return { place: +rod.getAttribute("data-place"), h: $(".h", rod), e: $$(".e", rod) };
    });
    var elA = $(".ab-a", abv), elB = $(".ab-b", abv), elR = $(".ab-r", abv), dots = $$(".ab-steps li", abv);
    var sums = [[12, 7], [25, 42], [36, 17], [48, 35], [9, 6]];
    var k = 1, stepN = 3, abTimer = 0, abOn = false;

    var show = function (n) {
      rods.forEach(function (r) {
        var d = Math.floor(n / Math.pow(10, r.place)) % 10;
        r.h.classList.toggle("on", d >= 5);
        r.e.forEach(function (b, i) { b.classList.toggle("on", i < d % 5); });
      });
    };
    var run = function () {
      if (!abOn) return;
      var a = sums[k][0], b = sums[k][1];
      elA.textContent = a; elB.textContent = b; elR.textContent = "?";
      show(a);
      abTimer = setTimeout(function () {
        if (!abOn) return;
        show(a + b); elR.textContent = a + b;
        stepN = stepN % dots.length + 1;
        dots.forEach(function (d, i) { d.classList.toggle("on", i < stepN); });
        k = (k + 1) % sums.length;
        abTimer = setTimeout(run, 2600);
      }, 1500);
    };
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !abOn) { abOn = true; abTimer = setTimeout(run, 1200); }
      else if (!vis && abOn) { abOn = false; clearTimeout(abTimer); }
    }, { threshold: 0.35 }).observe(abv);
  }

  /* ---------- counting numbers ---------- */
  var counters = $$("[data-count]");
  if (hasIO && !reduce) {
    counters.forEach(function (el) { el.textContent = "00"; });
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cIO.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), t0 = performance.now(), dur = 900 + to * 90;
        var step = function (t) {
          var k = Math.min(1, (t - t0) / dur);
          k = 1 - Math.pow(1 - k, 3);
          el.textContent = String(Math.round(to * k)).padStart(2, "0");
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cIO.observe(el); });
  }

  /* ---------- contact: arc rises on arrival ---------- */
  var contact = $("#contact");
  if (contact) {
    if (!hasIO || reduce) contact.classList.add("is-in");
    else {
      var ctIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { contact.classList.add("is-in"); ctIO.disconnect(); }
      }, { threshold: 0.25 });
      ctIO.observe(contact);
    }
  }

  /* ---------- copy email ---------- */
  var copy = $("#copyMail");
  if (copy) {
    var state = $(".copy-state", copy), timer = 0;
    copy.addEventListener("click", function () {
      var mail = copy.getAttribute("data-mail");
      var done = function (ok) {
        copy.classList.toggle("is-copied", ok);
        state.textContent = ok ? "Copied" : "Press ⌘C";
        clearTimeout(timer);
        timer = setTimeout(function () { copy.classList.remove("is-copied"); state.textContent = "Copy"; }, 2200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(mail).then(function () { done(true); }, function () { done(false); });
      } else {
        var sel = window.getSelection(), range = doc.createRange();
        range.selectNodeContents($(".copy-mail", copy)); sel.removeAllRanges(); sel.addRange(range);
        var ok = false; try { ok = doc.execCommand("copy"); } catch (err) {}
        done(ok);
      }
    });
  }
})();
