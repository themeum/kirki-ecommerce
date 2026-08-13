import type { KirkiEcommerceConfig } from "./types";

if (!window.kirki_ecommerce) {
  throw new Error("[kecom] window.kirki_ecommerce is not defined. Did you forget wp_localize_script?");
}

export const config: KirkiEcommerceConfig = window.kirki_ecommerce;
