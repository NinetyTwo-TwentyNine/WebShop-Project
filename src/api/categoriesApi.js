// src/api/categoriesApi.js
import { apiFetch } from "../domain/utils.js";
import { ENDPOINTS } from "../data/constants.js";

export const categoriesApi = {
  async getAllCategories() {
    return await apiFetch(ENDPOINTS.CATEGORIES);
  }
};