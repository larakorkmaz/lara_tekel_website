"use strict";

/* ======================================================================
   GLOBAL STATE
====================================================================== */
let currentIndex = 0;
let isAnimating = false;
const animationDuration = 800;

let carousel = null;
let cocktails = [];

/* ======================================================================
   HAMBURGER / DRAWER
====================================================================== */
(function () {
  const btn = document.querySelector('.hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = drawer ? drawer.querySelector('.drawer__close') : null;
  const backdrop = document.querySelector('.drawer-backdrop');

  if (!btn || !drawer || !backdrop) return;

  function openDrawer() {
    btn.classList.add('is-active');
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    backdrop.hidden = false;
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    btn.classList.remove('is-active');
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    btn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => { backdrop.hidden = true; }, 280);
  }

  btn.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  closeBtn && closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Close with ESC (does not interfere with carousel arrow listeners)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  // Close drawer when clicking a link inside it
  drawer.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) closeDrawer();
  });
})();

window.addEventListener('resize', () => {
  // Ensure drawer is closed on desktop widths
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.querySelector('.drawer-backdrop');
  const btn = document.querySelector('.hamburger');
  if (window.innerWidth >= 992 && drawer && backdrop && btn) {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
    btn.classList.remove('is-active');
    document.body.classList.remove('no-scroll');
  }
});

/* ======================================================================
   LANGUAGE HELPERS (used by products; tolerant to old/new schemas)
====================================================================== */

// Normalize paths to root (so they work under / and /en/ etc.)
const toRoot = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;   // already absolute (http/https)
  return p.startsWith("/") ? p : `/${p}`;  // make root-relative
};

const getLang = () =>
  document.documentElement.lang ||
  document.body?.dataset?.lang ||
  localStorage.getItem("lang") ||
  "tr";

const pickDesc = (desc, lang) => {
  if (!desc) return "";
  if (typeof desc === "object") {
    return desc[lang] || desc.tr || desc.en || "";
  }
  return String(desc);
};

/* ======================================================================
   PRODUCTS — load from products.json (multi-language aware)
====================================================================== */
function loadProducts() {
  const detailImg = document.getElementById('detail-img');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailBox = document.querySelector('.product-detail');
  const bar = document.getElementById('productBarList');

  if (!bar) return;

  fetch('../products.json')
    .then(res => res.json())
    .then(list => {
      if (!Array.isArray(list)) throw new Error('products.json is not a valid array');

      const lang = getLang();

      // Render the horizontal product bar
      bar.innerHTML = list.map(item => {
        const titleText = item.title || "";
        const img = item.img || "";
        const descText = pickDesc(item.desc, lang);
        return `
          <div class="product"
               data-title="${titleText}"
               data-desc="${descText}">
            <img src="${img}" alt="${titleText}">
          </div>
        `;
      }).join('');

      const productEls = bar.querySelectorAll('.product');

      // Show details pane
      function showProduct(el, animate = false) {
        productEls.forEach(p => p.classList.remove('active'));
        el.classList.add('active');

        const imgEl = el.querySelector('img');
        if (imgEl && detailImg) {
          detailImg.src = imgEl.src;
          detailImg.alt = imgEl.alt;
        }
        if (detailTitle) detailTitle.textContent = el.dataset.title || '';
        if (detailDesc) detailDesc.textContent = el.dataset.desc || '';
        detailBox && detailBox.classList.add('visible');

        // Small-to-large transition animation on click
        if (animate && imgEl && detailImg) {
          const smallRect = imgEl.getBoundingClientRect();
          const bigRect = detailImg.getBoundingClientRect();
          const dx = smallRect.left - bigRect.left;
          const dy = smallRect.top - bigRect.top;
          const s = smallRect.width / bigRect.width;

          detailImg.style.transformOrigin = 'top left';
          detailImg.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
          requestAnimationFrame(() => {
            detailImg.style.transition = 'transform 0.5s ease';
            detailImg.style.transform = 'none';
          });
          detailImg.addEventListener('transitionend', () => {
            detailImg.style.transition = '';
          }, { once: true });
        }
      }

      // Click handlers
      productEls.forEach(p => p.addEventListener('click', () => showProduct(p, true)));

      // Select the first product on initial load
      if (productEls.length) showProduct(productEls[0], false);

      // Re-render descriptions when language changes (optional)
      const rerender = (newLang) => {
        productEls.forEach((p, i) => {
          const item = list[i];
          p.dataset.desc = pickDesc(item.desc, newLang);
        });
        const active = bar.querySelector('.product.active') || productEls[0];
        active && active.click();
      };

      window.addEventListener('lang:change', (e) => {
        const newLang = e?.detail?.lang || getLang();
        rerender(newLang);
      });
    })
    .catch(err => console.error('Products could not be loaded:', err));
}

