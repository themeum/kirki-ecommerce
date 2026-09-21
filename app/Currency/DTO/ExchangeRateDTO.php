<?php

namespace Kirki\Ecommerce\App\Currency\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for exchange rates returned by a currency provider.
 *
 * @since 1.0.0
 */
class ExchangeRateDTO extends DTO
{
    /**
     * @var string
     */
    public string $provider_id;

    /**
     * @var string
     */
    public string $base_currency;

    /**
     * @var array<string, float>
     */
    public array $rates;

    /**
     * @var int
     */
    public int $timestamp;
}
