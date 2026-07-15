import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { ordersApi } from "../api/ordersApi.js";
import { offersApi } from "../api/offersApi.js";
import { calculateOrderPrice, tryFunction, formatCents, getOrderStatusLabel } from "../domain/utils.js";
import { ORDER_STATUS } from "../data/constants.js" 
import { getCurrentUser, initAuth, isAuthenticated } from "../state/authState.js";
import { subscribeOrders } from "../state/orderState.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

let currentOrders = [], globalOffers = [], personalOffers = [], userOfferLinks = [];

async function loadProfile() {
  await initAuth();
  if (!isAuthenticated())
  {
    window.location.replace("./login.html");
  }
  const userEmail = getCurrentUser()?.email;

  let currentOffers;
  [currentOrders, currentOffers] = await Promise.all([
    ordersApi.getUserOrders(userEmail),
    offersApi.getAllOffers(userEmail),
  ]);
  globalOffers = currentOffers.globalOffers;
  personalOffers = currentOffers.personalOffers;
  userOfferLinks = currentOffers.userOfferLinks;

  renderOrders(currentOrders);
  renderOffers(personalOffers, userOfferLinks);
}

function renderOrders(orders) {
  currentOrders = orders;

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
      await ordersApi.confirmReceipt(order.id);
      alert("Receipt confirmed.");
    };
  }
}


function renderOffers(offers, links) {
  const offersContainer = document.getElementById("offersContainer");

  offersContainer.innerHTML = "";

  if (!offers || offers.length === 0 || !links || links.length === 0) {
    offersContainer.innerHTML = `<p class="text-muted">No offers</p>`;
    return;
  }

  offers.forEach(offer => {
    const offerLink = links.find(l => l.offerId == offer.id);
    if (!offerLink) {
      return;
    }
    offersContainer.appendChild(renderOfferCard(offer, offerLink));
  });
}

function renderOfferCard(offer, offerLink) {
  const div = document.createElement("div");
  div.className = "card mb-2";

  const isUsed = offerLink.isUsed;
  const isActivated = offerLink.isActivated;

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
      const offerToActivate = await tryFunction("Offer activated", "Failed to activate offer", async () => {
        return await offersApi.activateOffer(getCurrentUser().email, offer.id);
      });
      if (offerToActivate) {
        for (let i = 0; i < userOfferLinks.length; i++) {
          if (userOfferLinks[i].offerId === offerToActivate.offerId) {
            userOfferLinks[i] = offerToActivate;
            break;
          }
        }
      }
      renderOffers(personalOffers, userOfferLinks);
    };
  }

  return div;
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  subscribeOrders(renderOrders);
});

// TODO: fix the order received button
// TODO: show if the offer is activated