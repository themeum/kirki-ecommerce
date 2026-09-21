<?php

namespace Kirki\Ecommerce\App\Constants\Hooks;

/**
 * Names of the hooks fired by the plugin itself.
 *
 * @since 1.0.0
 */
class CustomHookNames
{
    public const ECOMMERCE_PAYMENT_PROVIDERS = 'kirki_ecommerce_payment_providers';
    public const USER_EMAIL_VERIFIED = 'kecom_user_email_verified';
    public const CONFIG_DATA = 'kecom_config_data';
    public const ACCOUNT_ROUTE_CONFIG = 'kecom_account_route_config';
    public const ACCOUNT_MENU_ITEMS = 'kecom_account_menu_items';
    public const SITE_PAGES = 'kecom_site_pages';
}
