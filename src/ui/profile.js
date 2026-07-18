import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";
import { ordersApi } from "../api/ordersApi.js";
import { offersApi } from "../api/offersApi.js";
import { calculateOrderPrice, tryFunction, formatCents, getOrderStatusLabel, advanceOrder, isOrderFinished, formatDate } from "../domain/utils.js";
import { ORDER_STATUS } from "../data/constants.js" 
import { getCurrentUser, initAuth, isAuthenticated } from "../state/authState.js";
import { startOrderSync, subscribeOrders } from "../state/orderState.js";

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

  [{personalOffers, globalOffers, userOfferLinks},] = await Promise.all([
    offersApi.getAllOffers(userEmail),
    startOrderSync(userEmail)
  ]);

  renderOffers(personalOffers, userOfferLinks);
  subscribeOrders((newOrders) => {
    const scrollY = window.scrollY;
    renderOrders(newOrders);
    window.scrollTo({top: scrollY});
  });
}

const expandedOrders = new Set();

function renderOrders(orders) {
  currentOrders = orders;
  currentOrders.sort((a, b) => {return a.id - b.id});

  expandedOrders.clear();
  document.querySelectorAll("[data-order-id]").forEach(card => {
    const body = card.querySelector(".card-body");
    if (body && !body.classList.contains("d-none")) {
      expandedOrders.add(card.dataset.orderId);
    }
  });

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  if (!orders.length) {
    container.innerHTML =
      `<p class="text-muted">No orders yet</p>`;
    return;
  }

  orders.forEach(order => {
    const card = renderOrderCard(order);
    card.dataset.orderId = order.id;

    if (expandedOrders.has(String(order.id))) {
      card.querySelector(".card-body").classList.remove("d-none");
    }

    container.appendChild(card);
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
      <div class="d-flex align-items-center gap-3">
        <span class="fw-semibold">
          Order #${order.id}
        </span>

        <span class="small text-muted">
          Created: ${formatDate(order.createdAt)}
        </span>
      </div>

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

      <div class="mt-2 d-flex justify-content-between align-items-center">
        <div>
          ${renderOrderActions(order)}
        </div>

        <div class="text-muted small">
          ${isOrderFinished(order) ? `Finished: ${formatDate(order.updatedAt)}` : ``}
        </div>
      </div>
    </div>
  `;
}

function renderOrderItems(items) {
  return items.map(i => `
    <p class="mb-1">
      <span class="fw-semibold text-body-emphasis">
        ${i.productTitle}
      </span>
      × ${i.quantity}
      <span class="float-end">$${formatCents(i.productPrice)}</span>
    </p>
  `).join("");
}

function renderOrderActions(order) {
  const buttons = [];

  if (order.status === ORDER_STATUS.CREATED) {
    buttons.push(`
      <button
        class="btn btn-sm btn-outline-danger cancel-order">
        Cancel order
      </button>
    `);
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    buttons.push(`
      <button
        class="btn btn-sm btn-success confirm-receipt">
        Confirm receipt
      </button>
    `);
  }

  if (order.status === ORDER_STATUS.RECEIVED || order.status === ORDER_STATUS.CANCELED) {
    buttons.push(`
      <button
        class="btn btn-sm btn-outline-secondary delete-order">
        Delete
      </button>
    `);
  }

  return buttons.join(" ");
}

function bindOrderCardEvents(card, order) {
  const header = card.querySelector(".card-header");
  const body = card.querySelector(".card-body");

  header.onclick = () => {
    body.classList.toggle("d-none");
  };

  async function updateOrdersDisplay(order, update_or_delete) {
    if (order) {
      if (update_or_delete) {
        for(let i = 0; i < currentOrders.length; i++) {
          if (currentOrders[i].id === order.id) {
            currentOrders[i] = order;
            break;
          }
        }
      } else {
        currentOrders = currentOrders.filter(o => o.id != order.id);
      }
      renderOrders(currentOrders);
    }
  }

  const confirmBtn = card.querySelector(".confirm-receipt");
  const cancelBtn = card.querySelector(".cancel-order");
  const deleteBtn = card.querySelector(".delete-order");

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      const updatedOrder = await tryFunction("Receipt confirmed.", "Failed to confirm receipt", async () => {
        return await ordersApi.confirmReceipt(order.id);
      });
      updateOrdersDisplay(updatedOrder, true);
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = async () => {
      const updatedOrder = await tryFunction("Order canceled.", "Failed to cancel order", async () => {
        return await ordersApi.cancelOrder(order.id);
      });
      updateOrdersDisplay(updatedOrder, true);
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const updatedOrder = await tryFunction("Order deleted.", "Failed to delete order", async () => {
        return await ordersApi.deleteOrder(order.id);
      });
      updateOrdersDisplay(updatedOrder, false);
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
            ? `
              <button class="btn btn-sm btn-outline-secondary delete-offer">
                Delete
              </button>
            `
            : isActivated
              ? `
                <button class="btn btn-sm btn-warning deactivate-offer">
                  Deactivate
                </button>
              `
              : `
                <button class="btn btn-sm btn-success activate-offer">
                  Activate
                </button>
              `
        }
      </div>
    </div>
  `;

  bindOfferCardEvents(offer, div);

  return div;
}

function bindOfferCardEvents(offer, div) {
  const activateBtn = div.querySelector(".activate-offer");
  const deactivateBtn = div.querySelector(".deactivate-offer");
  const deleteBtn = div.querySelector(".delete-offer");

  async function updateOffersDisplay(offerLink, update_or_delete) {
    if (offerLink) {
      if (update_or_delete) {
        for (let i = 0; i < userOfferLinks.length; i++) {
          if (userOfferLinks[i].offerId === offerLink.offerId) {
            userOfferLinks[i] = offerLink;
            break;
          }
        }
      } else {
        userOfferLinks = userOfferLinks.filter(l => l.offerId != offerLink.offerId);
        personalOffers = personalOffers.filter(o => o.id != offerLink.offerId);
      }
      renderOffers(personalOffers, userOfferLinks);
    }
  }

  if (activateBtn) {
    activateBtn.onclick = async () => {
      const activatedOffer = await tryFunction("Offer activated.", "Failed to activate offer", async () => {
        return await offersApi.activateOffer(getCurrentUser().email, offer.id, true);
      });
      updateOffersDisplay(activatedOffer, true);
    };
  }

  if (deactivateBtn) {
    deactivateBtn.onclick = async () => {
      const deactivatedOffer = await tryFunction("Offer deactivated.", "Failed to deactivate offer", async () => {
        return await offersApi.activateOffer(getCurrentUser().email, offer.id, false);
      });
      updateOffersDisplay(deactivatedOffer, true);
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const deletedOffer = await tryFunction("Offer deleted.", "Failed to delete offer", async () => {
        return await offersApi.deleteOffer(getCurrentUser().email, offer.id);
      });
      updateOffersDisplay(deletedOffer, false);
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});

// TODO: perhaps add images for the order items