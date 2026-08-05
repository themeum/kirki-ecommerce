// Shared TypeScript interfaces for the site bundle

export interface kirkiEcommerceConfig {
  rest_url_base: string;   // e.g. /wp-json/kirki/ecommerce/v1
  rest_nonce: string;    // WordPress REST nonce
  cart_variant_ids: number[];
  is_logged_in: boolean;
  login_url: string;
  cart: CartUpdateItem;
  thank_you_url: string;
  checkout_cart?: {
    items: any[];
    pricing: any;
    shipping_method: any;
    available_shipping_methods?: any[];
  };
  currency?: string;
  countries?: any[];
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
  cart_id: string;
  quantity: number;
  product: {
    id: number;
    variant_id: number;
    title: string;
    slug: string;
    price: string;
    sale_price: string;
    media: any;
    categories: any[];
    attributes: string[];
    available_quantity: number;
  };
  subtotal: string;
  tax_rate: number;
  tax_amount: string;
  tax_breakdown: any[];
  discount_amount: string;
  total: string;
  total_formatted: string;
  created_at: string;
  updated_at: string;
}

export interface CartUpdateItem {
  sub_total: number;
  total: number;
  items_count: number;
  pricing: {
    subtotal_formatted: number;
    total_formatted: number;
  },
  items: CartItem[],
  formatted_items: Record<number, string> | null;
}

export interface CartPricing {
  subtotal: string;
  subtotal_formatted: string;
  tax_total: string;
  discount_details: any;
  discount_total: string;
  shipping_subtotal: string;
  shipping_tax: string;
  shipping_discount: string;
  shipping_total: string;
  total: string;
  total_formatted: string;
}

export interface Cart {
  id: number;
  customer_id: number | null;
  cart_token: string;
  currency: {
    code: string;
    base_code: string;
  };
  pricing: CartPricing;
  items_count: number;
  items: CartItem[];
  shipping_address: any;
  billing_address: any;
  available_shipping_methods: any[];
  shipping_method: any;
  customer_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface OrderItem {
  variant_id: number;
  quantity: number;
}

export interface OrderRequest {
  items: OrderItem[];
  currency_code: string;
  payment_method: string;
  coupon_code?: string;
  shipping_method?: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postcode: string;
  shipping_country: string;
  shipping_phone: string;
  shipping_email: string;
  shipping_company?: string | null;
  billing_first_name: string;
  billing_last_name: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_postcode: string;
  billing_country: string;
  billing_phone: string;
  billing_email: string;
  billing_company?: string | null;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string | null;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  status: string;
  total: string;
  currency: string;
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
