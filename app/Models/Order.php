<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderListStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class Order extends Model
{
    use HasDateRangeFilter;

    protected $table = 'kirki_ecommerce_orders';

    protected $fillable = [
        'uuid',
        'order_number',
        'customer_id',
        'order_status',
        'fulfillment_status',
        'is_manual',
        'is_refund_initiated',
        'currency_code',
        'base_currency_code',
        'exchange_rate',
        'invoiced_subtotal',
        'base_subtotal',
        'tax_id_number',
        'tax_id_type',
        'reverse_charge',
        'invoiced_shipping_total',
        'base_shipping_total',
        'coupon_code',
        'invoiced_discount_total',
        'base_discount_total',
        'discount_details',
        'invoiced_tax_total',
        'base_tax_total',
        'invoiced_total',
        'base_total',
        'items_count',
        'total_weight',
        'payment_status',
        'payment_provider',
        'payment_transaction_id',
        'invoiced_payment_provider_fee',
        'base_payment_provider_fee',
        'payment_metadata',
        'shipping_method',
        'shipping_metadata',
        'shipping_carrier',
        'shipping_tracking_number',
        'shipping_tracking_url',
        'shipping_first_name',
        'shipping_last_name',
        'shipping_address_line1',
        'shipping_address_line2',
        'shipping_city',
        'shipping_state',
        'shipping_country',
        'shipping_postal_code',
        'shipping_phone',
        'shipping_email',
        'shipping_company',
        'billing_first_name',
        'billing_last_name',
        'billing_address_line1',
        'billing_address_line2',
        'billing_city',
        'billing_state',
        'billing_country',
        'billing_postal_code',
        'billing_phone',
        'billing_email',
        'billing_company',
        'customer_first_name',
        'customer_last_name',
        'customer_email',
        'customer_phone',
        'ip_address',
        'user_agent',
        'customer_notes',
        'admin_notes',
        'flags',
        'cancellation_reason',
        'paid_at',
        'shipped_at',
        'fulfilled_at',
        'delivered_at',
        'cancelled_at',
        'archived_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'customer_id' => 'integer',
        'is_manual' => 'boolean',
        'is_refund_initiated' => 'boolean',
        'exchange_rate' => 'float',
        'items_count' => 'integer',
        'total_weight' => 'float',
        'reverse_charge' => 'boolean',
        'invoiced_payment_provider_fee' => 'integer',
        'base_payment_provider_fee' => 'integer',
        'discount_details' => 'json',
        'payment_metadata' => 'json',
        'shipping_metadata' => 'json',
        'invoiced_tax_total' => 'integer',
        'base_tax_total' => 'integer',
    ];

    /**
     * Store flags as a comma separated string.
     *
     * @param array|string|null $value Flags to persist.
     *
     * @return void
     */
    public function set_flags_attribute($value)
    {
        if (!is_array($value)) {
            $this->attributes['flags'] = empty($value) ? null : $value;
            return;
        }

        $flags = array_filter(array_map('trim', $value), 'strlen');

        $this->attributes['flags'] = empty($flags) ? null : implode(',', $flags);
    }

    /**
     * Expose flags as an array.
     *
     * @param string|null $value Stored comma separated flags.
     *
     * @return string[]
     */
    public function get_flags_attribute($value)
    {
        if (empty($value)) {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $value)), 'strlen'));
    }

    public function items()
    {
        return $this->has_many(OrderItem::class, 'order_id');
    }

    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id');
    }

    public function coupon_usage()
    {
        return $this->has_one(CouponUsage::class, 'order_id');
    }

    public function refunds()
    {
        return $this->has_many(Refund::class, 'order_id');
    }

    public function activities()
    {
        return $this->has_many(OrderActivity::class, 'order_id');
    }

    /**
     * Narrow the list to a merchant-facing order state.
     *
     * The states a merchant filters by cut across three columns. How far the
     * order has progressed is fulfillment_status; anything about money is
     * payment_status; and the refund states exist only as a composite
     * order_status, since order_status is the (fulfillment, payment) pair and
     * has no independent column of its own.
     *
     * @param QueryBuilder $query
     * @param string       $status
     *
     * @return QueryBuilder
     */
    public function scope_apply_status_filter(QueryBuilder $query, $status)
    {
        if (empty($status)) {
            return $query;
        }

        $fulfillment_states = [
            OrderListStatus::ORDER_PLACED => FulfillmentStatus::UNFULFILLED,
            OrderListStatus::ORDER_PROCESSING => FulfillmentStatus::PROCESSING,
            OrderListStatus::ORDER_ON_HOLD => FulfillmentStatus::ON_HOLD,
            OrderListStatus::ORDER_SHIPPED => FulfillmentStatus::SHIPPED,
            OrderListStatus::ORDER_DELIVERED => FulfillmentStatus::DELIVERED,
            OrderListStatus::ORDER_RETURNED => FulfillmentStatus::RETURNED,
            OrderListStatus::ORDER_CANCELLED => FulfillmentStatus::CANCELLED,
        ];

        if (isset($fulfillment_states[$status])) {
            return $query->where('fulfillment_status', $fulfillment_states[$status]);
        }

        $payment_states = [
            OrderListStatus::PAYMENT_FAILED => PaymentStatus::FAILED,
            OrderListStatus::REFUND_IN_PROGRESS => PaymentStatus::REFUNDING,
            OrderListStatus::REFUNDED => PaymentStatus::REFUNDED,
        ];

        if (isset($payment_states[$status])) {
            return $query->where('payment_status', $payment_states[$status]);
        }

        $lifecycle_states = [
            OrderListStatus::REFUND_REQUESTED => OrderStatus::REFUND_REQUESTED,
            OrderListStatus::REFUND_DECLINED => OrderStatus::REFUND_DECLINED,
        ];

        if (isset($lifecycle_states[$status])) {
            return $query->where('order_status', $lifecycle_states[$status]);
        }

        return $query;
    }
}
