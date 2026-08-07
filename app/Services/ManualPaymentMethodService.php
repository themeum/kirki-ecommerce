<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\PaymentMethod\CreatePaymentMethodDTO;
use Kirki\Ecommerce\App\DTO\PaymentMethod\UpdatePaymentMethodDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\collection;

class ManualPaymentMethodService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Return all payment methods
     *
     * @return Collection
     */
    public function get()
    {
        $methods = $this->settings->get('payment_gateways') ?? [];

        return collection($this->settings->get('payment_gateways') ?? [])
            ->map(fn($payment_gateway) => PaymentGateway::from_manual($payment_gateway))
            ->values();
    }

    /**
     * Find a payment method by ID.
     *
     * @param string $id
     * @return PaymentGateway|null
     */
    public function find(string $id)
    {
        $payment_gateways = $this->settings->get('payment_gateways');

        foreach ($payment_gateways as $payment_gateway) {
            if ($payment_gateway['id'] === $id) {
                return PaymentGateway::from_manual($payment_gateway);
            }
        }

        return null;
    }

    /**
     * Find a payment method by ID or throw an exception.
     *
     * @param string $id
     * @return PaymentGateway
     * @throws NotFoundException
     */
    public function find_or_fail(string $id)
    {
        $payment_gateway = $this->find($id);

        if (!$payment_gateway) {
            throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $payment_gateway;
    }

    /**
     * Create a new payment method.
     *
     * @param CreatePaymentMethodDTO $data
     * @return PaymentGateway
     */
    public function create(CreatePaymentMethodDTO $data)
    {
        $payment_gateways = $this->settings->get('payment_gateways');

        $data->id = empty($data->id) ? Str::uuid() : $data->id;

        $payment_gateways[] = $data->to_array();

        $this->settings->set([
            'payment_gateways' => $payment_gateways,
        ]);

        return PaymentGateway::from_manual($data->to_array());
    }

    /**
     * Updates a payment method.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdatePaymentMethodDTO $data
     * @throws NotFoundException
     * @return PaymentGateway
     */
    public function update(UpdatePaymentMethodDTO $data)
    {
        $payment_gateways = $this->settings->get('payment_gateways');

        foreach ($payment_gateways as $key => $payment_gateway) {
            if ($payment_gateway['id'] === $data->id) {
                $payment_gateways[$key] = $data->to_array();
                break;
            }
        }

        $this->settings->set([
            'payment_gateways' => $payment_gateways,
        ]);

        return PaymentGateway::from_manual($data->to_array());
    }

    /**
     * Deletes a brand by ID.
     *
     * @param string $id The ID of the brand to delete.
     * @return bool True if the brand was deleted successfully, false otherwise.
     * @throws NotFoundException If the brand could not be found or deleted.
     */
    public function delete(string $id)
    {
        $payment_gateways = $this->settings->get('payment_gateways');

        foreach ($payment_gateways as $key => $payment_gateway) {
            if ($payment_gateway['id'] === $id) {
                unset($payment_gateways[$key]);
                $this->settings->set([
                    'payment_gateways' => $payment_gateways,
                ]);
                return true;
            }
        }

        throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
    }
}
