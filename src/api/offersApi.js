// src/api/offersApi.js
import { apiFetch, currentUserEmail } from "../domain/utils.js";
import { ENDPOINTS } from "../data/constants.js";
import { isAuthenticated } from "../state/authState.js";

export const offersApi = {
  async getApplicableOffers(productId) {
    let userEmail = "";
    if (isAuthenticated()) {
      userEmail = currentUserEmail();
    }

    return await apiFetch(
      `${ENDPOINTS.OFFERS}/applicable/${productId}?userEmail=${encodeURIComponent(userEmail)}`
    );
  },

  async getApplicableOffersMap(productIds = []) {
    let userEmail = "";
    if (isAuthenticated()) {
      userEmail = currentUserEmail();
    }

    const params = new URLSearchParams();
    params.append("userEmail", userEmail);
    productIds.forEach(id => params.append("productIds", id));

    return await apiFetch(
      `${ENDPOINTS.OFFERS}/applicable?${params.toString()}`
    );
  },

  async getAllOffers() {
    return await apiFetch(`${ENDPOINTS.OFFERS}?userEmail=${encodeURIComponent(currentUserEmail())}`);
  },

  async activateOffer(offerId, active) {
    return await apiFetch(
      `${ENDPOINTS.OFFERS}/${offerId}/activate?userEmail=${encodeURIComponent(currentUserEmail())}&active=${active}`,
      {
        method: "POST"
      }
    );
  },

  async deleteOffer(offerId) {
    return await apiFetch(
      `${ENDPOINTS.OFFERS}/${offerId}/delete?userEmail=${encodeURIComponent(currentUserEmail())}`,
      {
        method: "DELETE",
      }
    );
  },
};