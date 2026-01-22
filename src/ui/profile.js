import { renderNavbar } from "../layout/navbar.js";
import { renderFooter } from "../layout/footer.js";
import { ordersApi } from "../../api/ordersApi.js";
import { offersApi } from "../../api/offersApi.js";
// import { orderState } from "../../state/orderState.js";

renderNavbar();
renderFooter();

const ordersContainer = document.getElementById("ordersContainer");
const offersContainer = document.getElementById("offersContainer");

async function loadProfile() {
  const orders = await ordersApi.getOrders();
  const offers = await offersApi.getUserOffers();

  renderOrders(orders);
  renderOffers(offers);
}

function renderOrders(orders) {
  ordersContainer.innerHTML = "";

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "card mb-2";
    card.innerHTML = `
      <div class="card-header">
        Order #${order.id} — ${order.status}
      </div>
      <div class="card-body d-none">
        ${order.items.map(i => `
          <p>${i.productTitle} × ${i.quantity} — $${i.unitPrice}</p>
        `).join("")}
        <strong>Total: $${order.totalPrice}</strong>
        <br />

        ${
          order.status === "DELIVERED"
            ? `<button class="btn btn-sm btn-success confirm">Confirm receipt</button>`
            : ""
        }
      </div>
    `;

    card.querySelector(".card-header").onclick = () => {
      card.querySelector(".card-body").classList.toggle("d-none");
    };

    const confirmBtn = card.querySelector(".confirm");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        // TODO: ordersApi.confirmReceipt(order.id)
      };
    }

    ordersContainer.appendChild(card);
  });
}

function renderOffers(offers) {
  offersContainer.innerHTML = offers.length === 0
    ? "<p>No offers</p>"
    : offers.map(o => `
        <div class="card mb-2">
          <div class="card-body">
            <strong>${o.code}</strong> – ${o.discountPercent}% off
          </div>
        </div>
      `).join("");
}

// TODO:
// orderState.subscribe(renderOrders)

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  loadProfile();
});
