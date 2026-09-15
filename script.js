/* =========================================================
   shanmugaraj.dev — interactions
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

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
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setNav(false);
    });
  }

  /* ---------- header state ---------- */
  var topbar = $("#topbar");
  if (topbar) {
    var syncTopbar = function () {
      topbar.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    syncTopbar();
    window.addEventListener("scroll", syncTopbar, { passive: true });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$(".reveal");
  var canObserve = "IntersectionObserver" in window && !reduceMotion;
  var observer = null;

  if (canObserve) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- "View All" expands the remaining systems ---------- */
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
        if (!expand) {
          card.classList.remove("is-visible");
          return;
        }
        if (!canObserve) { card.classList.add("is-visible"); return; }
        window.setTimeout(function () {
          if (!card.classList.contains("is-visible")) card.classList.add("is-visible");
        }, 40);
      });
    });
  }

  /* ---------- subtle hero parallax ---------- */
  var hero = $(".hero");
  var stage = $(".stage");
  var pointerFine = window.matchMedia("(hover: hover) and (min-width: 901px)").matches;

  if (hero && stage && pointerFine && !reduceMotion) {
    var frame = 0;
    var x = 0;
    var y = 0;

    var apply = function () {
      frame = 0;
      stage.style.setProperty("--par-x", (x * 15).toFixed(2) + "px");
      stage.style.setProperty("--par-y", (y * 11).toFixed(2) + "px");
    };

    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      x = (event.clientX - rect.left) / rect.width - 0.5;
      y = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) frame = window.requestAnimationFrame(apply);
    });

    hero.addEventListener("pointerleave", function () {
      x = 0;
      y = 0;
      apply();
    });
  }
})();
