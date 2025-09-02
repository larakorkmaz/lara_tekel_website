// Load all cocktails from JSON
let allCocktails = [];
let filteredCocktails = [];
let currentPage = 1;
let _lastPage = 1;

const itemsPerPage = 12;
let activeBases = [];
let favoriteMode = false;

fetch("cocktails.json")
    .then(res => res.json())
    .then(data => {
        allCocktails = data;
        filteredCocktails = data;
        renderCocktails(filteredCocktails);
    })
    .catch(err => console.error("Cocktail data could not be retrieved", err));

// Main render function
function renderCocktails(cocktailList) {
    // Move favorites to the top
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
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No cocktails found... 🥲</p>';
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
        card.setAttribute("data-desc", cocktail.details || cocktail.desc || "No details found");
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

    if (_lastPage !== currentPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        _lastPage = currentPage;
    }

    renderPagination(cocktailList);
}

// Create pagination
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
            renderCocktails(filteredCocktails);
        };
        pagination.appendChild(btn);
    }
}

// Open/close modal
function openModal(card) {
    document.getElementById('modalTitle').textContent = card.getAttribute('data-title');
    document.getElementById('modalDesc').textContent = card.getAttribute('data-desc');
    document.getElementById('modalImage').src = card.getAttribute('data-img');
    document.getElementById('cocktailModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('cocktailModal').style.display = 'none';
}

// Favorite operations
function toggleFav(iconWrapper) {
    const icon = iconWrapper.querySelector("i");
    const card = iconWrapper.closest(".cocktail-card");
    const id = card.getAttribute("data-id");
    let favorites = getFavorites();

    if (favorites.includes(id)) {
        favorites = favorites.filter(i => i !== id);
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
        iconWrapper.classList.remove("favorited");
    } else {
        favorites.push(id);
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        iconWrapper.classList.add("favorited");
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites")) || [];
}

// Filter panel open/close
function toggleBaseFilter() {
    const panel = document.getElementById("baseFilterPanel");
    panel.classList.toggle("visible");
}

// Favorite view toggle
function toggleFavoriteView() {
    favoriteMode = !favoriteMode;
    const btn = document.getElementById("favToggleBtn");
    btn.classList.toggle("active", favoriteMode);
    applyAllFilters();
}

// Apply all filters
function applyAllFilters() {
    const checkboxes = document.querySelectorAll("#baseFilterPanel input[type='checkbox']");
    activeBases = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const favs = getFavorites();

    let filtered = allCocktails;

    if (activeBases.length > 0) {
        filtered = filtered.filter(c => activeBases.includes(c.base));
    }

    if (favoriteMode) {
        filtered = filtered.filter(c => favs.includes(c.id));
    }

    filteredCocktails = filtered;
    currentPage = 1;
    renderCocktails(filteredCocktails);
}

// Clean filter
function clearBaseFilter() {
    document.querySelectorAll("#baseFilterPanel input[type='checkbox']").forEach(cb => cb.checked = false);
    activeBases = [];
    favoriteMode = false;
    document.getElementById("favToggleBtn").classList.remove("active");
    filteredCocktails = allCocktails;
    currentPage = 1;
    renderCocktails(filteredCocktails);
}

// Search box
const searchInput = document.getElementById("cocktailSearch");
searchInput.addEventListener("keyup", () => {
    const query = searchInput.value.toLowerCase();
    let filtered = allCocktails.filter(c => c.name.toLowerCase().includes(query));

    if (activeBases.length > 0) {
        filtered = filtered.filter(c => activeBases.includes(c.base));
    }

    if (favoriteMode) {
        const favs = getFavorites();
        filtered = filtered.filter(c => favs.includes(c.id));
    }

    filteredCocktails = filtered;
    currentPage = 1;
    renderCocktails(filteredCocktails);
});
