// src/api/ordersApi.js
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

export const ordersApi = {
  async getUserOrders(userEmail) {
    const q = query(
      collection(db, "orders"),
      where("userEmail", "==", userEmail),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}