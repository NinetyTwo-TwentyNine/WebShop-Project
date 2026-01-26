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

export async function createNewUserCart(userEmail, allCarts) {
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
    return Math.round(price * (100 - offer.discountPercent) / 100);
  }, basePriceCents);
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

export async function tryFunction(successMessage, failureMessage, func) {
  try {
    const result = await func();
    if (successMessage != null && successMessage != "") {
      alert(successMessage);
    }
  } catch (error) {
    if (failureMessage != null && failureMessage != "") {
      alert(`${failureMessage}: ${error.message}`);
    }
  }
}