/* ======================================================================
   FEATURED COCKTAILS — simple grid cards (if container exists)
====================================================================== */
function initFeaturedCocktails() {
  const container = document.getElementById("featured-cocktails");
  if (!container) return;

  fetch("cocktails.json")
    .then(res => res.json())
    .then(data => {
      const featured = Array.isArray(data) ? data.filter(c => c.featured) : [];
      featured.forEach(cocktail => {
        const card = document.createElement("div");
        card.className = "cocktail-card";
        card.innerHTML = `
          <img src="${cocktail.img}" alt="${cocktail.name}">
          <h3>${cocktail.name}</h3>
          <p>${cocktail.desc}</p>`;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Cocktails could not be loaded:", err);
    });
}

/* ======================================================================
   PRODUCT BAR ARROWS — horizontal scroll
====================================================================== */
function initProductBarArrows() {
  const productBar = document.getElementById("productBarList");
  const productLeftBtn = document.querySelector(".scroll-btn.left");
  const productRightBtn = document.querySelector(".scroll-btn.right");

  if (productBar && productLeftBtn && productRightBtn) {
    const scrollAmount = 150;
    productLeftBtn.addEventListener("click", () => {
      productBar.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
    productRightBtn.addEventListener("click", () => {
      productBar.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }
}

/* ======================================================================
   3D CAROUSEL — featured cocktails slider
====================================================================== */
function initCarousel() {
  carousel = document.getElementById('cocktailCarousel');
  if (!carousel) {
    console.warn("carousel not found in DOM; slider skipped.");
    return;
  }

  const cocktailLeftBtn = document.querySelector('.cocktail-btn.left');
  const cocktailRightBtn = document.querySelector('.cocktail-btn.right');

  fetch('cocktails.json')
    .then(res => res.json())
    .then(data => {
      cocktails = (Array.isArray(data) ? data : []).filter(c => c.featured);
      createSlides();
      createPagination();
      updateCarousel();
      setupTouchEvents();

      if (cocktailLeftBtn && cocktailRightBtn) {
        cocktailLeftBtn.addEventListener('click', () => rotateCarousel(-1));
        cocktailRightBtn.addEventListener('click', () => rotateCarousel(1));
      }
    })
    .catch(err => {
      console.warn("cocktails.json could not be loaded:", err);
      cocktails = [{
        img: "images/cocktails/mocktail.png",
        name: "Demo Drink",
        desc: "Menu cannot be displayed right now"
      }];
      createSlides();
      createPagination();
      updateCarousel();
    });

  // Keyboard arrows
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') rotateCarousel(-1);
    if (e.key === 'ArrowRight') rotateCarousel(1);
  });
}

// Build slides
function createSlides() {
  carousel.innerHTML = '';
  cocktails.forEach((cocktail, index) => {
    const slide = document.createElement('div');
    slide.className = 'cocktail-slide';
    slide.dataset.index = index;
    slide.innerHTML = `
      <img src="${cocktail.img}" alt="${cocktail.name}" loading="lazy">
      <div class="cocktail-detail">
        <h3>${cocktail.name}</h3>
        <p>${cocktail.desc}</p>
      </div>`;
    carousel.appendChild(slide);
  });
}

// Build pagination dots
function createPagination() {
  const pagination = document.querySelector('.cocktail-pagination');
  if (!pagination) return;
  pagination.innerHTML = '';
  cocktails.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.dataset.index = index;
    dot.addEventListener('click', () => rotateToIndex(index));
    pagination.appendChild(dot);
  });
}

// Update positions and active dot
function updateCarousel() {
  const slides = document.querySelectorAll('.cocktail-slide');
  const dots = document.querySelectorAll('.dot');

  slides.forEach((slide, index) => {
    slide.className = 'cocktail-slide';
    const diff = (index - currentIndex + slides.length) % slides.length;

    if (diff === 0) {
      slide.classList.add('center');
    } else if (diff === 1) {
      slide.classList.add('right-1');
      slide.style.setProperty('--dir', '1');
    } else if (diff === slides.length - 1) {
      slide.classList.add('left-1');
      slide.style.setProperty('--dir', '-1');
    } else if (diff === 2) {
      slide.classList.add('right-2');
      slide.style.setProperty('--dir', '1');
    } else if (diff === slides.length - 2) {
      slide.classList.add('left-2');
      slide.style.setProperty('--dir', '-1');
    } else {
      slide.style.display = '';
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
  });
}

function rotateCarousel(direction) {
  if (isAnimating) return;

  const slides = document.querySelectorAll('.cocktail-slide');
  const totalSlides = slides.length;

  isAnimating = true;
  slides.forEach(slide => {
    slide.style.transition = `all ${animationDuration / 1000}s ease`;
  });

  currentIndex = (currentIndex + direction + totalSlides) % totalSlides;
  updateCarousel();

  setTimeout(() => {
    slides.forEach(slide => slide.style.transition = 'none');
    isAnimating = false;
  }, animationDuration);
}

function rotateToIndex(index) {
  if (isAnimating || currentIndex === index) return;

  const slides = document.querySelectorAll('.cocktail-slide');
  currentIndex = index;

  isAnimating = true;
  slides.forEach(slide => {
    slide.style.transition = `all ${animationDuration / 1000}s ease`;
  });

  updateCarousel();

  setTimeout(() => {
    slides.forEach(slide => slide.style.transition = 'none');
    isAnimating = false;
  }, animationDuration);
}

// Touch support
function setupTouchEvents() {
  let startX, moveX;
  const threshold = window.innerWidth < 768 ? 30 : 50;

  carousel.style.touchAction = "pan-y";

  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchmove', (e) => {
    if (!startX) return;
    moveX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (!startX || !moveX) return;

    const diff = startX - moveX;
    if (Math.abs(diff) > threshold) {
      rotateCarousel(diff > 0 ? 1 : -1);
    }

    startX = null;
    moveX = null;
  }, { passive: true });
}

/* ======================================================================
   POPUP HELPERS
====================================================================== */
function openPopup(src) {
  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  if (!popup || !popupImg) return;
  popupImg.src = src;
  popup.style.display = "flex";
}

function closePopup() {
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.style.display = "none";
}

/* ======================================================================
   NAVBAR HOVER HIGHLIGHT
====================================================================== */
(function () {
  const list = document.querySelector('.navlinks');
  if (!list) return;

  const active = list.querySelector('a.is-active') || list.querySelector('a.nav-expand');
  moveHL(active);

  list.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a');
    if (a && list.contains(a)) moveHL(a);
  });
  list.addEventListener('mouseleave', () => moveHL(active));

  function moveHL(a) {
    if (!a) return;
    // Offsets are relative to .navlinks, so this is robust
    const x = a.offsetLeft + 10; // compensate side paddings
    const w = a.offsetWidth - 20;
    list.style.setProperty('--hl-x', x + 'px');
    list.style.setProperty('--hl-w', w + 'px');
  }
})();

