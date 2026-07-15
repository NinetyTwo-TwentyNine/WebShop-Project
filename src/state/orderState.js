import { ordersApi } from "../api/ordersApi.js";
import { ORDER_SYNC_INTERVAL } from "../data/constants.js";

let currentOrders = [];

const listeners = new Set();

let timerId = null;
let currentUserEmail = null;

export function getOrders() {
  return currentOrders;
}

export function setOrders(orders) {
  currentOrders = orders;
  notify();
}

export function subscribeOrders(listener) {
  listeners.add(listener);
  listener(currentOrders); // Immediately render current state
}

export function unsubscribeOrders(listener) {
  listeners.delete(listener);
}


export async function startOrderSync(userEmail) {
  currentUserEmail = userEmail;

  await syncOrders();
  if (timerId)
    return;
  timerId = setInterval(syncOrders, ORDER_SYNC_INTERVAL);
}

export function stopOrderSync() {
  if (!timerId)
    return;

  clearInterval(timerId);
  timerId = null;
  currentUserEmail = null;
}


function notify() {
  listeners.forEach(listener => listener(currentOrders));
}

async function syncOrders() {
  if (!currentUserEmail)
    return;

  const updatedOrders = await ordersApi.syncOrders(currentUserEmail);
  setOrders(updatedOrders);
}