// === GLOBAL DEĞİŞKENLER ===
let currentIndex = 0;
let isAnimating = false;
const animationDuration = 800;

let carousel = null;
let cocktails = [];

// === HAMBURGER / DRAWER ===
(function () {
  const btn = document.querySelector('.hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = drawer ? drawer.querySelector('.drawer__close') : null;
  const backdrop = document.querySelector('.drawer-backdrop');

  if (!btn || !drawer || !backdrop) return; // güvenlik

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

  // ESC ile kapat (carousel’in ArrowLeft/Right dinleyicisine dokunmuyoruz)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  // Drawer içindeki linke tıklayınca kapat
  drawer.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) closeDrawer();
  });
})();

window.addEventListener('resize', () => {
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

/* =======================================================================
   ÜRÜNLER — JSON'dan yükleme
   ======================================================================= */
function loadProducts() {
  const detailImg = document.getElementById('detail-img');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailBox = document.querySelector('.product-detail');
  const bar = document.getElementById('productBarList');

  if (!bar) return;

  fetch('products.json')
    .then(res => res.json())
    .then(list => {
      if (!Array.isArray(list)) throw new Error('products.json formatı geçersiz');

      // ürünleri çiz
      bar.innerHTML = list.map(item => `
        <div class="product"
             data-title="${item.title}"
             data-desc="${item.desc}">
          <img src="${item.img}" alt="${item.title}">
        </div>
      `).join('');

      const productEls = bar.querySelectorAll('.product');

      function showProduct(el, animate = false) {
        productEls.forEach(p => p.classList.remove('active'));
        el.classList.add('active');

        const imgEl = el.querySelector('img');
        if (imgEl) {
          detailImg.src = imgEl.src;
          detailImg.alt = imgEl.alt;
        }
        detailTitle.textContent = el.dataset.title || '';
        detailDesc.textContent = el.dataset.desc || '';
        detailBox.classList.add('visible');

        // animasyon sadece tıklamada
        if (animate && imgEl) {
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

      // tıklamalar
      productEls.forEach(p => p.addEventListener('click', () => showProduct(p, true)));

      // açılışta ilk ürün
      if (productEls.length) showProduct(productEls[0], false);
    })
    .catch(err => console.error('Ürünler yüklenemedi:', err));
}

/* =======================================================================
   ANA — sayfa hazır olunca
   ======================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Ürünleri JSON'dan yükle
  loadProducts();

  // Öne çıkan kokteyller (varsa)
  const container = document.getElementById("featured-cocktails");
  if (container) {
    fetch("cocktails.json")
      .then(res => res.json())
      .then(data => {
        const featured = data.filter(c => c.featured);
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
        console.error("Kokteyller yüklenemedi:", err);
      });
  }

  // Ürün kaydırma okları
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

  // === 3D Carousel ===
  carousel = document.getElementById('cocktailCarousel');
  if (!carousel) {
    console.warn("carousel DOM'da yok, slider yüklenmedi.");
    return;
  }

  const cocktailLeftBtn = document.querySelector('.cocktail-btn.left');
  const cocktailRightBtn = document.querySelector('.cocktail-btn.right');

  fetch('cocktails.json')
    .then(res => res.json())
    .then(data => {
      cocktails = data.filter(c => c.featured);
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
      console.warn("Cocktails JSON dosyası yüklenemedi:", err);
      cocktails = [{
        img: "images/cocktails/mocktail.png",
        name: "Demo İçecek",
        desc: "Menü şu an gösterilemiyor"
      }];
      createSlides();
      createPagination();
      updateCarousel();
    });

  // Klavye yön tuşları
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') rotateCarousel(-1);
    if (e.key === 'ArrowRight') rotateCarousel(1);
  });

  // Yükleme ekranı
  window.addEventListener("load", () => {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.style.transition = "opacity 0.5s ease";
      wrapper.style.opacity = "0";
      setTimeout(() => {
        wrapper.style.display = "none";
      }, 500);
    }
  });
});

/* =======================================================================
   CAROUSEL fonksiyonları (seninle aynı)
   ======================================================================= */
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

function createPagination() {
  const pagination = document.querySelector('.cocktail-pagination');
  pagination.innerHTML = '';
  cocktails.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.dataset.index = index;
    dot.addEventListener('click', () => rotateToIndex(index));
    pagination.appendChild(dot);
  });
}

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

function openPopup(src) {
  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  popupImg.src = src;
  popup.style.display = "flex";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}


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
    // ✨ offset'ler doğrudan .navlinks’e göre olduğu için şaşmaz
    const x = a.offsetLeft + 10;       // sol/sağ padding telafisi
    const w = a.offsetWidth - 20;
    list.style.setProperty('--hl-x', x + 'px');
    list.style.setProperty('--hl-w', w + 'px');
  }
})();

const termsBtn = document.getElementById("termsBtn");
const termsModal = document.getElementById("termsModal");
const termsClose = document.getElementById("termsClose");

if (termsBtn && termsModal && termsClose) {
  termsBtn.addEventListener("click", () => {
    termsModal.classList.add("show");
    document.body.classList.add("no-scroll"); // scroll kilitlenir
  });

  termsClose.addEventListener("click", () => {
    termsModal.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  termsModal.addEventListener("click", (e) => {
    if (e.target === termsModal) {
      termsModal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  });
}

// === Şartlar & Koşullar Modal – tek ve tutarlı implementasyon ===
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
    // Drawer açıksa kapat (opsiyonel ama iyi olur)
    if (drawer && drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      backdrop?.classList.remove('is-open');
      backdrop && (backdrop.hidden = true);
      burger?.classList.remove('is-active');
      document.body.classList.remove('no-scroll');
    }
    // Modalı göster
    modal.classList.add('show');                // <-- GÖRÜNÜRLÜK
    modal.setAttribute('aria-hidden', 'false'); // erişilebilirlik
    document.body.classList.add('no-scroll');   // scroll kilidi
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  footerBtn?.addEventListener('click', openModal);
  menuLink?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  // Modal dışına tıkla -> kapat
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC ile kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });
})();

