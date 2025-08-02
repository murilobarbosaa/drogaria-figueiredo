document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      hamburger.innerHTML = navMenu.classList.contains("active") ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    document.querySelectorAll(".nav-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        }
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector("header").offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  function updateHoursStatus() {
    const statusTextoEl = document.getElementById("horario-status-texto");
    const statusDetalheEl = document.getElementById("horario-status-detalhe");

    if (!statusTextoEl || !statusDetalheEl) {
      return;
    }

    const agora = new Date();
    const diaSemana = agora.getDay();
    const horaAtual = agora.getHours() * 100 + agora.getMinutes();

    let estaAberto = false;
    let textoDetalhe = "";

    if (diaSemana >= 1 && diaSemana <= 6) {
      if (horaAtual >= 700 && horaAtual < 2200) {
        estaAberto = true;
        textoDetalhe = "Fecharemos às 22:00";
      } else {
        estaAberto = false;
        if (horaAtual < 700) {
          textoDetalhe = "Abriremos hoje às 07:00";
        } else {
          if (diaSemana === 6) {
            textoDetalhe = "Abriremos amanhã às 08:00";
          } else {
            textoDetalhe = "Abriremos amanhã às 07:00";
          }
        }
      }
    } else if (diaSemana === 0) {
      if (horaAtual >= 800 && horaAtual < 1900) {
        estaAberto = true;
        textoDetalhe = "Fecharemos às 19:00";
      } else {
        estaAberto = false;
        if (horaAtual < 800) {
          textoDetalhe = "Abriremos hoje às 08:00";
        } else {
          textoDetalhe = "Abriremos amanhã às 07:00";
        }
      }
    }

    if (estaAberto) {
      statusTextoEl.textContent = "Estamos Abertos";
      statusTextoEl.className = "horario-status-aberto";
    } else {
      statusTextoEl.textContent = "Estamos Fechados";
      statusTextoEl.className = "horario-status-fechado";
    }
    statusDetalheEl.textContent = textoDetalhe;
  }

  document.querySelectorAll(".post-action.heart").forEach((heart) => {
    heart.addEventListener("click", function () {
      const likesElement = this.closest(".post-content").querySelector(".post-likes");
      if (!likesElement) return;

      let currentLikes = parseInt(likesElement.textContent) || 0;

      this.classList.toggle("fas");
      this.classList.toggle("far");

      if (this.classList.contains("fas")) {
        this.style.color = "#e74c3c";
        likesElement.textContent = currentLikes + 1 + " curtidas";
      } else {
        this.style.color = "#555";
        likesElement.textContent = currentLikes - 1 + " curtidas";
      }
    });
  });

  updateHoursStatus();
  setInterval(updateHoursStatus, 60000);
});

let map;
let markers = {};

function initMap() {
  const locationItems = document.querySelectorAll(".location-item");
  if (locationItems.length === 0) return;

  const firstLocation = locationItems[0];
  const defaultLatLng = {
    lat: parseFloat(firstLocation.getAttribute("data-lat")),
    lng: parseFloat(firstLocation.getAttribute("data-lng")),
  };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: defaultLatLng,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
    ],
  });

  locationItems.forEach((item) => {
    const lat = parseFloat(item.getAttribute("data-lat"));
    const lng = parseFloat(item.getAttribute("data-lng"));
    const name = item.getAttribute("data-name");

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: `Drogaria Figueiredo - ${name}`,
      animation: google.maps.Animation.DROP,
    });

    markers[name] = marker;

    item.addEventListener("click", () => {
      locationItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      map.setCenter({ lat, lng });
      map.setZoom(16);
      toggleBounce(marker);
    });
  });
}

function toggleBounce(marker) {
  for (const key in markers) {
    markers[key].setAnimation(null);
  }
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 1400);
}

window.addEventListener("load", function () {
  setTimeout(function () {
    if (typeof google === "undefined" || typeof google.maps === "undefined") {
      const mapContainer = document.getElementById("map");
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div style="height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; padding: 20px; background-color: #f5f5f5;">
            <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
            <h3 style="color: #555;">Não foi possível carregar o mapa</h3>
            <p style="color: #777;">Por favor, verifique sua conexão com a internet.</p>
          </div>
        `;
      }
    }
  }, 3000);
});

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const track = document.querySelector(".carousel-slides");
  const dots = Array.from(document.querySelectorAll(".carousel-dot"));
  const prevBtn = document.querySelector(".carousel-btn--prev");
  const nextBtn = document.querySelector(".carousel-btn--next");
  let current = 0;
  const total = slides.length;

  function goTo(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot) => dot.classList.remove("active"));
    dots[index].classList.add("active");
    current = index;
  }

  prevBtn.addEventListener("click", () => goTo((current - 1 + total) % total));
  nextBtn.addEventListener("click", () => goTo((current + 1) % total));
  dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.slide))));

  // autoplay a cada 5 segundos
  setInterval(() => goTo((current + 1) % total), 5000);
});
