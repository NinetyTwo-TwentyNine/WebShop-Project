export const PASSWORD_LENGTH_MIN = 8;

export const ORDER_STATUS = {
    CREATED: 0,
    SHIPPED: 1,
    DELIVERED: 2,
    RECEIVED: 3,
    CANCELED: 4
};

export function getOrderStatusLabel(status) {
  return Object.keys(ORDER_STATUS)
    .find(key => ORDER_STATUS[key] === status) ?? "UNKNOWN";
}


export const DB_COLLECTION_NAME_CARTS = "carts";
export const DB_COLLECTION_NAME_CARTITEMS = "cartItems";
export const DB_COLLECTION_NAME_ORDERS = "orders";
export const DB_COLLECTION_NAME_ORDERITEMS = "orderItems";
export const DB_COLLECTION_NAME_PRODUCTS = "products";
export const DB_COLLECTION_NAME_CATEGORIES = "categories";
export const DB_COLLECTION_NAME_OFFERS = "offers";
export const DB_COLLECTION_NAME_USEROFFERS = "userOffers";
