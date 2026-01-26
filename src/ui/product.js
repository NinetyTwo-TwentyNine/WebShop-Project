import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { productsApi } from "../api/productsApi.js";
import { offersApi } from "../api/offersApi.js";
import { cartApi } from "../api/cartApi.js";
import { getCurrentUser, initAuth, isAuthenticated } from "../state/authState.js";
import { formatCents, tryFunction } from "../domain/utils.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  alert("Product not found.");
  window.location.href = "./home.html";
}

async function loadProduct() {
  await initAuth();

  let product;
  try {
    product = await productsApi.getProductById(productId);
  } catch (e) {
    alert("Product not found.");
    window.location.href = "./home.html";
    return;
  }

  const userEmail = getCurrentUser()?.email;
  const [offers, _] = await Promise.all([
    offersApi.getApplicableOffers(product, userEmail),
    cartApi.initializeUserCart(userEmail)
  ]);
  renderProduct(product, offers);
}

function renderProduct(product, offers) {
  const container = document.getElementById("productContainer");
  container.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        ${renderProductImage(product)}
      </div>
      <div class="col-md-7">
        ${renderProductInfo(product)}
        ${renderAddToCartButton(product)}
        <hr />
        ${renderOffersSection(offers.globalOffers, offers.personalOffers)}
      </div>
    </div>
  `;

  bindProductActions(product, offers);
}

function renderProductImage(product) {
  return `
    <img 
      src="${product.imageUrl}" 
      class="img-fluid rounded" 
      alt="${product.title}"
    />
  `;
}

function renderProductInfo(product) {
  return `
    <h3>${product.title}</h3>
    <p class="text-muted">${product.description}</p>
    <p><strong>Price:</strong> $${formatCents(product.price)}</p>
    <p>
      <strong>Stock:</strong> 
      <span class="${product.stock === 0 ? "text-danger" : ""}">
        ${product.stock}
      </span>
    </p>
  `;
}

function renderAddToCartButton(product) {
  const disabled = product.stock === 0 ? "disabled" : "";

  return `
    <button 
      id="addToCartBtn" 
      class="btn btn-primary mb-3"
      ${disabled}
    >
      Add to cart
    </button>
  `;
}

function renderOffersSection(globalOffers = [], personalOffers = []) {
  if (globalOffers.length === 0 && personalOffers.length === 0) {
    return `
      <h5>Available offers</h5>
      <p class="text-muted">No available offers</p>
    `;
  }

  return `
    <h5>Available offers</h5>

    ${globalOffers.length > 0 ? `
      <div class="mb-3">
        <div class="fw-semibold mb-1">Global offers</div>
        <ul class="list-group">
          ${globalOffers.map(o => renderOfferItem(o, false)).join("")}
        </ul>
      </div>
    ` : ""}

    ${personalOffers.length > 0 ? `
      <div>
        <div class="fw-semibold mb-1">Personal offers</div>
        <ul class="list-group">
          ${personalOffers.map(o => renderOfferItem(o, true)).join("")}
        </ul>
      </div>
    ` : ""}
  `;
}

function renderOfferItem(offer, isPersonal) {
  return `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <strong>${offer.code}</strong>
        <div class="small text-muted">${offer.description ?? ""}</div>
      </div>

      <div class="text-end">
        <span class="badge bg-success mb-1 d-block">
          ${offer.discountPercent}% OFF
        </span>

        ${
          isPersonal
            ? `<a href="./profile.html" class="btn btn-sm btn-outline-primary">
                 View in profile
               </a>`
            : `<span class="badge bg-secondary">Auto-applied</span>`
        }
      </div>
    </li>
  `;
}

function bindProductActions(product, offers) {
  const addBtn = document.getElementById("addToCartBtn");
  if (!addBtn) return;

  addBtn.onclick = async () => {
    if (!isAuthenticated()) {
      window.location.href = "./login.html";
      return;
    }

    addBtn.disabled = true;
    let new_offers = offers, new_product = product;
    await tryFunction("Added to cart.", "Failed to add to cart", async () => {
      await cartApi.addToCart(product.id);
      [new_product, new_offers] = await Promise.all([
        productsApi.getProductById(productId),
        offersApi.getApplicableOffers(product, getCurrentUser()?.email)
      ]);
    });
    renderProduct(new_product, new_offers);
  };
  addBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  loadProduct();
});