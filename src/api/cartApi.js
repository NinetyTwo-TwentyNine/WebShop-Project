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
import { productsApi } from "./productsApi.js";
import { DB_COLLECTION_NAME_CARTS, DB_COLLECTION_NAME_CARTITEMS } from "../data/constants.js";
import { createNewUserCart } from "../domain/utils.js";

let current_user_cart = null;

export const cartApi = {
  async createNewCart(userEmail) {
      const allCarts = await this.getAllCarts();
      const newCart = createNewUserCart(userEmail, allCarts);

      await addDoc(collection(db, DB_COLLECTION_NAME_CARTS), newCart);
      return newCart;
  },

  async getAllCarts() {
    const snapshot = await getDocs(collection(db, DB_COLLECTION_NAME_CARTS));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  getCurrentUserCart() {
    if (current_user_cart == null)
    {
        throw new Error("Cart not initialized");
    }
    return current_user_cart;
  },

  async initializeUserCart(userEmail) {
    const snap = await getDocs(
      query(collection(db, DB_COLLECTION_NAME_CARTS), where("userEmail", "==", userEmail))
    );
    if (snap.empty) {
      const newCart = await this.createNewCart(userEmail);
      newCart.items = [];
      current_user_cart = newCart;
      return newCart;
    }

    const cart = { id: snap.docs[0].id, ...snap.docs[0].data() };

    const itemsSnap = await getDocs(
      query(collection(db, DB_COLLECTION_NAME_CARTITEMS), where("cartId", "==", cart.id))
    );

    cart.items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    current_user_cart = cart;
    return cart;
  },

  async addToCart(productId) {
    const old_cart = this.getCurrentUserCart();

    const existing = old_cart.items.find(i => i.productId === productId);
    if (existing) return old_cart;

    const updateData = await productsApi.checkQuantityUpdate(productId, -1);
    if (!updateData.updateAllowed) {
        throw new Error("Out of stock");
    }

    await Promise.all([
      addDoc(collection(db, DB_COLLECTION_NAME_CARTITEMS), {
        cartId: old_cart.id,
        productId: productId,
        quantity: 1
      }),
      productsApi.updateProductQuantity(updateData.snapshot, -1)
    ]);

    const new_cart = {
      ...old_cart,
      items: [...old_cart.items, { cartId: old_cart.id, productId: productId, quantity: 1 }]
    };
    current_user_cart = new_cart;
    return new_cart;
  },

  async updateQuantity(productId, quantity_change) {
    const cart = this.getCurrentUserCart();

    const [snap, updateData] = await Promise.all([
        getDocs(query(collection(db, DB_COLLECTION_NAME_CARTITEMS), where("cartId", "==", cart.id), where("productId", "==", productId))),
        productsApi.checkQuantityUpdate(productId, (-1) * quantity_change)
    ]);

    if (snap.empty) {
        throw new Error("Cart item not found.");
    } else if (!updateData.updateAllowed) {
        throw new Error("Invalid quantity (product limit).");
    }

    const cartItem = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))[0];
    const new_quantity = cartItem.quantity + quantity_change;
    if (new_quantity <= 0) {
        throw new Error("Invalid quantity (cart item limit).");
    }

    const docRef = snap.docs[0].ref;
    await Promise.all([
        updateDoc(docRef, { quantity: new_quantity }),
        productsApi.updateProductQuantity(updateData.snapshot, (-1) * quantity_change)
    ])

    cart.items.forEach(i => {
        if (i.cartId == cartItem.cartId && i.productId == cartItem.productId) {
            i.quantity = new_quantity;
        }
    });
    current_user_cart = cart;
    return cart;
  },

  async removeItem(productId) {
    const cart = this.getCurrentUserCart();

    const [itemSnap, productSnap] = await Promise.all([
      getDocs(query(collection(db, DB_COLLECTION_NAME_CARTITEMS), where("cartId", "==", cart.id), where("productId", "==", productId))),
      productsApi.getProductById(productId, true)
    ]);
    if (itemSnap.empty) {
        return cart;
    }

    const cartItem = itemSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))[0];

    await Promise.all([  // Delete all matches (helps enforce uniqueness)
        itemSnap.docs.map(docSnap => deleteDoc(docSnap.ref)),
        productsApi.updateProductQuantity(productSnap, cartItem.quantity)
    ]);

    cart.items = cart.items.filter(i =>
        !(i.cartId === cartItem.cartId && i.productId === cartItem.productId)
    );
    current_user_cart = cart;
    return cart;
  },

  async clearCart() {
    const cart = this.getCurrentUserCart();

    const snap = await getDocs(
      query(collection(db, DB_COLLECTION_NAME_CARTITEMS), where("cartId", "==", cart.id))
    );
    await Promise.all(snap.docs.map(docSnap => this.removeItem(docSnap.data().productId)));

    cart.items = [];
    current_user_cart = cart;
    return cart;
  }
};