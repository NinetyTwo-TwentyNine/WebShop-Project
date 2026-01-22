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