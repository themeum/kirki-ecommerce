import { apiRequest } from "./client";
import { ENDPOINTS } from "./endpoints";


interface WishlistResponse {
    success?: boolean;
    message?: string;
    data?: any,
}

export const wishlistApi = {
    get: () => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.root),
    addItem: (variantId: number) => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.root, {
        method: 'POST',
        body: {
            variant_id: variantId,
        }
    }),
    remove: (id: number) => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.remove(id), {
        method: 'DELETE',
    }),
    empty: () => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.empty, {
        method: 'DELETE',
    }),
}