// src/api/offersApi.js
import {
  collection,
  query,
  where,
  getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../config/firebaseClient.js";

export const offersApi = {
  async getApplicableOffers(product, userEmail) {
    const offersRef = collection(db, "offers");

    // active offers only
    const q = query(
      offersRef,
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const allOffers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const matchingOffers = allOffers.filter(o => {
      if (o.isEntireCategory) {
        return o.affectedId === product.categoryId;
      }
      return o.affectedId === product.id;
    });

    const globalOffers = matchingOffers.filter(o => o.isGlobal);

    let userOffers = [];
    if (userEmail) {
      const userOfferSnap = await getDocs(
        query(
          collection(db, "userOffers"),
          where("userEmail", "==", userEmail),
          where("isUsed", "==", false)
        )
      );

      const userOfferIds = userOfferSnap.docs.map(d => d.data().offerId);
      userOffers = matchingOffers.filter(o => userOfferIds.includes(o.id));
    }

    return {
      globalOffers,
      personalOffers: userOffers
    };
  }

  // TODO: apply chanceParams during order completion
};