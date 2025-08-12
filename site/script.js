(() => {
  "use strict";

  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const raf = (fn) => requestAnimationFrame(fn);

  const Utils = {
    px(n) {
      return `${n}px`;
    },
    throttle(fn, wait = 200) {
      let last = 0;
      return (...args) => {
        const now = Date.now();
        if (now - last >= wait) {
          last = now;
          fn(...args);
        }
      };
    },
    getHeaderHeight() {
      const header = $("header");
      return header ? header.offsetHeight : 0;
    },
    lockScroll(lock) {
      document.body.classList.toggle("no-scroll", !!lock);
    },
  };

  const Layout = (() => {
    function adjustBodyOffset() {
      const headerH = Utils.getHeaderHeight() || 70;
      document.documentElement.style.setProperty("--header-h", Utils.px(headerH));
      document.body.style.paddingTop = Utils.px(headerH);
    }
    function init() {
      adjustBodyOffset();
      on(window, "load", adjustBodyOffset);
      on(window, "resize", Utils.throttle(adjustBodyOffset, 150));
    }
    return { init, adjustBodyOffset };
  })();

  const Nav = (() => {
    let initialized = false;

    function syncUI(nav, btn, backdrop) {
      const isOpen = nav.classList.contains("active");
      backdrop.classList.toggle("active", isOpen);
      Utils.lockScroll(isOpen);
      btn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      btn.setAttribute("aria-expanded", String(isOpen));
    }

    function ensureBackdrop() {
      let backdrop = $(".nav-backdrop");
      if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "nav-backdrop";
        document.body.appendChild(backdrop);
      }
      return backdrop;
    }

    function init() {
      if (initialized) return;
      const btn = $("#hamburger");
      const nav = $("#nav-menu");
      if (!btn || !nav) return;

      const backdrop = ensureBackdrop();

      on(btn, "click", () => {
        nav.classList.toggle("active");
      });

      $$("#nav-menu a").forEach((a) => {
        on(a, "click", () => {
          if (nav.classList.contains("active")) {
            nav.classList.remove("active");
          }
        });
      });

      on(backdrop, "click", () => nav.classList.remove("active"));

      on(window, "keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("active")) {
          nav.classList.remove("active");
        }
      });

      const closeOnDesktop = () => {
        if (window.innerWidth >= 992 && nav.classList.contains("active")) {
          nav.classList.remove("active");
        }
      };
      on(window, "resize", Utils.throttle(closeOnDesktop, 150));

      const mo = new MutationObserver(() => syncUI(nav, btn, backdrop));
      mo.observe(nav, { attributes: true, attributeFilter: ["class"] });
      syncUI(nav, btn, backdrop);

      initialized = true;
    }

    return { init };
  })();

  const SmoothScroll = (() => {
    function onAnchorClick(anchor, event) {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const targetEl = document.querySelector(href);
      if (!targetEl) return;
      event.preventDefault();
      const headerHeight = Utils.getHeaderHeight();
      const topPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: topPos, behavior: "smooth" });
    }
    function init() {
      $$('a[href^="#"]').forEach((anchor) => {
        on(anchor, "click", (e) => onAnchorClick(anchor, e), { passive: false });
      });
    }
    return { init };
  })();

  const Likes = (() => {
    function toggleLike(heart) {
      const likesEl = heart.closest(".post-content")?.querySelector(".post-likes");
      if (!likesEl) return;
      const raw = (likesEl.textContent || "").replace(/\D+/g, "");
      let count = parseInt(raw || "0", 10);
      heart.classList.toggle("fas");
      heart.classList.toggle("far");
      if (heart.classList.contains("fas")) {
        heart.style.color = "#e74c3c";
        likesEl.textContent = `${count + 1} curtidas`;
      } else {
        heart.style.color = "#555";
        likesEl.textContent = `${Math.max(count - 1, 0)} curtidas`;
      }
    }
    function init() {
      $$(".post-action.heart").forEach((heart) => {
        on(heart, "click", () => toggleLike(heart));
      });
    }
    return { init };
  })();

  const Locations = (() => {
    function computeStatus(card) {
      const now = new Date();
      const day = now.getDay();
      const hoursData = day === 0 ? card.dataset.sundayHours : card.dataset.weekdayHours;
      if (!hoursData) return;
      const [openStr, closeStr] = hoursData.split("-");
      if (!openStr || !closeStr) return;
      const [hOpen, mOpen] = openStr.split(":").map(Number);
      const [hClose, mClose] = closeStr.split(":").map(Number);
      const minutesNow = now.getHours() * 60 + now.getMinutes();
      const minutesOpen = (hOpen || 0) * 60 + (mOpen || 0);
      const minutesClose = (hClose || 0) * 60 + (mClose || 0);
      const statusEl = card.querySelector(".hours-status");
      if (!statusEl) return;
      const isOpen = minutesNow >= minutesOpen && minutesNow < minutesClose;
      statusEl.textContent = isOpen ? "Aberto" : "Fechado";
      statusEl.classList.toggle("open", isOpen);
      statusEl.classList.toggle("closed", !isOpen);
    }
    function init() {
      const cards = $$(".location-item");
      if (!cards.length) return;
      const updateAll = () => cards.forEach(computeStatus);
      updateAll();
      setInterval(updateAll, 60 * 1000);
    }
    return { init };
  })();

  const Carousel = (() => {
    function initBasic() {
      const track = $(".carousel-slides");
      const slides = $$(".slide");
      const dots = $$(".carousel-dot");
      const prevBtn = $(".carousel-btn--prev");
      const nextBtn = $(".carousel-btn--next");
      const total = slides.length;
      if (!track || !total || !dots.length) return;
      let current = 0;
      const goTo = (index) => {
        const i = (index + total) % total;
        track.style.transform = `translateX(-${i * 100}%)`;
        dots.forEach((d) => d.classList.remove("active"));
        dots[i].classList.add("active");
        current = i;
      };
      on(prevBtn, "click", () => goTo(current - 1));
      on(nextBtn, "click", () => goTo(current + 1));
      dots.forEach((dot) => on(dot, "click", () => goTo(Number(dot.dataset.slide) || 0)));
      setInterval(() => goTo(current + 1), 3500);
      goTo(0);
    }
    return { initBasic };
  })();

  const SnapFlex = (() => {
    function initSnapCarouselFlex(container) {
      if (!container) return;
      const items = Array.from(container.children);
      if (!items.length) return;
      let dotsWrap = container.nextElementSibling;
      if (!dotsWrap || !dotsWrap.classList.contains("snap-dots")) {
        dotsWrap = document.createElement("div");
        dotsWrap.className = "snap-dots";
        items.forEach((_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "snap-dot";
          b.setAttribute("aria-label", `Ir para item ${i + 1}`);
          b.addEventListener("click", () => scrollToIndex(i));
          dotsWrap.appendChild(b);
        });
        container.insertAdjacentElement("afterend", dotsWrap);
      }
      const dots = $$(".snap-dot", dotsWrap);
      function updateActive() {
        const rect = container.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        let active = 0;
        let best = Infinity;
        items.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const c = r.left + r.width / 2;
          const d = Math.abs(c - center);
          if (d < best) {
            best = d;
            active = i;
          }
        });
        items.forEach((el, i) => el.classList.toggle("is-active", i === active));
        dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
      }
      function scrollToIndex(i) {
        const el = items[i];
        if (!el) return;
        const target = el.offsetLeft + el.offsetWidth / 2 - container.clientWidth / 2;
        container.scrollTo({ left: target, behavior: "smooth" });
      }
      updateActive();
      on(container, "scroll", () => raf(updateActive), { passive: true });
      on(window, "resize", () => raf(updateActive));
      setTimeout(updateActive, 50);
    }
    function init() {
      if (window.innerWidth <= 768) {
        $$(".instagram-grid, .services-grid").forEach(initSnapCarouselFlex);
      }
    }
    return { init, initSnapCarouselFlex };
  })();

  const SnapMain = (() => {
    function initMainCarouselSnap(root) {
      const container = root || $(".carousel-container");
      if (!container) return;
      const track = $(".carousel-slides", container);
      const slides = Array.from(track?.children || []);
      if (!track || slides.length === 0) return;
      container.classList.add("carousel--snap");
      track.style.transform = "";
      const dots = $$(".carousel-dot", $(".carousel-dots", container));
      function setActiveByCenter() {
        const rect = container.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        let active = 0;
        let best = Infinity;
        slides.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const c = r.left + r.width / 2;
          const d = Math.abs(c - center);
          if (d < best) {
            best = d;
            active = i;
          }
        });
        slides.forEach((el, i) => el.classList.toggle("is-active", i === active));
        dots.forEach((d, i) => d.classList.toggle("active", i === active));
        return active;
      }
      function scrollToIndex(i) {
        const el = slides[i];
        if (!el) return;
        const target = el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
        track.scrollTo({ left: target, behavior: "smooth" });
      }
      dots.forEach((dot, i) => {
        on(dot, "click", (e) => {
          e.preventDefault();
          stopAuto();
          scrollToIndex(i);
          restartAutoSoon();
        });
      });
      let autoTimer = null;
      let resumeTimer = null;
      function nextSlide() {
        const current = setActiveByCenter();
        const next = (current + 1) % slides.length;
        scrollToIndex(next);
      }
      function startAuto() {
        if (autoTimer) return;
        autoTimer = setInterval(nextSlide, 3000);
      }
      function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      function restartAutoSoon(delay = 4000) {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAuto, delay);
      }
      ["touchstart", "pointerdown", "mousedown", "keydown"].forEach((evt) => {
        on(track, evt, stopAuto, { passive: true });
      });
      ["touchend", "pointerup", "mouseup"].forEach((evt) => {
        on(track, evt, () => restartAutoSoon(), { passive: true });
      });
      on(document, "visibilitychange", () => {
        if (document.hidden) stopAuto();
        else restartAutoSoon(1000);
      });
      on(track, "scroll", () => raf(setActiveByCenter), { passive: true });
      on(window, "resize", () => raf(setActiveByCenter));
      setTimeout(() => {
        setActiveByCenter();
        startAuto();
      }, 80);
    }
    function init() {
      if (window.innerWidth <= 768) {
        $$(".carousel-container").forEach(initMainCarouselSnap);
      }
    }
    return { init, initMainCarouselSnap };
  })();

  const Lucide = (() => {
    function run() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons({
          attrs: { stroke: "#475569", "stroke-width": 1.8, width: 36, height: 36 },
        });
      } else {
        setTimeout(run, 120);
      }
    }
    function init() {
      if (document.readyState === "complete") run();
      else on(window, "load", run);
    }
    return { init };
  })();

  const GMap = (() => {
    let map;
    const itemToMarker = new Map();
    let selectedPos = null;
    let suppressMapClickUntil = 0;

    function selectItem(items, item, marker) {
      items.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const pos = { lat: +item.dataset.lat, lng: +item.dataset.lng };
      selectedPos = pos;
      map.setCenter(pos);
      map.setZoom(16);
      itemToMarker.forEach((m) => m.setAnimation && m.setAnimation(null));
      if (marker && google.maps.Animation) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 900);
      }
    }

    function handleMapError() {
      const container = $("#map");
      if (!container || window.google?.maps) return;
      container.innerHTML = `
        <div style="
          height:100%;display:flex;align-items:center;justify-content:center;
          flex-direction:column;text-align:center;padding:20px;background:#f5f5f5;
          border-radius:12px;border:1px solid #eee;">
          <i class="fas fa-map-marker-alt" style="font-size:3rem;color:#ccc;margin-bottom:20px;"></i>
          <h3 style="color:#555;">Não foi possível carregar o mapa</h3>
          <p style="color:#777;">Verifique sua conexão ou as permissões da API.</p>
        </div>`;
    }

    function initMap() {
      const items = $$(".location-item");
      if (!items.length) return;
      const mapEl = $("#map");
      const first = items[0];
      const defaultPos = { lat: +first.dataset.lat, lng: +first.dataset.lng };
      map = new google.maps.Map(mapEl, {
        zoom: 15,
        center: defaultPos,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: "none",
        draggable: false,
        zoomControl: false,
        styles: [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        ],
      });
      items.forEach((item, idx) => {
        const position = { lat: +item.dataset.lat, lng: +item.dataset.lng };
        const name = item.dataset.name || item.querySelector(".unit-name")?.textContent?.trim() || `Unidade ${idx + 1}`;
        const marker = new google.maps.Marker({
          map,
          position,
          title: `Drogaria Figueiredo - ${name}`,
          animation: google.maps.Animation.DROP,
        });
        itemToMarker.set(item, marker);
        marker.addListener("click", () => {
          suppressMapClickUntil = Date.now() + 250;
          selectItem(items, item, marker);
        });
        on(item, "click", () => selectItem(items, item, marker));
      });
      selectItem(items, first, itemToMarker.get(first));
      map.addListener("click", () => {
        if (Date.now() < suppressMapClickUntil) return;
        if (selectedPos) {
          const url = `https://www.google.com/maps?q=${selectedPos.lat},${selectedPos.lng}`;
          window.open(url, "_blank", "noopener");
        }
      });
      setTimeout(() => {
        if (window.google?.maps && map) {
          google.maps.event.trigger(map, "resize");
          if (selectedPos) map.setCenter(selectedPos);
        }
      }, 100);
    }

    function init() {
      on(window, "load", () => setTimeout(handleMapError, 3000));
      window.initMap = initMap;
    }

    return { init };
  })();

  function init() {
    Layout.init();
    Nav.init();
    SmoothScroll.init();
    Likes.init();
    Locations.init();
    Lucide.init();
    if (window.innerWidth <= 768) {
      SnapFlex.init();
      SnapMain.init();
    } else {
      Carousel.initBasic();
    }
    GMap.init();
  }

  on(document, "DOMContentLoaded", init);
})();
