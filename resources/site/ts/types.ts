// Shared TypeScript interfaces for the site bundle

export interface kirkiEcommerceConfig {
  rest_url_base: string;   // e.g. /wp-json/kirki/ecommerce/v1
  rest_nonce: string;    // WordPress REST nonce
}

// Extend window for WordPress-injected config
declare global {
  interface Window {
    kirki_ecommerce: kirkiEcommerceConfig;
    Alpine: any;
  }
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  total: number;
  coupon_code?: string;
  discount?: number;
}

export interface WishlistItem {
  product_id: number;
  variant_id?: number;
  name: string;
  image?: string;
  price?: number;
  url?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
