<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

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
    const ADVANCE_SETTINGS = 'advance';

    const MIGRATIONS = 'migrations'; // @todo: will be handled later
    const ERASE_DATA_UPON_UNINSTALL = 'erase_upon_uninstall';

    const LAST_INVOICE_NUMBER = 'last_invoice_number';
    const LAST_INVOICE_NUMBER_RESET_YEAR = 'last_invoice_number_reset_year';
}
