import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { createProductCard } from "./components/productCard.js";

import { productsApi } from "../api/productsApi.js";
import { categoriesApi } from "../api/categoriesApi.js";
import { initAuth } from "../state/authState.js";

document.getElementById("navbar-root").append(createNavbar());
document.getElementById("footer-root").append(createFooter());

async function loadHomePage() {
  await initAuth();

  const [categories, featuredProducts] = await Promise.all([
    categoriesApi.getAllCategories(),
    productsApi.getFeaturedProductsByCategory(),
  ]);

  renderCategories(categories);
  renderFeaturedProducts(featuredProducts);
}

function renderCategories(categories) {
  const container = document.getElementById("categories");

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary me-2 mb-2";
    btn.textContent = cat.name;

    // navigation logic later
    container.appendChild(btn);
  });
}

function renderFeaturedProducts(products) {
  const container = document.getElementById("featured-products");

  products.forEach(product => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    col.appendChild(createProductCard(product));
    container.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomePage();
});
