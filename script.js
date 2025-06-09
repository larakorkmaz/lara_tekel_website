function toggleMenu() {
    const navLinks = document.querySelector(".navlinks");
    navLinks.classList.toggle("active");
}

const products = document.querySelectorAll('.product');
const detailImg = document.getElementById('detail-img');
const detailTitle = document.getElementById('detail-title');
const detailDesc = document.getElementById('detail-desc');

products.forEach(product => {
  product.addEventListener('click', () => {
    // Tüm ürünlerden active sınıfını kaldır
    products.forEach(p => p.classList.remove('active'));
    // Tıklanan ürüne active ekle
    product.classList.add('active');

    // Detay içeriğini güncelle
    detailImg.src = product.querySelector('img').src;
    detailImg.alt = product.querySelector('img').alt;
    detailTitle.textContent = product.dataset.title;
    detailDesc.textContent = product.dataset.desc;

    // Küçük resmin pozisyonunu al
    const smallImg = product.querySelector('img');
    const smallRect = smallImg.getBoundingClientRect();
    const bigRect = detailImg.getBoundingClientRect();

    // Farkları hesapla
    const deltaX = smallRect.left - bigRect.left;
    const deltaY = smallRect.top - bigRect.top;
    const deltaW = smallRect.width / bigRect.width;
    const deltaH = smallRect.height / bigRect.height;

    // Büyük resmi küçük resmin konumuna taşı ve küçült
    detailImg.style.transformOrigin = 'top left';
    detailImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`;

    // Animasyonla normal pozisyona dön
    requestAnimationFrame(() => {
      detailImg.style.transition = 'transform 0.5s ease';
      detailImg.style.transform = 'none';
    });

    // Animasyon bitince transition'ı kaldır
    detailImg.addEventListener('transitionend', () => {
      detailImg.style.transition = '';
    }, { once: true });

    // Detay bölümünü görünür yap
    const productDetail = document.querySelector('.product-detail');
    productDetail.classList.add('visible');
  });
});


// SCROLL BUTONLARI İÇİN EK KOD
document.addEventListener("DOMContentLoaded", () => {
  const productBar = document.querySelector(".product-bar");
  const leftBtn = document.querySelector(".scroll-btn.left");
  const rightBtn = document.querySelector(".scroll-btn.right");

  if (productBar && leftBtn && rightBtn) {
    const scrollAmount = 150;

    leftBtn.addEventListener("click", () => {
      productBar.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    rightBtn.addEventListener("click", () => {
      productBar.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }
});





