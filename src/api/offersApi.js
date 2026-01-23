// src/api/offersApi.js
import {
  collection,
  query,
  where,
  getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

export const offersApi = {
  filterOffersByProduct(allOffers, product) {
    return allOffers.filter(o => {
      if (o.isEntireCategory) {
        return o.affectedId === product.categoryId;
      }
      return o.affectedId === product.id;
    });
  },

  divideOffers(allOffers, userEmail, userOfferSnap) {
    const globalOffers = allOffers.filter(o => o.isGlobal);

    let userOffers = [];
    if (userEmail) {
      const userOfferIds = userOfferSnap.docs.map(d => d.data().offerId);
      userOffers = allOffers.filter(o => userOfferIds.includes(o.id));
    }

    return {
      globalOffers,
      personalOffers: userOffers
    };
  },

  async downloadUserOffers(userEmail) {
    const offersQuery = query(
      collection(db, "offers"),
      where("isActive", "==", true)    // active offers only
    );
    const userOffersQuery = query(
      collection(db, "userOffers"),
      where("userEmail", "==", userEmail),
      //where("isUsed", "==", false)
    )

    const [snapshot, userOfferSnap] = await Promise.all([
      getDocs(offersQuery),
      getDocs(userOffersQuery),
    ]);

    return { offersSnapshop: snapshot, userOffersSnapshot: userOfferSnap };
  },

  async getApplicableOffers(product, userEmail) {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshop, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const matchingOffers = this.filterOffersByProduct(allOffers, product);

    const finalData = this.divideOffers(matchingOffers, userEmail, userOfferSnap);
    return finalData;
  },

  async getAllOffers(userEmail) {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshop, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const finalData = this.divideOffers(allOffers, userEmail, userOfferSnap);
    return finalData;
  }

  // TODO: apply chanceParams during order completion
};