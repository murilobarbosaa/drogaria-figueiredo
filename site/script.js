function initHamburgerMenu() {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("nav-menu");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("active");
    btn.classList.toggle("active");
  });

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("active")) {
        nav.classList.remove("active");
        btn.classList.remove("active");
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

function initBannerWhatsApp() {
  const phone = "558321786926";
  const msg = "Vim pelo site! Quero aproveitar as promoções.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  document.querySelectorAll(".carousel-slides .slide").forEach((slide) => {
    slide.style.cursor = "pointer";
    slide.addEventListener("click", () => window.open(url, "_blank", "noopener"));
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



let map;
const itemToMarker = new Map();
let selectedPos = null;
let selectedGmapsUrl = null;
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

    selectedGmapsUrl = item.dataset.gmapsUrl;

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
      clickable: false,
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
    if (selectedGmapsUrl) {
      window.open(selectedGmapsUrl, "_blank", "noopener");
    }
  });

  setTimeout(() => {
    if (window.google?.maps && map) {
      google.maps.event.trigger(map, "resize");
      if (selectedPos) map.setCenter(selectedPos);
    }
  }, 100);
};

if (!window.google?.maps && window.CONFIG?.GOOGLE_MAPS_API_KEY) {
  (function () {
    var script = document.createElement("script");
    script.defer = true;
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(window.CONFIG.GOOGLE_MAPS_API_KEY) + "&callback=initMap";
    document.head.appendChild(script);
  })();
}

const mapElement = document.getElementById("map");
const messageElement = document.getElementById("construction-message");
const locationItems = document.querySelectorAll(".location-item");

function resetMap() {
  mapElement.classList.remove("offscreen");
  messageElement.style.display = "none";
}

