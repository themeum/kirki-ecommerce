<?php

namespace Kirki\Ecommerce\App\DTO\Onboarding;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for the merchant's onboarding answers used to set up the store.
 *
 * @since 1.0.0
 */
class StoreSetupDTO extends DTO
{
    /** @var string */
    public $store_name;

    /** @var string */
    public $industry;

    /** @var string ISO 3166-1 alpha-2 country code. */
    public $country;

    /** @var array<string, string|null> Address fields without the country. */
    public $store_address = [];

    /** @var string ISO 4217 currency code. */
    public $currency;

    /** @var bool */
    public $is_tax_collected = false;

    /** @var bool */
    public $is_tax_inclusive_price = false;

    /** @var string|null */
    public $store_tax_id;
}
