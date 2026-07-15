import {createNavbar} from "./layout/navbar.js";
import {createFooter} from "./layout/footer.js";

import {productsApi} from "../api/productsApi.js";
import {categoriesApi} from "../api/categoriesApi.js";

import {formatCents} from "../domain/utils.js";
import { PRODUCTS_PAGE_SIZE } from "../data/constants.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());


document.addEventListener("DOMContentLoaded", loadPage);

async function loadPage() {
    const params = new URLSearchParams(window.location.search);    
    const search = params.get("search") ?? "";
    const sort = params.get("sort") ?? "newest";
    const page = Number(params.get("page") ?? 1);
    const categories = (params.get("category") ?? "").split(",").filter(Boolean);

    const [products, allCategories] = await Promise.all([
        productsApi.getFilteredProducts({search, sort, page, pageSize: PRODUCTS_PAGE_SIZE, categories}),
        categoriesApi.getAllCategories()
    ]);

    renderFilters(allCategories, search, sort, categories);

    renderProducts(products.items);

    renderPagination(products.page, products.totalPages);
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

        <input
        class="form-check-input categoryCheck"
        type="checkbox"
        value="${c.id}"

        ${selected.includes(String(c.id))
        ? "checked"
        : ""}

        >

        ${c.name}

        </label>
    `).join("");
}

function renderProducts(products) {
    const container = document.getElementById("productsContainer");

    container.innerHTML = products.map(renderProductCard).join("");
}

function renderProductCard(product) {
    const isNew = Date.now() - product.createdAt < 14 * 24 * 60 * 60 * 1000;

    return `
        <div class="col-md-4">

        <div class="card h-100">

        <img
        src="${product.imageUrl}"
        class="card-img-top">

        <div class="card-body">

        ${
        isNew
        ?
        '<span class="badge bg-success mb-2">NEW</span>'
        :
        ''
        }

        <h5>

        ${product.title}

        </h5>

        <p>

        ${formatCents(product.price)}

        </p>

        <p>

        Stock:
        ${product.stock}

        </p>

        <a

        class="btn btn-primary"

        href="./product.html?id=${product.id}"

        >

        View

        </a>

        </div>

        </div>

        </div>
    `;
}

function renderPagination(current, total) {
    const container = document.getElementById("pagination");

    let html = "";

    for (let i = 1; i <= total; i++) {
        html += `
            <button
            class="btn ${
            i===current
            ?
            "btn-primary"
            :
            "btn-outline-primary"
            }
            mx-1"

            data-page="${i}"

            >

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
            const selected = [...document.querySelectorAll(".categoryCheck:checked")].map(c=>c.value);
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
