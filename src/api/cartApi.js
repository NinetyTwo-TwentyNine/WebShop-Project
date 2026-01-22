// src/api/cartApi.js
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

export const cartApi = {
  async getUserCart(userEmail) {
    const snap = await getDocs(
      query(collection(db, "carts"), where("userEmail", "==", userEmail))
    );

    if (snap.empty) {
      const ref = await addDoc(collection(db, "carts"), { userEmail });
      return { id: ref.id, userEmail, items: [] };
    }

    const cart = { id: snap.docs[0].id, ...snap.docs[0].data() };

    const itemsSnap = await getDocs(
      query(collection(db, "cartItems"), where("cartId", "==", cart.id))
    );

    cart.items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return cart;
  },

  async addToCart({ cart, product }) {
    // TODO: prevent duplicates
    const existing = cart.items.find(i => i.productId === product.id);
    if (existing) return cart;

    if (product.stock <= 0) throw new Error("Out of stock");

    const itemRef = await addDoc(collection(db, "cartItems"), {
      cartId: cart.id,
      productId: product.id,
      quantity: 1
    });

    return {
      ...cart,
      items: [...cart.items, { id: itemRef.id, productId: product.id, quantity: 1 }]
    };
  },

  async updateQuantity(itemId, quantity, maxStock) {
    if (quantity < 1 || quantity > maxStock) return;

    await updateDoc(doc(db, "cartItems", itemId), { quantity });
  },

  async removeItem(itemId) {
    await deleteDoc(doc(db, "cartItems", itemId));
  },
};