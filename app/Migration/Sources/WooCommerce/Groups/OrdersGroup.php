<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderTaxDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\GuestCustomerResolver;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\OrderMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\StorageProbe;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\HposOrderReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\LegacyPostsOrderReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\OrderReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\OrderNumberGenerator;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce orders with their items, taxes, coupons, notes and refunds.
 *
 * Orders are read from the order tables or from posts, whichever WooCommerce uses. They are saved
 * with the original dates, number and amounts, and are not calculated again. The order service
 * calls that send mail, change stock or count coupon use are not used.
 *
 * @since 1.0.0
 */
class OrdersGroup extends WooCommerceGroup
{
    /** @var StorageProbe */
    protected $storage;

    /** @var GuestCustomerResolver */
    protected $guests;

    /**
     * Create the group with read access to the WooCommerce tables and the storage probe.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database The WooCommerce database reader.
     * @param StorageProbe        $storage  Tells where orders are stored.
     */
    public function __construct(WooCommerceDatabase $database, StorageProbe $storage)
    {
        parent::__construct($database);

        $this->storage = $storage;
        $this->guests = new GuestCustomerResolver();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'orders';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Orders', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Past orders with their items, taxes, notes and refunds.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function depends_on()
    {
        return ['settings', 'products', 'customers', 'coupons'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function chunk_size()
    {
        return 30;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_orders($this->storage->uses_order_tables());
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'order';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->reader()->orders($cursor, $limit);
    }

    /**
     * Get the reader for the storage that WooCommerce uses.
     *
     * @since 1.0.0
     *
     * @return OrderReader
     */
    protected function reader()
    {
        return $this->storage->uses_order_tables() ? new HposOrderReader() : new LegacyPostsOrderReader();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return (new OrderMapper(Money::get_base_currency()))->map($row, $ledger);
    }

    /**
     * Create the order and everything that belongs to it.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        foreach ($mapped['notes_for_report'] as $note) {
            $this->note($note);
        }

        $fields = $mapped['order'];
        $dates = array_intersect_key($fields, array_flip(['created_at', 'updated_at']));
        unset($fields['created_at'], $fields['updated_at']);

        $customer_id = $this->customer_id($mapped['customer'], (int) $row['id'], $ledger);
        $order = Order::create(array_merge($fields, [
            'uuid' => wp_generate_uuid4(),
            'order_number' => OrderNumberGenerator::generate_order_number((int) $row['id']),
            'customer_id' => $customer_id,
            'is_manual' => false,
            'is_refund_initiated' => !empty($mapped['refunds']),
        ]));

        $this->restore_dates((int) $order->id, $dates);
        $this->create_items((int) $order->id, $mapped['items']);
        $this->create_taxes((int) $order->id, $mapped['taxes']);
        $this->create_coupons((int) $order->id, $mapped['coupons'], $customer_id);
        $this->create_notes((int) $order->id, $mapped['notes']);
        $this->create_refunds((int) $order->id, $mapped['refunds']);

        return (int) $order->id;
    }

    /**
     * Find the Kirki customer of the order: the migrated customer, then the customer of the same WordPress user, then a guest by email.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $contact   The customer user id and billing contact of the order.
     * @param int                  $source_id The source id of the order, used to record a created guest.
     * @param RecordLedger                $ledger  The links between source and Kirki records.
     * @return int|null
     */
    protected function customer_id(array $contact, int $source_id, RecordLedger $ledger)
    {
        if ($contact['user_id'] > 0) {
            $migrated = $ledger->resolve('customer', $contact['user_id']);

            if ($migrated !== null) {
                return $migrated;
            }

            $linked = Customer::query()->where('user_id', $contact['user_id'])->first();

            if ($linked) {
                return (int) $linked->id;
            }
        }

        $guest_id = $this->guests->resolve((string) $contact['email'], (string) $contact['first_name'], (string) $contact['last_name'], (string) $contact['phone']);

        if ($guest_id !== null && $this->guests->was_created()) {
            $ledger->link('guest_customer', $source_id, $guest_id, $this->run_id);
        }

        return $guest_id;
    }

    /**
     * Put the original creation and update dates on the order.
     *
     * The model sets both dates to now on insert, so they are set by a direct update.
     *
     * @since 1.0.0
     *
     * @param int                   $order_id The Kirki order id.
     * @param array<string, string|null> $dates    The dates to set.
     * @return void
     */
    protected function restore_dates(int $order_id, array $dates)
    {
        $dates = array_filter($dates);

        if (!empty($dates)) {
            Order::query()->where('id', $order_id)->update($dates);
        }
    }

    /**
     * Create the order items.
     *
     * @since 1.0.0
     *
     * @param int                              $order_id The Kirki order id.
     * @param array<int, array<string, mixed>> $items    The mapped items.
     * @return void
     */
    protected function create_items(int $order_id, array $items)
    {
        $service = app(OrderService::class);

        foreach ($items as $item) {
            $service->create_order_item(new CreateOrderItemDTO(array_merge($item, ['order_id' => $order_id])));
        }
    }

    /**
     * Create the order tax rows.
     *
     * @since 1.0.0
     *
     * @param int                              $order_id The Kirki order id.
     * @param array<int, array<string, mixed>> $taxes    The mapped taxes.
     * @return void
     */
    protected function create_taxes(int $order_id, array $taxes)
    {
        $service = app(OrderService::class);

        foreach ($taxes as $tax) {
            $service->create_order_tax(new CreateOrderTaxDTO(array_merge($tax, ['order_id' => $order_id])));
        }
    }

    /**
     * Create the order coupon rows.
     *
     * @since 1.0.0
     *
     * @param int                              $order_id    The Kirki order id.
     * @param array<int, array<string, mixed>> $coupons     The mapped coupons.
     * @param int|null                         $customer_id The Kirki customer id.
     * @return void
     */
    protected function create_coupons(int $order_id, array $coupons, $customer_id)
    {
        $service = app(OrderService::class);

        foreach ($coupons as $coupon) {
            $service->create_order_coupon(new CreateOrderCouponDTO(array_merge($coupon, [
                'order_id' => $order_id,
                'customer_id' => $customer_id,
                'discount_type' => DiscountType::AMOUNT_OFF,
                'discount_target' => DiscountTarget::ORDER,
            ])));
        }
    }

    /**
     * Create the order notes as activities, with their original dates.
     *
     * @since 1.0.0
     *
     * @param int                              $order_id The Kirki order id.
     * @param array<int, array<string, mixed>> $notes    The mapped notes.
     * @return void
     */
    protected function create_notes(int $order_id, array $notes)
    {
        $service = app(OrderActivityService::class);

        foreach ($notes as $note) {
            $activity = $service->create($order_id, OrderActivityType::COMMENT_ADDED, $note['description'], $note['metadata'], null);

            if (!empty($note['created_at'])) {
                OrderActivity::query()->where('id', $activity->id)->update(['created_at' => $note['created_at']]);
            }
        }
    }

    /**
     * Create the refunds, as completed, with their original dates.
     *
     * @since 1.0.0
     *
     * @param int                              $order_id The Kirki order id.
     * @param array<int, array<string, mixed>> $refunds  The mapped refunds.
     * @return void
     */
    protected function create_refunds(int $order_id, array $refunds)
    {
        foreach ($refunds as $refund) {
            $created = Refund::create([
                'order_id' => $order_id,
                'status' => 'completed',
                'invoiced_amount' => $refund['invoiced_amount'],
                'reason' => $refund['reason'],
                'refund_type' => $refund['refund_type'],
            ]);

            if (!empty($refund['created_at'])) {
                Refund::query()->where('id', $created->id)->update(['created_at' => $refund['created_at']]);
            }
        }
    }
}
