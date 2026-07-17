// src/api/productsApi.js
import { collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

import { pickRandomProductPerCategory } from "../domain/utils.js";
import { DB_COLLECTION_NAME_PRODUCTS } from "../data/constants.js";
import { categoriesApi } from "./categoriesApi.js";

export const productsApi = {
  async getAllProducts() {
    const snapshot = await getDocs(collection(db, DB_COLLECTION_NAME_PRODUCTS));

    return snapshot.docs.map(doc => ({
      docId: doc.id,
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
        throw new Error(`Product with this id (${productId}) doesn't exist.`);
    }

    if (!getReference) {
      return snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }))[0];
    } else {
      return snapshot;
    }
  },

  async getFilteredProducts(search, sort, page, pageSize = PRODUCTS_PAGE_SIZE, categories = []) {
    const [productsSnap, allCategories] = await Promise.all([
      getDocs(collection(db, DB_COLLECTION_NAME_PRODUCTS)),
      categoriesApi.getAllCategories()
    ]);

    const allProducts = productsSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    const allowedCategories = allCategories.map(category => {
      if (categories.length === 0) {
        return category.id;
      } else if (categories.includes(`${category.id}`)) {
        return category.id;
      } else {
        return null;
      }
    });

    const filteredProducts = allProducts.filter(product => {
      const matchesSearch = search === "" || product.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = allowedCategories.includes(product.categoryId);

      return matchesSearch && matchesCategory;
    });

    let sortingFunc;
    switch(sort) {
      case 'newest': {
        sortingFunc = ((a, b) => b.createdAt - a.createdAt);
      }
      break;
      case 'oldest': {
        sortingFunc = ((a, b) => a.createdAt - b.createdAt);
      }
      break;
      case 'priceAsc': {
        sortingFunc = ((a, b) => a.price - b.price);
      }
      break;
      case 'priceDesc': {
        sortingFunc = ((a, b) => b.price - a.price);
      }
      break;
      case 'nameAsc': {
        sortingFunc = ((a, b) => a.title.localeCompare(b.title));
      }
      break;
      case 'nameDesc': {
        sortingFunc = ((a, b) => b.title.localeCompare(a.title));
      }
      break;
      default: {
        throw new Error("Encountered unknown sorting type (getFilteredProducts).");
      }
    }

    filteredProducts.sort(sortingFunc);

    const finalProducts = [];
    for (let i = 0; i < filteredProducts.length; i++) {
      if (i >= pageSize * (page-1) && i < pageSize * page) {
        finalProducts.push(filteredProducts[i]);
      }
    }
    
    return {items: finalProducts, page, totalPages: Math.ceil(filteredProducts.length / pageSize)};
  },

  async checkQuantityUpdate(productId, quantity_change) {
    const productSnap = await this.getProductById(productId, true);
    const product = productSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }))[0];
 
    const returnObject = { updateAllowed: !(product.stock + quantity_change < 0), snapshot: productSnap };
    return returnObject;
  },

  async updateProductQuantity(productSnap, quantity_change) {
    const product = productSnap.docs.map(doc => ({
      docId: doc.id,
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
