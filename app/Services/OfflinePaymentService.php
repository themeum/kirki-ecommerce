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
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

use function Kirki\Ecommerce\Framework\collection;

class OfflinePaymentService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Return all offline payment providers
     *
     * @return Collection
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
     * @param string $id
     * @return PaymentProvider|null
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
     * @param string $id
     * @return PaymentProvider
     * @throws NotFoundException
     */
    public function find_or_fail(string $id)
    {
        $provider = $this->find($id);

        if (!$provider) {
            ExceptionThrower::throw(new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        return $provider;
    }

    /**
     * Create a new offline payment provider.
     *
     * @param CreateOfflinePaymentDTO $data
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
     * Updates an offline payment provider.
     *
     * @param UpdateOfflinePaymentDTO $data
     * @throws NotFoundException
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
     * Deletes an offline payment provider by ID.
     *
     * @param string $id The ID of the offline payment provider to delete.
     * @return bool True if it was deleted successfully, false otherwise.
     * @throws NotFoundException If it could not be found or deleted.
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

        ExceptionThrower::throw(new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND));
    }
}
