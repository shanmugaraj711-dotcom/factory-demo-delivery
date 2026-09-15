/* shanmugaraj.dev — lightweight interactions */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobile = window.matchMedia("(max-width: 820px)").matches;
  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  /* Keep expensive cinematic effects off touch devices. The visual design remains intact. */
  if (mobile || reduceMotion) root.classList.add("perf-lite");

  var perfStyle = document.createElement("style");
  perfStyle.textContent = [
    ".perf-lite .backdrop__stars{animation:none!important}",
    ".perf-lite .backdrop__nebula,.perf-lite .scene__beam,.perf-lite .backdrop__fog{filter:none!important}",
    ".perf-lite .topbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}",
    ".perf-lite .figure,.perf-lite .figure::before,.perf-lite .figure::after{filter:none!important}",
    ".perf-lite body::after{display:none!important}",
    "@media (max-width:820px){.perf-lite .reveal{opacity:1!important;transform:none!important;transition:none!important}}"
  ].join("\n");
  document.head.appendChild(perfStyle);

  /* ---------- mobile navigation ---------- */
  var toggle = $("#navToggle");
  var nav = $("#nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });
  }

  /* ---------- header state: one passive scroll listener, no layout reads ---------- */
  var topbar = $("#topbar");
  if (topbar) {
    var scrollTick = 0;
    var syncTopbar = function () {
      scrollTick = 0;
      topbar.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    syncTopbar();
    window.addEventListener("scroll", function () {
      if (!scrollTick) scrollTick = window.requestAnimationFrame(syncTopbar);
    }, { passive: true });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if (reveals.length) {
    if (reduceMotion || mobile || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---------- View All ---------- */
  var viewAll = $("#viewAll");
  var grid = $("#systemsGrid");
  if (viewAll && grid) {
    var extras = $$(".pcard--extra", grid);
    viewAll.addEventListener("click", function () {
      var expand = viewAll.getAttribute("aria-expanded") !== "true";
      viewAll.setAttribute("aria-expanded", String(expand));
      viewAll.textContent = expand ? "Show Less" : "View All";
      extras.forEach(function (card) {
        card.hidden = !expand;
        if (expand) card.classList.add("is-visible");
        else card.classList.remove("is-visible");
      });
    });
  }

  /* ---------- desktop-only parallax ---------- */
  var hero = $(".hero");
  var stage = $(".stage");
  if (hero && stage && finePointer && !reduceMotion && !mobile) {
    var raf = 0;
    var x = 0;
    var y = 0;
    var apply = function () {
      raf = 0;
      stage.style.setProperty("--par-x", (x * 15).toFixed(2) + "px");
      stage.style.setProperty("--par-y", (y * 11).toFixed(2) + "px");
    };
    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      x = (event.clientX - rect.left) / rect.width - 0.5;
      y = (event.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = window.requestAnimationFrame(apply);
    }, { passive: true });
    hero.addEventListener("pointerleave", function () {
      x = 0;
      y = 0;
      if (!raf) raf = window.requestAnimationFrame(apply);
    });
  }
})();
