<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Exception;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages online payment providers: discovery, installation, settings and enabling.
 *
 * @since 1.0.0
 */
class OnlinePaymentService
{
    /** @var \Kirki\Ecommerce\App\AppSettings */
    protected $settings;

    /**
     * Create the service and load the payment settings.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Get all installable online payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of PaymentProvider.
     */
    public function all_installable_providers() // @todo: replace this with real providers later
    {
        // @todo: replace this with real providers list from cloud later
        $providers = [
            Payment::get_provider('paypal'),
        ];

        return collection($providers);
    }

    /**
     * Install an online payment provider.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider|null
     * @throws Exception When the provider is already installed.
     * @throws NotFoundException When the provider package could not be installed.
     */
    public function install(string $id)
    {
        throw_if((bool) Payment::get_provider($id), __('Payment method already installed.', 'kirki-ecommerce'), Exception::class, Response::NOT_FOUND);

        throw_anyway(__('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND); // @todo: remove this once we have real providers to install

        Payment::init_registry();

        return $this->find($id);
    }

    /**
     * Get all online payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection<PaymentProvider>
     */
    public function get()
    {
        return collection(Payment::get_online_providers());
    }

    /**
     * Find an online payment provider by ID.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider|null Null when the provider does not exist or is an offline one.
     */
    public function find(string $id)
    {
        $provider = Payment::get_provider($id);

        if (!$provider || $provider->is_offline()) {
            return null;
        }

        return $provider;
    }

    /**
     * Find an online payment provider by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider
     * @throws NotFoundException When no online provider has that ID.
     */
    public function find_or_fail(string $id)
    {
        $provider = $this->find($id);

        throw_if(!$provider, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $provider;
    }

    /**
     * Update an online payment provider's settings.
     *
     * @since 1.0.0
     *
     * @param string               $id   Payment provider ID.
     * @param array<string, mixed> $data Settings to save.
     * @return PaymentProvider
     * @throws NotFoundException When no online provider has that ID.
     */
    public function update(string $id, array $data)
    {
        $provider = $this->find_or_fail($id);

        $provider->save_settings($data);

        return $provider;
    }

    /**
     * Enable or disable an online payment provider.
     *
     * @since 1.0.0
     *
     * @param string $id         Payment provider ID.
     * @param bool   $is_enabled Whether the provider should be enabled.
     * @return bool Always true.
     * @throws NotFoundException When no online provider has that ID.
     */
    public function set_enabled(string $id, bool $is_enabled)
    {
        $provider = $this->find_or_fail($id);

        $provider->set_is_enabled($is_enabled);

        return true;
    }
}
