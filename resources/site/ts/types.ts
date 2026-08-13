// Shared TypeScript interfaces for the site bundle

export interface KirkiEcommerceConfig {
  rest_url_base: string; // e.g. /wp-json/kirki/ecommerce/v1
  rest_nonce: string; // WordPress REST nonce
  cart_variant_ids: number[];
  is_logged_in: boolean;
  login_url: string;
  cart: CartUpdateItem;
  thank_you_url: string;
  checkout_cart?: {
    items: any[];
    pricing: any;
    shipping_method: any;
    is_billing_same_as_shipping?: boolean;
    available_shipping_methods?: any[];
  };
  currency?: string;
  countries?: any[];
  cart_token_cookie_name: string;
  cart_token_header_name: string;
  header_skip_tax: string;
}

// Extend window for WordPress-injected config
declare global {
  interface Window {
    kirki_ecommerce: KirkiEcommerceConfig;
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
  display_product_total_money_object: {
    display: string,
  };
  display_total_money_object: {
    display: string,
  };
}

export interface CartUpdateItem {
  sub_total: number;
  total: number;
  items_count: number;
  pricing: {
    display_subtotal_money_object: {
      display: string,
    };
    display_total_money_object: {
      display: string,
    },
  },
  items: CartItem[],
  formatted_items: Record<number, string> | null;
}

export interface MoneyObject {
  raw: number;
  display: string;
  currency: {
    code: string;
    symbol: string;
  };
}

export interface DiscountDetails {
  code: string | null;
  title: string | null;
  discount_value_type: string | null;
  discount_amount_percentage: number | null;
  base_discount_amount_fixed: number | null;
}

export interface CartPricing {
  display_subtotal_money_object: MoneyObject;
  display_tax_total_money_object: MoneyObject;
  discount_details: DiscountDetails | null;
  display_discount_total_money_object: MoneyObject;
  display_shipping_subtotal_money_object: MoneyObject;
  display_shipping_tax_money_object: MoneyObject;
  display_shipping_discount_money_object: MoneyObject;
  display_shipping_total_money_object: MoneyObject;
  display_total_money_object: MoneyObject;
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

export interface CheckoutRequest {
  items: OrderItem[];
  currency_code: string;
  payment_provider: string;
  coupon_code?: string;
  shipping_method?: string;
  is_billing_same_as_shipping?: boolean;
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
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postcode?: string;
  billing_country?: string;
  billing_phone?: string;
  billing_email?: string;
  billing_company?: string | null;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string | null;
}

export interface CheckoutResponse {
  id: number;
  uuid: string;
  order_number: string;
  status: string;
  total: string;
  currency: string;
  payment_next_step: {
    type: 'redirect' | 'html',
    value: string
  } | null
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

export type ToastType = "success" | "error" | "warning" | "info" | "default";

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export type ToastExpandMode = "hover" | "always" | "never";

export type ToastTheme = "light" | "dark" | "auto";

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
  dir?: "ltr" | "rtl" | "auto";
  richColors?: boolean;
  position?: ToastPosition;
  theme?: ToastTheme;
}

export interface ToastConfig {
  position?: ToastPosition;
  duration?: number;
  closeButton?: boolean;
  maxVisible?: number;
  dir?: "ltr" | "rtl" | "auto";
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
