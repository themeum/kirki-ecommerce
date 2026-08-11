<?php

namespace Kirki\Ecommerce\App\Currency\DTO;

use Kirki\Ecommerce\Framework\DTO;

class ExchangeRateDTO extends DTO
{
    public string $provider_id;
    public string $base_currency;
    public array $rates;
    public int $timestamp;
}
