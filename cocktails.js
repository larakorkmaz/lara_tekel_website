// Tüm kokteylleri json'dan yükle
let allCocktails = [];

fetch("cocktails.json")
    .then(res => res.json())
    .then(data => {
        allCocktails = data;
        renderCocktails(data); // tümünü başta yükle
    })
    .catch(err => console.error("Kokteyl verileri alınamadı", err));

let currentPage = 1;
const itemsPerPage = 12;

function renderCocktails(cocktailList) {
    // Favorileri yukarı al
    cocktailList.sort((a, b) => {
        const favs = getFavorites();
        const isAFav = favs.includes(a.id);
        const isBFav = favs.includes(b.id);
        if (isAFav && !isBFav) return -1;
        if (!isAFav && isBFav) return 1;
        return 0;
    });

    const container = document.getElementById("cocktailGrid");
    container.innerHTML = "";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const visibleCocktails = cocktailList.slice(startIndex, endIndex);

    if (visibleCocktails.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Hiç kokteyl bulunamadı 🥲</p>';
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    visibleCocktails.forEach(cocktail => {
        const isFavorite = getFavorites().includes(cocktail.id);
        const card = document.createElement("div");
        card.className = "cocktail-card";
        card.setAttribute("data-id", cocktail.id);
        card.setAttribute("data-type", cocktail.type);
        card.setAttribute("data-title", cocktail.name);
        card.setAttribute("data-desc", cocktail.details || cocktail.desc || "Detay bulunamadı");
        card.setAttribute("data-img", cocktail.img);
        card.onclick = () => openModal(card);

        card.innerHTML = `
            <div class="fav-icon ${isFavorite ? 'favorited' : ''}" onclick="event.stopPropagation(); toggleFav(this)">
                <i class="fa-${isFavorite ? 'solid' : 'regular'} fa-heart"></i>
            </div>
            <img src="${cocktail.img}" alt="${cocktail.name}">
            <h3>${cocktail.name}</h3>
            <p>${cocktail.desc}</p>
        `;

        container.appendChild(card);
    });

    renderPagination(cocktailList);
}




// Arama kutusu
const searchInput = document.getElementById("cocktailSearch");
searchInput.addEventListener("keyup", () => {
    const query = searchInput.value.toLowerCase();
    let filtered = allCocktails.filter(c => c.name.toLowerCase().includes(query));

    // Ekstra: filtreler de geçerli olsun
    if (activeBases.length > 0) {
        filtered = filtered.filter(c => activeBases.includes(c.base));
    }
    if (favoriteMode) {
        const favs = getFavorites();
        filtered = filtered.filter(c => favs.includes(c.id));
    }

    currentPage = 1; // Arama yapıldığında sayfa 1'e dön
    renderCocktails(filtered);
});


// Modal
function openModal(card) {
    document.getElementById('modalTitle').textContent = card.getAttribute('data-title');
    document.getElementById('modalDesc').textContent = card.getAttribute('data-desc');
    document.getElementById('modalImage').src = card.getAttribute('data-img');
    document.getElementById('cocktailModal').style.display = 'flex';
}


function closeModal() {
    document.getElementById('cocktailModal').style.display = 'none';
}

// Favori toggle
function toggleFav(iconWrapper) {
    const icon = iconWrapper.querySelector("i");
    const card = iconWrapper.closest(".cocktail-card");
    const id = card.getAttribute("data-id");
    let favorites = getFavorites();

    if (favorites.includes(id)) {
        favorites = favorites.filter(i => i !== id);
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
        iconWrapper.classList.remove("favorited"); // 👈 burası
    } else {
        favorites.push(id);
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        iconWrapper.classList.add("favorited"); // 👈 burası
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

let activeBases = [];

function toggleBaseFilter() {
    const panel = document.getElementById("baseFilterPanel");
    panel.classList.toggle("visible");
}

let favoriteMode = false;

function toggleFavoriteView() {
    favoriteMode = !favoriteMode;
    const btn = document.getElementById("favToggleBtn");
    btn.classList.toggle("active", favoriteMode);
    applyAllFilters();
}

function applyAllFilters() {
    const checkboxes = document.querySelectorAll("#baseFilterPanel input[type='checkbox']");
    activeBases = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const favorites = getFavorites();

    let filtered = allCocktails;

    // Baz içeriğe göre filtrele
    if (activeBases.length > 0) {
        filtered = filtered.filter(c => activeBases.includes(c.base));
    }

    // Favori butonu aktifse filtrele
    if (favoriteMode) {
        filtered = filtered.filter(c => favorites.includes(c.id));
    }

    renderCocktails(filtered.length ? filtered : []);
}

function clearBaseFilter() {
    document.querySelectorAll("#baseFilterPanel input[type='checkbox']").forEach(cb => cb.checked = false);
    activeBases = [];
    favoriteMode = false;
    document.getElementById("favToggleBtn").classList.remove("active");
    renderCocktails(allCocktails);
}

function renderPagination(cocktailList) {
    const totalPages = Math.ceil(cocktailList.length / itemsPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = (i === currentPage) ? "active" : "";
        btn.onclick = () => {
            currentPage = i;
            renderCocktails(cocktailList);
        };
        pagination.appendChild(btn);
    }
}
