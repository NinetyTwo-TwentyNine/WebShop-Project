// src/api/productsApi.js
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

import { pickRandomProductPerCategory } from "../domain/utils.js";

export const productsApi = {
  async getAllProducts() {
    const snapshot = await getDocs(collection(db, "products"));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getProductsById(productId) {
    const q = query(
      collection(db, "products"),
      where("id", "==", Number(productId)),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getFeaturedProductsByCategory() {
    const products = await this.getAllProducts();
    return pickRandomProductPerCategory(products);
  }
};
