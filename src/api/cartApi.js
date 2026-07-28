// src/api/cartApi.js
import { apiFetch, currentUserEmail } from "../domain/utils.js";
import { ENDPOINTS } from "../data/constants.js";

let current_user_cart = null;

export const cartApi = {
  getCurrentUserCart() {
    if (current_user_cart == null) {
      throw new Error("Cart not initialized");
    }
    return current_user_cart;
  },

  async initializeUserCart() {
    current_user_cart = await apiFetch(
      `${ENDPOINTS.CART}?userEmail=${encodeURIComponent(currentUserEmail())}`,
      {
        method: "POST"
      }
    );

    return current_user_cart;
  },

  async addToCart(productId) {
    current_user_cart = await apiFetch(
      `${ENDPOINTS.CART}/addItem/${productId}?userEmail=${encodeURIComponent(currentUserEmail())}`,
      {
        method: "POST"
      }
    );

    return current_user_cart;
  },

  async updateQuantity(productId, quantityChange) {
    current_user_cart = await apiFetch(
      `${ENDPOINTS.CART}/updateQuantity/${productId}?userEmail=${encodeURIComponent(currentUserEmail())}&quantityChange=${quantityChange}`,
      {
        method: "POST"
      }
    );

    return current_user_cart;
  },

  async removeItem(productId) {
    current_user_cart = await apiFetch(
      `${ENDPOINTS.CART}/deleteItem/${productId}?userEmail=${encodeURIComponent(currentUserEmail())}`,
      {
        method: "DELETE"
      }
    );

    return current_user_cart;
  },

  async clearCart() {
    current_user_cart = await apiFetch(
      `${ENDPOINTS.CART}/clear?userEmail=${encodeURIComponent(currentUserEmail())}`,
      {
        method: "DELETE"
      }
    );

    return current_user_cart;
  },
};