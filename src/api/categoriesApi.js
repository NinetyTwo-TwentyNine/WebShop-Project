// src/api/categoriesApi.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";
import { DB_COLLECTION_NAME_CATEGORIES } from "../data/constants.js";

export const categoriesApi = {
  async getAllCategories() {
    const snapshot = await getDocs(collection(db, DB_COLLECTION_NAME_CATEGORIES));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}