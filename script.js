/* shanmugaraj.dev — lightweight interactions */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, scope) { return (scope || document).querySelector(s); };
  var $$ = function (s, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(s)); };

  var toggle = $("#navToggle"), nav = $("#nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
    $$("a", nav).forEach(function (link) { link.addEventListener("click", function () { setNav(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
  }

  var topbar = $("#topbar");
  if (topbar) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        topbar.classList.toggle("is-scrolled", window.scrollY > 24);
        ticking = false;
      });
    }, { passive: true });
  }

  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  var viewAll = $("#viewAll"), grid = $("#systemsGrid");
  if (viewAll && grid) {
    var extras = $$(".extra", grid);
    viewAll.addEventListener("click", function () {
      var expand = viewAll.getAttribute("aria-expanded") !== "true";
      viewAll.setAttribute("aria-expanded", String(expand));
      viewAll.innerHTML = expand ? "Show Less <span>↑</span>" : "View All <span>→</span>";
      extras.forEach(function (card) {
        card.hidden = !expand;
        card.style.display = expand ? "block" : "none";
        if (expand) window.requestAnimationFrame(function () { card.classList.add("is-visible"); });
      });
    });
  }
})();
