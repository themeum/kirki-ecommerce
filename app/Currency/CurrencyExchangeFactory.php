<?php

namespace Kirki\Ecommerce\App\Currency;

use Kirki\Ecommerce\App\Currency\Contracts\CurrencyProvider;
use Exception;

use function Kirki\Ecommerce\Framework\throw_anyway;

/**
 * Registry that builds currency exchange providers by ID.
 *
 * @since 1.0.0
 */
class CurrencyExchangeFactory
{
    /**
     * @var array<string, CurrencyProvider>
     */
    protected array $providers = [];

    /**
     * Create a new currency exchange factory instance.
     *
     * @since 1.0.0
     *
     * @param CurrencyProvider[] $providers Providers to register up front.
     */
    public function __construct(array $providers = [])
    {
        foreach ($providers as $provider) {
            $this->register($provider);
        }
    }

    /**
     * Register a currency provider under its own ID.
     *
     * @since 1.0.0
     *
     * @param CurrencyProvider $provider
     * @return void
     */
    public function register(CurrencyProvider $provider)
    {
        $this->providers[$provider->get_id()] = $provider;
    }

    /**
     * Get a registered provider configured with the given settings.
     *
     * Throws through `throw_anyway()` when no provider is registered under the ID.
     *
     * @since 1.0.0
     *
     * @param string               $provider_id Registered provider ID.
     * @param array<string, mixed> $config      Provider settings, such as the API key.
     * @return CurrencyProvider
     * @throws Exception When no provider is registered under the given ID.
     */
    public function make(string $provider_id, array $config = [])
    {
        if (isset($this->providers[$provider_id])) {
            $provider = $this->providers[$provider_id];
            $provider->set_config($config);

            return $provider;
        }

        throw_anyway(
            sprintf(
                /* translators: %s: Currency provider ID */
                __('Currency provider with ID %s not found.', 'kirki-ecommerce'),
                $provider_id
            ),
            Exception::class
        );
    }

    /**
     * Get all registered currency providers.
     *
     * @since 1.0.0
     *
     * @return CurrencyProvider[]
     */
    public function get_available_providers()
    {
        return array_values($this->providers);
    }
}
