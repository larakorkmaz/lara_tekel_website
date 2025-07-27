function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.navlinks');
    const body = document.body;
    
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    // Menü linklerine tıklanınca kapat
    document.querySelectorAll('.navlinks a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });
}

// Ürün detay geçişi
const products = document.querySelectorAll('.product');
const detailImg = document.getElementById('detail-img');
const detailTitle = document.getElementById('detail-title');
const detailDesc = document.getElementById('detail-desc');

products.forEach(product => {
  product.addEventListener('click', () => {
    products.forEach(p => p.classList.remove('active'));
    product.classList.add('active');

    detailImg.src = product.querySelector('img').src;
    detailImg.alt = product.querySelector('img').alt;
    detailTitle.textContent = product.dataset.title;
    detailDesc.textContent = product.dataset.desc;

    const smallImg = product.querySelector('img');
    const smallRect = smallImg.getBoundingClientRect();
    const bigRect = detailImg.getBoundingClientRect();

    const deltaX = smallRect.left - bigRect.left;
    const deltaY = smallRect.top - bigRect.top;
    const deltaW = smallRect.width / bigRect.width;

    detailImg.style.transformOrigin = 'top left';
    detailImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${deltaW})`;

    requestAnimationFrame(() => {
      detailImg.style.transition = 'transform 0.5s ease';
      detailImg.style.transform = 'none';
    });

    detailImg.addEventListener('transitionend', () => {
      detailImg.style.transition = '';
    }, { once: true });

    document.querySelector('.product-detail').classList.add('visible');
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const productBar = document.querySelector(".product-bar");
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

  // === 3D KOKTEYL CAROUSEL ===
  const carousel = document.getElementById('cocteylCarousel');
  const cocteylLeftBtn = document.querySelector('.cocteyl-btn.left');
  const cocteylRightBtn = document.querySelector('.cocteyl-btn.right');
  const pagination = document.querySelector('.cocteyl-pagination');

  let cocktails = [];

  fetch('cocktails.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Veriler yüklenemedi (Hata ${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      cocktails = data;
      createSlides();
      createPagination();
      updateCarousel();
      setupTouchEvents();

      if (cocteylLeftBtn && cocteylRightBtn) {
        cocteylLeftBtn.addEventListener('click', () => rotateCarousel(-1));
        cocteylRightBtn.addEventListener('click', () => rotateCarousel(1));
      }
    })
    .catch(err => {
      console.error("Hata:", err);
      alert("Ürün bilgileri yüklenirken sorun oluştu. Lütfen sayfayı yenileyin.");

      // Acil durum verileri
      cocktails = [{
        html: `
    <div style="
      width: 200px; 
      height: 200px;
      background: #ffac30;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
    ">
      <i class="fa-solid fa-martini-glass" style="font-size: 50px"></i>
      <p>Ürün Yüklenemedi</p>
    </div>
  `,
        name: "Demo İçecek",
        desc: "Menü şu an gösterilemiyor"
      }];

      createSlides();
      createPagination();
    });



  function createSlides() {
    carousel.innerHTML = '';
    cocktails.forEach((cocktail, index) => {
      const slide = document.createElement('div');
      slide.className = 'cocteyl-slide';
      slide.dataset.index = index;
      slide.innerHTML = `
        <img src="${cocktail.img}" alt="${cocktail.name}" loading="lazy">
        <div class="cocteyl-detail">
          <h3>${cocktail.name}</h3>
          <p>${cocktail.desc}</p>
        </div>
      `;
      carousel.appendChild(slide);
    });
  }

  function createPagination() {
    pagination.innerHTML = '';
    cocktails.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.dataset.index = index;
      dot.addEventListener('click', () => rotateToIndex(index));
      pagination.appendChild(dot);
    });
  }


  let currentIndex = 0;
  let isAnimating = false;
  const animationDuration = 800;

  function updateCarousel() {
    const slides = document.querySelectorAll('.cocteyl-slide');
    const dots = document.querySelectorAll('.dot');

    slides.forEach((slide, index) => {
      slide.className = 'cocteyl-slide';
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

    isAnimating = true;
    const slides = document.querySelectorAll('.cocteyl-slide');
    currentIndex = (currentIndex + direction + slides.length) % slides.length;

    slides.forEach(slide => {
      slide.style.transition = `all ${animationDuration / 1000}s ease`;
    });

    updateCarousel();

    setTimeout(() => {
      slides.forEach(slide => slide.style.transition = 'none');
      isAnimating = false;
    }, animationDuration);
  }

  function rotateToIndex(index) {
    if (isAnimating || currentIndex === index) return;

    const slides = document.querySelectorAll('.cocteyl-slide');
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

  // === ARAMA ===
  const searchInput = document.getElementById("cocteylSearch");
  const searchBtn = document.getElementById("cocteylSearchBtn");

  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const foundIndex = cocktails.findIndex(c =>
      c.name.toLowerCase().includes(query)
    );

    if (foundIndex !== -1) {
      rotateToIndex(foundIndex);
    } else {
      alert("Bu adda bir kokteyl yok 😔");
    }
  }

  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleSearch();
    });
  }

  // === Başlat ===

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') rotateCarousel(-1);
    if (e.key === 'ArrowRight') rotateCarousel(1);
  });
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

const galleryImages = document.querySelectorAll(".about-gallery img");
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");

galleryImages.forEach(img => {
  img.addEventListener("click", () => {
    popup.style.display = "flex";
    popupImg.src = img.src;
  });
});

function closePopup() {
  popup.style.display = "none";
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    popup.style.display = "none";
  }
});
