import { offersApi } from "../api/offersApi.js";
import { OFFER_SYNC_INTERVAL } from "../data/constants.js";

let currentOffers = {
  globalOffers: [],
  personalOffers: [],
  userOfferLinks: []
};

let currentUserEmail = null;
let timerId = null;

const listeners = new Set();

export function getOffers() {
  return currentOffers;
}

export function setOffers(offers) {
  currentOffers = offers;
  notify();
}

export function subscribeOffers(listener) {
  listeners.add(listener);
  listener(currentOffers);
}

export function unsubscribeOffers(listener) {
  listeners.delete(listener);
}

export async function startOfferSync(userEmail) {
  currentUserEmail = userEmail;

  await syncOffers();

  if (timerId) return;

  timerId = setInterval(syncOffers, OFFER_SYNC_INTERVAL);
}

export function stopOfferSync() {
  if (!timerId) return;

  clearInterval(timerId);
  timerId = null;
  currentUserEmail = null;
}

export async function refreshOffers() {
  await syncOffers();
}

function notify() {
  listeners.forEach(l => l(currentOffers));
}

async function syncOffers() {
  if (!currentUserEmail) return;

  const offers = await offersApi.getAllOffers(currentUserEmail);
  setOffers(offers);
}