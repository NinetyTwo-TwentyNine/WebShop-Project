export const APP_NAME_MAIN = "WebShop"

export const PASSWORD_LENGTH_MIN = 8;

export const PRODUCTS_PAGE_SIZE = 12;

export const ORDER_STATUS = {
    CREATED: 0,
    SHIPPED: 1,
    DELIVERED: 2,
    RECEIVED: 3,
    CANCELED: 4
};

export const ORDER_STATUS_NEW_DAY_COUNT = 14

export const ORDER_TRANSITION_TIME = {
  [ORDER_STATUS.CREATED]: 60_000,
  [ORDER_STATUS.SHIPPED]: 60_000,
};

export const ORDER_SYNC_INTERVAL = 30000;
export const OFFER_SYNC_INTERVAL = 30000;


export const DB_COLLECTION_NAME_CARTS = "carts";
export const DB_COLLECTION_NAME_CARTITEMS = "cartItems";
export const DB_COLLECTION_NAME_ORDERS = "orders";
export const DB_COLLECTION_NAME_ORDERITEMS = "orderItems";
export const DB_COLLECTION_NAME_PRODUCTS = "products";
export const DB_COLLECTION_NAME_CATEGORIES = "categories";
export const DB_COLLECTION_NAME_OFFERS = "offers";
export const DB_COLLECTION_NAME_USEROFFERS = "userOffers";
