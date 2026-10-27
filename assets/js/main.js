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
        return n.getClientRects().length && !n.closest(".lb");
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

  /*
    The landing page: one work fills the screen. Wide screens use the "wide"
    picks in data.js and phones the "tall" ones, so the edges trimmed are small.
  */
  function initHome() {
    var root = $(".landing");
    if (!root) return;
    var stage = $(".landing__slides", root);
    var label = $(".landing__label", root);
    var titleEl = $(".landing__title", root);
    var yearEl = $(".landing__year", root);
    var nextBtn = $(".landing__next", root);
    var peek = $(".landing__peek", root);
    var peekImg = $("img", peek);
    var tall = window.matchMedia("(orientation: portrait)");
    var slides = [];
    var active = 0;
    var timer = null;
    var labelTimer = null;

    function picks() {
      var cfg = window.HERO || {};
      var list = (tall.matches ? cfg.tall : cfg.wide) || cfg.wide || cfg.tall || [];
      var out = list.map(function (p) {
        var work = bySlug.get(p.slug);
        var im = work && IMAGES[work.images[0]];
        return im ? { work: work, im: im, focus: p.focus || "50% 50%" } : null;
      }).filter(Boolean);
      if (!out.length && WORKS[0]) out.push({ work: WORKS[0], im: IMAGES[WORKS[0].images[0]], focus: "50% 50%" });
      return out;
    }

    // How wide the image is drawn once it covers the screen, so the right file size is fetched.
    function coverWidth(im) {
      return Math.ceil(Math.max(window.innerWidth, window.innerHeight * im.w / im.h)) + "px";
    }

    function load(s) {
      if (!s || s.img.getAttribute("srcset")) return;
      s.img.sizes = coverWidth(s.im);
      s.img.srcset = s.im.srcset.map(function (x) { return x[0] + " " + x[1] + "w"; }).join(", ");
      s.img.src = s.im.srcset[Math.min(1, s.im.srcset.length - 1)][0];
    }

    function warmNext() {
      var next = slides[(active + 1) % slides.length];
      var cur = slides[active];
      if (cur.el.classList.contains("is-loaded")) load(next);
      else cur.img.addEventListener("load", function () { load(next); }, { once: true });
    }

    function setLabel(work, instant) {
      function apply() {
        titleEl.textContent = work.title;
        yearEl.textContent = work.year;
        label.href = "works.html#" + work.slug;
        label.setAttribute("aria-label", "View " + work.title + ", " + work.year);
        label.classList.remove("is-changing");
      }
      clearTimeout(labelTimer);
      if (instant || reduceMotion) { apply(); return; }
      label.classList.add("is-changing");
      labelTimer = setTimeout(apply, 450);
    }

    function setPeek(s) {
      if (peek.hidden || !s) return;
      peekImg.classList.remove("is-loaded");
      peekImg.onload = function () { peekImg.classList.add("is-loaded"); };
      peekImg.style.objectPosition = s.focus;
      peekImg.src = s.im.srcset[0][0];
      peek.setAttribute("aria-label", "Next work: " + s.work.title);
    }

    function show(n, instant) {
      if (!slides.length) return;
      active = (n + slides.length) % slides.length;
      var cur = slides[active];
      load(cur);
      slides.forEach(function (s) {
        var on = s === cur;
        s.el.classList.toggle("is-active", on);
        s.img.alt = on ? s.work.title + ", " + s.work.year : "";
        if (on) s.el.removeAttribute("aria-hidden");
        else s.el.setAttribute("aria-hidden", "true");
      });
      setLabel(cur.work, instant);
      if (slides.length > 1) {
        setPeek(slides[(active + 1) % slides.length]);
        warmNext();
      }
    }

    function stop() { clearInterval(timer); timer = null; }
    function start() {
      stop();
      if (reduceMotion || slides.length < 2 || document.hidden) return;
      timer = setInterval(function () { show(active + 1); }, 7000);
    }
    function step(d) { show(active + d); start(); }

    function build() {
      stop();
      stage.replaceChildren();
      slides = picks().map(function (p, i) {
        var img = h("img", { alt: "", decoding: "async", draggable: "false", fetchpriority: i === 0 ? "high" : null });
        var el = h("figure", {
          class: "landing__slide",
          style: { "--tone": p.im.color, "--lqip": 'url("' + p.im.lqip + '")', "--focus": p.focus },
        }, [img]);
        img.addEventListener("load", function () { el.classList.add("is-loaded"); });
        stage.append(el);
        return { el: el, img: img, im: p.im, work: p.work, focus: p.focus };
      });
      nextBtn.hidden = slides.length < 2;
      peek.hidden = slides.length < 2;
      show(0, true);
      start();
    }

    nextBtn.addEventListener("click", function () { step(1); });
    peek.addEventListener("click", function () { step(1); });
    document.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || slides.length < 2) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });

    // Swipe left / right on touch screens.
    var sx = 0, sy = 0, tracking = false;
    root.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    root.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (slides.length > 1 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
    });
    root.addEventListener("pointercancel", function () { tracking = false; });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        slides.forEach(function (s) { if (s.img.getAttribute("srcset")) s.img.sizes = coverWidth(s.im); });
      }, 200);
    });
    if (tall.addEventListener) tall.addEventListener("change", build);

    build();
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
