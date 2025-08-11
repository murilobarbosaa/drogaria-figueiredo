function initHamburgerMenu() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("nav-menu");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("active");
    btn.innerHTML = nav.classList.contains("active") ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("active")) {
        nav.classList.remove("active");
        btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });
}

function initSmoothScroll() {
  const header = document.querySelector("header");
  const headerHeight = header ? header.offsetHeight : 0;

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const targetEl = document.querySelector(href);
      if (!targetEl) return;

      event.preventDefault();
      const topPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: topPos, behavior: "smooth" });
    });
  });
}

function initLikeButtons() {
  document.querySelectorAll(".post-action.heart").forEach((heart) => {
    heart.addEventListener("click", () => {
      const likesEl = heart.closest(".post-content")?.querySelector(".post-likes");
      if (!likesEl) return;

      let count = parseInt(likesEl.textContent) || 0;
      heart.classList.toggle("fas");
      heart.classList.toggle("far");

      if (heart.classList.contains("fas")) {
        heart.style.color = "#e74c3c";
        likesEl.textContent = `${count + 1} curtidas`;
      } else {
        heart.style.color = "#555";
        likesEl.textContent = `${count - 1} curtidas`;
      }
    });
  });
}

function initLocationStatus() {
  document.querySelectorAll(".location-item").forEach((card) => {
    const now = new Date();
    const day = now.getDay();

    const hoursData = day === 0 ? card.dataset.sundayHours : card.dataset.weekdayHours;
    if (!hoursData) return;

    const [openStr, closeStr] = hoursData.split("-");
    const [hOpen, mOpen] = openStr.split(":").map(Number);
    const [hClose, mClose] = closeStr.split(":").map(Number);

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const minutesOpen = hOpen * 60 + mOpen;
    const minutesClose = hClose * 60 + mClose;

    const statusEl = card.querySelector(".hours-status");
    if (!statusEl) return;

    if (minutesNow >= minutesOpen && minutesNow < minutesClose) {
      statusEl.textContent = "Aberto";
      statusEl.classList.add("open");
      statusEl.classList.remove("closed");
    } else {
      statusEl.textContent = "Fechado";
      statusEl.classList.add("closed");
      statusEl.classList.remove("open");
    }
  });
}

function initCarousel() {
  const slides = document.querySelectorAll(".slide");
  const track = document.querySelector(".carousel-slides");
  const dots = Array.from(document.querySelectorAll(".carousel-dot"));
  const prevBtn = document.querySelector(".carousel-btn--prev");
  const nextBtn = document.querySelector(".carousel-btn--next");
  let current = 0;
  const total = slides.length;
  if (!track || !dots.length) return;

  const goTo = (index) => {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot) => dot.classList.remove("active"));
    dots[index].classList.add("active");
    current = index;
  };

  prevBtn?.addEventListener("click", () => goTo((current - 1 + total) % total));
  nextBtn?.addEventListener("click", () => goTo((current + 1) % total));
  dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.slide))));

  setInterval(() => goTo((current + 1) % total), 3500);
}

let map;
const itemToMarker = new Map();
let selectedPos = null;
let suppressMapClickUntil = 0;

window.initMap = () => {
  const items = document.querySelectorAll(".location-item");
  if (!items.length) return;

  const mapEl = document.getElementById("map");
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

  const select = (item, marker) => {
    items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    const pos = { lat: +item.dataset.lat, lng: +item.dataset.lng };
    selectedPos = pos;

    map.setCenter(pos);
    map.setZoom(16);

    itemToMarker.forEach((m) => m.setAnimation(null));
    if (marker && google.maps.Animation) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 900);
    }
  };

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
      select(item, marker);
    });

    item.addEventListener("click", () => select(item, marker));
  });

  select(first, itemToMarker.get(first));

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
};

function handleMapError() {
  const container = document.getElementById("map");
  if (!container || window.google?.maps) return;
  container.innerHTML = `
    <div style="
      height:100%;display:flex;align-items:center;justify-content:center;
      flex-direction:column;text-align:center;padding:20px;background:#f5f5f5;
      border-radius:12px;border:1px solid #eee;
    ">
      <i class="fas fa-map-marker-alt" style="font-size:3rem;color:#ccc;margin-bottom:20px;"></i>
      <h3 style="color:#555;">Não foi possível carregar o mapa</h3>
      <p style="color:#777;">Verifique sua conexão ou as permissões da API.</p>
    </div>`;
}

