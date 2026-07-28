// src/api/ordersApi.js
import { apiFetch, currentUserEmail } from "../domain/utils.js";
import { ENDPOINTS } from "../data/constants.js";

export const ordersApi = {
  async getUserOrders(showHidden = false) {
    return apiFetch(
      `${ENDPOINTS.ORDERS}?userEmail=${encodeURIComponent(currentUserEmail())}&showHidden=${showHidden}`
    );
  },

  async createOrder() {
    return apiFetch(`${ENDPOINTS.ORDERS}/create?userEmail=${encodeURIComponent(currentUserEmail())}`, {
      method: "POST"
    });
  },

  async confirmReceipt(orderId) {
    return apiFetch(`${ENDPOINTS.ORDERS}/${orderId}/confirm`, {
      method: "POST"
    });
  },

  async cancelOrder(orderId) {
    return apiFetch(`${ENDPOINTS.ORDERS}/${orderId}/cancel`, {
      method: "POST"
    });
  },

  async deleteOrder(orderId) {
    return apiFetch(`${ENDPOINTS.ORDERS}/${orderId}/delete`, {
      method: "POST"
    });
  }
}