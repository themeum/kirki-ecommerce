<?php

namespace Kirki\Ecommerce\App\Currency;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Exception;

class CurrencyExchangeFactory
{
    protected array $providers = [];

    /**
     * Create a new currency exchange factory instance.
     *
     * @param array $providers
     */
    public function __construct(array $providers = [])
    {
        foreach ($providers as $provider) {
            $this->register($provider);
        }
    }

    /**
     * Register a currency provider.
     *
     * @param CurrencyProvider $provider
     */
    public function register(CurrencyProvider $provider)
    {
        $this->providers[$provider->get_id()] = $provider;
    }

    /**
     * Make a currency provider.
     *
     * @param string $provider_id
     * @param array $config
     * @return CurrencyProvider
     */
    public function make(string $provider_id, array $config = [])
    {
        if (isset($this->providers[$provider_id])) {
            $provider = $this->providers[$provider_id];
            $provider->set_config($config);

            return $provider;
        }

        throw new Exception(
            sprintf(
                /* translators: %s: Currency provider ID */
                __('Currency provider with ID %s not found.', 'kirki-ecommerce'),
                $provider_id
            )
        );
    }

    /**
     * Get the available currency providers.
     *
     * @return array
     */
    public function get_available_providers()
    {
        return array_values($this->providers);
    }
}
