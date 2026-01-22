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