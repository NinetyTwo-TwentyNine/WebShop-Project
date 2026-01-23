import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { cartApi } from "../api/cartApi.js";
import { offersApi } from "../api/offersApi.js";
import { ordersApi } from "../api/ordersApi.js";
import { productsApi } from "../api/productsApi.js";
import { initAuth, isAuthenticated, getCurrentUser } from "../state/authState.js";
import { formatCents, applyDiscounts } from "../domain/utils.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

async function loadCart() {
  await initAuth();
  if (!isAuthenticated())
  {
    window.location.replace("./login.html");
  }
  const userEmail = getCurrentUser()?.email;

  const [cart, allProducts, allUserOffers] = await Promise.all([
    cartApi.getUserCart(userEmail),
    productsApi.getAllProducts(),
    offersApi.getAllOffers(userEmail),
  ]);
  renderCart(cart, allProducts, allUserOffers);
}

async function renderCart(cart, allProducts, allUserOffers) {
  const container = document.getElementById("cartItems");
  const totalPriceEl = document.getElementById("totalPrice");
  const clearBtn = document.getElementById("clearCartBtn");
  const purchaseBtn = document.getElementById("purchaseBtn");

  container.innerHTML = "";
  let total = 0;

  cart.items.forEach(item => {
    const products = allProducts.filter(
      product => Number(product.id) === Number(item.productId)
    );
    if (products) {
      const product = products[0];

      const globalOffers = offersApi.filterOffersByProduct(allUserOffers.globalOffers, product);
      const personalOffers = offersApi.filterOffersByProduct(allUserOffers.personalOffers, product);

      const activatedPersonalOffers = personalOffers.filter(o => o.isActivated && !o.isUsed);

      const allDiscounts = [
        ...globalOffers,
        ...activatedPersonalOffers
      ];

      // --- PRICE CALC ---
      const discountedUnitPrice = applyDiscounts(
        product.price,
        allDiscounts
      );
      
      const itemTotal = discountedUnitPrice * item.quantity;
      total += itemTotal;

      const div = document.createElement("div");
      div.className = "card mb-2";
      div.innerHTML = `
      <div class="card-body d-flex gap-3 align-items-start">
          <a href="./product.html?id=${product.id}">
            <img
              src="${product.imageUrl}"
              alt="${product.title}"
              class="rounded"
              style="width: 80px; height: 80px; object-fit: cover;"
            />
          </a>

          <div class="flex-grow-1">
            <h6 class="mb-1">${product.title}</h6>

            <p class="mb-1 small text-muted">
              $${formatCents(discountedUnitPrice)} × ${item.quantity}
            </p>

            ${
              allDiscounts.length > 0
                ? `<div class="small text-success">
                    Discounts applied:
                    ${allDiscounts.map(o => o.code).join(", ")}
                  </div>`
                : ""
            }

            <div class="mt-2">
              <button class="btn btn-sm btn-secondary minus">−</button>
              <button class="btn btn-sm btn-secondary plus">+</button>
              <button class="btn btn-sm btn-danger remove">🗑</button>
            </div>
          </div>

          <div class="text-end fw-semibold">
            $${formatCents(itemTotal)}
          </div>
        </div>
      `;

      div.querySelector(".minus").onclick = () =>
        cartApi.updateQuantity(product.id, item.quantity - 1);

      div.querySelector(".plus").onclick = () =>
        cartApi.updateQuantity(product.id, item.quantity + 1);

      div.querySelector(".remove").onclick = () =>
        cartApi.removeItem(product.id);

      // TODO: load and bind applicable offers here

      container.appendChild(div);
    }
    else {
      cartApi.removeItem(item.productId);
    }
  });

  totalPriceEl.textContent = formatCents(total);


  clearBtn.onclick = () => {
    cartApi.clearCart();
    loadCart();
  };

  purchaseBtn.onclick = async () => {
    // TODO:
    // 1. Apply offers
    // 2. Call ordersApi.createOrder()
    // 3. Clear cart
  };

  clearBtn.disabled = cart.items.length === 0;
  purchaseBtn.disabled = cart.items.length === 0;
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});
