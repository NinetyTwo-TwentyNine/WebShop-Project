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
  let product;
  try {
    [product,] = await Promise.all([
      productsApi.getProductById(productId),
      initAuth()
    ]);
  } catch (e) {
    alert("Product not found.");
    window.location.href = "./home.html";
    return;
  }

  let offers;
  if (isAuthenticated()) {
    [offers,] = await Promise.all([
      offersApi.getApplicableOffers(productId),
      cartApi.initializeUserCart()
    ]);
  } else {
    offers = await offersApi.getApplicableOffers(productId);
  }
  renderProduct(product, offers);

  bindAllOfferActions();
}

function renderProduct(product, offersInfo) {
  const container = document.getElementById("productContainer");
  container.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        ${renderProductImage(product)}
      </div>
      <div class="col-md-7">
        ${renderProductInfo(product, offersInfo)}
        ${renderAddToCartButton(product)}
        <hr />
        ${renderOffersSection(offersInfo)}
      </div>
    </div>
  `;

  bindProductActions(product, offersInfo);
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

function renderProductInfo(product, offersInfo) {
  return `
    <h3>${product.title}</h3>

    <p class="text-muted">
      ${product.description}
    </p>

    ${renderPriceSection(product.price, offersInfo.discountedPrice)}
    ${renderOfferSummary(offersInfo.globalOffers.length, offersInfo.activePersonal.length, offersInfo.availablePersonal.length)}

    <p>
      <strong>Stock:</strong>
        <span class="${product.stock === 0 ? "text-danger" : ""}">
          ${product.stock}
        </span>
    </p>
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

function renderOffersSection(offersInfo) {
  const globalOffers = offersInfo.globalOffers, activePersonal = offersInfo.activePersonal, availablePersonal = offersInfo.availablePersonal;
  const personalOffers = [...activePersonal, ...availablePersonal];

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
          ${globalOffers.map(o => renderOfferItem(o, 'global')).join("")}
        </ul>
      </div>
    ` : ""}

    ${personalOffers.length > 0 ? `
      <div>
        <div class="fw-semibold mb-1">Personal offers</div>
        <ul class="list-group">
          ${personalOffers.map(o => renderOfferItem(o, activePersonal.includes(o) ? 'active': 'available')).join("")}
        </ul>
      </div>
    ` : ""}
  `;
}

function renderOfferItem(offer, mode) {
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
          (() => {
            switch (mode) {
              case 'global':
                return  `<span class="badge bg-secondary">
                          Auto applied
                        </span>`;
              case 'active':
                return   `<span class="badge bg-success">
                          Activated
                        </span>`;
              case 'available':
                return  `<button
                          class="btn btn-sm btn-outline-primary activate-offer" data-id="${offer.id}">
                          Activate
                        </button>`;
              default:
                return ``;
            }
          })()
        }

      </div>
    </li>
  `;
}

function bindProductActions(product, offers) {
  const addBtn = document.getElementById("addToCartBtn");
  if (!addBtn) return;

  let isInCart = false;
  if (isAuthenticated()) {
    const cart = cartApi.getCurrentUserCart();
    isInCart = cart?.items.some(i => i.productId == product.id);
  }

  if (isInCart) {
    addBtn.textContent = "Go to cart";
    addBtn.classList.remove("btn-primary");
    addBtn.classList.add("btn-warning");

    addBtn.onclick = () => {
      window.location.href = "./cart.html";
    };

    return;
  }

  addBtn.onclick = async () => {
    if (!isAuthenticated()) {
      window.location.href = "./login.html";
      return;
    }

    addBtn.disabled = true;
    let newProduct = product, newOffers = offers;

    await tryFunction("Added to cart.", "Failed to add to cart", async () => {
        await cartApi.addToCart(product.id);

        [newProduct, newOffers] = await Promise.all([
          productsApi.getProductById(product.id),
          offersApi.getApplicableOffers(product.id)
        ]);
      }
    );

    renderProduct(newProduct, newOffers);
  };

  addBtn.disabled = false;
}

function bindAllOfferActions() {
  document.querySelectorAll(".activate-offer").forEach(button => {
    button.onclick = async () => {
      await tryFunction("Offer activated.", "Failed to activate offer", async () => {
        await offersApi.activateOffer(Number(button.dataset.id), true);
        loadProduct();
      });
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadProduct();
});
