<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\DTO;

defined('ABSPATH') || exit;

/**
 * The onboarding answers that decide which presets a new store receives.
 *
 * @since 1.0.0
 */
class PresetContext extends DTO
{
    /** @var string */
    public $industry = 'other';

    /** @var string ISO 3166-1 alpha-2 country code. */
    public $country;

    /** @var string|null The store address state, as a state id from the country dataset. */
    public $state;

    /** @var string ISO 4217 base currency code. */
    public $currency;

    /** @var bool */
    public $is_tax_collected = false;

    /**
     * Build the context from the saved store settings.
     *
     * The answers are read back from what store setup saved, not from a
     * request, so the presets always match the store.
     *
     * @since 1.0.0
     *
     * @return static
     */
    public static function from_settings()
    {
        $state = Settings::get('general.store_address.state');
        $base_currency = Currency::base()->first();

        return static::from_array([
            'industry' => Settings::get('general.industry') ?: 'other',
            'country' => strtoupper((string) Settings::get('general.store_address.country', '')),
            'state' => $state === null || $state === '' ? null : (string) $state,
            'currency' => strtoupper((string) ($base_currency->code ?? '')),
            'is_tax_collected' => (bool) Settings::get('general.is_tax_calculation_enabled', false),
        ]);
    }
}
