<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\CustomerMapper;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Models\Order;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce registered customers with their addresses.
 *
 * Each customer is linked to the WordPress user that already exists. No password is read.
 * A Kirki customer that already has the same user or the same email is reused.
 *
 * @since 1.0.0
 */
class CustomersGroup extends WooCommerceGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'customers';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Customers', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Registered customers with their billing and shipping addresses.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_customers();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'customer';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->database->customers($cursor, $limit, CustomerMapper::META_KEYS);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function find_existing(array $row, RecordLedger $ledger)
    {
        $existing = Customer::query()->where('user_id', (int) $row['id'])->first()
            ?: Customer::query()->where('email', $row['email'])->first();

        return $existing ? (int) $existing->id : null;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return (new CustomerMapper())->map($row);
    }

    /**
     * Create the customer and its addresses.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $fields = $mapped['customer'];

        $customer = app(CustomerService::class)->create(new CreateCustomerDTO([
            'user_id' => $fields['user_id'],
            'first_name' => $fields['first_name'],
            'last_name' => $fields['last_name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'],
            'tags' => null,
        ]));

        $addresses = app(AddressService::class);

        foreach ($mapped['addresses'] as $address) {
            $addresses->create_without_transaction(new CreateAddressDTO(array_merge($address, ['customer_id' => $customer->id])));
        }

        if ($fields['created_at'] !== null) {
            Customer::query()->where('id', $customer->id)->update(['created_at' => $fields['created_at']]);
        }

        return (int) $customer->id;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        return $this->remove_record(Customer::class, $kirki_ecommerce_id, Order::query()->where('customer_id', $kirki_ecommerce_id)->exists());
    }
}
