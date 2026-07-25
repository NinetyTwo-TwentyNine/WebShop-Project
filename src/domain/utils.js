import { MS_PER_DAY, ORDER_STATUS, ORDER_STATUS_NEW_DAY_COUNT, ORDER_TRANSITION_TIME } from "../data/constants.js";

// =================================
// Domain (api) emulation
// =================================

export function pickRandomProductPerCategory(products) {
  const byCategory = new Map();

  products.forEach(p => {
    if (!byCategory.has(p.categoryId)) {
      byCategory.set(p.categoryId, []);
    }
    byCategory.get(p.categoryId).push(p);
  });

  const result = [];

  for (const items of byCategory.values()) {
    const randomIndex = Math.floor(Math.random() * items.length);
    result.push(items[randomIndex]);
  }

  return result;
}

export function createNewUserCart(userEmail, allCarts) {
  if (userEmail == null || userEmail == "")
  {
    throw Error("No proper email was provided.");
  }

  let cartIdList = [];

  allCarts.forEach(c => {
    if (c.userEmail == userEmail) throw Error("Tried to create a duplicate cart.");
    cartIdList.push(Number(c.id));
  });

  let newCartId = 1;
  while (cartIdList.includes(newCartId)) {
    newCartId++;
  }

  return { id: newCartId, userEmail: userEmail };
}

export function applyDiscounts(basePriceCents, offers = []) {
  return offers.reduce((price, offer) => {
    if (!offer.isActive && offer.isGlobal) {
      return price;
    } else {
      return Math.round(price * (100 - offer.discountPercent) / 100);
    }
  }, basePriceCents);
}

export function applyOffers(orderItems = [], productList = [], offers = [], offerLinks = []) {
  const offersToDeactivate = [];

  orderItems.forEach(item => {
    if (!item.productId) {
      throw Error(`Supplied order item doesn't have productId (applyOffers).`);
    }
    const product = productList.find(p => p.id === item.productId);
    if (!product) {
      throw Error(`Product ${item.productId} referenced by an order item was not found.`);
    }

    const applicableOffers = filterOffersByProduct(offers, product), offersToApply = [];
    applicableOffers.forEach(offer => {
      const offerLink = offerLinks.find(l => l.offerId === offer.id);
      if (!offer.isGlobal && !offerLink) {
        throw Error("No user link found for a personal offer (applyOffers).");
      }
      else if (offer.isGlobal || (offerLink.isActivated && !offerLink.isUsed)) {
        offersToApply.push(offer);
        if (!offer.isGlobal && !offersToDeactivate.includes(offerLink)) {
          offersToDeactivate.push(offerLink);
        }
      }
    });

    item.productPrice = applyDiscounts(product.price, offersToApply);
  });

  offersToDeactivate.forEach(l => {
    l.isUsed = true;
    l.isActivated = false;
  })
}

export function filterOffersByProduct(offers, product) {
  return offers.filter(o => {
    if (o.isEntireCategory) {
      return o.affectedId === product.categoryId;
    }
    return o.affectedId === product.id;
  });
}

export function divideOffers(allOffers, userEmail, userOfferSnap) {
  const globalOffers = allOffers.filter(o => o.isGlobal);

  let userOffers = [], userOfferLinks = [];
  if (userEmail) {
    const userOfferIds = userOfferSnap.docs.map(d => d.data().offerId);
    userOffers = allOffers.filter(o => userOfferIds.includes(o.id));

    const actualOfferIds = userOffers.map(o => o.id);
    userOfferLinks = userOfferSnap.docs.map(d => ({docId: d.id, ...d.data()})).filter(l => actualOfferIds.includes(l.offerId));
  }

  return {
    globalOffers: globalOffers,
    personalOffers: userOffers,
    userOfferLinks: userOfferLinks
  };
}

export function createOrderObject(id, userEmail) {
  const now = Date.now();

  return {id, userEmail, status: ORDER_STATUS.CREATED, createdAt: now, updatedAt: now + getTransitionDuration(ORDER_STATUS.CREATED), isHidden: false};
}

export function getNextOrderStatus(status) {
  switch (status) {
    case ORDER_STATUS.CREATED:
        return ORDER_STATUS.SHIPPED;
    case ORDER_STATUS.SHIPPED:
        return ORDER_STATUS.DELIVERED;
    default:
      return status;
  }
}

