<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * The base currency, the active currencies with their rates, and the state of the rate sync. No API keys.
 *
 * @since 1.0.0
 */
class CurrenciesResource extends StoreResource
{
    /** @var string */
    protected $title = 'Currencies';

    /** @var string */
    protected $description = 'The base currency, the active currencies with their exchange rates, and the last and next exchange rate sync. Read it to explain prices in other currencies.';

    /** @var string */
    protected $uri = 'kecom://store/currencies';

    /** @var CurrencyService */
    protected $currency_service;

    /**
     * Create the resource.
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service Currency service.
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Read the currencies.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);
        $base_currency = $this->currency_service->get_base_currency();
        $currencies = [];

        foreach ($this->currency_service->get_active_currencies() as $currency) {
            $currencies[] = [
                'code' => $currency->code,
                'name' => $currency->name,
                'symbol' => $currency->symbol,
                'exchange_rate' => (float) $currency->exchange_rate,
                'is_base' => (bool) $currency->is_base,
            ];
        }

        return Response::structured([
            'base_currency' => $base_currency ? $base_currency->code : null,
            'currencies' => $currencies,
            'is_automatic_update_enabled' => (bool) $settings->get('is_automatic_update_enabled', false),
            'rate_provider' => $this->value_or_null($settings->get('api_provider')),
            'last_sync_at' => $this->iso_datetime($settings->get('last_sync_at')),
            'next_sync_at' => $this->iso_datetime($settings->get('next_sync_at')),
            'last_sync_error' => $this->value_or_null($settings->get('last_sync_error')),
        ]);
    }

    /**
     * Turn a stored sync time into ISO 8601 in the site time zone.
     *
     * @since 1.0.0
     *
     * @param mixed $value Stored UTC date-time.
     *
     * @return string|null Null when there is no time.
     */
    protected function iso_datetime($value)
    {
        if (empty($value)) {
            return null;
        }

        return (new DateTimeImmutable((string) $value, new DateTimeZone('UTC')))
            ->setTimezone(wp_timezone())
            ->format(DATE_ATOM);
    }
}
