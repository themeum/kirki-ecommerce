<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;
use Throwable;

class CreateCustomerAction
{
    protected $customer_service;
    protected $address_service;

    public function __construct(
        CustomerService $customer_service,
        AddressService $address_service
    ) {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Create a new customer with the given address.
     *
     * The customer and address will be created in a single transaction.
     * If either the customer or address cannot be created, a Throwable will be thrown.
     *
     * @param CreateCustomerDTO $customer_payload
     * @param CreateAddressDTO $billing_address_payload
     * @param CreateAddressDTO $shipping_address_payload
     * @return Customer
     * @throws Throwable
     */
    public function execute(CreateCustomerDTO $customer_payload, CreateAddressDTO $shipping_address_payload, CreateAddressDTO $billing_address_payload)
    {
        DB::begin_transaction();

        try {
            $customer_payload->user_id = $this->create_user($customer_payload);

            $customer = $this->customer_service->create($customer_payload);

            if (empty($customer)) {
                throw new Exception(__('Customer could not be created.', 'kirki-ecommerce'));
            }

            // Set both flags explicitly on each payload (not just the one being
            // claimed) so this is safe even if the caller passed the same
            // CreateAddressDTO instance for both parameters.
            $shipping_address_payload->customer_id = $customer->id;
            $shipping_address_payload->type = AddressType::HOME;
            $shipping_address_payload->is_default_shipping = true;
            $shipping_address_payload->is_default_billing = false;

            $this->create_address($shipping_address_payload);

            $billing_address_payload->customer_id = $customer->id;
            $billing_address_payload->type = AddressType::HOME;
            $billing_address_payload->is_default_shipping = false;
            $billing_address_payload->is_default_billing = true;

            $this->create_address($billing_address_payload);

            $customer = $this->customer_service->find($customer->id);

            DB::commit();

            return $customer;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    protected function create_user(CreateCustomerDTO $customer)
    {
        if (!empty($customer->user_id)) {
            if (empty(get_userdata($customer->user_id))) {
                throw new Exception(__('User could not be found.', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
            }

            return $customer->user_id;
        }

        $new_user = [
            'user_login'    => $customer->email,
            'user_pass'     => wp_generate_password(12, true),
            'user_email'    => $customer->email,
            'first_name'    => $customer->first_name,
            'last_name'     => $customer->last_name,
            'role'          => 'subscriber',
        ];

        $user_id = wp_insert_user($new_user);

        if (is_wp_error($user_id)) {
            throw new Exception($user_id->get_error_message()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $user_id;
    }

    protected function create_address(CreateAddressDTO $address_payload)
    {
        $is_created_billing_address = $this->address_service->create($address_payload);

        if (!$is_created_billing_address) {
            throw new Exception(__('Customer address could not be created.', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }
}