/* ======================================================================
   TERMS & CONDITIONS MODAL — SIMPLE BIND (footer button)
   (kept as-is; guarded to avoid double-binding)
====================================================================== */
(function () {
  const termsBtn = document.getElementById("termsBtn");
  const termsModal = document.getElementById("termsModal");
  const termsClose = document.getElementById("termsClose");

  if (termsBtn && termsModal && termsClose && !termsModal.dataset.simpleBound) {
    const open = () => {
      termsModal.classList.add("show");
      document.body.classList.add("no-scroll");
    };
    const close = () => {
      termsModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    };

    termsBtn.addEventListener("click", open);
    termsClose.addEventListener("click", close);
    termsModal.addEventListener("click", (e) => {
      if (e.target === termsModal) close();
    });

    termsModal.dataset.simpleBound = "1";
  }
})();

/* ======================================================================
   TERMS & CONDITIONS MODAL — ENHANCED FLOW (menu & drawer integration)
   (kept as-is; separate logic; closes drawer if open)
====================================================================== */
(function () {
  const modal = document.getElementById('termsModal');
  const footerBtn = document.getElementById('termsBtn');
  const menuLink = document.getElementById('termsLink');
  const closeBtn = document.getElementById('termsClose');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.querySelector('.drawer-backdrop');
  const burger = document.querySelector('.hamburger');

  if (!modal) return;

  function openModal(e) {
    if (e) e.preventDefault();
    // If drawer is open, close it first
    if (drawer && drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      backdrop?.classList.remove('is-open');
      if (backdrop) backdrop.hidden = true;
      burger?.classList.remove('is-active');
      document.body.classList.remove('no-scroll');
    }
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  footerBtn?.addEventListener('click', openModal);
  menuLink?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });
})();

/* ======================================================================
   PAGE READY
====================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Products
  loadProducts();

  // Featured cocktails grid (optional container)
  initFeaturedCocktails();

  // Horizontal product bar arrows
  initProductBarArrows();

  // 3D carousel
  initCarousel();

  // Loading overlay fade-out
  window.addEventListener("load", () => {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.style.transition = "opacity 0.5s ease";
      wrapper.style.opacity = "0";
      setTimeout(() => { wrapper.style.display = "none"; }, 500);
    }
  });
});

// +18
  (function () {
  const modal = document.getElementById('ageGate');
  if (!modal) return;

  const confirmBtn = document.getElementById('ageConfirm');
  const exitBtn    = document.getElementById('ageExit');
  const termsLink  = document.getElementById('openTermsFromAge');

  const lockScroll = (on) => {
    document.documentElement.classList.toggle('agegate-lock', on);
  document.body.classList.toggle('agegate-lock', on);
  };

  const openGate = () => {
    modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  lockScroll(true);
    setTimeout(() => confirmBtn?.focus(), 0);
  };

  const closeGate = () => {
    modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  lockScroll(false);
  };


  openGate();

  confirmBtn?.addEventListener('click', () => {
    closeGate();
  });


  exitBtn?.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });


  termsLink?.addEventListener('click', (e) => {
    e.preventDefault();
  document.getElementById('termsBtn')?.click();
  });


  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
  const focusables = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
    }
  });
})();

