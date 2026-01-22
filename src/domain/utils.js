// Main domain (api) emulator

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