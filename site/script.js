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

  setInterval(() => goTo((current + 1) % total), 5000);
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
