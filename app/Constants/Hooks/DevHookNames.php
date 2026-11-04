<?php

namespace Kirki\Ecommerce\App\Constants\Hooks;

defined('ABSPATH') || exit;

/**
 * Names of the actions and filters the plugin fires for developers to hook into.
 *
 * @since 1.0.0
 */
class DevHookNames
{
    public const PAYMENT_PROVIDERS = 'kirki_ecommerce_payment_providers';
    public const USER_EMAIL_VERIFIED = 'kirki_ecommerce_user_email_verified';
    public const CONFIG_DATA = 'kirki_ecommerce_config_data';
    public const ACCOUNT_ROUTE_CONFIG = 'kirki_ecommerce_account_route_config';
    public const ACCOUNT_MENU_ITEMS = 'kirki_ecommerce_account_menu_items';
    public const SITE_PAGES = 'kirki_ecommerce_site_pages';
    public const ORDER_PLACED = 'kirki_ecommerce_order_placed';
    public const STORE_CREATED = 'kirki_ecommerce_store_created';
    public const SEO_HEAD_ENABLED = 'kirki_ecommerce_seo_head_enabled';
    public const PRODUCT_SEO_DATA = 'kirki_ecommerce_product_seo_data';
    public const PRODUCT_JSON_LD = 'kirki_ecommerce_product_json_ld';
}
