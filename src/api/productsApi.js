// src/api/productsApi.js
import { apiFetch, currentUserEmail } from "../domain/utils.js";
import { ENDPOINTS } from "../data/constants.js";

export const productsApi = {
  async getAllProducts() {
    return await apiFetch(`${ENDPOINTS.PRODUCTS}/all`);
  },

  async getProductById(productId) {
    return await apiFetch(`${ENDPOINTS.PRODUCTS}/${productId}`);
  },

  async getProductsByIds(productIds = []) {
    const params = new URLSearchParams();
    productIds.forEach(id => params.append("ids", id));

    return await apiFetch(`${ENDPOINTS.PRODUCTS}?${params.toString()}`);
  },

  async getFilteredProducts(search = "", sort = "NEWEST", page = 1, pageSize = PRODUCTS_PAGE_SIZE, categories = []) {
    const params = new URLSearchParams();

    if (search)
      params.append("search", search);

    params.append("sort", sort);
    params.append("page", page);
    params.append("pageSize", pageSize);

    categories.forEach(id => params.append("categories", id));

    return await apiFetch(`${ENDPOINTS.PRODUCTS}/filter?${params.toString()}`);
  },

  async getFeaturedProductsByCategory() {
    return await apiFetch(`${ENDPOINTS.PRODUCTS}/featured`);
  }
};