locationItems.forEach((item) => {
  item.addEventListener("click", function () {
    resetMap();

    if (item.dataset.name === "Bancários") {
      mapElement.classList.add("offscreen");
    }
  });
});

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

  initBannerWhatsApp();
  initActiveSectionHighlight();
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

    var headerLogo = document.querySelector("header a.logo");
    if (headerLogo) {
      headerLogo.addEventListener("click", function () {
        if (nav.classList.contains("active")) {
          nav.classList.remove("active");
          syncUI();
        }
      });
    }

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
      if (window.innerWidth >= 1200 && nav.classList.contains("active")) {
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

function initActiveSectionHighlight() {
  const links = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  if (!links.length) return;

  const idToLink = new Map(
    links
      .map((a) => a.getAttribute("href"))
      .filter((href) => href && href.length > 1 && href.startsWith("#"))
      .map((href) => [href.slice(1), document.querySelector(`.nav-menu a[href="${href}"]`)])
  );

  const sections = Array.from(idToLink.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  function setActive(href) {
    links.forEach((a) => a.classList.remove("active"));
    if (!href) return;
    const link = document.querySelector(`.nav-menu a[href="${href}"]`);
    if (link) link.classList.add("active");
  }

  function computeActiveByScroll() {
    const headerH = document.querySelector("header")?.offsetHeight || 70;
    const threshold = window.scrollY + headerH + 1;

    let activeSection = null;
    for (const sec of sections) {
      const top = sec.offsetTop;
      if (top <= threshold) {
        activeSection = sec;
      } else {
        break;
      }
    }

    if (activeSection?.id && idToLink.has(activeSection.id)) {
      setActive(`#${activeSection.id}`);
    } else {
      setActive(null);
    }
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        computeActiveByScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", computeActiveByScroll);
  window.addEventListener("load", computeActiveByScroll);
  setTimeout(computeActiveByScroll, 60);

  window.addEventListener("hashchange", () => {
    computeActiveByScroll();
  });
}

function initArrowCarousel() {
  const checkAndInit = () => {
    const isMobile = window.innerWidth <= 1024;
    const selectors = [".testimonials-grid"];

    selectors.forEach((selector) => {
      const originalContainer = document.querySelector(selector);
      if (!originalContainer) return;

      const isProcessed = originalContainer.classList.contains("arrow-carousel-processed");

      if (isMobile && !isProcessed) {
        // Initialize Carousel
        // Create wrapper and track
        const wrapper = document.createElement("div");
        wrapper.className = "arrow-carousel-wrapper";

        const track = document.createElement("div");
        track.className = "arrow-carousel-track";

        // Move children to track
        const items = Array.from(originalContainer.children);
        if (!items.length) return;

        items.forEach((item) => {
          track.appendChild(item);
          item.classList.add("arrow-carousel-item");
        });

        // Clear original container and append wrapper
        originalContainer.innerHTML = "";
        originalContainer.appendChild(wrapper);
        wrapper.appendChild(track);

        // Mark as processed
        originalContainer.classList.add("arrow-carousel-processed");

        // Add Arrows
        const prevBtn = document.createElement("button");
        prevBtn.className = "carousel-btn carousel-btn--prev";
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        const nextBtn = document.createElement("button");
        nextBtn.className = "carousel-btn carousel-btn--next";
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        wrapper.appendChild(prevBtn);
        wrapper.appendChild(nextBtn);

        // Logic
        let currentIndex = 0;
        const totalItems = items.length;

        function updateScroll() {
          const itemWidth = track.clientWidth; // Width of one item (100% of track)
          track.scrollTo({
            left: currentIndex * itemWidth,
            behavior: "smooth",
          });
        }

        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          updateScroll();
        });

        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % totalItems;
          updateScroll();
        });

        // Store updateScroll for resize events
        originalContainer._updateCarouselScroll = updateScroll;
      } else if (!isMobile && isProcessed) {
        // Destroy Carousel and restore original structure
        const wrapper = originalContainer.querySelector(".arrow-carousel-wrapper");
        const track = wrapper?.querySelector(".arrow-carousel-track");
        
        if (track) {
            // Move items back to container
            const items = Array.from(track.children);
            items.forEach(item => {
                if (item.classList.contains("arrow-carousel-item")) {
                    item.classList.remove("arrow-carousel-item");
                    // Remove specific class fixes
                    item.style.width = "";
                    item.style.maxWidth = "";
                    item.style.flex = "";
                }
                originalContainer.appendChild(item);
            });
        }
        
        // Remove wrapper
        if (wrapper) wrapper.remove();
        
        // Remove class
        originalContainer.classList.remove("arrow-carousel-processed");
        delete originalContainer._updateCarouselScroll;

      } else if (isMobile && isProcessed) {
         // Just update scroll on resize if needed
         if (originalContainer._updateCarouselScroll) {
             originalContainer._updateCarouselScroll();
         }
      }
    });
  };

  // Run on start
  checkAndInit();

  // Run on resize
  window.addEventListener("resize", () => {
    setTimeout(checkAndInit, 100);
  });
}

document.addEventListener("DOMContentLoaded", function () {
    // Run on load
    initArrowCarousel();
});


