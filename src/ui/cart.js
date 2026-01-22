import { renderNavbar } from "../layout/navbar.js";
import { renderFooter } from "../layout/footer.js";
import { cartApi } from "../../api/cartApi.js";
import { offersApi } from "../../api/offersApi.js";
import { ordersApi } from "../../api/ordersApi.js";

renderNavbar();
renderFooter();

const container = document.getElementById("cartItems");
const totalPriceEl = document.getElementById("totalPrice");
const clearBtn = document.getElementById("clearCartBtn");
const purchaseBtn = document.getElementById("purchaseBtn");

async function loadCart() {
  const cart = await cartApi.getCart();
  renderCart(cart);
}

function renderCart(cart) {
  container.innerHTML = "";
  let total = 0;

  cart.items.forEach(item => {
    const itemTotal = item.product.price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.className = "card mb-2";
    div.innerHTML = `
      <div class="card-body">
        <h5>${item.product.title}</h5>
        <p>$${item.product.price} × ${item.quantity} = $${itemTotal}</p>

        <button class="btn btn-sm btn-secondary minus">−</button>
        <button class="btn btn-sm btn-secondary plus">+</button>
        <button class="btn btn-sm btn-danger remove">🗑</button>

        <select class="form-select mt-2 offerSelect"></select>
      </div>
    `;

    div.querySelector(".minus").onclick = () =>
      cartApi.updateQuantity(item.product.id, item.quantity - 1);

    div.querySelector(".plus").onclick = () =>
      cartApi.updateQuantity(item.product.id, item.quantity + 1);

    div.querySelector(".remove").onclick = () =>
      cartApi.removeProduct(item.product.id);

    // TODO: load and bind applicable offers here

    container.appendChild(div);
  });

  totalPriceEl.textContent = total.toFixed(2);

  clearBtn.disabled = cart.items.length === 0;
  purchaseBtn.disabled = cart.items.length === 0;
}

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

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  loadCart();
});
