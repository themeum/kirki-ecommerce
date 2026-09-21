<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\OfflinePayment\CreateOfflinePaymentDTO;
use Kirki\Ecommerce\App\DTO\OfflinePayment\UpdateOfflinePaymentDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages the store's offline payment methods kept in the payment settings.
 *
 * @since 1.0.0
 */
class OfflinePaymentService
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
     * Get all offline payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of PaymentProvider.
     */
    public function get()
    {
        return collection($this->settings->get('offline_payments') ?? [])
            ->map(fn($offline_payment) => PaymentProvider::from_offline($offline_payment))
            ->values();
    }

    /**
     * Find an offline payment provider by ID.
     *
     * @since 1.0.0
     *
     * @param string $id Offline payment method ID.
     * @return PaymentProvider|null Null when no method has that ID.
     */
    public function find(string $id)
    {
        $offline_payments = $this->settings->get('offline_payments');

        foreach ($offline_payments as $offline_payment) {
            if ($offline_payment['id'] === $id) {
                return PaymentProvider::from_offline($offline_payment);
            }
        }

        return null;
    }

    /**
     * Find an offline payment provider by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param string $id Offline payment method ID.
     * @return PaymentProvider
     * @throws NotFoundException When no method has that ID.
     */
    public function find_or_fail(string $id)
    {
        $provider = $this->find($id);

        throw_if(!$provider, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $provider;
    }

    /**
     * Create a new offline payment provider.
     *
     * Generates a UUID as the ID when the DTO has none.
     *
     * @since 1.0.0
     *
     * @param CreateOfflinePaymentDTO $data Offline payment method data.
     * @return PaymentProvider
     */
    public function create(CreateOfflinePaymentDTO $data)
    {
        $offline_payments = $this->settings->get('offline_payments');

        $data->id = empty($data->id) ? Str::uuid() : $data->id;

        $offline_payments[] = $data->to_array();

        $this->settings->set([
            'offline_payments' => $offline_payments,
        ]);

        return PaymentProvider::from_offline($data->to_array());
    }

    /**
     * Update an offline payment provider.
     *
     * @since 1.0.0
     *
     * @param UpdateOfflinePaymentDTO $data Offline payment method data, including the ID of the method to replace.
     * @return PaymentProvider
     */
    public function update(UpdateOfflinePaymentDTO $data)
    {
        $offline_payments = $this->settings->get('offline_payments');

        foreach ($offline_payments as $key => $offline_payment) {
            if ($offline_payment['id'] === $data->id) {
                $offline_payments[$key] = $data->to_array();
                break;
            }
        }

        $this->settings->set([
            'offline_payments' => $offline_payments,
        ]);

        return PaymentProvider::from_offline($data->to_array());
    }

    /**
     * Delete an offline payment provider by ID.
     *
     * @since 1.0.0
     *
     * @param string $id ID of the offline payment method to delete.
     * @return bool True when it was deleted.
     * @throws NotFoundException When no method has that ID.
     */
    public function delete(string $id)
    {
        $offline_payments = $this->settings->get('offline_payments');

        foreach ($offline_payments as $key => $offline_payment) {
            if ($offline_payment['id'] === $id) {
                unset($offline_payments[$key]);
                $this->settings->set([
                    'offline_payments' => $offline_payments,
                ]);
                return true;
            }
        }

        throw_anyway(__('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
    }
}
