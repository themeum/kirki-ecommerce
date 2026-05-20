<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class OptionKeys
{
    use HasConstants;
    const GENERAL_SETTINGS = 'general';
    const PRODUCT_SETTINGS = 'product';
    const SHIPPING_SETTINGS = 'shipping';
    const PAYMENT_SETTINGS = 'payment';
    const TAX_SETTINGS = 'tax';
    const CHECKOUT_SETTINGS = 'checkout';
    const CURRENCY_SETTINGS = 'currency';
    const EMAIL_SETTINGS = 'email';

    const MIGRATIONS = 'kirki_ecommerce_migrations'; // @todo: will be handled later
    const ERASE_DATA_UPON_UNINSTALL = 'kirki_ecommerce_erase_upon_uninstall';
}
