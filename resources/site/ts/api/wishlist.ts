import { apiRequest } from "./client";
import { ENDPOINTS } from "./endpoints";


interface WishlistResponse {
    success?: boolean;
    message?: string;
    data?: any,
}

export const wishlistApi = {
    get: () => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.root),
    addItem: (productId: number, variantId?: number) => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.root, {
        method: 'POST',
        body: {
            product_id: productId,
            ...(variantId ? { variant_id: variantId } : {}),
        }
    }),
    remove: (productId: number) => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.remove(productId), {
        method: 'DELETE',
    }),
    empty: () => apiRequest<WishlistResponse>(ENDPOINTS.wishlist.empty, {
        method: 'DELETE',
    }),
}