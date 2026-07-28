// =================================
// General purpose functionality
// =================================

import { MS_PER_DAY, ORDER_STATUS, ORDER_STATUS_NEW_DAY_COUNT } from "../data/constants.js";
import { getCurrentUser } from "../state/authState.js";

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

export function currentUserEmail() {
  const email = getCurrentUser()?.email;
  if (!email) {
    throw new Error("User not authenticated.");
  }

  return email;
}

export async function apiFetch(url, options = {}) {
    const response = await fetch(`${url}`, options);

    if (!response.ok) {
        throw new Error(await response.text());
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
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

export function isOrderFinished(order) {
  return order.status === ORDER_STATUS.RECEIVED || order.status === ORDER_STATUS.CANCELED;
}

export function getOrderStatusLabel(status) {
  return Object.keys(ORDER_STATUS)
    .find(key => ORDER_STATUS[key] === status) ?? "UNKNOWN";
}