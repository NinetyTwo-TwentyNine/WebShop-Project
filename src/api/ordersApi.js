// src/api/ordersApi.js
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

export const ordersApi = {
  async getUserOrders(userEmail) {
    const orderQuery = query(
      collection(db, "orders"),
      where("userEmail", "==", userEmail),
    );
    const [ordersSnap, itemsSnap] = await Promise.all([
      getDocs(orderQuery),
      getDocs(collection(db, "orderItems")),
    ]);

    const orders = ordersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const orderItems = itemsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    orders.forEach(order => {
      order.items = orderItems.filter(
        item => item.orderId === order.id
      );
    });
    return orders;
  }
}