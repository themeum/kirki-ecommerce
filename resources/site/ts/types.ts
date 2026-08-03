// Shared TypeScript interfaces for the site bundle

export interface kirkiEcommerceConfig {
  rest_url_base: string;   // e.g. /wp-json/kirki/ecommerce/v1
  rest_nonce: string;    // WordPress REST nonce
  cart_variant_ids: number[];
}

// Extend window for WordPress-injected config
declare global {
  interface Window {
    kirki_ecommerce: kirkiEcommerceConfig;
    wp: any;
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

// ── Toast types ───────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastExpandMode = 'hover' | 'always' | 'never';

export type ToastTheme = 'light' | 'dark' | 'auto';

export interface ToastOffset {
  x?: number;
  y?: number;
  mobile?: {
    x?: number;
    y?: number;
  };
  lg?: {
    x?: number;
    y?: number;
  };
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  icon?: string | null;
  duration?: number;
  closeButton?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  richColors?: boolean;
  position?: ToastPosition;
  theme?: ToastTheme;
}

export interface ToastConfig {
  position?: ToastPosition;
  duration?: number;
  closeButton?: boolean;
  maxVisible?: number;
  dir?: 'ltr' | 'rtl' | 'auto';
  offset?: ToastOffset;
  expandMode?: ToastExpandMode;
  richColors?: boolean;
  theme?: ToastTheme;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
}
