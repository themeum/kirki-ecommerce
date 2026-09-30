<?php

namespace Kirki\Ecommerce\App\Constants\Hooks;

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
}
