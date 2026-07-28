export const APP_NAME_MAIN = "WebShop";

export const API_BASE = "http://localhost:8080/api";

export const ENDPOINTS = {
  PRODUCTS: `${API_BASE}/products`,
  CATEGORIES: `${API_BASE}/categories`,
  CART: `${API_BASE}/cart`,
  OFFERS: `${API_BASE}/offers`,
  ORDERS: `${API_BASE}/orders`,
};

export const PASSWORD_LENGTH_MIN = 8;

export const PRODUCTS_PAGE_SIZE = 12;

export const ORDER_STATUS = {
    CREATED: "CREATED",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    RECEIVED: "RECEIVED",
    CANCELED: "CANCELED"
};

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const ORDER_STATUS_NEW_DAY_COUNT = 14;

export const ORDER_SYNC_INTERVAL = 30000;
export const OFFER_SYNC_INTERVAL = 30000;
