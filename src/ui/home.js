import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { createProductCard } from "./components/productCard.js";

import { productsApi } from "../api/productsApi.js";
import { categoriesApi } from "../api/categoriesApi.js";
import { initAuth } from "../state/authState.js";
import { APP_NAME_MAIN } from "../data/constants.js";

document.getElementById("navbar-root").append(createNavbar());
document.getElementById("footer-root").append(createFooter());

async function loadHomePage() {
  await initAuth();

  const [categories, featuredProducts] = await Promise.all([
    categoriesApi.getAllCategories(),
    productsApi.getFeaturedProductsByCategory(),
  ]);

  renderCategories(categories);
  renderFeaturedProducts(featuredProducts, categories);
}

function renderCategories(categories) {
  const container = document.getElementById("categories");

  container.className = "row g-4 mb-4";
  container.innerHTML = "";

  categories.forEach(cat => {
    const col = document.createElement("div");
    col.className = "col-md-4 text-center";

    col.innerHTML = `
      <button
        class="btn btn-outline-primary w-100 category-btn"
        data-category="${cat.id}"
      >
        ${cat.name}
      </button>
    `;

    container.appendChild(col);
  });

  container.querySelectorAll(".category-btn").forEach(btn => {
    btn.onclick = () => {
      window.location.href = `./products.html?category=${btn.dataset.category}`;
    };
  });
}

function renderFeaturedProducts(products, categories) {
  const container = document.getElementById("featured-products");
  container.innerHTML = "";

  categories.forEach(cat => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    const product = products.find(p => p.categoryId === cat.id);

    if (product) {
      col.appendChild(createProductCard(product));
    } else {
      col.innerHTML = `<div class="h-100"></div>`;
    }

    container.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.title = `${APP_NAME_MAIN} – Home`;
  loadHomePage();
});
