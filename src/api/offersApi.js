// src/api/offersApi.js
import {
  collection,
  query,
  where,
  doc,
  and,
  or,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";
import { DB_COLLECTION_NAME_OFFERS, DB_COLLECTION_NAME_ORDERITEMS, DB_COLLECTION_NAME_PRODUCTS, DB_COLLECTION_NAME_USEROFFERS } from "../data/constants.js";
import { checkItemStockMatch, divideOffers, filterOffersByProduct, queryChunk, rollOfferChance, uploadFilter } from "../domain/utils.js";
import { productsApi } from "./productsApi.js";
import { ordersApi } from "./ordersApi.js";

export const offersApi = {
  async downloadUserOffers(userEmail = "") {
    const offersQuery = query(
      collection(db, DB_COLLECTION_NAME_OFFERS),
      or(
        and(
          where("isGlobal", "==", true),
          where("isActive", "==", true)
        ),
        where("isGlobal", "==", false)
      )
    );

    const userOffersQuery = query(
      collection(db, DB_COLLECTION_NAME_USEROFFERS),
      where("userEmail", "==", userEmail),
      //where("isUsed", "==", false)
    );

    const [snapshot, userOfferSnap] = await Promise.all([
      getDocs(offersQuery),
      getDocs(userOffersQuery),
    ]);

    return { offersSnapshot: snapshot, userOffersSnapshot: userOfferSnap };
  },

  async getApplicableOffers(productId, userEmail = "") {
    const [userOfferData, product] = await Promise.all([
      this.downloadUserOffers(userEmail),
      productsApi.getProductById(productId)
    ]);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    const matchingOffers = filterOffersByProduct(allOffers, product);

    const finalData = divideOffers(matchingOffers, userEmail, userOfferSnap);
    return finalData;
  },

  async getApplicableOffersMap(productIds = [], userEmail = "") {
    const [userOfferData, products] = await Promise.all([
      this.downloadUserOffers(userEmail),
      Promise.all(productIds.map(productId => productsApi.getProductById(productId))),
    ]);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

    const result = new Map();
    for (const product of products) {
      const matchingOffers = filterOffersByProduct(allOffers, product);
      result.set(product.id, divideOffers(matchingOffers, userEmail, userOfferSnap));
    }

    return result;
  },

  async getAllOffers(userEmail = "") {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

    const finalData = divideOffers(allOffers, userEmail, userOfferSnap);
    return finalData;
  },

  async activateOffer(userEmail, offerId, activate) {
    const snap = await getDocs(query(collection(db, DB_COLLECTION_NAME_USEROFFERS), where("offerId", "==", offerId), where("userEmail", "==", userEmail)));

    if (snap.empty) {
      throw new Error("User offer not found.");
    }

    const userOffer = {docId: snap.docs[0].id, ...snap.docs[0].data()};

    if (userOffer.isUsed === true)
    {
      throw new Error("Offer already applied.");
    }
    if (userOffer.isActivated === Boolean(activate)) {
      throw new Error("Offer already (de)activated.");
    }

    userOffer.isActivated = Boolean(activate);
    await updateDoc(doc(db, DB_COLLECTION_NAME_USEROFFERS, snap.docs[0].id), uploadFilter(userOffer));
    return userOffer;
  },

  async deleteOffer(userEmail, offerId) {
    const snap = await getDocs(query(collection(db, DB_COLLECTION_NAME_USEROFFERS), where("offerId", "==", offerId), where("userEmail", "==", userEmail)));

    if (snap.empty) {
      throw new Error("User offer not found.");
    }

    const userOffer = {docId: snap.docs[0].id, ...snap.docs[0].data()};

    await deleteDoc(doc(db, DB_COLLECTION_NAME_USEROFFERS, snap.docs[0].id));
    return userOffer;
  },

  async progressOffers(userEmail, productIds = []) {
    const [orders, products, offersSnap, userOffersSnap] = await Promise.all([
      ordersApi.getUserOrders(userEmail, true),
      Promise.all(productIds.map(productId => productsApi.getProductById(productId))),
      getDocs(query(collection(db, DB_COLLECTION_NAME_OFFERS), where("isActive", "==", true), where("isGlobal", "==", false))),
      getDocs(query(collection(db, DB_COLLECTION_NAME_USEROFFERS), where("userEmail", "==", userEmail)))
    ]);

    const orderItems = orders.flatMap(order => order.items);

    const offers = offersSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    const userOffers = userOffersSnap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));

    const offersToProgress = offers.filter(o => {
      const link = userOffers.find(l => l.offerId == o.id);
      return (!link || link.isUsed);
    });

    const offersToActivate = [];
    for (const offer of offersToProgress) {
      const orderItemsForOffer = orderItems.filter(i => {
        const product = products.find(p => p.id == i.productId);
        if (checkItemStockMatch(product, i)) {
          return ((offer.isEntireCategory && product.categoryId == offer.affectedId) || (!offer.isEntireCategory && product.id == offer.affectedId))
        }
        return false;
      });

      const purchaseCount = orderItemsForOffer.reduce((sum, item) => sum + Number(item.quantity), 0);
      const rollResult = rollOfferChance(purchaseCount, offer.chanceParams);

      if (rollResult) {
        offersToActivate.push(offer);
      }
    }

    await Promise.all([
      offersToActivate.map(offer => {
        const userOffer = userOffers.find(l => l.offerId == offer.id);
        if (userOffer) {
          userOffer.isUsed = false;
          return updateDoc(doc(db, DB_COLLECTION_NAME_USEROFFERS, userOffer.docId), uploadFilter(userOffer));
        } else {
          return addDoc(collection(db, DB_COLLECTION_NAME_USEROFFERS), {userEmail: userEmail, offerId: offer.id, isActivated: false, isUsed: false});
        }
      })
    ]);
  }
};