/* Treasure Fatile, portfolio: page behaviour. Content lives in data.js. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var WORKS = window.WORKS || [];
  var IMAGES = window.IMAGES || {};
  var CATS = window.CATEGORIES || {};
  var bySlug = new Map(WORKS.map(function (w) { return [w.slug, w]; }));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
  var EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

  /* ---------------------------------------------------------------- helpers */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "style") Object.keys(v).forEach(function (p) { node.style.setProperty(p, v[p]); });
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) { if (c) node.append(c); });
    return node;
  }

  var ICONS = {
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 12H4M10 6l-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  };

  function ratioOfKeys(keys) {
    return keys.reduce(function (sum, k) {
      var im = IMAGES[k];
      return sum + (im ? im.w / im.h : 1);
    }, 0);
  }

  function ratioOf(work) { return ratioOfKeys(work.images); }

  function metaLine(work) { return work.year + " · " + work.medium; }

  /* Builds "(min-width: 900px) 40vw, 92vw" from [[900, 40], [0, 92]], scaled for diptych panels. */
  function sizesFrom(spec, share) {
    return spec.map(function (s) {
      var v = Math.max(1, Math.round(s[1] * share)) + "vw";
      return s[0] ? "(min-width: " + s[0] + "px) " + v : v;
    }).join(", ");
  }

  /* --------------------------------------------------------- artwork image */

  function markLoaded(img) {
    var panel = img.closest(".art__panel");
    if (panel) panel.classList.add("is-loaded");
  }

  function makeArt(keys, opts) {
    opts = opts || {};
    var total = ratioOfKeys(keys);
    var art = h("div", { class: "art" });
    keys.forEach(function (key, i) {
      var im = IMAGES[key];
      if (!im) return;
      var r = im.w / im.h;
      var share = r / total;
      var panel = h("div", {
        class: "art__panel",
        style: {
          "--grow": (share * 100).toFixed(3), // panels share the width so their heights match
          "--ar": im.w + " / " + im.h,
          "--tone": im.color,
          "--lqip": 'url("' + im.lqip + '")',
        },
      });
      var sizes = typeof opts.sizes === "function" ? opts.sizes(share) : sizesFrom(opts.sizes || [[0, 100]], share);
      var mid = im.srcset[Math.min(1, im.srcset.length - 1)];
      var alt = opts.alt || "";
      if (keys.length > 1 && alt) alt += i === 0 ? " (left panel)" : " (right panel)";
      if (opts.lowSrc && opts.lowSrc[i]) {
        panel.append(h("img", { class: "lb__low", src: opts.lowSrc[i], alt: "", "aria-hidden": "true" }));
      }
      var img = h("img", {
        src: mid[0],
        srcset: im.srcset.map(function (s) { return s[0] + " " + s[1] + "w"; }).join(", "),
        sizes: sizes,
        width: im.w,
        height: im.h,
        alt: alt,
        loading: opts.eager ? "eager" : "lazy",
        decoding: "async",
        draggable: "false",
        fetchpriority: opts.priority ? "high" : null,
      });
      img.addEventListener("load", function () { markLoaded(img); });
      img.addEventListener("error", function () { markLoaded(img); });
      panel.append(img);
      art.append(panel);
      if (img.complete && img.naturalWidth) markLoaded(img);
    });
    return art;
  }

  function artLink(work, opts) {
    var link = h("a", {
      class: "art-link",
      href: "#" + work.slug,
      "data-slug": work.slug,
      "aria-label": "View " + work.title + ", " + work.year,
      style: { "--ratio": ratioOf(work).toFixed(4) },
    });
    link.append(makeArt(work.images, Object.assign({ alt: work.title + ", " + work.year + ". " + work.medium + "." }, opts)));
    return link;
  }

  function caption(work) {
    return h("figcaption", { class: "caption" }, [
      h("p", { class: "caption__title", text: work.title }),
      h("p", { class: "caption__meta", text: metaLine(work) }),
    ]);
  }

  /* ------------------------------------------------------- reveal on scroll */

  var revealer = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            revealer.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 })
    : null;

  function observeReveals(root) {
    $$("[data-reveal]:not(.is-in)", root).forEach(function (n) {
      if (revealer && !reduceMotion) revealer.observe(n);
      else n.classList.add("is-in");
    });
  }

  /* ----------------------------------------------------------------- header */

  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var lastY = window.scrollY;
    var hidden = false;
    var ticking = false;

    function update() {
      ticking = false;
      if (doc.classList.contains("lb-open")) return;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);
      if (y < 140) hidden = false;
      else if (y > lastY + 6) hidden = true;
      else if (y < lastY - 6) hidden = false;
      header.classList.toggle("is-hidden", hidden);
      doc.classList.toggle("header-shown", !hidden);
      if (Math.abs(y - lastY) > 6 || y < 140) lastY = y;
    }

    doc.classList.add("header-shown");
    update();
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------------- lightbox */

  var Lightbox = (function () {
    var root, stage, box, titleEl, countEl, metaEl, closeBtn, prevBtn, nextBtn;
    var list = [];
    var index = -1;
    var isOpen = false;
    var pushed = false;
    var busy = false;
    var hiddenSource = null;
    var returnFocus = null;

    function build() {
      if (root) return;
      root = h("div", {
        class: "lb",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "lb-title",
      });
      root.inert = true;
      stage = h("div", { class: "lb__stage" });
      box = h("div", { class: "lb__art" });
      stage.append(box);
      countEl = h("p", { class: "eyebrow lb__count", "aria-live": "polite" });
      titleEl = h("h2", { class: "lb__title", id: "lb-title" });
      metaEl = h("dl", { class: "lb__meta" });
      prevBtn = h("button", { class: "lb__btn", type: "button", "aria-label": "Previous work", html: ICONS.left });
      nextBtn = h("button", { class: "lb__btn", type: "button", "aria-label": "Next work", html: ICONS.right });
      closeBtn = h("button", { class: "lb__close lb__fade", type: "button", html: "Close " + ICONS.close });
      var info = h("div", { class: "lb__info lb__fade" }, [
        countEl, titleEl, metaEl, h("div", { class: "lb__nav" }, [prevBtn, nextBtn]),
      ]);
      root.append(h("div", { class: "lb__backdrop" }), stage, info, closeBtn);
      document.body.append(root);

      closeBtn.addEventListener("click", function () { close(); });
      prevBtn.addEventListener("click", function () { go(-1); });
      nextBtn.addEventListener("click", function () { go(1); });
      root.addEventListener("click", function (e) {
        if (e.target === stage || e.target === root || e.target.classList.contains("lb__backdrop")) close();
      });

      root.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); close(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        else if (e.key === "Tab") {
          var f = [closeBtn, prevBtn, nextBtn];
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });

      // Swipe left / right on touch screens.
      var sx = 0, sy = 0, tracking = false;
      stage.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse") return;
        tracking = true; sx = e.clientX; sy = e.clientY;
      });
      stage.addEventListener("pointerup", function (e) {
        if (!tracking) return;
        tracking = false;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
      });
      stage.addEventListener("pointercancel", function () { tracking = false; });

      window.addEventListener("resize", function () { if (isOpen) layout(); });
    }

    function current() { return bySlug.get(list[index]); }

    function fit(work) {
      var r = stage.getBoundingClientRect();
      var gap = work.images.length > 1 ? 14 : 0;
      var ratio = ratioOf(work);
      var hgt = Math.min(r.height, (r.width - gap) / ratio);
      return { w: hgt * ratio + gap, h: hgt };
    }

    function layout() {
      var b = fit(current());
      box.style.width = b.w + "px";
      box.style.height = b.h + "px";
    }

    function findSource(slug) {
      return $$('[data-slug="' + slug + '"]').filter(function (n) {
        return n.getClientRects().length && !n.closest(".hero__slide:not(.is-active)") && !n.closest(".lb");
      })[0] || null;
    }

    function inView(rect) {
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
    }

    function showSource(on) {
      if (hiddenSource) hiddenSource.style.opacity = "";
      hiddenSource = on || null;
      if (hiddenSource) hiddenSource.style.opacity = "0";
    }

    function populate(work, source) {
      var b = fit(work);
      box.style.width = b.w + "px";
      box.style.height = b.h + "px";
      var low = source ? $$(".art__panel img:not(.lb__low)", source).map(function (img) { return img.currentSrc || img.src; }) : null;
      box.replaceChildren(makeArt(work.images, {
        alt: work.title + ", " + work.year + ". " + work.medium + ".",
        eager: true,
        lowSrc: low,
        sizes: function (share) {
          return Math.round((b.w - (work.images.length > 1 ? 14 : 0)) * share) + "px";
        },
      }));

      countEl.textContent = String(index + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
      titleEl.textContent = work.title;
      metaEl.replaceChildren();
      var rows = [["Year", work.year], ["Medium", work.medium]];
      if (work.dimensions) rows.push(["Size", work.dimensions]);
      if (CATS[work.category]) rows.push(["Category", CATS[work.category].label]);
      rows.forEach(function (r) {
        metaEl.append(h("dt", { text: r[0] }), h("dd", { text: String(r[1]) }));
      });
      var single = list.length < 2;
      prevBtn.hidden = single;
      nextBtn.hidden = single;
    }

    function setList(slugs) { list = slugs.slice(); }

    function open(slug, source, opts) {
      opts = opts || {};
      build();
      if (list.indexOf(slug) < 0) list = WORKS.map(function (w) { return w.slug; });
      index = list.indexOf(slug);
      if (index < 0) return;
      var work = current();
      var wasOpen = isOpen;
      if (!wasOpen) returnFocus = document.activeElement;

      isOpen = true;
      root.inert = false;
      root.classList.add("is-open");
      doc.classList.add("lb-open");
      populate(work, source);

      if (opts.push !== false) {
        history.pushState({ lightbox: true }, "", "#" + slug);
        pushed = true;
      }

      var frame = source && $(".art", source);
      var to = box.getBoundingClientRect();
      if (!wasOpen && frame && !reduceMotion && inView(frame.getBoundingClientRect())) {
        var s = frame.getBoundingClientRect();
        showSource(source);
        box.animate([
          { transform: "translate(" + (s.left - to.left) + "px," + (s.top - to.top) + "px) scale(" + s.width / to.width + "," + s.height / to.height + ")" },
          { transform: "none" },
        ], { duration: 820, easing: EASE_OUT });
      } else if (!reduceMotion) {
        box.animate([{ opacity: 0, transform: "translateY(16px) scale(0.985)" }, { opacity: 1, transform: "none" }], { duration: 700, easing: EASE_OUT });
      }
      closeBtn.focus({ preventScroll: true });
    }

    function finishClose() {
      root.inert = true;
      box.replaceChildren();
      showSource(null);
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }

    function close(fromHistory) {
      if (!isOpen) return;
      if (!fromHistory && pushed) {
        pushed = false;
        history.back(); // the popstate handler finishes closing
        return;
      }
      if (!fromHistory) history.replaceState(null, "", location.pathname + location.search);
      isOpen = false;
      pushed = false;
      var work = current();
      var target = findSource(work.slug);
      var frame = target && $(".art", target);
      var from = box.getBoundingClientRect();
      root.classList.remove("is-open");
      doc.classList.remove("lb-open");

      if (frame && !reduceMotion && inView(frame.getBoundingClientRect())) {
        var s = frame.getBoundingClientRect();
        showSource(target);
        var anim = box.animate([
          { transform: "none" },
          { transform: "translate(" + (s.left - from.left) + "px," + (s.top - from.top) + "px) scale(" + s.width / from.width + "," + s.height / from.height + ")" },
        ], { duration: 700, easing: EASE_OUT, fill: "forwards" });
        returnFocus = target;
        anim.finished.then(function () { anim.cancel(); finishClose(); });
      } else if (!reduceMotion) {
        var fade = box.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.97)" }], { duration: 450, easing: EASE, fill: "forwards" });
        fade.finished.then(function () { fade.cancel(); finishClose(); });
      } else {
        finishClose();
      }
    }

    function go(delta) {
      if (!isOpen || busy || list.length < 2) return;
      index = (index + delta + list.length) % list.length;
      var work = current();
      history.replaceState(history.state, "", "#" + work.slug);
      showSource(null);
      if (reduceMotion) { populate(work, findSource(work.slug)); return; }
      busy = true;
      var info = $(".lb__info", root);
      var out = box.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(" + -delta * 36 + "px)" }], { duration: 260, easing: "ease-in", fill: "forwards" });
      info.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" });
      out.finished.then(function () {
        populate(work, findSource(work.slug));
        box.getAnimations().forEach(function (a) { a.cancel(); });
        info.getAnimations().forEach(function (a) { a.cancel(); });
        box.animate([{ opacity: 0, transform: "translateX(" + delta * 36 + "px)" }, { opacity: 1, transform: "none" }], { duration: 640, easing: EASE_OUT });
        info.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 80, easing: EASE, fill: "backwards" });
        busy = false;
      });
    }

    function syncWithUrl() {
      var slug = decodeURIComponent(location.hash.slice(1));
      if (bySlug.has(slug)) {
        if (!isOpen) open(slug, findSource(slug), { push: false });
        else if (current().slug !== slug) {
          index = list.indexOf(slug);
          if (index < 0) { list = WORKS.map(function (w) { return w.slug; }); index = list.indexOf(slug); }
          populate(current(), findSource(slug));
        }
      } else if (isOpen) {
        pushed = false;
        close(true);
      }
    }

    function bind(container) {
      container.addEventListener("click", function (e) {
        var link = e.target.closest("a[data-slug]");
        if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(link.getAttribute("data-slug"), link);
      });
    }

    window.addEventListener("popstate", syncWithUrl);

    return { open: open, setList: setList, bind: bind, sync: syncWithUrl };
  })();

  /* ------------------------------------------------------------- home page */

  function initHome() {
    var frame = $(".hero__frame");
    var heroCaption = $(".hero__caption");
    var picks = (window.HERO || []).map(function (s) { return bySlug.get(s); }).filter(Boolean);
    if (!picks.length) picks = WORKS.slice(0, 3);
    var slides = [];
    var caps = [];

    picks.forEach(function (work, i) {
      var link = artLink(work, { sizes: [[961, 42], [0, 90]], eager: i < 2, priority: i === 0 });
      var slide = h("div", { class: "hero__slide" + (i === 0 ? " is-active" : "") }, [link]);
      if (i !== 0) { slide.setAttribute("aria-hidden", "true"); link.tabIndex = -1; }
      frame.append(slide);
      slides.push(slide);
      var cap = h("span", { class: i === 0 ? "is-active" : "", text: work.title + ", " + work.year });
      heroCaption.append(cap);
      caps.push(cap);
    });

    var active = 0;
    function show(n) {
      slides[active].classList.remove("is-active");
      slides[active].setAttribute("aria-hidden", "true");
      $(".art-link", slides[active]).tabIndex = -1;
      caps[active].classList.remove("is-active");
      active = n;
      slides[active].classList.add("is-active");
      slides[active].removeAttribute("aria-hidden");
      $(".art-link", slides[active]).removeAttribute("tabindex");
      caps[active].classList.add("is-active");
      // Warm up the one after so it is ready when it fades in.
      var next = slides[(active + 1) % slides.length];
      $$("img", next).forEach(function (img) { img.loading = "eager"; });
    }

    if (slides.length > 1 && !reduceMotion) {
      var timer = null;
      var start = function () { stop(); timer = setInterval(function () { show((active + 1) % slides.length); }, 6500); };
      var stop = function () { if (timer) clearInterval(timer); timer = null; };
      start();
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
      frame.addEventListener("mouseenter", stop);
      frame.addEventListener("mouseleave", start);
    }

    var years = WORKS.map(function (w) { return w.year; });
    $$("[data-range]").forEach(function (n) { n.textContent = Math.min.apply(null, years) + " to " + Math.max.apply(null, years); });

    renderFlow($(".flow"));
    Lightbox.setList(WORKS.map(function (w) { return w.slug; }));
    Lightbox.bind(document.body);
    initParallax();
  }

  /*
    Lays the works out like a quiet exhibition wall: pairs of a larger and a
    smaller piece that swap sides, with wide pieces given a row of their own.
  */
  function renderFlow(container) {
    if (!container) return;
    var offsets = ["16vh", "26vh", "10vh", "20vh"];
    var row = 0, pairs = 0, i = 0;
    var frag = document.createDocumentFragment();

    function place(work, col, opts) {
      var r = ratioOf(work);
      var span = parseInt(col.split("span ")[1], 10) || 12;
      var fig = h("figure", {
        class: "flow__item",
        "data-reveal": true,
        "data-speed": opts.speed || null,
        style: {
          "--col": col,
          "--row": String(row + 1),
          "--offset": opts.offset || "0px",
          "--ratio": r.toFixed(4),
          "--justify": opts.justify || "start",
        },
      }, [
        artLink(work, { sizes: [[721, Math.round(span / 12 * 100)], [0, r >= 1 ? 94 : 80]] }),
        caption(work),
      ]);
      frag.append(fig);
    }

    while (i < WORKS.length) {
      var a = WORKS[i];
      var b = WORKS[i + 1];
      var ra = ratioOf(a);
      var rb = b ? ratioOf(b) : 0;

      if (ra >= 1.45 || !b || rb >= 1.45) {
        // A wide piece, or one left over: give it the row to itself.
        place(a, ra >= 1 ? "3 / span 8" : "5 / span 4", { justify: "center" });
        i += 1;
      } else {
        var spanA = ra >= 1 ? 7 : 5;
        var spanB = rb >= 1 ? 6 : 4;
        if (ra >= 1 && rb >= 1) { spanA = 6; spanB = 5; }
        var flip = pairs % 2 === 1;
        var offset = offsets[pairs % offsets.length];
        if (!flip) {
          place(a, "1 / span " + spanA, { justify: "start" });
          place(b, (13 - spanB) + " / span " + spanB, { offset: offset, speed: "0.07", justify: "end" });
        } else {
          place(a, (13 - spanA) + " / span " + spanA, { justify: "end" });
          place(b, "1 / span " + spanB, { offset: offset, speed: "0.07", justify: "start" });
        }
        pairs += 1;
        i += 2;
      }
      row += 1;
    }
    container.append(frag);
  }

  function initParallax() {
    var wide = window.matchMedia("(min-width: 721px)");
    // Uses the separate `translate` property so it never fights the reveal transform.
    var items = $$("[data-speed]").map(function (fig) {
      return { el: fig, speed: parseFloat(fig.getAttribute("data-speed")) || 0, y: 0 };
    });
    if (reduceMotion || !items.length) return;
    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        if (!wide.matches) { it.el.style.translate = ""; it.y = 0; return; }
        var r = it.el.getBoundingClientRect();
        var top = r.top - it.y;
        if (r.bottom < -300 || top > vh + 300) return;
        it.y = (top + r.height / 2 - vh / 2) * -it.speed;
        it.el.style.translate = "0 " + it.y.toFixed(1) + "px";
      });
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  /* ------------------------------------------------------------ works page */

  function initWorks() {
    var gallery = $(".gallery");
    var catChips = $("[data-chips=category]");
    var yearChips = $("[data-chips=year]");
    var summary = $("[data-summary]");
    var filters = $(".filters");
    var years = Array.from(new Set(WORKS.map(function (w) { return w.year; }))).sort(function (a, b) { return b - a; });

    var params = new URLSearchParams(location.search);
    var state = {
      category: CATS[params.get("category")] ? params.get("category") : "all",
      year: years.indexOf(Number(params.get("year"))) >= 0 ? Number(params.get("year")) : "all",
    };

    if (filters && "ResizeObserver" in window) {
      new ResizeObserver(function () {
        doc.style.setProperty("--filters-h", filters.offsetHeight + "px");
      }).observe(filters);
    }

    function matches(w, s) {
      return (s.category === "all" || w.category === s.category) && (s.year === "all" || w.year === s.year);
    }

    function count(s) { return WORKS.filter(function (w) { return matches(w, s); }).length; }

    function chip(label, n, pressed, onClick, disabled, hint) {
      var b = h("button", { class: "chip", type: "button", "aria-pressed": String(pressed), title: hint || null }, [
        document.createTextNode(label),
        h("sup", { text: String(n) }),
      ]);
      b.disabled = disabled && !pressed;
      b.addEventListener("click", onClick);
      return b;
    }

    function drawChips() {
      catChips.replaceChildren();
      [["all", "All"]].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k].label, CATS[k].blurb]; })).forEach(function (c) {
        var n = count({ category: c[0], year: state.year });
        catChips.append(chip(c[1], n, state.category === c[0], function () { setState({ category: c[0] }); }, n === 0, c[2]));
      });
      yearChips.replaceChildren();
      ["all"].concat(years).forEach(function (y) {
        var n = count({ category: state.category, year: y });
        yearChips.append(chip(y === "all" ? "All years" : String(y), n, state.year === y, function () { setState({ year: y }); }, n === 0));
      });
    }

    function columnCount() {
      var w = window.innerWidth;
      return w >= 1100 ? 3 : w >= 560 ? 2 : 1;
    }

    var cols = columnCount();
    var visible = [];

    function draw() {
      gallery.replaceChildren();
      visible = [];
      var total = 0;
      years.forEach(function (y) {
        if (state.year !== "all" && state.year !== y) return;
        var items = WORKS.filter(function (w) { return w.year === y && matches(w, state); });
        if (!items.length) return;
        total += items.length;

        var columns = [];
        var heights = [];
        for (var c = 0; c < cols; c++) { columns.push(h("div", { class: "masonry__col" })); heights.push(0); }
        items.forEach(function (w, i) {
          var c = heights.indexOf(Math.min.apply(null, heights));
          heights[c] += 1 / ratioOf(w) + 0.22;
          columns[c].append(h("figure", { class: "card", "data-reveal": true, style: { "--d": (i % cols) * 0.08 + "s" } }, [
            artLink(w, { sizes: [[1100, 24], [560, 45], [0, 92]] }),
            caption(w),
          ]));
          visible.push(w.slug);
        });

        gallery.append(h("section", { class: "year", "aria-label": String(y) }, [
          h("div", { class: "year__label", "data-reveal": true }, [
            h("h2", { class: "year__num", text: String(y) }),
            h("p", { class: "eyebrow year__count", text: items.length + (items.length === 1 ? " work" : " works") }),
          ]),
          h("div", { class: "masonry" }, columns),
        ]));
      });

      if (!total) {
        var reset = h("button", { class: "btn-line", type: "button", text: "Show all works" });
        reset.addEventListener("click", function () { setState({ category: "all", year: "all" }); });
        gallery.append(h("div", { class: "empty" }, [h("p", { text: "Nothing here yet." }), reset]));
      }

      var label = state.category === "all" ? "" : CATS[state.category].label.toLowerCase() + " ";
      var span = state.year === "all" ? years[years.length - 1] + " to " + years[0] : "from " + state.year;
      summary.textContent = total + " " + label + (total === 1 ? "work" : "works") + ", " + span;

      Lightbox.setList(visible);
      observeReveals(gallery);
    }

    function writeUrl() {
      var p = new URLSearchParams();
      if (state.category !== "all") p.set("category", state.category);
      if (state.year !== "all") p.set("year", state.year);
      var qs = p.toString();
      history.replaceState(history.state, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }

    var switching = null;
    function setState(patch) {
      Object.assign(state, patch);
      drawChips();
      writeUrl();
      clearTimeout(switching);
      if (reduceMotion) { draw(); return; }
      gallery.classList.add("is-switching");
      switching = setTimeout(function () {
        draw();
        var top = gallery.getBoundingClientRect().top + window.scrollY - (filters ? filters.offsetHeight : 0) - 20;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: "auto" });
        requestAnimationFrame(function () { gallery.classList.remove("is-switching"); });
      }, 320);
    }

    drawChips();
    draw();
    Lightbox.bind(gallery);

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var next = columnCount();
        if (next !== cols) { cols = next; draw(); $$("[data-reveal]", gallery).forEach(function (n) { n.classList.add("is-in"); }); }
      }, 150);
    });
  }

  /* ---------------------------------------------------------- shared bits */

  function initArtSlots() {
    $$("[data-art]").forEach(function (slot) {
      var key = slot.getAttribute("data-art");
      if (!IMAGES[key]) return;
      slot.replaceChildren(makeArt([key], {
        alt: slot.getAttribute("data-alt") || "",
        sizes: [[961, 38], [0, 92]],
        eager: true,
      }));
    });
  }

  function initFooter() {
    $$("[data-current-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  }

  function init() {
    var page = document.body.getAttribute("data-page");
    initHeader();
    initArtSlots();
    if (page === "home") initHome();
    if (page === "works") initWorks();
    initFooter();
    observeReveals(document);
    if (location.hash.length > 1) Lightbox.sync();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
