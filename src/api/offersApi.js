// src/api/offersApi.js
import {
  collection,
  query,
  where,
  doc,
  and,
  or,
  getDocs,
  updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";
import { DB_COLLECTION_NAME_OFFERS, DB_COLLECTION_NAME_USEROFFERS } from "../data/constants.js";
import { divideOffers, filterOffersByProduct, uploadFilter } from "../domain/utils.js";

export const offersApi = {
  async downloadUserOffers(userEmail) {
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

  async getApplicableOffers(product, userEmail) {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    const matchingOffers = filterOffersByProduct(allOffers, product);

    const finalData = divideOffers(matchingOffers, userEmail, userOfferSnap);
    return finalData;
  },

  async getApplicableOffersMap(products, userEmail) {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

    const result = new Map();
    for (const product of products) {
      const matchingOffers = filterOffersByProduct(allOffers, product);
      result.set(product.id, divideOffers(matchingOffers, userEmail, userOfferSnap));
    }

    return result;
  },

  async getAllOffers(userEmail) {
    const userOfferData = await this.downloadUserOffers(userEmail);
    const snapshot = userOfferData.offersSnapshot, userOfferSnap = userOfferData.userOffersSnapshot;

    const allOffers = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

    const finalData = divideOffers(allOffers, userEmail, userOfferSnap);
    return finalData;
  },

  async activateOffer(userEmail, offerId) {
    const snap = await getDocs(query(collection(db, DB_COLLECTION_NAME_USEROFFERS), where("offerId", "==", offerId), where("userEmail", "==", userEmail)));

    if (snap.empty) {
      throw new Error("User offer not found.");
    }

    const userOffer = {docId: snap.docs[0].id, ...snap.docs[0].data()};

    if (userOffer.isUsed === true || userOffer.isActivated === true)
    {
      throw new Error("Can't activate that offer.");
    }

    userOffer.isActivated = true;
    await updateDoc(doc(db, DB_COLLECTION_NAME_USEROFFERS, snap.docs[0].id), uploadFilter(userOffer));
    return userOffer;
  },

  // TODO: apply chanceParams during order completion
};