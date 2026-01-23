import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { ordersApi } from "../api/ordersApi.js";
import { offersApi } from "../api/offersApi.js";
import { calculateOrderPrice } from "../domain/utils.js";
import { getOrderStatusLabel, ORDER_STATUS } from "../data/constants.js" 
import { getCurrentUser, initAuth, isAuthenticated } from "../state/authState.js";
import { formatCents } from "../domain/utils.js";
// import { orderState } from "../state/orderState.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

async function loadProfile() {
  await initAuth();
  if (!isAuthenticated())
  {
    window.location.replace("./login.html");
  }
  const userEmail = getCurrentUser()?.email;

  const [orders, offers] = await Promise.all([
    ordersApi.getUserOrders(userEmail),
    offersApi.getAllOffers(userEmail),
  ]);

  renderOrders(orders);
  renderOffers(offers.personalOffers);
}

function renderOrders(orders) {
  const ordersContainer = document.getElementById("ordersContainer");

  ordersContainer.innerHTML = "";

  if (!orders || orders.length === 0) {
    ordersContainer.innerHTML = `<p class="text-muted">No orders yet</p>`;
    return;
  }

  orders.forEach(order => {
    ordersContainer.appendChild(renderOrderCard(order));
  });
}

function renderOrderCard(order) {
  const card = document.createElement("div");
  card.className = "card mb-2";

  card.innerHTML = `
    ${renderOrderHeader(order)}
    ${renderOrderBody(order)}
  `;

  bindOrderCardEvents(card, order);
  return card;
}

function renderOrderHeader(order) {
  return `
    <div class="card-header d-flex justify-content-between align-items-center cursor-pointer">
      <span>
        Order #${order.id}
      </span>
      <span class="badge bg-secondary">
        ${getOrderStatusLabel(order.status)}
      </span>
    </div>
  `;
}

function renderOrderBody(order) {
  return `
    <div class="card-body d-none">
      ${renderOrderItems(order.items)}
      <hr />
      <strong>Total: $${formatCents(calculateOrderPrice(order))}</strong>
      <div class="mt-2">
        ${renderOrderActions(order)}
      </div>
    </div>
  `;
}

function renderOrderItems(items) {
  return items.map(i => `
    <p class="mb-1">
      ${i.productTitle} × ${i.quantity}
      <span class="float-end">$${formatCents(i.productPrice)}</span>
    </p>
  `).join("");
}

function renderOrderActions(order) {
  if (order.status !== ORDER_STATUS.DELIVERED) return "";

  return `
    <button class="btn btn-sm btn-success confirm-receipt">
      Confirm receipt
    </button>
  `;
}

function bindOrderCardEvents(card, order) {
  const header = card.querySelector(".card-header");
  const body = card.querySelector(".card-body");

  header.onclick = () => {
    body.classList.toggle("d-none");
  };

  const confirmBtn = card.querySelector(".confirm-receipt");
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      // TODO:
      // await ordersApi.confirmReceipt(order.id)
      // orderState.update(order)
      alert("Receipt confirmed (TODO)");
    };
  }
}


function renderOffers(offers) {
  const offersContainer = document.getElementById("offersContainer");

  offersContainer.innerHTML = "";

  if (!offers || offers.length === 0) {
    offersContainer.innerHTML = `<p class="text-muted">No offers</p>`;
    return;
  }

  offers.forEach(offer => {
    offersContainer.appendChild(renderOfferCard(offer));
  });
}

function renderOfferCard(offer) {
  const div = document.createElement("div");
  div.className = "card mb-2";

  const isUsed = offer.isUsed;
  const isActivated = offer.isActivated;

  div.classList.toggle("opacity-50", isUsed);

  div.innerHTML = `
    <div class="card-body d-flex justify-content-between align-items-center">
      <div>
        <strong>${offer.code}</strong>

        <span class="badge bg-success ms-2">
          ${offer.discountPercent}% OFF
        </span>

        <div class="small text-muted mt-1">
          ${offer.description ?? ""}
        </div>
      </div>

      <div>
        ${
          isUsed
            ? `<span class="badge bg-secondary">Used</span>`
            : isActivated
              ? `<span class="badge bg-primary">Activated</span>`
              : `<button class="btn btn-sm btn-outline-success activate-offer">
                   Activate
                 </button>`
        }
      </div>
    </div>
  `;

  if (!isUsed && !isActivated) {
    const btn = div.querySelector(".activate-offer");
    btn.onclick = async () => {
      // TODO:
      // await offersApi.activateOffer(offer.offerId)
      // offerState.update(...)
      alert("Offer activated (TODO)");
    };
  }

  return div;
}

// TODO:
// orderState.subscribe(renderOrders)

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
