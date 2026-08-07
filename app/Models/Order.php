<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Supports\Arr;

class Order extends Model
{
    protected $table = 'kirki_ecommerce_orders';

    protected $fillable = [
        'uuid',
        'order_number',
        'customer_id',
        'order_status',
        'is_manual',
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
        'tracking_number',
        'tracking_url',
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
        'is_billing_same_as_shipping',
        'customer_email',
        'customer_phone',
        'ip_address',
        'user_agent',
        'customer_notes',
        'admin_notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'customer_id' => 'integer',
        'is_manual' => 'boolean',
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
        'is_billing_same_as_shipping' => 'boolean'
    ];

    public function set_discount_details_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
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
}
