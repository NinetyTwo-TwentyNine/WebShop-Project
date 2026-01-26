import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { cartApi } from "../api/cartApi.js";
import { offersApi } from "../api/offersApi.js";
import { ordersApi } from "../api/ordersApi.js";
import { productsApi } from "../api/productsApi.js";
import { initAuth, isAuthenticated, getCurrentUser } from "../state/authState.js";
import { formatCents, applyDiscounts, tryFunction } from "../domain/utils.js";

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
    cartApi.initializeUserCart(userEmail),
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

  function activatePanel(activated, minusBtn = null, plusBtn = null, removeBtn = null)
  {
    clearBtn.disabled = !activated || (cart.items.length === 0);
    purchaseBtn.disabled = !activated || (cart.items.length === 0);

    if (minusBtn != null && plusBtn != null && removeBtn != null) {
      minusBtn.disabled = !activated;
      plusBtn.disabled = !activated;
      removeBtn.disabled = !activated;
    }
  }


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

      const minusBtn = div.querySelector(".minus");
      const plusBtn = div.querySelector(".plus");
      const removeBtn = div.querySelector(".remove");

      minusBtn.onclick = async () => {
        activatePanel(false, minusBtn, plusBtn, removeBtn);
        let new_cart = cart;
        await tryFunction("", "Failed to update quantity", async () => {
          new_cart = await cartApi.updateQuantity(product.id, -1);
        });
        renderCart(new_cart, allProducts, allUserOffers);
      };

      plusBtn.addEventListener("click", async () => {
        activatePanel(false, minusBtn, plusBtn, removeBtn);
        let new_cart = cart;
        await tryFunction("", "Failed to update quantity", async () => {
          new_cart = await cartApi.updateQuantity(product.id, 1);
        });
        renderCart(new_cart, allProducts, allUserOffers);
      });

      removeBtn.addEventListener("click", async () => {
        activatePanel(false, minusBtn, plusBtn, removeBtn);
        let new_cart = cart;
        await tryFunction("", "Failed to remove item", async () => {
          new_cart = await cartApi.removeItem(product.id);
        });
        renderCart(new_cart, allProducts, allUserOffers);
      });

      container.appendChild(div);
    }
    else {
      cartApi.removeItem(item.productId);
    }
  });

  totalPriceEl.textContent = formatCents(total);

  async function clearBtnListener() {
    activatePanel(false);
    let new_cart = cart;
    await tryFunction("Cart cleared.", "Failed to clear cart", async () => {
      new_cart = await cartApi.clearCart();
    });
    // TODO: avoid rerendering loop
    renderCart(new_cart, allProducts, allUserOffers);
  }
  clearBtn.addEventListener("click", clearBtnListener);

  purchaseBtn.onclick = async () => {
    // TODO:
    // 1. Apply offers
    // 2. Call ordersApi.createOrder()
    // 3. Clear cart
  };

  activatePanel(true);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});
