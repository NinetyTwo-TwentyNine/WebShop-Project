// src/api/ordersApi.js
import { collection, query, where, doc, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";
import { DB_COLLECTION_NAME_ORDERS, DB_COLLECTION_NAME_ORDERITEMS, DB_COLLECTION_NAME_CARTITEMS, DB_COLLECTION_NAME_USEROFFERS } from "../data/constants.js";
import { productsApi } from "./productsApi.js";
import { offersApi } from "./offersApi.js";
import { cartApi } from "./cartApi.js";
import { advanceOrder, applyDiscounts, applyOffers, confirmReceipt, createOrderObject, filterOffersByProduct, getUniqueId, shouldAdvanceOrder, uploadFilter } from "../domain/utils.js";

export const ordersApi = {
  async getUserOrders(userEmail) {
    const orderQuery = query(
      collection(db, DB_COLLECTION_NAME_ORDERS),
      where("userEmail", "==", userEmail),
    );
    const [ordersSnap, itemsSnap] = await Promise.all([
      getDocs(orderQuery),
      getDocs(collection(db, DB_COLLECTION_NAME_ORDERITEMS)),
    ]);

    const orders = ordersSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    const orderItems = itemsSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));

    orders.forEach(order => {
      order.items = orderItems.filter(
        item => item.orderId === order.id
      );
    });
    return orders;
  },

  async syncOrders(userEmail) {
    const orders = await this.getUserOrders(userEmail);

    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        if (shouldAdvanceOrder(order, Date.now())) {
          return this.advanceOrder(order.id);
        }
        return null;
      })
    );

    for (let i = 0; i < orders.length; i++) {
      const updated = updatedOrders.find(item => item?.id === orders[i].id);
      if (updated) {
        orders[i] = updated;
      }
    }

    return orders;
  },

  async createOrder(userEmail) {
    const [orderList, cart, allOffers, productList] = await Promise.all([
      this.getUserOrders(userEmail),
      cartApi.initializeUserCart(userEmail),
      offersApi.getAllOffers(userEmail),
      productsApi.getAllProducts()
    ]);

    if (cart.items.size === 0)
    {
      throw new Error("Attempt to create an order with no cart items.");
    }
    const offersList = [...allOffers.globalOffers, ...allOffers.personalOffers], userOfferLinks = allOffers.userOfferLinks;

    const new_order_id = getUniqueId(orderList), new_order_items = [];
    cart.items.forEach(item => {
      const baseProduct = productList.find(product => product.id === item.productId);
      new_order_items.push({productId: item.productId, orderId: new_order_id, productPrice: baseProduct.price, productTitle: baseProduct.title, quantity: item.quantity});
    });

    applyOffers(new_order_items, productList, offersList, userOfferLinks);

    const new_order = createOrderObject(new_order_id, userEmail);
    await Promise.all([
      addDoc(collection(db, DB_COLLECTION_NAME_ORDERS), new_order),
      new_order_items.map(async (order_item) => {
        delete order_item.productId;
        return addDoc(collection(db, DB_COLLECTION_NAME_ORDERITEMS), order_item);
      }),
      userOfferLinks.map(async (offer_link) => {
        return updateDoc(doc(db, DB_COLLECTION_NAME_USEROFFERS, offer_link.docId), uploadFilter(offer_link));
      }),
      cartApi.clearCart()
    ]);

    new_order.items = new_order_items;
    cart.items = [];

    return {cart, new_order, allOffers};
  },

  async advanceOrder(orderId) {
    const ordersSnap = await getDocs(query(
      collection(db, DB_COLLECTION_NAME_ORDERS),
      where("id", "==", orderId),
    ));
    if (ordersSnap.empty) {
      throw new Error(`No order found according to this ID (${orderId}).`);
    }

    const order = {
      docId: ordersSnap.docs[0].id,
      ...ordersSnap.docs[0].data()
    }
    advanceOrder(order);

    await updateDoc(doc(db, DB_COLLECTION_NAME_ORDERS, ordersSnap.docs[0].id), uploadFilter(order));
    return order;
  },

  async confirmReceipt(orderId) {
    const ordersSnap = await getDocs(query(
      collection(db, DB_COLLECTION_NAME_ORDERS),
      where("id", "==", orderId),
    ));
    if (ordersSnap.empty) {
      throw new Error(`No order found according to this ID (${orderId}).`);
    }

    const order = {
      docId: ordersSnap.docs[0].id,
      ...ordersSnap.docs[0].data()
    }
    confirmReceipt(order);

    await updateDoc(doc(db, DB_COLLECTION_NAME_ORDERS, ordersSnap.docs[0].id), uploadFilter(order));
    return order;
  }
}