import { formatCents } from "../../domain/utils.js";

export function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "card h-100";

  card.innerHTML = `
    <img src="${product.imageUrl}" class="card-img-top" alt="${product.title}">
    <div class="card-body">
      <h5 class="card-title">${product.title}</h5>
      <p class="card-text">$${formatCents(product.price)}</p>
      <button class="btn btn-primary">View</button>
    </div>
  `;

  const button = card.querySelector("button");
  button.addEventListener("click", () => {
    window.location.href = `product.html?id=${product.id}`;
  });

  return card;
}
