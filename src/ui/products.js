import {createNavbar} from "./layout/navbar.js";
import {createFooter} from "./layout/footer.js";

import {productsApi} from "../api/productsApi.js";
import {categoriesApi} from "../api/categoriesApi.js";
import { offersApi } from "../api/offersApi.js";

import {formatCents, isProductNew} from "../domain/utils.js";
import { PRODUCTS_PAGE_SIZE } from "../data/constants.js";
import { getCurrentUser, initAuth } from "../state/authState.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

let products = [], allCategories = [];

async function loadPage() {
  const params = new URLSearchParams(window.location.search);  
  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? document.getElementById("sortSelect").options[0].value;
  const page = Number(params.get("page") ?? 1);
  const categories = (params.get("category") ?? "").split(",").filter(Boolean);

  const [productsData, allCategories,] = await Promise.all([
    productsApi.getFilteredProducts(search, sort, page, PRODUCTS_PAGE_SIZE, categories),
    categoriesApi.getAllCategories(),
    initAuth()
  ]);
  products = productsData.items;

  renderFilters(allCategories, search, sort, categories);
  renderPagination(productsData.page, productsData.totalPages);

  const userEmail = getCurrentUser()?.email;
  const offerMap = await offersApi.getApplicableOffersMap(products.map(i => i.id));
  renderProducts(products, offerMap);
}

function renderFilters(categories, search, sort, selected) {
  document.getElementById("searchInput").value = search;

  document.getElementById("sortSelect").value = sort;

  renderCategoryFilter(categories, selected);

  bindFilterEvents();
}

function renderCategoryFilter(categories, selected) {
  const container = document.getElementById("categoryFilter");

  container.innerHTML = categories.map(c => `
    <label class="form-check">
      <input class="form-check-input categoryCheck" type="checkbox" value="${c.id}"
        ${selected.includes(String(c.id)) ? "checked" : ""}
      >
      ${c.name}
    </label>
  `).join("");
}

function renderProducts(products, offerMap) {
  const container = document.getElementById("productsContainer");

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          <h5>No products found</h5>
          <p class="mb-0">
            Try changing your search or category filters.
          </p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => renderProductCard(product, offerMap[String(product.id)])).join("");
}

function renderProductCard(product, offersInfo) {
  const isNew = isProductNew(product, Date.now());

  return `
    <div class="col-md-4">
    <div class="card h-100">
    
    <img src="${product.imageUrl}" class="card-img-top">
    
    <div class="card-body">
    ${isNew ? '<span class="badge bg-success mb-2">NEW</span>' : ''}
    
    <h5>
      ${product.title}
    </h5>
    
    ${renderPriceSection(product.price, offersInfo.discountedPrice)}
    ${renderOfferSummary(offersInfo.globalOffers.length, offersInfo.activePersonal.length, offersInfo.availablePersonal.length)}

    <p>
      Stock:
      ${product.stock}
    </p>

    <a class="btn btn-primary" href="./product.html?id=${product.id}">
      View
    </a>

    </div>
    </div>
    </div>
  `;
}

function renderPriceSection(originalPrice, finalPrice) {
  if (originalPrice === finalPrice) {
    return `
      <p class="mb-1">
        <strong>$${formatCents(originalPrice)}</strong>
      </p>
    `;
  }

  return `
    <p class="mb-1">
      <span class="text-decoration-line-through text-muted">
        $${formatCents(originalPrice)}
      </span>

      <strong class="text-success ms-2">
        $${formatCents(finalPrice)}
      </strong>
    </p>
  `;
}

function renderOfferSummary(globalCount, personalCount, availableCount) {
  if (globalCount === 0 && personalCount === 0 && availableCount === 0) {
    return "";
  }

  return `
    <small class="text-muted d-block">
      Active:
      ${globalCount} general,
      ${personalCount} personal
    </small>

    ${availableCount > 0 ? `
      <small class="text-primary d-block">
        Available:
        ${availableCount}
      </small>
    `
    : ""}
  `;
}

function renderPagination(current, total) {
  const container = document.getElementById("pagination");

  let html = "";

  for (let i = 1; i <= total; i++) {
    html += `
      <button class="btn ${i===current ? "btn-primary" : "btn-outline-primary"} mx-1" data-page="${i}">
        ${i}
      </button>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll("button").forEach(button => {
    button.onclick = () => {
      updateUrl({page: button.dataset.page});
    };
  });
}

function bindFilterEvents() {
  document.getElementById("searchBtn").onclick = () => {
    updateUrl({search: document.getElementById("searchInput").value, page: 1});
  };

  document.getElementById("sortSelect").onchange = e => {
    updateUrl({sort: e.target.value, page: 1});
  };

  document.querySelectorAll(".categoryCheck").forEach(box => {
    box.onchange = () => {
      const selected = [...document.querySelectorAll(".categoryCheck:checked")].map(c => c.value);
      updateUrl({category: selected.join(","), page: 1});
    };
  });
}

function updateUrl(values) {
  const params = new URLSearchParams(window.location.search);

  Object.entries(values).forEach(([k,v]) => {
    if (v) params.set(k,v);
    else params.delete(k);
  });

  window.location.search = params.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  loadPage();
});
