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
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const hoursCards = document.querySelectorAll(".hours-card");

    hoursCards.forEach((card) => {
      const statusEl = card.querySelector(".hours-status");
      if (!statusEl) return;

      let isOpen = false;
      let isToday = false;

      if (!card.classList.contains("weekend")) {
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          isToday = true;
          if (currentTime >= 700 && currentTime < 2200) {
            isOpen = true;
          }
        }
      } else {
        if (dayOfWeek === 0) {
          isToday = true;
          if (currentTime >= 800 && currentTime < 1900) {
            isOpen = true;
          }
        }
      }

      if (isToday) {
        if (isOpen) {
          statusEl.textContent = "Aberto agora";
          statusEl.style.backgroundColor = "#e6f7e6";
          statusEl.style.color = "#2ecc71";
        } else {
          statusEl.textContent = "Fechado agora";
          statusEl.style.backgroundColor = "#ffebee";
          statusEl.style.color = "#e74c3c";
        }
      } else {
        statusEl.textContent = "";
        statusEl.style.backgroundColor = "transparent";
      }
    });
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