window.addEventListener("load", () => {
  setTimeout(handleMapError, 3000);
});

document.addEventListener("DOMContentLoaded", () => {
  initHamburgerMenu();
  initSmoothScroll();
  initLikeButtons();
  initLocationStatus();
  initCarousel();
});

(function initLucideIcons() {
  function run() {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons({
        attrs: { stroke: "#475569", "stroke-width": 1.8, width: 36, height: 36 },
      });
    } else {
      setTimeout(run, 120);
    }
  }
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();

(function () {
  function adjustBodyOffset() {
    var header = document.querySelector("header");
    if (!header) return;
    var h = header.offsetHeight || 70;
    document.documentElement.style.setProperty("--header-h", h + "px");
    document.body.style.paddingTop = h + "px";
  }

  function enhanceMobileMenu() {
    var nav = document.getElementById("nav-menu");
    var btn = document.getElementById("hamburger");
    if (!nav || !btn) return;

    var backdrop = document.querySelector(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      document.body.appendChild(backdrop);
    }

    var syncUI = function () {
      var isOpen = nav.classList.contains("active");
      backdrop.classList.toggle("active", isOpen);
      document.body.classList.toggle("no-scroll", isOpen);
      btn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };

    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("active");
        syncUI();
      });
    });

    backdrop.addEventListener("click", function () {
      nav.classList.remove("active");
      syncUI();
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("active")) {
        nav.classList.remove("active");
        syncUI();
      }
    });

    function closeOnDesktop() {
      if (window.innerWidth >= 992 && nav.classList.contains("active")) {
        nav.classList.remove("active");
        syncUI();
      }
    }
    window.addEventListener("resize", closeOnDesktop);

    var mo = new MutationObserver(syncUI);
    mo.observe(nav, { attributes: true, attributeFilter: ["class"] });

    syncUI();
  }

  document.addEventListener("DOMContentLoaded", function () {
    adjustBodyOffset();
    enhanceMobileMenu();
  });
  window.addEventListener("load", adjustBodyOffset);
  window.addEventListener("resize", adjustBodyOffset);
})();

(function () {
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
    const dots = Array.from(dotsWrap.querySelectorAll(".snap-dot"));

    function updateActive() {
      const rect = container.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      let active = 0,
        best = Infinity;
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
    container.addEventListener("scroll", () => requestAnimationFrame(updateActive), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(updateActive));
    setTimeout(updateActive, 50);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth <= 768) {
      document.querySelectorAll(".instagram-grid, .services-grid").forEach(initSnapCarouselFlex);
    }
  });
})();

(function () {
  function initMainCarouselSnap(root) {
    const container = root || document.querySelector(".carousel-container");
    if (!container) return;
    const track = container.querySelector(".carousel-slides");
    const slides = Array.from(track?.children || []);
    if (!track || slides.length === 0) return;

    container.classList.add("carousel--snap");
    track.style.transform = "";

    const dotsWrap = container.querySelector(".carousel-dots");
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".carousel-dot")) : [];

    function setActiveByCenter() {
      const rect = container.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      let active = 0,
        best = Infinity;
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
      dot.addEventListener("click", (e) => {
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
      track.addEventListener(
        evt,
        () => {
          stopAuto();
        },
        { passive: true }
      );
    });
    ["touchend", "pointerup", "mouseup"].forEach((evt) => {
      track.addEventListener(
        evt,
        () => {
          restartAutoSoon();
        },
        { passive: true }
      );
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAuto();
      else restartAutoSoon(1000);
    });

    track.addEventListener("scroll", () => requestAnimationFrame(setActiveByCenter), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(setActiveByCenter));

    setTimeout(() => {
      setActiveByCenter();
      startAuto();
    }, 80);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth <= 768) {
      document.querySelectorAll(".carousel-container").forEach(initMainCarouselSnap);
    }
  });
})();