export function getTransitionDuration(status) {
  return ORDER_TRANSITION_TIME[status] ?? 0;
}

export function shouldAdvanceOrder(order, currentTime) {
  return !isOrderFinished(order) && Number(order.updatedAt) <= currentTime;
}

export function isOrderFinished(order) {
  return order.status === ORDER_STATUS.RECEIVED || order.status === ORDER_STATUS.CANCELED;
}

export function checkItemStockMatch(product, orderItem) {
  return product && orderItem && (product.title === orderItem.productTitle); // In case the initial product was removed, and some other one was created with its id
}

export function advanceOrder(order) {
  const nextStatus = getNextOrderStatus(order.status);

  if (nextStatus === order.status)
    return order;
  order.status = nextStatus;

  if (!isOrderFinished(order)) {
    order.updatedAt = Number(order.updatedAt) + getTransitionDuration(order.status);
  }

  return order;
}

export function cancelOrder(order, currentTime) {
  if (order.status === ORDER_STATUS.CREATED) {
    order.status = ORDER_STATUS.CANCELED;
    order.updatedAt = currentTime;
  }

  return order;
}

export function confirmReceipt(order, currentTime) {
  if (order.status === ORDER_STATUS.DELIVERED) {
    order.status = ORDER_STATUS.RECEIVED;
    order.updatedAt = currentTime;
  }

  return order;
}

export function rollOfferChance(purchaseCount, {minThreshold, maxThreshold, curvePower, maxChance}) {
  let chance;
  if (purchaseCount < minThreshold) {
    chance = 0;
  } else if (purchaseCount >= maxThreshold) {
    chance = maxChance;
  } else {
    const progress = (purchaseCount - minThreshold) / (maxThreshold - minThreshold);
    chance = maxChance * Math.pow(progress, curvePower);
  }

  return (Math.random() < chance / 100);
}

// =================================
// General purpose functionality
// =================================

export function calculateOrderPrice(order)
{
  if (!order || !order.items)
  {
    return null;
  }

  let totalprice = 0;
  order.items.map(i => {
    totalprice += Number(i.productPrice) * Number(i.quantity);
  })
  return totalprice;
}

export function formatCents(cents) {
  return (cents / 100).toFixed(2);
}

export function formatDate(timeStamp) {
  const date = new Date(Number(timeStamp));

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join(".");
}

export function isProductNew(product, currentTime) {
  return (currentTime - product.createdAt) < ORDER_STATUS_NEW_DAY_COUNT * MS_PER_DAY;
}

export function getAvailableUserOffers(offers, activated) {
  if (!offers || !offers.personalOffers || !offers.userOfferLinks) {
    throw new Error(`Supplied with malformed offers object (getAvailableUserOffers): ${JSON.stringify(offers, null, 2)}`);
  }

  return offers.personalOffers.filter(o => {
    const link = offers.userOfferLinks.find(l => l.offerId === o.id);
    return link && (link.isActivated == activated)  && !link.isUsed;
  });
}

export function getUniqueId(objectList)
{
  if (!objectList || objectList.size === 0) {
    return 1;
  }

  const usedIds = new Set();
  for (const obj of objectList) {
    usedIds.add(obj.id);
  }

  let id = 1;
  while (usedIds.has(id)) {
    id++;
  }
  return id;
}

export function uploadFilter(initialObject) {
  if (!initialObject) return null;

  const objectClone = structuredClone(initialObject);
  if ("docId" in objectClone) {
    delete objectClone.docId;
  }
  return objectClone;
}

export async function tryFunction(successMessage, failureMessage, func) {
  try {
    const result = await func();
    if (successMessage != null && successMessage != "") {
      alert(successMessage);
    }
    return result;
  } catch (error) {
    if (failureMessage != null && failureMessage != "") {
      alert(`${failureMessage}: ${error.message}`);
    }
    return null;
  }
}

export function getOrderStatusLabel(status) {
  return Object.keys(ORDER_STATUS)
    .find(key => ORDER_STATUS[key] === status) ?? "UNKNOWN";
}

export function queryChunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}