(function () {
  console.log("Carousel Script Loaded v4 - Distinct Strict Mode");

  /**
   * Mobile/Tablet: 3D Carousel with Swipe
   * Mimics desktop visual logic but checks for touch events.
   */
  function initMobile3DCarousel(container) {
    if (!container) return null;
    const slides = Array.from(container.querySelectorAll(".slide"));
    const dots = Array.from(container.querySelectorAll(".carousel-dot"));
    const prevBtn = container.querySelector(".carousel-btn--prev");
    const nextBtn = container.querySelector(".carousel-btn--next");
    const track = container.querySelector(".carousel-slides");
    
    if (!slides.length) return null;

    // Ensure clean state from any previous mode
    container.classList.remove("carousel--snap");
    if (track) track.style.transform = "";
    slides.forEach(s => s.style.transform = "");
    
    let current = 0;
    const total = slides.length;
    let autoTimer = null;
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50;

    const updateSlides = (index) => {
      slides.forEach(slide => {
        slide.classList.remove("active", "prev", "next", "is-active");
        slide.style.transform = ""; 
      });
      
      dots.forEach(dot => dot.classList.remove("active"));
      if (dots[index]) dots[index].classList.add("active");

      // Circular indices
      const nextIndex = (index + 1) % total;
      const prevIndex = (index - 1 + total) % total;

      slides[index].classList.add("active");
      slides[nextIndex].classList.add("next");
      slides[prevIndex].classList.add("prev");

      current = index;
    };

    const nextSlide = () => updateSlides((current + 1) % total);
    const prevSlide = () => updateSlides((current - 1 + total) % total);

    // Initial Setup
    updateSlides(0);

    // Auto-play Logic
    function startAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 5000);
    }
    
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    function restartAuto() {
        stopAuto();
        setTimeout(startAuto, 5000);
    }

    startAuto();

    // Event Listeners: Buttons
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            stopAuto();
            prevSlide();
            restartAuto();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            stopAuto();
            nextSlide();
            restartAuto();
        };
    }
    
    dots.forEach((dot, idx) => {
      dot.onclick = (e) => {
          e.preventDefault();
          stopAuto();
          updateSlides(idx);
          restartAuto();
      };
    });

    // Touch Support (Specific to Mobile/Tablet)
    if (track) {
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAuto();
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            restartAuto();
        }, { passive: true });
    }

    function handleSwipe() {
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
    }

    return {
        destroy: () => {
             clearInterval(autoTimer);
             if (prevBtn) prevBtn.onclick = null;
             if (nextBtn) nextBtn.onclick = null;
             dots.forEach(d => d.onclick = null);
             // Touch listeners are anonymous, but we clone elements in initCarousels so it's fine.
        }
    };
  }

  /**
   * Desktop: Pure 3D Carousel (Restored)
   * No mobile logic, no swipe (unless requested later).
   */
  function initDesktopCarousel(container) {
    if (!container) return null;
    const slides = Array.from(container.querySelectorAll(".slide"));
    const dots = Array.from(container.querySelectorAll(".carousel-dot"));
    const prevBtn = container.querySelector(".carousel-btn--prev");
    const nextBtn = container.querySelector(".carousel-btn--next");
    
    if (!slides.length) return null;

    container.classList.remove("carousel--snap");
    
    let current = 0;
    const total = slides.length;
    let autoTimer = null;

    const updateSlides = (index) => {
      slides.forEach(slide => {
        slide.classList.remove("active", "prev", "next", "is-active");
        slide.style.transform = ""; 
      });
      
      dots.forEach(dot => dot.classList.remove("active"));
      if (dots[index]) dots[index].classList.add("active");

      const nextIndex = (index + 1) % total;
      const prevIndex = (index - 1 + total) % total;

      slides[index].classList.add("active");
      slides[nextIndex].classList.add("next");
      slides[prevIndex].classList.add("prev");

      current = index;
    };

    const nextSlide = () => updateSlides((current + 1) % total);
    const prevSlide = () => updateSlides((current - 1 + total) % total);

    // Event Listeners
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            stopAuto();
            prevSlide();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            stopAuto();
            nextSlide();
        };
    }
    
    dots.forEach((dot, idx) => {
      dot.onclick = (e) => {
          e.preventDefault();
          stopAuto();
          updateSlides(idx);
      };
    });

    function startAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, 5000);
    }
    
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
      setTimeout(startAuto, 5000);
    }

    updateSlides(0);
    startAuto();

    return {
        destroy: () => {
             clearInterval(autoTimer);
             if (prevBtn) prevBtn.onclick = null;
             if (nextBtn) nextBtn.onclick = null;
             dots.forEach(d => d.onclick = null);
        }
    };
  }

  /**
   * Main Initialization
   */
  function checkAndTransformInstagram() {
    const container = document.querySelector(".instagram-container");
    if (!container) return;

    const grid = container.querySelector(".instagram-grid");
    const carouselWrapper = container.querySelector(".instagram-carousel");
    const isRefWidth = window.innerWidth <= 1200;

    if (isRefWidth) {
      if (!carouselWrapper && grid) {
        // Transform
        const newWrapper = document.createElement("div");
        newWrapper.className = "carousel-container instagram-carousel";

        const slidesTrack = document.createElement("div");
        slidesTrack.className = "carousel-slides";

        const posts = Array.from(grid.children);
        posts.forEach((post) => {
          const slide = document.createElement("div");
          slide.className = "slide";
          slide.appendChild(post);
          slidesTrack.appendChild(slide);
        });

        const prevBtn = document.createElement("button");
        prevBtn.className = "carousel-btn carousel-btn--prev";
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

        const nextBtn = document.createElement("button");
        nextBtn.className = "carousel-btn carousel-btn--next";
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        const dots = document.createElement("div");
        dots.className = "carousel-dots";
        posts.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.className = "carousel-dot";
          if (i === 0) dot.classList.add("active");
          dots.appendChild(dot);
        });

        newWrapper.appendChild(slidesTrack);
        newWrapper.appendChild(prevBtn);
        newWrapper.appendChild(nextBtn);
        newWrapper.appendChild(dots);

        // Grid hidden, Wrapper added
        grid.style.display = "none";
        grid.insertAdjacentElement("afterend", newWrapper);

        // Function to update height
        const updateHeight = () => {
             let maxHeight = 0;
             const posts = newWrapper.querySelectorAll(".instagram-post");
             posts.forEach((p) => {
                 maxHeight = Math.max(maxHeight, p.offsetHeight);
             });
             
             // Fallback if images not loaded - guess
             if (maxHeight < 200) {
                 maxHeight = window.innerWidth <= 576 ? 380 : 450;
             }
             
             if (maxHeight > 0) {
                 slidesTrack.style.height = (maxHeight + 20) + "px";
             }
        };

        // Initial check
        setTimeout(updateHeight, 100);
        
        // Check on load (images) and resize
        window.addEventListener("load", updateHeight);
        window.addEventListener("resize", () => setTimeout(updateHeight, 200));
        
        // ResizeObserver for robustness if content changes
        const resizeObserver = new ResizeObserver(() => {
            updateHeight();
        });
        newWrapper.querySelectorAll(".instagram-post").forEach(post => resizeObserver.observe(post));
        
        // Trigger immediately
        updateHeight();
        
        // Allow manual trigger
        newWrapper._updateHeight = updateHeight;
      } else if (carouselWrapper && carouselWrapper._updateHeight) {
          carouselWrapper._updateHeight();
      }
    } else {
      // Is Desktop (> 1200px)
      if (carouselWrapper) {
        // Move posts back to grid
        const slides = carouselWrapper.querySelectorAll(".slide .instagram-post");
        slides.forEach(post => {
            grid.appendChild(post);
        });
        
        // Remove wrapper
        carouselWrapper.remove();
        
        // Show grid
        grid.style.display = "";
    }
  }
  }

  function initCarousels() {
    checkAndTransformInstagram();
    const globalWidth = window.innerWidth;

      const containers = document.querySelectorAll(".carousel-container");
      
      containers.forEach(container => {
          const currentMode = container.dataset.carouselMode;
          const isInstagram = container.classList.contains("instagram-carousel");
          const breakpoint = isInstagram ? 1200 : 992;
          const isMobile = globalWidth <= breakpoint;
          const targetMode = isMobile ? 'mobile' : 'desktop';
          
          if (currentMode === targetMode) return;
          
          if (container.carouselInstance) {
              container.carouselInstance.destroy();
              container.carouselInstance = null;
          }

          // Clone elements to strip old listeners
          const elementsToClone = [
              container.querySelector(".carousel-btn--prev"),
              container.querySelector(".carousel-btn--next"),
              container.querySelector(".carousel-slides") 
          ];
          
          elementsToClone.forEach(el => {
              if (el) el.replaceWith(el.cloneNode(true));
          });

          // Clone dots
          const dotsWrap = container.querySelector(".carousel-dots");
          if (dotsWrap) {
             const dots = dotsWrap.querySelectorAll(".carousel-dot");
             dots.forEach(d => d.replaceWith(d.cloneNode(true)));
          }

          // Initialize new mode
          if (targetMode === 'mobile') {
              container.carouselInstance = initMobile3DCarousel(container);
          } else {
              container.carouselInstance = initDesktopCarousel(container);
          }
          container.dataset.carouselMode = targetMode;
      });
  }

  // Init
  if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initCarousels);
  } else {
      initCarousels();
  }
  
  // Debounced Resize
  let resizeTimer;
  window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initCarousels, 200);
  });
})();


