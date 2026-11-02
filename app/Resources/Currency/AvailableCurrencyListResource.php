<?php

namespace Kirki\Ecommerce\App\Resources\Currency;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a currency that can be added to the store.
 *
 * @since 1.0.0
 */
class AvailableCurrencyListResource extends Resource
{
    const EURO_REGION = 'EU';

    const EURO_FLAG = '🇪🇺';

    /**
     * Convert the currency resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The currency name, code, symbol and flag.
     */
    public function to_array()
    {
        return [
            'name' => $this->name,
            'code' => $this->code,
            'symbol' => $this->symbol,
            'flag' => $this->flag(),
        ];
    }

    /**
     * Get the flag emoji for the region in the currency locale.
     *
     * @since 1.0.0
     *
     * @return string Empty when the locale has no known region.
     */
    protected function flag()
    {
        $parts = explode('-', (string) $this->locale);
        $region = strtoupper((string) end($parts));

        if ($region === static::EURO_REGION) {
            return static::EURO_FLAG;
        }

        $country = CountryData::find_index_entry($region);

        return $country['flag'] ?? '';
    }
}
