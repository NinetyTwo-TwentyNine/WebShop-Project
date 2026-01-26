// src/api/productsApi.js
import { collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

import { pickRandomProductPerCategory } from "../domain/utils.js";
import { DB_COLLECTION_NAME_PRODUCTS } from "../data/constants.js";

export const productsApi = {
  async getAllProducts() {
    const snapshot = await getDocs(collection(db, DB_COLLECTION_NAME_PRODUCTS));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getProductById(productId, getReference = false) {
    const q = query(
      collection(db, DB_COLLECTION_NAME_PRODUCTS),
      where("id", "==", Number(productId)),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        throw new Error(`Product with this id (${toString(productId)}) doesn't exist.`);
    }

    if (!getReference) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))[0];
    } else {
        return snapshot;
    }
  },

  async checkQuantityUpdate(productId, quantity_change) {
    const productSnap = await this.getProductById(productId, true);
    const product = productSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))[0];
 
    const returnObject = { updateAllowed: !(product.stock + quantity_change < 0), snapshot: productSnap };
    return returnObject;
  },

  async updateProductQuantity(productSnap, quantity_change) {
    const product = productSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))[0];

    const new_quantity = product.stock + quantity_change;
    if (new_quantity < 0) {
        throw new Error("Invalid quantity.");
    }

    const docRef = productSnap.docs[0].ref;
    await updateDoc(docRef, { stock: new_quantity });
  },

  async getFeaturedProductsByCategory() {
    const products = await this.getAllProducts();
    return pickRandomProductPerCategory(products);
  }
};
