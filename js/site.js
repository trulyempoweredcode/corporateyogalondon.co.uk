/* Corporate Yoga London - behaviour. Plain JS, no framework.
   Header scroll state, mobile menu, scroll reveals, counters, reviews widget, enquiry form. */
(function () {
  var doc = document, body = doc.body;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header: frosted bar once the page has scrolled */
  var hdr = doc.querySelector(".hdr");
  var menuOpen = false;
  function onScroll() {
    if (hdr) hdr.classList.toggle("is-scrolled", window.scrollY > 12 && !menuOpen);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* mobile menu */
  var btn = hdr && hdr.querySelector("button[aria-expanded]");
  var mnav = doc.getElementById("mnav");
  var lines = btn ? btn.querySelectorAll("span > span") : [];
  var call = hdr && hdr.querySelector('a[aria-label="Call us"]');
  var foot = mnav && mnav.querySelector(".mnav-foot");
  function setMenu(open) {
    menuOpen = open;
    body.style.overflow = open ? "hidden" : "";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    var a = lines[0], b = lines[1];
    if (a) { a.classList.toggle("top-1/2", open); a.classList.toggle("-translate-y-1/2", open); a.classList.toggle("rotate-45", open); a.classList.toggle("bg-bone", open); a.classList.toggle("bg-ink", !open); }
    if (b) { b.classList.toggle("bottom-1/2", open); b.classList.toggle("translate-y-1/2", open); b.classList.toggle("-rotate-45", open); b.classList.toggle("bg-bone", open); b.classList.toggle("bg-ink", !open); }
    mnav.classList.toggle("is-open", open);
    mnav.classList.toggle("opacity-100", open);
    mnav.classList.toggle("pointer-events-none", !open);
    mnav.classList.toggle("opacity-0", !open);
    if (call) { call.classList.toggle("bg-bone/10", open); call.classList.toggle("text-bone", open); call.classList.toggle("bg-orange", !open); call.classList.toggle("text-paper", !open); }
    if (foot) { foot.classList.toggle("opacity-100", open); foot.classList.toggle("delay-700", open); foot.classList.toggle("opacity-0", !open); }
    mnav.querySelectorAll("a").forEach(function (l, i) { l.style.transitionDelay = open ? 120 + 55 * i + "ms" : "0ms"; });
    document.documentElement.classList.toggle("menu-open", open);
    onScroll();
  }
  if (btn && mnav) {
    btn.addEventListener("click", function () { setMenu(!menuOpen); });
    mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });
  }

  /* scroll reveals: a .rv block gets .is-in when 15% of it is visible */
  var rvs = [].slice.call(doc.querySelectorAll(".rv"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* counters: count up from 0 once 40% visible, ease-out expo over 1.7s */
  var counters = [].slice.call(doc.querySelectorAll("[data-count]"));
  function fmt(el, v) {
    var d = +(el.getAttribute("data-decimals") || 0);
    el.textContent = (el.getAttribute("data-prefix") || "") + v.toFixed(d) + (el.getAttribute("data-suffix") || "");
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = parseFloat(el.getAttribute("data-count"));
        co.unobserve(el);
        if (reduce) { fmt(el, to); return; }
        var t0 = performance.now(), dur = +(el.getAttribute("data-duration") || 1700);
        (function step(now) {
          var p = Math.min((now - t0) / dur, 1);
          fmt(el, to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { fmt(el, parseFloat(el.getAttribute("data-count"))); });
  }

  /* reviews widget (Trustindex): injected once, where the page has a placeholder */
  var ti = doc.getElementById("reviews-widget");
  if (ti && !window.__tiWidgetInjected) {
    window.__tiWidgetInjected = true;
    var s = doc.createElement("script");
    s.src = "https://cdn.trustindex.io/loader.js?75b6bed812219677da166970ef0";
    s.defer = true; s.async = true;
    ti.appendChild(s);
  }

  /* enquiry form: posts JSON to the endpoint named on the form (data-endpoint) */
  var form = doc.querySelector("form[data-endpoint]");
  if (form) {
    var errBox = null, submit = form.querySelector('button[type="submit"]'), label = submit && submit.firstChild;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submit.disabled) return;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.newsletter = data.newsletter === "on";
      submit.disabled = true; var orig = label.textContent; label.textContent = "Sending…";
      if (errBox) errBox.remove();
      fetch(form.getAttribute("data-endpoint"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r : r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || "Something went wrong — please email info@creativewellness.co.uk or call +44 7815 837679."); }); })
        .then(function () {
          var ok = doc.getElementById("enquiry-sent");
          form.hidden = true; if (ok) ok.hidden = false; form.reset();
        })
        .catch(function (err) {
          errBox = doc.createElement("p");
          errBox.className = "mt-5 border-l-2 border-orange bg-paper px-4 py-3 text-[0.9rem] leading-relaxed text-ink";
          errBox.textContent = err.message;
          submit.parentNode.insertBefore(errBox, submit);
        })
        .then(function () { submit.disabled = false; label.textContent = orig; });
    });
  }
})();
